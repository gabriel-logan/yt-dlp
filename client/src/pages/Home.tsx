import { useState } from "react";
import { FiDownload, FiMusic, FiSearch, FiVideo } from "react-icons/fi";
import { motion } from "motion/react";

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
    <div className="flex min-h-screen flex-col items-center bg-linear-to-b from-slate-100 to-slate-200 px-4 py-8">
      {anyLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <Loading className="scale-150" />
        </div>
      )}

      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8 text-center text-4xl font-extrabold tracking-tight text-slate-800"
      >
        Video / Audio Downloader
      </motion.h1>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="mb-8 w-full max-w-3xl rounded-2xl border border-white/40 bg-white/80 p-6 shadow-lg backdrop-blur-xl"
      >
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            placeholder="Paste the video URL..."
            className={`grow rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-700 shadow-sm transition focus:border-blue-500 focus:ring-4 focus:ring-blue-200/50 focus:outline-none ${
              anyLoading && "cursor-not-allowed bg-slate-100 opacity-70"
            }`}
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            disabled={anyLoading}
          />

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-medium text-white shadow-md hover:bg-blue-700 ${
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
      </motion.div>

      {videoData ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-4xl space-y-10"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center gap-4 rounded-2xl border border-white/40 bg-white/80 p-6 shadow-lg backdrop-blur-xl sm:flex-row"
          >
            {videoData.thumbnail && (
              <motion.img
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                src={videoData.thumbnail}
                alt="Thumbnail"
                className="h-36 w-full rounded-xl object-cover shadow sm:w-56"
              />
            )}

            <h2 className="text-xl leading-snug font-bold text-slate-800 sm:text-2xl">
              {videoData.title}
            </h2>
          </motion.div>

          {videoData.videoFormats.length > 0 && (
            <section>
              <div className="mb-4 flex items-center gap-2">
                <FiVideo className="text-blue-600" size={20} />
                <h3 className="text-xl font-semibold text-slate-700">
                  Video Formats
                </h3>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                {videoData.videoFormats.map((format) => (
                  <Card key={format.format_id}>
                    <div className="mb-3 text-sm font-medium text-slate-800 sm:text-base">
                      {format.format || "Unknown"} — {format.video_ext}
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 py-2 font-medium text-white shadow hover:bg-green-700 ${
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
                          videoData: { title: videoData.title },
                          setDownloadIsLoading,
                        })
                      }
                      disabled={anyLoading}
                    >
                      <FiDownload size={18} /> Download
                    </motion.button>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {videoData.audioFormats.length > 0 && (
            <section>
              <div className="mb-4 flex items-center gap-2">
                <FiMusic className="text-purple-600" size={20} />
                <h3 className="text-xl font-semibold text-slate-700">
                  Audio Formats
                </h3>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                {videoData.audioFormats.map((format) => (
                  <Card key={format.format_id}>
                    <div className="mb-3 text-sm font-medium text-slate-800 sm:text-base">
                      {format.audio_ext} — {format.abr} kbps —{" "}
                      {format.format_note}
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`flex w-full items-center justify-center gap-2 rounded-lg bg-purple-600 py-2 font-medium text-white shadow hover:bg-purple-700 ${
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
                          videoData: { title: videoData.title },
                          setDownloadIsLoading,
                        })
                      }
                      disabled={anyLoading}
                    >
                      <FiDownload size={18} /> Download
                    </motion.button>
                  </Card>
                ))}
              </div>
            </section>
          )}
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="mt-20 text-center text-slate-600"
        >
          Paste a video URL above to fetch available download formats.
        </motion.div>
      )}
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{
        scale: 1.03,
        rotate: 0.4,
        boxShadow: "0 12px 32px rgba(0,0,0,0.12)",
      }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 220, damping: 16 }}
      className="rounded-xl border border-white/40 bg-white/80 p-4 shadow backdrop-blur-xl"
    >
      {children}
    </motion.div>
  );
}
