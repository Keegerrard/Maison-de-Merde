import type { ElementType, ComponentPropsWithoutRef, ReactNode } from "react";

type Tone = "default" | "sunken" | "signal";
type Padding = "none" | "tight" | "default";
type Size = "default" | "sm";

interface DoubleBezelCardOwnProps<T extends ElementType> {
  as?: T;
  tone?: Tone;
  padding?: Padding;
  size?: Size;
  interactive?: boolean;
  className?: string;
  coreClassName?: string;
  children?: ReactNode;
}

type DoubleBezelCardProps<T extends ElementType> = DoubleBezelCardOwnProps<T> &
  Omit<ComponentPropsWithoutRef<T>, keyof DoubleBezelCardOwnProps<T>>;

const shellRing: Record<Tone, string> = {
  default: "ring-rule",
  sunken: "ring-rule",
  signal: "ring-claret-200",
};

const shellBg: Record<Tone, string> = {
  default: "bg-paper-sunk",
  sunken: "bg-paper-deep",
  signal: "bg-paper-sunk",
};

const corePadding: Record<Padding, string> = {
  none: "",
  tight: "p-4",
  default: "p-6 md:p-8",
};

export default function DoubleBezelCard<T extends ElementType = "div">({
  as,
  tone = "default",
  padding = "default",
  size = "default",
  interactive = false,
  className = "",
  coreClassName = "",
  children,
  ...rest
}: DoubleBezelCardProps<T>) {
  const Comp = (as ?? "div") as ElementType;
  const shellRadius = size === "sm" ? "rounded-sm" : "rounded-shell";
  const coreRadius = size === "sm" ? "rounded-core-sm" : "rounded-core";
  const shellPad = size === "sm" ? "p-1" : "p-1.5";
  const corePad = size === "sm" && padding === "default" ? "p-4" : corePadding[padding];

  return (
    <Comp
      className={[
        shellPad,
        shellRadius,
        shellBg[tone],
        "ring-1",
        shellRing[tone],
        "shadow-ambient",
        interactive
          ? "transition-transform duration-[260ms] ease-out active:scale-[0.99] cursor-pointer"
          : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      <div
        className={[
          coreRadius,
          "bg-paper-raised",
          "shadow-inner",
          corePad,
          coreClassName,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {children}
      </div>
    </Comp>
  );
}
