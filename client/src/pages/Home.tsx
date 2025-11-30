import { useState } from "react";

import apiInstance from "../lib/apiInstance";
import type {
  DownloadRequestPayload,
  VideoInfoResponse,
  VideoInfoResponseFormat,
} from "../types";

export default function HomePage() {
  const [videoUrl, setVideoUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [downloadIsLoading, setDownloadIsLoading] = useState(false);
  const [videoData, setVideoData] = useState<null | {
    title: VideoInfoResponse["title"];
    thumbnail: VideoInfoResponse["thumbnail"];
    videoFormats: VideoInfoResponseFormat[];
    audioFormats: VideoInfoResponseFormat[];
  }>(null);

  const anyLoading = isLoading || downloadIsLoading;

  async function handleFetchVideo() {
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

  async function handleDownload(
    type: VideoInfoResponse["_type"],
    quality: VideoInfoResponse["quality"],
    format: VideoInfoResponseFormat,
    formatNote: VideoInfoResponseFormat["format_note"],
  ) {
    if (!videoUrl) {
      alert("Please enter a video URL.");
      return;
    }

    setDownloadIsLoading(true);

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
        type === "video"
          ? format.video_ext || "mp4"
          : format.audio_ext || "mp3";
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

  return (
    <div className="flex min-h-screen flex-col items-center bg-gray-50 p-6">
      <h1 className="mb-6 text-3xl font-bold text-gray-800">
        Video/Audio Downloader
      </h1>

      <div className="mb-6 flex w-full max-w-2xl flex-col gap-4 sm:flex-row">
        <input
          type="text"
          placeholder="Enter video URL"
          className={`grow rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none ${anyLoading && "cursor-not-allowed bg-gray-100"}`}
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          disabled={anyLoading}
        />
        <button
          className={`flex items-center justify-center rounded-lg bg-blue-500 px-6 py-3 text-white transition hover:bg-blue-600 ${anyLoading && "cursor-not-allowed opacity-50"}`}
          onClick={handleFetchVideo}
          disabled={anyLoading}
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <svg
                className="h-5 w-5 animate-spin text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8H4z"
                ></path>
              </svg>
              Fetching...
            </span>
          ) : (
            "Fetch Info"
          )}
        </button>
      </div>

      {videoData && (
        <div className="w-full max-w-3xl space-y-6">
          <div className="mb-4 flex items-center gap-4">
            {videoData.thumbnail && (
              <img
                src={videoData.thumbnail}
                alt="Video Thumbnail"
                className="h-20 w-32 rounded-lg object-cover shadow"
              />
            )}
            <h2 className="text-xl font-semibold text-gray-700">
              {videoData.title}
            </h2>
          </div>

          {videoData.videoFormats.length > 0 && (
            <div>
              <h3 className="mb-2 text-lg font-medium text-gray-600">
                Video Formats
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                {videoData.videoFormats.map((format) => (
                  <div
                    key={format.format_id}
                    className="flex flex-col justify-between rounded-lg bg-white p-4 shadow transition hover:shadow-lg"
                  >
                    <div className="mb-2 font-medium text-gray-800">
                      {format.format || "Unknown"} -{" "}
                      {format.video_ext || "No Audio"}{" "}
                    </div>
                    <button
                      className={`mt-2 flex items-center justify-center rounded-lg bg-green-500 py-2 text-white transition hover:bg-green-600 ${anyLoading && "cursor-not-allowed opacity-50"}`}
                      onClick={() =>
                        handleDownload(
                          "video",
                          format.quality || 7,
                          format,
                          format.format_note,
                        )
                      }
                      disabled={anyLoading}
                    >
                      {downloadIsLoading ? (
                        <svg
                          className="h-5 w-5 animate-spin text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8v8H4z"
                          ></path>
                        </svg>
                      ) : (
                        "Download"
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {videoData.audioFormats.length > 0 && (
            <div>
              <h3 className="mb-2 text-lg font-medium text-gray-600">
                Audio Formats
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                {videoData.audioFormats.map((format) => (
                  <div
                    key={format.format_id}
                    className="flex flex-col justify-between rounded-lg bg-white p-4 shadow transition hover:shadow-lg"
                  >
                    <div className="mb-2 font-medium text-gray-800">
                      {format.audio_ext || "No Audio"} -{" "}
                      {format.abr || "Unknown"} kbps -{" "}
                      {format.format_note || "Unknown"}
                    </div>
                    <button
                      className={`mt-2 flex items-center justify-center rounded-lg bg-purple-500 py-2 text-white transition hover:bg-purple-600 ${anyLoading && "cursor-not-allowed opacity-50"}`}
                      onClick={() =>
                        handleDownload(
                          "audio",
                          format.quality || 3,
                          format,
                          format.format_note,
                        )
                      }
                      disabled={anyLoading}
                    >
                      {downloadIsLoading ? (
                        <svg
                          className="h-5 w-5 animate-spin text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8v8H4z"
                          ></path>
                        </svg>
                      ) : (
                        "Download"
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
