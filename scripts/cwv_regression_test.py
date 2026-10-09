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

# 4) Product page should preload its LCP image.
# #812 split this into two branches: bounded PDP templates (combined-listings,
# variants, variants-pulley, gift_cards) preload product.media.first at two
# breakpoints, everything else preloads product.featured_media.
# Assert markup unique to each preload <link>, not just the branch conditions --
# a condition can survive while its <link> is deleted, and the outer guard string
# also appears in the canonical-link block further down the file.
require(head_meta, '{% assign initial_media = product.media.first %}', 'snippets/head-meta.liquid')
# bounded-template preloads, mobile then desktop
require(head_meta, 'imagesizes="(max-width: 768px) 100vw, 800px"', 'snippets/head-meta.liquid')
require(
    head_meta,
    'imagesizes="(min-width: 1290px) 580px, (min-width: 990px) calc(100vw - 710px), 100vw"',
    'snippets/head-meta.liquid',
)
# featured-media preload
require(head_meta, '{% elsif product.featured_media %}', 'snippets/head-meta.liquid')
require(
    head_meta,
    'href="{{ product.featured_media.preview_image | image_url: width: 1440 }}"',
    'snippets/head-meta.liquid',
)
require(
    head_meta,
    'imagesizes="(min-width: 1200px) 34vw, (min-width: 990px) 38vw, 100vw"',
    'snippets/head-meta.liquid',
)
# every preload above must keep LCP priority
require(head_meta, 'fetchpriority="high"', 'snippets/head-meta.liquid')

# 5) jQuery should not be render-blocking.
require(script_tags, "<script src=\"{{ 'jquery.min.js' | asset_url }}\" defer=\"defer\"></script>", 'snippets/script-tags.liquid')

# 6) Square marketplace is no longer used and should not be reintroduced in any form.
forbid(script_tags, 'js.squarecdn.com', 'snippets/script-tags.liquid')
forbid(script_tags, "function loadSquareMarketplace()", 'snippets/script-tags.liquid')

# 7) Google Maps stays interaction/load triggered, consumers wait for it, and
# every failure path degrades instead of leaving an empty container.
# The loader lives in its own snippet so any section can render it, rather than
# being gated on template names in script-tags.liquid - a gate that silently
# missed one warehouse template and left its map unable to load at all.
maps_loader = Path('snippets/google-maps-loader.liquid').read_text()
require(maps_loader, "function loadGoogleMaps()", 'snippets/google-maps-loader.liquid')
require(maps_loader, "window.googleMapsReady", 'snippets/google-maps-loader.liquid')

# Failure handling: timeout, script error, and script-loads-but-API-missing
# (what a rejected referrer or disabled API looks like client side).
require(maps_loader, "LOAD_TIMEOUT_MS", 'snippets/google-maps-loader.liquid')
require(maps_loader, "mapsScript.onerror", 'snippets/google-maps-loader.liquid')
require(maps_loader, "window.google && window.google.maps", 'snippets/google-maps-loader.liquid')

# The eager tag is matched by URL prefix only. The assertion needs the request
# shape, not the credential, and a prefix also keeps the check valid if the key
# is ever rotated or replaced.
forbid(maps_loader, '<script src="https://maps.googleapis.com/maps/api/js', 'snippets/google-maps-loader.liquid')
forbid(script_tags, 'maps.googleapis.com', 'snippets/script-tags.liquid')

# Sections using google.maps must render the loader, wait on its promise, and
# handle rejection. Initialising inside a window load handler is the defect
# fixed here: loading is deferred, so the API is absent at load and the map
# fails silently.
for maps_section in ['sections/map.liquid', 'sections/map-warehouse.liquid']:
    section_source = Path(maps_section).read_text()
    require(section_source, "{% render 'google-maps-loader' %}", maps_section)
    require(section_source, "window.googleMapsReady.then(", maps_section)
    require(section_source, "}).catch(function", maps_section)
    require(section_source, "map-fallback", maps_section)

    # The fallback must build its addresses from the same `locations` array the
    # markers use, so it cannot drift from the map or show an address the map
    # does not plot. PR #954 separates the public showroom address from the
    # operations address: maps and directions use the showroom, so no address
    # may be hardcoded into the fallback.
    require(section_source, "locations.map(function (loc)", maps_section)
    require(section_source, "maps/dir/?api=1&destination=", maps_section)
    # Scope the no-hardcoded-address rule to the fallback handler itself: the
    # locations array legitimately contains these addresses as marker data.
    _catch = section_source[section_source.index("}).catch(function"):]
    for _addr in ('537 Stone Rd', '457 Industrial Way'):
        if _addr in _catch:
            raise AssertionError(
                f"Hardcoded address {_addr!r} in the fallback handler of {maps_section}; "
                "render addresses from the locations array instead"
            )
    forbid(section_source, "addEventListener('load'", maps_section)
    forbid(section_source, 'maps.googleapis.com', maps_section)

# The credential must exist in exactly one place so the pending replacement is
# a one-line swap rather than a hunt.
import glob as _glob
# Split so this file does not match its own scan.
_KEY_PREFIX = 'AI' + 'za'
_key_files = sorted(
    f for f in _glob.glob('**/*', recursive=True)
    if Path(f).is_file()
    and _KEY_PREFIX in Path(f).read_bytes().decode('utf-8', 'ignore')
)
if _key_files != ['sections/contact-form.liquid', 'snippets/google-maps-loader.liquid']:
    raise AssertionError(f"Unexpected set of files carrying an API key: {_key_files}")

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

# 16) Gorgias Convert removal is permanent; Convert.com A/B testing remains.
#
# The cdn.9gtb.com bundle loader was installed by a former contractor and was
# removed after the 2026-09-06 Gorgias Convert audit: zero active campaigns,
# Convert billing INACTIVE, and the campaign bundle never fully installed. It
# was shipping to every customer and doing nothing. This is a settled removal,
# not a deferral -- if Gorgias Convert is ever deliberately adopted, revisit
# this guard as part of that new implementation.
forbid(theme, '9gtb.com', 'layout/theme.liquid')
forbid(theme, 'convert-bundle-loader', 'layout/theme.liquid')
require(theme, 'cdn-4.convertexperiments.com/v1/js/', 'layout/theme.liquid')

# 17) Phase 2 - Heatmap.com is interaction/load deferred, not eager.
require(script_tags, 'function loadHeatmap()', 'snippets/script-tags.liquid')
require(script_tags, "window.addEventListener(evt, loadHeatmap, { once: true, passive: true });",
        'snippets/script-tags.liquid')
forbid(script_tags, '<script>/* >> Heatmap.com :: Snippet << */(function (h,e,a,t,m,ap)',
       'snippets/script-tags.liquid')

# 13) Behavioural check: the loader must not resolve before the document is
# parsed. Static assertions cannot catch this - it is the defect that produced
# "Expected mapDiv of type HTMLElement but was passed null" on the warehouse
# page. Runs the DOM double in scripts/maps_loader_dom_test.mjs.
import shutil as _shutil
import subprocess as _subprocess

_node = _shutil.which('node')
if _node:
    _r = _subprocess.run(
        [_node, 'scripts/maps_loader_dom_test.mjs'],
        capture_output=True, text=True,
    )
    if _r.returncode != 0:
        raise AssertionError(
            'Maps loader DOM-readiness check failed:\n'
            + (_r.stderr or _r.stdout).strip()
        )
    print((_r.stdout or '').strip())
else:
    print('node not found; skipped the Maps loader DOM-readiness check.')

print('CWV regression checks passed.')
