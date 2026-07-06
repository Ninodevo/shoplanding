import type { PackagerInput } from "./types";

/**
 * The 11 content sections of the Shopify theme — real Liquid, replacing the
 * v1 stubs. Structure:
 *
 *   - Each `.liquid` here is content-agnostic: render logic + editor schema
 *     with generic defaults, so "Add section" in the theme editor works on
 *     any store.
 *   - The buyer's seeded content (their preset's demo copy, reviews, FAQ,
 *     specs …) is baked into `templates/product.json` via
 *     `buildSectionTemplateEntries()` — that's the OS 2.0 mechanism for
 *     per-install section content (template JSON wins over schema defaults).
 *
 * Every section maps back to playbook rules — noted per section.
 */

// ============================================================================
// sections/press.liquid — rule 49: press / as-seen-in logo strip
// ============================================================================
export function sectionPress(): string {
  return `<section class="sl-section sl-press" aria-label="Press">
  <div class="sl-container">
    <p class="sl-mono sl-press-eyebrow">{{ section.settings.eyebrow }}</p>
    <div class="sl-press-row">
      {%- for block in section.blocks -%}
        <span class="sl-press-logo sl-press-{{ block.settings.style }}" {{ block.shopify_attributes }}>{{ block.settings.text }}</span>
      {%- endfor -%}
    </div>
  </div>
</section>

{% schema %}
{
  "name": "Press / As seen in",
  "tag": "section",
  "class": "sl-press-section",
  "max_blocks": 8,
  "settings": [
    { "type": "text", "id": "eyebrow", "label": "Eyebrow", "default": "As seen in" }
  ],
  "blocks": [
    {
      "type": "logo",
      "name": "Publication",
      "settings": [
        { "type": "text", "id": "text", "label": "Name", "default": "Vogue" },
        {
          "type": "select",
          "id": "style",
          "label": "Wordmark style",
          "options": [
            { "value": "serif", "label": "Serif" },
            { "value": "mono", "label": "Mono" },
            { "value": "script", "label": "Script" }
          ],
          "default": "serif"
        }
      ]
    }
  ],
  "presets": [
    {
      "name": "Press / As seen in",
      "blocks": [
        { "type": "logo", "settings": { "text": "Vogue", "style": "serif" } },
        { "type": "logo", "settings": { "text": "WIRED", "style": "mono" } },
        { "type": "logo", "settings": { "text": "goop", "style": "script" } }
      ]
    }
  ]
}
{% endschema %}
`;
}

// ============================================================================
// sections/benefits.liquid — rule 71: benefit-led titles, grouped scanning
// ============================================================================
export function sectionBenefits(): string {
  return `<section class="sl-section sl-benefits">
  <div class="sl-container">
    <p class="sl-mono">{{ section.settings.eyebrow }}</p>
    <h2 class="sl-display sl-section-title">{{ section.settings.heading }}</h2>
    <div class="sl-benefits-grid">
      {%- for block in section.blocks -%}
        <article class="sl-benefit-card" {{ block.shopify_attributes }}>
          <div class="sl-benefit-ico" aria-hidden>{{ block.settings.icon }}</div>
          <h3>{{ block.settings.title }}</h3>
          <p>{{ block.settings.body }}</p>
        </article>
      {%- endfor -%}
    </div>
  </div>
</section>

{% schema %}
{
  "name": "Benefits grid",
  "tag": "section",
  "class": "sl-benefits-section",
  "max_blocks": 6,
  "settings": [
    { "type": "text", "id": "eyebrow", "label": "Eyebrow", "default": "Why it works" },
    { "type": "text", "id": "heading", "label": "Heading", "default": "Built around what your skin actually needs." }
  ],
  "blocks": [
    {
      "type": "benefit",
      "name": "Benefit",
      "settings": [
        { "type": "text", "id": "icon", "label": "Icon (emoji)", "default": "✨" },
        { "type": "text", "id": "title", "label": "Benefit-led title", "default": "Feels lighter than a cream" },
        { "type": "textarea", "id": "body", "label": "Body", "default": "One swipe covers both hands — no grease, no wait." }
      ]
    }
  ],
  "presets": [
    {
      "name": "Benefits grid",
      "blocks": [
        { "type": "benefit" },
        { "type": "benefit" },
        { "type": "benefit" },
        { "type": "benefit" }
      ]
    }
  ]
}
{% endschema %}
`;
}

// ============================================================================
// sections/how-it-works.liquid — rule 74: how to use in 3 easy steps
// ============================================================================
export function sectionHowItWorks(): string {
  return `<section class="sl-section sl-steps">
  <div class="sl-container">
    <p class="sl-mono">{{ section.settings.eyebrow }}</p>
    <h2 class="sl-display sl-section-title">{{ section.settings.heading }}</h2>
    <ol class="sl-steps-row">
      {%- for block in section.blocks -%}
        <li class="sl-step" {{ block.shopify_attributes }}>
          <span class="sl-step-num sl-mono">{{ forloop.index | prepend: '0' | slice: -2, 2 }}</span>
          <h3>{{ block.settings.title }}</h3>
          <p>{{ block.settings.body }}</p>
        </li>
      {%- endfor -%}
    </ol>
  </div>
</section>

{% schema %}
{
  "name": "How it works",
  "tag": "section",
  "class": "sl-steps-section",
  "max_blocks": 4,
  "settings": [
    { "type": "text", "id": "eyebrow", "label": "Eyebrow", "default": "How it works" },
    { "type": "text", "id": "heading", "label": "Heading", "default": "Three steps. Ten seconds." }
  ],
  "blocks": [
    {
      "type": "step",
      "name": "Step",
      "settings": [
        { "type": "text", "id": "title", "label": "Title", "default": "Twist" },
        { "type": "textarea", "id": "body", "label": "Body", "default": "Turn the base until a sliver of balm shows." }
      ]
    }
  ],
  "presets": [
    { "name": "How it works", "blocks": [{ "type": "step" }, { "type": "step" }, { "type": "step" }] }
  ]
}
{% endschema %}
`;
}

// ============================================================================
// sections/comparison.liquid — rule 73: product comparison vs alternatives
// ============================================================================
export function sectionComparison(): string {
  return `<section class="sl-section sl-compare">
  <div class="sl-container">
    <p class="sl-mono">{{ section.settings.eyebrow }}</p>
    <h2 class="sl-display sl-section-title">{{ section.settings.heading }}</h2>
    <div class="sl-compare-table" role="table">
      <div class="sl-compare-head" role="row">
        <span role="columnheader"></span>
        <span role="columnheader" class="sl-compare-us">{{ section.settings.us_label }}</span>
        <span role="columnheader">{{ section.settings.them_label }}</span>
      </div>
      {%- for block in section.blocks -%}
        <div class="sl-compare-row" role="row" {{ block.shopify_attributes }}>
          <span role="cell" class="sl-compare-feature">{{ block.settings.feature }}</span>
          <span role="cell" class="sl-compare-us">{{ block.settings.us }}</span>
          <span role="cell" class="sl-compare-them">{{ block.settings.them }}</span>
        </div>
      {%- endfor -%}
    </div>
  </div>
</section>

{% schema %}
{
  "name": "Comparison table",
  "tag": "section",
  "class": "sl-compare-section",
  "max_blocks": 10,
  "settings": [
    { "type": "text", "id": "eyebrow", "label": "Eyebrow", "default": "Compare" },
    { "type": "text", "id": "heading", "label": "Heading", "default": "Not all of them are built the same." },
    { "type": "text", "id": "us_label", "label": "Your column label", "default": "Ours" },
    { "type": "text", "id": "them_label", "label": "Their column label", "default": "Typical alternative" }
  ],
  "blocks": [
    {
      "type": "row",
      "name": "Row",
      "settings": [
        { "type": "text", "id": "feature", "label": "Feature", "default": "Application" },
        { "type": "text", "id": "us", "label": "Yours", "default": "✓ One-hand, 5 seconds" },
        { "type": "text", "id": "them", "label": "Theirs", "default": "✗ Two hands + wait" }
      ]
    }
  ],
  "presets": [
    { "name": "Comparison table", "blocks": [{ "type": "row" }, { "type": "row" }, { "type": "row" }] }
  ]
}
{% endschema %}
`;
}

// ============================================================================
// sections/ingredients.liquid — "what's inside" transparency
// ============================================================================
export function sectionIngredients(): string {
  return `<section class="sl-section sl-ingredients">
  <div class="sl-container">
    <p class="sl-mono">{{ section.settings.eyebrow }}</p>
    <h2 class="sl-display sl-section-title">{{ section.settings.heading }}</h2>
    <div class="sl-ingredients-grid">
      {%- for block in section.blocks -%}
        <article class="sl-ingredient" {{ block.shopify_attributes }}>
          <span class="sl-ingredient-dot" style="background: {{ block.settings.swatch }}" aria-hidden></span>
          <div>
            <h3>{{ block.settings.name }} {%- if block.settings.pct != blank %} <span class="sl-ingredient-pct sl-mono">{{ block.settings.pct }}</span>{%- endif -%}</h3>
            <p>{{ block.settings.role }}</p>
          </div>
        </article>
      {%- endfor -%}
    </div>
  </div>
</section>

{% schema %}
{
  "name": "Ingredients",
  "tag": "section",
  "class": "sl-ingredients-section",
  "max_blocks": 8,
  "settings": [
    { "type": "text", "id": "eyebrow", "label": "Eyebrow", "default": "What's inside" },
    { "type": "text", "id": "heading", "label": "Heading", "default": "Five ingredients. Nothing to hide." }
  ],
  "blocks": [
    {
      "type": "ingredient",
      "name": "Ingredient",
      "settings": [
        { "type": "text", "id": "name", "label": "Name", "default": "Shea butter" },
        { "type": "text", "id": "role", "label": "What it does", "default": "Deep moisture without the grease." },
        { "type": "text", "id": "pct", "label": "Percentage (optional)", "default": "32%" },
        { "type": "color", "id": "swatch", "label": "Swatch color", "default": "#e8d5b5" }
      ]
    }
  ],
  "presets": [
    { "name": "Ingredients", "blocks": [{ "type": "ingredient" }, { "type": "ingredient" }, { "type": "ingredient" }] }
  ]
}
{% endschema %}
`;
}

// ============================================================================
// sections/reviews.liquid — rules 50–53: reviews w/ photos, name, occupation,
// age, verified badge; tinted background; aggregate + star distribution.
// Anchored #reviews so the hero rating link jumps here.
// ============================================================================
export function sectionReviews(): string {
  return `<section class="sl-section sl-reviews" id="reviews">
  <div class="sl-container">
    <div class="sl-reviews-head">
      <div>
        <p class="sl-mono">{{ section.settings.eyebrow }}</p>
        <h2 class="sl-display sl-section-title">{{ section.settings.heading }}</h2>
      </div>
      <div class="sl-reviews-summary">
        <div class="sl-reviews-score">
          <span class="sl-reviews-big">{{ section.settings.rating }}</span>
          <div>
            <div class="sl-stars" aria-hidden>★★★★★</div>
            <div class="sl-reviews-count">{{ section.settings.review_count }} verified reviews</div>
          </div>
        </div>
        {%- assign c5 = 0 -%}{%- assign c4 = 0 -%}{%- assign c3 = 0 -%}
        {%- for block in section.blocks -%}
          {%- assign r = block.settings.rating | round -%}
          {%- if r >= 5 -%}{%- assign c5 = c5 | plus: 1 -%}
          {%- elsif r == 4 -%}{%- assign c4 = c4 | plus: 1 -%}
          {%- else -%}{%- assign c3 = c3 | plus: 1 -%}{%- endif -%}
        {%- endfor -%}
        {%- assign total = section.blocks.size | at_least: 1 -%}
        <div class="sl-reviews-bars" aria-hidden>
          <div class="sl-rbar"><span>5★</span><i><b style="width: {{ c5 | times: 100.0 | divided_by: total | round }}%"></b></i></div>
          <div class="sl-rbar"><span>4★</span><i><b style="width: {{ c4 | times: 100.0 | divided_by: total | round }}%"></b></i></div>
          <div class="sl-rbar"><span>≤3★</span><i><b style="width: {{ c3 | times: 100.0 | divided_by: total | round }}%"></b></i></div>
        </div>
      </div>
    </div>

    <div class="sl-reviews-grid">
      {%- for block in section.blocks -%}
        <article class="sl-review-card" {{ block.shopify_attributes }}>
          <div class="sl-review-top">
            <span class="sl-stars" aria-label="{{ block.settings.rating }} out of 5">
              {%- assign r = block.settings.rating | round -%}
              {%- for i in (1..5) -%}{%- if i <= r -%}★{%- else -%}☆{%- endif -%}{%- endfor -%}
            </span>
            {%- if block.settings.verified -%}
              <span class="sl-verified sl-mono">✓ Verified buyer</span>
            {%- endif -%}
          </div>
          <h3 class="sl-review-title">{{ block.settings.title }}</h3>
          <p class="sl-review-body">{{ block.settings.body }}</p>
          {%- if block.settings.photo != blank -%}
            <div class="sl-review-photo">{{ block.settings.photo | image_url: width: 480 | image_tag: alt: block.settings.title, loading: 'lazy' }}</div>
          {%- endif -%}
          <footer class="sl-review-meta">
            <span class="sl-review-avatar" aria-hidden>{{ block.settings.name | slice: 0, 1 }}</span>
            <span>{{ block.settings.name }}{% if block.settings.detail != blank %} · {{ block.settings.detail }}{% endif %}</span>
          </footer>
        </article>
      {%- endfor -%}
    </div>
  </div>
</section>

{% schema %}
{
  "name": "Reviews",
  "tag": "section",
  "class": "sl-reviews-section",
  "max_blocks": 12,
  "settings": [
    { "type": "text", "id": "eyebrow", "label": "Eyebrow", "default": "Reviews" },
    { "type": "text", "id": "heading", "label": "Heading", "default": "What customers say." },
    { "type": "text", "id": "rating", "label": "Aggregate rating", "default": "4.8" },
    { "type": "text", "id": "review_count", "label": "Total review count", "default": "487" }
  ],
  "blocks": [
    {
      "type": "review",
      "name": "Review",
      "settings": [
        { "type": "range", "id": "rating", "label": "Stars", "min": 1, "max": 5, "step": 1, "default": 5 },
        { "type": "text", "id": "title", "label": "Review title", "default": "Lives in my tote now" },
        { "type": "textarea", "id": "body", "label": "Body", "default": "Bought one for my desk and one for travel. The texture is the whole point — rich but never greasy." },
        { "type": "text", "id": "name", "label": "Customer name", "default": "Maya K." },
        { "type": "text", "id": "detail", "label": "Detail (occupation, age)", "default": "Product designer, 31" },
        { "type": "checkbox", "id": "verified", "label": "Verified badge", "default": true },
        { "type": "image_picker", "id": "photo", "label": "Customer photo (optional)" }
      ]
    }
  ],
  "presets": [
    { "name": "Reviews", "blocks": [{ "type": "review" }, { "type": "review" }, { "type": "review" }] }
  ]
}
{% endschema %}
`;
}

// ============================================================================
// sections/ugc.liquid — embedded social posts (rule: social embeds)
// ============================================================================
export function sectionUgc(): string {
  return `<section class="sl-section sl-ugc">
  <div class="sl-container">
    <p class="sl-mono">{{ section.settings.eyebrow }}</p>
    <h2 class="sl-display sl-section-title">{{ section.settings.heading }}</h2>
    <div class="sl-ugc-grid">
      {%- for block in section.blocks -%}
        <blockquote class="sl-ugc-card" {{ block.shopify_attributes }}>
          <header>
            <span class="sl-ugc-platform sl-mono">{{ block.settings.platform }}</span>
            <span class="sl-ugc-author">{{ block.settings.author }} <em>{{ block.settings.handle }}</em></span>
          </header>
          <p>{{ block.settings.text }}</p>
        </blockquote>
      {%- endfor -%}
    </div>
  </div>
</section>

{% schema %}
{
  "name": "Social wall",
  "tag": "section",
  "class": "sl-ugc-section",
  "max_blocks": 8,
  "settings": [
    { "type": "text", "id": "eyebrow", "label": "Eyebrow", "default": "From the feed" },
    { "type": "text", "id": "heading", "label": "Heading", "default": "Posted, not paid." }
  ],
  "blocks": [
    {
      "type": "post",
      "name": "Post",
      "settings": [
        { "type": "text", "id": "platform", "label": "Platform", "default": "Instagram" },
        { "type": "text", "id": "author", "label": "Author", "default": "Lena" },
        { "type": "text", "id": "handle", "label": "Handle", "default": "@lena.tries.things" },
        { "type": "textarea", "id": "text", "label": "Post text", "default": "Did not expect a lotion bar to be my favorite purchase this year." }
      ]
    }
  ],
  "presets": [
    { "name": "Social wall", "blocks": [{ "type": "post" }, { "type": "post" }, { "type": "post" }] }
  ]
}
{% endschema %}
`;
}

// ============================================================================
// sections/cross-sell.liquid — rules 60–61: cross-sell / also-bought.
// Native product_list picker renders real store products; seeded text blocks
// render until the merchant picks real ones.
// ============================================================================
export function sectionCrossSell(): string {
  return `<section class="sl-section sl-xsell">
  <div class="sl-container">
    <p class="sl-mono">{{ section.settings.eyebrow }}</p>
    <h2 class="sl-display sl-section-title">{{ section.settings.heading }}</h2>

    {%- if section.settings.products.count > 0 -%}
      <div class="sl-xsell-grid">
        {%- for xp in section.settings.products -%}
          <a class="sl-xsell-card" href="{{ xp.url }}">
            <div class="sl-xsell-img">
              {%- if xp.featured_image -%}
                {{ xp.featured_image | image_url: width: 480 | image_tag: alt: xp.title, loading: 'lazy' }}
              {%- endif -%}
            </div>
            <h3>{{ xp.title }}</h3>
            <div class="sl-xsell-price">
              {{ xp.price | money }}
              {%- if xp.compare_at_price > xp.price -%}<s>{{ xp.compare_at_price | money }}</s>{%- endif -%}
            </div>
          </a>
        {%- endfor -%}
      </div>
    {%- else -%}
      <div class="sl-xsell-grid">
        {%- for block in section.blocks -%}
          <div class="sl-xsell-card" {{ block.shopify_attributes }}>
            <div class="sl-xsell-img sl-xsell-ph" aria-hidden>{{ block.settings.icon }}</div>
            <h3>{{ block.settings.title }}</h3>
            <div class="sl-xsell-stars">★ {{ block.settings.rating }} · {{ block.settings.count }} reviews</div>
            <div class="sl-xsell-price">{{ block.settings.price }}{% if block.settings.was != blank %} <s>{{ block.settings.was }}</s>{% endif %}</div>
          </div>
        {%- endfor -%}
      </div>
      <p class="sl-xsell-note sl-mono">Placeholder cards — pick real products in the theme editor (Cross-sell → Products).</p>
    {%- endif -%}
  </div>
</section>

{% schema %}
{
  "name": "Cross-sell",
  "tag": "section",
  "class": "sl-xsell-section",
  "max_blocks": 4,
  "settings": [
    { "type": "text", "id": "eyebrow", "label": "Eyebrow", "default": "Pairs well with" },
    { "type": "text", "id": "heading", "label": "Heading", "default": "Complete the routine." },
    { "type": "product_list", "id": "products", "label": "Products", "limit": 4, "info": "When set, these replace the placeholder cards below." }
  ],
  "blocks": [
    {
      "type": "item",
      "name": "Placeholder item",
      "settings": [
        { "type": "text", "id": "icon", "label": "Emoji", "default": "🧴" },
        { "type": "text", "id": "title", "label": "Title", "default": "Travel refill · 2-pack" },
        { "type": "text", "id": "rating", "label": "Rating", "default": "4.7" },
        { "type": "text", "id": "count", "label": "Review count", "default": "212" },
        { "type": "text", "id": "price", "label": "Price", "default": "$24" },
        { "type": "text", "id": "was", "label": "Compare-at (optional)", "default": "" }
      ]
    }
  ],
  "presets": [
    { "name": "Cross-sell", "blocks": [{ "type": "item" }, { "type": "item" }, { "type": "item" }] }
  ]
}
{% endschema %}
`;
}

// ============================================================================
// sections/founder.liquid — founder letter (humanises the brand)
// ============================================================================
export function sectionFounder(): string {
  return `<section class="sl-section sl-founder">
  <div class="sl-container sl-founder-grid">
    <div class="sl-founder-avatar-wrap">
      {%- if section.settings.photo != blank -%}
        {{ section.settings.photo | image_url: width: 480 | image_tag: alt: section.settings.name, class: 'sl-founder-photo' }}
      {%- else -%}
        <div class="sl-founder-avatar" aria-hidden>{{ section.settings.name | slice: 0, 1 }}</div>
      {%- endif -%}
    </div>
    <div>
      <p class="sl-mono">{{ section.settings.eyebrow }}</p>
      <blockquote class="sl-founder-quote">{{ section.settings.quote }}</blockquote>
      <p class="sl-founder-sig">— {{ section.settings.name }}, {{ section.settings.title }}</p>
    </div>
  </div>
</section>

{% schema %}
{
  "name": "Founder letter",
  "tag": "section",
  "class": "sl-founder-section",
  "settings": [
    { "type": "text", "id": "eyebrow", "label": "Eyebrow", "default": "A note from the founder" },
    { "type": "textarea", "id": "quote", "label": "Quote", "default": "I made this because everything else in my bag either leaked or felt like glue. If it's not the best lotion you've owned, send it back — I'll refund you the same day." },
    { "type": "text", "id": "name", "label": "Name", "default": "Ana" },
    { "type": "text", "id": "title", "label": "Title", "default": "Founder" },
    { "type": "image_picker", "id": "photo", "label": "Photo (optional)" }
  ],
  "presets": [{ "name": "Founder letter" }]
}
{% endschema %}
`;
}

// ============================================================================
// sections/specs.liquid — readable technical table (alternating rows)
// ============================================================================
export function sectionSpecs(): string {
  return `<section class="sl-section sl-specs">
  <div class="sl-container">
    <p class="sl-mono">{{ section.settings.eyebrow }}</p>
    <h2 class="sl-display sl-section-title">{{ section.settings.heading }}</h2>
    <dl class="sl-specs-table">
      {%- for block in section.blocks -%}
        <div class="sl-specs-row" {{ block.shopify_attributes }}>
          <dt>{{ block.settings.label }}</dt>
          <dd>{{ block.settings.value }}</dd>
        </div>
      {%- endfor -%}
    </dl>
  </div>
</section>

{% schema %}
{
  "name": "Specifications",
  "tag": "section",
  "class": "sl-specs-section",
  "max_blocks": 12,
  "settings": [
    { "type": "text", "id": "eyebrow", "label": "Eyebrow", "default": "Specs" },
    { "type": "text", "id": "heading", "label": "Heading", "default": "The details." }
  ],
  "blocks": [
    {
      "type": "row",
      "name": "Row",
      "settings": [
        { "type": "text", "id": "label", "label": "Label", "default": "Net weight" },
        { "type": "text", "id": "value", "label": "Value", "default": "38 g / 1.3 oz" }
      ]
    }
  ],
  "presets": [
    { "name": "Specifications", "blocks": [{ "type": "row" }, { "type": "row" }, { "type": "row" }] }
  ]
}
{% endschema %}
`;
}

// ============================================================================
// sections/faq.liquid — rule 70: on-page FAQ. Native <details> accordion —
// zero JS, accessible by default. Anchored #faq for nav links.
// ============================================================================
export function sectionFaq(): string {
  return `<section class="sl-section sl-faq" id="faq">
  <div class="sl-container">
    <p class="sl-mono">{{ section.settings.eyebrow }}</p>
    <h2 class="sl-display sl-section-title">{{ section.settings.heading }}</h2>
    <div class="sl-faq-list">
      {%- for block in section.blocks -%}
        <details class="sl-faq-item" {% if forloop.first %}open{% endif %} {{ block.shopify_attributes }}>
          <summary>{{ block.settings.question }}<span class="sl-faq-plus" aria-hidden>+</span></summary>
          <p>{{ block.settings.answer }}</p>
        </details>
      {%- endfor -%}
    </div>
  </div>
</section>

{% schema %}
{
  "name": "FAQ",
  "tag": "section",
  "class": "sl-faq-section",
  "max_blocks": 12,
  "settings": [
    { "type": "text", "id": "eyebrow", "label": "Eyebrow", "default": "FAQ" },
    { "type": "text", "id": "heading", "label": "Heading", "default": "Answered before you ask." }
  ],
  "blocks": [
    {
      "type": "qa",
      "name": "Question",
      "settings": [
        { "type": "text", "id": "question", "label": "Question", "default": "How long does one bar last?" },
        { "type": "textarea", "id": "answer", "label": "Answer", "default": "With daily use, 6–8 weeks. It goes further than a pump bottle because nothing is wasted on water." }
      ]
    }
  ],
  "presets": [
    { "name": "FAQ", "blocks": [{ "type": "qa" }, { "type": "qa" }, { "type": "qa" }] }
  ]
}
{% endschema %}
`;
}

// ============================================================================
// templates/product.json — seeded content per section.
// JSON templates override schema defaults; this is where the buyer's preset
// content (demo seed + tweaks) lands so the theme renders fully-populated
// the moment it's installed.
// ============================================================================
type TemplateSection = {
  type: string;
  settings?: Record<string, unknown>;
  blocks?: Record<string, { type: string; settings: Record<string, unknown> }>;
  block_order?: string[];
};

export function buildSectionTemplateEntries(
  input: PackagerInput,
): Record<string, TemplateSection> {
  const c = input.content;

  const blocksOf = <T,>(
    slug: string,
    items: T[],
    type: string,
    map: (item: T) => Record<string, unknown>,
  ) => {
    const blocks: Record<string, { type: string; settings: Record<string, unknown> }> = {};
    const order: string[] = [];
    items.forEach((item, i) => {
      const id = `${slug}-${i + 1}`;
      blocks[id] = { type, settings: map(item) };
      order.push(id);
    });
    return { blocks, block_order: order };
  };

  return {
    press: {
      type: "press",
      settings: { eyebrow: "As seen in" },
      ...blocksOf("press", c.press.slice(0, 8), "logo", (p) => ({
        text: p.text,
        style: p.cls,
      })),
    },

    benefits: {
      type: "benefits",
      settings: {
        eyebrow: "Why it works",
        heading: `Why ${c.brand.name} works.`,
      },
      ...blocksOf("benefit", c.benefits.slice(0, 6), "benefit", (b) => ({
        icon: b.ico,
        title: b.t,
        body: b.d,
      })),
    },

    "how-it-works": {
      type: "how-it-works",
      settings: {
        eyebrow: "How it works",
        heading: `Three steps. Ten seconds.`,
      },
      ...blocksOf("step", c.steps.slice(0, 4), "step", (s) => ({
        title: s.t,
        body: s.d,
      })),
    },

    comparison: {
      type: "comparison",
      settings: {
        eyebrow: "Compare",
        heading: "Not all of them are built the same.",
        us_label: c.brand.name,
        them_label: "Typical alternative",
      },
      ...blocksOf("row", c.comparison.slice(0, 10), "row", (r) => ({
        feature: r[0],
        us: r[1],
        them: r[2],
      })),
    },

    ingredients: {
      type: "ingredients",
      settings: {
        eyebrow: "What's inside",
        heading: `${c.ingredients.length} ingredients. Nothing to hide.`,
      },
      ...blocksOf("ingredient", c.ingredients.slice(0, 8), "ingredient", (ing) => ({
        name: ing.name,
        role: ing.use,
        pct: ing.pct,
        swatch: ing.color,
      })),
    },

    reviews: {
      type: "reviews",
      settings: {
        eyebrow: "Reviews",
        heading: "What customers say.",
        rating: String(c.product.rating),
        review_count: String(c.product.reviewCount),
      },
      ...blocksOf("review", c.reviews.slice(0, 12), "review", (r) => ({
        rating: Math.round(r.rating),
        title: r.title,
        body: r.body,
        name: r.name,
        detail: `${r.occ}, ${r.age}`,
        verified: r.verified,
      })),
    },

    ugc: {
      type: "ugc",
      settings: { eyebrow: "From the feed", heading: "Posted, not paid." },
      ...blocksOf("post", c.socialReviews.slice(0, 8), "post", (p) => ({
        platform: p.platform,
        author: p.author,
        handle: p.handle,
        text: p.text,
      })),
    },

    "cross-sell": {
      type: "cross-sell",
      settings: { eyebrow: "Pairs well with", heading: "Complete the routine." },
      ...blocksOf("item", c.crossSells.slice(0, 4), "item", (x) => ({
        icon: x.ico,
        title: x.t,
        rating: String(x.stars),
        count: String(x.count),
        price: `$${x.price}`,
        was: x.was === null ? "" : `$${x.was}`,
      })),
    },

    founder: {
      type: "founder",
      settings: {
        eyebrow: "A note from the founder",
        quote: c.brand.founderQuote,
        name: c.brand.founderName,
        title: c.brand.founderTitle,
      },
    },

    specs: {
      type: "specs",
      settings: { eyebrow: "Specs", heading: "The details." },
      ...blocksOf("row", c.specs.slice(0, 12), "row", (s) => ({
        label: s[0],
        value: s[1],
      })),
    },

    faq: {
      type: "faq",
      settings: { eyebrow: "FAQ", heading: "Answered before you ask." },
      ...blocksOf("qa", c.faq.slice(0, 12), "qa", (f) => ({
        question: f.q,
        answer: f.a,
      })),
    },
  };
}

// ============================================================================
// CSS for the 11 sections — appended to assets/theme.css by the packager.
// Same token vocabulary (--accent, --surface, --card …) as the base sheet.
// ============================================================================
export const SECTIONS_CSS = `
/* ── Section shell ── */
.sl-section-title { font-size: clamp(26px, 3.6vw, 40px); margin: 10px 0 32px; }

/* ── Press strip ── */
.sl-press { padding: 40px 0; border-top: 1px solid var(--line); border-bottom: 1px solid var(--line); }
.sl-press-eyebrow { text-align: center; margin-bottom: 18px; }
.sl-press-row { display: flex; gap: clamp(24px, 5vw, 64px); align-items: baseline; justify-content: center; flex-wrap: wrap; opacity: 0.75; }
.sl-press-logo { font-size: 20px; color: var(--ink-2); }
.sl-press-serif { font-family: Georgia, serif; font-weight: 700; letter-spacing: -0.01em; }
.sl-press-mono { font-family: var(--font-mono); font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; font-size: 15px; }
.sl-press-script { font-family: Georgia, serif; font-style: italic; }

/* ── Benefits ── */
.sl-benefits-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; }
.sl-benefit-card { background: var(--card); border: 1px solid var(--line); border-radius: 12px; padding: 24px; }
.sl-benefit-ico { font-size: 26px; margin-bottom: 12px; }
.sl-benefit-card h3 { margin: 0 0 8px; font-size: 17px; letter-spacing: -0.01em; }
.sl-benefit-card p { margin: 0; color: var(--ink-2); font-size: 14px; line-height: 1.55; }

/* ── Steps ── */
.sl-steps-row { list-style: none; padding: 0; margin: 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 24px; counter-reset: step; }
.sl-step { border-top: 2px solid var(--accent); padding-top: 16px; }
.sl-step-num { color: var(--accent-deep); }
.sl-step h3 { margin: 8px 0 6px; font-size: 18px; }
.sl-step p { margin: 0; color: var(--ink-2); font-size: 14px; line-height: 1.55; }

/* ── Comparison ── */
.sl-compare-table { border: 1px solid var(--line); border-radius: 12px; overflow: hidden; background: var(--card); }
.sl-compare-head, .sl-compare-row { display: grid; grid-template-columns: 1.3fr 1fr 1fr; }
.sl-compare-head { background: var(--surface); font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--muted); font-weight: 600; }
.sl-compare-head span, .sl-compare-row span { padding: 14px 18px; }
.sl-compare-row { border-top: 1px solid var(--line); font-size: 14px; }
.sl-compare-row:hover { background: var(--surface); }
.sl-compare-feature { color: var(--ink); font-weight: 600; }
.sl-compare-us { color: var(--accent-deep); font-weight: 600; }
.sl-compare-them { color: var(--muted); }

/* ── Ingredients ── */
.sl-ingredients-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 14px; }
.sl-ingredient { display: flex; gap: 14px; align-items: flex-start; background: var(--card); border: 1px solid var(--line); border-radius: 12px; padding: 18px; }
.sl-ingredient-dot { width: 22px; height: 22px; border-radius: 999px; flex-shrink: 0; margin-top: 2px; border: 1px solid rgba(0,0,0,0.08); }
.sl-ingredient h3 { margin: 0 0 4px; font-size: 15px; }
.sl-ingredient-pct { color: var(--accent-deep); margin-left: 6px; }
.sl-ingredient p { margin: 0; color: var(--ink-2); font-size: 13px; }

/* ── Reviews — tinted band so the section stands out (rule 51) ── */
.sl-reviews { background: var(--surface); }
.sl-reviews-head { display: flex; justify-content: space-between; align-items: flex-end; gap: 32px; flex-wrap: wrap; margin-bottom: 28px; }
.sl-reviews-summary { display: flex; gap: 28px; align-items: center; flex-wrap: wrap; }
.sl-reviews-score { display: flex; gap: 12px; align-items: center; }
.sl-reviews-big { font-family: var(--font-display); font-size: 48px; font-weight: 600; line-height: 1; }
.sl-reviews-count { font-size: 13px; color: var(--ink-2); }
.sl-reviews-bars { display: grid; gap: 4px; min-width: 180px; }
.sl-rbar { display: grid; grid-template-columns: 34px 1fr; gap: 8px; align-items: center; font-family: var(--font-mono); font-size: 10px; color: var(--muted); }
.sl-rbar i { display: block; height: 6px; border-radius: 999px; background: var(--line); overflow: hidden; }
.sl-rbar b { display: block; height: 100%; background: var(--accent); border-radius: 999px; }
.sl-reviews-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
.sl-review-card { background: var(--card); border: 1px solid var(--line); border-radius: 12px; padding: 20px; display: flex; flex-direction: column; gap: 10px; }
.sl-review-top { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
.sl-verified { color: var(--accent-deep); }
.sl-review-title { margin: 0; font-size: 16px; letter-spacing: -0.01em; }
.sl-review-body { margin: 0; color: var(--ink-2); font-size: 14px; line-height: 1.55; flex: 1; }
.sl-review-photo img { border-radius: 8px; }
.sl-review-meta { display: flex; gap: 10px; align-items: center; font-size: 13px; color: var(--ink-2); }
.sl-review-avatar { width: 28px; height: 28px; border-radius: 999px; background: var(--accent-soft); color: var(--accent-deep); display: inline-flex; align-items: center; justify-content: center; font-weight: 700; font-size: 13px; }

/* ── UGC ── */
.sl-ugc-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px; }
.sl-ugc-card { margin: 0; background: var(--card); border: 1px solid var(--line); border-radius: 12px; padding: 18px; }
.sl-ugc-card header { display: flex; justify-content: space-between; gap: 10px; align-items: baseline; margin-bottom: 10px; }
.sl-ugc-platform { color: var(--accent-deep); }
.sl-ugc-author { font-size: 13px; font-weight: 600; }
.sl-ugc-author em { color: var(--muted); font-weight: 400; font-style: normal; }
.sl-ugc-card p { margin: 0; font-size: 14px; color: var(--ink-2); line-height: 1.55; }

/* ── Cross-sell ── */
.sl-xsell-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px; }
.sl-xsell-card { background: var(--card); border: 1px solid var(--line); border-radius: 12px; padding: 16px; display: flex; flex-direction: column; gap: 8px; transition: border-color 160ms ease; }
a.sl-xsell-card:hover { border-color: var(--accent); }
.sl-xsell-img { aspect-ratio: 1; border-radius: 8px; overflow: hidden; background: var(--surface); }
.sl-xsell-img img { width: 100%; height: 100%; object-fit: cover; }
.sl-xsell-ph { display: grid; place-items: center; font-size: 40px; }
.sl-xsell-card h3 { margin: 4px 0 0; font-size: 15px; }
.sl-xsell-stars { font-size: 12px; color: var(--muted); }
.sl-xsell-price { font-weight: 600; }
.sl-xsell-price s { color: var(--muted); font-weight: 400; margin-left: 6px; }
.sl-xsell-note { margin-top: 14px; }

/* ── Founder ── */
.sl-founder-grid { display: grid; grid-template-columns: auto 1fr; gap: 32px; align-items: center; max-width: 860px; }
@media (max-width: 640px) { .sl-founder-grid { grid-template-columns: 1fr; } }
.sl-founder-avatar { width: 96px; height: 96px; border-radius: 999px; background: var(--accent-soft); color: var(--accent-deep); display: grid; place-items: center; font-family: var(--font-display); font-size: 40px; font-weight: 600; }
.sl-founder-photo { width: 96px; height: 96px; border-radius: 999px; object-fit: cover; }
.sl-founder-quote { margin: 10px 0 14px; font-family: var(--font-display); font-size: clamp(20px, 2.6vw, 28px); line-height: 1.3; letter-spacing: -0.01em; }
.sl-founder-sig { color: var(--ink-2); font-size: 14px; }

/* ── Specs ── */
.sl-specs-table { margin: 0; border: 1px solid var(--line); border-radius: 12px; overflow: hidden; background: var(--card); max-width: 720px; }
.sl-specs-row { display: grid; grid-template-columns: 1fr 1.4fr; }
.sl-specs-row:nth-child(even) { background: var(--surface); }
.sl-specs-row:hover { background: var(--accent-soft); }
.sl-specs-row dt { padding: 12px 18px; font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted); font-weight: 600; align-self: center; }
.sl-specs-row dd { margin: 0; padding: 12px 18px; font-size: 14px; }

/* ── FAQ ── */
.sl-faq-list { max-width: 720px; display: grid; gap: 10px; }
.sl-faq-item { background: var(--card); border: 1px solid var(--line); border-radius: 12px; padding: 0 20px; }
.sl-faq-item summary { list-style: none; cursor: pointer; display: flex; justify-content: space-between; align-items: center; gap: 16px; padding: 16px 0; font-weight: 600; font-size: 15px; }
.sl-faq-item summary::-webkit-details-marker { display: none; }
.sl-faq-plus { color: var(--accent-deep); font-size: 20px; transition: transform 160ms ease; }
.sl-faq-item[open] .sl-faq-plus { transform: rotate(45deg); }
.sl-faq-item p { margin: 0; padding: 0 0 18px; color: var(--ink-2); font-size: 14px; line-height: 1.6; }
`;
