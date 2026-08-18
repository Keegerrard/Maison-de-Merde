export default function SkeletonRow({ className = "" }: { className?: string }) {
  return (
    <div
      className={[
        "h-14 w-full animate-pulse rounded-core-sm bg-paper-sunk",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    />
  );
}
