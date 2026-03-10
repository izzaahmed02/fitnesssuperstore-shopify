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

# 4) Heatmap should initialize directly (not idle callback deferred).
require(script_tags, "(h._heatmap_paq = []).push", 'snippets/script-tags.liquid')
forbid(script_tags, "requestIdleCallback(initHeatmap", 'snippets/script-tags.liquid')
forbid(script_tags, "function initHeatmap()", 'snippets/script-tags.liquid')

print('CWV regression checks passed.')
