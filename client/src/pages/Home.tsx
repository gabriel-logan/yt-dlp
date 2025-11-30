import { useState } from "react";

import handleDownload from "../actions/handleDownload";
import handleFetchVideo from "../actions/handleFetchVideo";
import Loading from "../components/Loading";
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
    <div className="flex min-h-screen flex-col items-center bg-gray-50 p-6">
      {anyLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <Loading className="scale-125" />
        </div>
      )}

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
          onClick={() =>
            handleFetchVideo({
              videoUrl,
              setIsLoading,
              setVideoData,
            })
          }
          disabled={anyLoading}
        >
          {isLoading ? "Fetching..." : "Fetch Info"}
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
                      Download
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
