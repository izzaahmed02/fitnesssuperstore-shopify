// Item C — the theme-side UX guard.
//
// Predicts whether adding this configuration would push the cart past the safe
// `lineExpand` output budget, and if so shows the approved message and routes to
// Sales instead of adding a cart that the server would block at checkout.
//
// THIS IS NOT A CONTROL. It runs in the browser and can be bypassed by a direct
// POST /cart/add or /cart/update. The server-side validation function is
// authoritative and blocks the same cart with the same message. This exists so
// the customer finds out on the product page rather than at checkout.
//
// Constants and copy come from window.FSBundleEstimator, generated from
// fs-bundle-api/scripts/estimator-spec.json. If that asset is missing the guard
// declines to predict rather than guessing — a wrong prediction here would
// either block a legitimate cart or wave through one the server will refuse.

(function () {
  const K = () => window.FSBundleEstimator;
  const FNS = () => window.FSBundleEstimatorFns;

  // Real cart line IDs are UUID-based and dominate the byte estimate. Predicting
  // with a short placeholder is how a cart measures as fitting locally and then
  // fails in the real runtime, so assume the real length.
  const ASSUMED_CART_LINE_ID_LEN = 59;
  const ASSUMED_VARIANT_ID_LEN = 43;

  function syntheticOperation(paidOptionCount, parentAttributeCount) {
    const attributes = Array.from({ length: parentAttributeCount }, (_, i) => ({
      key: 'k'.repeat(12),
      value: 'v'.repeat(40),
    }));
    return {
      cartLineId: 'x'.repeat(ASSUMED_CART_LINE_ID_LEN),
      expandedCartItems: [
        { merchandiseId: 'x'.repeat(ASSUMED_VARIANT_ID_LEN), attributes },
        ...Array.from({ length: paidOptionCount }, () => ({
          merchandiseId: 'x'.repeat(ASSUMED_VARIANT_ID_LEN),
          attributes: [],
        })),
      ],
    };
  }

  // Counts paid options on an existing cart line from its surviving properties.
  function paidOptionsOnLine(line) {
    const raw = (line.properties || {})._functionOperation;
    if (!raw) return 0;
    try {
      const entries = typeof raw === 'string' ? JSON.parse(raw.replace(/=>/g, ':')) : raw;
      if (!Array.isArray(entries)) return 0;
      return entries.filter((e) => Number(e && e.priceAdjustment) > 0).length;
    } catch {
      return 0;
    }
  }

  function publicPropertyCount(line) {
    const props = line.properties || {};
    return Object.keys(props).filter((k) => !k.startsWith('_')).length;
  }

  // Returns { predicted, budget, willExceed } or null when it cannot predict.
  async function predict(newPaidOptionCount, newPublicPropertyCount) {
    const k = K();
    const fns = FNS();
    if (!k || !fns) return null;

    let cart;
    try {
      const res = await fetch(`${window.Shopify.routes.root}cart.js`, { headers: { Accept: 'application/json' } });
      if (!res.ok) return null;
      cart = await res.json();
    } catch {
      return null;
    }

    const ops = (cart.items || []).map((line) =>
      syntheticOperation(paidOptionsOnLine(line), publicPropertyCount(line)),
    );
    ops.push(syntheticOperation(newPaidOptionCount, newPublicPropertyCount));

    const predicted = fns.estimateBytes(ops);
    return { predicted, budget: k.OUTPUT_BYTE_BUDGET, willExceed: predicted > k.OUTPUT_BYTE_BUDGET };
  }

  // Renders the approved message and the Contact Sales route into `container`.
  // Copy and destination come from the generated constants — never retyped here.
  function render(container) {
    const k = K();
    if (!k || !container) return null;
    container.querySelectorAll('[data-fs-bundle-guard]').forEach((n) => n.remove());

    const wrap = document.createElement('div');
    wrap.setAttribute('data-fs-bundle-guard', '');
    wrap.setAttribute('role', 'alert');
    wrap.className = 'fs-bundle-guard';

    const msg = document.createElement('p');
    msg.className = 'fs-bundle-guard__message';
    msg.textContent = k.BLOCK_MESSAGE;

    const link = document.createElement('a');
    link.className = 'fs-bundle-guard__cta button';
    link.href = k.CONTACT_SALES_URL;
    link.textContent = k.CONTACT_SALES_LABEL;

    wrap.append(msg, link);
    container.prepend(wrap);
    return wrap;
  }

  window.FSBundleGuard = { predict, render };
})();
