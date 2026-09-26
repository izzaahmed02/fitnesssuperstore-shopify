# Hero retitle two-week Ads read

Tim's 2026-09-15 assignment in the retitle thread: the first real scoreboard
since the Sept 5 rebuild. Four Google Ads exports; Tim does the read himself and
decides what changes. This file is the spec and the pre-read verification, so
the numbers are not argued about after the fact.

## Window

**2026-09-10 through 2026-09-24 inclusive.**

Tim's email carries two dates. The bullet says "THIS FRIDAY 9/19"; the line
above it says "make it 9/10 to 9/24 ... so, please send me the results of this
then". The later instruction is the wider one and it governs: **9/19 is inside
the window, so pulling on the 19th would have reported a part-finished read.**

The window closes end of day Thursday 2026-09-24, so the exports are pulled
**Friday 2026-09-25**, not before. Pulling early understates every count.

## Why this window is a clean read

The titles went live 2026-09-08 and the freeze runs to 2026-10-06, so the whole
window sits inside a period where no approved string was allowed to change.
Two days of settling sit between go-live and the window opening.

Verified 2026-09-21, before the read:

| Check | Result |
| --- | --- |
| Approved title table unchanged since closeout | yes, byte-identical on all three branches carrying it (`b5fa450c`) |
| Shopify product titles on all ten | unchanged from the 2026-09-10 closeout reading |
| Shopify prices on all ten | unchanged ($2,499 to $3,299) |
| All ten ACTIVE, in stock, published to Google & YouTube | yes |

All ten products share an `updatedAt` of 2026-09-20T19:25:54Z, which is a bulk
sync touch rather than ten separate edits; titles and prices are unchanged
either side of it, so it does not confound the window.

## Access: granted 2026-09-21

Tim granted Google Ads access on 2026-09-21 and it was accepted the same day, so
the blocker recorded here previously is cleared. The exports are pullable.

Status: the window closed 2026-09-24 and the exports were due 2026-09-25. Tim
chased on the 23rd and again on the 25th. This is overdue, not blocked.

## Turning the exports into the read

`scripts/hero_retitle_ads_read.py` takes the four CSVs and produces the read,
so the numbers do not have to be eyeballed out of four spreadsheets:

```
python3 scripts/hero_retitle_ads_read.py \
    --products products.csv \
    --asset-groups asset_groups.csv \
    --search-terms search_terms.csv \
    --campaign campaign.csv
```

It handles the Google Ads export shape (title and date rows before the header,
`--` for empty metrics, thousands separators, trailing Total rows), and every
argument is optional so partial pulls still report.

What it adds beyond the raw exports:

- **Eligibility reconciled against the designed universe.** Served count against
  Tim's expected 230, against the 277 series-labelled rows in the v2 lookup, and
  against the old baseline of 33. Any shortfall is broken down per series so the
  gap has a shape rather than a single number.
- **All ten heroes checked for presence**, and named individually if any is
  absent from the product report, with their per-SKU metrics.
- **Asset groups against Tim's baselines**, Tahoe 23K and FFB 32K, as a percent
  change, with Monster and FSR marked too small to read alone.
- **The three watched search terms**, including which of `FFT-SLCLE` or
  `FFT-PLCLE` the ambiguous phrase actually landed on.
- **The budget question answered from lost impression share**, not from cost,
  since a campaign can finish under its cap on total spend and still be
  throttled on peak days.

Tested against synthetic exports in the real Google Ads shape: a 231-of-277 pull
(correctly reports the 46 gap and its per-series breakdown), a pull missing one
hero (names `FFT-ACD`), a campaign with no budget-lost share (reports the cap as
not binding), and a missing file (skipped, does not fail the run).

## The four exports

Google Ads, Product Lines campaign, date range set to **Sep 10 2026 – Sep 24
2026** on every one. Download as CSV. These are reads; nothing is changed in the
Ads account.

### 1. Product report — eligibility

Campaign > Product Lines > **Products** view. Columns: Item ID, Item title,
Custom label 3, Custom label 4, Impressions, Clicks, Cost, Conversions, Conv.
value. Segment by none.

What Tim is checking: eligible product count, expected around **230** against an
old baseline of **33**.

**Read the designed number alongside it.** The v2 label lookup carries a series
value on **277** of its 2,196 rows, and the Product Lines asset groups target on
series. So 277 is the designed universe and ~230 would be about 47 short of it.
That gap is worth naming in the same breath as the count, because Tim flagged on
2026-09-20 that the automated local feed had been serving **46 offers short for
two weeks, silently, with nothing comparing matched against designed**. The
numbers are close enough to be the same class of gap and too close to assume
they are unrelated. Not established either way; it is a question for the read,
not a finding.

Series breakdown of the designed 277, for reconciling against whatever the
export returns:

| Series | Rows | | Series | Rows |
| --- | --- | --- | --- | --- |
| FFB Black | 40 | | Vail | 5 |
| Tahoe | 38 | | SM200 | 4 |
| Marin | 37 | | Wall Mounted Cable Column | 4 |
| Napa | 36 | | Belt Squat | 3 |
| Shasta | 30 | | Monster | 3 |
| FFS Silver | 27 | | Stretch Cage | 2 |
| Rack & Rig | 18 | | UBE100 | 1 |
| FSR | 10 | | T900 | 1 |
| Telluride | 9 | | | |
| Diablo | 9 | | **Total** | **277** |

### 2. Asset group report — impressions vs baseline

Campaign > Product Lines > **Asset groups**. Columns: Asset group, Impressions,
Clicks, Cost, Conversions, Conv. value.

Baselines Tim is comparing against: **Tahoe 23K**, **FFB 32K**. Those two asset
groups are the ones carrying retitled heroes (six Tahoe, two FFB Black), so they
are the ones where a title effect should show if there is one.

Note when reporting: Monster and FSR each carry one retitled hero as well, but
those series are only 3 and 10 rows, so they are too small to read as a signal
on their own.

### 3. Search terms report — did the new titles win the phrases

Campaign > Product Lines > Insights and reports > **Search terms**. Columns:
Search term, Impressions, Clicks, Cost, Conversions. Filter to the window, then
search within the export for Tim's three phrases.

| Phrase Tim named | Hero it should be matching | Keyword phrase in the approved title |
| --- | --- | --- |
| leg press sled | FFT-LPSCR | Leg Press Sled Machine |
| 45 degree leg press | FFB-45DLLP | Leg Press Machine (title reads "45 Degree Leg Press Machine") |
| leg extension and curl machine | **FFT-SLCLE or FFT-PLCLE** | Leg Extension & Leg Curl Machine / Leg Curl & Leg Extension Machine |

The third phrase is ambiguous by construction: two of the ten heroes carry the
same two words in opposite order, seated selectorized versus prone. Report which
of the two the term actually landed on rather than treating a match as a pass,
because the two machines are not substitutes for a buyer.

### 4. Campaign report — is the cap binding

Campaign view, Product Lines row. Columns: Campaign, Budget, Cost, Impression
share lost (budget), Search impression share.

What Tim is checking: whether Product Lines is hitting its **$200** cap. If it
is, that triggers the Reman budget shift, which is his call and not ours to make.
Include "Impr. share lost (budget)" rather than cost alone, since a campaign can
sit under its cap on total spend and still be budget-throttled on peak days.

## Out of scope for this thread

Tim routed the rest elsewhere in the same email: the Phase 2 generator and
ID-diff live in the Phase 2 thread, the Oct 6 freeze-end items (April
supplemental purge, title batch 2, the two cleanup items) wait for the freeze,
and the YH Mobile p1_hero ad-group ladder is a separate Shopping change with
standing approval. Nothing in this file touches any of them.


## Correction, 2026-09-26: the FFT-ACD check was the wrong probe

Tim reports the new titles are live in Merchant Center on a product he checked,
against the finding that they had reverted. He is likely right, and the probe
was badly chosen.

What is still fact, re-tested and not a formatting artifact: in the Google Ads
Product report all ten heroes carry their pre-retitle title, every one of them
showing the old "Lifetime Frame Warranty" marker, and none of the distinctive
new-title phrases appears in any of the 3,651 rows under either merchant, under
dash- and case-insensitive normalisation.

What that most likely means, which is not what was first concluded: the Ads
Product report **Title** column renders the **primary feed** title rather than
the supplemental-merged serving title. Under that reading the export says
nothing about what Google actually serves, and the retitles are fine.

Why the Merchant Center spot-check did not catch it: the SKU chosen was
**FFT-ACD**, picked because it had by far the most impressions. FFT-ACD is the
one product in the ten carrying the **Edited** marker, flagged on 2026-09-10 and
still present. A manual Merchant Center edit takes precedence over every feed
source, so FFT-ACD can legitimately show the old title while the other nine show
the approved one. It was the single worst choice of probe in the set, and it was
chosen for traffic rather than for being representative.

Two things survive the correction and should not be dropped:

1. **FFT-ACD's labels are wrong.** The item shows `custom_label_3 = New_FF` and
   `custom_label_4 = tahoe series`, where v2 has `p1_hero` and `Tahoe Series`.
   That is a separate attribute from the title and it is what the Product Lines
   asset groups target. If the Edited marker is overriding labels as well as the
   title, it is doing real harm on a p1_hero SKU.
2. **The Edited marker is now demonstrably load-bearing**, not the housekeeping
   item it was queued as. It is the reason a frozen SKU can diverge silently from
   the feed, and it is exactly the divergence the Phase 2 cutover would inherit.

### The probe that actually settles it

Per SKU, in Merchant Center, expand **Raw data source attributes:
hero_titles_supplemental.csv** on the product page. That panel shows what that
one source contributes, independently of precedence. If it lists the approved
`title`, the source is applying and any old title on the page is something
overriding it. If the panel is empty or missing, the source is not applying.

Check three, not one, and make them representative rather than high-traffic:
one with the Edited marker (`FFT-ACD`), one without (`FFT-LPSCR`), and one from
the other series (`FFB-45DLLP`).
