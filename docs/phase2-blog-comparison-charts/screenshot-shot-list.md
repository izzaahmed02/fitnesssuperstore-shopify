# Screenshot shot list (Phase 2, Shopify data side)

The data findings in this packet are evidenced by `evidence-live-url-checks.csv`,
which is the raw HTTP result for all 397 live URL checks (317 chart row product URLs
plus all 80 published article URLs). That is the primary evidence for A3, A4 and B6.

Screenshots are still worth attaching for the three findings a reviewer will want to
see with their own eyes. All are current-state ("before"); there is no "after" yet
because nothing has been executed.

| # | Shot | URL | Capture |
|---|---|---|---|
| 1 | Dead chart row | https://www.fitnesssuperstore.com/products/stairmaster-sm5-stepmill-tse-1-w-10-touch-screen-remanufactured | 404 page, desktop. Keep the address bar visible |
| 2 | Correct live product | https://www.fitnesssuperstore.com/products/stairmaster-sm5-stepmill-tse-1-w-10-touch-screen-tv-remanufactured | Product page loading, desktop. Shows the fix is a one-character handle correction |
| 3 | Stale chart row | https://www.fitnesssuperstore.com/products/true-fitness-cs900-treadmill-w-emerge-console-remanufactured | Desktop, with DevTools Network open so the 301 to the Transcend handle is visible |
| 4 | Duplicate chart A | https://www.fitnesssuperstore.com/pages/precor-amt-model-comparison-chart-what-is-open-stride | Desktop, full page |
| 5 | Duplicate chart B | https://www.fitnesssuperstore.com/pages/precor-elliptical-comparison-chart | Desktop, full page. Side by side with #4 this shows the identical six AMT rows |
| 6 | Wrong card counts | https://www.fitnesssuperstore.com/pages/comparison-charts | Desktop, cropped to the French Fitness MSC/FSR, Precor Consoles and Rowing Machines cards |
| 7 | Hub before state | https://www.fitnesssuperstore.com/pages/comparison-charts | Desktop 1440 and mobile 390, for the before half of the before/after pair |
| 8 | Hub before state | https://www.fitnesssuperstore.com/pages/blog | Desktop 1440 and mobile 390, same purpose |

Shots 7 and 8 overlap with the layout work (A1, A2, B2), which is Waqas's and Sagi's
lane, so they will produce the matching "after" pair.
