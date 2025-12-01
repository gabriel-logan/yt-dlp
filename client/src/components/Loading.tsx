import { motion } from "motion/react";

export function Loading({ className }: { className?: string }) {
  return (
    <div className={"flex items-center justify-center " + className}>
      <motion.div
        animate={{
          rotate: 360,
          scale: [0.9, 1.15, 0.9],
          opacity: [0.6, 1, 0.6],
        }}
        transition={{
          rotate: { duration: 1, repeat: Infinity, ease: "linear" },
          scale: { duration: 1.2, repeat: Infinity, ease: "easeInOut" },
          opacity: { duration: 1.2, repeat: Infinity, ease: "easeInOut" },
        }}
        className="h-12 w-12 rounded-full border-4 border-slate-300/40 border-t-blue-600/70 border-l-blue-500/60"
      />
    </div>
  );
}
