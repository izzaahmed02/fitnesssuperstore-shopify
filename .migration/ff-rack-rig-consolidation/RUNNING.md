# Running the group B + C payloads

Groups A (breadcrumbs), D (HTML sitemap) and E (category index) are already applied.
This covers only the two remaining groups:

- **B** — 95 product descriptions → `payloads/products_NEW.bulk.jsonl`
- **C** — 74 `product_option_help_text` records → `payloads/optionhelp_NEW.bulk.jsonl`

Each line is the GraphQL variables object for one mutation, ready for
`bulkOperationRunMutation`. Nothing else needs to be generated.

Requires an Admin API access token with `write_products` and `write_metaobjects`.
Do not commit the token.

```bash
SHOP=79ef8b-5e.myshopify.com
VERSION=2025-07
TOKEN=...          # Admin API access token

gql() { curl -sS -X POST "https://$SHOP/admin/api/$VERSION/graphql.json" \
  -H "X-Shopify-Access-Token: $TOKEN" -H 'Content-Type: application/json' \
  --data-binary @- ; }
```

Run B first, wait for it to finish, then run C. Shopify allows only one bulk
operation at a time.

## 1. Stage the file

```bash
FILE=payloads/products_NEW.bulk.jsonl      # then repeat with optionhelp_NEW.bulk.jsonl

jq -n --arg f "$(basename "$FILE")" '{query:"
  mutation($input:[StagedUploadInput!]!){
    stagedUploadsCreate(input:$input){
      stagedTargets{ url parameters{ name value } }
      userErrors{ field message }
    }
  }", variables:{input:[{resource:"BULK_MUTATION_VARIABLES",filename:$f,
       mimeType:"text/jsonl",httpMethod:"POST"}]}}' | gql
```

POST the file to the returned `url`, sending every returned parameter as a form
field **before** the `file` field, then keep the `key` parameter value — that is the
`stagedUploadPath`. Expect HTTP 201.

```bash
curl -sS -o /dev/null -w '%{http_code}\n' -X POST "$URL" \
  -F Content-Type=text/jsonl -F success_action_status=201 -F acl=private \
  -F key="$KEY" -F x-goog-date="$DATE" -F x-goog-credential="$CRED" \
  -F x-goog-algorithm=GOOG4-RSA-SHA256 -F x-goog-signature="$SIG" \
  -F policy="$POLICY" -F "file=@$FILE"
```

## 2. Run the bulk mutation

Group B:

```bash
jq -n --arg p "$KEY" '{query:"
  mutation($m:String!,$p:String!){
    bulkOperationRunMutation(mutation:$m, stagedUploadPath:$p){
      bulkOperation{ id status } userErrors{ field message }
    }
  }", variables:{p:$p, m:"mutation call($product: ProductUpdateInput!) { productUpdate(product: $product) { product { id } userErrors { field message } } }"}}' | gql
```

Group C — same call, with:

```
mutation call($id: ID!, $metaobject: MetaobjectUpdateInput!) { metaobjectUpdate(id: $id, metaobject: $metaobject) { metaobject { id } userErrors { field message } } }
```

## 3. Poll to completion

```bash
echo '{"query":"{ currentBulkOperation(type: MUTATION) { id status objectCount errorCode url partialDataUrl } }"}' | gql
```

`status: COMPLETED` with `errorCode: null`. Download `url` and confirm no line
contains a non-empty `userErrors`.

## 4. Verify

Run the four verification exports in `README.md` and grep for:

```
french-fitness-(rack-rig-systems|pre-configured-rigs|rig-frame-pieces-customize-your-rig|rig-attachments-accessories|racks-w-rig-rack-attachment-compatibility)
```

Expected after B and C: zero hits in products and in `product_option_help_text`.
The only remaining hits store-wide should be records owned by the five source
collections themselves (their own descriptions, `index_collections`,
`related_collections`, and 4 subcategory-button metaobjects) — allowed pre-unpublish.

Then tell Saliha/Zafran the targeted JavaScript-rendered pre-cutover crawl can run.

## Rollback

Same procedure, substituting `products_ROLLBACK.bulk.jsonl` and
`optionhelp_ROLLBACK.bulk.jsonl`. Those restore the exact pre-edit
`descriptionHtml` and `help_text` values captured 2026-07-31.

For the already-applied groups, see the rollback sections in `README.md`.
