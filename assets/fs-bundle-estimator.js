// Item C — the theme-side output-size estimator.
//
// Mirrors extensions/product-bundle/src/estimator.rs exactly. The two cannot
// share code (Rust vs browser JS), which is why the CONSTANTS are generated from
// one spec and why `tests/estimator-drift.test.mjs` runs the shared golden
// vectors through this implementation and fails on any disagreement.
//
// This is customer UX only. It warns before the cart crosses the budget; it is
// NOT a control. The server-side validation function is authoritative and cannot
// be bypassed by a direct POST /cart/add, which this can.

(function () {
  const K = (typeof window !== 'undefined' && window.FSBundleEstimator) || globalThis.FSBundleEstimator;

  // Bytes one lineExpand operation is predicted to serialise to.
  //
  // Measures the actual ID strings rather than assuming a length: cart line IDs
  // and variant GIDs dominate the output, and real UUID-based cart line IDs are
  // 59 chars where synthetic test ones are 24. That difference is exactly how a
  // cart that measured as fitting locally still failed in the real runtime.
  function estimateOne(op) {
    const items = op.expandedCartItems.reduce((sum, item) => {
      const attrs = (item.attributes || []).reduce(
        (a, x) => a + x.key.length + x.value.length + K.PER_ATTRIBUTE_OVERHEAD,
        0,
      );
      return sum + item.merchandiseId.length + K.PER_ITEM_OVERHEAD + attrs;
    }, 0);
    return op.cartLineId.length + K.PER_OPERATION_OVERHEAD + items;
  }

  function estimateBytes(ops) {
    return ops.reduce((sum, op) => sum + estimateOne(op), 0);
  }

  function fitsBudget(ops) {
    return estimateBytes(ops) <= K.OUTPUT_BYTE_BUDGET;
  }

  const api = { estimateOne, estimateBytes, fitsBudget };
  if (typeof window !== 'undefined') window.FSBundleEstimatorFns = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})();
