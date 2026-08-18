import type { ReactNode } from "react";
import Rule from "./Rule";

export default function EmptyState({
  message,
  action,
  className = "",
}: {
  message: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={["py-8", className].filter(Boolean).join(" ")}>
      <Rule className="mb-6" />
      <p className="text-small text-ink-500">{message}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
