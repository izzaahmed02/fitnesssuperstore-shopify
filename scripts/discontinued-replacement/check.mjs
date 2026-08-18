/**
 * Render checks for the controlled discontinued replacement module.
 *
 * Renders the real snippets against fixtures taken from live Shopify data and
 * asserts the controlled behaviour the module is required to have. See
 * README.md for what each check covers and where the fixtures come from.
 *
 * Usage: npm install liquidjs && node check.mjs
 */
import { Liquid } from 'liquidjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const snippets = path.resolve(here, '../../snippets');

const engine = new Liquid({ root: [snippets], extname: '.liquid', jsTruthy: true });

// --- Shopify filter stubs -------------------------------------------------
engine.registerFilter('asset_url', (v) => `/assets/${v}`);
engine.registerFilter('stylesheet_tag', (v) => `<link rel="stylesheet" href="${v}">`);
engine.registerFilter('image_url', (media, opts) =>
  `${media.src}${opts && opts.width ? `&width=${opts.width}` : ''}`
);
engine.registerFilter('placeholder_svg_tag', (_v, cls) => `<svg class="${cls}"></svg>`);
// Mirrors metafield_tag on a rich_text_field.
engine.registerFilter('metafield_tag', (metafield) => {
  const walk = (n) => {
    if (!n) return '';
    if (n.type === 'root') return n.children.map(walk).join('');
    if (n.type === 'paragraph') return `<p>${n.children.map(walk).join('')}</p>`;
    if (n.type === 'text') return n.value;
    return '';
  };
  return walk(metafield && metafield.value);
});

// --- Fixtures from live Shopify data --------------------------------------
const richText = (text) => ({
  value: { type: 'root', children: [{ type: 'paragraph', children: [{ type: 'text', value: text }] }] },
});

const CT100_CAUTION = 'Expected to restock in October 2026. Transit time is additional.';
const CT100_TITLE = 'French Fitness CT100 Manual Curve Treadmill w/Aluminum Belt (New)';
const CT100_URL = '/products/french-fitness-ct100-manual-curve-treadmill-w-aluminum-belt-new';

const VARIANT_LEAD_TIME = 'Ships from our Warehouse in 1-2 Weeks + Transit Time';
const PRODUCT_LEAD_TIME = 'Ships from our Warehouse in 2-5 Business Days + Transit Time';

const image = (src, alt) => ({ src, alt, width: 2034, height: 2557 });

// FF-CT-100 as it currently stands: unavailable, product-level caution only.
const ct100 = {
  title: CT100_TITLE,
  url: CT100_URL,
  available: false,
  featured_media: image(
    'https://cdn.shopify.com/s/files/1/0884/2012/2940/files/FF-CT-100.webp?v=1758474453',
    'French Fitness CT100 Manual Curve Treadmill - Angled View'
  ),
  selected_or_first_available_variant: { metafields: { custom: {} } },
  metafields: { custom: { processing_time_long: CT100_CAUTION, processing_time: 'Expected Restock: October 2026' } },
};

// A continue-selling backorder replacement: available for sale AND on backorder.
const backorderReplacement = {
  title: 'French Fitness Backorder Replacement (New)',
  url: '/products/french-fitness-backorder-replacement-new',
  available: true,
  featured_media: image('https://cdn.shopify.com/s/files/backorder.webp', 'Backorder replacement'),
  selected_or_first_available_variant: { metafields: { custom: {} } },
  metafields: { custom: { backorder: true, processing_time_long: 'Ships from our Warehouse in 4-6 Weeks + Transit Time' } },
};

// The hidden Rack & Rig configurator parent: the variant value is authoritative
// and conflicts with the stale product-level fallback.
const variantOverrideReplacement = {
  title: 'French Fitness Rack & Rig Uprights (New)',
  url: '/products/french-fitness-rack-rig-uprights-new',
  available: true,
  featured_media: image('https://cdn.shopify.com/s/files/rack-rig.webp', 'Rack and rig upright'),
  selected_or_first_available_variant: {
    metafields: { custom: { processing_time_long_variant: VARIANT_LEAD_TIME } },
  },
  metafields: {
    custom: { processing_time_long: PRODUCT_LEAD_TIME, processing_time: 'Ships in 2-5 Business Days' },
  },
};

const discontinuedProduct = (replacement) => ({
  title: 'French Fitness CT80 Manual Curve Treadmill w/Resistance (New)',
  template_suffix: 'discontinued',
  metafields: {
    custom: {
      discontinued_product_content: {
        value: {
          above_the_fold_content: {
            value: {
              header: { value: 'This Product Has Been Discontinued' },
              introduction: richText(
                'The French Fitness CT80 Manual Curve Treadmill w/Resistance has been discontinued and is no longer available for purchase. Please consider the recommended replacement below.'
              ),
              best_new_replacement: { value: replacement },
              best_new_intro: richText(
                'Recommended replacement: French Fitness CT100 Manual Curve Treadmill. The CT100 is currently out of stock and is expected to restock in October 2026. It is not immediately available.'
              ),
              best_value_option: { value: null },
              best_value_intro: { value: null },
            },
          },
          below_the_fold_content: { value: null },
          below_the_fold_faq: { value: null },
        },
      },
    },
  },
});

// --- Assertions -----------------------------------------------------------
const failures = [];
let assertions = 0;

const check = (name, condition, detail) => {
  assertions += 1;
  if (condition) {
    console.log(`  PASS  ${name}`);
  } else {
    console.log(`  FAIL  ${name} — ${detail}`);
    failures.push(`${name}: ${detail}`);
  }
};

// Nothing the module renders may offer a purchase path.
const PURCHASE_CONTROLS = [
  ['a price', /\$\d|money|price__|product__price|class="price/i],
  ['a form', /<form\b/i],
  ['a button', /<button\b/i],
  ['an add-to-cart control', /name=["']add["']|add-to-cart|product-form__submit|quick-add/i],
  ['a quantity input', /<input\b|quantity-input|<select\b/i],
  ['a Notify Me control', /notify\s*me|restock-rocket|back-in-stock/i],
];

const assertNoPurchaseControl = (label, html) => {
  for (const [what, pattern] of PURCHASE_CONTROLS) {
    check(`${label}: renders no purchase control (${what})`, !pattern.test(html), `output matched ${pattern}`);
  }
};

const render = (product) => engine.renderFileSync('discontinued-replacement', { product });

// --- Checks ---------------------------------------------------------------
console.log('\ncheck: ct100-unavailable');
{
  const html = render(discontinuedProduct(ct100));
  check('renders the controlled discontinued header', html.includes('This Product Has Been Discontinued'), 'header missing');
  check('renders the exact CT100 title', html.includes(CT100_TITLE), 'exact title missing');
  check('links to the CT100 PDP', html.includes(`href="${CT100_URL}"`), 'PDP link missing');
  check('renders the CT100 image', html.includes('FF-CT-100.webp'), 'replacement image missing');
  check('renders the replacement while it is unavailable', html.includes('Out of stock'), 'unavailable replacement not rendered as out of stock');
  check('does not claim the replacement is orderable', !html.includes('Available to Order'), 'implies immediate availability');
  check('renders the approved October 2026 caution', html.includes(CT100_CAUTION), 'approved caution missing');
  assertNoPurchaseControl('ct100-unavailable', html);
}

console.log('\ncheck: backorder-preorder');
{
  const html = render(discontinuedProduct(backorderReplacement));
  check('labels a backorder replacement Available to Pre-Order', html.includes('Available to Pre-Order'), 'pre-order label missing');
  check('does not fall through to Available to Order', !html.includes('>Available to Order<'), 'generic availability branch won over backorder');
  check('uses the theme backorder badge class', html.includes('backorder-badge'), 'backorder badge class missing');
  assertNoPurchaseControl('backorder-preorder', html);
}

console.log('\ncheck: variant-lead-time-override');
{
  const html = render(discontinuedProduct(variantOverrideReplacement));
  check('uses the variant lead time', html.includes(VARIANT_LEAD_TIME), 'variant processing_time_long_variant not used');
  check('does not use the conflicting product-level fallback', !html.includes(PRODUCT_LEAD_TIME), 'stale product-level lead time published');
  assertNoPurchaseControl('variant-lead-time-override', html);
}

console.log('\ncheck: blank-reference-fails-closed');
{
  const product = discontinuedProduct(ct100);
  product.metafields.custom.discontinued_product_content.value.above_the_fold_content.value.best_new_replacement.value = null;
  const html = render(product);
  check('still renders the controlled header', html.includes('This Product Has Been Discontinued'), 'header missing');
  check('renders no replacement card', !html.includes('discontinued-replacement__card'), 'a card was rendered without an approved reference');
  check('substitutes no other product', !html.includes('/products/'), 'a product link was rendered from a blank reference');
  assertNoPurchaseControl('blank-reference-fails-closed', html);
}

// --- Result ---------------------------------------------------------------
console.log(`\n${assertions - failures.length}/${assertions} assertions passed`);
if (failures.length) {
  console.error(`\n${failures.length} failing assertion(s):`);
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
console.log('All discontinued replacement module checks passed.\n');
