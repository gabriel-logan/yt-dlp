import apiInstance from "../lib/apiInstance";
import type { VideoInfoResponse, VideoInfoResponseFormat } from "../types";

interface HandleFetchVideoParams {
  videoUrl: string;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setVideoData: React.Dispatch<
    React.SetStateAction<{
      title: VideoInfoResponse["title"];
      thumbnail: VideoInfoResponse["thumbnail"];
      videoFormats: VideoInfoResponseFormat[];
      audioFormats: VideoInfoResponseFormat[];
    } | null>
  >;
}

export default async function handleFetchVideo({
  videoUrl,
  setIsLoading,
  setVideoData,
}: HandleFetchVideoParams) {
  if (!videoUrl) {
    alert("Please enter a video URL.");
    return;
  }

  setIsLoading(true);

  try {
    const response = await apiInstance.get<VideoInfoResponse>(
      "/api/video/info",
      { params: { url: videoUrl } },
    );

    const data = response.data;

    const videoFormats: VideoInfoResponseFormat[] = [];
    const audioFormats: VideoInfoResponseFormat[] = [];

    if (Array.isArray(data.formats)) {
      data.formats.forEach((format) => {
        const isVideo = format.vcodec !== "none" && format.acodec !== "none";
        const isAudioOnly =
          format.vcodec === "none" && format.acodec !== "none";

        if (isVideo) {
          videoFormats.push(format);
        }

        if (isAudioOnly) {
          audioFormats.push(format);
        }
      });
    }

    setVideoData({
      title: data.title,
      thumbnail: data.thumbnail,
      videoFormats,
      audioFormats,
    });
  } catch (error) {
    console.error("Error fetching video info:", error);
    alert("Failed to fetch video info.");
  } finally {
    setIsLoading(false);
  }
}
