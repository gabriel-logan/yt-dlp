import { useState } from "react";

import apiInstance from "../lib/apiInstance";
import type { VideoInfoResponse, VideoInfoResponseFormat } from "../types";

export default function HomePage() {
  const [videoUrl, setVideoUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [downloadIsLoading, setDownloadIsLoading] = useState(false);
  const [videoData, setVideoData] = useState<null | {
    title: VideoInfoResponse["title"];
    videoFormats: VideoInfoResponseFormat[];
    audioFormats: VideoInfoResponseFormat[];
  }>(null);

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

          if (isVideo) videoFormats.push(format);
          if (isAudioOnly) audioFormats.push(format);
        });
      }

      setVideoData({
        title: data.title,
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
    format: VideoInfoResponse["format"],
    quality: VideoInfoResponse["quality"],
  ) {
    if (!videoUrl) {
      alert("Please enter a video URL.");
      return;
    }

    setDownloadIsLoading(true);

    try {
      const response = await apiInstance.post<Blob>(
        "/api/video/download",
        { url: videoUrl, type, format, quality },
        { responseType: "blob" },
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");

      link.href = url;

      link.setAttribute("download", `${type}_${quality}.${format}`);

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
    <div className="flex min-h-screen flex-col items-center bg-linear-to-b from-indigo-50 to-white px-4 py-10">
      <h1 className="mb-6 text-center text-4xl font-bold text-indigo-700">
        Video Downloader
      </h1>

      <div className="w-full max-w-3xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row">
          <input
            type="text"
            placeholder="Enter video URL..."
            className="flex-1 rounded-lg border border-gray-300 p-3 focus:ring-2 focus:ring-indigo-400 focus:outline-none"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
          />
          <button
            className={`rounded-lg bg-indigo-600 px-6 py-3 text-white transition hover:bg-indigo-700 ${
              isLoading ? "cursor-not-allowed opacity-50" : ""
            }`}
            onClick={handleFetchVideo}
            disabled={isLoading}
          >
            {isLoading ? "Fetching..." : "Fetch Video"}
          </button>
        </div>

        {videoData && (
          <div className="rounded-xl bg-white p-6 shadow-lg">
            <h2 className="mb-4 text-2xl font-semibold">{videoData.title}</h2>

            <div className="mb-6">
              <h3 className="mb-2 text-lg font-medium">Video Formats</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                {videoData.videoFormats.map((format) => (
                  <div
                    key={format.format_id}
                    className="flex flex-col justify-between rounded-lg border p-4 transition hover:shadow-lg"
                  >
                    <div>
                      <p className="font-semibold">
                        {format.resolution || "Unknown"} | {format.format_note}
                      </p>
                      <p className="text-sm text-gray-500">Ext: {format.ext}</p>
                    </div>
                    <button
                      className="mt-2 rounded bg-green-500 px-3 py-1 text-sm text-white transition hover:bg-green-600"
                      onClick={() =>
                        handleDownload("video", format.ext, format.quality || 0)
                      }
                      disabled={downloadIsLoading}
                    >
                      {downloadIsLoading ? "Downloading..." : "Download"}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-lg font-medium">Audio Formats</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                {videoData.audioFormats.map((format) => (
                  <div
                    key={format.format_id}
                    className="flex flex-col justify-between rounded-lg border p-4 transition hover:shadow-lg"
                  >
                    <div>
                      <p className="font-semibold">{format.format_note}</p>
                      <p className="text-sm text-gray-500">Ext: {format.ext}</p>
                    </div>
                    <button
                      className="mt-2 rounded bg-purple-500 px-3 py-1 text-sm text-white transition hover:bg-purple-600"
                      onClick={() =>
                        handleDownload("audio", format.ext, format.quality || 0)
                      }
                      disabled={downloadIsLoading}
                    >
                      {downloadIsLoading ? "Downloading..." : "Download"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
