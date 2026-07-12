/**
 * Measured signals from the rendered-browser pass (deep audit only).
 * Each probe answers a rule the static HTML fundamentally can't: geometry
 * ("gallery left, buy box right"), computed style (title prominence, body
 * readability), and interaction (does the price actually change when you
 * click a variant?). Every field is best-effort — null/false means "the
 * probe couldn't tell", never "verified absent".
 */
export type RenderedProbes = {
  /** Computed font size of the main H1 vs. paragraph text. */
  h1FontPx: number | null;
  bodyFontPx: number | null;

  /**
   * Desktop hero geometry: gallery and buy box side by side, gallery on
   * the left (the convention every big PDP follows). Null when either
   * element couldn't be located.
   */
  layout: { sideBySide: boolean; galleryLeft: boolean } | null;

  /** Pixel distance from the rating widget to the H1 (null = no widget found). */
  ratingDistancePx: number | null;

  /** A checkmark/bullet benefit list within ~400px below the title. */
  benefitsNearTitle: boolean;

  /** Visible prev/next controls inside the gallery region. */
  galleryArrows: boolean;

  /** Slider library detected (Swiper/Flickity/…) — implies swipe support. */
  sliderLib: string | null;

  /** Zoom affordance (zoom/photoswipe/magnifier markers). */
  zoomMarkers: boolean;

  /** Quantity control style near the ATC button. */
  qtyControl: "stepper" | "dropdown" | "input" | null;

  /** Longest description paragraph: measured readability inputs. */
  descriptionTypography: {
    fontPx: number;
    lineHeightRatio: number;
    charsPerLine: number;
  } | null;

  /** Accordion-style sections (details / aria-expanded toggles). */
  accordionCount: number;

  /** Reviews section background differs from the page background. */
  reviewsBgDistinct: boolean | null;

  /** After scrolling: a fixed/sticky bar containing an add-to-cart control. */
  stickyBarWithAtc: boolean;

  /**
   * Interaction: pick a different variant, watch price + main image.
   * optionsFound 0 = single-variant product (rules become n/a).
   */
  variantProbe: {
    optionsFound: number;
    clicked: boolean;
    priceChanged: boolean;
    imageChanged: boolean;
  } | null;

  /**
   * Interaction (always last — may navigate away): click add-to-cart and
   * classify what happened.
   */
  atcProbe: {
    clicked: boolean;
    outcome: "checkout" | "cart-page" | "drawer" | "none";
  } | null;
};

export const EMPTY_PROBES: RenderedProbes = {
  h1FontPx: null,
  bodyFontPx: null,
  layout: null,
  ratingDistancePx: null,
  benefitsNearTitle: false,
  galleryArrows: false,
  sliderLib: null,
  zoomMarkers: false,
  qtyControl: null,
  descriptionTypography: null,
  accordionCount: 0,
  reviewsBgDistinct: null,
  stickyBarWithAtc: false,
  variantProbe: null,
  atcProbe: null,
};
