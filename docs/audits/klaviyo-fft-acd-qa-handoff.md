# Handoff — FFT-ACD Klaviyo catalog QA (Yusra)

Read `klaviyo-fft-acd-independent-qa-2026-08-27.md` in this directory first. That is the
deliverable. This file exists only so a fresh session can resume without re-deriving anything.

## State as of 2026-08-27

- **Verdict issued:** HOLD overall. 1 of 6 areas PASS (current Shopify source).
- **QA record:** `docs/audits/klaviyo-fft-acd-independent-qa-2026-08-27.md`, PR #759.
- **Email reply:** saved as a **Gmail draft** on thread `1a031c5666c32948`
  (draft message id `1a043c7e8bc2e2f3`). To Tim, reply-all. **Not sent.**
- **Prior session:** branch `claude/klaviyo-catalog-audit-fft-acd-qqqmu6` holds
  `klaviyo-fft-acd-shopify-source-facts-2026-08-25.md`. Its Shopify facts were re-verified and
  still hold, except product `updatedAt` has since moved to `2026-08-26T14:29:41Z`.

## Two things blocking a fuller answer

1. **Klaviyo reads.** The connector is authorized and working — `get_sending_domains` returns live
   account data (`send.fitnesssuperstore.com`, active, marketing) and `ListConnectors` shows it
   connected with `enabledInChat: true`. But this session's tool list contains **no** read endpoint
   for catalog items, catalog variants, flows, campaigns, templates, segments, lists or tags.
   `select:`-style lookups (which bypass keyword search) return no match, so they are genuinely
   absent rather than undiscoverable.

   MCP tool lists are fetched once at session start, so a permissions change made mid-session
   cannot appear. **A fresh session is required to test whether reads are now available.**
   If a fresh session still lacks them, Klaviyo's MCP server does not ship those tools and the
   fallback is a read-only private API key **plus** allowlisting `a.klaviyo.com` in the
   environment's network policy (currently blocked — verified 403 at CONNECT).

2. **Storefront HTTP.** `www.fitnesssuperstore.com` is blocked by the environment's network egress
   policy. Verified as policy, not origin: the same block hit the known-good live Shopify PDP.

## If reads become available, these convert HOLD → verified

In priority order:

1. Read `$custom:::$default:::FFT-ACD` item **and** variant — url, image_full_url, price,
   inventory_quantity, inventory_policy, published, custom_metadata, both timestamps. Converts
   Tim's readback from *reported* to *independently verified*, which is the actual assignment.
2. **Tim's question 3, still unanswered by anyone:** filter catalog items by integration type to
   establish whether a Shopify-native Klaviyo catalog exists and whether FFT-ACD is duplicated
   across catalogs. The native Klaviyo Shopify app embed is live in the theme, so expect yes.
3. Count published items in `$custom:::$default` — verifies or refutes "more than 100 published
   legacy-style items."
4. Enumerate flows with status — independently confirm `StKF69` (SE - Browse Abandonment) and
   `QSzrkW` (SE - Added to Cart) are Draft, and that no BA/ATC flow is live.
5. Enumerate campaigns with status — confirm nothing scheduled, preparing, sending or adding
   recipients.
6. Search template content for `vspfiles`, `FFT-ACD`, and the legacy `.htm` URL.

## What read access will NEVER close

**Klaviyo product feeds are not in the public API.** The `klaviyo.com/product-feeds/<id>/edit`
objects, their In Use state, their selected catalog source, and the "DO NOT USE" tags are UI-only.

So QA item 2 — six feed identities, numeric IDs, statuses and tag screenshots — stays with Joshua
and Haroon regardless of what access is granted here. Do not let an access grant become the reason
that deadline slides.

Likewise the two legacy-URL captures need either the domain allowlisted or ten seconds in a browser:

- `https://www.fitnesssuperstore.com/French-Fitness-Tahoe-Assisted-Chin-Dip-New-p/FFT-ACD.htm`
  (mixed case exactly as stored in Klaviyo — case sensitivity is itself the open question)
- `https://www.fitnesssuperstore.com/v/vspfiles/photos/FFT-ACD-2.jpg`

## Standing constraints

Read-only. No Klaviyo, Shopify, feed, catalog, GitHub, app, flow, campaign, template, media or
automation change. No send, schedule or publication. One SKU. No customer data, sales values,
margins or credentials. Separate from the Top 100 Meta creative quote.

Note for whoever holds connector admin: this session was issued Klaviyo catalog **write** tools
(bulk create / update / delete items and variants, single-item delete) on an audit where no
mutation is approved. None were used. The right correction is to remove the write access, not
only to add the reads.
