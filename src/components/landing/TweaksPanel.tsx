"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import type { LandingTokens, LandingTweaks } from "./types";
import { saveOrderTweaks } from "@/app/preview/actions";

/**
 * Floating tweaks panel for `/preview/[previewSlug]`.
 *
 * Two-mode component:
 *  - **persisted** (default): given a `previewSlug`, the Save button calls the
 *    server action which writes to `Order.tweaks`. The buyer can share the
 *    preview URL and the recipient sees the latest persisted state.
 *  - **anonymous** (set `mode="ephemeral"`): tweaks live in client state only,
 *    nothing persists. Useful for the marketing demo and the `/showcase` pages.
 *
 * Palette and font tokens are applied **live** to `.landing-root` via
 * `style.setProperty` so the buyer sees changes instantly without a page
 * re-render. `ctaCopy` is the only field that persists-then-refresh — server
 * action calls `revalidatePath` so the next view reflects it.
 */
type Mode = "persisted" | "ephemeral";

export type TweaksPanelProps = {
  initialTokens: LandingTokens;
  initialTweaks: LandingTweaks;
  mode?: Mode;
  /** Required when mode="persisted". */
  previewSlug?: string;
  /** Open the panel on first paint. Defaults to false (collapsed pill). */
  defaultOpen?: boolean;
};

const FONT_PRESETS: { label: string; value: string }[] = [
  { label: "Fraunces (serif)", value: '"Fraunces", Georgia, serif' },
  { label: "Inter", value: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif' },
  { label: "Geist", value: '"Geist", -apple-system, BlinkMacSystemFont, sans-serif' },
  { label: "JetBrains Mono", value: '"JetBrains Mono", ui-monospace, monospace' },
];

export default function TweaksPanel({
  initialTokens,
  initialTweaks,
  mode = "persisted",
  previewSlug,
  defaultOpen = false,
}: TweaksPanelProps) {
  const merged = { ...initialTokens, ...initialTweaks };
  const [open, setOpen] = useState(defaultOpen);
  const [accent, setAccent] = useState(merged.accent);
  const [accentDeep, setAccentDeep] = useState(merged.accentDeep);
  const [accentSoft, setAccentSoft] = useState(merged.accentSoft);
  const [fontDisplay, setFontDisplay] = useState(merged.fontDisplay);
  const [ctaCopy, setCtaCopy] = useState(initialTweaks.ctaCopy ?? "Add to cart");
  const [status, setStatus] = useState<
    | { kind: "idle" }
    | { kind: "saving" }
    | { kind: "saved"; at: number }
    | { kind: "error"; msg: string }
  >({ kind: "idle" });
  const [pending, startTransition] = useTransition();
  const rootRef = useRef<HTMLElement | null>(null);

  // Find `.landing-root` once on mount and remember it for live updates.
  useEffect(() => {
    rootRef.current = document.querySelector<HTMLElement>(".landing-root");
  }, []);

  // Apply palette + font changes live by rewriting the wrapper's CSS vars.
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    el.style.setProperty("--accent", accent);
    el.style.setProperty("--accent-deep", accentDeep);
    el.style.setProperty("--accent-soft", accentSoft);
    el.style.setProperty("--font-display", fontDisplay);
  }, [accent, accentDeep, accentSoft, fontDisplay]);

  const dirty =
    accent !== merged.accent ||
    accentDeep !== merged.accentDeep ||
    accentSoft !== merged.accentSoft ||
    fontDisplay !== merged.fontDisplay ||
    ctaCopy !== (initialTweaks.ctaCopy ?? "Add to cart");

  const reset = () => {
    setAccent(merged.accent);
    setAccentDeep(merged.accentDeep);
    setAccentSoft(merged.accentSoft);
    setFontDisplay(merged.fontDisplay);
    setCtaCopy(initialTweaks.ctaCopy ?? "Add to cart");
    setStatus({ kind: "idle" });
  };

  const save = () => {
    if (mode !== "persisted" || !previewSlug) {
      setStatus({ kind: "saved", at: Date.now() });
      return;
    }
    setStatus({ kind: "saving" });
    startTransition(async () => {
      const res = await saveOrderTweaks({
        previewSlug,
        tweaks: {
          accent,
          accentDeep,
          accentSoft,
          fontDisplay,
          ctaCopy,
        },
      });
      if (res.ok) {
        setStatus({ kind: "saved", at: Date.now() });
      } else {
        setStatus({ kind: "error", msg: res.error });
      }
    });
  };

  return (
    <>
      {/* Toggle pill (always visible) */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="tweaks-panel"
        style={{
          position: "fixed",
          right: 16,
          bottom: 16,
          zIndex: 9998,
          display: open ? "none" : "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 16px",
          borderRadius: 999,
          background: "#0a0a0a",
          color: "#fafaf7",
          border: "1px solid rgba(255,255,255,0.1)",
          fontFamily:
            '"JetBrains Mono", ui-monospace, monospace',
          fontSize: 11,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          fontWeight: 600,
          cursor: "pointer",
          boxShadow: "0 12px 32px rgba(0,0,0,0.25)",
        }}
      >
        <span
          style={{
            display: "inline-block",
            width: 6,
            height: 6,
            borderRadius: 999,
            background: "#6ee7a8",
          }}
        />
        Tweak
      </button>

      {/* Panel */}
      {open && (
        <aside
          id="tweaks-panel"
          aria-label="Tweaks panel"
          style={{
            position: "fixed",
            right: 16,
            bottom: 16,
            zIndex: 9999,
            width: 320,
            maxHeight: "calc(100vh - 32px)",
            display: "flex",
            flexDirection: "column",
            background: "rgba(250,247,241,0.94)",
            color: "#0f0e0d",
            backdropFilter: "blur(20px) saturate(160%)",
            WebkitBackdropFilter: "blur(20px) saturate(160%)",
            border: "1px solid rgba(0,0,0,0.06)",
            borderRadius: 14,
            boxShadow:
              "0 1px 0 rgba(255,255,255,0.5) inset, 0 24px 60px -20px rgba(0,0,0,0.30)",
            fontFamily:
              '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
            fontSize: 13,
            lineHeight: 1.4,
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <header
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 14px",
              borderBottom: "1px solid rgba(0,0,0,0.06)",
            }}
          >
            <div>
              <span
                style={{
                  fontFamily:
                    '"JetBrains Mono", ui-monospace, monospace',
                  fontSize: 10,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  color: "#807868",
                  fontWeight: 600,
                  display: "block",
                }}
              >
                {mode === "persisted" ? "Buyer tweaks" : "Try the tweaks"}
              </span>
              <strong style={{ fontSize: 14, fontWeight: 600 }}>Customize</strong>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              style={{
                appearance: "none",
                border: 0,
                background: "transparent",
                color: "rgba(15,14,13,0.5)",
                width: 26,
                height: 26,
                borderRadius: 6,
                cursor: "pointer",
                fontSize: 16,
                lineHeight: 1,
              }}
            >
              ×
            </button>
          </header>

          {/* Body */}
          <div
            style={{
              padding: 14,
              display: "flex",
              flexDirection: "column",
              gap: 14,
              overflowY: "auto",
              minHeight: 0,
            }}
          >
            <Section label="Palette">
              <ColorRow label="Accent" value={accent} onChange={setAccent} />
              <ColorRow label="Accent deep" value={accentDeep} onChange={setAccentDeep} />
              <ColorRow label="Accent soft" value={accentSoft} onChange={setAccentSoft} />
            </Section>

            <Section label="Type">
              <FieldRow label="Display font">
                <select
                  value={fontDisplay}
                  onChange={(e) => setFontDisplay(e.target.value)}
                  style={selectStyle}
                >
                  {FONT_PRESETS.some((p) => p.value === fontDisplay) ? null : (
                    <option value={fontDisplay}>(custom) {fontDisplay}</option>
                  )}
                  {FONT_PRESETS.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </FieldRow>
            </Section>

            <Section label="Copy">
              <FieldRow label="CTA button">
                <input
                  type="text"
                  value={ctaCopy}
                  maxLength={60}
                  onChange={(e) => setCtaCopy(e.target.value)}
                  placeholder="Add to cart"
                  style={inputStyle}
                />
              </FieldRow>
              <p style={{ color: "#807868", fontSize: 11, marginTop: -4 }}>
                Applies on next page load.
              </p>
            </Section>
          </div>

          {/* Footer */}
          <footer
            style={{
              padding: "10px 14px",
              borderTop: "1px solid rgba(0,0,0,0.06)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10,
              background: "rgba(255,255,255,0.4)",
            }}
          >
            <StatusLabel status={status} dirty={dirty} mode={mode} />
            <div style={{ display: "flex", gap: 6 }}>
              <button
                type="button"
                onClick={reset}
                disabled={!dirty}
                style={{
                  ...btnGhost,
                  opacity: dirty ? 1 : 0.4,
                  cursor: dirty ? "pointer" : "default",
                }}
              >
                Reset
              </button>
              <button
                type="button"
                onClick={save}
                disabled={!dirty || pending}
                style={{
                  ...btnPrimary,
                  opacity: dirty && !pending ? 1 : 0.4,
                  cursor: dirty && !pending ? "pointer" : "default",
                }}
              >
                {pending ? "Saving…" : "Save"}
              </button>
            </div>
          </footer>
        </aside>
      )}
    </>
  );
}

function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <span
        style={{
          fontFamily: '"JetBrains Mono", ui-monospace, monospace',
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "rgba(15,14,13,0.45)",
        }}
      >
        {label}
      </span>
      {children}
    </div>
  );
}

function ColorRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <FieldRow label={label}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <input
          type="color"
          value={normalizeHex(value)}
          onChange={(e) => onChange(e.target.value)}
          aria-label={`${label} swatch`}
          style={{
            appearance: "none",
            width: 28,
            height: 28,
            borderRadius: 6,
            border: "1px solid rgba(0,0,0,0.1)",
            padding: 0,
            cursor: "pointer",
            background: "transparent",
          }}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label={`${label} hex`}
          style={{ ...inputStyle, fontFamily: '"JetBrains Mono", monospace', flex: 1 }}
        />
      </div>
    </FieldRow>
  );
}

function FieldRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 5,
        color: "rgba(15,14,13,0.7)",
        fontSize: 12,
        fontWeight: 500,
      }}
    >
      {label}
      {children}
    </label>
  );
}

function StatusLabel({
  status,
  dirty,
  mode,
}: {
  status:
    | { kind: "idle" }
    | { kind: "saving" }
    | { kind: "saved"; at: number }
    | { kind: "error"; msg: string };
  dirty: boolean;
  mode: Mode;
}) {
  const base: React.CSSProperties = {
    fontFamily: '"JetBrains Mono", ui-monospace, monospace',
    fontSize: 10,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    fontWeight: 600,
  };
  if (status.kind === "saving")
    return <span style={{ ...base, color: "#807868" }}>Saving…</span>;
  if (status.kind === "saved")
    return <span style={{ ...base, color: "#1f5a40" }}>Saved ✓</span>;
  if (status.kind === "error")
    return <span style={{ ...base, color: "#b9261b" }}>{status.msg}</span>;
  if (dirty)
    return (
      <span style={{ ...base, color: "#b9261b" }}>
        {mode === "persisted" ? "Unsaved" : "Live preview"}
      </span>
    );
  return (
    <span style={{ ...base, color: "#807868" }}>
      {mode === "persisted" ? "All saved" : "Try a tweak"}
    </span>
  );
}

const selectStyle: React.CSSProperties = {
  appearance: "none",
  width: "100%",
  height: 30,
  padding: "0 10px",
  border: "1px solid rgba(0,0,0,0.1)",
  borderRadius: 7,
  background: "rgba(255,255,255,0.6)",
  color: "inherit",
  font: "inherit",
  outline: "none",
};

const inputStyle: React.CSSProperties = {
  appearance: "none",
  width: "100%",
  height: 30,
  padding: "0 10px",
  border: "1px solid rgba(0,0,0,0.1)",
  borderRadius: 7,
  background: "rgba(255,255,255,0.6)",
  color: "inherit",
  font: "inherit",
  outline: "none",
};

const btnPrimary: React.CSSProperties = {
  appearance: "none",
  border: 0,
  padding: "7px 14px",
  borderRadius: 999,
  background: "#0a0a0a",
  color: "#fafaf7",
  fontFamily: '"Inter", sans-serif',
  fontSize: 12,
  fontWeight: 600,
};

const btnGhost: React.CSSProperties = {
  ...btnPrimary,
  background: "transparent",
  color: "#0a0a0a",
  border: "1px solid rgba(0,0,0,0.12)",
};

function normalizeHex(v: string): string {
  // <input type=color> requires #rrggbb. For non-hex tokens (rgba, named) we
  // fall back to a neutral default but still let the text field hold the raw.
  return /^#[0-9a-fA-F]{6}$/.test(v) ? v : "#1f5a40";
}
