/* global React */
const { useState, useEffect, useRef } = React;

// === Data ===
const SCENTS = [
  { id: 'cocoa', name: 'Cocoa Butter Cashmere', color: '#B9A4D4', notes: 'warm cocoa · vanilla · cashmere musk' },
  { id: 'fig', name: 'Fig Leaf Sunshine', color: '#FFD66B', notes: 'green fig · neroli · sun-warmed skin' },
];

const BUNDLES = [
  { id: 1, qty: 1, label: 'Starter', price: 28, was: 28, perUnit: 28, save: 0, ribbon: null },
  { id: 2, qty: 2, label: 'Duo', price: 50, was: 56, perUnit: 25, save: 11, ribbon: 'Most Popular' },
  { id: 3, qty: 3, label: 'Stash', price: 70, was: 84, perUnit: 23.33, save: 17, ribbon: 'Best Value' },
];

const FREQUENCIES = [
  { id: 'once', label: 'One-time purchase', tag: null, mult: 1 },
  { id: 'sub', label: 'Subscribe & Save', tag: 'Save 15%', mult: 0.85 },
];

const BENEFITS = [
  { icon: '✈️', title: 'TSA-friendly', text: 'Solid form, zero liquids. Toss it in your carry-on, breeze through security.' },
  { icon: '🚫', title: 'Leak-proof', text: 'No spills, no goo, no ruined tote bag. Finally.' },
  { icon: '🌿', title: '7 ingredients', text: 'Plant-based, fragrance-rich, nothing weird. Reads like a pantry list.' },
  { icon: '♻️', title: 'Zero plastic', text: 'Paperboard tube, aluminum cap. Compostable when you\'re done.' },
];

const STEPS = [
  { n: '01', title: 'Twist & swipe', text: 'Glide the butter across dry zones — elbows, shins, knees, anywhere.' },
  { n: '02', title: 'Warm with palms', text: 'Body heat melts it instantly into a silk-soft layer of moisture.' },
  { n: '03', title: 'Get on with life', text: 'No greasy hands, no waiting to dry. Pull on jeans immediately.' },
];

const INGREDIENTS = [
  { color: '#FFE5B5', name: 'Organic Cocoa Butter', use: 'Deep moisture, melts at body temp' },
  { color: '#F5E6D3', name: 'Fair-trade Shea Butter', use: 'Locks in hydration for 24h' },
  { color: '#FFD66B', name: 'Cold-pressed Sunflower Oil', use: 'Vitamin E, soothes redness' },
  { color: '#A8DDB8', name: 'Jojoba Wax', use: 'Mimics skin\'s natural sebum' },
  { color: '#B9A4D4', name: 'Lavender Essential Oil', use: 'Calming, lightly fragrant' },
  { color: '#FF9F7A', name: 'Sweet Almond Oil', use: 'Softens rough patches' },
  { color: '#FCEACB', name: 'Vitamin E', use: 'Antioxidant, extends shelf life' },
];

const REVIEWS = [
  { rating: 5, title: 'My carry-on hero', body: 'Flew Tokyo → LA with this in my back pocket. No leaks, no security drama. Skin was soft on landing.', name: 'Mara K.', verified: 'Verified Buyer', avatar: '#FFD66B' },
  { rating: 5, title: 'Smells like a hug', body: 'The cocoa butter cashmere scent is INSANE. Subtle but addictive. My partner keeps stealing it.', name: 'Daniel R.', verified: 'Verified Buyer', avatar: '#A8DDB8' },
  { rating: 4, title: 'Lasts forever', body: 'I\'ve had mine 3 months and barely made a dent. Replaced 4 different lotions. Worth every dollar.', name: 'Priya S.', verified: 'Verified Buyer', avatar: '#FF9F7A' },
];

const PRESS = [
  { text: 'VOGUE', cls: 'allcaps' },
  { text: 'goop', cls: 'serif' },
  { text: 'Refinery29', cls: 'script' },
  { text: 'BAZAAR', cls: 'allcaps' },
  { text: 'Byrdie', cls: 'serif' },
  { text: 'WELL+GOOD', cls: 'allcaps' },
];

const FAQ = [
  { q: 'Will it melt in my bag?', a: 'Nope. Pocket Butter is solid up to 95°F (35°C). It\'ll soften in extreme heat — like a closed car in summer — but it firms right back up. The paperboard tube is sturdy, the cap clicks shut, and there\'s zero liquid to spill.' },
  { q: 'How long does one tube last?', a: 'About 2–3 months of daily use for most people. The 70g format is intentionally generous — we wanted it to outlast a long trip without being too bulky for your pocket.' },
  { q: 'Is it safe for sensitive skin?', a: 'Yes. We\'re fragrance-led but the scent comes from real essential oils, not synthetic perfume. No parabens, sulfates, silicones, or PEGs. That said, if you\'re reactive to nut oils, double-check the ingredient list — we use sweet almond.' },
  { q: 'How does Subscribe & Save work?', a: 'Pick a frequency, save 15% on every order, free shipping always, skip or cancel anytime in one click. No weird hoops. We\'ll email you 3 days before each shipment so you can swap scents or pause.' },
  { q: 'Do you ship internationally?', a: 'Yes — we ship to 38 countries. Free shipping over $35 in the US, $60 internationally. Most orders arrive in 2–5 business days domestic, 5–10 international.' },
  { q: 'What if I don\'t love it?', a: 'Use it for 30 days. If it\'s not the best lotion you\'ve owned, email us and we\'ll refund you — keep the tube. We\'re that confident.' },
];

// === Components ===
function AnnouncementBar() {
  const items = [
    'Free shipping on orders $35+',
    '30-day love-it guarantee',
    'Subscribe & save 15% always',
    'Now shipping to 38 countries',
    'Plant-based · cruelty-free · zero plastic',
  ];
  const all = [...items, ...items, ...items];
  return (
    <div className="announce">
      <div className="announce-track">
        {all.map((t, i) => (
          <span key={i}><span className="dot"></span>{t}</span>
        ))}
      </div>
    </div>
  );
}

function Nav({ cartCount }) {
  return (
    <nav className="nav">
      <div className="container nav-inner">
        <div className="logo">kerrimi</div>
        <div className="nav-links">
          <a href="#bundle">Shop</a>
          <a href="#how">How it works</a>
          <a href="#reviews">Reviews</a>
          <a href="#faq">FAQ</a>
        </div>
        <button className="nav-cart">
          <span>🛒</span> Cart <span style={{opacity: 0.6}}>·</span> {cartCount}
        </button>
      </div>
    </nav>
  );
}

function Hero({ ctaCopy, onShop }) {
  return (
    <section className="hero">
      <div className="float-shape fs-1"></div>
      <div className="float-shape fs-2"></div>
      <div className="float-shape fs-3"></div>
      <div className="container hero-grid">
        <div>
          <div className="hero-eyebrow"><span className="dot"></span> 2,140 happy pockets · in stock</div>
          <h1 className="display">
            Lotion that lives in your <span className="squiggle">pocket</span>.
          </h1>
          <p className="lede">
            Pocket Butter is a solid-state body lotion. Leak-proof, TSA-approved, ridiculously moisturizing — and it smells like a daydream.
          </p>
          <div className="hero-stars">
            <span className="stars">★★★★★</span>
            <span className="stars-text"><b>4.9</b> from 312 reviews</span>
          </div>
          <div className="hero-ctas">
            <button className="btn btn-primary btn-lg" onClick={onShop}>
              {ctaCopy} <span className="btn-arrow">→</span>
            </button>
            <button className="btn btn-secondary">Watch the demo</button>
          </div>
          <div className="hero-trust">
            <span><span className="check">✓</span> Free shipping $35+</span>
            <span><span className="check">✓</span> 30-day guarantee</span>
            <span><span className="check">✓</span> Vegan & cruelty-free</span>
          </div>
        </div>
        <div className="hero-product">
          <div className="hero-badge b1">No spills, ever ✨</div>
          <div className="hero-badge b3">3.8 oz · 70 g</div>
          <div className="hero-badge b2">Smells unreal</div>
          <img src="assets/pocket-butter.png" alt="Kerrimi Pocket Butter" />
          <svg className="hero-spinner" viewBox="0 0 100 100">
            <defs>
              <path id="circle" d="M 50,50 m -36,0 a 36,36 0 1,1 72,0 a 36,36 0 1,1 -72,0" fill="none" />
            </defs>
            <circle cx="50" cy="50" r="44" fill="#1F1330" />
            <circle cx="50" cy="50" r="14" fill="#FFD66B" stroke="#1F1330" strokeWidth="2" />
            <text fontFamily="JetBrains Mono, monospace" fontSize="9" fontWeight="700" fill="#FFF4E0" letterSpacing="2">
              <textPath xlinkHref="#circle">SOLID · LOTION · POCKET · BUTTER · </textPath>
            </text>
          </svg>
        </div>
      </div>
    </section>
  );
}

function MarqueeDivider() {
  const items = ['Pocket Butter', 'Solid Lotion', 'No Mess', 'TSA Approved', 'Plant-Based', 'Pocket Butter', 'Solid Lotion', 'No Mess', 'TSA Approved', 'Plant-Based'];
  return (
    <div className="marquee-divider">
      <div className="marquee-track">
        {items.map((t, i) => (
          <span key={i}>{t} <span className="star">✦</span></span>
        ))}
      </div>
    </div>
  );
}

function BundleSection({ bundle, setBundle, scent, setScent, freq, setFreq, ctaCopy }) {
  const b = BUNDLES.find(x => x.id === bundle);
  const f = FREQUENCIES.find(x => x.id === freq);
  const total = (b.price * f.mult).toFixed(2);
  const wasTotal = b.was;

  return (
    <section className="section" id="bundle">
      <div className="container">
        <div style={{textAlign: 'center', marginBottom: 48}}>
          <div className="section-eyebrow">// Build your stash</div>
          <h2 className="display">Buy more, save more</h2>
          <p className="subtitle" style={{margin: '0 auto'}}>One for your bag, one for your desk, one for the gym. We don't judge.</p>
        </div>

        <div className="bundle-grid">
          {BUNDLES.map(opt => (
            <div
              key={opt.id}
              className={`bundle-card ${bundle === opt.id ? 'active' : ''}`}
              onClick={() => setBundle(opt.id)}
            >
              {opt.ribbon && <div className="ribbon">{opt.ribbon}</div>}
              <div className="qty display">{opt.qty}×</div>
              <div className="qty-label">{opt.label}</div>
              <div className="price-row">
                <span className="price">${opt.price}</span>
                {opt.was !== opt.price && <span className="price-was">${opt.was}</span>}
              </div>
              <div className="per">${opt.perUnit.toFixed(2)} per tube</div>
              {opt.save > 0 ? (
                <span className="save">Save ${opt.save}</span>
              ) : (
                <span className="save" style={{background: 'transparent', borderColor: 'transparent'}}>&nbsp;</span>
              )}
            </div>
          ))}
        </div>

        <div className="bundle-config">
          <div className="config-group">
            <div className="config-label">// Pick your scent{b.qty > 1 ? `s (${b.qty})` : ''}</div>
            <div className="scent-options">
              {SCENTS.map(s => (
                <button
                  key={s.id}
                  className={`scent-pill ${scent === s.id ? 'active' : ''}`}
                  onClick={() => setScent(s.id)}
                >
                  <span className="swatch" style={{background: s.color}}></span>
                  {s.name}
                </button>
              ))}
            </div>
            <div style={{fontSize: 13, color: 'var(--muted)', marginTop: 4}}>
              {SCENTS.find(s => s.id === scent).notes}
            </div>
          </div>

          <div className="config-group">
            <div className="config-label">// Delivery</div>
            <div className="frequency">
              {FREQUENCIES.map(opt => (
                <div
                  key={opt.id}
                  className={`freq-option ${freq === opt.id ? 'active' : ''}`}
                  onClick={() => setFreq(opt.id)}
                >
                  <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
                    <span className="freq-radio"></span>
                    <span>{opt.label}</span>
                  </div>
                  {opt.tag && <span className="freq-tag">{opt.tag}</span>}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="atc-row">
          <div className="atc-total">
            ${total}
            {f.mult < 1 && <small>${wasTotal}</small>}
          </div>
          <button className="btn btn-primary btn-lg" style={{flex: 1}}>
            {ctaCopy} <span className="btn-arrow">→</span>
          </button>
        </div>
        <div style={{marginTop: 12, fontSize: 13, color: 'var(--muted)', display: 'flex', gap: 16, flexWrap: 'wrap'}}>
          <span>🚚 Free shipping over $35</span>
          <span>🔄 Skip or cancel anytime</span>
          <span>💛 30-day love-it guarantee</span>
        </div>
      </div>
    </section>
  );
}

function Benefits() {
  return (
    <section className="section" style={{paddingTop: 48}}>
      <div className="container">
        <div style={{textAlign: 'center', marginBottom: 48}}>
          <div className="section-eyebrow">// Why pocket butter</div>
          <h2 className="display">Lotion, but make it portable</h2>
        </div>
        <div className="benefits-grid">
          {BENEFITS.map((b, i) => (
            <div key={i} className="benefit">
              <div className="icon">{b.icon}</div>
              <h3>{b.title}</h3>
              <p>{b.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section className="section" id="how">
      <div className="container">
        <div style={{maxWidth: 700}}>
          <div className="section-eyebrow">// 3-step ritual</div>
          <h2 className="display">It's basically goof-proof.</h2>
          <p className="subtitle">No pump, no squeeze, no mess. Just twist, swipe, glow.</p>
        </div>
        <div className="steps">
          {STEPS.map((s, i) => (
            <div key={i} className="step">
              <div className="step-num display">{s.n}</div>
              <h4>{s.title}</h4>
              <p>{s.text}</p>
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
      <div className="container">
        <div className="compare">
          <div className="section-eyebrow" style={{color: 'var(--theme)'}}>// vs. the bottle</div>
          <h2 className="display">Why we ditched the squeeze tube</h2>
          <p className="subtitle">Liquid lotion is a 1990s problem. We solved it.</p>
          <div className="compare-table">
            <div className="compare-cell compare-head"></div>
            <div className="compare-cell compare-head us">Pocket Butter</div>
            <div className="compare-cell compare-head">Liquid lotion</div>

            <div className="compare-cell compare-feature">Carry-on safe</div>
            <div className="compare-cell compare-yes">✓ Solid form</div>
            <div className="compare-cell compare-no">✗ 3.4oz limit</div>

            <div className="compare-cell compare-feature">Spills in bag</div>
            <div className="compare-cell compare-yes">✓ Never</div>
            <div className="compare-cell compare-no">✗ Always</div>

            <div className="compare-cell compare-feature">Plastic packaging</div>
            <div className="compare-cell compare-yes">✓ Zero</div>
            <div className="compare-cell compare-no">✗ Bottle + cap + pump</div>

            <div className="compare-cell compare-feature">Lasts how long</div>
            <div className="compare-cell compare-yes">✓ ~3 months</div>
            <div className="compare-cell compare-no">~ 6 weeks</div>

            <div className="compare-cell compare-feature compare-row-last">Greasy hands after</div>
            <div className="compare-cell compare-yes compare-row-last">✓ Nope</div>
            <div className="compare-cell compare-no compare-row-last">✗ Always</div>
          </div>
        </div>
      </div>
    </section>
  );
}

function TextureDemo() {
  const [pos, setPos] = useState(50);
  const ref = useRef(null);
  const dragging = useRef(false);

  const updatePos = (clientX) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const p = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    setPos(p);
  };

  useEffect(() => {
    const onMove = (e) => {
      if (!dragging.current) return;
      const x = e.touches ? e.touches[0].clientX : e.clientX;
      updatePos(x);
    };
    const onUp = () => { dragging.current = false; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onMove);
    window.addEventListener('touchend', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    };
  }, []);

  return (
    <section className="section">
      <div className="container">
        <div className="texture">
          <div>
            <div className="section-eyebrow">// drag to compare</div>
            <h2 className="display">Dry skin → silk in 4 seconds</h2>
            <p className="subtitle">A single swipe melts on contact. No waiting, no white residue, no rubbing in for 30 seconds like a maniac.</p>
            <div style={{display: 'flex', gap: 24, fontSize: 14, fontWeight: 600}}>
              <div>
                <div className="mono" style={{marginBottom: 4, opacity: 0.6}}>Before</div>
                <div>Tight, flaky, sad</div>
              </div>
              <div>
                <div className="mono" style={{marginBottom: 4, opacity: 0.6}}>After</div>
                <div>Soft, glowing, smug</div>
              </div>
            </div>
          </div>
          <div
            className="texture-visual"
            ref={ref}
            onMouseDown={(e) => { dragging.current = true; updatePos(e.clientX); }}
            onTouchStart={(e) => { dragging.current = true; updatePos(e.touches[0].clientX); }}
          >
            <div className="texture-half before">Before</div>
            <div
              className="texture-half after"
              style={{clipPath: `inset(0 0 0 ${pos}%)`, paddingLeft: `calc(${pos}% + 24px)`}}
            >
              After
            </div>
            <div className="texture-divider" style={{left: `${pos}%`}}>
              <span className="grip">⇆</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Ingredients() {
  return (
    <section className="section">
      <div className="container">
        <div className="ingredients">
          <div>
            <div className="section-eyebrow">// 7-ingredient promise</div>
            <h2 className="display">Reads like a recipe, not a chemistry lab.</h2>
            <p className="subtitle">Every ingredient does something. Nothing on this list is filler — including the ones that make it smell like a vacation.</p>
            <div className="ingredient-not">
              <div className="label">Never:</div>
              <div className="items">
                <strike>Parabens</strike> · <strike>Sulfates</strike> · <strike>Silicones</strike> · <strike>PEGs</strike> · <strike>Synthetic fragrance</strike> · <strike>Mineral oil</strike> · <strike>Animal testing</strike>
              </div>
            </div>
          </div>
          <div className="ingredient-list">
            {INGREDIENTS.map((ing, i) => (
              <div key={i} className="ingredient">
                <div className="ingredient-dot" style={{background: ing.color}}></div>
                <div className="ingredient-info">
                  <h4>{ing.name}</h4>
                  <p>{ing.use}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Reviews() {
  const distribution = [
    { stars: 5, pct: 87 },
    { stars: 4, pct: 9 },
    { stars: 3, pct: 3 },
    { stars: 2, pct: 1 },
    { stars: 1, pct: 0 },
  ];
  return (
    <section className="section" id="reviews">
      <div className="container">
        <div style={{textAlign: 'center', marginBottom: 48}}>
          <div className="section-eyebrow">// 312 honest opinions</div>
          <h2 className="display">People are obsessed.</h2>
        </div>
        <div className="reviews-summary">
          <div style={{textAlign: 'center'}}>
            <div className="review-big-stars">★★★★★</div>
            <div className="review-big-rating display">
              4.9
              <small>out of 5 · 312 reviews</small>
            </div>
          </div>
          <div className="review-bars">
            {distribution.map(d => (
              <div key={d.stars} className="review-bar">
                <span style={{width: 60}}>{d.stars} stars</span>
                <div className="bar"><div className="bar-fill" style={{width: `${d.pct}%`}}></div></div>
                <span style={{width: 36, textAlign: 'right', color: 'var(--muted)'}}>{d.pct}%</span>
              </div>
            ))}
          </div>
        </div>
        <div className="reviews-grid">
          {REVIEWS.map((r, i) => (
            <div key={i} className="review-card">
              <div className="review-stars">{'★'.repeat(r.rating)}{'☆'.repeat(5-r.rating)}</div>
              <h4>{r.title}</h4>
              <p>"{r.body}"</p>
              <div className="review-author">
                <div className="review-avatar" style={{background: r.avatar}}></div>
                <div>
                  <div className="name">{r.name}</div>
                  <div className="verified">{r.verified}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PressWall() {
  return (
    <div className="press-wall">
      <div className="container">
        <div className="mono" style={{textAlign: 'center', marginBottom: 24, color: 'var(--muted)'}}>// As featured in</div>
        <div className="press-row">
          {PRESS.map((p, i) => (
            <div key={i} className={`press-logo ${p.cls}`}>{p.text}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

function UGCWall() {
  const tiles = [
    { color: '#B9A4D4', tag: 'Reel', handle: '@maraonthego' },
    { color: '#FFD66B', tag: '', handle: '@danielreads' },
    { color: '#A8DDB8', tag: 'Reel', handle: '@priyaglow' },
    { color: '#FF9F7A', tag: '', handle: '@sebbysoft' },
    { color: '#FCEACB', tag: 'Reel', handle: '@kira.travels' },
    { color: '#BFD8F0', tag: '', handle: '@jessdoesskin' },
  ];
  return (
    <section className="section">
      <div className="container">
        <div style={{textAlign: 'center', marginBottom: 32}}>
          <div className="section-eyebrow">// #pocketbutter on the gram</div>
          <h2 className="display">Tag us, we'll regram you.</h2>
        </div>
        <div className="ugc-grid">
          {tiles.map((t, i) => (
            <div key={i} className="ugc-tile" style={{background: `linear-gradient(135deg, ${t.color}, ${t.color}dd)`}}>
              {t.tag && <span className="tag">{t.tag}</span>}
              <span className="ugc-handle">{t.handle}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Founder() {
  return (
    <section className="section">
      <div className="container">
        <div className="founder">
          <div className="founder-photo">
            <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #FFD66B, #FF9F7A)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'rgba(31,19,48,0.5)', textTransform: 'uppercase', letterSpacing: 2}}>
              [ founder portrait ]
            </div>
          </div>
          <div>
            <div className="section-eyebrow">// the why</div>
            <p className="founder-quote">"I leaked $80 of moisturizer in my carry-on at JFK. By the time I landed in Lisbon, I'd sketched Pocket Butter on a napkin."</p>
            <div className="founder-sig">— Kerri</div>
            <div className="founder-name">Kerri Mimoun</div>
            <div className="founder-title">Founder, ex-cosmetic chemist at a brand you've heard of</div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FAQSection() {
  const [open, setOpen] = useState(0);
  return (
    <section className="section" id="faq">
      <div className="container">
        <div style={{textAlign: 'center', marginBottom: 48}}>
          <div className="section-eyebrow">// the small print</div>
          <h2 className="display">Frequently asked things.</h2>
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
      </div>
    </section>
  );
}

function FinalCTA({ ctaCopy, onShop }) {
  return (
    <section className="final-cta">
      <div className="container">
        <h2 className="display">Your skin called. It wants a tube.</h2>
        <p>30-day guarantee. Free shipping over $35. Cancel subscriptions in one click. Made by humans, for human pockets.</p>
        <button className="btn btn-secondary btn-lg" onClick={onShop} style={{background: 'var(--ink)', color: 'var(--cream)'}}>
          {ctaCopy} <span className="btn-arrow">→</span>
        </button>
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
            <div className="logo">kerrimi</div>
            <p>Solid-state skincare for people who actually leave the house. Plant-based, plastic-free, made in California.</p>
          </div>
          <div>
            <h4>Shop</h4>
            <ul>
              <li><a href="#">Pocket Butter</a></li>
              <li><a href="#">Bundles</a></li>
              <li><a href="#">Subscriptions</a></li>
              <li><a href="#">Gift cards</a></li>
            </ul>
          </div>
          <div>
            <h4>Help</h4>
            <ul>
              <li><a href="#">FAQ</a></li>
              <li><a href="#">Shipping & returns</a></li>
              <li><a href="#">Track order</a></li>
              <li><a href="#">Contact us</a></li>
            </ul>
          </div>
          <div>
            <h4>Brand</h4>
            <ul>
              <li><a href="#">Our story</a></li>
              <li><a href="#">Ingredients</a></li>
              <li><a href="#">Sustainability</a></li>
              <li><a href="#">Press</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 Kerrimi · Made in Oakland, CA</span>
          <span>Instagram · TikTok · Email</span>
        </div>
      </div>
    </footer>
  );
}

function StickyATC({ visible, onShop, ctaCopy, total }) {
  return (
    <div className={`sticky-atc ${visible ? 'visible' : ''}`}>
      <div className="sticky-atc-thumb">
        <img src="assets/pocket-butter.png" alt="" />
      </div>
      <div className="sticky-atc-info">
        <span className="t">Pocket Butter</span>
        <span className="s">${total} · free shipping $35+</span>
      </div>
      <button className="btn btn-primary" onClick={onShop}>
        {ctaCopy}
      </button>
    </div>
  );
}

Object.assign(window, {
  AnnouncementBar, Nav, Hero, MarqueeDivider, BundleSection, Benefits,
  HowItWorks, Comparison, TextureDemo, Ingredients, Reviews, PressWall,
  UGCWall, Founder, FAQSection, FinalCTA, Footer, StickyATC,
  BUNDLES, FREQUENCIES,
});
