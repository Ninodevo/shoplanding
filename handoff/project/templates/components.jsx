/* global React */
const { useState, useEffect } = React;

// Shared component library — products supply data via window.PRODUCT_DATA
// Each page sets window.PRODUCT_DATA before this script loads.

function getDeliveryDate() {
  const d = new Date();
  d.setDate(d.getDate() + 4);
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}

function AnnouncementBar({ items }) {
  const all = [...items, ...items, ...items];
  return (
    <div className="announce">
      <div className="announce-track">
        {all.map((t, i) => <span key={i}><span className="pip"></span>{t}</span>)}
      </div>
    </div>
  );
}

function FreeShipBar({ threshold = 35, current = 22.75 }) {
  const remaining = Math.max(0, threshold - current).toFixed(2);
  const pct = Math.min(100, (current / threshold) * 100);
  return (
    <div className="free-ship-bar">
      You're <b>${remaining}</b> away from <b>free shipping</b>
      <span className="fsb-progress"><span className="fsb-progress-fill" style={{width: `${pct}%`}}></span></span>
    </div>
  );
}

function Nav({ cartCount, brand }) {
  return (
    <nav className="nav">
      <div className="container nav-inner">
        <div className="nav-links">
          <a href="#shop">Shop</a>
          <a href="#how">How it works</a>
          <a href="#reviews">Reviews</a>
          <a href="#faq">FAQ</a>
        </div>
        <a href="#" className="logo">{brand}</a>
        <div className="nav-actions">
          <button className="icon-btn" aria-label="Search">⌕</button>
          <button className="icon-btn" aria-label="Account">◐</button>
          <button className="icon-btn" aria-label="Cart">
            ⊞{cartCount > 0 && <span className="count">{cartCount}</span>}
          </button>
        </div>
      </div>
    </nav>
  );
}

function Gallery({ hero, slides }) {
  const [active, setActive] = useState(0);
  return (
    <div className="gallery">
      <div className="gallery-main">
        <div className="gallery-hero" style={hero.style}>{hero.content}</div>
        <div className="gallery-badges">
          <span className="gallery-badge sale">−20% OFF</span>
          <span className="gallery-badge new">New</span>
        </div>
      </div>
      <div className="gallery-thumbs">
        {slides.map((s, i) => (
          <button key={i} className={`thumb ${active === i ? 'active' : ''}`} onClick={() => setActive(i)}>
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

function ProductInfo({ P, qty, setQty, offer, setOffer, color, setColor, size, setSize, sub, setSub, addToCart, addedFlash }) {
  const sel = P.offers.find(o => o.id === offer);
  const subDiscount = sub ? 0.85 : 1;
  const totalPrice = (sel.price * subDiscount).toFixed(2);
  const savePct = Math.round((1 - sel.price / sel.was) * 100);

  return (
    <div className="product-info">
      <div className="breadcrumbs">
        <a href="#">Home</a><span className="sep">/</span>
        <a href="#">Shop</a><span className="sep">/</span>
        <a href="#">{P.collection}</a><span className="sep">/</span>
        <span>{P.title}</span>
      </div>
      <div className="collection-tag mono">{P.collection}</div>
      <h1 className="display product-title">{P.title}</h1>
      <p className="product-subtitle">{P.subtitle}</p>

      <div className="rating-row">
        <span className="rating-stars">{'★'.repeat(5)}</span>
        <a href="#reviews" className="rating-link">{P.rating} · Read {P.reviewCount} reviews</a>
        <span className="rating-pill">{P.recommendPct}% would buy again</span>
      </div>

      <ul className="key-benefits">
        {P.keyBenefits.map((k, i) => (
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

      {P.variants.color && (
        <div className="variant-block">
          <div className="variant-label">
            <span>{P.variants.colorLabel || 'Color'}</span>
            <span className="selected">{P.variants.color.find(c => c.id === color)?.name}</span>
          </div>
          <div className="variant-options">
            {P.variants.color.map(c => (
              <button key={c.id} className={`variant-pill ${color === c.id ? 'active' : ''}`} onClick={() => setColor(c.id)}>
                <span className="swatch" style={{background: c.swatch}}></span>{c.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {P.variants.size && (
        <div className="variant-block">
          <div className="variant-label">
            <span>{P.variants.sizeLabel || 'Size'} <span style={{color: 'var(--muted)', fontWeight: 400}}>· {P.variants.size.find(s => s.id === size)?.name}</span></span>
            <a href="#" className="size-guide-link">Size guide ↗</a>
          </div>
          <div className="variant-options">
            {P.variants.size.map(s => (
              <button key={s.id} className={`variant-pill size ${size === s.id ? 'active' : ''}`} onClick={() => setSize(s.id)}>{s.name}</button>
            ))}
          </div>
        </div>
      )}

      <div className="variant-block">
        <div className="variant-label"><span>Bundle & Save</span></div>
        <div className="offers">
          {P.offers.map(o => (
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
              <div className="s">Skip, swap or cancel anytime · Free shipping</div>
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
        </button>
      </div>

      <div className="pay-divider"><span style={{background: 'var(--bg)', padding: '0 12px'}}>or pay with</span></div>
      <div className="express-pay">
        <button className="pay-btn paypal">PayPal</button>
        <button className="pay-btn applepay"> Pay</button>
        <button className="pay-btn gpay">G Pay</button>
        <button className="pay-btn shoppay">Shop Pay</button>
      </div>

      <div className="delivery">
        <div className="delivery-row">📦 <span>🇺🇸 Ships from <b>{P.shipFrom}</b> · <b>Free shipping</b> over $35</span></div>
        <div className="delivery-row">🚚 <span>Estimated delivery: <b>{getDeliveryDate()}</b></span></div>
        <div className="delivery-row">● <span className="in-stock">In stock</span><span style={{color:'var(--muted)'}}>·</span><span className="scarcity">Only {P.stockLeft} left at this price</span></div>
        <div className="delivery-row">🔒 <span>Secure checkout · 30-day money-back guarantee</span></div>
      </div>

      <div className="live-activity">
        <span className="live-dot"></span>
        <span><b>{P.viewing} people</b> viewing · <b>{P.soldThisWeek}</b> sold this week</span>
      </div>

      <div className="trust-mini">
        {P.trustMini.map((t, i) => (
          <div key={i} className="item"><div className="ico">{t.ico}</div>{t.t}</div>
        ))}
      </div>
    </div>
  );
}

function Press({ items }) {
  return (
    <div className="press">
      <div className="container">
        <div className="press-title mono">As featured in</div>
        <div className="press-row">
          {items.map((p, i) => <div key={i} className={`press-logo ${p.cls}`}>{p.text}</div>)}
        </div>
      </div>
    </div>
  );
}

function BenefitsSection({ eyebrow, title, sub, items }) {
  return (
    <section className="section">
      <div className="container">
        <div className="section-title">
          <div className="eyebrow mono">{eyebrow}</div>
          <h2 className="display">{title}</h2>
          <p>{sub}</p>
        </div>
        <div className="benefits-grid">
          {items.map((b, i) => (
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

function HowItWorks({ eyebrow, title, sub, steps }) {
  return (
    <section className="section" id="how" style={{background: 'var(--surface)'}}>
      <div className="container">
        <div className="section-title">
          <div className="eyebrow mono">{eyebrow}</div>
          <h2 className="display">{title}</h2>
          <p>{sub}</p>
        </div>
        <div className="steps">
          {steps.map((s, i) => (
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

function Comparison({ title, eyebrow, them, rows }) {
  return (
    <section className="section">
      <div className="container container-narrow">
        <div className="section-title">
          <div className="eyebrow mono">{eyebrow}</div>
          <h2 className="display">{title}</h2>
        </div>
        <div className="compare-table">
          <div className="compare-row head">
            <div className="compare-cell"></div>
            <div className="compare-cell us">Us</div>
            <div className="compare-cell">{them}</div>
          </div>
          {rows.map(([f, u, t], i) => (
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

function Ingredients({ title, sub, eyebrow, items, neverList }) {
  return (
    <section className="section" style={{background: 'var(--surface)'}}>
      <div className="container">
        <div className="ingredients-grid">
          <div>
            <div className="mono" style={{color: 'var(--accent-deep)', marginBottom: 12}}>{eyebrow}</div>
            <h2 className="display" style={{fontSize: 'clamp(28px, 3.5vw, 40px)', marginBottom: 16}}>{title}</h2>
            <p style={{color: 'var(--ink-2)', marginBottom: 24}}>{sub}</p>
            {neverList && (
              <div style={{padding: 20, background: 'var(--ink)', color: 'var(--bg)', borderRadius: 'var(--r-md)'}}>
                <div className="mono" style={{opacity: 0.6, marginBottom: 8}}>Never:</div>
                <div style={{fontSize: 14, lineHeight: 1.6, opacity: 0.9}}>
                  {neverList.map((n, i) => <span key={i}><s>{n}</s>{i < neverList.length - 1 && ' · '}</span>)}
                </div>
              </div>
            )}
          </div>
          <div className="ingredient-list">
            {items.map((ing, i) => (
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

function ReviewsSection({ P, reviews, social }) {
  const [filter, setFilter] = useState('all');
  const dist = [
    { stars: 5, pct: 82 }, { stars: 4, pct: 12 }, { stars: 3, pct: 4 }, { stars: 2, pct: 1 }, { stars: 1, pct: 1 },
  ];
  return (
    <section className="section" id="reviews">
      <div className="container">
        <div className="section-title">
          <div className="eyebrow mono">{P.reviewCount} verified reviews</div>
          <h2 className="display">Real customers, real results</h2>
        </div>
        <div className="reviews-summary">
          <div style={{textAlign: 'center'}}>
            <div className="summary-stars">{'★'.repeat(5)}</div>
            <div className="summary-big-rating">{P.rating}</div>
            <div className="summary-count">out of 5 · {P.reviewCount} reviews</div>
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
          {reviews.map((r, i) => (
            <div key={i} className="review-card">
              <div className="review-card-stars">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</div>
              <h4>{r.title}</h4>
              <p>"{r.body}"</p>
              {r.photos > 0 && (
                <div className="photos">
                  {Array.from({length: r.photos}).map((_, j) => <div key={j} className="photo">📷</div>)}
                </div>
              )}
              <div className="review-author">
                <div className="review-avatar">{r.name.split(' ').map(n => n[0]).join('')}</div>
                <div className="meta">
                  <div className="name">{r.name} <span style={{color:'var(--muted)', fontWeight:400}}>· {r.age}</span></div>
                  <div className="occ">{r.occ}</div>
                  {r.verified && <span className="verified">✓ Verified Buyer</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div style={{marginTop: 56}}>
          <div className="mono" style={{textAlign: 'center', color: 'var(--muted)', marginBottom: 16}}>From around the internet</div>
          <div className="social-row">
            {social.map((s, i) => (
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

function UGC({ tiles, eyebrow, title }) {
  return (
    <section className="section" style={{background: 'var(--surface)'}}>
      <div className="container">
        <div className="section-title">
          <div className="eyebrow mono">{eyebrow}</div>
          <h2 className="display">{title}</h2>
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

function CrossSell({ items, eyebrow, title }) {
  return (
    <section className="section">
      <div className="container">
        <div className="section-title">
          <div className="eyebrow mono">{eyebrow}</div>
          <h2 className="display">{title}</h2>
        </div>
        <div className="bundle-cs">
          {items.map((c, i) => (
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

function FounderSection({ quote, name, title, eyebrow }) {
  return (
    <section className="section">
      <div className="container">
        <div className="founder">
          <div className="founder-img">[ founder portrait ]</div>
          <div>
            <div className="mono" style={{color: 'var(--accent-deep)', marginBottom: 16}}>{eyebrow}</div>
            <blockquote>"{quote}"</blockquote>
            <div className="founder-name">{name}</div>
            <div className="founder-title">{title}</div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Specs({ rows }) {
  return (
    <section className="section" style={{background: 'var(--surface)'}}>
      <div className="container container-narrow">
        <div className="section-title">
          <div className="eyebrow mono">The fine print</div>
          <h2 className="display">Specifications</h2>
        </div>
        <div className="specs-table">
          {rows.map(([k, v], i) => (
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

function FAQSection({ items }) {
  const [open, setOpen] = useState(0);
  return (
    <section className="section" id="faq">
      <div className="container container-narrow">
        <div className="section-title">
          <div className="eyebrow mono">FAQ</div>
          <h2 className="display">Frequently asked questions</h2>
        </div>
        <div className="faq-list">
          {items.map((item, i) => (
            <div key={i} className={`faq-item ${open === i ? 'open' : ''}`}>
              <button className="faq-q" onClick={() => setOpen(open === i ? -1 : i)}>
                <span>{item.q}</span><span className="faq-toggle">+</span>
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

function FinalCTA({ title, sub, ctaText, onShop, trust }) {
  return (
    <section className="final-cta">
      <h2 className="display">{title}</h2>
      <p>{sub}</p>
      <button className="btn btn-primary btn-lg" onClick={onShop}>{ctaText}</button>
      <div className="trust-row">
        {trust.map((t, i) => <span key={i}>✓ {t}</span>)}
      </div>
    </section>
  );
}

function Footer({ brand, tagline, contact, socials }) {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <div className="logo">{brand}</div>
            <p>{tagline}</p>
            <div className="footer-trust">
              <span className="trust-seal">🔒 SSL Secured</span>
              <span className="trust-seal">✓ Norton</span>
              <span className="trust-seal">★ Trustpilot 4.8</span>
            </div>
          </div>
          <div>
            <h4>Shop</h4>
            <ul><li><a href="#">All products</a></li><li><a href="#">Bundles</a></li><li><a href="#">Subscriptions</a></li><li><a href="#">Gift cards</a></li><li><a href="#">Sale</a></li></ul>
          </div>
          <div>
            <h4>Help</h4>
            <ul><li><a href="#">FAQ</a></li><li><a href="#">Shipping</a></li><li><a href="#">Returns</a></li><li><a href="#">Track order</a></li><li><a href="#">Contact</a></li></ul>
          </div>
          <div>
            <h4>About</h4>
            <ul><li><a href="#">Our story</a></li><li><a href="#">Sustainability</a></li><li><a href="#">Press</a></li><li><a href="#">Careers</a></li><li><a href="#">Blog</a></li></ul>
          </div>
          <div>
            <h4>Stay connected</h4>
            <div className="contact-line">
              <div>📧 {contact.email}</div>
              <div>📞 {contact.phone}</div>
              <div>📍 {contact.address}</div>
            </div>
            <div className="social-follows">
              {socials.map((s, i) => (
                <div key={i} className="social-row-foot"><span className="icon">{s.icon}</span><b>{s.count}</b> on {s.platform}</div>
              ))}
            </div>
          </div>
        </div>
        <div style={{borderTop:'1px solid var(--line)', paddingTop:20, marginBottom:20}}>
          <div className="mono" style={{color:'var(--muted)', marginBottom:8}}>We accept</div>
          <div className="payment-icons">
            {['VISA','MC','AMEX','PYPL',' Pay','G Pay','Shop','Klarna','Afterpay'].map(p => <span key={p} className="payment-icon">{p}</span>)}
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 {brand} · <a href="#">Privacy</a> · <a href="#">Terms</a> · <a href="#">Accessibility</a></span>
          <a href="#top" style={{textDecoration:'underline', fontSize:12}}>↑ Back to top</a>
        </div>
      </div>
    </footer>
  );
}

function StickyAtcBar({ visible, price, qty, onShop, title }) {
  return (
    <div className={`sticky-atc ${visible ? 'visible' : ''}`}>
      <div className="container" style={{display:'flex', alignItems:'center', gap:12, padding:0}}>
        <div className="sticky-atc-info">
          <div className="sticky-atc-thumb"></div>
          <div className="sticky-atc-text">
            <div className="t">{title}</div>
            <div className="s">${price} · {qty}× selected</div>
          </div>
        </div>
        <button className="atc-btn" onClick={onShop}>Add to cart →</button>
      </div>
    </div>
  );
}

function App({ D }) {
  const [cartCount, setCartCount] = useState(0);
  const [qty, setQty] = useState(1);
  const [offer, setOffer] = useState(D.product.offers[1]?.id || D.product.offers[0].id);
  const [color, setColor] = useState(D.product.variants.color?.[0]?.id);
  const [size, setSize] = useState(D.product.variants.size?.[1]?.id || D.product.variants.size?.[0]?.id);
  const [sub, setSub] = useState(true);
  const [stickyVisible, setStickyVisible] = useState(false);
  const [addedFlash, setAddedFlash] = useState(false);

  const sel = D.product.offers.find(o => o.id === offer);
  const totalPrice = (sel.price * (sub ? 0.85 : 1) * qty).toFixed(2);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const max = document.body.scrollHeight - window.innerHeight;
      setStickyVisible(y > 700 && y < max - 400);
    };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const addToCart = () => {
    setCartCount(c => c + qty);
    setAddedFlash(true);
    setTimeout(() => setAddedFlash(false), 2000);
  };
  const onShop = () => document.getElementById('shop')?.scrollIntoView({behavior:'smooth', block:'start'});

  return (
    <>
      <AnnouncementBar items={D.announce} />
      <FreeShipBar threshold={35} current={cartCount * sel.price} />
      <Nav cartCount={cartCount} brand={D.brand} />

      <section className="product" id="shop">
        <div className="container product-grid">
          <Gallery hero={D.gallery.hero} slides={D.gallery.slides} />
          <ProductInfo P={D.product} qty={qty} setQty={setQty} offer={offer} setOffer={setOffer} color={color} setColor={setColor} size={size} setSize={setSize} sub={sub} setSub={setSub} addToCart={addToCart} addedFlash={addedFlash} />
        </div>
      </section>

      <Press items={D.press} />
      <BenefitsSection {...D.benefits} />
      <HowItWorks {...D.how} />
      <Comparison {...D.compare} />
      <Ingredients {...D.ingredients} />
      <ReviewsSection P={D.product} reviews={D.reviews} social={D.social} />
      <UGC {...D.ugc} />
      <CrossSell {...D.crossSell} />
      <FounderSection {...D.founder} />
      <Specs rows={D.specs} />
      <FAQSection items={D.faq} />
      <FinalCTA {...D.finalCta} onShop={onShop} />
      <Footer brand={D.brand} tagline={D.tagline} contact={D.contact} socials={D.socials} />

      <StickyAtcBar visible={stickyVisible} price={totalPrice} qty={qty} onShop={addToCart} title={D.product.title} />
    </>
  );
}

window.LandingApp = App;
