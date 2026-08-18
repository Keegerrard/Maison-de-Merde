import type { ButtonHTMLAttributes } from "react";
import Icon from "./Icon";

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
  label: string;
}

export default function Chip({
  selected = false,
  label,
  className = "",
  ...rest
}: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={[
        "inline-flex items-center gap-1.5 rounded-pill px-3.5 py-2 text-small",
        "ring-1 transition-colors duration-[160ms] ease-out",
        selected
          ? "bg-sage-100 text-sage-700 ring-sage-600"
          : "bg-paper-sunk text-ink-700 ring-rule",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      {selected ? <Icon name="Check" size={13} /> : null}
      {label}
    </button>
  );
}
