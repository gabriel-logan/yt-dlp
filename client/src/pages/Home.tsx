import { useState } from "react";

import apiInstance from "../lib/apiInstance";

export default function HomePage() {
  const [videoUrl, setVideoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [videoData, setVideoData] = useState<null | {
    title: string;
    videoFormats: { format: string; quality: string }[];
    audioFormats: { format: string; quality: string }[];
  }>(null);

  function handleFetchVideo() {
    if (!videoUrl) return;
    setLoading(true);

    apiInstance
      .get("/video/info", { params: { url: videoUrl } })
      .then(function (response) {
        const data = response.data;

        const videoFormats: { format: string; quality: string }[] = [];
        const audioFormats: { format: string; quality: string }[] = [];

        if (Array.isArray(data.formats)) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          data.formats.forEach(function (format: any) {
            const isVideo =
              format.vcodec !== "none" && format.acodec !== "none";
            const isAudioOnly =
              format.vcodec === "none" && format.acodec !== "none";

            if (isVideo) {
              videoFormats.push({
                format: "mp4",
                quality: format.height
                  ? `${format.height}`
                  : format.format_note || "unknown",
              });
            }

            if (isAudioOnly) {
              audioFormats.push({
                format: "mp3",
                quality: format.abr
                  ? `${format.abr}`
                  : format.format_note || "unknown",
              });
            }
          });
        }

        setVideoData({
          title: data.title,
          videoFormats: videoFormats,
          audioFormats: audioFormats,
        });
      })
      .catch(function (error) {
        console.error("Error fetching video info:", error);
        alert("Failed to fetch video info.");
      })
      .finally(function () {
        setLoading(false);
      });
  }

  function handleDownload(
    type: "video" | "audio",
    format: string,
    quality: string,
  ) {
    if (!videoUrl) return;

    apiInstance
      .post(
        "/api/video/download",
        {
          url: videoUrl,
          type: type,
          format: format,
          quality: quality,
        },
        { responseType: "blob" },
      )
      .then(function (response) {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `${type}_${quality}.${format}`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      })
      .catch(function (error) {
        console.error("Download error:", error);
        alert("Failed to download.");
      });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-xl rounded-xl bg-white p-8 shadow-lg">
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
            className="rounded-lg bg-blue-600 px-6 py-3 text-white transition hover:bg-blue-700"
          >
            {loading ? "Loading..." : "Fetch"}
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
                        handleDownload("video", f.format, f.quality);
                      }}
                      className="rounded-lg bg-green-500 px-4 py-2 text-white transition hover:bg-green-600"
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
                        handleDownload("audio", f.format, f.quality);
                      }}
                      className="rounded-lg bg-purple-500 px-4 py-2 text-white transition hover:bg-purple-600"
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
