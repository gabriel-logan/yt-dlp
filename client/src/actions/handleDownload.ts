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
  onProgress?: (progress: DownloadProgress) => void;
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

  onProgress?.({
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
            onProgress?.({
              progress: percentCompleted,
              fileName,
              isDownloading: true,
            });
          } else {
            // If total is unknown, show indeterminate progress based on loaded bytes
            const loadedMB = progressEvent.loaded / (1024 * 1024);
            // Estimate progress based on loaded data (cap at 95% until complete)
            const estimatedProgress = Math.min(95, Math.round(loadedMB * 2));
            onProgress?.({
              progress: estimatedProgress,
              fileName,
              isDownloading: true,
            });
          }
        },
      },
    );

    onProgress?.({
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
      onProgress?.({
        progress: 0,
        fileName: "",
        isDownloading: false,
      });
    }, 1500);
  } catch (error) {
    console.error("Download error:", error);
    alert("Failed to download.");
    onProgress?.({
      progress: 0,
      fileName: "",
      isDownloading: false,
    });
  } finally {
    setDownloadIsLoading(false);
  }
}
