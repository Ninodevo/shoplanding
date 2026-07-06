import { ImageResponse } from "next/og";

/**
 * Default site-wide Open Graph image. Next 16 reads this from
 * /opengraph-image.tsx and serves it at /opengraph-image at 1200x630
 * — Facebook/X/LinkedIn/iMessage all pick it up via the OG meta tags
 * the framework auto-injects.
 *
 * Programmatic so we never have to open Figma. Renders the headline +
 * the three niches stacked — the same beats as the hero. If we later
 * want per-page OG images (e.g. theme detail with the actual theme
 * name), add per-route opengraph-image.tsx files.
 */
export const runtime = "edge";
export const contentType = "image/png";
export const size = { width: 1200, height: 630 };
export const alt = "ShopLanding — A high-converting product page, live this weekend.";

const BG = "#0a1810";
const ACCENT = "#00a85f";
const ACCENT_SOFT = "#1d3a2a";
const INK = "#f4f4f3";
const INK_2 = "#a8b3ad";
const LINE = "#1d2925";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: BG,
          color: INK,
          padding: "72px 80px",
          fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        }}
      >
        {/* Top: brand mark + eyebrow */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              background: INK,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div style={{ width: 14, height: 14, borderRadius: 3, background: ACCENT }} />
          </div>
          <div style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-0.01em" }}>
            ShopLanding
          </div>
          <div
            style={{
              marginLeft: "auto",
              fontSize: 14,
              fontFamily: "ui-monospace, Menlo, monospace",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: INK_2,
            }}
          >
            7 blocks · 69 rules · 20 components
          </div>
        </div>

        {/* Middle: the headline */}
        <div
          style={{
            marginTop: 80,
            fontSize: 72,
            fontWeight: 700,
            lineHeight: 1.05,
            letterSpacing: "-0.025em",
            maxWidth: 980,
          }}
        >
          A high-converting product page,
          <br />
          <span style={{ color: ACCENT }}>live this weekend.</span>
        </div>

        <div
          style={{
            marginTop: 24,
            fontSize: 26,
            color: INK_2,
            maxWidth: 880,
            lineHeight: 1.4,
          }}
        >
          Shopify themes built on 69 documented CRO rules.
        </div>

        {/* Bottom: three niche pills + price */}
        <div
          style={{
            marginTop: "auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", gap: 12 }}>
            {["Skincare", "Supplement", "Gadget"].map((n) => (
              <div
                key={n}
                style={{
                  padding: "10px 20px",
                  borderRadius: 9999,
                  background: ACCENT_SOFT,
                  color: ACCENT,
                  fontSize: 20,
                  fontWeight: 600,
                  border: `1px solid ${LINE}`,
                }}
              >
                {n}
              </div>
            ))}
          </div>
          <div
            style={{
              fontSize: 22,
              color: INK,
              fontFamily: "ui-monospace, Menlo, monospace",
            }}
          >
            €99 once · lifetime updates
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
