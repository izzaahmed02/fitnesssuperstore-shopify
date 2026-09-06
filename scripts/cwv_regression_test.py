from pathlib import Path


def require(text: str, needle: str, context: str):
    if needle not in text:
        raise AssertionError(f"Missing expected snippet in {context}: {needle}")


def forbid(text: str, needle: str, context: str):
    if needle in text:
        raise AssertionError(f"Found forbidden snippet in {context}: {needle}")


theme = Path('layout/theme.liquid').read_text()
script_tags = Path('snippets/script-tags.liquid').read_text()
head_meta = Path('snippets/head-meta.liquid').read_text()
modals_templates = Path('snippets/modals-and-templates.liquid').read_text()
stylesheet_tags = Path('snippets/stylesheet-tags.liquid').read_text()
main_search = Path('sections/main-search.liquid').read_text()
header = Path('sections/header.liquid').read_text()

# 1) Legacy mobile gallery fallback should not exist (unused selector + forced style mutation).
forbid(theme, ".smobile-gallery-wrapper.only-mobile", 'layout/theme.liquid')

# 2) Vendor injection should be interaction/load based and deduplicated.
require(theme, "var injected = false;", 'layout/theme.liquid')
require(theme, "window.addEventListener(evt, injectNonCriticalVendors, { once: true, passive: true });", 'layout/theme.liquid')
require(theme, "window.addEventListener('load', function()", 'layout/theme.liquid')
forbid(theme, "requestIdleCallback(injectNonCriticalVendors", 'layout/theme.liquid')

# 3) Gorgias wait should be bounded with timeout and one-time event listener.
require(theme, "function waitForGorgiasLoaded(timeoutMs)", 'layout/theme.liquid')
require(theme, "window.clearTimeout(timer);", 'layout/theme.liquid')
require(theme, "}, { once: true });", 'layout/theme.liquid')

# 4) Product page should preload featured media for better LCP.
require(head_meta, "{% if template contains 'product' and product and product.featured_media %}", 'snippets/head-meta.liquid')
require(head_meta, 'fetchpriority="high"', 'snippets/head-meta.liquid')

# 5) jQuery should not be render-blocking.
require(script_tags, "<script src=\"{{ 'jquery.min.js' | asset_url }}\" defer=\"defer\"></script>", 'snippets/script-tags.liquid')

# 6) Square marketplace is no longer used and should not be reintroduced in any form.
forbid(script_tags, 'js.squarecdn.com', 'snippets/script-tags.liquid')
forbid(script_tags, "function loadSquareMarketplace()", 'snippets/script-tags.liquid')

# 7) Google Maps should be interaction/load triggered for heavy pages.
require(script_tags, "function loadGoogleMaps()", 'snippets/script-tags.liquid')
# The eager tag is matched by URL prefix only. The assertion needs the request
# shape, not the credential, and a prefix also keeps the check valid if the key
# is ever rotated or replaced.
forbid(script_tags, '<script src="https://maps.googleapis.com/maps/api/js', 'snippets/script-tags.liquid')

# 8) Heatmap loader should stay on the lightweight preprocessor implementation.
require(script_tags, 'preprocessor.min.js?sid=', 'snippets/script-tags.liquid')
require(script_tags, "['error', 'unhandledrejection'].forEach(function (ty) {", 'snippets/script-tags.liquid')
forbid(script_tags, "function initHeatmap()", 'snippets/script-tags.liquid')

# 9) Google Ads gtag should not be added back as an immediate request in script-tags.
forbid(script_tags, '<script async src="https://www.googletagmanager.com/gtag/js?id=AW-997565942">', 'snippets/script-tags.liquid')
forbid(script_tags, "function loadGtag()", 'snippets/script-tags.liquid')

# 10) Globo filter app remnants should be fully removed from runtime templates/styles.
forbid(main_search, 'id="gf-products"', 'sections/main-search.liquid')
forbid(header, 'globo-search-activator', 'sections/header.liquid')
forbid(Path('assets/template-collection.css').read_text(), 'spf-has-filter', 'assets/template-collection.css')
forbid(Path('assets/product-index-item.css').read_text(), '#gf-products', 'assets/product-index-item.css')
forbid(Path('assets/product-index-item.css').read_text(), '#gf-grid', 'assets/product-index-item.css')

# 11) Globo filter integration should be removed from runtime templates.
forbid(theme, 'globo.filter', 'layout/theme.liquid')
forbid(modals_templates, 'globo.filter', 'snippets/modals-and-templates.liquid')
forbid(modals_templates, 'gspf', 'snippets/modals-and-templates.liquid')
forbid(stylesheet_tags, 'globo-search-custom.css', 'snippets/stylesheet-tags.liquid')

# 12) Globo filter files should not exist.
for f in [
    'snippets/globo.filter.product-index.liquid',
    'snippets/globo.filter.sort.liquid',
    'snippets/globo.filter.search.liquid',
    'snippets/globo.filter.product.liquid',
    'snippets/globo.filter.tree.liquid',
    'assets/globo-search-custom.css',
    'assets/template-collection-custom.css',
]:
    if Path(f).exists():
        raise AssertionError(f"Expected removed file still exists: {f}")

# ---------------------------------------------------------------------------
# 13) Phase 1 - PageSpeed/Lighthouse cloaking must stay removed.
#
# snippets/optimization.liquid detected Lighthouse/PSI's test environment and
# stripped scripts, CSS and images for test tools only, so lab scores measured
# a page real users never got. Never reintroduce it in any form.
# ---------------------------------------------------------------------------
if Path('snippets/optimization.liquid').exists():
    raise AssertionError('snippets/optimization.liquid was reintroduced (PSI cloaking)')

for text, context in [(theme, 'layout/theme.liquid'), (head_meta, 'snippets/head-meta.liquid')]:
    forbid(text, "render 'optimization'", context)
    for marker in ['Chrome-Lighthouse', 'Page Speed Insights', '__isPSA', '___mnag',
                   'asyncLazyLoad', 'text/lazyload']:
        forbid(text, marker, context)

# The deferred vendor injector must not branch on user agent at all.
forbid(theme, 'navigator.userAgent', 'layout/theme.liquid')

# 14) Phase 1 - the Judge.me badge poller must terminate.
require(theme, 'clearInterval(timer)', 'layout/theme.liquid')

# 15) Phase 1 - Convert's official tag gets a preconnect.
require(theme, '<link rel="preconnect" href="https://cdn-4.convertexperiments.com" crossorigin>',
        'layout/theme.liquid')

# ---------------------------------------------------------------------------
# 16) Phase 2 - Convert has exactly one entry point.
#
# The cdn.9gtb.com bundle loader was removed from the deferred injector.
# REVERT NOTE: if Convert experiments stop firing, that block goes back and
# this assertion goes with it.
# ---------------------------------------------------------------------------
forbid(theme, '9gtb.com', 'layout/theme.liquid')
forbid(theme, 'convert-bundle-loader', 'layout/theme.liquid')
require(theme, 'cdn-4.convertexperiments.com/v1/js/', 'layout/theme.liquid')

# 17) Phase 2 - Heatmap.com is interaction/load deferred, not eager.
require(script_tags, 'function loadHeatmap()', 'snippets/script-tags.liquid')
require(script_tags, "window.addEventListener(evt, loadHeatmap, { once: true, passive: true });",
        'snippets/script-tags.liquid')
forbid(script_tags, '<script>/* >> Heatmap.com :: Snippet << */(function (h,e,a,t,m,ap)',
       'snippets/script-tags.liquid')

# 18) Phase 2 - collection LCP priority hints.
product_card = Path('snippets/product-card.liquid').read_text()
collection_grid = Path('sections/main-collection-product-grid.liquid').read_text()

require(product_card, 'loading="eager"', 'snippets/product-card.liquid')
require(product_card, "{% if fetch_priority == 'high' %}fetchpriority=\"high\"{% endif %}",
        'snippets/product-card.liquid')
require(collection_grid, 'fetch_priority: fetch_priority', 'sections/main-collection-product-grid.liquid')
require(collection_grid, "{%- assign fetch_priority = 'high' -%}",
        'sections/main-collection-product-grid.liquid')

# 19) Phase 2 - the collection preload must stay in lockstep with the card markup.
#
# A <link rel=preload> for a responsive image only avoids a second download when
# imagesizes resolves to the same candidate the <img> picks. If the card's sizes
# attribute is edited without editing the preload, the browser downloads the
# image twice and the preload actively costs LCP - so pin them to each other.
import re as _re

def _attr(text, attr, context):
    m = _re.search(attr + r'="([^"]*)"', text)
    if not m:
        raise AssertionError(f'Missing {attr} attribute in {context}')
    return ' '.join(m.group(1).split())

collection_preload = _re.search(
    r"\{% if template contains 'collection'.*?\{% endif %\}", head_meta, _re.S)
if not collection_preload:
    raise AssertionError('Missing the collection-template preload block in snippets/head-meta.liquid')
collection_preload = collection_preload.group(0)

card_sizes = _attr(product_card, 'sizes', 'snippets/product-card.liquid')
preload_sizes = _attr(collection_preload, 'imagesizes', 'snippets/head-meta.liquid (collection preload)')
if card_sizes != preload_sizes:
    raise AssertionError(
        'Collection preload imagesizes has drifted from the product card sizes attribute.\n'
        f'  product-card.liquid sizes:     {card_sizes}\n'
        f'  head-meta.liquid  imagesizes:  {preload_sizes}'
    )

# The preload's candidate widths must all exist in the card's srcset, otherwise
# the browser can select a width the preload never warmed.
card_widths = set(_re.findall(r'image_url: width: (\d+)', product_card))
preload_widths = set(_re.findall(r'image_url: width: (\d+)', collection_preload))
missing = sorted(int(w) for w in preload_widths - card_widths)
if missing:
    raise AssertionError(
        f'Collection preload offers widths absent from the product card srcset: {missing}'
    )

print('CWV regression checks passed.')
