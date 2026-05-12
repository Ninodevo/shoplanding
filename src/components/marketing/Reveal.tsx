"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Wraps children in a one-shot scroll-reveal that respects
 * `prefers-reduced-motion` (the CSS guards visibility too, so this only
 * provides the trigger class). Use sparingly — only for the on-enter accent.
 */
function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches,
  );
}

export default function Reveal({
  children,
  delay = 0,
  className = "",
  as: As = "div",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  as?: keyof React.JSX.IntrinsicElements;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState<boolean>(prefersReducedMotion);

  useEffect(() => {
    if (visible) return;
    const el = ref.current;
    if (!el) return;
    let timer: number | undefined;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            timer = window.setTimeout(() => setVisible(true), delay);
            obs.disconnect();
            return;
          }
        }
      },
      { threshold: 0.12 },
    );
    obs.observe(el);
    return () => {
      obs.disconnect();
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [delay, visible]);

  const Component = As as React.ElementType;
  return (
    <Component
      ref={ref as React.Ref<HTMLElement>}
      className={`mk-reveal${visible ? " is-visible" : ""} ${className}`.trim()}
    >
      {children}
    </Component>
  );
}
