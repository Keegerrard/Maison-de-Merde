export default function SkeletonBlock({
  className = "h-40 w-full",
}: {
  className?: string;
}) {
  return (
    <div
      className={["animate-pulse rounded-shell bg-paper-sunk", className]
        .filter(Boolean)
        .join(" ")}
    />
  );
}
