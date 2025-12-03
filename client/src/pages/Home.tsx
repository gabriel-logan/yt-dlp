import { useState } from "react";
import { FiDownload, FiMusic, FiSearch, FiVideo } from "react-icons/fi";
import { motion } from "motion/react";

import handleDownload, {
  type DownloadProgress,
} from "../actions/handleDownload";
import handleFetchVideo from "../actions/handleFetchVideo";
import { Loading } from "../components/Loading";
import { ProgressBar } from "../components/ProgressBar";
import type { VideoInfoResponse, VideoInfoResponseFormat } from "../types";

export default function HomePage() {
  const [videoUrl, setVideoUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [downloadIsLoading, setDownloadIsLoading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress>({
    progress: 0,
    fileName: "",
    isDownloading: false,
  });
  const [videoData, setVideoData] = useState<null | {
    title: VideoInfoResponse["title"];
    thumbnail: VideoInfoResponse["thumbnail"];
    videoFormats: VideoInfoResponseFormat[];
    audioFormats: VideoInfoResponseFormat[];
  }>(null);

  const anyLoading = isLoading || downloadIsLoading;

  return (
    <>
      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="rounded-2xl bg-white/95 p-8 shadow-2xl backdrop-blur-xl">
            <Loading className="scale-150" />
            <p className="mt-4 text-center text-sm text-slate-600">
              Fetching video info...
            </p>
          </div>
        </div>
      )}

      <ProgressBar
        progress={downloadProgress.progress}
        isVisible={downloadProgress.isDownloading}
        fileName={downloadProgress.fileName}
      />

      <main className="flex-1 px-4 py-8">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-8 text-center"
          >
            <h2 className="mb-2 text-3xl font-bold tracking-tight text-slate-800 sm:text-4xl">
              Download Videos & Audio
            </h2>
            <p className="text-slate-600">
              Paste a URL to get started. Supports YouTube, Vimeo, and many more
              platforms.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="mx-auto mb-10 max-w-2xl"
          >
            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-lg sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  type="text"
                  placeholder="Paste the video URL..."
                  className={`grow rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-700 shadow-sm transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-200/50 focus:outline-none ${
                    anyLoading && "cursor-not-allowed bg-slate-100 opacity-70"
                  }`}
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  disabled={anyLoading}
                />

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-3 font-medium text-white shadow-md transition hover:from-blue-700 hover:to-blue-800 ${
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
                </motion.button>
              </div>
            </div>
          </motion.div>

          {videoData ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="space-y-8"
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="flex flex-col items-center gap-6 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-lg sm:flex-row"
              >
                {videoData.thumbnail && (
                  <motion.img
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                    src={videoData.thumbnail}
                    alt="Thumbnail"
                    className="h-40 w-full rounded-xl object-cover shadow-md sm:h-36 sm:w-64"
                  />
                )}

                <div className="flex-1 text-center sm:text-left">
                  <h3 className="text-xl leading-snug font-bold text-slate-800 sm:text-2xl">
                    {videoData.title}
                  </h3>
                  <p className="mt-2 text-sm text-slate-500">
                    {videoData.videoFormats.length} video format
                    {videoData.videoFormats.length !== 1 && "s"} •{" "}
                    {videoData.audioFormats.length} audio format
                    {videoData.audioFormats.length !== 1 && "s"} available
                  </p>
                </div>
              </motion.div>

              {videoData.videoFormats.length > 0 && (
                <section>
                  <div className="mb-4 flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
                      <FiVideo className="text-blue-600" size={18} />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-700">
                      Video Formats
                    </h3>
                    <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                      {videoData.videoFormats.length}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {videoData.videoFormats.map((format) => (
                      <FormatCard
                        key={format.format_id}
                        format={format}
                        type="video"
                        disabled={anyLoading}
                        onDownload={() =>
                          handleDownload({
                            body: {
                              type: "video",
                              quality: format.quality || 0,
                              format,
                              formatNote: format.format_note,
                            },
                            videoUrl,
                            videoData: { title: videoData.title },
                            setDownloadIsLoading,
                            onProgress: setDownloadProgress,
                          })
                        }
                      />
                    ))}
                  </div>
                </section>
              )}

              {videoData.audioFormats.length > 0 && (
                <section>
                  <div className="mb-4 flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100">
                      <FiMusic className="text-purple-600" size={18} />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-700">
                      Audio Formats
                    </h3>
                    <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                      {videoData.audioFormats.length}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {videoData.audioFormats.map((format) => (
                      <FormatCard
                        key={format.format_id}
                        format={format}
                        type="audio"
                        disabled={anyLoading}
                        onDownload={() =>
                          handleDownload({
                            body: {
                              type: "audio",
                              quality: format.quality || 0,
                              format,
                              formatNote: format.format_note,
                            },
                            videoUrl,
                            videoData: { title: videoData.title },
                            setDownloadIsLoading,
                            onProgress: setDownloadProgress,
                          })
                        }
                      />
                    ))}
                  </div>
                </section>
              )}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="mt-16 text-center"
            >
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
                <FiVideo className="text-slate-400" size={32} />
              </div>
              <p className="text-lg text-slate-500">
                Paste a video URL above to fetch available download formats.
              </p>
            </motion.div>
          )}
        </div>
      </main>
    </>
  );
}

interface FormatCardProps {
  format: VideoInfoResponseFormat;
  type: "video" | "audio";
  disabled: boolean;
  onDownload: () => void;
}

function FormatCard({ format, type, disabled, onDownload }: FormatCardProps) {
  const isVideo = type === "video";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{
        scale: 1.02,
        boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
      }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm"
    >
      <div className="mb-3">
        <div className="text-sm font-medium text-slate-800">
          {isVideo ? (
            <>
              {format.format || "Unknown"}{" "}
              <span className="text-slate-400">•</span>{" "}
              <span className="text-slate-500">{format.video_ext}</span>
            </>
          ) : (
            <>
              {format.audio_ext} <span className="text-slate-400">•</span>{" "}
              <span className="text-slate-500">{format.abr} kbps</span>{" "}
              <span className="text-slate-400">•</span>{" "}
              <span className="text-slate-500">{format.format_note}</span>
            </>
          )}
        </div>
        {format.filesize_approx && (
          <p className="mt-1 text-xs text-slate-400">
            ~{(format.filesize_approx / (1024 * 1024)).toFixed(1)} MB
          </p>
        )}
      </div>

      <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        className={`flex w-full items-center justify-center gap-2 rounded-lg py-2.5 font-medium text-white shadow-sm transition ${
          isVideo
            ? "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
            : "bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
        } ${disabled && "cursor-not-allowed opacity-50"}`}
        onClick={onDownload}
        disabled={disabled}
      >
        <FiDownload size={16} /> Download
      </motion.button>
    </motion.div>
  );
}
