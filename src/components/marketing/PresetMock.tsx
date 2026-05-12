import type { ThemeCatalogEntry } from "@/lib/marketing/copy";

/**
 * CSS-rendered "screenshot" of a niche preset. Used in three places:
 *  - Hero stack (3 frames, tilted)
 *  - ThemeCatalog card front-thumb (the buy box view)
 *  - ThemeCatalog card back-thumb (the reviews/specs view), via `variant="back"`
 *
 * The visual palette is driven by `theme.presetClass` which selects one of the
 * `preset-skincare` / `preset-supplement` / `preset-gadget` rules in globals.css.
 */
export default function PresetMock({
  theme,
  variant = "front",
  showLabel = false,
  showChrome = true,
}: {
  theme: ThemeCatalogEntry;
  variant?: "front" | "back";
  showLabel?: boolean;
  showChrome?: boolean;
}) {
  return (
    <div className={`mk-frame-card ${theme.presetClass}`} aria-hidden>
      {showChrome && (
        <div className="mk-chrome">
          <span />
          <span />
          <span />
          <span className="mk-chrome-url">{theme.url}</span>
        </div>
      )}
      <div className="mk-mock">
        {variant === "front" ? (
          <FrontMock theme={theme} />
        ) : (
          <BackMock theme={theme} />
        )}
      </div>
      {showLabel && (
        <span className="mk-frame-label">
          {theme.niche} · {theme.name}
        </span>
      )}
    </div>
  );
}

function FrontMock({ theme }: { theme: ThemeCatalogEntry }) {
  return (
    <>
      <div className="mk-mock-ann">{theme.annText}</div>
      <div className="mk-mock-nav">
        <span className="mk-logo" />
        <span className="mk-l" />
        <span className="mk-l" />
        <span className="mk-l" />
        <span className="mk-cart" />
      </div>
      <div className="mk-mock-hero">
        <div className="mk-mock-gal" />
        <div className="mk-mock-info">
          <span className="mk-mock-pill">{theme.pillText}</span>
          <div className="mk-mock-h" />
          <div className="mk-mock-h short" />
          <div className="mk-mock-h mid" />
          <div className="mk-mock-h mid" style={{ width: "50%" }} />
          <div className="mk-mock-price">
            <b>${theme.price}</b>
            {theme.was && <s>${theme.was}</s>}
          </div>
          <div className="mk-mock-cta">
            {theme.ctaText} · ${theme.price}
          </div>
        </div>
      </div>

      {/* Below-the-fold preview — press strip + benefit tiles. Fills the frame
          to a believable page height without empty void space. */}
      <div className="mk-mock-divider" />
      <div className="mk-mock-press" aria-hidden>
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>
      <div className="mk-mock-tiles" aria-hidden>
        <div />
        <div />
        <div />
      </div>
    </>
  );
}

function BackMock({ theme }: { theme: ThemeCatalogEntry }) {
  if (theme.presetClass === "preset-supplement") {
    // Bundle picker view
    return (
      <>
        <div
          className="mk-mono"
          style={{
            color: "#00d57a",
            marginTop: 8,
            marginBottom: 6,
            fontSize: 9,
          }}
        >
          Bundle &amp; Save
        </div>
        <div style={{ display: "grid", gap: 6 }}>
          <div
            style={{
              height: 32,
              borderRadius: 6,
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.10)",
            }}
          />
          <div
            style={{
              height: 32,
              borderRadius: 6,
              background: "rgba(0,213,122,0.15)",
              border: "1px solid #00d57a",
            }}
          />
          <div
            style={{
              height: 32,
              borderRadius: 6,
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.10)",
            }}
          />
        </div>
        <div className="mk-mock-cta" style={{ marginTop: 8 }}>
          START SUBSCRIPTION
        </div>
      </>
    );
  }
  if (theme.presetClass === "preset-gadget") {
    // Spec table view
    return (
      <>
        <div
          className="mk-mono"
          style={{
            color: "#0066ff",
            marginTop: 8,
            marginBottom: 6,
            fontSize: 9,
          }}
        >
          Tech specs
        </div>
        <div style={{ display: "grid", gap: 4 }}>
          {[
            [50, 30],
            [60, 40],
            [40, 50],
            [70, 30],
          ].map(([k, v], i) => (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "4px 0",
                borderBottom: i < 3 ? "1px solid #eee" : undefined,
              }}
            >
              <div
                className="mk-mock-h"
                style={{ height: 6, width: `${k}px` }}
              />
              <div
                className="mk-mock-h"
                style={{ height: 6, width: `${v}px` }}
              />
            </div>
          ))}
        </div>
      </>
    );
  }
  // Skincare default — reviews tile grid
  return (
    <>
      <div
        className="mk-mono"
        style={{
          color: "var(--p-cta)",
          marginTop: 8,
          marginBottom: 6,
          fontSize: 9,
        }}
      >
        487 verified reviews
      </div>
      <div className="mk-mock-h" />
      <div className="mk-mock-h short" />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 8,
          marginTop: 8,
        }}
      >
        <div
          style={{
            aspectRatio: "1",
            borderRadius: 6,
            background: "linear-gradient(135deg, #f5e6d6, #c9a37a)",
          }}
        />
        <div
          style={{
            aspectRatio: "1",
            borderRadius: 6,
            background: "linear-gradient(135deg, #c9a37a, #f5e6d6)",
          }}
        />
        <div
          style={{
            aspectRatio: "1",
            borderRadius: 6,
            background: "linear-gradient(135deg, #f5e6d6, #c9a37a)",
          }}
        />
      </div>
    </>
  );
}
