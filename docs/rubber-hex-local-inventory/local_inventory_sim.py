import json, csv, re, sys
csv.field_size_limit(10**9)
LI = sys.argv[1]; ALLOW_SNIPPET = sys.argv[2]
def load(path):
    prods, order = {}, []
    for l in open(path):
        x = json.loads(l)
        if x["id"].startswith("gid://shopify/Product/"):
            x["variants"] = []; prods[x["id"]] = x; order.append(x["id"])
        else:
            prods[x["__parentId"]]["variants"].append(x)
    return [prods[i] for i in order]
def mv(o, k):
    v = o.get(k); return None if v is None else v.get("value")
def code_first(v):
    if v is None: return ""
    try:
        j = json.loads(v)
        if isinstance(j, list): return (j[0] if j else "").strip()
    except Exception: pass
    return v.strip()
def num(tok):
    try: return float(tok)
    except Exception: return 0
def resolve(p, v):
    roll = mv(p, "rollout"); leg = (mv(p, "legacy") or "").strip()
    if roll == "approved" and leg: return leg, "0:legacy_gmc_id"
    if len(p["variants"]) > 1: return f'{p["legacyResourceId"]}-{v["legacyResourceId"]}', "1:composite"
    c = code_first(mv(v, "code"))
    if c: return c, "2:old_legacy_product_code"
    return v["sku"].strip(), "3:sku"
def eligible(p, v):
    f = (mv(p, "ptf") or "").lower().strip()
    if f: return f == "ships in 2 weeks or less", f"filter='{f}'"
    raw = mv(v, "ptlv") or mv(p, "ptl") or mv(p, "pt") or ""
    lead = raw.lower().strip(); days = -1
    if "business day" in lead:
        t = lead.split("business day")[0].strip().split(" ")[-1].split("-")[-1].strip(); n = num(t)
        if n > 0: days = n
    elif "week" in lead:
        t = lead.split("week")[0].strip().split(" ")[-1].split("-")[-1].strip(); n = num(t)
        if n > 0: days = n * 5
    ok = 0 < days <= 10
    if "restock" in lead: ok = False
    return ok, f"cascade='{raw}'"
def storefront_visible(p):
    return p["status"] == "ACTIVE" and p.get("publishedAt")
def render(products, allow):
    out = ["id\tstore_code\tavailability\tquantity"]; seen = set(); rows = []
    for p in products:
        if not storefront_visible(p): continue
        for v in p["variants"]:
            if not (v.get("sku") or "").strip(): continue
            oid, rule = resolve(p, v)
            if oid not in allow or oid in seen: continue
            seen.add(oid); ok, why = eligible(p, v)
            out.append(f'{oid}\tFSS1\t{"on_display_to_order" if ok else "out_of_stock"}\t{1 if ok else 0}')
            rows.append((p, v, oid, rule, ok, why))
    return "\n".join(out) + "\n", rows
def cohort_ids(products):
    ids = []
    for p in products:
        if not storefront_visible(p): continue
        for v in p["variants"]:
            if (v.get("sku") or "").strip(): ids.append(resolve(p, v)[0])
    return ids
def parse_allow(path):
    t = open(path).read(); body = t.split("{%- endcomment -%}")[-1].strip()
    return [x for x in body.split("|") if x]
