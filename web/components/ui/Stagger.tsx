"use client";

import { Children, cloneElement, isValidElement, type ReactNode } from "react";
import Reveal from "./Reveal";
import { STAGGER_STEP } from "@/lib/motion";

/**
 * Wraps each direct child in its own Reveal, delayed by a fixed step.
 * If a child already contains a Reveal-like wrapper, pass raw content —
 * Stagger owns the Reveal here.
 */
export default function Stagger({
  children,
  step = STAGGER_STEP,
  className = "",
}: {
  children: ReactNode;
  step?: number;
  className?: string;
}) {
  const items = Children.toArray(children);

  return (
    <div className={className}>
      {items.map((child, i) => (
        <Reveal key={isValidElement(child) && child.key ? child.key : i} delay={i * step}>
          {isValidElement(child) ? cloneElement(child) : child}
        </Reveal>
      ))}
    </div>
  );
}
