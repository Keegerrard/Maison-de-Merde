import type { ReactNode } from "react";
import EyebrowTag from "./EyebrowTag";

export default function SectionHeading({
  eyebrow,
  title,
  lede,
  className = "",
}: {
  eyebrow: string;
  title: ReactNode;
  lede?: ReactNode;
  className?: string;
}) {
  return (
    <div className={["flex flex-col gap-4", className].filter(Boolean).join(" ")}>
      <EyebrowTag>{eyebrow}</EyebrowTag>
      <h2 className="font-display text-display text-ink-900">{title}</h2>
      {lede ? (
        <p className="max-w-[46ch] text-lede text-ink-500">{lede}</p>
      ) : null}
    </div>
  );
}
