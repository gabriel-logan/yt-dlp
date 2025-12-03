import { FiGithub, FiYoutube } from "react-icons/fi";
import { motion } from "motion/react";

export function Header() {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full border-b border-slate-200/50 bg-white/80 py-4 backdrop-blur-xl"
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-red-500 to-red-600 shadow-md">
            <FiYoutube className="text-white" size={22} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800">yt-dlp</h1>
            <p className="text-xs text-slate-500">Video & Audio Downloader</p>
          </div>
        </div>

        <a
          href="https://github.com/gabriel-logan/yt-dlp"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-50 hover:text-slate-800"
        >
          <FiGithub size={18} />
          <span className="hidden sm:inline">View on GitHub</span>
        </a>
      </div>
    </motion.header>
  );
}
