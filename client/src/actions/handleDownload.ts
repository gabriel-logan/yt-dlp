import apiInstance from "../lib/apiInstance";
import type {
  DownloadRequestPayload,
  VideoInfoResponse,
  VideoInfoResponseFormat,
} from "../types";

export interface DownloadProgress {
  progress: number;
  fileName: string;
  isDownloading: boolean;
}

// Time in ms to keep the progress bar visible after download completes
const PROGRESS_HIDE_DELAY_MS = 1500;

// Progress estimation rate: percentage points per MB when total size is unknown
// This provides a smooth progress animation for streaming downloads
const PROGRESS_ESTIMATION_RATE_PER_MB = 2;

// Maximum estimated progress when total size is unknown (reserve 5% for completion)
const MAX_ESTIMATED_PROGRESS = 95;

// Fake progress fallback when we truly have no usable progress info
const FAKE_PROGRESS_DURATION_MS = 40_000;
const FAKE_PROGRESS_TICK_MS = 250;

interface HandleDownloadParams {
  body: {
    type: VideoInfoResponse["_type"];
    quality: VideoInfoResponse["quality"];
    format: VideoInfoResponseFormat;
    formatNote: VideoInfoResponseFormat["format_note"];
  };
  videoUrl: string;
  videoData: {
    title: VideoInfoResponse["title"];
  };
  setDownloadIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  onProgress: React.Dispatch<React.SetStateAction<DownloadProgress>>;
}

export default async function handleDownload({
  body,
  videoUrl,
  videoData,
  setDownloadIsLoading,
  onProgress,
}: HandleDownloadParams) {
  if (!videoUrl) {
    alert("Please enter a video URL.");
    return;
  }

  setDownloadIsLoading(true);

  const { type, quality, formatNote, format } = body;

  const extension =
    type === "video" ? format.video_ext || "mp4" : format.audio_ext || "mp3";
  const fileName = `${videoData?.title || type}_${quality}.${extension}`;

  onProgress({
    progress: 0,
    fileName,
    isDownloading: true,
  });

  const payload: DownloadRequestPayload = {
    url: videoUrl,
    type,
    quality,
    format_note: formatNote,
  };

  // ---- progress helpers (monotonic + fake fallback) ----
  let lastProgress = 0;
  let fakeTimer: number | null = null;
  let fakeStartTs = 0;

  const emitProgress = (next: number) => {
    const clamped = Math.max(0, Math.min(100, next));
    const monotonic = Math.max(lastProgress, clamped);
    lastProgress = monotonic;

    onProgress({
      progress: monotonic,
      fileName,
      isDownloading: true,
    });
  };

  const stopFakeProgress = () => {
    if (fakeTimer !== null) {
      globalThis.clearInterval(fakeTimer);
      fakeTimer = null;
    }
  };

  const startFakeProgressIfNeeded = () => {
    if (fakeTimer !== null) return;
    fakeStartTs = performance.now();

    fakeTimer = globalThis.setInterval(() => {
      const elapsed = performance.now() - fakeStartTs;
      const ratio = Math.min(1, elapsed / FAKE_PROGRESS_DURATION_MS);
      const fake = Math.round(ratio * MAX_ESTIMATED_PROGRESS);
      emitProgress(fake);
      if (ratio >= 1) stopFakeProgress();
    }, FAKE_PROGRESS_TICK_MS);
  };

  let succeeded = false;

  try {
    const response = await apiInstance.post<Blob>(
      "/api/video/download",
      payload,
      {
        responseType: "blob",
        onDownloadProgress: (progressEvent) => {
          console.log("Download progress event:", progressEvent);

          // Axios v1 can provide: loaded, total, progress (0..1), bytes
          const anyEvent = progressEvent;

          const totalRaw =
            (typeof anyEvent?.total === "number" && anyEvent.total > 0
              ? anyEvent.total
              : undefined) ??
            (typeof anyEvent?.event?.total === "number" &&
            anyEvent.event.total > 0
              ? anyEvent.event.total
              : undefined);

          const loadedRaw =
            (typeof anyEvent?.bytes === "number" && anyEvent.bytes > 0
              ? anyEvent.bytes
              : undefined) ??
            (typeof anyEvent?.loaded === "number" && anyEvent.loaded > 0
              ? anyEvent.loaded
              : undefined) ??
            (typeof anyEvent?.event?.loaded === "number" &&
            anyEvent.event.loaded > 0
              ? anyEvent.event.loaded
              : undefined);

          const progressRatio =
            typeof anyEvent?.progress === "number" &&
            Number.isFinite(anyEvent.progress)
              ? anyEvent.progress
              : undefined;

          // Case 1: We have total -> true percentage
          if (typeof totalRaw === "number" && typeof loadedRaw === "number") {
            stopFakeProgress();
            const percentCompleted = Math.round((loadedRaw * 100) / totalRaw);
            emitProgress(percentCompleted);
            return;
          }

          // Case 2: We have progress ratio (0..1) even without total
          if (typeof progressRatio === "number" && progressRatio >= 0) {
            stopFakeProgress();
            const percentCompleted = Math.round(progressRatio * 100);
            emitProgress(percentCompleted);
            return;
          }

          // Case 3: We only have loaded/bytes (your console log case) -> estimate
          if (typeof loadedRaw === "number") {
            stopFakeProgress();
            const loadedMB = loadedRaw / (1024 * 1024);
            const estimatedProgress = Math.min(
              MAX_ESTIMATED_PROGRESS,
              Math.round(loadedMB * PROGRESS_ESTIMATION_RATE_PER_MB),
            );
            emitProgress(estimatedProgress);
            return;
          }

          // Case 4: Everything useful is undefined -> fake fallback (40s)
          startFakeProgressIfNeeded();
        },
      },
    );

    stopFakeProgress();
    emitProgress(100);
    succeeded = true;

    const url = globalThis.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");

    link.href = url;
    link.setAttribute("download", fileName);

    document.body.appendChild(link);

    link.click();
    link.remove();

    // Keep progress visible briefly after completion
    setTimeout(() => {
      onProgress({
        progress: 0,
        fileName: "",
        isDownloading: false,
      });
    }, PROGRESS_HIDE_DELAY_MS);
  } catch (error) {
    stopFakeProgress();
    console.error("Download error:", error);
    alert("Failed to download.");

    onProgress({
      progress: 0,
      fileName: "",
      isDownloading: false,
    });
  } finally {
    // Don't wipe progress immediately on success, otherwise PROGRESS_HIDE_DELAY_MS never shows.
    if (!succeeded) {
      onProgress({
        progress: 0,
        fileName: "",
        isDownloading: false,
      });
    }
    setDownloadIsLoading(false);
  }
}
