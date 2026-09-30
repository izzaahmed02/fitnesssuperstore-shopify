# READ-ONLY pass 3: subzone (ZIP-list) pages for every zone + the zones list page (zone order).
# GET only. Skips any URL that looks like an action (save/delete/copy/status/export/etc).
import os, re, sys, time, html, base64, subprocess
BASE = 'https://v2.intuitiveshipping.app'
COOKIE = os.environ.get('IS_COOKIE', '').strip()
if not COOKIE: sys.exit('IS_COOKIE is empty')
UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/129 Safari/537.36'
SRC = 'is-capture-2026-09-30'
OUT = os.path.join(SRC, 'subzones'); os.makedirs(OUT, exist_ok=True)
BAD = re.compile(r'delete|duplicate|archive|remove|logout|status|move|copy|bulk|publish|/add|create|save|'
                 r'sort|order|toggle|enable|disable|update|import|export|notes|search|billing|support', re.I)
OK = re.compile(r'^(module/subzones/|subzones/|zones/edit/|zones$|zones\?)', re.I)

def fetch(url):
    for t in range(4):
        r = subprocess.run(['curl', '-sS', '--compressed', '-A', UA, '-H', 'Cookie: ' + COOKIE,
                            '-H', 'X-Requested-With: XMLHttpRequest', '-w', '\n__HTTP__%{http_code}', url],
                           capture_output=True, text=True)
        body, _, code = r.stdout.rpartition('\n__HTTP__')
        if code == '200' and 'name="password"' not in body and body.strip():
            return body
        time.sleep(3 * (t + 1))
    print('\n  skipped (HTTP', code, '):', url); return None

def found_urls(body):
    urls = set(html.unescape(u) for u in re.findall(r'href="(https://v2\.intuitiveshipping\.app/[^"#]+)"', body))
    for s in re.findall(r'data-[a-z\-]+="([A-Za-z0-9+/=]{16,})"', body):
        try:
            u = base64.b64decode(s).decode()
            if u.startswith(BASE): urls.add(u)
        except Exception: pass
    return {u for u in urls if OK.search(u.split('.app/', 1)[1]) and not BAD.search(u.split('.app/', 1)[1])}

def fname(u): return re.sub(r'[^0-9A-Za-z]+', '_', u.split('.app/', 1)[1])[:180] + '.html'

zids = sorted(set(re.findall(r'zones_edit_(\d+)\.html', ' '.join(os.listdir(os.path.join(SRC, 'methods'))))))
queue = [f'{BASE}/zones'] + [f'{BASE}/module/subzones/list/{z}' for z in zids]
seen = set(queue); n = 0
print('zones:', len(zids))
while queue and n < 1500:
    u = queue.pop(0); n += 1
    b = fetch(u)
    if b is None: continue
    open(os.path.join(OUT, fname(u)), 'w').write(b)
    for v in found_urls(b):
        if v not in seen: seen.add(v); queue.append(v)
    print(f'  fetched {n}  queued {len(queue)}', end='\r', flush=True); time.sleep(0.35)
print('\nDONE pass 3 ->', OUT, '| files:', len(os.listdir(OUT)))
