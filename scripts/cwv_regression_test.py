from pathlib import Path


def require(text: str, needle: str, context: str):
    if needle not in text:
        raise AssertionError(f"Missing expected snippet in {context}: {needle}")


def forbid(text: str, needle: str, context: str):
    if needle in text:
        raise AssertionError(f"Found forbidden snippet in {context}: {needle}")


theme = Path('layout/theme.liquid').read_text()
script_tags = Path('snippets/script-tags.liquid').read_text()

# 1) Mobile gallery timeout should be guarded and only appear once.
require(theme, "var mobileGalleryWrapper = document.querySelector('.smobile-gallery-wrapper.only-mobile');", 'layout/theme.liquid')
require(theme, "if (mobileGalleryWrapper)", 'layout/theme.liquid')
assert theme.count(".smobile-gallery-wrapper.only-mobile") == 1, "Mobile gallery selector should appear exactly once"

# 2) Vendor injection should be interaction/load based and deduplicated.
require(theme, "var injected = false;", 'layout/theme.liquid')
require(theme, "window.addEventListener(evt, injectNonCriticalVendors, { once: true, passive: true });", 'layout/theme.liquid')
require(theme, "window.addEventListener('load', function()", 'layout/theme.liquid')
forbid(theme, "requestIdleCallback(injectNonCriticalVendors", 'layout/theme.liquid')

# 3) Gorgias wait should be bounded with timeout and one-time event listener.
require(theme, "function waitForGorgiasLoaded(timeoutMs)", 'layout/theme.liquid')
require(theme, "window.clearTimeout(timer);", 'layout/theme.liquid')
require(theme, "}, { once: true });", 'layout/theme.liquid')

# 4) jQuery should not be render-blocking.
require(script_tags, "<script src=\"{{ 'jquery.min.js' | asset_url }}\" defer=\"defer\"></script>", 'snippets/script-tags.liquid')

# 5) Square marketplace on product pages should be interaction/load triggered.
require(script_tags, "function loadSquareMarketplace()", 'snippets/script-tags.liquid')
require(script_tags, "window.addEventListener(evt, loadSquareMarketplace, { once: true, passive: true });", 'snippets/script-tags.liquid')
forbid(script_tags, '<script src="https://js.squarecdn.com/square-marketplace.js" async></script>', 'snippets/script-tags.liquid')

# 6) Google Maps should be interaction/load triggered for heavy pages.
require(script_tags, "function loadGoogleMaps()", 'snippets/script-tags.liquid')
require(script_tags, "window.addEventListener(evt, loadGoogleMaps, { once: true, passive: true });", 'snippets/script-tags.liquid')
forbid(script_tags, "<script src=\"https://maps.googleapis.com/maps/api/js?key=AIzaSyC1KAxFSFi-ORhUWVMuZfaHGyjAF-pmVDw\" defer></script>", 'snippets/script-tags.liquid')

# 7) Heatmap should load after window load with a timeout (no idle callback).
require(script_tags, "function initHeatmap()", 'snippets/script-tags.liquid')
require(script_tags, "h.addEventListener('load', function ()", 'snippets/script-tags.liquid')
forbid(script_tags, "requestIdleCallback(initHeatmap", 'snippets/script-tags.liquid')

print('CWV regression checks passed.')
