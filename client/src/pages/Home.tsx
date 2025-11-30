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
        {
          params: { url: videoUrl },
        },
      );

      const data = response.data;

      const videoFormats: VideoInfoResponseFormat[] = [];
      const audioFormats: VideoInfoResponseFormat[] = [];

      if (Array.isArray(data.formats)) {
        data.formats.forEach(function (format) {
          const isVideo = format.vcodec !== "none" && format.acodec !== "none";
          const isAudioOnly =
            format.vcodec === "none" && format.acodec !== "none";

          if (isVideo) {
            videoFormats.push({
              format: "mp4",
              quality: format.quality,
              format_id: format.format_id,
              ext: format.ext,
              acodec: format.acodec,
              vcodec: format.vcodec,
              audio_ext: format.audio_ext,
              video_ext: format.video_ext,
              resolution: format.resolution,
              format_note: format.format_note,
            });
          }

          if (isAudioOnly) {
            audioFormats.push({
              format: "mp3",
              quality: format.quality,
              format_id: format.format_id,
              ext: format.ext,
              acodec: format.acodec,
              vcodec: format.vcodec,
              audio_ext: format.audio_ext,
              video_ext: format.video_ext,
              resolution: format.resolution,
              format_note: format.format_note,
            });
          }
        });
      }

      setVideoData({
        title: data.title,
        videoFormats: videoFormats,
        audioFormats: audioFormats,
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
        {
          url: videoUrl,
          type: type,
          format: format,
          quality: quality,
        },
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
    <div className="relative flex min-h-screen items-center justify-center bg-gray-100 p-4">
      {downloadIsLoading && (
        <div className="bg-opacity-50 absolute inset-0 z-50 flex items-center justify-center bg-black">
          <div className="text-xl font-semibold text-white">Downloading...</div>
        </div>
      )}

      <div className="z-10 w-full max-w-xl rounded-xl bg-white p-8 shadow-lg">
        <h1 className="mb-6 text-center text-3xl font-bold">
          Video Downloader
        </h1>

        <div className="mb-6 flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            placeholder="Paste video URL here"
            value={videoUrl}
            onChange={function (e) {
              setVideoUrl(e.target.value);
            }}
            className="flex-1 rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
          <button
            onClick={handleFetchVideo}
            className={`rounded-lg bg-blue-600 px-6 py-3 text-white transition hover:bg-blue-700 ${isLoading && "cursor-not-allowed opacity-60"}`}
            disabled={isLoading || downloadIsLoading}
          >
            {isLoading ? "Loading..." : "Fetch"}
          </button>
        </div>

        {videoData && (
          <div>
            <h2 className="mb-4 text-xl font-semibold">{videoData.title}</h2>

            <div className="mb-4">
              <h3 className="mb-2 font-medium">Download Video:</h3>
              <div className="flex flex-wrap gap-2">
                {videoData.videoFormats.map(function (f) {
                  return (
                    <button
                      key={f.quality}
                      onClick={function () {
                        handleDownload("video", f.format, f.quality || 6);
                      }}
                      className="rounded-lg bg-green-500 px-4 py-2 text-white transition hover:bg-green-600"
                      disabled={isLoading || downloadIsLoading}
                    >
                      {f.quality}p
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <h3 className="mb-2 font-medium">Download Audio:</h3>
              <div className="flex flex-wrap gap-2">
                {videoData.audioFormats.map(function (f) {
                  return (
                    <button
                      key={f.quality}
                      onClick={function () {
                        handleDownload("audio", f.format, f.quality || 6);
                      }}
                      className="rounded-lg bg-purple-500 px-4 py-2 text-white transition hover:bg-purple-600"
                      disabled={isLoading || downloadIsLoading}
                    >
                      {f.quality}kbps
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
