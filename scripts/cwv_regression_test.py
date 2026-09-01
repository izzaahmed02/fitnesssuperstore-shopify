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
forbid(script_tags, "<script src=\"https://maps.googleapis.com/maps/api/js?key=AIzaSyC1KAxFSFi-ORhUWVMuZfaHGyjAF-pmVDw\" defer></script>", 'snippets/script-tags.liquid')

# 8) Heatmap is retired from the theme and should not be reintroduced in any form.
forbid(script_tags, 'preprocessor.min.js?sid=', 'snippets/script-tags.liquid')
forbid(script_tags, 'dashboard.heatmap.com', 'snippets/script-tags.liquid')
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

print('CWV regression checks passed.')
