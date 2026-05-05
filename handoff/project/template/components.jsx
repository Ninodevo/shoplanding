/* global React */
const { useState, useEffect, useRef } = React;

// ===== PLACEHOLDER PRODUCT DATA =====
// Swap these per-product. Structure stays.
const PRODUCT = {
  collection: 'Daily Essentials',
  title: 'Product Name Goes Here',
  subtitle: 'The unique, effortless [category] that solves [pain point] in seconds — exclusively from Brand Co.',
  rating: 4.8,
  reviewCount: 487,
  price: 39,
  was: 49,
  currency: '$',
  inStock: true,
  stockLeft: 23,
  viewing: 47,
  soldThisWeek: 312,
  keyBenefits: [
    'Solves [main customer problem] without the hassle',
    'Made with [hero ingredient] — clinically tested for [benefit]',
    'Plant-based, cruelty-free, and ridiculously easy to use',
    'Backed by our 30-day money-back guarantee',
  ],
  variants: {
    color: [
      { id: 'natural', name: 'Natural', swatch: '#d4cdbe' },
      { id: 'rose', name: 'Rose', swatch: '#e8b8b0' },
      { id: 'sage', name: 'Sage', swatch: '#a8c4a0' },
      { id: 'midnight', name: 'Midnight', swatch: '#2a2a3a' },
    ],
    size: [
      { id: 'sm', name: 'S' },
      { id: 'md', name: 'M' },
      { id: 'lg', name: 'L' },
      { id: 'xl', name: 'XL' },
    ],
  },
  offers: [
    { id: 1, qty: 1, label: '1× ' + 'Single', price: 39, was: 49, perUnit: 39, badge: null, badgeText: '' },
    { id: 2, qty: 2, label: '2× Pack', price: 70, was: 98, perUnit: 35, badge: 'rec', badgeText: 'Recommended' },
    { id: 3, qty: 3, label: '3× Bundle', price: 99, was: 147, perUnit: 33, badge: 'best', badgeText: 'Best Value' },
  ],
};

const BENEFITS = [
  { ico: '✦', t: 'Made with care', d: 'Small-batch produced in California with traceable, ethically-sourced ingredients.' },
  { ico: '◐', t: 'Visible results', d: 'Clinically tested. 9 out of 10 customers see a difference within 14 days.' },
  { ico: '◇', t: 'Refillable & recyclable', d: 'Designed for the long haul. Refill packs cut packaging by 80%.' },
  { ico: '✓', t: 'Risk-free guarantee', d: 'Try it for 30 days. Don\'t love it? Full refund, keep the product.' },
];

const STEPS = [
  { n: '01', t: 'Open & prep', d: 'Twist the cap and apply a small amount to clean, dry skin.' },
  { n: '02', t: 'Apply with care', d: 'Use light, circular motions. A little goes a long way.' },
  { n: '03', t: 'Enjoy results', d: 'See visible improvement within 14 days of consistent use.' },
];

const INGREDIENTS = [
  { color: '#e8d8b8', name: 'Hero Ingredient A', use: '40% — primary active', pct: '40%' },
  { color: '#c8d8b8', name: 'Hero Ingredient B', use: 'Calming + soothing', pct: '20%' },
  { color: '#d8c8e8', name: 'Hero Ingredient C', use: 'Long-lasting hydration', pct: '15%' },
  { color: '#e8c8b8', name: 'Hero Ingredient D', use: 'Antioxidant boost', pct: '10%' },
  { color: '#b8d8e8', name: 'Hero Ingredient E', use: 'Skin barrier support', pct: '8%' },
  { color: '#f0e8d0', name: 'Hero Ingredient F', use: 'Vitamin complex', pct: '5%' },
  { color: '#d8d0c0', name: 'Carrier base', use: 'Plant-derived', pct: '2%' },
];

const REVIEWS = [
  { rating: 5, title: 'Exceeded every expectation', body: 'I was skeptical but bought it on the recommendation. Two weeks in and I\'m a convert. The texture, the results, the packaging — everything is thoughtful.', name: 'Sarah Mitchell', age: 34, occ: 'Marketing Director', verified: true, photos: 2 },
  { rating: 5, title: 'Worth every penny', body: 'I\'ve tried every product in this category. This is the only one I\'ve repurchased. The 3-pack is the move — you\'ll go through it faster than you think.', name: 'James Chen', age: 41, occ: 'Software Engineer', verified: true, photos: 1 },
  { rating: 4, title: 'Great product, slow shipping', body: 'Product itself is fantastic, exactly as described. Shipping took a bit longer than expected (8 days). Would still recommend.', name: 'Priya Patel', age: 29, occ: 'Designer', verified: true, photos: 0 },
  { rating: 5, title: 'My husband stole mine', body: 'I had to order a second one because my husband kept using mine. Now we both have one. The scent is subtle but addictive.', name: 'Maria Rodriguez', age: 38, occ: 'Teacher', verified: true, photos: 3 },
];

const SOCIAL_REVIEWS = [
  { platform: '𝕏', author: 'Alex Park', handle: '@alexpark', text: 'Okay I finally bought the [product] everyone\'s been tweeting about. It\'s real. It\'s good. I owe you all an apology for the eye rolling.' },
  { platform: '◉', author: 'Jordan K.', handle: '@jordan.kay', text: '3 weeks of use and the difference is genuinely insane. Posting before/afters in my stories. This isn\'t a #ad I just love it.' },
  { platform: '◉', author: 'Taylor S.', handle: '@_taylors', text: 'Update: still obsessed. Repurchased the 3-pack. Sent one to my mom. She texted me "WOW" in all caps.' },
];

const PRESS = [
  { text: 'VOGUE', cls: 'mono' },
  { text: 'goop', cls: 'serif' },
  { text: 'Refinery29', cls: 'script' },
  { text: 'BAZAAR', cls: 'mono' },
  { text: 'Forbes', cls: 'serif' },
  { text: 'WELL+GOOD', cls: 'mono' },
];

const FAQ = [
  { q: 'How long does one [product] last?', a: 'On average, one unit lasts 6–8 weeks with daily use. Many customers opt for the 2-pack or 3-pack to ensure they always have a backup.' },
  { q: 'When will I see results?', a: 'Most customers report visible improvement within 14 days of consistent daily use. For best results, follow the 3-step routine on the packaging.' },
  { q: 'Is it safe for sensitive skin?', a: 'Yes. The formula is fragrance-free, hypoallergenic, and dermatologist-tested. We recommend a patch test if you have known sensitivities.' },
  { q: 'How does Subscribe & Save work?', a: 'Pick a frequency (every 30, 60, or 90 days), save 15% on every order, free shipping included, and skip or cancel anytime in one click.' },
  { q: 'Do you ship internationally?', a: 'Yes — we ship to 38 countries. Free shipping over $35 in the US, $60 internationally. Most US orders arrive in 2–5 business days.' },
  { q: 'What if I don\'t love it?', a: 'You\'re covered by our 30-day love-it-or-refund guarantee. Email support@brand.com and we\'ll refund your order in full — keep the product.' },
  { q: 'Where is it made?', a: 'Formulated and manufactured in California, USA, in our small-batch facility. Every batch is third-party tested for safety and purity.' },
];

const SPECS = [
  ['Net weight', '3.4 oz / 100 g'],
  ['Dimensions', '4.5" × 2.0" × 2.0"'],
  ['Format', 'Solid stick'],
  ['Shelf life', '24 months unopened, 12 months after opening'],
  ['Country of origin', 'Made in California, USA'],
  ['Certifications', 'Leaping Bunny · USDA Organic · Climate Neutral'],
  ['Allergens', 'Contains tree nut derivatives'],
];

const CROSS_SELLS = [
  { t: 'Companion Product A', stars: 4.7, count: 142, price: 24, was: 29, ico: '◐' },
  { t: 'Companion Product B', stars: 4.9, count: 308, price: 18, was: null, ico: '◇' },
  { t: 'Travel Kit (3 items)', stars: 4.8, count: 96, price: 65, was: 84, ico: '✦' },
];

// ============= COMPONENTS =============

function AnnouncementBar() {
  const items = [
    'Free shipping on US orders $35+',
    '30-day money-back guarantee',
    'Subscribe & save 15% always',
    'Now shipping to 38 countries',
    'Cruelty-free · Climate Neutral certified',
  ];
  const all = [...items, ...items, ...items];
  return (
    <div className="announce">
      <div className="announce-track">
        {all.map((t, i) => <span key={i}><span className="pip"></span>{t}</span>)}
      </div>
    </div>
  );
}

function FreeShipBar({ progress = 65, threshold = 35, current = 22.75 }) {
  const remaining = (threshold - current).toFixed(2);
  return (
    <div className="free-ship-bar">
      You're <b>${remaining}</b> away from <b>free shipping</b>
      <span className="fsb-progress"><span className="fsb-progress-fill" style={{width: `${progress}%`}}></span></span>
    </div>
  );
}

function Nav({ cartCount }) {
  return (
    <nav className="nav">
      <div className="container nav-inner">
        <div className="nav-links">
          <a href="#shop">Shop</a>
          <a href="#how">How it works</a>
          <a href="#reviews">Reviews</a>
          <a href="#faq">FAQ</a>
        </div>
        <a href="#" className="logo">brand.</a>
        <div className="nav-actions">
          <button className="icon-btn" aria-label="Search">⌕</button>
          <button className="icon-btn" aria-label="Account">◐</button>
          <button className="icon-btn" aria-label="Cart">
            ⊞
            {cartCount > 0 && <span className="count">{cartCount}</span>}
          </button>
        </div>
      </div>
    </nav>
  );
}

function StickyProductBar({ visible, price, addToCart }) {
  return (
    <div className={`sticky-prod ${visible ? 'visible' : ''}`}>
      <div className="container sticky-prod-inner">
        <div className="sticky-prod-thumb">
          <div className="ph-product" style={{width: '70%', height: '85%', borderRadius: '6px', fontSize: 0}}></div>
        </div>
        <div className="sticky-prod-info">
          <div className="t">{PRODUCT.title}</div>
          <div className="s">
            <span className="sticky-prod-stars">{'★'.repeat(5)}</span> {PRODUCT.rating} ({PRODUCT.reviewCount})
          </div>
        </div>
        <div className="sticky-prod-price">${price}</div>
        <button className="atc-btn" onClick={addToCart}>Add to cart →</button>
      </div>
    </div>
  );
}

function Gallery() {
  const [active, setActive] = useState(0);
  const slides = [
    { type: 'product', label: 'Main shot' },
    { type: 'lifestyle', label: 'In use' },
    { type: 'detail', label: 'Detail' },
    { type: 'video', label: 'Video' },
    { type: 'pack', label: 'Packaging' },
  ];
  return (
    <div className="gallery">
      <div className="gallery-main">
        <div className="ph">
          <div className="ph-product">PRODUCT IMAGE</div>
        </div>
        <div className="gallery-badges">
          <span className="gallery-badge sale">−20% OFF</span>
          <span className="gallery-badge new">New</span>
        </div>
        <div className="gallery-arrows">
          <button className="gallery-arrow" onClick={() => setActive((active - 1 + slides.length) % slides.length)}>‹</button>
          <button className="gallery-arrow" onClick={() => setActive((active + 1) % slides.length)}>›</button>
        </div>
        <span className="gallery-zoom-hint">⌕ Click to zoom</span>
      </div>
      <div className="gallery-thumbs">
        {slides.map((s, i) => (
          <button key={i} className={`thumb ${active === i ? 'active' : ''} ${s.type === 'video' ? 'video' : ''}`} onClick={() => setActive(i)}>
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function ProductInfo({ qty, setQty, offer, setOffer, color, setColor, size, setSize, sub, setSub, addToCart, addedFlash }) {
  const sel = PRODUCT.offers.find(o => o.id === offer);
  const subDiscount = sub ? 0.85 : 1;
  const totalPrice = (sel.price * subDiscount).toFixed(2);
  const wasTotalPrice = sel.was;
  const savePct = Math.round((1 - sel.price / sel.was) * 100);

  return (
    <div className="product-info">
      <div className="breadcrumbs">
        <a href="#">Home</a>
        <span className="sep">/</span>
        <a href="#">Shop</a>
        <span className="sep">/</span>
        <a href="#">{PRODUCT.collection}</a>
        <span className="sep">/</span>
        <span>{PRODUCT.title}</span>
      </div>
      <div className="collection-tag mono">{PRODUCT.collection}</div>
      <h1 className="display product-title">{PRODUCT.title}</h1>
      <p className="product-subtitle">{PRODUCT.subtitle}</p>

      <div className="rating-row">
        <span className="rating-stars">{'★'.repeat(5)}</span>
        <a href="#reviews" className="rating-link">{PRODUCT.rating} · Read {PRODUCT.reviewCount} reviews</a>
        <span className="rating-pill">98% would buy again</span>
      </div>

      <ul className="key-benefits">
        {PRODUCT.keyBenefits.map((k, i) => (
          <li key={i}><span className="check">✓</span><span>{k}</span></li>
        ))}
      </ul>

      <div className="price-block">
        <div className="price-row">
          <span className="price-current">${sel.price}</span>
          {sel.was !== sel.price && <span className="price-was">${sel.was}</span>}
          {sel.was !== sel.price && <span className="price-save">SAVE {savePct}%</span>}
        </div>
        <div className="price-installments">
          or 4 interest-free payments of <b>${(sel.price / 4).toFixed(2)}</b> with <span className="klarna-pill">Klarna</span> · <b>Afterpay</b>
        </div>
      </div>

      <div className="variant-block">
        <div className="variant-label">
          <span>Color</span>
          <span className="selected">{PRODUCT.variants.color.find(c => c.id === color)?.name}</span>
        </div>
        <div className="variant-options">
          {PRODUCT.variants.color.map(c => (
            <button key={c.id} className={`variant-pill ${color === c.id ? 'active' : ''}`} onClick={() => setColor(c.id)}>
              <span className="swatch" style={{background: c.swatch}}></span>{c.name}
            </button>
          ))}
        </div>
      </div>

      <div className="variant-block">
        <div className="variant-label">
          <span>Size <span style={{color: 'var(--muted)', fontWeight: 400}}>· {PRODUCT.variants.size.find(s => s.id === size)?.name}</span></span>
          <a href="#" className="size-guide-link">Size guide ↗</a>
        </div>
        <div className="variant-options">
          {PRODUCT.variants.size.map(s => (
            <button key={s.id} className={`variant-pill size ${size === s.id ? 'active' : ''}`} onClick={() => setSize(s.id)}>
              {s.name}
            </button>
          ))}
        </div>
      </div>

      <div className="variant-block">
        <div className="variant-label">
          <span>Bundle & Save</span>
        </div>
        <div className="offers">
          {PRODUCT.offers.map(o => (
            <div key={o.id} className={`offer-card ${offer === o.id ? 'active' : ''}`} onClick={() => setOffer(o.id)}>
              <span className="offer-radio"></span>
              <div className="offer-info">
                <div className="t">
                  {o.label}
                  {o.badge && <span className={`offer-badge ${o.badge}`} style={{marginLeft: 8}}>{o.badgeText}</span>}
                </div>
                <div className="s">${o.perUnit.toFixed(2)} per unit</div>
              </div>
              <div className="offer-prices">
                <div className="offer-price-now">${o.price}</div>
                {o.was !== o.price && <div className="offer-price-was">${o.was}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="variant-block">
        <div className="variant-label"><span>Delivery</span></div>
        <div className="offers">
          <div className={`offer-card ${!sub ? 'active' : ''}`} onClick={() => setSub(false)}>
            <span className="offer-radio"></span>
            <div className="offer-info">
              <div className="t">One-time purchase</div>
              <div className="s">Single delivery, no commitment</div>
            </div>
            <div className="offer-prices"><div className="offer-price-now">${sel.price}</div></div>
          </div>
          <div className={`offer-card ${sub ? 'active' : ''}`} onClick={() => setSub(true)}>
            <span className="offer-radio"></span>
            <div className="offer-info">
              <div className="t">Subscribe & Save 15% <span className="offer-badge top" style={{marginLeft: 6}}>Most flexible</span></div>
              <div className="s">Skip, swap, or cancel anytime · Free shipping always</div>
            </div>
            <div className="offer-prices">
              <div className="offer-price-now">${(sel.price * 0.85).toFixed(2)}</div>
              <div className="offer-price-was">${sel.price}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="urgency">
        <span>🔥</span>
        <span>Order in <b className="timer-block">14:32</b> for <b>delivery by Thursday</b></span>
      </div>

      <div className="qty-atc">
        <div className="qty-stepper">
          <button onClick={() => setQty(Math.max(1, qty - 1))}>−</button>
          <input value={qty} onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))} />
          <button onClick={() => setQty(qty + 1)}>+</button>
        </div>
        <button className={`atc-btn ${addedFlash ? 'added' : ''}`} onClick={addToCart}>
          ⊞ {addedFlash ? '✓ Added to cart' : 'Add to cart'} · ${totalPrice}
          {sub && <span style={{textDecoration: 'line-through', opacity: 0.7, fontSize: 13, fontWeight: 500}}>${wasTotalPrice}</span>}
        </button>
      </div>

      <div className="pay-divider"><span style={{background: 'white', padding: '0 12px'}}>or pay with</span></div>
      <div className="express-pay">
        <button className="pay-btn paypal">PayPal</button>
        <button className="pay-btn applepay">  Pay</button>
        <button className="pay-btn gpay">G Pay</button>
        <button className="pay-btn shoppay">Shop Pay</button>
      </div>

      <div className="delivery">
        <div className="delivery-row">
          <span className="ico">📦</span>
          <span>🇺🇸 Ships from <b>California</b> · <b>Free shipping</b> on orders over $35</span>
        </div>
        <div className="delivery-row">
          <span className="ico">🚚</span>
          <span>Estimated delivery: <b>{getDeliveryDate()}</b> with USPS Priority</span>
        </div>
        <div className="delivery-row">
          <span className="ico">●</span>
          <span className="in-stock">In stock</span>
          <span style={{color: 'var(--muted)'}}>·</span>
          <span className="scarcity">Only {PRODUCT.stockLeft} left at this price</span>
        </div>
        <div className="delivery-row">
          <span className="ico">🔒</span>
          <span>Secure checkout · 30-day money-back guarantee · Free returns</span>
        </div>
      </div>

      <div className="live-activity">
        <span className="live-dot"></span>
        <span><b>{PRODUCT.viewing} people</b> are looking at this · <b>{PRODUCT.soldThisWeek}</b> sold this week</span>
      </div>

      <div className="trust-mini">
        <div className="item"><div className="ico">🌱</div>Plant-based<br/>formula</div>
        <div className="item"><div className="ico">🐰</div>Cruelty-free<br/>certified</div>
        <div className="item"><div className="ico">♻️</div>Refillable<br/>packaging</div>
        <div className="item"><div className="ico">💛</div>1% donated<br/>to charity</div>
      </div>

      <ProductTabs />
    </div>
  );
}

function getDeliveryDate() {
  const d = new Date();
  d.setDate(d.getDate() + 4);
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}

function ProductTabs() {
  const [tab, setTab] = useState(0);
  const tabs = ['Description', 'How to use', 'What\'s included', 'Shipping & returns'];
  const content = [
    <div key="0">
      <p><b>The full story.</b> Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam.</p>
      <p>Quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore.</p>
      <p><b>Designed for daily use.</b> Eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
    </div>,
    <div key="1">
      <p><b>Step 1.</b> Apply a small amount to clean, dry skin in the morning and evening.</p>
      <p><b>Step 2.</b> Massage in light circular motions until fully absorbed.</p>
      <p><b>Step 3.</b> Follow with sunscreen during the day. That's it.</p>
    </div>,
    <div key="2">
      <p>Each order includes:</p>
      <p>• 1× Product (3.4 oz)<br/>• 1× User guide<br/>• 1× Reusable travel pouch<br/>• Welcome letter from the founder</p>
    </div>,
    <div key="3">
      <p><b>Shipping:</b> Free over $35 in the US. $5 flat under that. International from $9.</p>
      <p><b>Returns:</b> 30-day money-back guarantee, no questions asked. Email <a href="#" style={{color: 'var(--accent-deep)'}}>support@brand.com</a> to start a return.</p>
    </div>,
  ];
  return (
    <div className="tabs">
      <div className="tab-headers">
        {tabs.map((t, i) => (
          <button key={i} className={`tab-header ${tab === i ? 'active' : ''}`} onClick={() => setTab(i)}>{t}</button>
        ))}
      </div>
      <div className="tab-content">{content[tab]}</div>
    </div>
  );
}

function Press() {
  return (
    <div className="press">
      <div className="container">
        <div className="press-title mono">As featured in</div>
        <div className="press-row">
          {PRESS.map((p, i) => <div key={i} className={`press-logo ${p.cls}`}>{p.text}</div>)}
        </div>
      </div>
    </div>
  );
}

function BenefitsSection() {
  return (
    <section className="section">
      <div className="container">
        <div className="section-title">
          <div className="eyebrow">Why customers choose us</div>
          <h2 className="display">Better ingredients. Better results.</h2>
          <p>Designed thoughtfully, made carefully, backed transparently. Here's what makes it different.</p>
        </div>
        <div className="benefits-grid">
          {BENEFITS.map((b, i) => (
            <div key={i} className="benefit-card">
              <div className="ico">{b.ico}</div>
              <h3>{b.t}</h3>
              <p>{b.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section className="section" id="how" style={{background: 'var(--surface)'}}>
      <div className="container">
        <div className="section-title">
          <div className="eyebrow">How it works</div>
          <h2 className="display">Three steps. That's it.</h2>
          <p>No complicated routines. No guesswork. Just a simple ritual that works.</p>
        </div>
        <div className="steps">
          {STEPS.map((s, i) => (
            <div key={i} className="step-card">
              <div className="step-num display">{s.n}</div>
              <h4>{s.t}</h4>
              <p>{s.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Comparison() {
  return (
    <section className="section">
      <div className="container container-narrow">
        <div className="section-title">
          <div className="eyebrow">The difference</div>
          <h2 className="display">How we stack up</h2>
        </div>
        <div className="compare-table">
          <div className="compare-row head">
            <div className="compare-cell"></div>
            <div className="compare-cell us">Our Brand</div>
            <div className="compare-cell">Conventional</div>
          </div>
          {[
            ['Plant-based ingredients', 'Always', 'Sometimes'],
            ['Refillable packaging', '100% refill program', 'Single-use plastic'],
            ['Cruelty-free', 'Leaping Bunny certified', 'Often unclear'],
            ['Money-back guarantee', '30 days, no questions', '14 days, restocking fee'],
            ['Average customer rating', '4.8 / 5 (487 reviews)', '3.9 / 5'],
            ['Price per use', '$0.42', '$0.78'],
          ].map(([f, u, t], i) => (
            <div key={i} className="compare-row">
              <div className="compare-cell feature">{f}</div>
              <div className="compare-cell us"><span className="yes">✓</span>{u}</div>
              <div className="compare-cell"><span className="no">−</span>{t}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Ingredients() {
  return (
    <section className="section" style={{background: 'var(--surface)'}}>
      <div className="container">
        <div className="ingredients-grid">
          <div>
            <div className="mono" style={{color: 'var(--accent-deep)', marginBottom: 12}}>What's inside</div>
            <h2 className="display" style={{fontSize: 'clamp(28px, 3.5vw, 40px)', marginBottom: 16}}>Reads like a recipe, not a chemistry lab.</h2>
            <p style={{color: 'var(--ink-2)', marginBottom: 24}}>Every ingredient has a job. We list them all, explain what they do, and tell you why they're here.</p>
            <div style={{padding: 20, background: 'var(--ink)', color: 'white', borderRadius: 'var(--r-md)'}}>
              <div className="mono" style={{opacity: 0.6, marginBottom: 8}}>Never:</div>
              <div style={{fontSize: 14, lineHeight: 1.6, opacity: 0.9}}>
                <s>Parabens</s> · <s>Sulfates</s> · <s>Silicones</s> · <s>PEGs</s> · <s>Synthetic fragrance</s> · <s>Mineral oil</s> · <s>Animal testing</s>
              </div>
            </div>
          </div>
          <div className="ingredient-list">
            {INGREDIENTS.map((ing, i) => (
              <div key={i} className="ingredient">
                <div className="ingredient-dot" style={{background: ing.color}}></div>
                <div className="ingredient-info" style={{flex: 1}}>
                  <h4>{ing.name}</h4>
                  <p>{ing.use}</p>
                </div>
                <div className="ingredient-pct">{ing.pct}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ReviewsSection() {
  const [filter, setFilter] = useState('all');
  const dist = [
    { stars: 5, pct: 82, count: 399 },
    { stars: 4, pct: 12, count: 58 },
    { stars: 3, pct: 4, count: 19 },
    { stars: 2, pct: 1, count: 7 },
    { stars: 1, pct: 1, count: 4 },
  ];
  return (
    <section className="section" id="reviews">
      <div className="container">
        <div className="section-title">
          <div className="eyebrow">{PRODUCT.reviewCount} verified reviews</div>
          <h2 className="display">Real customers, real results</h2>
        </div>
        <div className="reviews-summary">
          <div style={{textAlign: 'center'}}>
            <div className="summary-stars">{'★'.repeat(5)}</div>
            <div className="summary-big-rating">{PRODUCT.rating}</div>
            <div className="summary-count">out of 5 · {PRODUCT.reviewCount} reviews</div>
          </div>
          <div className="review-bars">
            {dist.map(d => (
              <div key={d.stars} className="review-bar">
                <span className="lbl">{d.stars} stars</span>
                <div className="bar"><div className="bar-fill" style={{width: `${d.pct}%`}}></div></div>
                <span className="pct">{d.pct}%</span>
              </div>
            ))}
          </div>
        </div>
        <div className="reviews-controls">
          <div className="review-filters">
            {['all', '5 stars', '4 stars', 'with photos', 'most recent'].map(f => (
              <button key={f} className={`review-filter ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>{f}</button>
            ))}
          </div>
          <button className="btn btn-outline" style={{padding: '8px 18px', fontSize: 13}}>Write a review</button>
        </div>
        <div className="reviews-grid">
          {REVIEWS.map((r, i) => (
            <div key={i} className="review-card">
              <div className="review-card-stars">{'★'.repeat(r.rating)}{'☆'.repeat(5-r.rating)}</div>
              <h4>{r.title}</h4>
              <p>"{r.body}"</p>
              {r.photos > 0 && (
                <div className="photos">
                  {Array.from({length: r.photos}).map((_, j) => (
                    <div key={j} className="photo">📷</div>
                  ))}
                </div>
              )}
              <div className="review-author">
                <div className="review-avatar">{r.name.split(' ').map(n => n[0]).join('')}</div>
                <div className="meta">
                  <div className="name">{r.name} <span style={{color: 'var(--muted)', fontWeight: 400}}>· {r.age}</span></div>
                  <div className="occ">{r.occ}</div>
                  {r.verified && <span className="verified">✓ Verified Buyer</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div style={{textAlign: 'center'}}>
          <button className="btn btn-outline">Load more reviews</button>
        </div>

        <div style={{marginTop: 56}}>
          <div className="mono" style={{textAlign: 'center', color: 'var(--muted)', marginBottom: 16}}>From around the internet</div>
          <div className="social-row">
            {SOCIAL_REVIEWS.map((s, i) => (
              <div key={i} className="social-card">
                <span className="platform">{s.platform}</span>
                <div className="author">
                  <div className="author-pic"></div>
                  <div>
                    <div className="author-name">{s.author}</div>
                    <div className="author-handle">{s.handle}</div>
                  </div>
                </div>
                <p>{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function UGC() {
  const tiles = [
    { c: '#e8d8b8', h: '@happycustomer1', face: '◐' },
    { c: '#c8d8b8', h: '@reallifeuse', face: '◑' },
    { c: '#d8c8e8', h: '@dailyroutine', face: '◒' },
    { c: '#e8c8b8', h: '@beforeafter', face: '◓' },
    { c: '#b8d8e8', h: '@bathroom_shelf', face: '◔' },
    { c: '#f0e8d0', h: '@wellness_diary', face: '◕' },
  ];
  return (
    <section className="section" style={{background: 'var(--surface)'}}>
      <div className="container">
        <div className="section-title">
          <div className="eyebrow">#brandname on the gram</div>
          <h2 className="display">Tag us, we'll regram you.</h2>
        </div>
        <div className="ugc-grid">
          {tiles.map((t, i) => (
            <div key={i} className="ugc-tile" style={{background: `linear-gradient(135deg, ${t.c}, ${t.c}cc)`}}>
              <div className="face">{t.face}</div>
              <span className="handle">{t.h}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CrossSell() {
  return (
    <section className="section">
      <div className="container">
        <div className="section-title">
          <div className="eyebrow">Frequently bought together</div>
          <h2 className="display">Pair it with</h2>
        </div>
        <div className="bundle-cs">
          {CROSS_SELLS.map((c, i) => (
            <div key={i} className="cs-card">
              <div className="img"><div style={{fontSize: 48, opacity: 0.3}}>{c.ico}</div></div>
              <h4>{c.t}</h4>
              <div className="stars">{'★'.repeat(5)} {c.stars} ({c.count})</div>
              <div className="price">${c.price}{c.was && <span className="was">${c.was}</span>}</div>
              <button className="btn btn-outline btn-block">+ Add to cart</button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FounderSection() {
  return (
    <section className="section">
      <div className="container">
        <div className="founder">
          <div className="founder-img">[ founder portrait ]</div>
          <div>
            <div className="mono" style={{color: 'var(--accent-deep)', marginBottom: 16}}>Why we started</div>
            <blockquote>
              "I built this product because I couldn't find one that actually worked the way I wanted it to. Three years, fourteen formulations, and a lot of feedback later — here it is."
            </blockquote>
            <div className="founder-name">Founder Name</div>
            <div className="founder-title">Founder & Formulator · Ex-cosmetic chemist</div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Specs() {
  return (
    <section className="section" style={{background: 'var(--surface)'}}>
      <div className="container container-narrow">
        <div className="section-title">
          <div className="eyebrow">The fine print</div>
          <h2 className="display">Specifications</h2>
        </div>
        <div className="specs-table">
          {SPECS.map(([k, v], i) => (
            <div key={i} className="specs-row">
              <div className="specs-cell k">{k}</div>
              <div className="specs-cell">{v}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQSection() {
  const [open, setOpen] = useState(0);
  return (
    <section className="section" id="faq">
      <div className="container container-narrow">
        <div className="section-title">
          <div className="eyebrow">FAQ</div>
          <h2 className="display">Frequently asked questions</h2>
        </div>
        <div className="faq-list">
          {FAQ.map((item, i) => (
            <div key={i} className={`faq-item ${open === i ? 'open' : ''}`}>
              <button className="faq-q" onClick={() => setOpen(open === i ? -1 : i)}>
                <span>{item.q}</span>
                <span className="faq-toggle">+</span>
              </button>
              {open === i && <div className="faq-a">{item.a}</div>}
            </div>
          ))}
        </div>
        <div style={{textAlign: 'center', marginTop: 32, padding: 24, background: 'var(--surface)', borderRadius: 'var(--r-lg)'}}>
          <div style={{fontWeight: 600, marginBottom: 8}}>Still have questions?</div>
          <div style={{color: 'var(--ink-2)', fontSize: 14, marginBottom: 16}}>We reply within 4 hours, Mon–Fri.</div>
          <div style={{display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap'}}>
            <button className="btn btn-outline" style={{padding: '10px 18px', fontSize: 14}}>💬 Live chat</button>
            <button className="btn btn-outline" style={{padding: '10px 18px', fontSize: 14}}>✉️ Email us</button>
          </div>
        </div>
      </div>
    </section>
  );
}

function FinalCTA({ onShop }) {
  return (
    <section className="final-cta">
      <h2 className="display">Ready to try it?</h2>
      <p>30-day money-back guarantee. Free shipping over $35. Cancel subscriptions in one click.</p>
      <button className="btn btn-primary btn-lg" onClick={onShop}>Shop now → ${PRODUCT.price}</button>
      <div className="trust-row">
        <span>✓ Free shipping over $35</span>
        <span>✓ 30-day guarantee</span>
        <span>✓ {PRODUCT.reviewCount}+ five-star reviews</span>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <div className="logo">brand.</div>
            <p>One sentence about the brand mission. Made by humans, in [location], for people who care.</p>
            <div className="footer-trust">
              <span className="trust-seal">🔒 SSL Secured</span>
              <span className="trust-seal">✓ Norton Verified</span>
              <span className="trust-seal">★ Trustpilot 4.8</span>
            </div>
          </div>
          <div>
            <h4>Shop</h4>
            <ul>
              <li><a href="#">All products</a></li>
              <li><a href="#">Bundles</a></li>
              <li><a href="#">Subscriptions</a></li>
              <li><a href="#">Gift cards</a></li>
              <li><a href="#">Sale</a></li>
            </ul>
          </div>
          <div>
            <h4>Help</h4>
            <ul>
              <li><a href="#">FAQ</a></li>
              <li><a href="#">Shipping</a></li>
              <li><a href="#">Returns & refunds</a></li>
              <li><a href="#">Track order</a></li>
              <li><a href="#">Contact us</a></li>
            </ul>
          </div>
          <div>
            <h4>About</h4>
            <ul>
              <li><a href="#">Our story</a></li>
              <li><a href="#">Ingredients</a></li>
              <li><a href="#">Sustainability</a></li>
              <li><a href="#">Press</a></li>
              <li><a href="#">Careers</a></li>
            </ul>
          </div>
          <div>
            <h4>Stay connected</h4>
            <div className="contact-line">
              <div>📧 hello@brand.com</div>
              <div>📞 +1 (800) 555-0142</div>
              <div>📍 1234 Mission St, San Francisco, CA</div>
            </div>
            <div className="social-follows">
              <div className="social-row-foot"><span className="icon">◉</span><b>48.2k</b> on Instagram</div>
              <div className="social-row-foot"><span className="icon">♪</span><b>112k</b> on TikTok</div>
              <div className="social-row-foot"><span className="icon">𝕏</span><b>9.4k</b> on X</div>
            </div>
          </div>
        </div>

        <div style={{borderTop: '1px solid var(--line)', paddingTop: 20, marginBottom: 20}}>
          <div className="mono" style={{color: 'var(--muted)', marginBottom: 8}}>We accept</div>
          <div className="payment-icons">
            {['VISA', 'MC', 'AMEX', 'PYPL', '  Pay', 'G Pay', 'Shop', 'Klarna', 'Afterpay'].map(p => (
              <span key={p} className="payment-icon">{p}</span>
            ))}
          </div>
        </div>

        <div className="footer-bottom">
          <span>© 2026 Brand Co. · All rights reserved · <a href="#">Privacy</a> · <a href="#">Terms</a> · <a href="#">Accessibility</a></span>
          <a href="#top" className="back-top">↑ Back to top</a>
        </div>
      </div>
    </footer>
  );
}

function StickyAtcBar({ visible, price, onShop, qty }) {
  return (
    <div className={`sticky-atc ${visible ? 'visible' : ''}`}>
      <div className="container" style={{display: 'flex', alignItems: 'center', gap: 12, padding: 0}}>
        <div className="sticky-atc-info">
          <div className="sticky-atc-thumb"></div>
          <div className="sticky-atc-text">
            <div className="t">{PRODUCT.title}</div>
            <div className="s">${price} · {qty}× selected · ⭐ {PRODUCT.rating}</div>
          </div>
        </div>
        <button className="atc-btn" onClick={onShop}>Add to cart →</button>
      </div>
    </div>
  );
}

Object.assign(window, {
  AnnouncementBar, FreeShipBar, Nav, StickyProductBar,
  Gallery, ProductInfo, Press, BenefitsSection, HowItWorks,
  Comparison, Ingredients, ReviewsSection, UGC, CrossSell,
  FounderSection, Specs, FAQSection, FinalCTA, Footer, StickyAtcBar,
  PRODUCT,
});
