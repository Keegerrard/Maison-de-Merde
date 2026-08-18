import type { ReactNode } from "react";

export default function EyebrowTag({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-pill px-3 py-1",
        "font-mono text-eyebrow uppercase text-ink-500",
        "ring-1 ring-rule",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </span>
  );
}
