# Desktop Homepage A/B Test — Implementation Spec (Variant B)

**Status: DRAFT / NOT LAUNCHED.** Theme `187242119484` stays unpublished. No merge, publish,
launch, or traffic ramp without Tim's explicit written approval in the email thread
"Desktop Homepage A/B Test implementation package."

This document is the single build contract for the desktop experiment. It records the branch
cleanup required by Tim's Jul 29 email (item 1) and the `templates/index.json` sequencing that
Waqas asked me to confirm before committing. Where this document and the concept package
disagree, this document wins.

---

## 1. Branch of record

**Build here:** `desktop-homepage-ab-test-1aug`, cut from `main` at merge base
`c1ee980730a5c19d07d98a8ec4995d88a8dd126a` (2026-08-01).

**Do not build on `desktop-ab-test-28jul`.** It is 19 commits behind and 3 ahead of `main`. All
three commits ahead are Shopify theme-editor sync commits, and they carry only unrelated drift:

| File | Drift |
| --- | --- |
| `config/settings_data.json` | Boost AI Search & Filter app embed flipped to `disabled: true` |
| `templates/collection.json` | Boost filter block disabled; `main-collection-product-grid` re-enabled |
| `templates/search.json` | Boost filter block disabled |
| `templates/index.json` | Cosmetic block-key reordering and one whitespace change only |

No experiment work ever existed on that branch, so recreating from `main` loses nothing.
Building on it would additionally have reverted merged `main` work — `assets/intl-transformer-note.js`,
`assets/product-custom-options.js`, `sections/image-banner-faq.liquid`,
`snippets/intl-transformer-note.liquid`, `templates/page.faqs.json`,
`templates/page.remanufactured.json`.

**Waqas Q1 answered:** `desktop-ab-test-28jul` was cut off `main` (merge base `ea3bfcc1c`, the
merge of PR #671), **not** off `mobile-ab-test-24jul`. Verified: no mobile experiment branch is an
ancestor of it. It acquired its own copy of the same Boost/settings drift afterwards, via the theme
editor. No rebase off the mobile branch is needed — start clean on the branch above.

**Waqas Q2 answered:** yes, desktop follows the mobile pattern — new parallel section/snippet/asset
files, existing shared homepage sections untouched.

---

## 2. Work sequence

This is the sequencing confirmation Waqas asked for. `templates/index.json` is deliberately last.

| Step | Work | Owner | Gate |
| --- | --- | --- | --- |
| S1 | Build the isolated new desktop Variant B sections, snippets, assets | Waqas | **Unblocked — start now** |
| S2 | Mobile single-render refactor lands on the mobile experiment | Waqas / Izza | after S1 begins |
| S3 | Mobile test completes and closes | Sagi / Izza | Tim item 3 — no concurrent homepage tests |
| S4 | Desktop `templates/index.json` wiring, on the mechanism S2 establishes | Izza | after S3 |
| S5 | Evidence packet → Tim's approval → publish / ramp | Izza → Tim | after S4 |

`templates/index.json` is the only file both experiments need. Mobile owns it first. Nothing in S1
touches it, which is why S1 can proceed today.

---

## 3. Single-render architecture — constraints that bind S1

Mobile is currently dual-render: Control and Variant B modules both sit in the DOM and
`assets/fss-hp-device-targeting.css` hides one set at 989px. Desktop must not replicate that.

The mechanism chosen at S2 does not change what Waqas builds at S1, provided every desktop section
satisfies all five rules below. Build against these, not against the current mobile structure.

- **R1 — Namespaced section keys.** Use an `fssd_*` prefix. Never reuse or repurpose a Control
  section key. On the mobile branch the Control hero key `homepage_section_hero_t9WgKg` was
  repurposed for `homepage-hero-compact` and Control's hero was moved to a new key
  `homepage_section_hero_original`. That collision is exactly what must not happen a second time —
  the two experiments would fight over the same keys and the same targeting CSS.
- **R2 — No device toggle for correctness.** No desktop section may depend on `display:none`
  device hiding to render correctly, and none may reference `assets/fss-hp-device-targeting.css`.
- **R3 — Self-contained modules.** One module per section file, own schema, own scoped CSS. No
  styles leaking into shared Control surfaces.
- **R4 — Control untouched.** `templates/index.json` and every existing shared homepage section
  stay byte-identical on this branch until S4.
- **R5 — One rendered homepage.** Exactly one `<h1>`. No hidden duplicate homepage content and no
  crawlable alternate homepage.

**Preferred mechanism for S2 (my recommendation, pending Sagi's confirmation):** a dedicated
alternate homepage template — e.g. `templates/index.desktop-b.json` — served to the assigned
cohort, with Control `index.json` untouched. One module set per render, and the two experiments
stop sharing a file. This needs Convert-side routing plus canonical / `noindex` handling on the
alternate view, so Sagi confirms the platform can route the cohort before we commit to it.

**Fallback if it cannot:** in the unpublished variant theme, render only the Variant B set from a
single `index.json`, with device cohorting enforced by the experiment platform before first paint —
Pattern A in the mobile `CLAUDE.md`. Not CSS-hidden duplicates.

---

## 4. Module order — Variant B desktop

Per Tim's Jul 26 concept. The global header and left sidebar stay intact; the experiment is limited
to homepage content hierarchy.

1. **Global header + left sidebar** — reuse unchanged, no build.
2. **Hero** — both condition paths presented immediately: *Shop Remanufactured*, *Shop New
   Equipment*. Supporting link: *Browse French Fitness* (a supporting link, not a third CTA).
3. **Shopping paths** — four cards directly after the hero: Remanufactured Equipment, New
   Equipment, French Fitness, Gym Packages.
4. **Popular categories** — six tiles, visible without tabs or a carousel: Treadmills, Exercise
   Bikes, Selectorized, Plate Loaded, Cages Racks & Rigs, Free Weights.
5. **Top Sellers** — six products, above the brand section, dynamically bound, condition label
   visible on each card.
6. **Compact trust band** — replaces the three large Why Choose Us / Warranty / Mission cards.
7. **Lower content** — brands, facility proof, FAQs, reviews, newsletter, footer: reused unchanged,
   after the primary shopping journey.

The concept prototype's "Custom Equipment" → "New Equipment" card rename is part of item 3 and
needs the merchandising approval in §7 before it ships.

---

## 5. Canonical destinations

Per Tim item 4. Verified against the store on 2026-07-31:

| Path | Destination | Verified state |
| --- | --- | --- |
| Shop Remanufactured | `/collections/products-remanufactured` | exists — "Remanufactured Gym Equipment for Sale", 1,264 products |
| Shop New Equipment | `/collections/new-equipment` | exists — "Shop New Equipment", 2,463 products |
| French Fitness | `/collections/french-fitness` | exists — "French Fitness Commercial Gym Equipment for Sale", 1,407 products |
| Gym Packages | `/pages/gym-packages` | exists, published, template suffix `gym-packages` |

Do **not** use `/pages/remanufactured-gym-equipment` for the primary Shop Remanufactured shopping
CTA. It may remain an educational page elsewhere.

Two notes:

- Control's existing `homepage_homepage_offers_bnKDwY` "Remanufactured Equipment" card still points
  at `shopify://pages/remanufactured-gym-equipment`. That is a Control-side inconsistency. It is
  out of scope for this branch and must not be "fixed" here — R4 holds.
- Online Store sales-channel publication state for these collections could not be read with the
  current API scope. Confirm each on the live storefront and record it in launch evidence.

---

## 6. Approved copy constraints

- **Gym Packages card copy — use this exact sentence** (Tim item 5):
  *"Explore equipment packages by gym size and customize the equipment mix for your space."*
  The concept's *"Start with a full-room equipment plan and customize it around your space"* is
  replaced. Card links to `/pages/gym-packages`. No direct Room Planner CTA, and nothing that
  implies the planner provides a finished custom design, quote, safety validation, or fulfillment
  workflow. The Gym Layout / Room Planner thread stays the canonical remediation record; do not
  open a second planner workstream here.
- **Testimonials** — verbatim from the approved live review source only. Do not publish reworded
  quotations under a customer's name or a "verified buyer" label. The three concept testimonials
  are reworded and cannot ship as written.
- **FAQs** — reuse only entries already approved on the live site or in the controlled copy source.
  The two concept FAQ entries with no live equivalent stay out unless Larianne supplies an approved
  source.
- **No claim inflation** — do not add or strengthen warranty, delivery, installation, inventory,
  financing, certification, return, or lead-time claims beyond what the controlled source supports.
- **Product terminology** — "new / remanufactured" is primary; "refurbished" only in educational
  context; "As Is" for used inventory. Full brand names throughout: Fitness Superstore, French
  Fitness.
- **Accessibility wording** — in code comments, commit messages, and status notes, describe the
  work as "semantic markup implemented" or "improved". Never "compliant" or "fully accessible".

---

## 7. Merchandising — one consolidated approval needed

Carlos and Larianne provide one list covering the six Top Sellers, six category destinations, six
brands, and any new category subtitles. Per Tim, one review is sufficient.

**Blocker found 2026-07-31.** The `most-popular` collection currently holds four products, and one
of them is archived:

| Product | Status |
| --- | --- |
| Woodway 4Front Treadmill (Remanufactured) | ACTIVE |
| French Fitness FSR90 All-in-One Smith Machine, Functional Trainer & Squat Rack (New) | ACTIVE |
| French Fitness Tahoe Prone Leg Curl / Leg Extension (New) | ACTIVE |
| Precor AMT 885 with Open Stride w/P82 Console (New) | **ARCHIVED** |

Three usable products against a six-product module. The approved list either grows to six active
products or Top Sellers binds to a different source. Keep the six-product selection configurable in
the section schema either way.

Also required:

- No hardcoded prices. The Jul 26 concept prices are a snapshot, not production values.
- Bind title, image, current price, availability, URL, and condition label to live Shopify data.
- Do not publish archived, unavailable, or zero-product sources.
- Confirm the source collection is published to the Online Store sales channel before launch — this
  is the same gap flagged as open on the mobile PR.

---

## 8. Analytics

`fss_hp_*` events carry `experiment_id` alongside `variant`, `device`, and `session_id` (Tim
item 3). Sagi confirms the exact experiment ID naming and provides event-receipt proof in the
destination before launch.

**Where the schema change lands:** `assets/fss-hp-analytics.js` does not exist on `main` — it lives
only on the mobile experiment branch. The `experiment_id` change goes in there with the S2 refactor
rather than as a divergent copy on this branch. Desktop inherits it at S4. Adding a second copy here
would guarantee a merge conflict on the one file both experiments share.

Desktop events to wire at S1, using the same `data-fss-hp-event` / `data-fss-hp-props` delegation
pattern already in the helper:

| Event | Fires on | Props |
| --- | --- | --- |
| `fss_hp_exposure` | once, after assignment and successful render | — |
| `fss_hp_primary_cta` | hero condition CTA | `condition` (`new` \| `remanufactured`) |
| `fss_hp_condition_select` | shopping-path condition cards | `condition` |
| `fss_hp_path_click` | shopping-path cards | `path` (`remanufactured` \| `new` \| `french_fitness` \| `gym_packages`) |
| `fss_hp_category_click` | category tiles | `category_handle`, `slot` |
| `fss_hp_product_click` | Top Sellers cards | `product_handle`, `slot` |

The homepage Gym Packages click is tracked separately from the destination-page planner and
quote-intake clicks (Tim, Jul 27), so the experiment can distinguish interest from a completed
planning or lead action. That means `fss_hp_path_click` with `path: 'gym_packages'` is a homepage
event only — do not reuse it on the destination page.

Standard commerce events (`add_to_cart`, `begin_checkout`, `purchase`) must carry variant
attribution through.

---

## 9. Evidence packet

Required before Tim's approval (item 8). One packet:

- clean draft PR and exact changed-file list
- unpublished theme preview (`187242119484`) at representative desktop widths
- Control unchanged and Variant B module-order screenshots
- links, keyboard / accessibility, console, performance, cart / checkout, and rollback checks
- event payload plus destination receipt proof
- PASS / HOLD table for all G0 gates, including the Gym Packages destination state

Capture the Gym Packages destination URL and live CTA/copy state **from the live site**, not from
the concept prototype — every link in the prototype is a placeholder.

---

## 10. G0 gates

| Gate | Item | Owner | Status |
| --- | --- | --- | --- |
| G0-a | Desktop branch clean off current `main` | Izza | **PASS** — §1 |
| G0-b | `index.json` single-render sequence confirmed | Izza | **PASS** — §2, §3 |
| G0-c | Single-render mechanism selected and routable | Sagi / Izza | HOLD |
| G0-d | Mobile test closed before desktop launch | Sagi / Izza | HOLD |
| G0-e | `experiment_id` in `fss_hp_*` + ID naming + receipt proof | Sagi | HOLD |
| G0-f | Canonical destinations resolve | Izza | **PASS** — §5, sales-channel publication still to confirm live |
| G0-g | Gym Packages destination + live CTA/copy recorded | Waqas | HOLD — page verified published, live copy capture pending |
| G0-h | Testimonials verbatim from approved source | Larianne | HOLD |
| G0-i | FAQ entries traced to approved source | Larianne | HOLD |
| G0-j | Six Top Sellers / categories / brands / subtitles approved | Carlos / Larianne | HOLD — source has 3 usable products, §7 |
| G0-k | Locked primary metric and decision rule | Sagi / CRO | HOLD |
| G0-l | Desktop QA: widths, keyboard, console, performance, cart/checkout, rollback | Waqas | HOLD |

---

## 11. Not authorized by this document

No merge, publish, launch, or traffic ramp. Theme `187242119484` stays unpublished. No changes to
Control `templates/index.json` before S4. No second Room Planner workstream. No unrelated fixes on
this branch — the changed-file list stays limited to the desktop experiment.
