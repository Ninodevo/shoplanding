import JSZip from "jszip";
import {
  ARTIFACT_FILENAME,
  type PackagerInput,
  type PackagerOutput,
} from "./types";
import { packageSpec } from "./spec";
import {
  SECTIONS_CSS,
  buildSectionTemplateEntries,
  sectionBenefits,
  sectionComparison,
  sectionCrossSell,
  sectionFaq,
  sectionFounder,
  sectionHowItWorks,
  sectionIngredients,
  sectionPress,
  sectionReviews,
  sectionSpecs,
  sectionUgc,
} from "./shopify-sections";

/**
 * Shopify theme emitter — Phase 15: all 17 sections real, zero stubs.
 *
 * Generates a Shopify CLI 3 compatible theme that installs cleanly via
 * Online Store → Themes → Add theme → Upload zip.
 *
 * Content flow:
 *   - Palette + fonts → `config/settings_data.json` (theme settings).
 *   - Section copy, reviews, FAQ, specs, comparison rows … → baked into
 *     `templates/product.json` (OS 2.0 JSON templates override schema
 *     defaults, so the page renders fully populated on install).
 *   - Section `.liquid` files stay content-agnostic with generic schema
 *     defaults, so "Add section" in the editor works on any store.
 *
 * Sections: announcement-bar · header · hero-product · press · benefits ·
 * how-it-works · comparison · ingredients · reviews · ugc · cross-sell ·
 * founder · specs · faq · final-cta · footer · sticky-atc
 */
export async function packageShopify(
  input: PackagerInput,
): Promise<PackagerOutput> {
  const zip = new JSZip();

  // ── layout
  zip.file("layout/theme.liquid", buildThemeLiquid(input));

  // ── templates
  zip.file("templates/product.json", buildProductTemplate(input));
  zip.file("templates/index.json", buildIndexTemplate());
  zip.file("templates/404.liquid", build404());

  // ── sections (real)
  zip.file("sections/announcement-bar.liquid", sectionAnnouncementBar(input));
  zip.file("sections/header.liquid", sectionHeader(input));
  zip.file("sections/hero-product.liquid", sectionHeroProduct(input));
  zip.file("sections/footer.liquid", sectionFooter(input));
  zip.file("sections/sticky-atc.liquid", sectionStickyAtc(input));

  // ── sections (content sections — real Liquid, seeded via product.json)
  zip.file("sections/press.liquid", sectionPress());
  zip.file("sections/benefits.liquid", sectionBenefits());
  zip.file("sections/how-it-works.liquid", sectionHowItWorks());
  zip.file("sections/comparison.liquid", sectionComparison());
  zip.file("sections/ingredients.liquid", sectionIngredients());
  zip.file("sections/reviews.liquid", sectionReviews());
  zip.file("sections/ugc.liquid", sectionUgc());
  zip.file("sections/cross-sell.liquid", sectionCrossSell());
  zip.file("sections/founder.liquid", sectionFounder());
  zip.file("sections/specs.liquid", sectionSpecs());
  zip.file("sections/faq.liquid", sectionFaq());
  zip.file("sections/final-cta.liquid", sectionFinalCta(input));

  // ── snippets
  zip.file("snippets/price.liquid", snippetPrice());

  // ── assets
  zip.file("assets/theme.css", buildThemeCss(input));
  zip.file("assets/theme.js", buildThemeJs());

  // ── config
  zip.file("config/settings_schema.json", buildSettingsSchema());
  zip.file("config/settings_data.json", buildSettingsData(input));

  // ── locales
  zip.file("locales/en.default.json", buildLocales(input));

  // ── meta
  zip.file("README.md", buildReadme(input));
  zip.file("LICENSE.txt", buildLicense(input));

  // ── bundle the system spec inside for traceability + non-Shopify reuse
  const spec = await packageSpec(input);
  zip.file(`spec/${spec.filename}`, spec.bytes);

  const bytes = await zip.generateAsync({
    type: "uint8array",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });

  return {
    filename: ARTIFACT_FILENAME.shopify(input.presetSlug),
    contentType: "application/zip",
    bytes,
  };
}

// ============================================================================
// layout/theme.liquid
// ============================================================================
function buildThemeLiquid(input: PackagerInput): string {
  const brand = escapeLiquid(input.content.brand.name);
  return `<!doctype html>
<html lang="{{ request.locale.iso_code }}">
  <head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="theme-color" content="{{ settings.color_accent }}">
    <link rel="canonical" href="{{ canonical_url }}">

    {%- if settings.font_display contains 'Inter' or settings.font_body contains 'Inter' -%}
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
    {%- endif -%}

    <title>{{ page_title }}{% if current_tags %} – tagged "{{ current_tags | join: ', ' }}"{% endif %}{% if current_page != 1 %} – Page {{ current_page }}{% endif %}{% unless page_title contains shop.name %} – {{ shop.name }}{% endunless %}</title>

    {%- if page_description -%}<meta name="description" content="{{ page_description | escape }}">{%- endif -%}

    {{ content_for_header }}

    <link rel="stylesheet" href="{{ 'theme.css' | asset_url }}">
    <style>
      :root {
        --accent: {{ settings.color_accent }};
        --accent-deep: {{ settings.color_accent_deep }};
        --accent-soft: {{ settings.color_accent_soft }};
        --bg: {{ settings.color_bg }};
        --surface: {{ settings.color_surface }};
        --card: {{ settings.color_card }};
        --ink: {{ settings.color_ink }};
        --ink-2: {{ settings.color_ink_2 }};
        --muted: {{ settings.color_muted }};
        --line: {{ settings.color_line }};
        --font-display: {{ settings.font_display }};
        --font-body: {{ settings.font_body }};
        --font-mono: {{ settings.font_mono }};
      }
    </style>
  </head>
  <body class="template-{{ template | replace: '.', ' ' | truncatewords: 1, '' | handle }}">
    <a class="skip-to-content" href="#MainContent">Skip to content</a>
    {% section 'announcement-bar' %}
    {% section 'header' %}
    <main id="MainContent" role="main">
      {{ content_for_layout }}
    </main>
    {% section 'footer' %}
    {% section 'sticky-atc' %}
    <script src="{{ 'theme.js' | asset_url }}" defer></script>
    <!-- ShopLanding theme · ${escapeHtml(brand)} · v${input.version} · preset:${input.presetSlug} -->
  </body>
</html>
`;
}

// ============================================================================
// templates/product.json — defines the section order for product pages
// ============================================================================
function buildProductTemplate(input: PackagerInput): string {
  // The buyer's seeded content (reviews, FAQ, specs, comparison rows …)
  // lands here — OS 2.0 template JSON overrides schema defaults, so the
  // page renders fully populated the moment the theme is installed.
  return JSON.stringify(
    {
      sections: {
        "hero-product": { type: "hero-product", settings: {} },
        ...buildSectionTemplateEntries(input),
        "final-cta": { type: "final-cta", settings: {} },
      },
      order: [
        "hero-product",
        "press",
        "benefits",
        "how-it-works",
        "comparison",
        "ingredients",
        "reviews",
        "ugc",
        "cross-sell",
        "founder",
        "specs",
        "faq",
        "final-cta",
      ],
    },
    null,
    2,
  );
}

function buildIndexTemplate(): string {
  // Single-product theme — homepage just redirects to the featured product.
  return JSON.stringify(
    {
      sections: {
        "hero-product": { type: "hero-product", settings: {} },
      },
      order: ["hero-product"],
    },
    null,
    2,
  );
}

function build404(): string {
  return `<section class="sl-404">
  <div class="sl-container">
    <h1 class="sl-display">Page not found.</h1>
    <p>That URL doesn't exist on this store. <a href="{{ shop.url }}">Back to home →</a></p>
  </div>
</section>
`;
}

// ============================================================================
// sections/announcement-bar.liquid
// ============================================================================
function sectionAnnouncementBar(input: PackagerInput): string {
  // Dedupe the seed's announce lines against each other + our fallbacks so
  // the ticker never repeats a message (caught rendering live: skincare's
  // announce[1] duplicated the hardcoded guarantee line).
  const fallbacks = [
    "Free shipping on orders $35+",
    "30-day money-back guarantee",
    "One product. One decision.",
  ];
  const lines = [...new Set([...input.content.announce, ...fallbacks])].slice(0, 3);
  const text = escapeLiquid(lines[0]!);
  return `<div class="sl-announce">
  <div class="sl-announce-track">
    {%- for block in section.blocks -%}
      <span class="sl-announce-item">
        <span class="sl-pip"></span>{{ block.settings.text }}
      </span>
    {%- endfor -%}
  </div>
</div>

{% schema %}
{
  "name": "Announcement bar",
  "tag": "section",
  "class": "sl-announce-section",
  "max_blocks": 6,
  "blocks": [
    {
      "type": "message",
      "name": "Message",
      "settings": [
        { "type": "text", "id": "text", "label": "Text", "default": "${text}" }
      ]
    }
  ],
  "default": {
    "blocks": [
      { "type": "message", "settings": { "text": "${text}" } },
      { "type": "message", "settings": { "text": "${escapeLiquid(lines[1]!)}" } },
      { "type": "message", "settings": { "text": "${escapeLiquid(lines[2]!)}" } }
    ]
  }
}
{% endschema %}
`;
}

// ============================================================================
// sections/header.liquid
// ============================================================================
function sectionHeader(input: PackagerInput): string {
  return `<header class="sl-nav">
  <div class="sl-container sl-nav-inner">
    <div class="sl-nav-links">
      {%- for link in section.settings.menu.links -%}
        <a href="{{ link.url }}">{{ link.title }}</a>
      {%- endfor -%}
    </div>
    <a href="{{ shop.url }}" class="sl-logo">{{ shop.name | downcase }}.</a>
    <div class="sl-nav-actions">
      <a href="{{ routes.search_url }}" aria-label="Search" class="sl-icon-btn">⌕</a>
      <a href="{{ routes.account_url }}" aria-label="Account" class="sl-icon-btn">◐</a>
      <a href="{{ routes.cart_url }}" aria-label="Cart" class="sl-icon-btn sl-cart-btn">
        ⊞ {%- if cart.item_count > 0 -%}<span class="sl-cart-count">{{ cart.item_count }}</span>{%- endif -%}
      </a>
    </div>
  </div>
</header>

{% schema %}
{
  "name": "Header",
  "tag": "section",
  "class": "sl-header-section",
  "settings": [
    {
      "type": "link_list",
      "id": "menu",
      "label": "Menu",
      "default": "main-menu",
      "info": "Single-product themes use a minimal nav. Recommended: Shop, How it works, Reviews, FAQ — all on-page anchors."
    }
  ]
}
{% endschema %}
`;
}

// ============================================================================
// sections/hero-product.liquid — the buy box
// ============================================================================
function sectionHeroProduct(input: PackagerInput): string {
  const subtitle = escapeLiquid(input.content.product.subtitle);
  return `{%- assign product = product -%}
{%- if product == blank -%}
  {%- assign product = all_products[section.settings.featured_product] -%}
{%- endif -%}
{%- assign current_variant = product.selected_or_first_available_variant -%}

<section class="sl-product" data-section-type="hero-product">
  <div class="sl-container sl-product-grid">
    <!-- Gallery -->
    <div class="sl-gallery">
      <div class="sl-gallery-main">
        {%- comment -%} product can be an empty drop (all_products[""] on a
        store with no products) whose featured_image passes a bare truthiness
        check but blows up image_url — hence the explicit != blank guards.
        Caught on a live store; do not simplify. {%- endcomment -%}
        {%- if product != blank and product.featured_image != blank -%}
          {{ product.featured_image | image_url: width: 1200 | image_tag: alt: product.title, loading: 'eager', class: 'sl-gallery-img' }}
        {%- else -%}
          <div class="sl-gallery-placeholder">{{ product.title | default: "Product image" }}</div>
        {%- endif -%}
        {%- if product.compare_at_price > product.price -%}
          <span class="sl-gallery-badge sale">
            {{- product.compare_at_price | minus: product.price | times: 100.0 | divided_by: product.compare_at_price | round -}}% OFF
          </span>
        {%- endif -%}
      </div>
      {%- if product.images.size > 1 -%}
        <div class="sl-gallery-thumbs">
          {%- for image in product.images limit: 5 -%}
            <button class="sl-thumb" type="button" data-index="{{ forloop.index0 }}" aria-label="Image {{ forloop.index }}">
              {{ image | image_url: width: 200 | image_tag: alt: '', loading: 'lazy' }}
            </button>
          {%- endfor -%}
        </div>
      {%- endif -%}
    </div>

    <!-- Buy box -->
    <div class="sl-info">
      {%- if product.collections.first -%}
        <div class="sl-crumb sl-mono">{{ product.collections.first.title }}</div>
      {%- endif -%}
      <h1 class="sl-display sl-title">{{ product.title }}</h1>
      {%- if section.settings.subtitle != blank -%}
        <p class="sl-subtitle">{{ section.settings.subtitle }}</p>
      {%- endif -%}

      {%- if section.settings.show_rating -%}
        <div class="sl-rating">
          <span class="sl-stars">★★★★★</span>
          <a href="#reviews" class="sl-rating-link">{{ section.settings.rating }} · Read {{ section.settings.review_count }} reviews</a>
        </div>
      {%- endif -%}

      {%- if section.settings.benefits != blank -%}
        <ul class="sl-key-benefits">
          {%- assign rows = section.settings.benefits | newline_to_br | split: '<br />' -%}
          {%- for row in rows -%}
            {%- assign clean = row | strip -%}
            {%- if clean != blank -%}<li><span class="sl-check">✓</span><span>{{ clean }}</span></li>{%- endif -%}
          {%- endfor -%}
        </ul>
      {%- endif -%}

      <!-- Price -->
      <div class="sl-price-block">
        <div class="sl-price-row">
          <span class="sl-price-current" data-current-price>{{ current_variant.price | money }}</span>
          {%- if current_variant.compare_at_price > current_variant.price -%}
            <s class="sl-price-was" data-compare-price>{{ current_variant.compare_at_price | money }}</s>
            {%- assign save_pct = current_variant.compare_at_price | minus: current_variant.price | times: 100.0 | divided_by: current_variant.compare_at_price | round -%}
            <span class="sl-price-save">SAVE {{ save_pct }}%</span>
          {%- endif -%}
        </div>
      </div>

      <!-- Variants -->
      {%- unless product.has_only_default_variant -%}
        <form action="{{ routes.cart_add_url }}" method="post" class="sl-form" data-product-form>
          {%- for option in product.options_with_values -%}
            <div class="sl-variant-block">
              <div class="sl-variant-label">
                <span>{{ option.name }}</span>
                <span class="sl-selected" data-option-name="{{ option.name }}">{{ option.selected_value }}</span>
              </div>
              <div class="sl-variant-options" role="radiogroup" aria-label="{{ option.name }}">
                {%- for value in option.values -%}
                  <label class="sl-variant-pill {% if value == option.selected_value %}is-active{% endif %}">
                    <input type="radio" name="options[{{ option.name }}]" value="{{ value | escape }}"
                           {% if value == option.selected_value %}checked{% endif %}
                           data-option-position="{{ option.position }}">
                    <span>{{ value }}</span>
                  </label>
                {%- endfor -%}
              </div>
            </div>
          {%- endfor -%}

          <input type="hidden" name="id" value="{{ current_variant.id }}" data-variant-id>

          <!-- Qty + ATC -->
          <div class="sl-qty-atc">
            <div class="sl-qty">
              <button type="button" data-qty-step="-1" aria-label="Decrease">−</button>
              <input type="number" name="quantity" value="1" min="1" inputmode="numeric" data-qty>
              <button type="button" data-qty-step="1" aria-label="Increase">+</button>
            </div>
            <button type="submit" class="sl-btn sl-btn-primary sl-atc">
              ⊞ {{ section.settings.cta_label | default: 'Add to cart' }}
              <span data-running-total>{{ current_variant.price | money }}</span>
            </button>
          </div>
        </form>
      {%- else -%}
        <form action="{{ routes.cart_add_url }}" method="post" class="sl-form">
          <input type="hidden" name="id" value="{{ current_variant.id }}">
          <div class="sl-qty-atc">
            <div class="sl-qty">
              <button type="button" data-qty-step="-1" aria-label="Decrease">−</button>
              <input type="number" name="quantity" value="1" min="1" inputmode="numeric" data-qty>
              <button type="button" data-qty-step="1" aria-label="Increase">+</button>
            </div>
            <button type="submit" class="sl-btn sl-btn-primary sl-atc">
              ⊞ {{ section.settings.cta_label | default: 'Add to cart' }}
              <span>{{ current_variant.price | money }}</span>
            </button>
          </div>
        </form>
      {%- endunless -%}

      <!-- Trust mini -->
      {%- if section.settings.show_trust_row -%}
        <div class="sl-trust-mini">
          <div class="sl-trust-item">📦 Free shipping over {{ section.settings.free_ship_threshold }}</div>
          <div class="sl-trust-item">🔒 Secure checkout</div>
          <div class="sl-trust-item">↩ 30-day refund</div>
          <div class="sl-trust-item">💛 1% to charity</div>
        </div>
      {%- endif -%}
    </div>
  </div>
</section>

{%- if product != blank -%}
<script type="application/ld+json">
{
  "@context": "https://schema.org/",
  "@type": "Product",
  "name": {{ product.title | json }},
  {%- if product.featured_image != blank -%}
  "image": [{{ product.featured_image | image_url: width: 1200 | json }}],
  {%- endif -%}
  "description": {{ product.description | strip_html | json }},
  "brand": { "@type": "Brand", "name": {{ shop.name | json }} },
  "offers": {
    "@type": "Offer",
    "url": {{ shop.url | append: product.url | json }},
    "priceCurrency": {{ cart.currency.iso_code | json }},
    "price": {{ current_variant.price | divided_by: 100.0 | json }},
    "availability": "{% if current_variant.available %}https://schema.org/InStock{% else %}https://schema.org/OutOfStock{% endif %}"
  }
}
</script>
{%- endif -%}

{% schema %}
{
  "name": "Hero · product buy box",
  "tag": "section",
  "class": "sl-hero-section",
  "settings": [
    {
      "type": "header",
      "content": "Above the fold copy"
    },
    {
      "type": "textarea",
      "id": "subtitle",
      "label": "Subtitle",
      "default": "${subtitle}"
    },
    {
      "type": "textarea",
      "id": "benefits",
      "label": "Key benefits (one per line)",
      "default": "${input.content.product.keyBenefits.map((b) => escapeLiquid(b)).join("\\n")}"
    },
    {
      "type": "header",
      "content": "Rating"
    },
    {
      "type": "checkbox",
      "id": "show_rating",
      "label": "Show rating",
      "default": true
    },
    {
      "type": "text",
      "id": "rating",
      "label": "Rating value",
      "default": "${input.content.product.rating}"
    },
    {
      "type": "text",
      "id": "review_count",
      "label": "Review count",
      "default": "${input.content.product.reviewCount}"
    },
    {
      "type": "header",
      "content": "Buy button"
    },
    {
      "type": "text",
      "id": "cta_label",
      "label": "CTA label",
      "default": "${escapeLiquid(input.tweaks?.ctaCopy ?? "Add to cart")}"
    },
    {
      "type": "header",
      "content": "Trust row"
    },
    {
      "type": "checkbox",
      "id": "show_trust_row",
      "label": "Show trust mini",
      "default": true
    },
    {
      "type": "text",
      "id": "free_ship_threshold",
      "label": "Free-shipping threshold",
      "default": "$35"
    },
    {
      "type": "header",
      "content": "Featured product (homepage only)"
    },
    {
      "type": "product",
      "id": "featured_product",
      "label": "Product"
    }
  ],
  "presets": [{ "name": "Hero · product" }]
}
{% endschema %}
`;
}

// ============================================================================
// sections/footer.liquid
// ============================================================================
function sectionFooter(input: PackagerInput): string {
  const tagline = escapeLiquid(input.content.brand.tagline);
  return `<footer class="sl-footer">
  <div class="sl-container">
    <div class="sl-footer-grid">
      <div class="sl-footer-brand">
        <div class="sl-logo">{{ shop.name | downcase }}.</div>
        <p>{{ section.settings.tagline }}</p>
      </div>
      {%- for block in section.blocks -%}
        {%- if block.type == 'column' -%}
          <div {{ block.shopify_attributes }}>
            <h4>{{ block.settings.heading }}</h4>
            <ul>
              {%- assign rows = block.settings.links | newline_to_br | split: '<br />' -%}
              {%- for row in rows -%}
                {%- assign clean = row | strip -%}
                {%- if clean != blank -%}<li><a href="#">{{ clean }}</a></li>{%- endif -%}
              {%- endfor -%}
            </ul>
          </div>
        {%- endif -%}
      {%- endfor -%}
    </div>

    <div class="sl-footer-pay">
      <span class="sl-mono">We accept</span>
      <div class="sl-pay-icons">
        {%- for type in shop.enabled_payment_types -%}
          {{ type | payment_type_svg_tag: class: 'sl-pay-icon' }}
        {%- endfor -%}
      </div>
    </div>

    <div class="sl-footer-bottom">
      <span>© {{ 'now' | date: '%Y' }} {{ shop.name }} · All rights reserved</span>
      <a href="#top" class="sl-back-top">↑ Back to top</a>
    </div>
  </div>
</footer>

{% schema %}
{
  "name": "Footer",
  "tag": "section",
  "class": "sl-footer-section",
  "max_blocks": 4,
  "settings": [
    {
      "type": "textarea",
      "id": "tagline",
      "label": "Tagline",
      "default": "${tagline}"
    }
  ],
  "blocks": [
    {
      "type": "column",
      "name": "Link column",
      "settings": [
        { "type": "text", "id": "heading", "label": "Heading", "default": "Shop" },
        { "type": "textarea", "id": "links", "label": "Links (one per line)", "default": "All products\\nBundles\\nGift cards" }
      ]
    }
  ],
  "default": {
    "blocks": [
      { "type": "column", "settings": { "heading": "Shop", "links": "All products\\nBundles\\nSubscriptions" } },
      { "type": "column", "settings": { "heading": "Help", "links": "FAQ\\nShipping\\nReturns\\nContact" } },
      { "type": "column", "settings": { "heading": "About", "links": "Our story\\nIngredients\\nSustainability" } }
    ]
  }
}
{% endschema %}
`;
}

// ============================================================================
// sections/sticky-atc.liquid
// ============================================================================
function sectionStickyAtc(_input: PackagerInput): string {
  return `{%- if template contains 'product' -%}
{%- assign current_variant = product.selected_or_first_available_variant -%}
<div class="sl-sticky-atc" data-sticky-atc role="complementary" aria-label="Sticky add to cart">
  <div class="sl-container sl-sticky-inner">
    <div class="sl-sticky-info">
      {%- if product.featured_image -%}
        {{ product.featured_image | image_url: width: 100 | image_tag: alt: '', class: 'sl-sticky-thumb' }}
      {%- endif -%}
      <div>
        <div class="sl-sticky-title">{{ product.title }}</div>
        <div class="sl-sticky-meta">
          {{ current_variant.price | money }} · ⭐ {{ section.settings.rating }}
        </div>
      </div>
    </div>
    <a href="#shop" class="sl-btn sl-btn-primary">{{ section.settings.cta_label }}</a>
  </div>
</div>
{%- endif -%}

{% schema %}
{
  "name": "Sticky ATC",
  "settings": [
    { "type": "text", "id": "cta_label", "label": "CTA label", "default": "Add to cart →" },
    { "type": "text", "id": "rating", "label": "Rating", "default": "4.8" }
  ]
}
{% endschema %}
`;
}

// ============================================================================
// sections/final-cta.liquid (lightly real — single-tier closer)
// ============================================================================
function sectionFinalCta(input: PackagerInput): string {
  return `<section class="sl-final-cta">
  <div class="sl-container">
    <p class="sl-mono sl-final-eyebrow">{{ section.settings.eyebrow }}</p>
    <h2 class="sl-display">{{ section.settings.headline }}</h2>
    <p class="sl-final-sub">{{ section.settings.sub }}</p>
    <a href="#shop" class="sl-btn sl-btn-primary sl-btn-lg">{{ section.settings.cta_label }} →</a>
  </div>
</section>

{% schema %}
{
  "name": "Final CTA",
  "tag": "section",
  "class": "sl-final-section",
  "settings": [
    { "type": "text", "id": "eyebrow", "label": "Eyebrow", "default": "Ready when you are" },
    { "type": "text", "id": "headline", "label": "Headline", "default": "Try it. Refund if you don't love it." },
    { "type": "textarea", "id": "sub", "label": "Sub", "default": "30-day money-back guarantee. Free shipping. Cancel anytime." },
    { "type": "text", "id": "cta_label", "label": "CTA label", "default": "${escapeLiquid(input.tweaks?.ctaCopy ?? "Shop now")}" }
  ],
  "presets": [{ "name": "Final CTA" }]
}
{% endschema %}
`;
}

// (The v1 `sectionStub` factory is gone — every content section is real
// Liquid now, built in ./shopify-sections.ts and seeded via product.json.)

// ============================================================================
// snippets/price.liquid
// ============================================================================
function snippetPrice(): string {
  return `{%- assign target = price | default: product.price -%}
{%- assign compare = compare_at_price | default: product.compare_at_price -%}
<span class="sl-price-row">
  <span class="sl-price-current">{{ target | money }}</span>
  {%- if compare > target -%}
    <s class="sl-price-was">{{ compare | money }}</s>
  {%- endif -%}
</span>
`;
}

// ============================================================================
// assets/theme.css — focused subset of the renderer's CSS, ~280 lines
// ============================================================================
function buildThemeCss(_input: PackagerInput): string {
  return `/* ShopLanding · Shopify theme · scoped styles */

* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
body {
  font-family: var(--font-body), -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  background: var(--bg);
  color: var(--ink);
  font-size: 16px;
  line-height: 1.55;
  -webkit-font-smoothing: antialiased;
}
img { max-width: 100%; display: block; }
button { font-family: inherit; cursor: pointer; border: 0; background: none; }
a { color: inherit; text-decoration: none; }
.skip-to-content {
  position: absolute; left: -9999px; top: 0;
  background: var(--ink); color: var(--bg); padding: 8px 16px; z-index: 100;
}
.skip-to-content:focus { left: 8px; top: 8px; }

.sl-container { width: 100%; max-width: 1200px; margin: 0 auto; padding: 0 24px; }
.sl-display { font-family: var(--font-display); font-weight: 600; letter-spacing: -0.02em; line-height: 1.05; }
.sl-mono { font-family: var(--font-mono); font-size: 11px; text-transform: uppercase; letter-spacing: 0.14em; color: var(--muted); font-weight: 600; }

/* Buttons */
.sl-btn { display: inline-flex; align-items: center; gap: 8px; padding: 12px 20px; border-radius: 999px; font-weight: 600; font-size: 14px; line-height: 1; transition: background 160ms ease, color 160ms ease; }
.sl-btn-primary { background: var(--accent); color: #fff; }
.sl-btn-primary:hover { background: var(--accent-deep); }
.sl-btn-lg { padding: 16px 28px; font-size: 16px; }

/* Announcement */
.sl-announce { background: var(--ink); color: var(--bg); overflow: hidden; }
.sl-announce-track { display: flex; gap: 36px; padding: 8px 24px; align-items: center; justify-content: center; flex-wrap: wrap; font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; }
.sl-announce-item { display: inline-flex; align-items: center; gap: 8px; }
.sl-pip { width: 6px; height: 6px; border-radius: 999px; background: var(--accent); }

/* Header */
.sl-nav { position: sticky; top: 0; z-index: 30; background: var(--card); border-bottom: 1px solid var(--line); }
.sl-nav-inner { display: flex; align-items: center; justify-content: space-between; height: 64px; }
.sl-nav-links { display: flex; gap: 24px; font-size: 14px; color: var(--ink-2); }
.sl-nav-links a:hover { color: var(--ink); }
.sl-logo { font-family: var(--font-display); font-size: 22px; font-weight: 700; letter-spacing: -0.01em; }
.sl-nav-actions { display: flex; gap: 8px; }
.sl-icon-btn { width: 36px; height: 36px; border-radius: 999px; display: inline-flex; align-items: center; justify-content: center; color: var(--ink); background: transparent; position: relative; }
.sl-icon-btn:hover { background: var(--surface); }
.sl-cart-count { position: absolute; top: 4px; right: 4px; background: var(--accent); color: #fff; font-size: 10px; font-weight: 700; min-width: 16px; height: 16px; padding: 0 4px; border-radius: 999px; display: inline-flex; align-items: center; justify-content: center; }

/* Product / hero buy box */
.sl-product { padding: 48px 0; }
.sl-product-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 56px; }
@media (max-width: 800px) { .sl-product-grid { grid-template-columns: 1fr; gap: 32px; } }
.sl-gallery-main { position: relative; border-radius: 14px; overflow: hidden; background: var(--surface); aspect-ratio: 1; }
.sl-gallery-img { width: 100%; height: 100%; object-fit: cover; }
.sl-gallery-placeholder { display: grid; place-items: center; height: 100%; font-family: var(--font-display); font-size: 56px; font-style: italic; color: rgba(0,0,0,0.15); }
.sl-gallery-badge { position: absolute; top: 14px; left: 14px; background: var(--ink); color: #fff; padding: 5px 10px; border-radius: 999px; font-size: 11px; font-family: var(--font-mono); letter-spacing: 0.1em; font-weight: 700; }
.sl-gallery-badge.sale { background: #b9261b; }
.sl-gallery-thumbs { display: flex; gap: 8px; margin-top: 12px; }
.sl-thumb { width: 64px; height: 64px; border-radius: 8px; overflow: hidden; border: 1px solid var(--line); padding: 0; background: var(--card); }
.sl-thumb img { width: 100%; height: 100%; object-fit: cover; }
.sl-thumb.is-active { border-color: var(--accent); }

/* Buy box — differentiated rhythm instead of one uniform gap: identity
   lines sit tight, groups (benefits / price / form / trust) get air. */
.sl-info { display: flex; flex-direction: column; gap: 0; }
.sl-crumb { color: var(--accent-deep); margin-bottom: 10px; }
.sl-title { font-size: clamp(28px, 4vw, 44px); margin-bottom: 12px; }
.sl-subtitle { color: var(--ink-2); font-size: 17px; line-height: 1.55; margin: 0 0 14px; }
.sl-rating { display: inline-flex; gap: 8px; align-items: center; font-size: 13px; margin-bottom: 20px; }
.sl-stars { color: #d49a3a; letter-spacing: 1px; }
.sl-rating-link { color: var(--ink-2); text-decoration: underline; text-underline-offset: 4px; }

.sl-key-benefits { list-style: none; padding: 0; margin: 0 0 22px; display: flex; flex-direction: column; gap: 9px; font-size: 14px; color: var(--ink-2); }
.sl-key-benefits li { display: flex; gap: 10px; align-items: flex-start; line-height: 1.5; }
.sl-check { color: var(--accent); font-weight: 700; flex-shrink: 0; }

.sl-price-block { padding: 0; margin-bottom: 6px; }
.sl-price-row { display: flex; align-items: baseline; gap: 12px; }
.sl-price-current { font-family: var(--font-display); font-size: 32px; font-weight: 600; }
.sl-price-was { color: var(--muted); font-size: 18px; }
.sl-price-save { background: var(--accent-soft); color: var(--accent-deep); padding: 4px 8px; border-radius: 4px; font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.1em; font-weight: 700; }

.sl-form { display: flex; flex-direction: column; gap: 16px; margin-top: 8px; }
.sl-variant-block { display: flex; flex-direction: column; gap: 8px; }
.sl-variant-label { display: flex; justify-content: space-between; align-items: baseline; font-weight: 600; }
.sl-selected { color: var(--muted); font-weight: 400; }
.sl-variant-options { display: flex; gap: 8px; flex-wrap: wrap; }
.sl-variant-pill { display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; border: 1px solid var(--line); border-radius: 999px; cursor: pointer; font-size: 14px; background: var(--card); }
.sl-variant-pill input { position: absolute; opacity: 0; pointer-events: none; }
.sl-variant-pill.is-active { border-color: var(--ink); background: var(--ink); color: var(--card); }

/* Qty + ATC — segmented stepper with real hit areas. The stepper is a
   single pill: [ − | 1 | + ] with hairline internal dividers; ATC fills
   the rest of the row at the same 48px height. */
.sl-qty-atc { display: flex; gap: 10px; align-items: stretch; margin-top: 10px; }
.sl-qty { display: inline-flex; align-items: stretch; height: 48px; border: 1px solid var(--line); border-radius: 999px; background: var(--card); overflow: hidden; flex-shrink: 0; }
.sl-qty button { width: 42px; border: 0; background: none; font-size: 17px; font-weight: 600; color: var(--ink-2); display: flex; align-items: center; justify-content: center; transition: background 120ms ease, color 120ms ease; }
.sl-qty button:hover { background: var(--surface); color: var(--ink); }
.sl-qty button:first-child { border-right: 1px solid var(--line); }
.sl-qty button:last-child { border-left: 1px solid var(--line); }
.sl-qty input { width: 44px; border: 0; text-align: center; font-size: 15px; font-weight: 600; color: var(--ink); background: transparent; padding: 0; font-variant-numeric: tabular-nums; -moz-appearance: textfield; }
.sl-qty input::-webkit-outer-spin-button, .sl-qty input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
.sl-qty input:focus { outline: none; }
.sl-atc { height: 48px; flex: 1; padding: 0 24px; justify-content: center; gap: 10px; font-size: 15px; }

.sl-trust-mini { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px 16px; margin-top: 12px; padding: 16px 18px; background: var(--surface); border-radius: 12px; font-size: 13px; color: var(--ink-2); }

/* Content sections */
.sl-section { padding: 64px 0; }
${SECTIONS_CSS}

/* Final CTA */
.sl-final-cta { background: var(--accent-deep); color: #fff; padding: 88px 0; text-align: center; }
.sl-final-eyebrow { color: var(--accent-soft); }
.sl-final-cta h2 { font-size: clamp(32px, 5vw, 56px); margin: 16px 0 12px; }
.sl-final-sub { color: rgba(255,255,255,0.8); max-width: 520px; margin: 0 auto 28px; font-size: 17px; }
.sl-final-cta .sl-btn-primary { background: #fff; color: var(--accent-deep); }
.sl-final-cta .sl-btn-primary:hover { background: var(--bg); }

/* Footer */
.sl-footer { background: var(--surface); padding: 64px 0 32px; border-top: 1px solid var(--line); }
.sl-footer-grid { display: grid; grid-template-columns: 2fr repeat(3, 1fr); gap: 48px; }
@media (max-width: 800px) { .sl-footer-grid { grid-template-columns: 1fr 1fr; } }
.sl-footer-brand p { color: var(--ink-2); font-size: 14px; max-width: 320px; margin-top: 12px; }
.sl-footer h4 { font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--muted); margin: 0 0 12px; font-weight: 600; }
.sl-footer ul { list-style: none; padding: 0; margin: 0; display: grid; gap: 8px; font-size: 14px; color: var(--ink-2); }
.sl-footer-pay { margin-top: 56px; padding-top: 28px; border-top: 1px solid var(--line); }
.sl-pay-icons { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 14px; align-items: center; }
.sl-pay-icon { height: 22px; width: auto; }
.sl-footer-bottom { margin-top: 28px; padding-top: 18px; border-top: 1px solid var(--line); display: flex; justify-content: space-between; gap: 16px; flex-wrap: wrap; font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted); }

/* Sticky ATC */
.sl-sticky-atc {
  position: fixed; left: 0; right: 0; bottom: 0;
  z-index: 40;
  background: var(--card); border-top: 1px solid var(--line);
  box-shadow: 0 -8px 24px rgba(0,0,0,0.06);
  transform: translateY(120%); transition: transform 280ms ease;
}
.sl-sticky-atc.is-visible { transform: translateY(0); }
.sl-sticky-inner { padding: 12px 24px; display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.sl-sticky-info { display: flex; gap: 12px; align-items: center; }
.sl-sticky-thumb { width: 48px; height: 48px; border-radius: 8px; object-fit: cover; }
.sl-sticky-title { font-weight: 600; font-size: 14px; }
.sl-sticky-meta { font-size: 12px; color: var(--muted); }

@media (prefers-reduced-motion: reduce) {
  .sl-sticky-atc { transition: none; }
}

/* 404 */
.sl-404 { padding: 120px 0; text-align: center; }
.sl-404 h1 { font-size: 56px; margin-bottom: 16px; }
.sl-404 a { color: var(--accent-deep); text-decoration: underline; text-underline-offset: 4px; }
`;
}

// ============================================================================
// assets/theme.js — sticky behavior + variant click handler
// ============================================================================
function buildThemeJs(): string {
  return `(function () {
  // Sticky ATC visibility — show after the hero scrolls past, hide near footer.
  var sticky = document.querySelector('[data-sticky-atc]');
  if (sticky) {
    var update = function () {
      var y = window.scrollY;
      var max = document.body.scrollHeight - window.innerHeight;
      sticky.classList.toggle('is-visible', y > 700 && y < max - 400);
    };
    window.addEventListener('scroll', update, { passive: true });
    update();
  }

  // Variant pills — visual active state. Real variant swap should use Shopify
  // section rendering / cart API in v2; for now this is presentational.
  document.querySelectorAll('[data-product-form]').forEach(function (form) {
    form.querySelectorAll('input[type="radio"][data-option-position]').forEach(function (radio) {
      radio.addEventListener('change', function () {
        var name = radio.name;
        form.querySelectorAll('label.sl-variant-pill').forEach(function (label) {
          var input = label.querySelector('input');
          if (input && input.name === name) {
            label.classList.toggle('is-active', input.checked);
            if (input.checked) {
              var sel = form.querySelector('[data-option-name]');
              if (sel && sel.dataset.optionName === name.replace(/^options\\[(.*)\\]$/, '$1')) {
                sel.textContent = input.value;
              }
            }
          }
        });
      });
    });
  });

  // Quantity stepper.
  document.querySelectorAll('[data-qty-step]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var input = btn.parentElement.querySelector('[data-qty]');
      if (!input) return;
      var step = parseInt(btn.getAttribute('data-qty-step'), 10);
      var v = Math.max(1, parseInt(input.value, 10) + step);
      input.value = v;
    });
  });
})();
`;
}

// ============================================================================
// config/settings_schema.json + settings_data.json
// ============================================================================
function buildSettingsSchema(): string {
  return JSON.stringify(
    [
      {
        name: "theme_info",
        theme_name: "ShopLanding",
        theme_version: "1.0.0",
        theme_author: "ShopLanding",
        theme_documentation_url: "https://shoplanding.com/docs/shopify",
        theme_support_url: "https://shoplanding.com/contact",
      },
      {
        name: "Palette",
        settings: [
          { type: "color", id: "color_accent", label: "Accent", default: "#1f5a40" },
          { type: "color", id: "color_accent_deep", label: "Accent (deep)", default: "#0f3a26" },
          { type: "color", id: "color_accent_soft", label: "Accent (soft)", default: "#e6f0ea" },
          { type: "color", id: "color_bg", label: "Background", default: "#faf7f1" },
          { type: "color", id: "color_surface", label: "Surface", default: "#f5e6d6" },
          { type: "color", id: "color_card", label: "Card", default: "#ffffff" },
          { type: "color", id: "color_ink", label: "Ink (primary text)", default: "#0f0e0d" },
          { type: "color", id: "color_ink_2", label: "Ink (secondary)", default: "#2a2823" },
          { type: "color", id: "color_muted", label: "Muted", default: "#807868" },
          { type: "color", id: "color_line", label: "Line", default: "#e3dac0" },
        ],
      },
      {
        name: "Type",
        settings: [
          { type: "text", id: "font_display", label: "Display font (CSS family)", default: "\"Fraunces\", Georgia, serif" },
          { type: "text", id: "font_body", label: "Body font (CSS family)", default: "\"Inter\", system-ui, sans-serif" },
          { type: "text", id: "font_mono", label: "Mono font (CSS family)", default: "\"JetBrains Mono\", ui-monospace, monospace" },
        ],
      },
    ],
    null,
    2,
  );
}

function buildSettingsData(input: PackagerInput): string {
  const t = input.tokens;
  return JSON.stringify(
    {
      current: "Default",
      presets: {
        Default: {
          color_accent: t.accent,
          color_accent_deep: t.accentDeep,
          color_accent_soft: t.accentSoft,
          color_bg: t.bg,
          color_surface: t.surface,
          color_card: t.card,
          color_ink: t.ink,
          color_ink_2: t.ink2,
          color_muted: t.muted,
          color_line: t.line,
          font_display: t.fontDisplay,
          font_body: t.fontBody,
          font_mono: t.fontMono,
        },
      },
    },
    null,
    2,
  );
}

// ============================================================================
// locales/en.default.json
// ============================================================================
function buildLocales(_input: PackagerInput): string {
  return JSON.stringify(
    {
      general: {
        accessibility: {
          skip_to_content: "Skip to content",
        },
      },
      products: {
        product: {
          add_to_cart: "Add to cart",
          sold_out: "Sold out",
          quantity: { label: "Quantity" },
        },
      },
    },
    null,
    2,
  );
}

// ============================================================================
// README.md + LICENSE.txt
// ============================================================================
function buildReadme(input: PackagerInput): string {
  return [
    "# ShopLanding · Shopify theme",
    "",
    `**Preset:** \`${input.presetSlug}\`  `,
    `**Brand:** ${input.content.brand.name}  `,
    `**Version:** ${input.version}`,
    "",
    "## Install",
    "",
    "1. Online Store → Themes → Add theme → **Upload zip file**.",
    "2. Upload this `.zip`. Wait for the install to finish.",
    "3. **Customize → Theme settings** to tune palette / fonts.",
    "4. **Customize → Sections** to edit headlines, copy, and link lists.",
    "5. Set this theme as your active theme when ready.",
    "",
    "## What ships",
    "",
    "Seventeen sections, all functional on install:",
    "",
    "- `announcement-bar` — multi-message ticker.",
    "- `header` — single-product nav with cart count.",
    "- `hero-product` — full buy box: variants, qty stepper, CTA, rating link, trust row, Schema.org JSON-LD.",
    "- `press` — as-seen-in wordmark strip.",
    "- `benefits` — benefit-led card grid.",
    "- `how-it-works` — numbered 3-step explainer.",
    "- `comparison` — you-vs-alternatives table.",
    "- `ingredients` — what's-inside cards with swatches + percentages.",
    "- `reviews` — aggregate score, star-distribution bars, review cards with verified badge, occupation/age, optional customer photos. Anchored `#reviews` from the hero rating link.",
    "- `ugc` — social-post wall.",
    "- `cross-sell` — pick real store products via the editor (`Products`); seeded placeholder cards render until you do.",
    "- `founder` — founder letter with photo or initial avatar.",
    "- `specs` — alternating-row technical table.",
    "- `faq` — native <details> accordion, zero JS. Anchored `#faq`.",
    "- `final-cta` — closing CTA on a deep-accent band.",
    "- `footer` — link columns + payment icons.",
    "- `sticky-atc` — persistent bottom buy bar after the hero scrolls past.",
    "",
    "Your preset's demo content (reviews, FAQ, specs, comparison rows …) is",
    "pre-loaded into the product template — edit or replace every line in",
    "**Customize → Sections**. Swap the placeholder review/UGC content for",
    "your real customers' words before launch.",
    "",
    "## System spec inside",
    "",
    "The `spec/` folder contains the portable JSON + Markdown system spec for",
    "this preset. Use it if you want to reimplement on Hydrogen, Astro, or any",
    "other stack — same content, same blocks, same conversion rules.",
    "",
    "Questions: support@shoplanding.com",
    "",
  ].join("\n");
}

function buildLicense(input: PackagerInput): string {
  return [
    "ShopLanding theme — license traceability stamp",
    "",
    `Preset:      ${input.presetSlug}`,
    `Brand:       ${input.content.brand.name}`,
    `Version:     ${input.version}`,
    `Generated:   ${new Date().toISOString()}`,
    `License key: ${input.licenseKey ?? "(unlicensed dev export)"}`,
    "",
    "Use is governed by the ShopLanding license tier purchased with the above",
    "key. See https://shoplanding.com/license for current terms.",
    "",
  ].join("\n");
}

// ============================================================================
// Helpers — escape user content for embedding into Liquid / JSON / HTML
// ============================================================================

/** Escape for safe embedding inside a Liquid string default (single-line). */
function escapeLiquid(s: string): string {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, " ")
    .replace(/\r/g, "");
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
