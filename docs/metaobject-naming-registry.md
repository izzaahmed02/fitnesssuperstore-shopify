# Metaobject Naming Registry — PDP Tables (PR #640) and GymBuild

Owner: Izza (technical review of both schemas)
Last verified: 2026-09-24, against the live Fitness Superstore Shopify store (Admin API, read-only)

Purpose: single record of the metaobject definitions and metafield bindings used by the
PR #640 PDP table architecture and the GymBuild builder, so the two lanes cannot collide
or duplicate definitions. Required before the #640 pilot template assignment restarts.

## Lane A — PR #640 PDP table architecture

| Definition type | Name | Definition ID |
|---|---|---|
| `pdp_table` | PDP Table | 16673407292 |
| `pdp_table_headers` | PDP Table Headers | 16673145148 |
| `pdp_table_content` | PDP Table Content | 16673210684 |
| `specs_features_new` | Specs & features (NEW) | 16671998268 |

Bindings and internal references:

- Product metafield `custom.features_specs_new` (metaobject_reference) -> `specs_features_new` (16671998268).
- `specs_features_new` -> `pdp_table` (16673407292) on `other_features_table`, `other_tech_specs_table`,
  `side_by_side_comparison`, `shipping_dimensions_weight`.
- `pdp_table.table_headers` -> `pdp_table_headers` (16673145148); `pdp_table_headers.content` -> `pdp_table_content`.
- `pdp_table.table_type` choices: Table with header, Table without header, Table with images, Side by Side Comparison.
- Theme consumers: `sections/extra-info-new.liquid`, `snippets/pdp-table.liquid`,
  `snippets/pdp-table-comparison.liquid`, `snippets/pdp-table-images.liquid`.

## Lane B — GymBuild

| Definition type | Name | Definition ID |
|---|---|---|
| `gymbuild_category` | GymBuild Category | 21327118652 |
| `gymbuild_option` | GymBuild Option | 21327151420 |
| `gymbuild_item` | GymBuild Item | 21327216956 |

Bindings and internal references:

- Variant metafield `custom.gymbuild_items` (list.metaobject_reference) -> `gymbuild_item` (21327216956).
- `gymbuild_item.category` -> `gymbuild_category` (21327118652).
- `gymbuild_item.default_option` and `.alternative_options` -> `gymbuild_option` (21327151420).
- `gymbuild_option.variant` -> variant reference; `.quantity` -> integer.

## Collision check

No collision and no duplicated definition between Lane A and Lane B:

1. Type handles are disjoint (`pdp_*` / `specs_features_new` vs `gymbuild_*`). No shared handle, no shared prefix.
2. Metafield bindings are disjoint: Lane A binds on PRODUCT `custom.features_specs_new`;
   Lane B binds on PRODUCTVARIANT `custom.gymbuild_items`. Different owner type and different key.
3. Reference graphs are closed. Every metaobject_reference validation in Lane A resolves to a Lane A
   definition (or to pre-existing `set_include` 8537375036 / `accessory` 7246643516 / `pdp_sections`
   16672489788 / `pdp_faq` 16672620860); every reference in Lane B resolves to a Lane B definition.
   Neither lane references the other.

## Duplication on record (pre-existing, no action now)

- `specs_features` (7246479676, product metafield `custom.features_specs`) is the legacy predecessor of
  `specs_features_new` (16671998268, `custom.features_specs_new`). Both definitions and both metafields
  exist. Lane A reads only the NEW pair. Retirement of the legacy pair is out of scope for the #640
  pilot and is not required for the assignment gate.

## Maintenance

Any new metaobject definition in either lane is added here before it is created in the store.
