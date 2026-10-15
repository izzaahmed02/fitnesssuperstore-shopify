# Fitness Superstore — search relevance evidence extract
Store 79ef8b-5e.myshopify.com. Captured 2026-10-14 01:54 UTC via the Boost search API,
logged out, no session, relevance sort, no filters, page 1, limit 10.
Current configuration at capture: Search Personalization enabled on the search page,
Semantic Search impact weight 50%, Description searchable.

This extract is for sharing with Boost support. It contains query results only.

## 1. Wrong weights and multi-weight sets outrank the exact weight

Query: **45 kettlebell** — 61 results

| Rank | Product |
|---|---|
| 1 | French Fitness Cast Iron Kettlebell Set 5-50 lbs (New) |
| 2 | French Fitness Cast Iron Kettlebell 70 lbs (New) |
| 3 | French Fitness Cast Iron Kettlebell Set 5-70 lbs (New) |
| 4 | French Fitness Cast Iron Kettlebell 115 lbs (New) |
| 5 | French Fitness Cast Iron Kettlebell Set 5-30 lbs (New) |
| 6 | French Fitness Vinyl Kettlebell 60 lbs (New) |
| 7 | French Fitness Cast Iron Kettlebell 35 lbs (New) |
| **8** | **French Fitness Cast Iron Kettlebell 45 lbs (New)** |
| 9 | French Fitness Cast Iron Kettlebell 75 lbs (New) |
| 10 | French Fitness Vinyl Kettlebell 40 lbs (New) |

The exact-weight product is at rank 8. The second 45 lb kettlebell, French Fitness Vinyl
Kettlebell 45 lbs, does not appear in the top ten at all. Ranks 1 to 7 are multi-weight sets
or other weights.

## 2. A weight-specific query returns only sets, and no individual product

Query: **bumper plate 45-pound** — 9 results

All nine results are plate-and-bar sets. Not one individual 45 lb bumper plate is returned,
although individual 45 lb bumper plates exist and are active and published.

| Rank | Product |
|---|---|
| 1 | French Fitness Olympic Bumper Plate Set w/7 ft Olympic Bar 415 lbs - Crumb Rubber (New) |
| 2 | French Fitness Olympic Bumper Plate Set w/7 ft Olympic Bar 325 lbs - Crumb Rubber (New) |
| 3 | French Fitness Olympic Bumper Plate Set w/7 ft Olympic Bar 235 lbs - Crumb Rubber (New) |
| 4 | French Fitness Olympic Bumper Plates Set w/7 ft Olympic Bar 285 lbs - Crumb Rubber (New) |
| 5 | French Fitness Olympic Bumper Plates Set w/7 ft Olympic Bar 515 lbs - Crumb Rubber (New) |
| 6 | French Fitness Olympic Bumper Plates Set w/7 ft Olympic Bar 425 lbs - Crumb Rubber (New) |
| 7 | French Fitness Olympic Bumper Plate Set w/7 ft Olympic Bar 415 lbs + Bench - Crumb Rubber (New) |
| 8 | French Fitness Olympic Bumper Plate Set w/7 ft Olympic Bar 325 lbs + Bench - Crumb Rubber (New) |
| 9 | French Fitness Olympic Bumper Plate Set w/7 ft Olympic Bar 235 lbs + Bench - Crumb Rubber (New) |

Note the contrast with "45 kettlebell" above, which returns 61 results. The same numeric
intent behaves very differently by category and by unit wording.

## 3. A common category term returns nothing

Query: **assault bike** — 0 results

## 4. An exact product name does not return that product in the top ten

Query: **French Fitness Rubber Coated Hex Dumbbells** — 52 results

The product with exactly that title exists, is active and is published to the online store.
It is not in the top ten of its own exact-title query. The top ten are individual weights and
sets from the same family.

## 5. An exact product name is outranked by a different product class

Query: **French Fitness FFS Silver Dual Adjustable Pulley** — 19 results

| Rank | Product |
|---|---|
| 1 | French Fitness Shasta Seated Leg Curl / Leg Extension (New) |
| 2 | French Fitness FFS Silver 4 Stack Multi Jungle Gym (New) |
| 3 | French Fitness FFS Silver Triceps Press Seated Dip (New) |
| **4** | **French Fitness FFS Silver Dual Adjustable Pulley (New)** |
| 5 | French Fitness Shasta Lat Pulldown / Low Row Selectorized Machine (New) |

The exact-title product is at rank 4, behind a leg curl machine, a jungle gym and a triceps
press. All are different product classes from a dual adjustable pulley.

## What we are asking
These are the behaviours we want to measure before and after a controlled ranking test. We
are not asking for changes to be made to the store.
