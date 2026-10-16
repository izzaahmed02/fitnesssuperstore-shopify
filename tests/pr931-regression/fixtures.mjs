// Cart fixtures for the PR #931 regression rig.
//
// These are shaped like a real /cart.js response, not like a convenient test
// object. Two details matter and are easy to get wrong:
//
//   1. `key` is `<variantId>:<hash>` — the full key is what Shopify returns and
//      what the guard compares against. Scenario 5 deliberately contains two
//      lines sharing one variant id so that a variant-id comparison and a
//      full-key comparison give measurably different answers.
//   2. `properties._functionOperation` comes back from Shopify as a STRING in
//      Ruby-hash form (`=>`), not as the array the theme posted. The guard's
//      `.replace(/=>/g, ':')` exists for exactly that, so the fixtures use the
//      string form for lines already in the cart.

// Per-op bytes under the generated constants (spec a5e3004509fedddc):
//   59 (cartLineId) + 80 (PER_OPERATION_OVERHEAD)
//   + parent item: 43 + 85 + attrs * (12 + 40 + 25)
//   + paid items:  paid * (43 + 85)
//   = 267 + 77*attrs + 128*paid
export const PER_OP = (attrs, paid) => 267 + 77 * attrs + 128 * paid;

export const BUDGET = 19500;

// The configuration under test: 22 paid options, 10 visible properties.
// 22 is the real maximum option count observed on a configured product.
export const NEW_PAID = 22;
export const NEW_VISIBLE = 10;

function rubyFunctionOperation(paid) {
  const entries = [];
  for (let i = 0; i < paid; i += 1) {
    entries.push(`{"variantId"=>"gid://shopify/ProductVariant/4319${i}0000${i}", "priceAdjustment"=>${(i + 1) * 100}.0}`);
  }
  // one unpaid (zero-adjustment) entry, so the paid filter is actually exercised
  entries.push('{"variantId"=>"gid://shopify/ProductVariant/43190000999", "priceAdjustment"=>0.0}');
  return `[${entries.join(', ')}]`;
}

export function bundleLine({ key, variantId, paid = NEW_PAID, attrs = NEW_VISIBLE, title = 'Configured product' }) {
  const properties = { _functionOperation: rubyFunctionOperation(paid) };
  for (let i = 0; i < attrs; i += 1) properties[`Option ${i + 1}`] = `Selected value ${i + 1}`;
  return { id: Number(variantId), key, quantity: 1, title, properties };
}

export function ordinaryLine({ key, variantId, title = 'Plain product' }) {
  // A normal product: public properties but no _functionOperation, so the
  // transform emits nothing for it and the guard must not count it.
  return {
    id: Number(variantId),
    key,
    quantity: 1,
    title,
    properties: { Colour: 'Black', 'Ships from': 'Benicia, CA' },
  };
}

const K = (n) => `4319${String(n).padStart(7, '0')}`;
const H = (c) => String(c).repeat(32);

// --- Scenario carts -------------------------------------------------------

// Five configured lines at 22 paid / 10 visible = 3,853 bytes each = 19,265.
// Adding a sixth takes it to 23,118, over the 19,500 budget.
export const FIVE_BUNDLE_LINES = {
  item_count: 5,
  items: [1, 2, 3, 4, 5].map((n) => bundleLine({ key: `${K(n)}:${H(n)}`, variantId: K(n), title: `Configured ${n}` })),
};

// One configured line plus forty ordinary ones. The ordinary lines produce no
// transform operation at all; the pre-fix guard counted each as a parent.
export const ONE_BUNDLE_FORTY_ORDINARY = {
  item_count: 41,
  items: [
    bundleLine({ key: `${K(1)}:${H(1)}`, variantId: K(1), title: 'Configured 1' }),
    ...Array.from({ length: 40 }, (_, i) =>
      ordinaryLine({ key: `${K(100 + i)}:${H((i % 9) + 1)}`, variantId: K(100 + i), title: `Plain ${i + 1}` })),
  ],
};

// Two lines of the SAME variant with different configurations, plus three
// others. Tim's 14 October item 2 names this case specifically.
export const SAME_VARIANT_TWO_CONFIGS = {
  item_count: 5,
  items: [
    bundleLine({ key: `${K(7)}:${H('a')}`, variantId: K(7), title: 'FF-FSR100 — configuration A' }),
    bundleLine({ key: `${K(7)}:${H('b')}`, variantId: K(7), title: 'FF-FSR100 — configuration B' }),
    bundleLine({ key: `${K(3)}:${H(3)}`, variantId: K(3), title: 'Configured 3' }),
    bundleLine({ key: `${K(4)}:${H(4)}`, variantId: K(4), title: 'Configured 4' }),
    bundleLine({ key: `${K(5)}:${H(5)}`, variantId: K(5), title: 'Configured 5' }),
  ],
};

// The same cart with BOTH same-variant lines removed. This is the cart a
// prefix/variant-id comparison would effectively be predicting against, and it
// is here so that under-counting can be measured rather than asserted.
export const SAME_VARIANT_BOTH_REMOVED = {
  item_count: 3,
  items: SAME_VARIANT_TWO_CONFIGS.items.slice(2),
};

// A cart small enough that the same configuration is allowed. Used for the
// retry-after-rejection case: reject once, cart shrinks, submit again.
export const ONE_BUNDLE_LINE = {
  item_count: 1,
  items: [bundleLine({ key: `${K(1)}:${H(1)}`, variantId: K(1), title: 'Configured 1' })],
};

export const EMPTY_CART = { item_count: 0, items: [] };

export const CARTS = {
  'five-bundle-lines': FIVE_BUNDLE_LINES,
  'one-bundle-forty-ordinary': ONE_BUNDLE_FORTY_ORDINARY,
  'same-variant-two-configs': SAME_VARIANT_TWO_CONFIGS,
  'same-variant-both-removed': SAME_VARIANT_BOTH_REMOVED,
  'one-bundle-line': ONE_BUNDLE_LINE,
  'empty-cart': EMPTY_CART,
};

// Keys the scenarios refer to by name, so the driver never retypes one.
export const KEYS = {
  thirdOfFive: `${K(3)}:${H(3)}`,
  sameVariantA: `${K(7)}:${H('a')}`,
  sameVariantB: `${K(7)}:${H('b')}`,
  sharedVariantId: K(7),
};
