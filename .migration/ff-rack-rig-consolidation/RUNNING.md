# Finishing groups B and C yourself

Groups A (breadcrumbs), D (HTML sitemap) and E (category index) are applied.
Group B is 23 of 95 applied. Group C is not started.

Remaining: **72 product descriptions + 74 option-help records = 146**.

Two scripts do the whole thing. Stdlib Python only, no install.

---

## 1. Get an Admin API token (about two minutes)

In Shopify Admin:

1. **Settings → Apps and sales channels → Develop apps**
2. **Create an app** — name it something like `rack-rig-migration`
3. **Configure Admin API scopes**, tick:
   - `write_products`, `read_products`
   - `write_metaobjects`, `read_metaobjects`
4. **Save → Install app**
5. **API credentials → Admin API access token → Reveal token once**. It starts `shpat_`.

Treat it like a password. Don't commit it. Delete the app when the cutover is done.

---

## 2. Run it

```bash
cd .migration/ff-rack-rig-consolidation

export SHOPIFY_SHOP=79ef8b-5e.myshopify.com
export SHOPIFY_TOKEN=shpat_xxxxxxxxxxxxxxxx

python3 apply.py products      # 72 remaining descriptions
python3 apply.py optionhelp    # 74 option-help records
python3 verify.py              # whole-store check
```

Run `products` first and let it finish — Shopify allows one bulk mutation at a
time, and the script refuses to start if another is running.

Each run stages the payload, starts the bulk mutation, polls to completion, then
downloads the results and reports per-record `userErrors`. It exits non-zero if
anything failed, so you'll know rather than having to check.

Expected output from `verify.py`:

```
product descriptions: scanned 6462, hits 0
product_option_help_text: scanned 1096, hits 0
breadcrumb_path: scanned 694, hits 0
sitemap_menu_1: scanned 652, hits 0

PASS — no surviving controllable links
```

Anything other than `PASS` lists the exact records still pointing at an old
source collection.

If the API version is ever rejected, override it:
`export SHOPIFY_API_VERSION=2025-10`.

---

## 3. Rollback

```bash
python3 apply.py products --rollback     # restores all 95 pre-edit descriptions
python3 apply.py optionhelp --rollback   # restores all 74 pre-edit help_text values
```

`products_ROLLBACK.bulk.jsonl` covers all 95 and is a no-op for records that were
never applied, so it's safe to run whatever state you're in.

For the already-applied groups A, D and E, see the rollback sections in `README.md`
— those are three small manual edits, not scripts.

---

## Payload files

| File | Records | What it does |
|---|---|---|
| `payloads/products_REMAINING.bulk.jsonl` | 72 | descriptions not yet applied (regenerated from live state) |
| `payloads/products_ROLLBACK.bulk.jsonl` | 95 | restores all pre-edit descriptions |
| `payloads/optionhelp_NEW.bulk.jsonl` | 74 | option-help updates |
| `payloads/optionhelp_ROLLBACK.bulk.jsonl` | 74 | restores pre-edit help_text |
| `payloads/products_NEW.bulk.jsonl` | 95 | full original set, kept for reference |
| `payloads/breadcrumbs_ROLLBACK.jsonl` | 6 | restores pre-edit breadcrumb steps and labels |

Each line is the GraphQL variables object for one mutation:

- products → `mutation call($product: ProductUpdateInput!) { productUpdate(product: $product) { product { id } userErrors { field message } } }`
- optionhelp → `mutation call($id: ID!, $metaobject: MetaobjectUpdateInput!) { metaobjectUpdate(id: $id, metaobject: $metaobject) { metaobject { id } userErrors { field message } } }`

---

## Alternatives, if you'd rather not use a token

**Matrixify** — export Products with the Body HTML column, filter to the 72 handles
in `products_REMAINING.bulk.jsonl`, paste in the new Body HTML values, re-import.
Works for group B. It does **not** cover group C, because
`product_option_help_text` metaobjects aren't in Matrixify's product export.

**By hand in Shopify Admin** — open each product, edit the description in HTML view
(`<>` button), and change only the collection handle inside the `href`:

```
/collections/french-fitness-pre-configured-rigs
  → /collections/pre-configured-rigs
/collections/french-fitness-rig-frame-pieces-customize-your-rig
  → /collections/rig-frame-pieces-customize-your-rig
/collections/french-fitness-rig-attachments-accessories
  → /collections/rig-attachments-accessories
```

Then, where the link text starts with "French Fitness", move those two words
outside the link so it reads `French Fitness <a …>Free Standing/Wall Mounted
Rigs</a>` — per Tim's approved prose-link rule. Leave neutral anchors like
"pull-up bar" alone apart from the href.

Group C lives under **Content → Metaobjects → Product Option Help Text**, in the
`help_text` field, same edits.

146 records by hand is a few hours and easy to get subtly wrong. The token route
is minutes. Recommend the script.
