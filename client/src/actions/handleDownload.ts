import apiInstance from "../lib/apiInstance";
import type {
  DownloadRequestPayload,
  VideoInfoResponse,
  VideoInfoResponseFormat,
} from "../types";

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
}

export default async function handleDownload({
  body,
  videoUrl,
  videoData,
  setDownloadIsLoading,
}: HandleDownloadParams) {
  if (!videoUrl) {
    alert("Please enter a video URL.");
    return;
  }

  setDownloadIsLoading(true);

  const { type, quality, formatNote, format } = body;

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
      { responseType: "blob" },
    );

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");

    link.href = url;
    const extension =
      type === "video" ? format.video_ext || "mp4" : format.audio_ext || "mp3";
    link.setAttribute(
      "download",
      `${videoData?.title || type}_${quality}.${extension}`,
    );

    document.body.appendChild(link);

    link.click();
    link.remove();
  } catch (error) {
    console.error("Download error:", error);
    alert("Failed to download.");
  } finally {
    setDownloadIsLoading(false);
  }
}
