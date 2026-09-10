# PR #784 pre-publish gate, head `96013bd` — byte check PASS, publish still HOLD

Verifier: Yusra | Date: 2026-09-10 | Candidate: PR #784, head `96013bd4f3dd0b3315c868dd89230a648fdce063`
Preview: theme `188124725564` (UNPUBLISHED) | Production: theme `186120208700` (MAIN)
Assignment: Tim's 2026-09-08 revised sequence, step 2 — fresh byte check of the new head, and
confirm the merged candidate carries #819, #821 and the three local inventory feed files.

Supersedes the head-specific findings in `pr784-prepublish-gate-2026-09-08.md`. That record's
canary and deletion pre-flight sections still stand.

## 1. Byte check against the new head — PASS (25 of 25)

Every file in the manifest was read back from preview `188124725564` through the Admin API and
compared with the git blob at `96013bd`. Size and MD5 match on all 25.

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

CI green on this head: `cwv-regression` success, run 34310384708.

MAIN still has no `snippets/ff-permanent-compare-hidden.liquid`, so the guard remains unpublished,
and the `custom.retail_price` definition still reports 2,129 values, so no deletion has run and the
Sept 8 canary restore still holds.

## 2. Merged content confirmed present — PASS

The merge brought main in without disturbing the pricing work. Each file Tim named is identical in
the candidate and on `origin/main`:

| File | MD5 in candidate and on main | Change |
|---|---|---|
| `snippets/metaobjects-breadcrumbs.liquid` | `97b86b93903891e1c20d92698276b592` | #819 breadcrumbs |
| `assets/custom.css` | `a1820d5cf424b3ca570b1155021c21a8` | #819 styles |
| `sections/footer.liquid` | `af82a428d946c25d076cc7b32125a8cf` | #821 BBB URL |
| `snippets/local-inventory-tsv.liquid` | `aa3c445a4f8f669da079ced6f4249e65` | #813 feed |
| `snippets/local-inventory-offer-allowlist.liquid` | `a705c7d5a54f5608828796df6c7e3069` | #813 feed |
| `templates/collection.local-inventory-tsv.liquid` | `307cc97da2630cae59aee52f673ead97` | #813 feed |

## 3. The #824 merge and revert left no residue — PASS

The branch history shows `#824` (September Overstock card) merged at `fe62678` and reverted at
`96013bd`. The revert is complete:

- `git grep -il overstock refs/pull/784/head` returns nothing.
- The only file added since the merge base is the intended `snippets/ff-permanent-compare-hidden.liquid`.
- All 25 manifest MD5s are identical to the previously reviewed `f0883f0` content, so the pricing
  change itself has not drifted. The approved behaviour is unchanged; only merge commits were added.

## 4. BLOCKER — the head is 7 commits behind main again, and this time the files overlap

Izza merged main at `32fbaae` on Sept 9. Main has since moved to `2e4e4f4`:

```
git merge-base refs/pull/784/head origin/main  -> 32fbaae67989c032f95c4f40c7b0d494a3db1edf
git rev-list --count refs/pull/784/head..origin/main -> 7
```

Those 7 commits are #826 (Labor Day post-sale teardown) and #778 (Recent Gym Builds). Unlike the
Sept 8 case, three of them touch files that are also in #784's manifest:

| File | On main | In candidate | Effect of publishing the candidate |
|---|---|---|---|
| `snippets/labor-day-sale-note.liquid` | `6a2f0538` (7296 B, post-teardown) | `ae40c6c5` (7956 B) | reverts the teardown comment state |
| `config/settings_data.json` | `0a6b4680` (`sale_promo_ff` and `sale_promo_reman` blank) | `f763f2c6` (both hold Labor Day copy) | re-arms both campaign kill switches |
| `config/settings_schema.json` | `35e67cd2` | `5501c51d` | no functional change: the teardown's schema edit is in git main but the live theme still serves the pre-teardown `8ba2b814`, and `settings_data` overrides defaults anyway |

Publishing preview `188124725564` as MAIN would also revert the non-manifest half of those commits,
because publishing replaces the whole theme:

| File | On main | In candidate |
|---|---|---|
| `sections/header-group.json` | live `10c98c7b`, read in full: announcement bar has **no blocks** | `37eff073` (`labor_day_2026` block present) |
| `sections/announcement-bar.liquid` | `330acf85` (content gate) | `dd2f6dfb` (old date gate) |
| `sections/recent-gym-builds.liquid` | `f66927d3` | absent |
| `assets/recent-gym-builds.css` | `18d9f1bc` | absent |
| `templates/index.json` | `d413ca1f` | `d48da173` |
| `templates/page.homepage.json` | `e4cffb5b` | `0470531e` |
| `templates/page.about-us-new.json` | `cdf48138` | `7b884683` |

Two distinct consequences, stated separately because their severity differs:

1. **#778 reverts visibly.** The Recent Gym Builds section and its stylesheet disappear and the
   homepage templates return to the Instafeed version. The template and section revert together, so
   nothing breaks, but the homepage silently goes back a version.
2. **The Labor Day teardown is partly undone, latently rather than visibly.** `settings.laborday_end` is
   `2026-09-09T00:00:00-07:00`, now past, and both the PDP snippet and the old announcement bar gate
   on that window, so no campaign messaging would reappear on publish. What does happen is that the
   `labor_day_2026` announcement block returns to `header-group.json`, which the live theme has
   cleanly removed, and `sale_promo_ff` and `sale_promo_reman` are refilled with the Labor Day copy,
   which the live theme has blanked. Those two settings are the snippet's per-branch kill switches,
   so the expired campaign ends up one date or force-preview toggle away from firing. That half of
   the teardown would need doing again.

Remedy is the same as before and still mechanical: merge main into the branch again, re-run CI,
resync the preview, and re-check. That changes the head SHA, so it needs a fresh approval.

To stop this recurring a third time, the merge and the publish should happen inside the same
window, or merges to main should pause until #784 publishes. The branch has now fallen behind twice
in three days, and each lap costs an approval and a byte check.

## 5. Dependency to keep in order — PR #825

PR #825 (September Overstock card) is based on `french-fitness-pricing-t00jki`, not `main`, and its
recorded base is this candidate's head. Merging it before #784 publishes changes #784's head SHA and
voids both the approval and this byte check. Its own description says so and carries the checklist,
including returning `overstock_force_preview` to `false`. Retarget it to `main` after #784 lands.

## 6. Post-sale check, live on MAIN today

| Criterion | Result |
|---|---|
| Labor Day campaign messaging gone | PASS. FSR90, Tahoe Power Cage and E500 all render no campaign card and no "in cart" figure. Both Labor Day automatic discounts are no longer active. |
| Permanent fake MSRP absent | FAIL, as expected while the guard is unpublished. Tahoe still shows `You save $1,300.00` with 7 `As high as:`, E500 `You save $1,100.00` with 6, FSR90 5 in related strips. |
| `Up to 60% off MSRP` copy | Still present on every page. Still awaiting the decision on the scoped three-placement removal. The header-strip instance is block `item_wLffwf` in the live `header-group.json` header block order, removable in the theme editor with no deploy. |

The September Overstock discount remains ACTIVE through Sept 30 23:59:59 PT on its 16 products, with
no card on the page until #825 ships, so those products still discount silently at checkout.

## 7. What was not changed

No theme published or edited. No product, price, compare-at value, inventory, tag, discount,
metafield value or metafield definition changed. No cart or order created. All Shopify calls were
Admin API reads; storefront checks were plain cache-busted GETs.
