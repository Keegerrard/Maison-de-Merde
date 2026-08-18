import type { ReactNode } from "react";
import DoubleBezelCard from "@/components/ui/DoubleBezelCard";

export default function SubsystemCard({
  index,
  title,
  description,
  visual,
}: {
  index: string;
  title: string;
  description: string;
  visual: ReactNode;
}) {
  return (
    <DoubleBezelCard
      interactive
      className={[
        "group h-full",
        "md:[@media(hover:hover)_and_(pointer:fine)]:hover:-translate-y-1",
        "md:[@media(hover:hover)_and_(pointer:fine)]:hover:shadow-[0_32px_70px_-28px_rgba(20,17,15,0.34)]",
      ].join(" ")}
      coreClassName="flex h-full flex-col gap-6"
    >
      <span className="font-mono text-eyebrow text-ink-300">{index}</span>
      <div className="flex flex-col gap-2">
        <h3 className="font-display text-title text-ink-900">{title}</h3>
        <p className="text-small text-ink-500">{description}</p>
      </div>
      <div className="mt-auto">{visual}</div>
    </DoubleBezelCard>
  );
}
