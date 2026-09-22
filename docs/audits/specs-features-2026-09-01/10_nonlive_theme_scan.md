# 10 — Non-live theme scan: results

Closes coverage gap 3 from `09_phase0_closing_the_coverage_gaps.md`. Run 2026-09-01.

**Scope:** all **80** themes in the store — 1 MAIN, 2 DEVELOPMENT, 77 UNPUBLISHED. Every theme's
`templates/product*.json`, `sections/*extra-info*.liquid` and `sections/main-product*.liquid` was
pulled via the Admin API (`OnlineStoreTheme.files { body }`) and matched for
`features_specs.value.<key>`.

Read-only. No theme was edited, published or deleted.

**Result: 14,015 bindings across all 80 themes. Every theme binds `specs_features`** — expected,
since the dev themes are branches of live.

## The finding: one field slated for deprecation is bound in an in-progress design

| Field | Bindings | Themes | Verdict |
|---|---|---|---|
| `downloads_other_info` | **0** | 0 | Safe to deprecate. Bound nowhere, in any theme. |
| `exercises` | **2** | **2** | **NOT safe to deprecate — see below.** |
| `list` | 864 | 80 | Rename touches every theme. |
| `shipping_dims_weight_2` | 864 | 80 | Rename touches every theme. |
| `shipping_dims_weight` | 82 | 80 | Merge touches every theme. |

### `exercises` is live in a new PDP design

```
theme 187750777148  [UNPUBLISHED]  fitnesssuperstore-shopify/pdp-ayyaz-new
theme 187010974012  [DEVELOPMENT]  Development (bff609-Ayyazs-MacBook-Pro-2)
   templates/product.pdp-new.json:55
```

Both are the same work-in-progress: a rebuilt PDP with an `info_tab` block set titled **"Exercises"**:

```json
"info_tab_exercises": {
  "type": "info_tab",
  "settings": {
    "tab_title": "Exercises",
    "source": "custom",
    "content": "{{ product.metafields.custom.features_specs.value.exercises | metafield_tag }}"
  }
}
```

`exercises` is bound in **no other theme**, including live — it is the only field key bound anywhere
in the store that the live theme does not bind. That is exactly the pattern the packet flagged as a
deprecation risk: a field that looks dead against the live theme, but that an unpublished design is
being built on.

**Consequence: item B4 of the migration plan must change.** It proposed deprecating both
`downloads_other_info` and `exercises` because neither is bound in the live theme. That holds for
`downloads_other_info`. For `exercises` it is wrong — deprecating it would break Ayyaz's PDP
rebuild the moment it publishes, and would silently empty the "Exercises" tab.

**Recommended:** deprecate `downloads_other_info` only. Leave `exercises` in place and ask Ayyaz
whether the new PDP is going ahead. If it is, `exercises` is a *live* field with one populated record
(`french-fitness-fsr-90-functional-trainer-smith-squat-rack-machine-new`) and needs content, not
removal.

## The renames are an 80-theme change, not a live-theme change

`list`, `shipping_dims_weight_2` and `shipping_dims_weight` are bound in **all 80 themes**. Migration
items B2 and B3 add a new key, backfill, repoint bindings, then drop the old key — repointing 864
bindings in live is one job, but every unpublished theme keeps the old key and silently renders blank
for those fields once the old key is dropped.

Two workable answers, both for Tim/Izza rather than for this audit:

1. **Prune first.** 77 unpublished themes for one store is the real problem. Most are dated one-off
   branches (`usman-26-march`, `avis-removal-20-jan`, `Blog-Fix-16-APR-Waqas`). Delete the dead ones,
   then the rename only has to chase the few that survive.
2. **Accept the staleness.** Treat unpublished themes as disposable and require a rebase from live
   before any of them is published. This is only safe if it is an actual rule people follow.

Doing neither means a rename that quietly breaks whichever dev theme gets published next.

## Files

- `10_nonlive_theme_scan.csv` — the 1,812 at-risk bindings (theme, role, field, file, line)
- `10_nonlive_theme_scan_full.csv` — all 14,015 bindings, for reference

## Method

80 themes fetched in 16 batches of 5 via `nodes(ids: […]) { … on OnlineStoreTheme { files(filenames:) } }`;
glob patterns in `filenames` are supported, so `templates/product*.json` works. Bodies were matched
locally with `features_specs\.value\.([a-zA-Z_0-9]+)` and line numbers computed from the file body.

**Known limit of this scan:** it covers product templates and the extra-info / main-product sections
— the places bindings actually live in this theme family. A binding hidden in some other snippet or
section in a dev theme would not be caught. For the deprecation decision that is sufficient, because
the question was whether any theme binds the at-risk keys, and the two that matter were found.
