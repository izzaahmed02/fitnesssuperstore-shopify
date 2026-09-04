# Independent QA readback — French Fitness Klaviyo + Shopify segmentation

**Owner of this readback:** Yusra (independent QA lane)
**Assignment:** Next Action #5 of Tim's 2026-09-03 decision — "independently verify seeded
B2C/B2B/B2G inclusion and exclusion, with region kept separate, plus purchase, checkout,
re-entry, rendered-output, and rollback proof."
**Date of live read:** 2026-09-04
**Verdict:** **HOLD.** Two blocking defects, one of them outside the currently assigned
correction scope. Four sub-gates PASS.

Read-only throughout. No flow was activated or edited, no template was edited, no profile or
event was created, no Shopify object was mutated, no send was triggered, and the
`fs-bundle-api` Sales_Conversation branch was not touched.

## Source of record

| Item | Value |
| --- | --- |
| Klaviyo account | Fitness Superstore, public key `TzT9tw`, `test_account: false`, timezone `US/Pacific` |
| Method | Klaviyo read API (flows, flow definitions, templates, profiles, metric aggregates) + Shopify Admin GraphQL (read-only) |

Canonical thread remains the Gmail thread "French Fitness Klaviyo + Shopify segmentation
scope." This file is supporting detail for the reply in that thread. It is **not** a new
tracker and does **not** replace the QA Master Sheet.

## 1. Flow status gate — PASS

| Flow | Name | Status | Archived | Last updated |
| --- | --- | --- | --- | --- |
| StKF69 | SE - Browse Abandonment | `draft` | false | 2026-07-27 |
| QSzrkW | SE - Added to Cart | `draft` | false | 2026-07-23 |
| Yk6pEb | Added to Cart Reminder | `draft` | false | 2026-05-08 |
| XJBGua | Abandoned Cart Reminder | `manual` | false | 2026-08-27 |

All four match the required state. No flow is live.

## 2. Buyer-type exclusion — HOLD (blocking, mechanism proven)

### 2.1 The live condition

Identical in both StKF69 and QSzrkW:

```json
{ "type": "profile-property",
  "property": "properties['Shopify Tags']",
  "filter": { "type": "string", "operator": "not-contains", "value": "[\"B2B\"]" } }
```

```json
{ "type": "profile-property",
  "property": "properties['Shopify Tags']",
  "filter": { "type": "string", "operator": "not-contains", "value": "[\"B2G\"]" } }
```

Tim's July request to standardise the B2B comparison between Browse and Added to Cart **has
been done** — the two flows now use the identical condition. They are standardised on an
incorrect comparison.

### 2.2 Why it fails

`Shopify Tags` is stored in Klaviyo as a **list**, not a string. Verified across the 100
most-recently-updated profiles: 90 carry the property and **all 90 are of type `list`**
(observed values include `["Login with Shop", "Shop"]` and `[]`).

The condition applies a **string** operator against the 7-character literal `["B2B"]`. Because
that literal carries both the opening `["` and the closing `"]`, it can only ever match a
serialisation in which `B2B` is simultaneously the first element and the only element. A second
tag breaks the required adjacency on one side or the other:

| Actual tag list | Contains the literal `["B2B"]`? | Excluded? |
| --- | --- | --- |
| `["B2B"]` | possibly — depends on evaluation mode | maybe |
| `["B2B", "sc-pilot"]` | no — `,` breaks `"B2B"]` | **no — leaks in** |
| `["sc-pilot", "B2B"]` | no — `,` breaks `["B2B` | **no — leaks in** |
| `["B2B", "Login with Shop", "Shop"]` | no | **no — leaks in** |

Two evaluation modes are possible and **both fail**:

- serialise the list, then substring-match — excludes only the exactly-single-tag case;
- apply the string operator element-wise — no element `"B2B"` contains the substring
  `["B2B"]`, so **nothing is excluded at all**.

Which mode Klaviyo applies should be confirmed once on screen. The HOLD does not depend on
resolving it, because neither mode gives a reliable exclusion.

### 2.3 Live blast radius

Every existing B2B/B2G seed record carries two tags, so **none of them is excluded**:

| Seed record | `Shopify Tags` | Excluded by current filter? |
| --- | --- | --- |
| sc-pilot-01-qualified-quote | `["B2B", "sc-pilot"]` | no |
| sc-pilot-02-outbound-no-response | `["B2B", "sc-pilot"]` | no |
| sc-pilot-03-justcall-reset | `["B2B", "sc-pilot"]` | no |
| sc-pilot-04-won | `["B2B", "sc-pilot"]` | no |
| sc-pilot-05-lost | `["sc-pilot", "B2B"]` | no |
| sc-pilot-06-support-only | `["B2B", "sc-pilot"]` | no |
| sc-pilot-07-gsa-bid | `["sc-pilot", "B2G"]` | no — **public-sector GSA record** |
| sc-pilot-08-b2g-eligible | `["B2G", "sc-pilot"]` | no |
| sc-pilot-09-malformed-no-timestamp | `["B2B", "sc-pilot"]` | no |

Not confined to seed data. On the Shopify side, **21 of the 50 most-recently-updated
`tag:B2B` customers carry additional tags** — `Login with Shop`, `Shop`, `sc-pilot`,
`Wrote Judge.me email review`. Shopify `customersCount` saturates at `10000 / AT_LEAST` for
every buyer-type query, so exact populations need a proper export; the multi-tag proportion is
what matters here and it is large.

### 2.4 Root cause, and why the syntax fix is not sufficient

There is **no profile-level buyer-type property in Klaviyo at all.** The complete property-key
inventory across the 100 most-recently-updated profiles:

| Property key | Profiles (of 100) |
| --- | --- |
| `Accepts Marketing` | 90 |
| `Shopify Tags` | 90 |
| `$source` | 79 |
| `$consent` | 78 |
| `$consent_timestamp` | 78 |
| `$phone_number_region` | 48 |
| `$subscribed_to_list` | 13 |
| `$latitude`, `$longitude` | 7 |
| `$consent_method`, `$consent_form_id`, `$consent_form_version` | 2 |
| `company_id` | 1 |

No `B2B` / `B2C` / `B2G`, no buyer-type, no customer-type, no classification key. The controlled
tagging SOP's requirement of "exact customer/profile buyer values B2C, B2B, and B2G" is
therefore **not implementable today** — buyer type exists only as a Shopify tag mirrored into a
list. Fixing the comparison operator makes the exclusion work; it does not satisfy the SOP.

There is also **no B2C seed record and no B2C condition anywhere.** B2C is not positively
included; it is only whatever is left after the two exclusions, so "B2C inclusion" is currently
provable only as a negative.

### 2.5 Recommended correction (not applied — needs written approval)

1. Replace the string comparison with a list-membership condition on the exact value
   (`Shopify Tags` contains `B2B`, negated; same for `B2G`).
2. Per SOP, introduce a dedicated profile property carrying exactly one of `B2C` / `B2B` /
   `B2G`, and move the flow conditions onto it. Do not create a second taxonomy.
3. Keep region on its own dimension (see §4).

## 3. Internal-address group — reads as an allowlist, not an exclusion

Present in both flows, same six conditions, order differs:

```
   email not-contains "@fitnesssuperstore.com"
OR email equals "izza@fitnesssuperstore.com"
OR email equals "tim@fitnesssuperstore.com"
OR email equals "carlos@fitnesssuperstore.com"
OR email equals "zafraan@fitnesssuperstore.com"
OR email equals "carlos.reyes@fitnesssuperstore.com"
```

Klaviyo ANDs condition groups and ORs the conditions inside one group. This group therefore
evaluates true for *any external address* **or** *any of the five named internal addresses* —
i.e. it admits all customers plus five internal test accounts. It is an allowlist, not a
blocklist. Consequences:

- `zafraan@fitnesssuperstore.com` is **inert**, not leaky. No such mailbox exists, so the
  condition never matches. It does not admit anyone; it simply fails to allowlist Zafran.
- Correcting the spelling to `zafran@` **as instructed would add a departed team member to the
  send allowlist.** Recommend removing the entry instead of correcting it — please confirm.
- `yusra@fitnesssuperstore.com` is **not** allowlisted, so I cannot seed a test from my own
  company address; I would be filtered out before flow entry. The same applies to Larianne,
  Arvin, Iqra, Saliha, Umer, Qash and `zafran@` (correct spelling).

Please confirm the intended semantics (allowlist vs blocklist) and which addresses should be
allowlisted for seeded QA before Joshua edits this group. The AND/OR reading above is taken
from the API structure and warrants one on-screen confirmation, which I cannot take.

## 4. Region — passes trivially, but is untestable as specified

- Neither flow contains **any** region or geo condition. The only splits are
  `Brand = "French Fitness"`, `$value < 1000`, and `Categories` contains
  `Products (New) / Products - New / Products (Remanufactured) / Products - Remanufactured`.
- `location.region` is **null** on all nine seed records.
- The only region-shaped property present anywhere is `$phone_number_region`, which is
  phone-derived and is not the shipping-address region the SOP names.

So "keep region separate" is satisfied in the sense that nothing is conflated — there is no
region logic to conflate. But the packet's required `local B2C` / `local B2B` / `local B2G`
cases **cannot be executed**: there is no region dimension in these flows and no region data on
the seed records. Region source per SOP is the latest shipping address, which is not currently
mirrored to Klaviyo.

## 5. Sales_Conversation — absent from every flow, but already live on the pilot cohort

No `Sales_Conversation` condition exists in StKF69, QSzrkW, Yk6pEb or XJBGua. Confirmed.

However the properties **are already present in Klaviyo in the required shape** on the nine
pilot records — which the 2026-09-03 packet does not reflect:

| Seed record | `Sales_Conversation` | `Sales_Conversation_Last_Activity_At` | State exercised |
| --- | --- | --- | --- |
| sc-pilot-01-qualified-quote | `true` | 2026-08-25 | active, in window |
| sc-pilot-02-outbound-no-response | `false` | 2026-06-25 | inactive, stale |
| sc-pilot-03-justcall-reset | `true` | 2026-08-25 | active, in window |
| sc-pilot-04-won | `false` | 2026-08-22 | inactive, recent |
| sc-pilot-05-lost | `false` | 2026-08-18 | inactive, recent |
| sc-pilot-06-support-only | *absent* | *absent* | **missing** |
| sc-pilot-07-gsa-bid | `true` | 2026-08-20 | active, in window |
| sc-pilot-08-b2g-eligible | `false` | 2026-08-05 | inactive |
| sc-pilot-09-malformed-no-timestamp | `true` | *absent* | **malformed** |

Neither property appears on any of the 100 general profiles sampled, which is expected for a
pilot cohort.

Two consequences:

1. The 60-day expiry rule is testable **now** against real data. Evaluated at 2026-09-04 the
   cutoff is 2026-07-06: records 01, 03 and 07 are active and inside the window (suppress);
   record 02 is inactive with June 25 activity (do not suppress). The `fs-bundle-api` branch is
   needed for population-wide backfill, not to begin proving flow-level behaviour.
2. **Unresolved spec question:** record 09 is `Sales_Conversation: true` with no timestamp.
   Whether a missing timestamp fails open (send) or fails closed (suppress) is not defined
   anywhere in the thread. This needs a decision before the exclusion is built.

## 6. Purchase / checkout exits and re-entry — definition-level PASS

Flow filters, all evaluated "since flow start":

| Flow | Added to Cart = 0 | Checkout Started = 0 | Placed Order = 0 |
| --- | --- | --- | --- |
| StKF69 | yes (`W7JLvm`) | yes (`Ws8mDm`) | yes (`X59qfY`) |
| QSzrkW | correctly absent | yes (`Ws8mDm`) | yes (`X59qfY`) |
| Yk6pEb | — | yes (`Ws8mDm`) | yes (`X59qfY`) |

The incompatible "Added to Cart zero times since starting this flow" filter has been removed
from QSzrkW, which is the documented July correction. It remains in StKF69, where it is valid.

The account carries duplicate metrics from legacy platforms, so I verified the referenced IDs
are the ones actually carrying traffic rather than dead duplicates (event counts, US/Pacific):

| Metric | ID | Integration | Jun | Jul | Aug | Sep 1–4 |
| --- | --- | --- | --- | --- | --- | --- |
| Viewed Product (StKF69 trigger) | `Vj7FSt` | API | 4,364 | 4,867 | 2,620 | 146 |
| Added to Cart (QSzrkW trigger) | `W7JLvm` | Shopify | 1,060 | 1,041 | 504 | 26 |
| Added to Cart | `U7bner` | API | 0 | 0 | 0 | 0 |
| Checkout Started | `Ws8mDm` | Shopify | 2,341 | 1,922 | 2,310 | 230 |
| Placed Order | `X59qfY` | Shopify | 375 | 372 | 264 | 33 |
| Placed Order | `WuPquh` | API | 0 | 0 | 0 | 0 |

Every trigger and exit points at a live metric; the zero-volume duplicates are correctly
unreferenced. Legacy Volusion and BigCommerce order metrics also exist and are not referenced.

Re-entry: StKF69 10 days, QSzrkW 7 days, Yk6pEb 14 days plus an explicit
`profile-not-in-flow` 14-day condition. Please confirm the 10-vs-7-day difference is intended.
On cross-path duplication: StKF69's `Added to Cart = 0` filter ejects a profile from Browse once
it adds to cart, so Browse-then-Cart appears to hand off rather than duplicate. QSzrkW has no
reciprocal `Viewed Product = 0` filter, so the protection is one-directional. This is a
plausible design rather than a defect, but it is a definition-level inference and needs a
seeded run to confirm.

## 7. Rendered output / template audit — HOLD, and the assigned scope is incomplete

Next Action #3 names three templates: SarNb7, TvP9Mz, TMnaUQ. I audited the HTML source of all
eight QSzrkW high-value templates and all eight StKF69 high-value templates.

### 7.1 QSzrkW high-value

| Template | Message | Baked SAVE5 in `alt`/`title` | Footer `sales@fitnessuperstore.com` | In assigned scope? |
| --- | --- | --- | --- | --- |
| RpdYHv | E#1 HV / FF Path 1 | clean | 0 of 4 | — |
| **TuvTHp** | E#1 HV / NR Heavy Path 2 | **yes** | **4 of 4** | **no — missing** |
| **XmYrWS** | E#1 HV / FF Heavy Path 3 | **yes** | **4 of 4** | **no — missing** |
| **SbCydi** | E#1 HV / NR Heavy Path 4 | **yes** | **4 of 4** | **no — missing** |
| **XBpsKe** | E#2 HV / FF Path 1 | clean | **2 of 4** | **no — missing** |
| SarNb7 | E#2 HV / NR Heavy Path 2 | yes | 4 of 4 | yes |
| TvP9Mz | E#2 HV / FF Heavy Path 3 | yes | 4 of 4 | yes |
| TMnaUQ | E#2 HV / NR Heavy Path 4 | yes | 4 of 4 | yes |

**Six** templates carry the baked discount creative, not three. **Seven** carry the footer
typo, not three. Exact strings, present in both the `alt` and the `title` attribute of the same
image (so two edits per template):

- Email #2 set — `Use code SAVE5 to get 5% off at checkout Complete my build`
- Email #1 set — `Use code SAVE5 to get 5% off at checkout COMPLETE MY BUILD`

All six dirty templates were last updated 2026-06-03 and have not been touched since.

### 7.2 Message-level preview text is still uncorrected

Preview text lives on the flow message, not on the template, so correcting templates will not
fix it. Three high-value Email #2 preheaders still read:

> High-performance assets designed for maximum uptime and results. Review your selected gear and use code SAVE5.

on messages `WQR8kv` (Path 2), `Ye8J82` (Path 3), `XbXpLr` (Path 4).

This contradicts the 2026-09-03 packet row stating "High-value Email #2 preheaders changed, but
creative remains SAVE5." **The preheaders have not been changed.** The 2026-09-02 email had it
right. If the Friday correction covers only the three named templates, these three preheaders
will still ship carrying SAVE5.

### 7.3 The footer typo is systemic and reaches low-value

It tracks the 2026-06-03 "Added to Cart" template family rather than the high/low-value split:

| Template | Family | Footer typo | Correct |
| --- | --- | --- | --- |
| Rh3Yys — Added to Cart #1 (Low Value) | Jun 3 batch | 4 | 0 |
| X5HaAR — BA LVC #1 | May 12, updated Aug 3 | 0 | 4 |

Rh3Yys is a **low-value** template, which is approved to retain SAVE5 and would therefore be in
the first wave of any activation — carrying the wrong reply-to address. This was a spot check of
2 of 8 low-value templates. A full sweep of every template in both flows is needed; this is not
a three-template fix.

### 7.4 StKF69 high-value — PASS

All eight are clean at preheader, body copy, image `alt`/`title` and footer level: zero `SAVE5`,
zero `5% off`, and the correctly spelled `sales@fitnesssuperstore.com` four times each.

| Email #1 | Email #2 |
| --- | --- |
| QPbvM2, QTLDDw, TEd7d6, WY86X5 | XibYUc, Vhve2f, TGPmpX, VG4Zzi |

This extends the packet's "preheaders are corrected" finding down to the creative, alt-text and
footer layers.

## 8. Yk6pEb rollback reference and unique-content review

Outstanding since 2026-07-28. Delivered here from the live definition.

Profile filter is only: `Placed Order = 0` since flow start, `Checkout Started = 0` since flow
start, and `profile-not-in-flow` within 14 days. Re-entry 14 days. Entry action `106102088`.

| Step | Action ID | Type | Detail |
| --- | --- | --- | --- |
| 1 | 106102088 | time-delay | 20 minutes, profile timezone |
| 2 | 106102089 | send-email | `XH5m3y` "Abandoned Cart: Email 0" — from label **"Tim - Founder & CEO"**, subject "Have any questions?", preview "Hit reply and let me know!", template `RGLDTu` |
| 3 | 106102090 | time-delay | 4 hours |
| 4 | 106102091 | send-email | `X64iqV` "Abandoned Cart: Email 1" — from "Tim from Fitness Superstore", subject "You're this close to upgrading your gym…", template `R5KBgR` |
| 5 | 106102095 | time-delay | 2 days |
| 6 | 106102096 | send-email | `VcZaz4` "Abandoned Cart: Email 2" — subject "Let's Sweeten The Deal!", preview "Enjoy 5% off your entire cart - limited time only!", template `WZr45x` |
| 7 | 106102104 | conditional-split | SMS marketing consent subscribed |
| 8 | 106102105 | time-delay | 2 hours (consent = true branch) |
| 9 | 106102106 | send-sms | `WUMMJ9` "SMS #1" — **CART5** 5% off, RCS + SMS hierarchy |
| 10 | 106102107 | time-delay | 1 day |
| 11 | 106102108 | send-email | `SGUY6y` "Email #3" — subject "Expiring Soon: Your 5% Off Discount Code!", template `UvkRB3` |
| 12 | 106102110 | time-delay | 2 days, `delay_until_time` 10:00:00 |
| 13 | 106102111 | send-email | `RsSSRi` "Email #4" — subject "🚨[EXPIRING] 5% off your entire cart!", template `TfiLmM` |
| 14 | 106102113 | conditional-split | SMS marketing consent subscribed |
| 15 | 106102114 | time-delay | same day, `delay_until_time` 15:00:00 |
| 16 | 106102115 | send-sms | `TaFw2p` "SMS #2" — final call, **CART5**, expires tonight |

**Content unique to Yk6pEb, not reproduced in StKF69 or QSzrkW:**

1. The 20-minute founder reply-solicitation ("Abandoned Cart: Email 0", sender label
   "Tim - Founder & CEO"). No equivalent exists in either canonical flow.
2. **The entire SMS channel.** Both canonical replacements are email-only.
3. The discount-expiry urgency arc (Emails #2 → #3 → #4 plus both SMS), built on **CART5**
   rather than SAVE5. No expiry mechanic exists in the canonical flows.
4. `delay_until_time` send-window scheduling (10:00 and 15:00 profile-local) and SMS-consent
   conditional splits.
5. The `profile-not-in-flow` 14-day guard.

**Safety note:** Yk6pEb has **no B2B/B2G exclusion and no internal-address condition of any
kind.** If it were ever activated it would send CART5 discount messaging to B2B, B2G and
internal addresses. It must stay Draft. Do not archive or delete without written approval.

A byte-exact archival export still needs a Klaviyo UI export or an API-key pull; the read API
exposes no flow-export endpoint. The inventory above is complete for rollback and
unique-content purposes.

## 9. Seeded test matrix — defined, not executed

### 9.1 Why it cannot be executed yet

**A Draft flow does not enqueue anyone in Klaviyo.** No profile enters a draft flow and no
event is processed by one. So seeded inclusion/exclusion "through the actual event path" cannot
be demonstrated at all while StKF69 and QSzrkW remain Draft. This is a property of the platform,
not an access gap, and it applies to whoever runs the test.

Three ways forward:

| Option | Verdict |
| --- | --- |
| Activate in a controlled window | Forbidden, and not requested. |
| **Segment mirror — recommended** | Build read-only Klaviyo segments replicating each candidate filter exactly, then read live membership. Proves the inclusion/exclusion arithmetic against the entire real profile base. Sends nothing, touches no flow, fully reversible. |
| Klaviyo UI preview / test send | Needs UI access and a send. Out of my scope. |

The segment mirror also settles §2.2's open question empirically: a segment carrying the
current `not-contains "[\"B2B\"]"` condition and one carrying a corrected list-membership
condition will return different counts, and the delta is the leak size.

### 9.2 Seed inventory against the required set

| Required case | Existing record | Gap |
| --- | --- | --- |
| Consumer B2C | — | **missing** |
| Private organisation B2B | sc-pilot-01…06, 09 | present (all two-tag) |
| Verified public-sector B2G | sc-pilot-07, 08 | present (both two-tag) |
| Ambiguous institutional signal | — | **missing** |
| Local B2C / B2B / B2G | — | **missing**, and no region data (§4) |
| Missing buyer-type | untagged profiles, `[]` tags | present |
| Mismatched buyer-type | — | **missing** (e.g. both B2B and B2G) |

### 9.3 Expected results

`E` = excluded before entry, `I` = eligible to enter.

| Case | Tags | Current filter | Corrected filter | Current = correct? |
| --- | --- | --- | --- | --- |
| B2C consumer | `["B2C"]` | I | I | yes |
| B2C multi-tag | `["B2C","Shop"]` | I | I | yes |
| B2B single tag | `["B2B"]` | E *(mode-dependent)* | E | unconfirmed |
| B2B multi-tag | `["B2B","sc-pilot"]` | **I** | E | **no — leak** |
| B2B tag not first | `["sc-pilot","B2B"]` | **I** | E | **no — leak** |
| B2G single tag | `["B2G"]` | E *(mode-dependent)* | E | unconfirmed |
| B2G multi-tag | `["B2G","sc-pilot"]` | **I** | E | **no — leak** |
| B2G tag not first | `["sc-pilot","B2G"]` | **I** | E | **no — leak** |
| Mismatched | `["B2B","B2G"]` | **I** | E | **no — leak** |
| Missing buyer-type | `[]` | I | I *(define policy)* | policy gap |
| Internal, allowlisted | `tim@` | I | per §3 decision | needs decision |
| Internal, not allowlisted | `yusra@` | E | per §3 decision | needs decision |

Each case must additionally record: purchase exit, checkout exit, re-entry behaviour at the
flow's configured window, rendered output for the resolved branch, and absence of cross-path
duplication with the other flow.

## 10. Verdict summary

| Gate | Verdict |
| --- | --- |
| Flow status (all four) | **PASS** |
| Purchase / checkout exit wiring | **PASS** |
| Re-entry definitions | **PASS** (two questions to confirm) |
| StKF69 high-value creative | **PASS** |
| Yk6pEb rollback + unique-content review | **DELIVERED** |
| Buyer-type B2B/B2G exclusion | **HOLD — blocking** |
| QSzrkW high-value creative + footer | **HOLD — blocking, scope larger than assigned** |
| Region dimension | **HOLD — untestable as specified** |
| Sales_Conversation exclusion | **HOLD — not built; one spec question open** |
| Seeded runtime proof | **BLOCKED — draft flows do not execute** |

## 11. What I need in order to close

1. **Approval to create ~4 clearly-named, deletable QA-only Klaviyo segments** mirroring the
   current and corrected buyer-type conditions. Read-only outcome, no send, no flow change.
   This is the single highest-value unblock.
2. **Approval to create the missing seed profiles** as non-deliverable `@example.com` records
   following the existing `sc-pilot` convention: B2C, B2C multi-tag, ambiguous institutional,
   mismatched B2B+B2G, and local variants if a region source is nominated.
3. **A decision on §3** — is the internal-address group meant to be an allowlist or a blocklist,
   and should `zafraan@` be removed rather than corrected?
4. **A decision on §5** — does a missing `Sales_Conversation_Last_Activity_At` fail open or fail
   closed?
5. **Confirmation that the Friday template correction is rescoped** from three templates to the
   six/seven identified in §7, plus the three message-level preheaders in §7.2.

Until 1 and 2 are granted, runtime seeded proof cannot be produced by anyone while the flows
stay Draft, and my lane stays at definition-level verification.
