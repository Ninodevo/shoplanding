import JSZip from "jszip";
import {
  ARTIFACT_FILENAME,
  type PackagerInput,
  type PackagerOutput,
} from "./types";
import { packageSpec } from "./spec";
import { SECTIONS_CSS } from "./shopify-sections";

/**
 * WooCommerce packager — real emitter (Phase 16).
 *
 * Ships a WordPress PLUGIN, not a theme. Rationale: a theme forces the buyer
 * to abandon their current theme site-wide; a plugin drops into whatever
 * they already run, registers a "ShopLanding — Product Landing" page
 * template, and renders the full landing page for one WooCommerce product
 * on any Page that selects the template.
 *
 * Structure inside the zip:
 *   shoplanding-landing/
 *     shoplanding-landing.php   — bootstrap: template registration + assets
 *     includes/content.json     — the buyer's seeded content (edit this)
 *     includes/render.php       — one render function per section
 *     templates/landing-page.php— page template shell
 *     assets/landing.css        — preset tokens + the same section CSS the
 *                                 Shopify theme uses (shared SECTIONS_CSS)
 *     assets/landing.js         — sticky ATC + qty stepper
 *     readme.txt / README.md / LICENSE.txt
 *   spec/                       — portable system spec, as always
 *
 * Content strategy: all copy lives in `includes/content.json` (seeded from
 * the preset's demo seed at package time). JSON instead of a PHP array so
 * generation can never produce a PHP parse error from odd characters, and
 * the buyer edits plain JSON — same shape as the portable spec.
 *
 * Product wiring: `product_id` in content.json. Simple products get an
 * inline add-to-cart form (Woo's `add-to-cart` param handler); variable /
 * other types render a "Choose options" button to the native product page.
 */
export async function packageWoo(
  input: PackagerInput,
): Promise<PackagerOutput> {
  const spec = await packageSpec(input);
  const zip = new JSZip();
  const root = "shoplanding-landing";

  zip.file(`${root}/shoplanding-landing.php`, buildPluginBootstrap(input));
  zip.file(`${root}/includes/content.json`, buildContentJson(input));
  zip.file(`${root}/includes/render.php`, buildRenderPhp());
  zip.file(`${root}/templates/landing-page.php`, buildLandingTemplate());
  zip.file(`${root}/assets/landing.css`, buildCss(input));
  zip.file(`${root}/assets/landing.js`, buildJs());
  zip.file(`${root}/readme.txt`, buildWpReadme(input));
  zip.file(`${root}/README.md`, buildReadme(input));
  zip.file(`${root}/LICENSE.txt`, buildLicense(input));

  zip.file(`spec/${spec.filename}`, spec.bytes);

  const bytes = await zip.generateAsync({
    type: "uint8array",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });

  return {
    filename: ARTIFACT_FILENAME.woo(input.presetSlug),
    contentType: "application/zip",
    bytes,
  };
}

// ============================================================================
// shoplanding-landing.php — plugin bootstrap
// ============================================================================
function buildPluginBootstrap(input: PackagerInput): string {
  return `<?php
/**
 * Plugin Name: ShopLanding — Product Landing
 * Plugin URI: https://shoplanding.com
 * Description: High-converting single-product landing page template for WooCommerce, built on the 69-rule ShopLanding CRO playbook. Preset: ${phpComment(input.presetSlug)} · v${phpComment(input.version)}
 * Version: ${phpComment(input.version)}
 * Requires at least: 6.2
 * Requires PHP: 7.4
 * Author: ShopLanding
 * Author URI: https://shoplanding.com
 * License: Commercial — see LICENSE.txt
 * Text Domain: shoplanding-landing
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'SHOPLANDING_VERSION', '${phpComment(input.version)}' );
define( 'SHOPLANDING_DIR', plugin_dir_path( __FILE__ ) );
define( 'SHOPLANDING_URL', plugin_dir_url( __FILE__ ) );
define( 'SHOPLANDING_TEMPLATE', 'shoplanding-landing.php' );

require_once SHOPLANDING_DIR . 'includes/render.php';

/**
 * Content loader. Everything editable lives in includes/content.json —
 * copy, reviews, FAQ, specs, and the target product_id. Cached per request.
 */
function shoplanding_content() {
	static $content = null;
	if ( null === $content ) {
		$raw     = file_get_contents( SHOPLANDING_DIR . 'includes/content.json' );
		$decoded = json_decode( $raw, true );
		$content = is_array( $decoded ) ? $decoded : array();
	}
	return $content;
}

/** Resolve the WooCommerce product the landing page sells. */
function shoplanding_product() {
	if ( ! function_exists( 'wc_get_product' ) ) {
		return null;
	}
	$content = shoplanding_content();
	$id      = isset( $content['product_id'] ) ? absint( $content['product_id'] ) : 0;
	$id      = apply_filters( 'shoplanding_product_id', $id );

	if ( $id > 0 ) {
		$product = wc_get_product( $id );
		if ( $product ) {
			return $product;
		}
	}

	// Fallback: newest published product, so the template renders something
	// meaningful before the buyer sets product_id in content.json.
	$ids = wc_get_products(
		array(
			'status'  => 'publish',
			'limit'   => 1,
			'orderby' => 'date',
			'order'   => 'DESC',
			'return'  => 'ids',
		)
	);
	return ! empty( $ids ) ? wc_get_product( $ids[0] ) : null;
}

/** Register the page template in the editor's template dropdown. */
add_filter( 'theme_page_templates', function ( $templates ) {
	$templates[ SHOPLANDING_TEMPLATE ] = __( 'ShopLanding — Product Landing', 'shoplanding-landing' );
	return $templates;
} );

/** Serve our template file when a page selects it. */
add_filter( 'template_include', function ( $template ) {
	if ( is_page() && get_page_template_slug() === SHOPLANDING_TEMPLATE ) {
		return SHOPLANDING_DIR . 'templates/landing-page.php';
	}
	return $template;
} );

/** Assets — only on the landing template. */
add_action( 'wp_enqueue_scripts', function () {
	if ( ! is_page() || get_page_template_slug() !== SHOPLANDING_TEMPLATE ) {
		return;
	}
	wp_enqueue_style( 'shoplanding-landing', SHOPLANDING_URL . 'assets/landing.css', array(), SHOPLANDING_VERSION );
	wp_enqueue_script( 'shoplanding-landing', SHOPLANDING_URL . 'assets/landing.js', array(), SHOPLANDING_VERSION, true );
} );

/** Admin notice if WooCommerce is missing — the template needs it. */
add_action( 'admin_notices', function () {
	if ( class_exists( 'WooCommerce' ) ) {
		return;
	}
	echo '<div class="notice notice-warning"><p>';
	echo esc_html__( 'ShopLanding — Product Landing needs WooCommerce to render product data. The template will show placeholder pricing until WooCommerce is active.', 'shoplanding-landing' );
	echo '</p></div>';
} );
`;
}

// ============================================================================
// includes/content.json — seeded content (buyer edits this file)
// ============================================================================
function buildContentJson(input: PackagerInput): string {
  const c = input.content;
  return JSON.stringify(
    {
      _readme:
        "All landing-page copy lives here. Edit freely — the template re-reads this file on every page load. Set product_id to your WooCommerce product's ID (Products → hover a product → ID).",
      product_id: 0,
      brand: {
        name: c.brand.name,
        tagline: c.brand.tagline,
        founder_name: c.brand.founderName,
        founder_title: c.brand.founderTitle,
        founder_quote: c.brand.founderQuote,
      },
      announce: c.announce.slice(0, 4),
      hero: {
        subtitle: c.product.subtitle,
        rating: String(c.product.rating),
        review_count: String(c.product.reviewCount),
        key_benefits: c.product.keyBenefits,
        cta_label: input.tweaks?.ctaCopy ?? "Add to cart",
        free_ship_note: "Free shipping over $35",
      },
      press: c.press.slice(0, 8).map((p) => ({ text: p.text, style: p.cls })),
      benefits: c.benefits.slice(0, 6).map((b) => ({ icon: b.ico, title: b.t, body: b.d })),
      steps: c.steps.slice(0, 4).map((s) => ({ title: s.t, body: s.d })),
      comparison: {
        us_label: c.brand.name,
        them_label: "Typical alternative",
        rows: c.comparison.slice(0, 10).map((r) => ({ feature: r[0], us: r[1], them: r[2] })),
      },
      ingredients: c.ingredients.slice(0, 8).map((i) => ({
        name: i.name,
        role: i.use,
        pct: i.pct,
        swatch: i.color,
      })),
      reviews: {
        rating: String(c.product.rating),
        count: String(c.product.reviewCount),
        items: c.reviews.slice(0, 12).map((r) => ({
          rating: Math.round(r.rating),
          title: r.title,
          body: r.body,
          name: r.name,
          detail: `${r.occ}, ${r.age}`,
          verified: r.verified,
        })),
      },
      social: c.socialReviews.slice(0, 8).map((p) => ({
        platform: p.platform,
        author: p.author,
        handle: p.handle,
        text: p.text,
      })),
      cross_sells: c.crossSells.slice(0, 4).map((x) => ({
        icon: x.ico,
        title: x.t,
        rating: String(x.stars),
        count: String(x.count),
        price: `$${x.price}`,
        was: x.was === null ? "" : `$${x.was}`,
      })),
      specs: c.specs.slice(0, 12).map((s) => ({ label: s[0], value: s[1] })),
      faq: c.faq.slice(0, 12).map((f) => ({ q: f.q, a: f.a })),
      final_cta: {
        eyebrow: "Ready when you are",
        headline: "Try it. Refund if you don't love it.",
        sub: "30-day money-back guarantee. Free shipping.",
        cta_label: input.tweaks?.ctaCopy ?? "Shop now",
      },
    },
    null,
    2,
  );
}

// ============================================================================
// includes/render.php — one function per section, all output escaped
// ============================================================================
function buildRenderPhp(): string {
  return `<?php
/**
 * Section renderers for the ShopLanding landing template. Content comes
 * from shoplanding_content() (includes/content.json); live product data
 * from shoplanding_product(). Every echo is escaped.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/** Small helper: value from the content array with a default. */
function sl_c( $arr, $key, $default = '' ) {
	return isset( $arr[ $key ] ) ? $arr[ $key ] : $default;
}

function sl_render_announce( $content ) {
	$items = sl_c( $content, 'announce', array() );
	if ( empty( $items ) ) {
		return;
	}
	echo '<div class="sl-announce"><div class="sl-announce-track">';
	foreach ( $items as $item ) {
		echo '<span class="sl-announce-item"><span class="sl-pip"></span>' . esc_html( $item ) . '</span>';
	}
	echo '</div></div>';
}

function sl_render_hero( $content, $product ) {
	$hero  = sl_c( $content, 'hero', array() );
	$brand = sl_c( $content, 'brand', array() );
	echo '<section class="sl-product" id="shop">';
	echo '<div class="sl-container sl-product-grid">';

	// Gallery.
	echo '<div class="sl-gallery"><div class="sl-gallery-main">';
	if ( $product && has_post_thumbnail( $product->get_id() ) ) {
		echo get_the_post_thumbnail( $product->get_id(), 'large', array( 'class' => 'sl-gallery-img' ) );
	} else {
		echo '<div class="sl-gallery-placeholder">' . esc_html( $product ? $product->get_name() : sl_c( $brand, 'name', 'Product' ) ) . '</div>';
	}
	if ( $product && $product->is_on_sale() ) {
		echo '<span class="sl-gallery-badge sale">' . esc_html__( 'SALE', 'shoplanding-landing' ) . '</span>';
	}
	echo '</div>';
	if ( $product ) {
		$gallery_ids = $product->get_gallery_image_ids();
		if ( ! empty( $gallery_ids ) ) {
			echo '<div class="sl-gallery-thumbs">';
			foreach ( array_slice( $gallery_ids, 0, 5 ) as $img_id ) {
				echo '<span class="sl-thumb">' . wp_get_attachment_image( $img_id, 'thumbnail' ) . '</span>';
			}
			echo '</div>';
		}
	}
	echo '</div>';

	// Buy box.
	echo '<div class="sl-info">';
	echo '<h1 class="sl-display sl-title">' . esc_html( $product ? $product->get_name() : sl_c( $brand, 'name', '' ) ) . '</h1>';
	$subtitle = sl_c( $hero, 'subtitle' );
	if ( $subtitle ) {
		echo '<p class="sl-subtitle">' . esc_html( $subtitle ) . '</p>';
	}

	$rating = sl_c( $hero, 'rating' );
	if ( $rating ) {
		echo '<div class="sl-rating"><span class="sl-stars">★★★★★</span>';
		echo '<a href="#reviews" class="sl-rating-link">' . esc_html( $rating ) . ' · ' . esc_html__( 'Read', 'shoplanding-landing' ) . ' ' . esc_html( sl_c( $hero, 'review_count', '' ) ) . ' ' . esc_html__( 'reviews', 'shoplanding-landing' ) . '</a></div>';
	}

	$benefits = sl_c( $hero, 'key_benefits', array() );
	if ( ! empty( $benefits ) ) {
		echo '<ul class="sl-key-benefits">';
		foreach ( $benefits as $b ) {
			echo '<li><span class="sl-check">✓</span><span>' . esc_html( $b ) . '</span></li>';
		}
		echo '</ul>';
	}

	// Price — live from WooCommerce.
	if ( $product ) {
		echo '<div class="sl-price-block"><div class="sl-price-row">' . wp_kses_post( $product->get_price_html() ) . '</div>';
		if ( $product->is_in_stock() ) {
			echo '<p class="sl-stock sl-mono">' . esc_html__( 'In stock — ships within 24h', 'shoplanding-landing' ) . '</p>';
		}
		echo '</div>';
	}

	// ATC — simple products inline; anything else to the native product page.
	if ( $product && $product->is_type( 'simple' ) && $product->is_purchasable() && $product->is_in_stock() ) {
		echo '<form class="sl-form sl-qty-atc" method="post" action="">';
		echo '<div class="sl-qty">';
		echo '<button type="button" data-qty-step="-1" aria-label="' . esc_attr__( 'Decrease', 'shoplanding-landing' ) . '">−</button>';
		echo '<input type="number" name="quantity" value="1" min="1" inputmode="numeric" data-qty>';
		echo '<button type="button" data-qty-step="1" aria-label="' . esc_attr__( 'Increase', 'shoplanding-landing' ) . '">+</button>';
		echo '</div>';
		echo '<button type="submit" name="add-to-cart" value="' . esc_attr( $product->get_id() ) . '" class="sl-btn sl-btn-primary sl-atc">⊞ ' . esc_html( sl_c( $hero, 'cta_label', 'Add to cart' ) ) . '</button>';
		echo '</form>';
	} elseif ( $product ) {
		echo '<a class="sl-btn sl-btn-primary sl-atc" href="' . esc_url( $product->get_permalink() ) . '">' . esc_html__( 'Choose options', 'shoplanding-landing' ) . ' →</a>';
	}

	$ship = sl_c( $hero, 'free_ship_note' );
	echo '<div class="sl-trust-mini">';
	if ( $ship ) {
		echo '<div class="sl-trust-item">📦 ' . esc_html( $ship ) . '</div>';
	}
	echo '<div class="sl-trust-item">🔒 ' . esc_html__( 'Secure checkout', 'shoplanding-landing' ) . '</div>';
	echo '<div class="sl-trust-item">↩ ' . esc_html__( '30-day refund', 'shoplanding-landing' ) . '</div>';
	echo '</div>';

	echo '</div></div></section>';
}

function sl_render_press( $content ) {
	$logos = sl_c( $content, 'press', array() );
	if ( empty( $logos ) ) {
		return;
	}
	echo '<section class="sl-section sl-press"><div class="sl-container">';
	echo '<p class="sl-mono sl-press-eyebrow">' . esc_html__( 'As seen in', 'shoplanding-landing' ) . '</p><div class="sl-press-row">';
	foreach ( $logos as $logo ) {
		$style = in_array( sl_c( $logo, 'style' ), array( 'serif', 'mono', 'script' ), true ) ? $logo['style'] : 'serif';
		echo '<span class="sl-press-logo sl-press-' . esc_attr( $style ) . '">' . esc_html( sl_c( $logo, 'text' ) ) . '</span>';
	}
	echo '</div></div></section>';
}

function sl_render_benefits( $content ) {
	$items = sl_c( $content, 'benefits', array() );
	if ( empty( $items ) ) {
		return;
	}
	echo '<section class="sl-section sl-benefits"><div class="sl-container">';
	echo '<p class="sl-mono">' . esc_html__( 'Why it works', 'shoplanding-landing' ) . '</p>';
	echo '<h2 class="sl-display sl-section-title">' . esc_html__( 'Built around what you actually need.', 'shoplanding-landing' ) . '</h2>';
	echo '<div class="sl-benefits-grid">';
	foreach ( $items as $b ) {
		echo '<article class="sl-benefit-card"><div class="sl-benefit-ico">' . esc_html( sl_c( $b, 'icon' ) ) . '</div>';
		echo '<h3>' . esc_html( sl_c( $b, 'title' ) ) . '</h3><p>' . esc_html( sl_c( $b, 'body' ) ) . '</p></article>';
	}
	echo '</div></div></section>';
}

function sl_render_steps( $content ) {
	$items = sl_c( $content, 'steps', array() );
	if ( empty( $items ) ) {
		return;
	}
	echo '<section class="sl-section sl-steps"><div class="sl-container">';
	echo '<p class="sl-mono">' . esc_html__( 'How it works', 'shoplanding-landing' ) . '</p>';
	echo '<h2 class="sl-display sl-section-title">' . esc_html__( 'Three steps. Ten seconds.', 'shoplanding-landing' ) . '</h2><ol class="sl-steps-row">';
	$n = 1;
	foreach ( $items as $s ) {
		echo '<li class="sl-step"><span class="sl-step-num sl-mono">' . esc_html( str_pad( (string) $n, 2, '0', STR_PAD_LEFT ) ) . '</span>';
		echo '<h3>' . esc_html( sl_c( $s, 'title' ) ) . '</h3><p>' . esc_html( sl_c( $s, 'body' ) ) . '</p></li>';
		$n++;
	}
	echo '</ol></div></section>';
}

function sl_render_comparison( $content ) {
	$cmp  = sl_c( $content, 'comparison', array() );
	$rows = sl_c( $cmp, 'rows', array() );
	if ( empty( $rows ) ) {
		return;
	}
	echo '<section class="sl-section sl-compare"><div class="sl-container">';
	echo '<p class="sl-mono">' . esc_html__( 'Compare', 'shoplanding-landing' ) . '</p>';
	echo '<h2 class="sl-display sl-section-title">' . esc_html__( 'Not all of them are built the same.', 'shoplanding-landing' ) . '</h2>';
	echo '<div class="sl-compare-table" role="table">';
	echo '<div class="sl-compare-head" role="row"><span role="columnheader"></span>';
	echo '<span role="columnheader" class="sl-compare-us">' . esc_html( sl_c( $cmp, 'us_label', 'Ours' ) ) . '</span>';
	echo '<span role="columnheader">' . esc_html( sl_c( $cmp, 'them_label', 'Others' ) ) . '</span></div>';
	foreach ( $rows as $r ) {
		echo '<div class="sl-compare-row" role="row">';
		echo '<span role="cell" class="sl-compare-feature">' . esc_html( sl_c( $r, 'feature' ) ) . '</span>';
		echo '<span role="cell" class="sl-compare-us">' . esc_html( sl_c( $r, 'us' ) ) . '</span>';
		echo '<span role="cell" class="sl-compare-them">' . esc_html( sl_c( $r, 'them' ) ) . '</span></div>';
	}
	echo '</div></div></section>';
}

function sl_render_ingredients( $content ) {
	$items = sl_c( $content, 'ingredients', array() );
	if ( empty( $items ) ) {
		return;
	}
	echo '<section class="sl-section sl-ingredients"><div class="sl-container">';
	echo '<p class="sl-mono">' . esc_html__( "What's inside", 'shoplanding-landing' ) . '</p>';
	echo '<h2 class="sl-display sl-section-title">' . esc_html__( 'Nothing to hide.', 'shoplanding-landing' ) . '</h2><div class="sl-ingredients-grid">';
	foreach ( $items as $ing ) {
		echo '<article class="sl-ingredient"><span class="sl-ingredient-dot" style="background: ' . esc_attr( sl_c( $ing, 'swatch', '#ddd' ) ) . '"></span><div>';
		echo '<h3>' . esc_html( sl_c( $ing, 'name' ) );
		if ( sl_c( $ing, 'pct' ) ) {
			echo ' <span class="sl-ingredient-pct sl-mono">' . esc_html( $ing['pct'] ) . '</span>';
		}
		echo '</h3><p>' . esc_html( sl_c( $ing, 'role' ) ) . '</p></div></article>';
	}
	echo '</div></div></section>';
}

function sl_render_reviews( $content ) {
	$rev   = sl_c( $content, 'reviews', array() );
	$items = sl_c( $rev, 'items', array() );
	if ( empty( $items ) ) {
		return;
	}
	echo '<section class="sl-section sl-reviews" id="reviews"><div class="sl-container">';
	echo '<div class="sl-reviews-head"><div>';
	echo '<p class="sl-mono">' . esc_html__( 'Reviews', 'shoplanding-landing' ) . '</p>';
	echo '<h2 class="sl-display sl-section-title">' . esc_html__( 'What customers say.', 'shoplanding-landing' ) . '</h2></div>';
	echo '<div class="sl-reviews-summary"><div class="sl-reviews-score">';
	echo '<span class="sl-reviews-big">' . esc_html( sl_c( $rev, 'rating' ) ) . '</span><div>';
	echo '<div class="sl-stars">★★★★★</div>';
	echo '<div class="sl-reviews-count">' . esc_html( sl_c( $rev, 'count' ) ) . ' ' . esc_html__( 'verified reviews', 'shoplanding-landing' ) . '</div>';
	echo '</div></div></div></div>';
	echo '<div class="sl-reviews-grid">';
	foreach ( $items as $r ) {
		$stars = max( 1, min( 5, (int) sl_c( $r, 'rating', 5 ) ) );
		echo '<article class="sl-review-card"><div class="sl-review-top">';
		echo '<span class="sl-stars">' . esc_html( str_repeat( '★', $stars ) . str_repeat( '☆', 5 - $stars ) ) . '</span>';
		if ( ! empty( $r['verified'] ) ) {
			echo '<span class="sl-verified sl-mono">✓ ' . esc_html__( 'Verified buyer', 'shoplanding-landing' ) . '</span>';
		}
		echo '</div>';
		echo '<h3 class="sl-review-title">' . esc_html( sl_c( $r, 'title' ) ) . '</h3>';
		echo '<p class="sl-review-body">' . esc_html( sl_c( $r, 'body' ) ) . '</p>';
		echo '<footer class="sl-review-meta"><span class="sl-review-avatar">' . esc_html( mb_substr( sl_c( $r, 'name', '?' ), 0, 1 ) ) . '</span>';
		echo '<span>' . esc_html( sl_c( $r, 'name' ) );
		if ( sl_c( $r, 'detail' ) ) {
			echo ' · ' . esc_html( $r['detail'] );
		}
		echo '</span></footer></article>';
	}
	echo '</div></div></section>';
}

function sl_render_social( $content ) {
	$items = sl_c( $content, 'social', array() );
	if ( empty( $items ) ) {
		return;
	}
	echo '<section class="sl-section sl-ugc"><div class="sl-container">';
	echo '<p class="sl-mono">' . esc_html__( 'From the feed', 'shoplanding-landing' ) . '</p>';
	echo '<h2 class="sl-display sl-section-title">' . esc_html__( 'Posted, not paid.', 'shoplanding-landing' ) . '</h2><div class="sl-ugc-grid">';
	foreach ( $items as $p ) {
		echo '<blockquote class="sl-ugc-card"><header>';
		echo '<span class="sl-ugc-platform sl-mono">' . esc_html( sl_c( $p, 'platform' ) ) . '</span>';
		echo '<span class="sl-ugc-author">' . esc_html( sl_c( $p, 'author' ) ) . ' <em>' . esc_html( sl_c( $p, 'handle' ) ) . '</em></span>';
		echo '</header><p>' . esc_html( sl_c( $p, 'text' ) ) . '</p></blockquote>';
	}
	echo '</div></div></section>';
}

function sl_render_cross_sells( $content ) {
	$items = sl_c( $content, 'cross_sells', array() );
	if ( empty( $items ) ) {
		return;
	}
	echo '<section class="sl-section sl-xsell"><div class="sl-container">';
	echo '<p class="sl-mono">' . esc_html__( 'Pairs well with', 'shoplanding-landing' ) . '</p>';
	echo '<h2 class="sl-display sl-section-title">' . esc_html__( 'Complete the routine.', 'shoplanding-landing' ) . '</h2><div class="sl-xsell-grid">';
	foreach ( $items as $x ) {
		echo '<div class="sl-xsell-card"><div class="sl-xsell-img sl-xsell-ph">' . esc_html( sl_c( $x, 'icon' ) ) . '</div>';
		echo '<h3>' . esc_html( sl_c( $x, 'title' ) ) . '</h3>';
		echo '<div class="sl-xsell-stars">★ ' . esc_html( sl_c( $x, 'rating' ) ) . ' · ' . esc_html( sl_c( $x, 'count' ) ) . ' ' . esc_html__( 'reviews', 'shoplanding-landing' ) . '</div>';
		echo '<div class="sl-xsell-price">' . esc_html( sl_c( $x, 'price' ) );
		if ( sl_c( $x, 'was' ) ) {
			echo ' <s>' . esc_html( $x['was'] ) . '</s>';
		}
		echo '</div></div>';
	}
	echo '</div>';
	echo '<p class="sl-xsell-note sl-mono">' . esc_html__( 'Placeholder cards — swap for your real products by editing includes/content.json.', 'shoplanding-landing' ) . '</p>';
	echo '</div></section>';
}

function sl_render_founder( $content ) {
	$brand = sl_c( $content, 'brand', array() );
	$quote = sl_c( $brand, 'founder_quote' );
	if ( ! $quote ) {
		return;
	}
	echo '<section class="sl-section sl-founder"><div class="sl-container sl-founder-grid">';
	echo '<div class="sl-founder-avatar-wrap"><div class="sl-founder-avatar">' . esc_html( mb_substr( sl_c( $brand, 'founder_name', '?' ), 0, 1 ) ) . '</div></div>';
	echo '<div><p class="sl-mono">' . esc_html__( 'A note from the founder', 'shoplanding-landing' ) . '</p>';
	echo '<blockquote class="sl-founder-quote">' . esc_html( $quote ) . '</blockquote>';
	echo '<p class="sl-founder-sig">— ' . esc_html( sl_c( $brand, 'founder_name' ) ) . ', ' . esc_html( sl_c( $brand, 'founder_title' ) ) . '</p></div>';
	echo '</div></section>';
}

function sl_render_specs( $content ) {
	$rows = sl_c( $content, 'specs', array() );
	if ( empty( $rows ) ) {
		return;
	}
	echo '<section class="sl-section sl-specs"><div class="sl-container">';
	echo '<p class="sl-mono">' . esc_html__( 'Specs', 'shoplanding-landing' ) . '</p>';
	echo '<h2 class="sl-display sl-section-title">' . esc_html__( 'The details.', 'shoplanding-landing' ) . '</h2><dl class="sl-specs-table">';
	foreach ( $rows as $r ) {
		echo '<div class="sl-specs-row"><dt>' . esc_html( sl_c( $r, 'label' ) ) . '</dt><dd>' . esc_html( sl_c( $r, 'value' ) ) . '</dd></div>';
	}
	echo '</dl></div></section>';
}

function sl_render_faq( $content ) {
	$items = sl_c( $content, 'faq', array() );
	if ( empty( $items ) ) {
		return;
	}
	echo '<section class="sl-section sl-faq" id="faq"><div class="sl-container">';
	echo '<p class="sl-mono">FAQ</p>';
	echo '<h2 class="sl-display sl-section-title">' . esc_html__( 'Answered before you ask.', 'shoplanding-landing' ) . '</h2><div class="sl-faq-list">';
	$first = true;
	foreach ( $items as $f ) {
		echo '<details class="sl-faq-item"' . ( $first ? ' open' : '' ) . '>';
		echo '<summary>' . esc_html( sl_c( $f, 'q' ) ) . '<span class="sl-faq-plus">+</span></summary>';
		echo '<p>' . esc_html( sl_c( $f, 'a' ) ) . '</p></details>';
		$first = false;
	}
	echo '</div></div></section>';
}

function sl_render_final_cta( $content, $product ) {
	$cta = sl_c( $content, 'final_cta', array() );
	echo '<section class="sl-final-cta"><div class="sl-container">';
	echo '<p class="sl-mono sl-final-eyebrow">' . esc_html( sl_c( $cta, 'eyebrow' ) ) . '</p>';
	echo '<h2 class="sl-display">' . esc_html( sl_c( $cta, 'headline' ) ) . '</h2>';
	echo '<p class="sl-final-sub">' . esc_html( sl_c( $cta, 'sub' ) ) . '</p>';
	echo '<a href="#shop" class="sl-btn sl-btn-primary sl-btn-lg">' . esc_html( sl_c( $cta, 'cta_label', 'Shop now' ) ) . ' →</a>';
	echo '</div></section>';
}

function sl_render_sticky_atc( $content, $product ) {
	if ( ! $product ) {
		return;
	}
	$hero = sl_c( $content, 'hero', array() );
	echo '<div class="sl-sticky-atc" data-sticky-atc role="complementary">';
	echo '<div class="sl-container sl-sticky-inner"><div class="sl-sticky-info"><div>';
	echo '<div class="sl-sticky-title">' . esc_html( $product->get_name() ) . '</div>';
	echo '<div class="sl-sticky-meta">' . wp_kses_post( $product->get_price_html() ) . ' · ⭐ ' . esc_html( sl_c( $hero, 'rating', '' ) ) . '</div>';
	echo '</div></div>';
	echo '<a href="#shop" class="sl-btn sl-btn-primary">' . esc_html( sl_c( $hero, 'cta_label', 'Add to cart' ) ) . ' →</a>';
	echo '</div></div>';
}

/** Schema.org Product JSON-LD from live product data. */
function sl_render_jsonld( $content, $product ) {
	if ( ! $product ) {
		return;
	}
	$brand = sl_c( $content, 'brand', array() );
	$data  = array(
		'@context'    => 'https://schema.org/',
		'@type'       => 'Product',
		'name'        => $product->get_name(),
		'description' => wp_strip_all_tags( $product->get_short_description() ? $product->get_short_description() : $product->get_description() ),
		'brand'       => array(
			'@type' => 'Brand',
			'name'  => sl_c( $brand, 'name', get_bloginfo( 'name' ) ),
		),
		'offers'      => array(
			'@type'         => 'Offer',
			'url'           => get_permalink(),
			'priceCurrency' => get_woocommerce_currency(),
			'price'         => wc_get_price_to_display( $product ),
			'availability'  => $product->is_in_stock() ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
		),
	);
	if ( has_post_thumbnail( $product->get_id() ) ) {
		$data['image'] = array( get_the_post_thumbnail_url( $product->get_id(), 'large' ) );
	}
	echo '<script type="application/ld+json">' . wp_json_encode( $data ) . '</script>';
}
`;
}

// ============================================================================
// templates/landing-page.php — the page template shell
// ============================================================================
function buildLandingTemplate(): string {
  return `<?php
/**
 * Template: ShopLanding — Product Landing.
 * Rendered via the template_include filter in shoplanding-landing.php.
 *
 * Blank-canvas shell — deliberately NOT get_header()/get_footer(). Two
 * reasons, both verified on a live WordPress install:
 *   1. Host themes wrap page content in their own constrained content
 *      column (Twenty Twenty-One squeezed the page to ~650px) and inject
 *      their site header/nav above it.
 *   2. The playbook's General block rules say a landing page has no
 *      outgoing nav — the blank canvas is the conversion-correct default.
 * wp_head()/wp_footer() still run, so plugins (analytics, pixels, Woo
 * scripts) keep working.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$sl_content = shoplanding_content();
$sl_product = shoplanding_product();
?>
<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
<meta charset="<?php bloginfo( 'charset' ); ?>">
<meta name="viewport" content="width=device-width, initial-scale=1">
<?php wp_head(); ?>
</head>
<body <?php body_class( 'sl-landing-body' ); ?>>
<?php wp_body_open(); ?>
<div class="sl-landing">
	<?php
	sl_render_announce( $sl_content );
	if ( function_exists( 'wc_print_notices' ) ) {
		echo '<div class="sl-container sl-notices">';
		wc_print_notices();
		echo '</div>';
	}
	sl_render_hero( $sl_content, $sl_product );
	sl_render_press( $sl_content );
	sl_render_benefits( $sl_content );
	sl_render_steps( $sl_content );
	sl_render_comparison( $sl_content );
	sl_render_ingredients( $sl_content );
	sl_render_reviews( $sl_content );
	sl_render_social( $sl_content );
	sl_render_cross_sells( $sl_content );
	sl_render_founder( $sl_content );
	sl_render_specs( $sl_content );
	sl_render_faq( $sl_content );
	sl_render_final_cta( $sl_content, $sl_product );
	sl_render_sticky_atc( $sl_content, $sl_product );
	sl_render_jsonld( $sl_content, $sl_product );
	?>
</div>
<?php wp_footer(); ?>
</body>
</html>
`;
}

// ============================================================================
// assets/landing.css — preset tokens + shared section CSS
// ============================================================================
function buildCss(input: PackagerInput): string {
  const t = input.tokens;
  return `/* ShopLanding · WooCommerce landing plugin · preset: ${input.presetSlug} */

body.sl-landing-body { margin: 0; padding: 0; }

.sl-landing {
  --accent: ${t.accent};
  --accent-deep: ${t.accentDeep};
  --accent-soft: ${t.accentSoft};
  --bg: ${t.bg};
  --surface: ${t.surface};
  --card: ${t.card};
  --ink: ${t.ink};
  --ink-2: ${t.ink2};
  --muted: ${t.muted};
  --line: ${t.line};
  --font-display: ${t.fontDisplay};
  --font-body: ${t.fontBody};
  --font-mono: ${t.fontMono};

  background: var(--bg);
  color: var(--ink);
  font-family: var(--font-body), -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  font-size: 16px;
  line-height: 1.55;
}

/* Scope resets — neutralize the HOST THEME's element styles inside the
   landing page. This must survive hostile selectors: Twenty Twenty-One
   paints buttons via \`button:not(:hover):not(:active)\` — specificity
   (0,3,1) — which beats any sane scoped selector. Interactive primitives
   therefore use !important armor (the same pragmatic choice page-builder
   plugins make); our own component rules that restyle the same
   properties carry !important too so they win back deterministically. */
.sl-landing img { max-width: 100%; height: auto; display: block; }
.sl-landing button {
  font-family: inherit; cursor: pointer;
  background: none !important; border: 0 !important;
  padding: 0 !important; margin: 0 !important;
  color: inherit !important; font-size: inherit; line-height: inherit;
  border-radius: 0 !important; text-transform: none !important;
  letter-spacing: normal !important; box-shadow: none !important;
  min-height: 0 !important; min-width: 0 !important;
}
.sl-landing input {
  font-family: inherit;
  background: transparent !important; border: 0 !important;
  box-shadow: none !important; border-radius: 0 !important;
  margin: 0 !important;
}
.sl-landing a { text-decoration: none; color: inherit; }
.sl-landing h1, .sl-landing h2, .sl-landing h3 { margin: 0; }
.sl-landing ul, .sl-landing ol, .sl-landing dl { margin: 0; }
.sl-landing p { margin: 0; }

.sl-container { width: 100%; max-width: 1200px; margin: 0 auto; padding: 0 24px; }
.sl-display { font-family: var(--font-display); font-weight: 600; letter-spacing: -0.02em; line-height: 1.05; }
.sl-mono { font-family: var(--font-mono); font-size: 11px; text-transform: uppercase; letter-spacing: 0.14em; color: var(--muted); font-weight: 600; }

.sl-landing .sl-btn { display: inline-flex; align-items: center; gap: 8px; padding: 12px 20px !important; border-radius: 999px !important; font-weight: 600; font-size: 14px !important; line-height: 1 !important; border: 0 !important; transition: background 160ms ease; }
.sl-landing .sl-btn-primary { background: var(--accent) !important; color: #fff !important; }
.sl-landing .sl-btn-primary:hover { background: var(--accent-deep) !important; }
.sl-landing .sl-btn-lg { padding: 16px 28px !important; font-size: 16px !important; }

/* Announcement */
.sl-announce { background: var(--ink); color: var(--bg); overflow: hidden; }
.sl-announce-track { display: flex; gap: 36px; padding: 8px 24px; align-items: center; justify-content: center; flex-wrap: wrap; font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; }
.sl-announce-item { display: inline-flex; align-items: center; gap: 8px; }
.sl-pip { width: 6px; height: 6px; border-radius: 999px; background: var(--accent); }

/* Hero / buy box */
.sl-product { padding: 48px 0; }
.sl-product-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 56px; }
@media (max-width: 800px) { .sl-product-grid { grid-template-columns: 1fr; gap: 32px; } }
.sl-gallery-main { position: relative; border-radius: 14px; overflow: hidden; background: var(--surface); aspect-ratio: 1; }
.sl-gallery-main img { width: 100%; height: 100%; object-fit: cover; }
.sl-gallery-placeholder { display: grid; place-items: center; height: 100%; font-family: var(--font-display); font-size: 56px; font-style: italic; color: rgba(0,0,0,0.15); }
.sl-gallery-badge { position: absolute; top: 14px; left: 14px; background: #b9261b; color: #fff; padding: 5px 10px; border-radius: 999px; font-size: 11px; font-family: var(--font-mono); letter-spacing: 0.1em; font-weight: 700; }
.sl-gallery-thumbs { display: flex; gap: 8px; margin-top: 12px; }
.sl-thumb { width: 64px; height: 64px; border-radius: 8px; overflow: hidden; border: 1px solid var(--line); display: block; }
.sl-thumb img { width: 100%; height: 100%; object-fit: cover; }

/* Buy box — differentiated rhythm: identity lines tight, groups get air. */
.sl-info { display: flex; flex-direction: column; gap: 0; }
.sl-title { font-size: clamp(28px, 4vw, 44px); margin-bottom: 12px; }
.sl-subtitle { color: var(--ink-2); font-size: 17px; line-height: 1.55; margin: 0 0 14px; }
.sl-rating { display: inline-flex; gap: 8px; align-items: center; font-size: 13px; margin-bottom: 20px; }
.sl-stars { color: #d49a3a; letter-spacing: 1px; }
.sl-rating-link { color: var(--ink-2); text-decoration: underline; text-underline-offset: 4px; }
.sl-key-benefits { list-style: none; padding: 0; margin: 0 0 22px; display: flex; flex-direction: column; gap: 9px; font-size: 14px; color: var(--ink-2); }
.sl-key-benefits li { display: flex; gap: 10px; align-items: flex-start; line-height: 1.5; }
.sl-check { color: var(--accent); font-weight: 700; flex-shrink: 0; }
.sl-price-block { padding: 0; margin-bottom: 16px; }
.sl-price-row { font-family: var(--font-display); font-size: 32px; font-weight: 600; }
.sl-price-row del { color: var(--muted); font-size: 20px; font-weight: 400; margin-right: 8px; }
.sl-price-row ins { text-decoration: none; }
.sl-stock { margin: 6px 0 0; color: var(--accent-deep); }
/* Qty + ATC — segmented stepper: [ − | 1 | + ] with hairline dividers,
   ATC fills the row at the same 48px height. */
.sl-qty-atc { display: flex; gap: 10px; align-items: stretch; }
.sl-qty { display: inline-flex; align-items: stretch; height: 48px; border: 1px solid var(--line); border-radius: 999px; background: var(--card); overflow: hidden; flex-shrink: 0; }
.sl-landing .sl-qty button { width: 42px; font-size: 17px !important; font-weight: 600; color: var(--ink-2) !important; display: flex; align-items: center; justify-content: center; transition: background 120ms ease, color 120ms ease; }
.sl-landing .sl-qty button:hover { background: var(--surface) !important; color: var(--ink) !important; }
.sl-landing .sl-qty button:first-child { border-right: 1px solid var(--line) !important; }
.sl-landing .sl-qty button:last-of-type { border-left: 1px solid var(--line) !important; }
.sl-landing .sl-qty input { width: 44px; text-align: center; font-size: 15px; font-weight: 600; color: var(--ink); padding: 0; font-variant-numeric: tabular-nums; -moz-appearance: textfield; }
.sl-qty input::-webkit-outer-spin-button, .sl-qty input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
.sl-qty input:focus { outline: none; }
.sl-atc { height: 48px; flex: 1; padding: 0 24px; justify-content: center; gap: 10px; font-size: 15px; }
.sl-trust-mini { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px 16px; margin-top: 14px; padding: 16px 18px; background: var(--surface); border-radius: 12px; font-size: 13px; color: var(--ink-2); }
.sl-notices { padding-top: 16px; }

/* Final CTA */
.sl-final-cta { background: var(--accent-deep); color: #fff; padding: 88px 0; text-align: center; }
.sl-final-eyebrow { color: var(--accent-soft); }
.sl-final-cta h2 { font-size: clamp(32px, 5vw, 56px); margin: 16px 0 12px; }
.sl-final-sub { color: rgba(255,255,255,0.8); max-width: 520px; margin: 0 auto 28px; font-size: 17px; }
.sl-landing .sl-final-cta .sl-btn-primary { background: #fff !important; color: var(--accent-deep) !important; }

/* Sticky ATC */
.sl-sticky-atc { position: fixed; left: 0; right: 0; bottom: 0; z-index: 40; background: var(--card); border-top: 1px solid var(--line); box-shadow: 0 -8px 24px rgba(0,0,0,0.06); transform: translateY(120%); transition: transform 280ms ease; }
.sl-sticky-atc.is-visible { transform: translateY(0); }
.sl-sticky-inner { padding: 12px 24px; display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.sl-sticky-title { font-weight: 600; font-size: 14px; }
.sl-sticky-meta { font-size: 12px; color: var(--muted); }
@media (prefers-reduced-motion: reduce) { .sl-sticky-atc { transition: none; } }

/* Content sections — same CSS the Shopify theme ships. */
.sl-section { padding: 64px 0; }
${SECTIONS_CSS}
`;
}

// ============================================================================
// assets/landing.js — sticky ATC + qty stepper
// ============================================================================
function buildJs(): string {
  return `(function () {
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

  document.querySelectorAll('[data-qty-step]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var input = btn.parentElement.querySelector('[data-qty]');
      if (!input) return;
      var step = parseInt(btn.getAttribute('data-qty-step'), 10);
      input.value = Math.max(1, parseInt(input.value, 10) + step);
    });
  });
})();
`;
}

// ============================================================================
// readme.txt (WordPress format) + README.md + LICENSE.txt
// ============================================================================
function buildWpReadme(input: PackagerInput): string {
  return `=== ShopLanding — Product Landing ===
Contributors: shoplanding
Requires at least: 6.2
Tested up to: 6.7
Requires PHP: 7.4
Stable tag: ${input.version}
License: Commercial

High-converting single-product landing page template for WooCommerce, built on the 69-rule ShopLanding CRO playbook.

== Description ==

Registers a "ShopLanding — Product Landing" page template. Assign it to any Page and it renders a complete single-product landing page — buy box, press strip, benefits, steps, comparison, ingredients, reviews, social wall, cross-sell, founder note, specs, FAQ, final CTA, sticky add-to-cart — wired to a WooCommerce product of your choice.

== Installation ==

1. Plugins → Add New → Upload Plugin → this zip → Activate.
2. Edit includes/content.json → set "product_id" to your product's ID.
3. Pages → Add New → Template: "ShopLanding — Product Landing" → Publish.

== Changelog ==

= ${input.version} =
* Initial WooCommerce release. Preset: ${input.presetSlug}.
`;
}

function buildReadme(input: PackagerInput): string {
  return [
    "# ShopLanding · WooCommerce landing plugin",
    "",
    `**Preset:** \`${input.presetSlug}\`  `,
    `**Brand:** ${input.content.brand.name}  `,
    `**Version:** ${input.version}`,
    "",
    "A WordPress **plugin** (not a theme) — it drops into whatever theme you",
    "already run and registers a page template that renders the full",
    "ShopLanding single-product landing page for one WooCommerce product.",
    "",
    "## Install (3 steps)",
    "",
    "1. **Plugins → Add New → Upload Plugin** → upload the",
    "   `shoplanding-landing` folder as a zip (or copy the folder into",
    "   `wp-content/plugins/`) → **Activate**.",
    "2. Open `wp-content/plugins/shoplanding-landing/includes/content.json`",
    "   and set `product_id` to your product's ID (Products → hover → ID).",
    "   Until you do, the template renders your newest published product.",
    "3. **Pages → Add New** → in Page Attributes pick the template",
    '   **"ShopLanding — Product Landing"** → Publish. Done.',
    "",
    "## Editing content",
    "",
    "Every headline, review, FAQ item, spec row, and comparison row lives in",
    "`includes/content.json` — plain JSON, re-read on every page load. Swap",
    "the seeded demo reviews for your real customers' words before launch.",
    "",
    "## Notes",
    "",
    "- **Simple products** get the inline add-to-cart with quantity stepper.",
    '  **Variable products** render a "Choose options" button to the native',
    "  product page (inline variant pickers land in a future update).",
    "- Prices, stock state, sale badges, and Schema.org JSON-LD are live from",
    "  WooCommerce — content.json never duplicates your prices.",
    "- The `spec/` folder next to the plugin holds the portable system spec.",
    "",
    "Questions: support@shoplanding.com",
    "",
  ].join("\n");
}

function buildLicense(input: PackagerInput): string {
  return [
    "ShopLanding WooCommerce plugin — license traceability stamp",
    "",
    `Preset:      ${input.presetSlug}`,
    `Brand:       ${input.content.brand.name}`,
    `Version:     ${input.version}`,
    `Generated:   ${new Date().toISOString()}`,
    `License key: ${input.licenseKey ?? "(unlicensed dev export)"}`,
    "",
    "Use is governed by the ShopLanding license tier purchased with the above",
    "key. See https://shoplanding.com/terms for current terms.",
    "",
  ].join("\n");
}

// ============================================================================
// Helpers
// ============================================================================

/** Sanitize a value for embedding inside a PHP docblock comment. */
function phpComment(s: string): string {
  return s.replace(/\*\//g, "").replace(/[\r\n]/g, " ");
}
