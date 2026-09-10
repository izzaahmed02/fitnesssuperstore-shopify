"""Announcement-bar promo window regression test.

Exercises the ACTUAL scheduling preamble from sections/announcement-bar.liquid.

Only two substitutions are made against the file's own bytes:
  * the leading `{%- liquid ... -%}` block is extracted verbatim,
  * `'now' | date: '%s'` is replaced with an injected clock so each scenario can be
    evaluated at a chosen Pacific instant.
Everything else - the window comparisons, the live-id list, the counter - is the
shipped code.
"""
import os, re, sys
from datetime import datetime, timezone, timedelta

from liquid import Environment  # pip install python-liquid

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
src = open(os.path.join(REPO, 'sections', 'announcement-bar.liquid'), encoding='utf-8').read()
m = re.search(r"\{%-\s*liquid\n(.*?)\n-%\}", src, re.S)
assert m, "preamble not found"
preamble = m.group(1)
assert "live_announcement_count" in preamble
preamble = preamble.replace("assign announcement_now_s = 'now' | date: '%s' | plus: 0",
                            "assign announcement_now_s = injected_now | plus: 0")

TEMPLATE = "{%- liquid\n" + preamble + "\n-%}" + \
    "count={{ live_announcement_count }} ids={{ live_announcement_ids }} first={{ first_live_announcement.id }}"

env = Environment()

# python-liquid's `date` filter drops the UTC offset in an ISO 8601 string
# ("...-07:00" is read as UTC), while Shopify/Ruby honours it - which is what the
# shipped Labor Day gate and PR #823's snippet both rely on. Register an
# offset-aware `date` so this harness tests the theme's comparison logic rather
# than a dialect difference in the test runner.
def _date(value, fmt):
    if isinstance(value, str):
        dt = datetime.fromisoformat(value.replace("Z", "+00:00"))
        # datetime.strftime('%s') is a glibc quirk that ignores tzinfo and uses the
        # process TZ, which would silently undo the offset this test is about.
        if fmt == '%s':
            return str(int(dt.timestamp()))
        return dt.strftime(fmt)
    return value
env.filters["date"] = _date
tpl = env.from_string(TEMPLATE)

SEPT = {"id": "september_overstock_2026",
        "settings": {"promo_start": "2026-09-08T00:00:00-07:00",
                     "promo_end": "2026-09-30T23:59:59-07:00", "text": "<p>September</p>"}}
EVERGREEN = {"id": "free_shipping", "settings": {"text": "<p>Free shipping</p>"}}  # no window keys

PT = timezone(timedelta(hours=-7))
def ts(s): return int(datetime.fromisoformat(s).replace(tzinfo=PT).timestamp())

SECTION_SETTINGS = {"enable_country_selector": False, "enable_language_selector": False,
                    "show_social": False, "color_scheme": "scheme-4", "show_line_separator": True}

def run(label, blocks, when):
    out = tpl.render(injected_now=ts(when),
                     section={"blocks": blocks, "settings": SECTION_SETTINGS, "id": "x"},
                     settings={}, request={"design_mode": False})
    print(f"{label:<58} @ {when}  ->  {out}")
    return out

print("== September block alone ==")
a=run("before start (Sept 7, 23:59:59 PT)", [SEPT], "2026-09-07T23:59:59")
b=run("first instant of sale (Sept 8, 00:00:00 PT)", [SEPT], "2026-09-08T00:00:00")
c=run("mid-sale (Sept 10, 12:00 PT) - today", [SEPT], "2026-09-10T12:00:00")
d=run("last rendered second (Sept 30, 23:59:58 PT)", [SEPT], "2026-09-30T23:59:58")
e=run("expiry instant (Sept 30, 23:59:59 PT)", [SEPT], "2026-09-30T23:59:59")
f=run("Oct 1, 00:00:01 PT", [SEPT], "2026-10-01T00:00:01")
print("== September block + an evergreen (no dates) block ==")
g=run("mid-sale, both", [SEPT, EVERGREEN], "2026-09-10T12:00:00")
h=run("after expiry, evergreen must survive", [SEPT, EVERGREEN], "2026-10-05T09:00:00")

fails=[]
def expect(cond, msg):
    print(("  PASS  " if cond else "  FAIL  ")+msg)
    if not cond: fails.append(msg)

expect(a.startswith("count=0"), "hidden before promo_start")
expect(b.startswith("count=1"), "visible at promo_start")
expect(c.startswith("count=1"), "visible today (Sept 10)")
expect(d.startswith("count=1"), "visible at 23:59:58 on Sept 30")
expect(e.startswith("count=0"), "hidden at promo_end instant (exclusive)")
expect(f.startswith("count=0"), "hidden after promo_end - no manual removal needed")
expect(g.startswith("count=2"), "both blocks live mid-sale")
expect(h.startswith("count=1") and "free_shipping" in h, "evergreen block unaffected by expiry")
print("\nRESULT:", "ALL PASS" if not fails else f"{len(fails)} FAILED")
sys.exit(1 if fails else 0)
