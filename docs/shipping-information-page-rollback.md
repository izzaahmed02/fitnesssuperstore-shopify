# Shipping Information page — backup, rollback plan, and correction scope

Record: GitHub issue #802 · Gmail thread "ACTION REQUIRED — Published Shipping
Information page contains unrelated careers content — stage correction"

Verified 2026-09-06 by read-only Shopify Admin API reads and a comparison of the
live theme against this repository. **No live page, metafield, navigation, theme,
or app change was made.** Publication remains gated on Tim's separate written GO.

---

## 1. Object under correction

| Field | Live value |
|---|---|
| Page ID | `gid://shopify/Page/141292470588` |
| Title | Shipping Information |
| Handle | `shipping-information` |
| Public URL | https://www.fitnesssuperstore.com/pages/shipping-information |
| Published | true (since 2024-11-04T07:59:44Z) |
| Last page update | 2026-01-01T15:28:24Z |
| Template suffix | `shipping-information` |
| Live main theme | `fitnesssuperstore-shopify/main` — `gid://shopify/OnlineStoreTheme/186120208700` |

Metafields on the page object:

| Namespace.key | Value |
|---|---|
| `global.title_tag` | Shipping Information \| Fitness Superstore |
| `global.description_tag` | Fitness Superstore delivers in 2–14 business days, plus processing time. Use their online calculator to estimate how long Fitness Superstore takes to deliver. |
| `custom.seo_videos` | `["gid://shopify/Metaobject/213093482812"]` |

---

## 2. Backup verification

Backup of record in this repo (captured directly from the live object, byte-exact):

- `docs/backups/shipping-information/2026-09-06-live-page-body.html`
  — 5,965 bytes, SHA-256 `391a76fd3182a48ebe91eb7804a92c62167108697c735a69fb11ef27e1f60cdd`
- `docs/backups/shipping-information/2026-09-06-live-page-object.json`
  — page fields and all three metafields

The emailed backup `FSS_Live_Shipping_Page_Backup_2026-09-04.html` was checked
against the live object:

| Check | Result |
|---|---|
| Body — visible text | Identical |
| Body — markup ignoring inter-tag whitespace | Identical (same normalized MD5) |
| Body — byte-for-byte | **Not identical** (5,933 vs 5,965 bytes; newlines inside `<li>` elements collapsed) |
| `global.title_tag` | Matches |
| `global.description_tag` | Matches |
| Page ID / handle / published / published-at / template suffix | All match |
| `custom.seo_videos` metafield | **Not captured** |
| Page title field | **Not recorded** |

The emailed backup is a faithful content record and is safe to restore from — the
byte difference is presentational whitespace only. It is not a complete object
snapshot, so the two files above are the rollback source of record.

---

## 3. Rollback plan (replacement in place)

Correcting in place preserves the page object, handle, URL, and organic equity;
no navigation edit is required.

**Restore procedure** — single `pageUpdate` against `gid://shopify/Page/141292470588`:

1. `body` ← contents of `2026-09-06-live-page-body.html`
2. `metafields` ← `global.title_tag` and `global.description_tag` from
   `2026-09-06-live-page-object.json`
3. Leave `handle`, `templateSuffix` (`shipping-information`), and published state
   untouched. Do not delete and recreate the page — a new page ID would break the
   inbound references in section 5 and discard the URL's indexing history.
4. Do not write `custom.seo_videos` unless it was changed; it is unaffected by a
   body/SEO edit.
5. Read the object back and compare the body SHA-256 to the value in section 2.

Reversibility: the correction touches only `body` and two SEO metafields on one
page object. Nothing is destructive and nothing cascades.

---

## 4. Scope finding — the correction is NOT page-content-only

The rendered page is produced entirely by the theme template
`templates/page.shipping-information.json` (25 sections, 16 section types). The
live theme file and this repository's copy are semantically identical.

**No section in that template's render tree outputs `page.content`.** All 16
section files and the 6 snippets they render were scanned; the page body is never
emitted. Consequences:

- The careers text in the page body is **not displayed** on the storefront page.
- Replacing the page body therefore changes nothing a customer sees.
- Every customer-facing shipping claim on the page lives in the **template**, and
  correcting it requires a theme change.

The page body is also not leaking into structured data: `snippets/schema-video.liquid`
falls back to `page.content` only when the video metaobject has no description, and
metaobject `213093482812` supplies one. `snippets/schema-ld-json.liquid` does not
reference the page body. The `<meta name="description">` in `layout/theme.liquid`
comes from `global.description_tag`, which is page-level.

### 4a. Page-level work (no theme change)

- Page body — replace careers content.
- `global.title_tag`, `global.description_tag` — the live SEO description carries
  the "2–14 business days, plus processing time" claim that is on hold.

### 4b. Theme-level work (proven dependency — requires this branch)

Delivery-time claims hardcoded in `templates/page.shipping-information.json`:

| Section | Type | Claim |
|---|---|---|
| `image_with_text_6DQ4XN` | image-with-text | "Shipping time: 2-14 business days (lower 48 states)" |
| `image_with_text_eLQQ7N` | image-with-text | "Shipping time: 2-14 business days to the lower 48 states in addition to the processing time stated on the item page" |
| `rich_text_bbDgaK` | rich-text | "Expect delivery within 1-6 business days for the lower 48 states in addition to the processing time stated on the item page" |
| `faq_333TMG` | faq | "Shipping time: 5-17 business days to the lower 48 states…" (two blocks) |
| `homepage_faqs_wUTedA` | homepage-faqs | "typically ships brand new equipment within 2 to 7 business days… Remanufactured equipment takes 2 to 5 weeks" |

None of these are approved by the confirmed source hierarchy yet, and none can be
changed from the page body.

### 4c. Rendered-audit items Tim flagged

- **Two H1 headings** — both are template-level:
  1. `rich_text_shipIntro` (rich-text, `h1: true`) → `<h1>Shipping Information</h1>` — the correct page H1.
  2. `heading_kCGMV3` (heading) → `<h1>FREIGHT SHIPPING WITHOUT ASSEMBLY</h1>`.
     `sections/heading.liquid:42` emits `<h1>` unconditionally with no setting to
     change the tag, so this needs either a section swap in the template or a
     theme code change.
- **Missing image alt text** — the template stores 15 image references and zero
  alt-text settings; sections read alt from the Shopify file's own alt attribute
  (`sections/image-with-text.liquid:302`), except `blocks-with-icons-grid` which
  hardcodes `alt="icon"` at line 283. Remediation is in Content → Files metadata
  and/or theme code, not in the page body.

---

## 5. Inbound references (why the URL must be preserved)

Six published navigation menus link to `/pages/shipping-information`:
`footer`, `header-menu-mobile-additional`, `index-s`, `new_header_menu_additional`,
`footer-menu-affiliate`, `sitemap-menu-2`.

The theme additionally carries 7 `shopify://pages/shipping-information` references
and 11 literal `/pages/shipping-information` links across other templates and
sections (including `page.california-delivery.json`, `page.about-us-new.json`,
`page.government-sales.json`, `page.landing.json`, `sections/image-banner-faq.liquid`,
and `sections/dc-warranty-content.liquid`).

All of these resolve by handle or page reference. Keeping the existing page ID,
handle, and URL leaves every one of them intact and requires no navigation edit.

---

## 6. Staged preview page — rendering caveat

The staged review page `gid://shopify/Page/160013025596`
(`shipping-information-corrected-preview-2026-09-04`, unpublished) carries
`templateSuffix: shipping-information` — the same template as the live page.

Because that template never renders `page.content`, previewing that URL will show
the existing 25 template sections and their current claims, and will **not** show
the corrected copy staged in its body. The corrected body is verified good as text
(593 words, no careers markers, no fixed delivery-time claims), but it is not what
a reviewer would see on screen. QA against a rendered preview needs either a
template that renders the body or a corrected copy of the template itself.
