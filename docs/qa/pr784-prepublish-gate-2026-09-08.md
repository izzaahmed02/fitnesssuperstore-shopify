# PR #784 pre-publish gate + retail_price deletion pre-flight — verdict: HOLD on publish, deletion not executed

Verifier: Yusra | Date: 2026-09-08 | Candidate: PR #784, head `f0883f097267c439e027602849530b16220f32b5`
Preview: theme `188124725564` (UNPUBLISHED) | Production: theme `186120208700` (MAIN)
Authorisation: Tim's 2026-09-08 publication approval, which covers `f0883f0` only.

Follows `docs/qa/pr784-exact-head-delta-qa-2026-09-07.md` (PR #820). That delta QA still stands.
This record covers only the pre-publish checks assigned for today and the state of the
approved `custom.retail_price` deletion.

## 1. Byte-identity re-verification — PASS (all 25 files)

Every file in the PR manifest was read back from preview `188124725564` through the Admin API and
compared against the git blob at `f0883f0`. Size and MD5 match on all 25, with no exceptions.

| File | Bytes | MD5 |
|---|---|---|
| `assets/product-info.js` | 17781 | `6b04b101e093ced1e76097e43cf69b5b` |
| `config/settings_data.json` | 18471 | `f763f2c6156ed59c4a70b5dc16be917b` |
| `config/settings_schema.json` | 45987 | `5501c51d7c1ed5c4c93e3b292160cc56` |
| `sections/extra-info.liquid` | 36857 | `5722f88938abf22340c93ea298e229bf` |
| `sections/featured-product.liquid` | 64707 | `3d764ab6f43a652b2d0e5794c930eac1` |
| `sections/homepage-popular-fitness.liquid` | 13046 | `f2cdefae82322a002ab65124aca2bf12` |
| `sections/main-product-comb.liquid` | 202657 | `a9fa39879df7d8ae8829c06567bbb84f` |
| `sections/main-product-home-gym-packages.liquid` | 213151 | `9030172cdd7bc8733f328c2c5daf7a1f` |
| `sections/main-product-variants.liquid` | 202481 | `90097278597c4737cfdd9af57f26dd7a` |
| `sections/main-product.liquid` | 199493 | `0908dc8e49d753c9aa7449f50a22f80d` |
| `snippets/card-product.liquid` | 34815 | `b6664208e9f8f809cf358bf051387859` |
| `snippets/ff-permanent-compare-hidden.liquid` | 2557 | `dff1cad18d715c19ff3ea9799f4a08ea` |
| `snippets/homepage-product-items-home.liquid` | 8203 | `47522ad27815fa2e35b091fb65ad1068` |
| `snippets/labor-day-sale-note.liquid` | 7956 | `ae40c6c5196d6dea870f33ff2de8aee4` |
| `snippets/price.liquid` | 7272 | `4190c5d88ab4b615dad7a7812b93f462` |
| `snippets/product-add-ons.liquid` | 39019 | `735d5e3835c19f57e4870308596a76f3` |
| `snippets/product-card.liquid` | 34879 | `f61271d2c6c886d1bd71282dc6f225fa` |
| `snippets/product-item.liquid` | 7023 | `0e7cdfc30623535d72dfd271bff7a53e` |
| `snippets/product-items-home.liquid` | 12521 | `4045d9a5d0a15b9406b32e5003ef1b98` |
| `snippets/quick-order-list-row.liquid` | 21908 | `0f94cb578f81cef2219eaa827c1d9a01` |
| `snippets/quick-order-list.liquid` | 12970 | `e452709366066fa3c599529d497c4676` |
| `snippets/related-items-colln.liquid` | 2490 | `ad48d1d407da469976d3d675112ce27b` |
| `snippets/related-items.liquid` | 5057 | `94597d758533510abdd4646ce7b0341c` |
| `snippets/schema-product.liquid` | 21888 | `f2a71543878261ff04a8fc8d2460f642` |
| `snippets/super-sale.liquid` | 3769 | `1d2b8ade53ce2c48819b0da7aeb19d64` |

MAIN is still unguarded, re-confirmed today: `snippets/labor-day-sale-note.liquid` MD5
`f70ac563178e948a4f2bc3643c343e12` (the pre-patch file) and no
`snippets/ff-permanent-compare-hidden.liquid` present.

Also re-checked at this head: every `custom.retail_price` output path in the four product
templates sits inside a `hide_perm_price` guard (`main-product.liquid` 234/899,
`main-product-comb.liquid` 240/762, `main-product-variants.liquid` 307/829,
`main-product-home-gym-packages.liquid` 383/425/1154/1196/1273). No unguarded emitter remains
in theme source.

## 2. BLOCKER — the branch is 17 commits behind main; publishing this theme regresses live work

```
git merge-base refs/pull/784/head origin/main  -> 24d92ffb3cac364b9b802f9688ae1048cc349b3e
git rev-list --count refs/pull/784/head..origin/main -> 17
origin/main -> 32fbaae67989c032f95c4f40c7b0d494a3db1edf
```

Preview `188124725564` mirrors `f0883f0`, so it carries the pre-#813/#819/#821 state of every file
main has moved since the merge base. Publishing it as MAIN today would roll back, on the live
storefront:

| File | Preview (would go live) | MAIN today | Change being reverted |
|---|---|---|---|
| `snippets/metaobjects-breadcrumbs.liquid` | 2610 B `9c5fe0f9293a584bd9a31b67ddcd9b7e` | 4436 B `97b86b93903891e1c20d92698276b592` | #819 mobile PDP breadcrumbs |
| `assets/custom.css` | 68764 B `23854bf070bd7f2d68f7b01530d43b84` | 72512 B `a1820d5cf424b3ca570b1155021c21a8` | #819 breadcrumb styles |
| `sections/footer.liquid` | 20475 B `2cb295c638ec3acbc32932424c76acd7` | 20493 B `af82a428d946c25d076cc7b32125a8cf` | #821 BBB canonical URL |
| `templates/collection.local-inventory-tsv.liquid` | absent | present | #813 Local Inventory Ads feed |
| `snippets/local-inventory-tsv.liquid` | absent | present | #813 |
| `snippets/local-inventory-offer-allowlist.liquid` | absent | present | #813 |

The three missing feed files matter most: the Local Inventory Ads feed is served from a theme
template URL, so publishing this theme takes that feed offline.

Remedy is clean. The 25 PR files and the 7 main-side files do not overlap at all, so merging main
into the branch is conflict-free:

```
comm -12 <(git diff --name-only 24d92ff..refs/pull/784/head | sort) \
         <(git diff --name-only 24d92ff..origin/main        | sort)   -> (empty)
```

Merge main in, re-run CI, resync the preview, and the head SHA changes — which per Tim's own
condition needs a fresh approval and a fresh byte-identity check.

## 3. Deletion pre-flight — target list verified, nothing deleted

Two independent bulk reads of `vendor:'French Fitness'` returned identical target sets.

- French Fitness products live: **1,721** (exact)
- Carrying a populated `custom.retail_price`: **1,679** — matches the approved backup count exactly
- Carrying no such metafield: 42
- The vendor count moving 1,720 -> 1,721 did not add a target; the new record has no retail_price

Scope cross-check against the definition itself (`gid://shopify/MetafieldDefinition/93546873148`,
`metafieldsCount` 2129):

| Set | Count |
|---|---|
| Populated `custom.retail_price` storewide | 2,129 |
| French Fitness (the approved deletion list) | 1,679 |
| Non-French-Fitness, must not be touched | 450 |

The 450 include Nautilus (118), GoldenDesigns (111), SportsArt (64), Star Trac (57),
Dynamic Cold Therapy (27), Stairmaster (19), Throwdown (14). The deletion list is vendor-scoped,
so none of them can enter it.

Three targets hold a nonsense value of `-100` (-$1.00): `french-fitness-rubber-grip-olympic-plate-100-lbs-black-new`
(ARCHIVED), `french-fitness-free-standing-rig-12-new` and `-13-new` (both UNLISTED). They delete
like any other target; noted only so they are not read as a failure in the readback.

An independent full-fidelity backup of all 1,679 values was taken today and held outside this repo
(product GID, numeric ID, handle, status, type, metafield GID, value in cents and dollars):
`FF_retail_price_backup_live_2026-09-08.csv`, 309,729 bytes,
SHA-256 `8eca5598cfbda3aaa0c6fae702a2977ba185238f5061f45cf2f7ae14694eaee1`.
Value-pair digest (`numeric_id,cents` sorted by ID) SHA-256
`4f94bee59a6c15e623ec5707f398eb1c95669e04cbefd40165f3b8b8d3c10884` — reconcile the Sept 5 backup
against this digest before running.

Execution is prepared but **not run**: 68 batches of at most 25 `MetafieldIdentifierInput`
(`ownerId`, `namespace: custom`, `key: retail_price`) for `metafieldsDelete`, plus a matching
68-batch `metafieldsSet` restore payload built from the backup. Nothing definition-level is
touched; `metafieldsCount` should read 450 afterwards.

Not executed because the sequence gates it: the guard is not published and therefore cannot be
verified live, and the publish itself is blocked by section 2.

## 4. Boost emitters read from live page source, and step 4 will not pass on deletion alone

The Boost card templates ship inside the storefront page source, so both emitters could be read
directly today without app access. Verbatim from a live French Fitness PDP:

```liquid
<div class="price-combined">{% for metafield in product.metafields %}
  {% if metafield.key == 'retail_price' and metafield.value != blank %}
    <div class="retail-price">
      As high as: <span class="js-retail-price" data-cents="{{ metafield.value }}"></span>
    </div>
  {% break %}
  {% endif %}{% endfor %}
```

Neither emitter is vendor-scoped, which confirms Blocker 1. Two consequences:

1. **The metafield emitter does clear on deletion.** Its condition is `metafield.value != blank`,
   so removing the 1,679 values silences it for French Fitness while the 450 non-French-Fitness
   values keep theirs, which is the intended outcome.
2. **The compare-at emitter does not.** The second family computes `compareAtPriceMin` from
   `variant.compare_at_price`, derives `isSale` / `salePercent` / `savingPrice`, and emits
   `As high as: {{ compareAtPriceWithFormat }}` with a savings figure. It never reads the
   metafield, so deletion has no effect on it.

Measured scope of that residue:

- French Fitness products with at least one variant where `compare_at_price > price`: **32**
- of those, ACTIVE (shopper-visible): **11**; UNLISTED 19; ARCHIVED 2

So step 4 as written ("after deletion, confirm Boost collection and search cards no longer render
'As high as' for French Fitness") will fail on those 11 ACTIVE products until the vendor-scoped
Boost patch lands. The deletion and the Boost edit are not sequential alternatives here; both are
required for a clean browse surface. The patch itself looks like one added clause per emitter
(`and product.vendor != 'French Fitness'`), but it is a live-app change and stays with Izza under
your immediate-approval rule.

## 4b. Current live state, for the record

Read from production MAIN today, before any publish:

| Surface | Live now |
|---|---|
| E500 PDP | `Sold out`, price $2,499.00, permanent `You save $1,100.00`, and the Labor Day card still advertising `$2,249.10 in cart` on an out-of-stock item |
| Tahoe Power Cage PDP | 7 x `As high as:`, 2 x `You save` |
| FSR90 PDP | 5 x `As high as:` (from related/add-on strips; FSR90 itself carries no `retail_price`) |
| Every page | `Up to 60% off MSRP` header copy still present |

Local Inventory Ads feed, checked directly:
`https://www.fitnesssuperstore.com/collections/french-fitness-showroom-products?view=local-inventory-tsv`
returns HTTP 200 with 222 data rows today. It is served by
`templates/collection.local-inventory-tsv.liquid`, which is one of the three files missing from the
preview theme, so publishing that theme replaces this feed with a 404 page.

## 5. Timing finding — a second French Fitness discount runs past tonight

`gid://shopify/DiscountAutomaticNode/1741840056636` — "September Overstock Sale — 10% Off Select
French Fitness Products", ACTIVE, `2026-09-08T07:00:00Z` to `2026-10-01T06:59:59Z`
(Sept 8 00:00 PT to Sept 30 23:59:59 PT), 10% off 16 named French Fitness products, does not
combine with other product discounts.

The two Labor Day discounts end `2026-09-09T06:59:59Z` (tonight 23:59:59 PT) and the theme card is
bounded by `settings.laborday_end = 2026-09-09T00:00:00-07:00`, so from tomorrow the card stops
rendering while this discount keeps applying at checkout on those 16 products with nothing on the
page disclosing it. The set includes FSR90 and the Tahoe Power Cage, the two acceptance products in
this release: FSR90 would display $3,299.00 and charge $2,969.10.

Today the two 10% discounts overlap on those 16 products, but both are 10% and they do not combine,
so the charged amount is unaffected.

Consequences worth deciding before publish:
1. "No value after tonight" does not hold for the availability fix or the campaign plumbing; a
   live French Fitness promotion continues for three more weeks.
2. The Sept 9 post-sale check as written ("plain prices correct") will pass on the PDP and still be
   wrong at the cart on those 16 products.
3. Either give the overstock sale its own bounded card, or move its window, or accept an
   undisclosed checkout discount through Sept 30.

## 6. What was not changed

No theme published or edited. No product, price, compare-at value, inventory, tag, discount,
metafield value or metafield definition changed. No customer contact. No order placed. All reads
were Admin API reads and read-only bulk queries; the two write-shaped calls used
(`bulkOperationRunQuery`) only start read jobs.
