export function Loading({ className }: { className?: string }) {
  return (
    <div className={"flex items-center justify-center " + className}>
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-transparent border-t-white/90 border-l-white/60" />
    </div>
  );
}
