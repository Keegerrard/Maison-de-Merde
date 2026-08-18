export function formatSessionTime(iso: string): string {
  const d = new Date(iso);
  const datePart = d.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  });
  const timePart = d.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return `${datePart} · ${timePart}`;
}

export function formatPercent(ratio: number): string {
  return `${Math.round(ratio * 100)}%`;
}

export function initialOf(username: string): string {
  return username.trim().charAt(0).toUpperCase() || "?";
}
