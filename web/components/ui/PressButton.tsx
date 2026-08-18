import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

interface PressButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  fullWidth?: boolean;
  children?: ReactNode;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-sage-700 text-paper [@media(hover:hover)_and_(pointer:fine)]:hover:bg-sage-600",
  secondary:
    "bg-transparent text-ink-900 ring-1 ring-rule-strong [@media(hover:hover)_and_(pointer:fine)]:hover:bg-paper-sunk",
  ghost:
    "bg-transparent text-ink-700 [@media(hover:hover)_and_(pointer:fine)]:hover:text-ink-900",
  danger:
    "bg-claret-600 text-paper [@media(hover:hover)_and_(pointer:fine)]:hover:bg-[#711f28]",
};

export default function PressButton({
  variant = "primary",
  fullWidth = false,
  className = "",
  children,
  ...rest
}: PressButtonProps) {
  return (
    <button
      className={[
        "inline-flex items-center justify-center gap-2 rounded-pill px-6 py-3",
        "text-small font-medium tracking-[-0.01em]",
        "transition-transform duration-[140ms] ease-out active:scale-[0.97]",
        "disabled:opacity-40 disabled:pointer-events-none",
        fullWidth ? "w-full" : "",
        variantClasses[variant],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      {children}
    </button>
  );
}
