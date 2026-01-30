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

// Maximum estimated progress when total size is unknown (reserve 5% for completion)
const MAX_ESTIMATED_PROGRESS = 95;

// Fake progress fallback when we truly have no usable progress info
const FAKE_PROGRESS_DURATION_MS = 25_000; // 25 seconds
const FAKE_PROGRESS_TICK_MS = 600;

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

  const startFakeProgress = () => {
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
    startFakeProgress();

    const response = await apiInstance.post<Blob>(
      "/api/video/download",
      payload,
      {
        responseType: "blob",
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
