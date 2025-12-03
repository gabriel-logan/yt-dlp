import { motion } from "motion/react";

interface ProgressBarProps {
  progress: number;
  isVisible: boolean;
  fileName?: string;
}

export function ProgressBar({
  progress,
  isVisible,
  fileName,
}: ProgressBarProps) {
  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed bottom-6 left-1/2 z-50 w-full max-w-md -translate-x-1/2 px-4"
    >
      <div className="rounded-2xl border border-white/40 bg-white/95 p-4 shadow-xl backdrop-blur-xl">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium text-slate-700">
            {progress < 100 ? "Downloading..." : "Download complete!"}
          </span>
          <span className="text-sm font-semibold text-blue-600">
            {Math.round(progress)}%
          </span>
        </div>

        {fileName && (
          <p className="mb-2 truncate text-xs text-slate-500">{fileName}</p>
        )}

        <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200">
          <motion.div
            className="h-full rounded-full bg-linear-to-r from-blue-500 to-blue-600"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          />
        </div>
      </div>
    </motion.div>
  );
}
