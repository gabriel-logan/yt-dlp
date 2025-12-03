import { motion } from "motion/react";

export function Footer() {
  return (
    <motion.footer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="mt-auto w-full border-t border-slate-200/50 bg-white/80 py-4 backdrop-blur-xl"
    >
      <div className="mx-auto max-w-6xl px-4 text-center">
        <p className="text-sm text-slate-500">
          Built with{" "}
          <a
            href="https://github.com/yt-dlp/yt-dlp"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-blue-600 hover:underline"
          >
            yt-dlp
          </a>{" "}
          • <span className="text-slate-400">For academic purposes only</span>
        </p>
      </div>
    </motion.footer>
  );
}
