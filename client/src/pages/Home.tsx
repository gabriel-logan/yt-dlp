import { useState } from "react";
import { FiDownload, FiMusic, FiSearch, FiVideo } from "react-icons/fi";

import handleDownload from "../actions/handleDownload";
import handleFetchVideo from "../actions/handleFetchVideo";
import { Loading } from "../components/Loading";
import type { VideoInfoResponse, VideoInfoResponseFormat } from "../types";

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

  return (
    <div className="flex min-h-screen flex-col items-center bg-linear-to-b from-gray-100 to-gray-200 px-4 py-8">
      {anyLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <Loading className="scale-150" />
        </div>
      )}

      <h1 className="mb-8 text-3xl font-extrabold tracking-tight text-gray-800">
        Video / Audio Downloader
      </h1>

      <div className="mb-8 w-full max-w-3xl rounded-2xl border border-white/40 bg-white/80 p-4 shadow-lg backdrop-blur-xl sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            placeholder="Paste the video URL..."
            className={`grow rounded-xl border border-gray-300 bg-white px-4 py-3 text-base text-gray-700 shadow-sm transition focus:border-blue-500 focus:ring-4 focus:ring-blue-200/50 focus:outline-none ${
              anyLoading && "cursor-not-allowed bg-gray-100 opacity-70"
            }`}
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            disabled={anyLoading}
          />

          <button
            className={`flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-medium text-white shadow-md transition-all hover:bg-blue-700 hover:shadow-lg active:scale-95 ${
              anyLoading && "cursor-not-allowed opacity-50"
            }`}
            onClick={() =>
              handleFetchVideo({
                videoUrl,
                setIsLoading,
                setVideoData,
              })
            }
            disabled={anyLoading}
          >
            <FiSearch size={18} />
            {isLoading ? "Fetching..." : "Fetch"}
          </button>
        </div>
      </div>

      {videoData && (
        <div className="w-full max-w-4xl space-y-10">
          <div className="flex flex-col gap-4 rounded-2xl border border-white/40 bg-white/80 p-4 shadow-lg backdrop-blur-xl sm:flex-row sm:items-center sm:p-6">
            {videoData.thumbnail && (
              <img
                src={videoData.thumbnail}
                alt="Thumbnail"
                className="h-36 w-full rounded-xl object-cover shadow-md sm:w-56"
              />
            )}

            <h2 className="text-xl leading-snug font-bold text-gray-800 sm:text-2xl">
              {videoData.title}
            </h2>
          </div>

          {videoData.videoFormats.length > 0 && (
            <div>
              <div className="mb-4 flex items-center gap-2">
                <FiVideo className="text-blue-600" size={20} />
                <h3 className="text-xl font-semibold text-gray-700">
                  Video Formats
                </h3>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                {videoData.videoFormats.map((format) => (
                  <div
                    key={format.format_id}
                    className="rounded-xl border border-white/40 bg-white/80 p-4 shadow backdrop-blur-xl transition hover:scale-[1.01] hover:shadow-xl"
                  >
                    <div className="mb-3 text-sm font-medium text-gray-800 sm:text-base">
                      {format.format || "Unknown"} — {format.video_ext}
                    </div>

                    <button
                      className={`flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 py-2 font-medium text-white shadow transition hover:bg-green-700 hover:shadow-lg active:scale-95 ${
                        anyLoading && "cursor-not-allowed opacity-50"
                      }`}
                      onClick={() =>
                        handleDownload({
                          body: {
                            type: "video",
                            quality: format.quality || 0,
                            format,
                            formatNote: format.format_note,
                          },
                          videoUrl,
                          videoData: {
                            title: videoData.title,
                          },
                          setDownloadIsLoading,
                        })
                      }
                      disabled={anyLoading}
                    >
                      <FiDownload size={18} />
                      Download
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {videoData.audioFormats.length > 0 && (
            <div>
              <div className="mb-4 flex items-center gap-2">
                <FiMusic className="text-purple-600" size={20} />
                <h3 className="text-xl font-semibold text-gray-700">
                  Audio Formats
                </h3>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                {videoData.audioFormats.map((format) => (
                  <div
                    key={format.format_id}
                    className="rounded-xl border border-white/40 bg-white/80 p-4 shadow backdrop-blur-xl transition hover:scale-[1.01] hover:shadow-xl"
                  >
                    <div className="mb-3 text-sm font-medium text-gray-800 sm:text-base">
                      {format.audio_ext} — {format.abr} kbps —{" "}
                      {format.format_note}
                    </div>

                    <button
                      className={`flex w-full items-center justify-center gap-2 rounded-lg bg-purple-600 py-2 font-medium text-white shadow transition hover:bg-purple-700 hover:shadow-lg active:scale-95 ${
                        anyLoading && "cursor-not-allowed opacity-50"
                      }`}
                      onClick={() =>
                        handleDownload({
                          body: {
                            type: "audio",
                            quality: format.quality || 0,
                            format,
                            formatNote: format.format_note,
                          },
                          videoUrl,
                          videoData: {
                            title: videoData.title,
                          },
                          setDownloadIsLoading,
                        })
                      }
                      disabled={anyLoading}
                    >
                      <FiDownload size={18} />
                      Download
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
