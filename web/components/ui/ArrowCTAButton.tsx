import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import Icon from "./Icon";

interface SharedProps {
  variant?: "primary" | "secondary";
  children?: ReactNode;
}

type AsButton = SharedProps &
  ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };
type AsAnchor = SharedProps &
  AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };

type ArrowCTAButtonProps = AsButton | AsAnchor;

const HOVER = "[@media(hover:hover)_and_(pointer:fine)]:hover";

export default function ArrowCTAButton(props: ArrowCTAButtonProps) {
  const { variant = "primary", children, className = "", ...rest } = props;

  const shellClass =
    variant === "primary"
      ? `bg-ink-900 text-paper ${HOVER}:bg-sage-700`
      : `bg-transparent text-ink-900 ring-1 ring-rule-strong ${HOVER}:bg-paper-sunk`;

  const wellClass =
    variant === "primary" ? "bg-paper/[0.12]" : "bg-ink-900/[0.06]";

  const inner = (
    <>
      <span className="text-small font-medium tracking-[-0.01em]">
        {children}
      </span>
      <span
        className={[
          "grid h-9 w-9 shrink-0 place-items-center rounded-pill",
          wellClass,
          `${HOVER}:scale-105 ${HOVER}:translate-x-[3px] ${HOVER}:-translate-y-[1px]`,
          "transition-transform duration-[140ms] ease-out",
        ].join(" ")}
      >
        <Icon name="ArrowUpRight" size={16} />
      </span>
    </>
  );

  const sharedClass = [
    "group inline-flex items-center gap-3 rounded-pill pl-6 pr-1.5 py-1.5",
    "transition-transform duration-[140ms] ease-out active:scale-[0.97]",
    shellClass,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if ("href" in props && props.href !== undefined) {
    const { href, ...anchorRest } = rest as AnchorHTMLAttributes<HTMLAnchorElement>;
    return (
      <a href={href} className={sharedClass} {...anchorRest}>
        {inner}
      </a>
    );
  }

  return (
    <button className={sharedClass} {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)}>
      {inner}
    </button>
  );
}
