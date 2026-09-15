# Boost compare-at emitter — written scope for the bounded live-app edit

Author: Izza | Date: 2026-09-15 | Status: **SCOPE ONLY — NOT EXECUTED**
Requested by Tim, 2026-09-14, item 3: written scope in the packet, execution gated on his approval
immediately before the edit runs.

## 1. Why this is still open after the deletion

Boost AI Search & Filter renders the collection and search grids app-side. Its card templates carry
two independent families that emit `As high as:`, and only one of them is cleared by the
`custom.retail_price` deletion. Both were read from live page source, so no app access was needed
to establish this (full capture in `pr784-prepublish-gate-2026-09-08.md` §4, Yusra, 8 Sep).

| Emitter | Reads | Cleared by the deletion? |
|---|---|---|
| Metafield | `metafield.key == 'retail_price'`, condition `metafield.value != blank` | **Yes.** Removing the 1,679 French Fitness values silences it, while the 450 non-French-Fitness values keep theirs — the intended outcome. |
| Compare-at | `variant.compare_at_price` → `compareAtPriceMin`, then `isSale` / `salePercent` / `savingPrice` | **No.** It never reads the metafield, so the deletion has no effect on it. |

Neither emitter is vendor-scoped. So Tim's step 4 as written — "after deletion, confirm Boost
collection and search cards no longer render 'As high as' for French Fitness" — will **fail** on the
compare-at products until this patch lands. The deletion and this edit are not alternatives; both
are required for a clean browse surface.

## 2. Scope

Measured by Yusra on 8 Sep: French Fitness products with at least one variant where
`compare_at_price > price` = **32** — ACTIVE (shopper-visible) **11**, UNLISTED 19, ARCHIVED 2.

Only the 11 ACTIVE products are shopper-visible, but the patch is vendor-scoped rather than
product-scoped, so it covers all 32 automatically and cannot go stale as statuses change.

These counts are from 8 Sep and are **rechecked immediately before execution**, per the same rule
applied to the deletion targets. A changed count is reported, not silently absorbed.

## 3. The change

One added clause per compare-at emitter, in the Boost card template:

```
and product.vendor != 'French Fitness'
```

Nothing else. Specifically **not** in scope:

- No change to the metafield emitter — the deletion handles it.
- No change to any non-French-Fitness brand. Legitimate compare-at markdowns on Nautilus,
  Body-Solid, Power Plate and everything else keep rendering exactly as they do now.
- No change to product data: no price, compare-at value, inventory, tag, collection membership,
  discount or metafield definition is touched.
- No global or untracked app setting change.

## 4. Before-state capture

Boost supports live template edits only — there is no unpublished duplicate surface for its card
templates. So before any edit:

1. Export the current template source for both compare-at emitters verbatim, to file, timestamped.
2. Screenshot one French Fitness collection page and one French Fitness search result page showing
   the `As high as` residue, plus one non-French-Fitness control page.
3. Record the product count matching `compare_at_price > price` under vendor = French Fitness at
   that moment.

The exported source is the rollback artefact. Nothing is edited before it exists.

## 5. Rollback

Restore the exported template source verbatim. The change is two added clauses, so the reverse is
removing them; the exported file is kept as the authoritative copy in case the editor reformats.
Rollback needs no deploy and no data change, and is independent of the theme release — it can run
whether or not #784 is published.

## 6. Proof after the edit

- One French Fitness collection page and one French Fitness search page: no `As high as`, no
  savings figure, selling price intact.
- The same non-French-Fitness control page: unchanged, markdown still rendering.
- One of the 11 ACTIVE compare-at products specifically, since those are the residue this edit
  exists to clear.
- Confirmation that the metafield emitter is also silent on French Fitness, which together with the
  deletion closes Tim's step 4.

## 7. Execution gate

Not executed. Per Tim's standing instruction, the exact patch, the captured before-state and the
rollback go to him for approval **immediately before** the edit runs, and the edit runs only on his
separate written GO. No untracked global edit.
