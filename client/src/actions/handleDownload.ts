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

  try {
    const response = await apiInstance.post<Blob>(
      "/api/video/download",
      payload,
      {
        responseType: "blob",
        onDownloadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total,
            );
            onProgress({
              progress: percentCompleted,
              fileName,
              isDownloading: true,
            });
          } else {
            // If total is unknown, show indeterminate progress based on loaded bytes
            const loadedMB = progressEvent.loaded / (1024 * 1024);
            const estimatedProgress = Math.min(
              MAX_ESTIMATED_PROGRESS,
              Math.round(loadedMB * PROGRESS_ESTIMATION_RATE_PER_MB),
            );
            onProgress({
              progress: estimatedProgress,
              fileName,
              isDownloading: true,
            });
          }
        },
      },
    );

    onProgress({
      progress: 100,
      fileName,
      isDownloading: true,
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
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
    console.error("Download error:", error);
    alert("Failed to download.");
    onProgress({
      progress: 0,
      fileName: "",
      isDownloading: false,
    });
  } finally {
    setDownloadIsLoading(false);
  }
}
