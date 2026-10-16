# PASS — `custom.bundle_option_config` PRODUCT metafield definition

**Disposition: PASS, on the exact specification in §2 and nothing wider.**
Date: 2026-10-16 · Reviewer: Izza (technical/release) · Scope: Tim's 14 October item 1.

Read-only throughout. No definition was created, no metafield was written, no theme or app
was touched. Creating the definition remains Qash's step; this document is the gate it waits on.

Tim, 14 October:

> I approve creation of the empty PRODUCT metafield definition for
> `custom.bundle_option_config`, type json, after Izza records a PASS on the exact
> definition, access settings and existing-state check. Qash, create only that definition
> and provide read-back evidence. If a conflicting definition or existing value state is
> found, stop and report it rather than changing it.

---

## 1. Summary

| Gate | Verdict |
|---|---|
| Exact definition (owner type, namespace, key, type) | **PASS** — §2 |
| Access settings | **PASS** — §3, with one deliberate divergence from house convention, called out |
| Existing-state check — conflicting definition | **PASS** — none exists, store-wide. §4 |
| Existing-state check — existing values | **PASS** — zero values on 6,502 products and 10,031 variants. §4 |
| Scope: does this approve anything else? | **No.** §6 |

Nothing in Tim's conflict clause fires. There is no definition to collide with and no value
state to preserve, so the create is a clean create.

---

## 2. The exact definition

This is the whole of what is approved. Any field not listed here should be left at its
Shopify default.

| Field | Value |
|---|---|
| `ownerType` | `PRODUCT` |
| `namespace` | `custom` |
| `key` | `bundle_option_config` |
| `type` | `json` |
| `name` | `Bundle Option Config` |
| `description` | `Serialized option catalogue read by the product-bundle cart transform. Written by scripts/write-catalogues.mjs under a named GO. Do not hand-edit.` |
| `validations` | none in this change — see §5 |
| `capabilities.adminFilterable` | `false` (default) |
| `capabilities.smartCollectionCondition` | `false` (default) |
| `pin` to the product page | no |

The mutation, exactly:

```graphql
mutation CreateBundleOptionConfigDefinition {
  metafieldDefinitionCreate(definition: {
    ownerType: PRODUCT
    namespace: "custom"
    key: "bundle_option_config"
    name: "Bundle Option Config"
    description: "Serialized option catalogue read by the product-bundle cart transform. Written by scripts/write-catalogues.mjs under a named GO. Do not hand-edit."
    type: "json"
    access: { storefront: NONE, customerAccount: NONE }
  }) {
    createdDefinition { id name namespace key type { name } ownerType access { admin storefront customerAccount } metafieldsCount validations { name value } }
    userErrors { field message code }
  }
}
```

Read-back evidence Qash should return with it:

```graphql
query ReadBackBundleOptionConfigDefinition {
  metafieldDefinitions(first: 5, ownerType: PRODUCT, namespace: "custom", key: "bundle_option_config") {
    nodes { id name namespace key ownerType type { name } description
            access { admin storefront customerAccount }
            validations { name value }
            metafieldsCount
            capabilities { adminFilterable { enabled } smartCollectionCondition { enabled } } }
  }
}
```

`metafieldsCount` on the read-back must come back **0**. It counts pre-existing values the
new definition adopts. Given §4 it should be 0, and if it is not, that is a conflicting
value state that arrived after this check and Tim's stop-and-report clause applies.

### Why `PRODUCT` only, and not `PRODUCTVARIANT`

The committed function input query reads the metafield at variant level first and falls back
to product level. Tim's approval names PRODUCT only, and the write plan writes PRODUCT only.
Creating the variant-level definition as well would create an empty slot that silently takes
precedence over the product-level catalogue the moment anything writes to it. **Do not create
the variant definition.** If variant-level catalogues are ever wanted, that is its own change
with its own approval.

---

## 3. Access settings

Verified against Shopify's current reference and against this store.

`custom` is a merchant-owned namespace, so `access.admin` is not something we set: merchant-owned
metafields are readable and writable by the merchant and by every app holding the matching scope.
All 243 existing `custom` PRODUCT definitions on this store read back
`admin: PUBLIC_READ_WRITE`, which is that default surfacing. The cart transform therefore reads
it without any access configuration, and so does the writer.

| Setting | Recommended | House convention on this store | Why |
|---|---|---|---|
| `access.admin` | not set (resolves to `PUBLIC_READ_WRITE`) | `PUBLIC_READ_WRITE` on all 243 | Merchant-owned default. The Function and the writer both need it. |
| `access.storefront` | **`NONE`** | `PUBLIC_READ` on all 243 | **Divergence, deliberate.** See below. |
| `access.customerAccount` | `NONE` | `NONE` on all 243 | Nothing in Customer Accounts reads it. |

**The storefront divergence.** Every other `custom` PRODUCT definition here is `PUBLIC_READ`,
so `NONE` breaks the pattern. Three reasons it is still the right call, and one reason it is
safe:

1. Nothing reads this metafield from the Storefront API. The cart transform reads it server-side
   through its Function input query, which is unaffected by this setting.
2. I grepped the whole theme at the PR #931 head (`2ca0c680`) for `bundle_option_config` across
   Liquid, JS and JSON. **Zero hits.** No theme code reads it today.
3. Per Shopify's own reference, `access.storefront` **does not affect Liquid**: metafields are
   always reachable in Liquid regardless. So `NONE` cannot break a Liquid read later either.

The value is up to 9,000 bytes of internal option-pricing structure per product. There is no
reason to publish it on a public API, and `NONE` is reversible with a single
`metafieldDefinitionUpdate` if a headless consumer ever needs it.

If Tim or Qash would rather hold the house pattern, `PUBLIC_READ` is not a safety problem —
prices and option names are already public. I am recording the recommendation, not blocking on it.

---

## 4. Existing-state check

Full evidence, including every bulk-operation id and byte count:
`docs/qa/evidence/2026-10-16/bundle-option-config-existing-state-2026-10-16.json`

**Conflicting definition: none.** Queried by exact key on `PRODUCT` and `PRODUCTVARIANT` — both
empty — and then enumerated every PRODUCT definition in the `custom` namespace. 243 definitions,
`hasNextPage: false`, no `bundle_option_config` among them. There is also no key collision inside
the namespace.

**Existing values: zero, store-wide.** This is the part the 1 October QA could only sample
(twelve pilot products). It is now the whole catalogue.

| Owner | Objects | Baseline export | With the metafield aliased in | Delta | Expected if every value is null | Match |
|---|---:|---:|---:|---:|---:|:--:|
| Products | 6,502 | 319,336 B | 429,870 B | 110,534 B | 6,502 × 17 = 110,534 B | **yes** |
| Variants | 10,031 | 571,767 B | 742,294 B | 170,527 B | 10,031 × 17 = 170,527 B | **yes** |

Method, because it is unusual and should be checkable. This session's egress policy blocks the
bulk-result host, so I could not download the JSONL. I did not need to. Bulk JSONL writes one
line per object, and adding one aliased scalar field adds exactly that field's serialization to
every line. A null renders as `,"bundleCfg":null` — 17 bytes, the same on every line. A single
non-null value would instead render `,"bundleCfg":{"id":"gid://shopify/Metafield/…"}`, which is
strictly longer, so one populated record anywhere in the store would push the delta above the
expected figure. Both deltas land on the expected figure to the byte, with `objectCount`
identical across each pair. That is a store-wide proof, not a sample.

Corroborated independently before the differential: four forward pages of
`products(first: 250) { nodes { metafield(…) { id } } }`, 1,000 products, zero non-null.

---

## 5. One thing I would add, and one thing it cannot do

The `json` metafield type supports a `schema` validation — confirmed live against this store's
API version via `metafieldDefinitionTypes`, where `json` reports
`supportedValidations: [{ name: "schema", type: "json" }]`. A JSON Schema on the definition
would make Shopify reject a structurally invalid catalogue **server-side, on write**, which is
half of what Tim asked be enforced in the execution path in his item 2.

I am **not** folding it into this approval. Tim approved an *empty definition*, and a schema is
a design decision about the v2 catalogue format that deserves its own look. It should be the
next small step after the definition exists, before any catalogue population.

What a schema cannot do: enforce the 9,000-byte gate. JSON Schema can bound string lengths and
array sizes but not the serialized byte length of the whole document. The byte gate has to stay
in the writer, which is finding W2 of the companion review.

---

## 6. What this PASS does not cover

Stated explicitly so it cannot be read as wider than it is:

- It does **not** approve writing any value to the metafield. Catalogue population stays on HOLD
  pending Tim's separate GO.
- It does **not** approve the variant-level definition.
- It does **not** approve a `schema` validation, `pin`, `adminFilterable`, or any capability.
- It does **not** approve theme merge or publish, live-theme switching, or Rust activation.
- It is a point-in-time check. If the definition is not created within a few days, re-run the
  read-back's `metafieldsCount` before creating, because the premise is "still empty".

## 7. What Qash returns

1. The `metafieldDefinitionCreate` response, verbatim, including `userErrors`.
2. The §2 read-back query response, verbatim, showing `metafieldsCount: 0` and the access triple.
3. Nothing else changed in the same session.

If the read-back disagrees with §2 on any field, or `metafieldsCount` is not 0, stop and report
rather than correcting it in place.
