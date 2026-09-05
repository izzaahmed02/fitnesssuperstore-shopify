/*
 * Build Your Own Rig (BYOR) — source data.
 *
 * Product roster, step option lists and quantity rules are transcribed from the
 * BYOR logic sheet maintained by Product (Larianne), plus the v8 direction:
 * standard layout cards first, guided configurator second, quote gates on
 * anything Product has not validated for self-serve checkout.
 *
 * Nothing here carries a price, stock level or lead time. Every one of those
 * comes from live Shopify product data at runtime — see byor-configurator.js.
 */
window.BYOR = window.BYOR || {};

window.BYOR.data = (function () {
  /* ---------------------------------------------------------------------
   * Roster: SKU -> storefront handle.
   * A SKU that cannot be resolved against live product data (hidden,
   * unpublished, archived) is automatically treated as quote-only.
   * ------------------------------------------------------------------- */
  var roster = {
    // Uprights (Step 2)
    'FF-RR-U-72': 'french-fitness-72-rack-rig-upright-new',
    'FF-RR-U-84': 'french-fitness-84-rack-rig-upright-7-new',
    'FF-RR-U-91': 'french-fitness-91-rack-rig-upright-new',
    'FF-RR-U-108': 'french-fitness-108-rack-rig-upright-new',
    'FF-RR-U-120': 'french-fitness-120-rack-rig-upright-new',
    'FF-RR-U-130': 'french-fitness-130-rack-rig-upright-new',
    'FF-RR-U-142': 'french-fitness-142-rack-rig-upright-new',

    // Depth bars / junction bars (Step 5)
    'FF-RR-JB-43-V2PU': 'french-fitness-rack-rig-junction-bar-43-pull-up-bar-v2-new',
    'FF-RR-JB-71-V2PU': 'french-fitness-rack-rig-junction-bar-71-pull-up-bar-v2-new',
    'FF-RR-JBS-43-V1-CM': 'french-fitness-43-rack-rig-junction-bar-crossmember-v1-new',
    'FF-RR-JBS-71-V1-CM': 'french-fitness-71-rack-rig-junction-bar-crossmember-v1-new',
    'FF-RR-PB-43': 'french-fitness-43-rack-rig-pull-up-bar-new',
    'FF-RR-PB-71': 'french-fitness-71-rack-rig-pull-up-bar-new',

    // Spacing crossmembers (Step 4 / Step 7 auto-fit)
    'FF-RR-JBS-96-CM': 'french-fitness-rack-rig-96-junction-bar-crossmember-new',
    'FF-RR-JBS-20-CM': 'french-fitness-rack-rig-20-junction-bar-crossmember-new',

    // Width bars (Steps 6, 7, 8)
    'FF-RR-DPB-43': 'french-fitness-43-rack-rig-double-pull-up-bar-new',
    'FF-RR-DPB-71': 'french-fitness-71-rack-rig-double-pull-up-bar-new',
    'FF-RR-DSBA-43': 'french-fitness-43-rack-rig-dirty-south-bar-attachment-new',
    'FF-RR-DSBA-71': 'french-fitness-71-rack-rig-dirty-south-bar-attachment-new',
    'FF-RR-JB-UCB': 'french-fitness-rack-rig-junction-bar-crossmember-w-chin-up-bar-new',
    'FF-RR-JBS-MCG': 'french-fitness-rack-rig-junction-bar-crossmember-w-2-cannonball-grips-new',
    'FF-RR-FPBA': 'french-fitness-rack-rig-fly-pull-up-bar-attachment-new',
    'FF-RR-JBS-43-NCM': 'french-fitness-rack-rig-43-junction-bar-nameplate-crossmember-new',
    'FF-RR-JBS-71-NCM': 'french-fitness-rack-rig-71-junction-bar-nameplate-crossmember-new',
    'FF-RR-MSGPUB': 'french-fitness-rack-rig-multi-sphere-ball-grip-pull-up-bar-new',
    'FF-RR-MGPUB': 'french-fitness-rack-rig-multi-grip-pull-up-bar-new',
    'FF-RR-MBA': 'french-fitness-rack-rig-monkey-bar-attachment-new',

    // Angled junction bars — Product has these flagged "can't use yet",
    // they need varied upright heights. Quote path only.
    'FF-RR-AJB-43': 'french-fitness-43-rack-rig-angled-junction-bar-new',
    'FF-RR-AJB-71': 'french-fitness-71-rack-rig-angled-junction-bar-new',

    // J-hooks and spotter arms (Step 9)
    'FF-RR-JC': 'french-fitness-rack-rig-j-cups-j-hooks-attachment-pair-new',
    'FF-RR-PJC': 'french-fitness-rack-rig-premium-j-cups-j-hooks-attachment-pair-new',
    'FF-RR-SA-V2HD': 'french-fitness-rack-rig-v2-hd-spotter-arms-attachment-pair-new',
    'FF-RR-SAA': 'french-fitness-rack-rig-spotter-arms-attachment-pair-new',

    // Storage tiers / trays (Step 10)
    'FF-RR-BPR-43': 'french-fitness-43-rack-rig-bumper-plate-tier-tray-attachment-new',
    'FF-RR-BR-43': 'french-fitness-43-rack-rig-ball-tier-tray-attachment-new',
    'FF-RR-DBR-43-V2': 'french-fitness-43-rack-rig-v2-dumbbell-tier-tray-attachment-new',
    'FF-RR-KBR-43': 'french-fitness-43-rack-rig-kettlebell-tier-tray-attachment-new',
    'FF-RR-BPR-71': 'french-fitness-71-rack-rig-bumper-plate-tier-tray-attachment-new',
    'FF-RR-BR-71': 'french-fitness-71-rack-rig-ball-tier-tray-attachment-new',
    'FF-RR-DBR-71-V2': 'french-fitness-71-rack-rig-v2-dumbbell-tier-tray-attachment-new',
    'FF-RR-KBR-71': 'french-fitness-71-rack-rig-kettlebell-tier-tray-attachment-new',

    // Other attachments (Step 11)
    'FF-RR-SBHA': 'french-fitness-rack-rig-single-ball-holder-attachment-new',
    'FF-RR-BP': 'french-fitness-rack-rig-band-pegs-set-of-4-new',
    'FF-RR-BHA': 'french-fitness-rack-rig-bar-holder-attachment-new',
    'FF-RR-MDVBH': 'french-fitness-rack-rig-mounted-dual-vertical-bar-holder-new',
    'FF-RR-RMCC': 'french-fitness-rack-rig-rack-mounted-cable-column-new',
    'FF-RR-RMCC-LSFR': 'french-fitness-rack-rig-rack-mounted-cable-column-w-lat-seat-and-row-attachment-new',
    'FF-PLPPCTS': 'french-fitness-plate-loaded-pulldown-portable-cable-trainer-slinger-new',
    'FF-RR-LPLW': 'french-fitness-rig-rack-lat-pulldown-low-row-w-stabilizer-bar-new',
    'FF-RR-MCG': 'french-fitness-rack-rig-mounted-cannonball-grip-new',
    'FF-RR-UCB': 'french-fitness-rack-rig-universal-chin-up-bar-new',
    'FF-RR-DHA': 'french-fitness-rack-rig-dip-horn-attachment-new',
    'FF-RR-GHD': 'french-fitness-rack-rig-glute-ham-attachment-new',
    'FF-RR-GHDR': 'french-fitness-rack-rig-glute-ham-developer-ghd-rollers-new',
    'FF-RR-AH': 'french-fitness-rack-rig-11-gauge-a-hanger-attachment-new',
    'FF-HPB100': 'french-fitness-47-heavy-punching-bag-100-lb-new',
    'FF-RR-RMUA-26MM': 'french-fitness-rack-rig-ring-muscle-up-arm-attachment-26mm-new',
    'FF-GWR20': 'french-fitness-gymnastic-gym-wood-rings-w-adjustable-straps-new',
    'FF-RR-JAA': 'french-fitness-rack-rig-jammer-arms-attachment-new',
    'FF-RR-LA': 'french-fitness-rack-rig-landmine-attachment-new',
    'FF-RR-LRA': 'french-fitness-rack-rig-leg-roller-attachment-new',
    'FF-RR-LRA-V2': 'french-fitness-rack-rig-leg-roller-attachment-v2-new',
    'FF-RR-CBG-S2': 'french-fitness-rack-rig-cannonball-grips-with-straps-set-of-2-new',
    'FF-RR-LBG': 'french-fitness-rack-rig-light-bulb-grip-new',
    'FF-RR-PBG': 'french-fitness-rack-rig-pipe-bomb-grip-new',
    'FF-RR-PBH': 'french-fitness-rack-rig-power-band-holder-new',
    'FF-RR-SPA': 'french-fitness-rack-rig-step-up-platform-attachment-new',
    'FF-RR-UAA': 'french-fitness-rack-rig-universal-anchor-attachment-new',
    'FF-RR-WBTA-V2': 'french-fitness-rack-rig-v2-wall-ball-target-attachment-new',
    'FF-RR-DWBT-V2': 'french-fitness-rack-rig-v2-double-wall-ball-target-attachment-new',
    'FF-RR-WCH': 'french-fitness-rack-rig-weight-chain-hanger-new',
    'FF-RR-OWPH': 'french-fitness-rack-rig-olympic-weight-plate-holder-new',
    'FF-RR-WSHA': 'french-fitness-rack-rig-14-weight-storage-horn-attachment-new',
    'FF-RR-BRA': 'french-fitness-rack-rig-battle-rope-anchor-new',
    'FF-RR-FRRA': 'french-fitness-rack-rig-foot-rest-row-attachment-new',
    'FF-RR-HTBA': 'french-fitness-rack-rig-hip-thruster-bench-attachment-new',
    'FF-RR-SRP': 'french-fitness-rack-rig-seal-row-pad-attachment-new',
    'FF-RR-UHA': 'french-fitness-rack-rig-utility-hook-attachment-for-storage-new',
    'FF-RR-USA': 'french-fitness-rack-rig-utility-seat-attachment-new',
    'FF-RR-WCA': 'french-fitness-rack-rig-webbed-safety-catchers-set-of-2-new'
  };

  /* Collections crawled once to resolve the roster against live product data. */
  var sourceCollections = [
    'french-fitness-rig-frame-pieces-customize-your-rig',
    'rack-rig-attachments'
  ];

  /* Uprights are ordered and sold in pairs. */
  var uprightHeights = [
    { height: 72, sku: 'FF-RR-U-72' },
    { height: 84, sku: 'FF-RR-U-84' },
    { height: 91, sku: 'FF-RR-U-91' },
    { height: 108, sku: 'FF-RR-U-108' },
    { height: 120, sku: 'FF-RR-U-120' },
    { height: 130, sku: 'FF-RR-U-130' },
    { height: 142, sku: 'FF-RR-U-142' }
  ];

  /* Width bar options. `crossmemberOnly` items physically need a crossmember
   * top in Step 5 before they can attach. */
  var widthBars = {
    43: [
      { sku: 'FF-RR-PB-43' },
      { sku: 'FF-RR-JBS-43-V1-CM' },
      { sku: 'FF-RR-DPB-43' },
      { sku: 'FF-RR-DSBA-43' },
      { sku: 'FF-RR-JB-UCB' },
      { sku: 'FF-RR-JBS-MCG' },
      { sku: 'FF-RR-FPBA' },
      { sku: 'FF-RR-JBS-43-NCM' },
      { sku: 'FF-RR-MSGPUB', crossmemberOnly: true },
      { sku: 'FF-RR-MGPUB', crossmemberOnly: true }
    ],
    71: [
      { sku: 'FF-RR-PB-71' },
      { sku: 'FF-RR-JBS-71-V1-CM' },
      { sku: 'FF-RR-DPB-71' },
      { sku: 'FF-RR-DSBA-71' },
      { sku: 'FF-RR-JB-UCB' },
      { sku: 'FF-RR-JBS-MCG' },
      { sku: 'FF-RR-JBS-71-NCM' },
      { sku: 'FF-RR-MBA', crossmemberOnly: true }
    ]
  };

  /* Spacings that are not a bar choice — the crossmember is fixed by size. */
  var fixedSpacingCrossmember = {
    20: 'FF-RR-JBS-20-CM',
    96: 'FF-RR-JBS-96-CM'
  };

  var jHooksAndSpotters = {
    jhooks: ['FF-RR-JC', 'FF-RR-PJC'],
    spotters: ['FF-RR-SA-V2HD', 'FF-RR-SAA']
  };

  var storageTiers = {
    43: ['FF-RR-BPR-43', 'FF-RR-BR-43', 'FF-RR-DBR-43-V2', 'FF-RR-KBR-43'],
    71: ['FF-RR-BPR-71', 'FF-RR-BR-71', 'FF-RR-DBR-71-V2', 'FF-RR-KBR-71']
  };

  /* Step 11. `quoteOnly` items always route the build to quote review —
   * cable, lat and low-row integrations are on Tim's quote-gate list. */
  var otherAttachments = [
    { sku: 'FF-RR-SBHA' },
    { sku: 'FF-RR-BP' },
    { sku: 'FF-RR-BHA' },
    { sku: 'FF-RR-MDVBH' },
    { sku: 'FF-RR-RMCC', quoteOnly: true },
    { sku: 'FF-RR-RMCC-LSFR', quoteOnly: true },
    { sku: 'FF-PLPPCTS', quoteOnly: true },
    { sku: 'FF-RR-LPLW', quoteOnly: true },
    { sku: 'FF-RR-MCG' },
    { sku: 'FF-RR-UCB' },
    { sku: 'FF-RR-DHA' },
    { sku: 'FF-RR-GHD' },
    { sku: 'FF-RR-GHDR' },
    { sku: 'FF-RR-AH' },
    { sku: 'FF-HPB100' },
    { sku: 'FF-RR-RMUA-26MM' },
    { sku: 'FF-GWR20' },
    { sku: 'FF-RR-JAA' },
    { sku: 'FF-RR-LA' },
    { sku: 'FF-RR-LRA' },
    { sku: 'FF-RR-LRA-V2' },
    { sku: 'FF-RR-CBG-S2' },
    { sku: 'FF-RR-LBG' },
    { sku: 'FF-RR-PBG' },
    { sku: 'FF-RR-PBH' },
    { sku: 'FF-RR-SPA' },
    { sku: 'FF-RR-UAA' },
    { sku: 'FF-RR-WBTA-V2' },
    { sku: 'FF-RR-DWBT-V2' },
    { sku: 'FF-RR-WCH' },
    { sku: 'FF-RR-OWPH' },
    { sku: 'FF-RR-WSHA' },
    { sku: 'FF-RR-BRA' },
    { sku: 'FF-RR-FRRA' },
    { sku: 'FF-RR-HTBA' },
    { sku: 'FF-RR-SRP' },
    { sku: 'FF-RR-UHA' },
    { sku: 'FF-RR-USA' },
    { sku: 'FF-RR-WCA' }
  ];

  /* Standard layout cards. Customer-facing minimum is 1 Section / Starter Bay —
   * no 0.5-section label is ever shown. `preset` seeds the configurator. */
  var layouts = [
    {
      id: 'compact-wall',
      name: 'Compact Wall / Studio Rig',
      summary: 'Wall mounted, one section. Smallest footprint we build.',
      bestFor: 'Studios and garages where floor space is tight.',
      preset: { mounting: 'wall', uprights: { 108: 1 }, depth: 43, spacing: null, topStyle: 'basic' }
    },
    {
      id: 'starter-bay',
      name: '1-Section Starter Bay',
      summary: 'Free standing, one section, 43" depth.',
      bestFor: 'A first rig you can extend later.',
      preset: { mounting: 'floor', uprights: { 108: 2 }, depth: 43, spacing: null, topStyle: 'basic' }
    },
    {
      id: 'expansion-1-5',
      name: '1.5-Section Expansion Layout',
      summary: 'One starter bay plus a connecting expansion bay.',
      bestFor: 'Adding a second training station without a full second bay.',
      preset: { mounting: 'floor', uprights: { 108: 3 }, depth: 43, spacing: 43, topStyle: 'basic' }
    },
    {
      id: 'training-2',
      name: '2-Section Training Rig',
      summary: 'Two full sections with a 43" span between them.',
      bestFor: 'Two lifters training at once.',
      preset: { mounting: 'floor', uprights: { 108: 4 }, depth: 43, spacing: 43, topStyle: 'basic' }
    },
    {
      id: 'extended-2-5',
      name: '2.5-Section Extended Rig',
      summary: 'Two sections plus an extension bay.',
      bestFor: 'Two stations plus a storage or accessory bay.',
      preset: { mounting: 'floor', uprights: { 108: 5 }, depth: 43, spacing: 71, topStyle: 'basic' }
    },
    {
      id: 'functional-3',
      name: '3-Section Functional Rig',
      summary: 'Three sections, 71" spans for storage between bays.',
      bestFor: 'Small group training.',
      preset: { mounting: 'floor', uprights: { 108: 6 }, depth: 43, spacing: 71, topStyle: 'basic' }
    },
    {
      id: 'commercial-4',
      name: '4-Section Commercial Rig',
      summary: 'Four sections. Reviewed by our team before it ships.',
      bestFor: 'Commercial floors and training facilities.',
      quoteOnly: true,
      quoteReason: '4 or more sections',
      preset: { mounting: 'floor', uprights: { 108: 8 }, depth: 43, spacing: 71, topStyle: 'basic' }
    },
    {
      id: 'multi-station',
      name: 'Large Multi-Station Rig',
      summary: 'Five sections and up, mixed stations. Quote review.',
      bestFor: 'Full facility builds.',
      quoteOnly: true,
      quoteReason: 'Large multi-station build',
      preset: { mounting: 'floor', uprights: { 108: 10 }, depth: 71, spacing: 71, topStyle: 'basic' }
    },
    {
      id: 'ninja',
      name: 'Ninja / Performance Rig',
      summary: 'Monkey bar top across the rig with crossmember width bars.',
      bestFor: 'Obstacle, ninja and performance training.',
      preset: { mounting: 'floor', uprights: { 108: 4 }, depth: 43, spacing: 43, topStyle: 'monkey' }
    },
    {
      id: 'custom',
      name: 'Custom Configuration',
      summary: 'Start from a blank build and choose every piece yourself.',
      bestFor: 'Anything that does not match a standard layout.',
      preset: null
    }
  ];

  return {
    roster: roster,
    sourceCollections: sourceCollections,
    uprightHeights: uprightHeights,
    depths: [43, 71],
    spacings: [43, 71, 96, 20],
    widthBars: widthBars,
    fixedSpacingCrossmember: fixedSpacingCrossmember,
    jHooksAndSpotters: jHooksAndSpotters,
    storageTiers: storageTiers,
    otherAttachments: otherAttachments,
    layouts: layouts
  };
})();
