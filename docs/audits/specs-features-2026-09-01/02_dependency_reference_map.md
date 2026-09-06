# 02 — Dependency / Reference Map: `specs_features`

Captured 2026-09-01 against the live store (Fitness Superstore, Shopify Plus) and the live theme
`fitnesssuperstore-shopify/main` (OnlineStoreTheme/186120208700, updated 2026-08-28).

Read this together with:
- `01_entries_export.csv` — the per-record reference map (every entry → every product that points at it)
- `02_theme_binding_map.csv` — the per-field reference map (every field → every theme file that reads it)

---

## 1. There is exactly one inbound path into this definition

```
Product
  └── metafield  custom.features_specs        MetafieldDefinition/83345768764
        type: metaobject_reference
        validated against: MetaobjectDefinition/7246479676  (specs_features)
        metafieldsCount: 4469
              └── Metaobject  specs_features   (4546 entries)
                    ├── set_includes         → set_include  (MetaobjectDefinition/8537375036, 755 entries)
                    └── accessories_included → accessory    (MetaobjectDefinition/7246643516, 225 entries)
```

**Verified exhaustively:**
- Every metafield definition on PRODUCT, PRODUCTVARIANT, COLLECTION, PAGE, ARTICLE and SHOP was
  enumerated. `custom.features_specs` is the **only** definition store-wide whose validation targets
  `MetaobjectDefinition/7246479676`.
- All 111 metaobject definitions in the store were enumerated (3 pages). **No** metaobject definition
  has a field that references `specs_features`. `specs_features_new` shares the two *children*
  (`set_include`, `accessory`) but does not reference `specs_features` itself.
- The bulk export of `metaobject.referencedBy` returned **4,469 back-reference rows, 100% of them
  `Product / custom.features_specs`**. Zero Collection, Page, Article, Variant or Metaobject
  referencers exist.

## 2. Product-side reference facts

| Fact | Count |
|---|---|
| Entries in the definition | **4,546** |
| Entries referenced by at least one product | 4,459 |
| Distinct products referencing an entry | 4,469 |
| Products pointing at more than one entry | 0 (1:1 by design) |
| Entries shared by more than one product | **10** |
| Entries with **zero** back-references (orphans) | **87** |

Status of the 4,469 referencing products:

| Product status | Products |
|---|---|
| ACTIVE | 3,736 |
| ARCHIVED | 453 |
| UNLISTED | 250 |
| DRAFT | 30 |

733 of the referencing products are ARCHIVED / UNLISTED / DRAFT. The 477 entries whose *only*
references come from non-live products have no customer-facing surface today — see
`05_dispositions.csv`.

The 10 shared entries (one record serving two products) are listed in full in `07_requires_tim_approval.csv`
with action `EDIT shared record`. Most are `-test-copy`, `-copy` or `-oob` product clones, e.g.
`french-fitness-ffb-black-5-stack-multi-jungle-gym-new` serves both the live product and
`…-test-copy`. **Any edit to one of these 10 records changes two PDPs at once.**

## 3. Theme-side reference map (live theme)

Three sections consume the metaobject, and they are reached from **15 product templates**:

| Section file | Reads |
|---|---|
| `sections/extra-info.liquid` | `other_features`, `other_tech_specs`, `comparison_chart_title`, `comparison_chart_table`, `other_comparison_charts`, `buying_guide`, `frequently_asked_questions`, `shipping_dims_weight_2`, `set_includes`, `accessories_included` (direct Liquid) |
| `sections/HGS-extra-info.liquid` | `other_features` (direct Liquid) |
| `sections/main-product-comb.liquid` | `set_includes` (direct Liquid) |

The remaining fields are not read in Liquid — they are wired through **theme editor dynamic-source
bindings inside the product template JSON** (`"…features_specs.value.<key>"` in a block setting).
That is why a plain grep of `.liquid` files under-reports usage; both paths had to be checked.

Templates that render one of these sections:

```
product.json                      product.variants.json            product.variants-pulley.json
product.combined-listings.json    product.customised-product.json   product.discontinued.json
product.boost-test.json           product.byo-rig.json              product.gift_cards.json
product.gym-package.json          product.shopify-product-option.json
product.mats-pdp.json             product.mats-single-variant.json  product.mats-multi-variant.json
product.home-gym-packages.json   (HGS-extra-info)
```

### Fields NOT bound anywhere in the live theme

| Field | Entries populated | Consequence |
|---|---|---|
| `downloads_other_info` | 1 (`life-fitness-discover-se-3-95-fs-flexstrider-remanufactured`) | dead field — content is entered but never rendered |
| `exercises` | 1 (`french-fitness-fsr-90-functional-trainer-smith-squat-rack-machine-new`) | dead field — content is entered but never rendered |

`product_title` is the definition's `displayNameKey` — it is the admin-facing label, not a rendered field.
It is populated on all 4,546 records and must be preserved.

Also note the overlap pair `shipping_dims_weight` (rich text, 341 populated, bound only in
`product.gym-package.json`) vs `shipping_dims_weight_2` (multi-line, 386 populated, bound in 11
templates + `extra-info.liquid`). Two fields for one concept — a naming-cleanup target, not a data problem.

## 4. Coverage gaps in this map — please close before any destructive step

These three surfaces could not be proven from the API credentials available to me. They are the only
places an undiscovered dependency could hide, and each is a 5-minute check inside Shopify admin:

1. ~~**Installed apps.**~~ **CLOSED — see file 09.** The `access denied` recorded here was a
   transient error that I did not retry before writing it down as a permanent limit. Re-run
   2026-09-01 the query works: 47 apps installed, 20 of them hold `read_metaobjects` and could read
   this data. File 09 lists them and names the six worth chasing for actual usage.
2. **Shopify Flow / automations.** Not enumerable here. **Ask:** does any Flow read or write
   `custom.features_specs` or `specs_features` entries?
3. **The non-live themes.** Correction: there are **79** (1 MAIN, 2 DEVELOPMENT, 77 UNPUBLISHED),
   not 19 — the original figure came from a query that returned only the first 20 themes. Only the
   live theme was scanned. A dev theme that still binds a field scheduled for deprecation would break
   when it is next published. Theme file bodies are readable through the Admin API, so this is
   scriptable; see file 09.
