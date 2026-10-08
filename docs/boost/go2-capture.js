/* GO 2 capture — paste into the DevTools console on any www.fitnesssuperstore.com page.
 * Reads Boost's own search API (the one the storefront grid uses) for the 16 tracked
 * queries plus the 3 control queries, and copies a JSON record to the clipboard.
 *
 * Run it three times: PRE-TOGGLE-ON, POST-TOGGLE-OFF, POST-REVERT-ON.
 * Use a logged-out Incognito window on a US connection, no filters, relevance sort.
 *
 * NOTE: this has not been executed from the agent environment, because
 * services.mybcapps.com is blocked there by network policy. If it errors, see the
 * manual fallback in GO2_Runbook_2026-10-08.md section 3.
 */
(async () => {
  const SHOP = '79ef8b-5e.myshopify.com';
  const TRACKED = [
    'bowflex',
    'boflex',
    'cybex treadmill',
    'French Fitness Rubber Coated Hex Dumbbells',
    'rubber hex dumbbell',
    'French Fitness FFS Silver Dual Adjustable Pulley',
    'French Fitness Dual Adjustable Pulley',
    'turf',
    'French Fitness V3 Premium Gym Turf Roll',
    'cold plunge',
    'sauna',
    'smith machine',
    'half squat rack',
    'olympic plate',
    'french fitness',
    'fsr100',
  ];
  const CONTROLS = ['45 kettlebell', 'bumper plate 45-pound', 'assault bike'];

  const label = prompt('Label for this capture (PRE-TOGGLE-ON / POST-TOGGLE-OFF / POST-REVERT-ON)') || 'capture';
  const rows = [];

  for (const q of TRACKED.concat(CONTROLS)) {
    const url = 'https://services.mybcapps.com/bc-sf-filter/search'
      + '?shop=' + SHOP
      + '&q=' + encodeURIComponent(q)
      + '&limit=10&page=1&sort=relevance&event_type=search';
    let total = null, top10 = [], error = null;
    try {
      const res = await fetch(url, { credentials: 'omit' });
      const j = await res.json();
      total = (j.total_product != null) ? j.total_product : (j.total != null ? j.total : null);
      top10 = (j.products || []).slice(0, 10).map(p => p.title);
    } catch (e) {
      error = String(e);
    }
    rows.push({ query: q, control: CONTROLS.indexOf(q) !== -1, total, top10, error });
    console.log(q.padEnd(50), 'total=' + total, error ? ('ERROR ' + error) : '');
    top10.forEach((t, i) => console.log('   ' + String(i + 1).padStart(2) + '. ' + t));
    await new Promise(r => setTimeout(r, 800));
  }

  const out = { label, captured_utc: new Date().toISOString(), shop: SHOP, rows };
  const text = JSON.stringify(out, null, 1);
  console.log(text);
  try { copy(text); console.log('>>> Copied to clipboard. Paste it into a file named ' + label + '.json'); }
  catch (e) { console.log('>>> Clipboard copy unavailable. Copy the JSON printed above by hand.'); }
})();
