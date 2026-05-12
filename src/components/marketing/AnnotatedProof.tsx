"use client";

import { useState } from "react";
import Section from "./Section";
import { PROOF_PINS } from "@/lib/marketing/copy";

/**
 * Annotated proof — Option A.
 * A static rendered PDP-style artifact with clickable pins. Clicking a pin
 * updates the side panel with the CRO rules that block satisfies.
 *
 * Lightweight client component — only state is the active pin index.
 */
export default function AnnotatedProof() {
  const [active, setActive] = useState(0);
  const pin = PROOF_PINS[active]!;

  return (
    <Section
      id="proof"
      eyebrow="The proof · click any pin"
      title="Every block ties to a documented rule."
      intro="This is one of our themes, annotated. Tap a pin and we'll show you which conversion rules the block is doing the work for."
      surface="tinted"
    >
      <div className="grid items-start gap-12 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-16">
        {/* Static rendered PDP with pins */}
        <article className="mk-proof-frame">
          <div className="mk-proof-strip">FREE SHIPPING ON ORDERS $35+ · 30-DAY GUARANTEE</div>
          <div className="mk-proof-nav">
            <span className="mk-proof-logo">brand.</span>
            <div className="mk-proof-links">
              <span>Shop</span>
              <span>How it works</span>
              <span>Reviews</span>
              <span>FAQ</span>
            </div>
          </div>

          {/* Hero — pin 1 */}
          <div className="mk-proof-pdp">
            <Pin n={1} active={active === 0} onClick={() => setActive(0)} className="mk-proof-pin-1" />
            <div className="mk-proof-gallery" aria-hidden />
            <div className="mk-proof-info">
              <span className="mk-mono" style={{ color: "var(--accent-deep)" }}>
                Daily Essentials
              </span>
              <h4>Daystick — solid lotion</h4>
              <div className="mk-proof-stars">
                ★★★★★ <b>4.8</b> · 487 reviews
              </div>
              <p>The unique, effortless lotion stick that keeps skin happy all day.</p>
              <div className="mk-proof-price">
                $39 <s>$49</s>
              </div>
              <div className="mk-proof-cta">+ Add to bag · $39</div>
            </div>
          </div>

          {/* Press — pin 2 */}
          <div className="mk-proof-section">
            <Pin n={2} active={active === 1} onClick={() => setActive(1)} />
            <div className="mk-mono mk-proof-label">As featured in</div>
            <div className="mk-proof-press">
              <span style={{ letterSpacing: "0.18em", fontWeight: 700 }}>VOGUE</span>
              <span style={{ fontStyle: "italic", fontFamily: "Georgia, serif" }}>goop</span>
              <span style={{ fontStyle: "italic", fontFamily: "Georgia, serif" }}>Refinery29</span>
              <span style={{ letterSpacing: "0.18em", fontWeight: 700 }}>BAZAAR</span>
              <span style={{ fontStyle: "italic", fontFamily: "Georgia, serif" }}>Forbes</span>
            </div>
          </div>

          {/* Benefits — pin 3 */}
          <div className="mk-proof-section">
            <Pin n={3} active={active === 2} onClick={() => setActive(2)} />
            <div className="mk-mono mk-proof-label">Why customers choose us</div>
            <h5>Better ingredients. Better results.</h5>
            <div className="mk-proof-grid3">
              <div className="mk-proof-gcard" />
              <div className="mk-proof-gcard" />
              <div className="mk-proof-gcard" />
            </div>
          </div>

          {/* Reviews — pin 4 */}
          <div className="mk-proof-section">
            <Pin n={4} active={active === 3} onClick={() => setActive(3)} />
            <div className="mk-mono mk-proof-label">Real customers, real results</div>
            <h5>4.8 / 5 · 487 verified reviews</h5>
            <div className="mk-proof-grid3">
              <div className="mk-proof-gcard" style={{ background: "#fff5e1" }} />
              <div className="mk-proof-gcard" style={{ background: "#fff5e1" }} />
              <div className="mk-proof-gcard" style={{ background: "#fff5e1" }} />
            </div>
          </div>
        </article>

        {/* Sticky side panel */}
        <aside className="mk-proof-side">
          <span className="mk-mono" style={{ color: "var(--accent-deep)" }}>
            {pin.blockLabel}
          </span>
          <h3 className="mt-3 text-2xl font-semibold leading-tight tracking-tight">
            Pin #{pin.n} → {pin.title}
          </h3>
          <p className="mt-4 text-[15px] text-[var(--ink-2)]">{pin.summary}</p>
          <ul className="mk-rule-list mt-6">
            {pin.rules.map((r) => (
              <li key={r.num}>
                <span className="mk-rule-num">{r.num}</span>
                <span className="mk-rule-body">{r.text}</span>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </Section>
  );
}

function Pin({
  n,
  active,
  onClick,
  className,
}: {
  n: number;
  active: boolean;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`mk-pin ${className ?? ""}`}
      data-active={active}
      aria-label={`Show CRO rules for pin ${n}`}
    >
      {n}
    </button>
  );
}
