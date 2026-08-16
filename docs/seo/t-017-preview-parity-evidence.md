# T-017 — customer-script parity on the connected isolation theme

**Prepared by:** Zafran · **Date:** 2026-08-16
**Relates to:** issue #716, draft PR #723, branch `claude/core-web-vitals-mobile-vwzm5w`
@ `fe990b6b`, isolation theme `gid://shopify/OnlineStoreTheme/187691401532`
**Status: VALIDATING.** Nothing here is a pass, a fix, or a predicted outcome.
**No production change.** Every request below is a read of an already-published or
already-connected surface. No write, publish, app change or configuration change was made.

## Why this exists

Every valid baseline run has to prove it exercised the normal customer script path. The
precondition recorded on #716 is that `gorgias-chat-widget-install-v3` and
`convert-bundle-loader` must both appear in a run, or the run is excluded from the medians.
Before spending runs on that, it is worth proving the connected preview actually serves the
gate-free theme to an ordinary visitor — not just that the theme *file* matches the branch.

The checksum evidence already posted on #716 compares `layout/theme.liquid` in Git against
the same file read back through the Admin API. This adds the end-to-end half: what the
storefront returns to a request on the preview URL.

## Method

Two `GET` requests for the same product URL, one against the published theme and one with
`?preview_theme_id=187691401532`, both sent with the pinned desktop user agent
(`Chrome/141.0.0.0`, from Chromium **141.0.7390.37**, the build recorded on #716). Served
HTML compared for the gate strings and for the vendor-injection machinery.

URL: `/products/concept2-skierg-w-pm5-console-new` — the example URL for the largest of the
three mobile LCP groups (909 URLs, 2.5s).

## Result

| String in served HTML | MAIN (published) | Isolation theme `187691401532` |
|---|---|---|
| `Chrome-Lighthouse` | **1** | **0** |
| `Page Speed Insights` | **1** | **0** |
| `injectNonCriticalVendors` | 4 | 4 |
| `gorgias-chat-widget-install-v3` | 2 | 2 |
| `convert-bundle-loader` | 2 | 2 |
| `cdn.9gtb.com` | 1 | 1 |
| `convertexperiments.com` | 1 | 1 |
| HTTP status | 200 | 200 |
| Bytes | 1,228,798 | 1,253,416 |

**What this establishes.** The preview URL serves the branch's theme end to end: the
synthetic-client early return is absent from what the isolation theme returns, and present
in what MAIN returns. The vendor-injection machinery is byte-for-byte present on both, so
the only behavioural difference is *who* it runs for. A synthetic client hitting the
preview will now be given the same Gorgias and Convert path a customer gets, which is the
condition the CWV baseline depends on.

**What this does not establish.** This is served-HTML evidence, not runtime evidence. It
does not show that the scripts actually loaded, what they cost, or any Core Web Vitals
figure. The byte difference between the two responses is not solely the five removed lines
— a storefront response carries per-request variation — so it is reported as an observation,
not as a diff measurement. The file-level proof of exactly five removed lines is the
checksum comparison already on #716.

## Blocker on the runtime baseline

The desktop-first ten-URL baseline (three runs per URL per device, medians, LCP subparts,
script count, render-blocking resources, third-party main-thread cost, INP/TBT, CLS) has
**not** been run and cannot be run from this environment: headless Chromium has no outbound
network access here. `net::ERR_CONNECTION_RESET` on every navigation, including to unrelated
hosts and with the session proxy configured explicitly, while `curl` to the same origin
succeeds. So the constraint is the browser sandbox, not the site, the proxy policy or the
preview.

That leaves the runtime baseline where it already sat — with Arafat, on a machine that can
drive a real browser. The controlled target, pinned build, user agents, URL set and
run protocol are all settled and posted on #716; what is missing is an execution
environment, not a decision.

**Status language stays VALIDATING.** GSC validation is running in parallel; validation
started is not a pass, and nothing here predicts one.
