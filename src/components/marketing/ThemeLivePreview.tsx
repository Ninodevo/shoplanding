"use client";

import { useState } from "react";

/**
 * Live preview frame for /themes/[slug]. Embeds /showcase/{presetSlug}?embed=1
 * inside a styled "browser chrome" so the buyer sees the actual rendered
 * landing page they'd ship — not a screenshot, not a palette swatch. The
 * showcase page strips its nav + tweaks panel when ?embed=1 is set.
 *
 * Device toggle simulates a phone viewport by CSS scaling — no media query
 * hacks, no fake user agent. The iframe is rendered at its natural width
 * and either fills the frame (desktop) or sits centered in a phone bezel
 * (mobile).
 */
type Device = "desktop" | "mobile";

const DESKTOP_HEIGHT = 720;
const MOBILE_INNER_WIDTH = 390;
const MOBILE_INNER_HEIGHT = 720;
const MOBILE_FRAME_WIDTH = 360;

export default function ThemeLivePreview({
  presetSlug,
  hostname,
  brandName,
}: {
  presetSlug: string;
  hostname: string;
  brandName: string;
}) {
  const [device, setDevice] = useState<Device>("desktop");
  const src = `/showcase/${presetSlug}?embed=1`;

  return (
    <section className="mk-section pt-0">
      <div className="mk-container">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="mk-eyebrow">Live preview</p>
            <h2 className="mk-h2 mt-3">
              Scroll the page you&apos;d ship for {brandName}.
            </h2>
            <p className="mt-2 text-[var(--ink-2)]">
              Same renderer, same components, same DB seed — running right now,
              not a screenshot. Resize, toggle mobile, click around.
            </p>
          </div>
          <DeviceToggle device={device} setDevice={setDevice} />
        </header>

        <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] shadow-sm">
          {/* Browser chrome */}
          <div className="flex items-center gap-3 border-b border-[var(--line)] bg-white px-4 py-3">
            <div className="flex gap-1.5" aria-hidden>
              <span className="h-3 w-3 rounded-full bg-[#ff5f56]" />
              <span className="h-3 w-3 rounded-full bg-[#ffbd2e]" />
              <span className="h-3 w-3 rounded-full bg-[#27c93f]" />
            </div>
            <div className="flex flex-1 items-center gap-2 rounded-md bg-[var(--surface)] px-3 py-1.5 font-mono text-[12px] text-[var(--muted)]">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <span className="truncate">{hostname}/products/{brandName.toLowerCase().replace(/\s+/g, "-")}</span>
            </div>
            <a
              href={src.replace("?embed=1", "")}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-[11px] text-[var(--muted)] hover:text-[var(--ink)] uppercase tracking-[0.12em]"
              title="Open standalone (with tweaks panel)"
            >
              open ↗
            </a>
          </div>

          {/* Viewport — desktop fills, mobile sits in a phone bezel */}
          <div
            className="flex items-center justify-center bg-[var(--surface-2)]"
            style={{
              height: device === "desktop" ? DESKTOP_HEIGHT : MOBILE_INNER_HEIGHT + 40,
            }}
          >
            {device === "desktop" ? (
              <iframe
                key="desktop"
                src={src}
                title="Live theme preview — desktop"
                className="block h-full w-full"
                loading="lazy"
              />
            ) : (
              <div
                className="overflow-hidden rounded-[24px] border-8 border-zinc-900 bg-zinc-900 shadow-lg"
                style={{
                  width: MOBILE_FRAME_WIDTH,
                  height: MOBILE_INNER_HEIGHT,
                }}
              >
                <iframe
                  key="mobile"
                  src={src}
                  title="Live theme preview — mobile"
                  width={MOBILE_INNER_WIDTH}
                  // Pre-scale height must be inner-height ÷ scale so the
                  // SCALED iframe fills the bezel exactly — sizing it to the
                  // bezel leaves a dead band at the bottom after scaling.
                  height={Math.round(
                    (MOBILE_INNER_HEIGHT - 16) /
                      ((MOBILE_FRAME_WIDTH - 16) / MOBILE_INNER_WIDTH),
                  )}
                  className="block bg-white"
                  style={{
                    // Scale a 390px viewport into the phone bezel
                    transform: `scale(${(MOBILE_FRAME_WIDTH - 16) / MOBILE_INNER_WIDTH})`,
                    transformOrigin: "top left",
                    border: 0,
                  }}
                  loading="lazy"
                />
              </div>
            )}
          </div>
        </div>

        <p className="mt-3 text-center text-[12px] text-[var(--muted)]">
          The preview embeds <code className="font-mono">/showcase/{presetSlug}</code>{" "}
          — the same React components packaged in the theme zip you download.
        </p>
      </div>
    </section>
  );
}

function DeviceToggle({
  device,
  setDevice,
}: {
  device: Device;
  setDevice: (d: Device) => void;
}) {
  const btn = (active: boolean) =>
    `px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors ${
      active
        ? "bg-white text-[var(--ink)] shadow-sm"
        : "text-[var(--muted)] hover:text-[var(--ink)]"
    }`;
  return (
    <div
      className="inline-flex items-center gap-1 rounded-lg border border-[var(--line)] bg-[var(--surface)] p-1"
      role="tablist"
      aria-label="Preview device"
    >
      <button
        type="button"
        onClick={() => setDevice("desktop")}
        className={btn(device === "desktop")}
        role="tab"
        aria-selected={device === "desktop"}
      >
        Desktop
      </button>
      <button
        type="button"
        onClick={() => setDevice("mobile")}
        className={btn(device === "mobile")}
        role="tab"
        aria-selected={device === "mobile"}
      >
        Mobile
      </button>
    </div>
  );
}
