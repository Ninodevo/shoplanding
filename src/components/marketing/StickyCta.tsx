"use client";

import { useEffect, useRef, useState } from "react";

export default function StickyCta() {
  const [visible, setVisible] = useState(false);
  const lastY = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const inWindow = y > 700 && y < max - 600;
      const goingDown = y > lastY.current;
      lastY.current = y;
      setVisible(inWindow && !goingDown);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className="mk-sticky-cta"
      data-visible={visible}
      role="complementary"
      aria-label="See pricing"
    >
      <a
        href="#pricing"
        className="mk-btn mk-btn-primary shadow-[0_8px_24px_-8px_rgba(46,125,91,0.6)]"
      >
        <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300" />
        $99 single · $249 unlimited
        <span aria-hidden>→</span>
      </a>
    </div>
  );
}
