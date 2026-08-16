# T-006 and T-008 — bounded current-versus-proposed diffs

**Prepared by:** Izza (implementation lead) · **Independent verifier:** Zafran
**Authority:** Tim's August 8 decision, implementation order item 3 — *"Prepare bounded
current-versus-proposed diffs for `T-006` and `T-008` before code changes."*
**Status:** **Design record only. No code in this document has been written to the theme.**
The branch carries the `T-017` and `T-020` changes and this documentation; nothing here
is implemented, and none of it merges without independent QA, Kevin's feed sign-off where
marked, and Tim's written GO.

This is deliberately narrow. It covers the sub-items where the intended change is now
fully determined by a decision Tim has made or by live evidence gathered since revision 2.
Sub-items still waiting on a decision or on missing access are listed in §4 with what is
blocking them, rather than sketched speculatively.

---

## 1. `T-006b` — `itemCondition`

**Files:** `snippets/schema-product.liquid:85` (single-variant offer), `:185` (per-variant
offer loop), `snippets/schema-collection.liquid:50`. All three carry the identical
expression.

### Current

```liquid
"itemCondition": "https://schema.org/{% if product.metafields.custom.condition_state %}{% if product.metafields.custom.condition_state contains 'as is' or product.metafields.custom.condition_state contains 'As is' %}UsedCondition{% elsif product.metafields.custom.condition_state contains 'Remanufactured' %}RefurbishedCondition{% else %}{{ product.metafields.custom.condition_state }}Condition{% endif %}{% else %}NewCondition{% endif %}",
```

### Behaviour against the live data

Live enumeration (see plan §0.5): `New` 3,157 · `Remanufactured` 1,331 · `As is` 4 ·
**no value 1,977 catalogue-wide, but only 13 of the 3,750 active products** · no product
combines conditions · the metafield definition is free text with no validations.

| Input | Emitted today | Valid? |
|---|---|---|
| `Remanufactured` | `RefurbishedCondition` | Yes |
| `As is` | `UsedCondition` | Yes |
| `New` | `NewCondition` | Yes, but only because `New` + `Condition` concatenates into a real type — not because `New` is mapped |
| *absent* | `NewCondition` | **Syntactically valid, factually fabricated.** 1,977 products catalogue-wide, but only **13 of the 3,750 active** ones — see the reconciliation caveat in plan §0.5 before quoting either figure |
| `Open Box` (hypothetical) | `https://schema.org/Open BoxCondition` | **No** — space in a URL, matches no type |

Two things this settles. The per-variant contradiction that opened the ticket — a value
containing `Remanufactured` marking genuinely new variants `RefurbishedCondition` — is a
real code path with **no live data behind it today**. And the invalid-URL case is
likewise not firing. What *is* firing is the fabricated `NewCondition` default, on a
dozen or so active products rather than the third of the catalogue the raw count implies.

**So this ticket carries no confirmed high-volume live defect.** All three live values
emit valid markup; the contradiction has no data behind it; the fabricated default is
real but small. The change is still worth making — it removes an invented assertion and
guards a free-text field that nothing validates — but it should be sequenced on that
basis rather than as a P0 emergency, and nobody should carry the earlier framing into
the release notes.

### Proposed

Resolve at variant level, map explicitly, and omit when unknown.

```liquid
{%- liquid
  assign condition_source = variant.metafields.custom.condition_state | default: product.metafields.custom.condition_state
  assign condition_url = null
  if condition_source contains 'as is' or condition_source contains 'As is'
    assign condition_url = 'https://schema.org/UsedCondition'
  elsif condition_source contains 'Remanufactured'
    assign condition_url = 'https://schema.org/RefurbishedCondition'
  elsif condition_source == 'New'
    assign condition_url = 'https://schema.org/NewCondition'
  endif
-%}
{%- if condition_url -%}
"itemCondition": {{ condition_url | json }},
{%- endif -%}
```

Four differences, each deliberate:

1. **No fabricated default.** An absent or unrecognised value emits **no `itemCondition`
   property at all**, per the schema specification's rule to omit rather than invent.
   Google treats a missing `itemCondition` as new by default for Merchant Center
   purposes, so this is a change in what *we assert*, not necessarily in how the offer is
   interpreted — which is the point Kevin needs to confirm.
2. **No raw concatenation.** No input can produce a malformed URL.
3. **Explicit `New`.** Correct by mapping rather than by string coincidence.
4. **Variant-level source with product-level fallback.** Closes the contradiction path
   before data ever exercises it. If no variant-level metafield is created, behaviour is
   identical to product-level today.

### Evidence and gates

- Current-vs-proposed JSON-LD across the full `T-006` QA matrix, both branches of every
  case in the table above, including at least one of the four `As is` products and one of
  the 1,977 with no value.
- Rich Results Test and Schema Markup Validator per template.
- **Kevin's Merchant Center attribute diff before merge** — specifically what happens to
  the 1,977 products that stop asserting a condition. This is the item most likely to
  need a feed-side answer before the theme change is safe.
- Rollback: single-commit revert; theme version pinned.

---

## 2. `T-006c` — `aggregateRating`

**Files:** `snippets/schema-product.liquid:19-29`, `snippets/schema-collection.liquid:58-69`.

**Decision (Tim, 2026-08-08):** Judge.me is the public review system of record.
`aggregateRating` may be emitted only from an approved normalised source that matches the
visible Judge.me rating and count. If parity cannot be kept, **omit it**.

### Current

Schema reads `product.metafields.reviews.rating` and `reviews.rating_count` (set on
**481 products**). The visible PDP stars come from Judge.me via
`snippets/product-review-stars.liquid`. The two are independent, so they can disagree,
and `ratingCount` and `reviewCount` are both populated from the same number even though
they are different quantities.

### Proposed

Emit `aggregateRating` only where the values driving the markup are the same values
rendering the visible stars, and drop the duplicated count:

- Source `ratingValue` and `ratingCount` from the Judge.me-backed field that
  `product-review-stars.liquid` already renders.
- Emit `reviewCount` **only** where a distinct review count is genuinely available;
  otherwise omit it rather than mirror `ratingCount`.
- Where the Judge.me value is absent for a product, emit **no** `aggregateRating`, even if
  `reviews.rating` has a value. A rating the customer cannot see on the page must not
  appear in the markup.

### Blocking detail, stated rather than assumed

The `judgeme` namespace returns **no metafield definitions** through the Admin API. That
is normal for an app-owned namespace and is **not** evidence that the data is missing, but
it does mean the exact field and its shape have to be read off rendered pages before this
diff can be finalised. **That check is not done yet**, so the proposal above is the
posture, not the final patch. It needs one pass over sampled PDPs comparing visible stars
against `reviews.rating` on the same URL — including at least one of the 481 — before the
code is written.

---

## 3. `T-008` — pagination and index controls

**File:** `snippets/head-meta.liquid`.

**Decision (Tim, 2026-08-08):** ordinary `?page=n` collection pagination targets
crawlable unique URLs with self-referencing canonicals, subject to sampled validation of
product discovery and rendered links. Do not combine `noindex` with a canonical to page 1.
Filters, sorts and tracking parameters stay separate decisions.

### Current — the contradiction

```liquid
{% assign url_parts = canonical_url | split: '?' %}
{% if url_parts.size > 1 %}
  {% assign query = url_parts[1] %}
  {% if query contains 'page=' %}
    <meta name="robots" content="noindex,follow">
  {% endif %}
{% endif %}
```

and, later in the same file, for a collection:

```liquid
<link rel="canonical" href="{{ collection.url | prepend: base_url }}">
```

So `/collections/treadmills?page=3` receives `noindex,follow` **and** a canonical pointing
at page 1 — two contradictory instructions about one URL.

### Proposed

Remove the `page=` `noindex` branch, and make the collection canonical self-referencing
when a `page` parameter is present:

```liquid
{%- comment -%}
  Paginated collection URLs are crawlable unique URLs with self-referencing canonicals.
  They are not noindexed, and they do not canonicalise to page 1 — the two together sent
  contradictory instructions about the same URL.
{%- endcomment -%}
{%- assign page_param = canonical_url | split: 'page=' -%}
{%- if page_param.size > 1 -%}
  {%- assign page_number = page_param[1] | split: '&' | first -%}
{%- endif -%}
...
<link rel="canonical" href="{{ collection.url | prepend: base_url }}{% if page_number and page_number != '1' %}?page={{ page_number }}{% endif %}">
```

`page=1` keeps the bare canonical, so page 1 and `?page=1` do not become two indexable
URLs for the same content.

### Two things deliberately **not** changed here

1. **The client-side `variant=` `noindex` injection** (`head-meta.liquid:31-40`) stays as
   it is in this diff. The patch examples are explicit that no blanket `variant=`
   `noindex` may be applied until combined listings, canonical variants, Merchant Center
   landing URLs and internal links are sampled. That sampling needs `T-001`, which is
   blocked on the per-URL export. Removing the injection is likely correct — a
   browser-only directive a crawler never sees is not a control — but it is a separate
   decision with a feed dependency, and it is not being folded in here.
2. **The unvalidated canonical override** `custom.product_canonical_url`, live on **235
   products**. A mis-set value can point a product's canonical anywhere. Auditing those
   235 is a `T-001` task and needs an export; the Admin API ignores a wildcard metafield
   filter on this key.

### Evidence and gates

- Raw HTML with JavaScript disabled, before and after, for page 1, page 2 and a deep page
  of at least two Tier-1 collections.
- `curl -I` headers on the same URLs.
- Sampled validation that products reachable only deep in pagination are still discovered
  — measured against `T-005` and `T-011`, per the decision's "subject to sampled
  validation" condition.
- GSC URL Inspection on the samples once access is granted.
- Combined-listing behaviour unchanged.
- Rollback: single-commit revert; theme version pinned.

---

## 4. Sub-items deliberately not diffed yet

| Sub-item | Why not |
|---|---|
| `T-006a` fabricated defaults | Mechanical and already fully specified in the plan's line-by-line table. The diff is "delete the `default:` filter, omit the property" repeated ~15 times; it will be written as one PR against that table rather than restated here |
| `T-006d` oversized graphs | Depends on PR #703's merge order, since both rewrite `schema-product.liquid`. Diff written after the #703 sequencing is settled, to avoid drafting against a file that is about to change |
| `T-006e`–`T-006g` | Mechanical; folded into the `T-006a` PR |
| Reference-price source of record | **Open decision for Tim** (plan §12, new item 1). Visible reads `custom.retail_price`, JSON-LD `ListPrice` reads variant compare-at. Cannot be diffed until one is chosen |
| `T-008` `variant=` posture | Blocked on `T-001` sampling, which is blocked on the August 5 per-URL export |
