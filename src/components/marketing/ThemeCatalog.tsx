import Section from "./Section";
import Reveal from "./Reveal";
import PresetMock from "./PresetMock";
import { THEME_CATALOG, priceLabel } from "@/lib/marketing/copy";

/**
 * Map preset slug → theme slug. The home-page card shows a niche preset, but
 * clicking lands the buyer on the sellable Theme record (a 1:1 wrapper around
 * the preset with versioning + screenshots + pricing). Kept inline rather than
 * fetched at request-time because the home page is heavily cached.
 */
const PRESET_TO_THEME: Record<string, string> = {
  skincare: "skincare-orelle",
  supplement: "supplement-vitalstack",
  gadget: "gadget-aurabud",
};

/**
 * The catalog — Option A's centerpiece.
 * One card per niche preset. Hover crossfades to a second mock view.
 * Price + 69/69 chip + Live demo link on every card.
 *
 * When `LayoutPreset` rows seed in Phase 3, this component reads from the DB
 * and the static THEME_CATALOG goes away. Card structure stays.
 */
export default function ThemeCatalog() {
  return (
    <Section
      id="themes"
      eyebrow="The catalog · launch lineup"
      title="Three niche presets. One system underneath."
      intro="Same 20 components. Same 7-block anatomy. Different palette, different copy, different demo seed — picked to match the category your buyer is in."
    >
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {THEME_CATALOG.map((theme, i) => (
          <Reveal key={theme.slug} delay={i * 80}>
            <a
              href={`/themes/${PRESET_TO_THEME[theme.slug] ?? theme.slug}`}
              className="mk-theme-card"
              aria-label={`${theme.name} — ${theme.niche} preset`}
            >
              <div className={`mk-theme-thumbs ${theme.presetClass}`}>
                <div className="mk-theme-thumb mk-theme-thumb-front">
                  <PresetMock theme={theme} variant="front" showChrome />
                </div>
                <div className="mk-theme-thumb mk-theme-thumb-back">
                  <PresetMock theme={theme} variant="back" showChrome />
                </div>
              </div>
              <div className="mk-theme-body">
                <div className="mk-theme-row1">
                  <h3>{theme.name}</h3>
                  <span className="mk-badge mk-badge-cov">69 / 69 rules</span>
                </div>
                <p className="mk-theme-pos">{theme.positioning}</p>
                <div className="mk-badges">
                  {theme.badges.map((b) => (
                    <span key={b} className="mk-badge">
                      {b}
                    </span>
                  ))}
                </div>
                <div className="mk-theme-foot">
                  <div className="mk-theme-price">
                    {priceLabel(theme.priceSingleCents)}{" "}
                    <span>· single store</span>
                  </div>
                  <div className="mk-theme-actions">
                    <span aria-hidden>Live demo ↗</span>
                  </div>
                </div>
              </div>
            </a>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
