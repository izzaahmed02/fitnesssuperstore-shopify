import json,sys,hashlib,collections,gzip,os
dd,out=sys.argv[1],sys.argv[2]
def load(n): return [json.loads(l) for l in open(dd+"/"+n) if l.strip()]
def gids(fv):
    if not fv: return []
    v=fv.get("value") if isinstance(fv,dict) else fv
    if not v: return []
    try: return json.loads(v)
    except Exception: return []
products=load("products.jsonl")
groups={g["id"]:gids(g.get("field")) for g in load("groups.jsonl")}
oraw=load("options.jsonl")
opts={o["id"]:gids(o.get("variants")) for o in oraw}
otitle={o["id"]:(o.get("title") or {}).get("value") for o in oraw}
ohandle={o["id"]:o["handle"] for o in oraw}

raw_rows=[]; ded_rows=[]; summary=[]; dupes=[]
exempt=[]
for p in sorted((p for p in products if p["status"]=="ACTIVE"), key=lambda x:x["id"]):
    grefs=gids(p.get("metafield"))
    if not grefs:
        exempt.append((p["id"],p["handle"])); continue
    first={}; n=0; optset=set()
    for gi in grefs:
        for oi in groups.get(gi,[]):
            optset.add(oi)
            for vi in opts.get(oi,[]):
                raw_rows.append((p["id"],gi,oi,vi)); n+=1
                if vi not in first: first[vi]=(gi,oi)
    for vi,(gi,oi) in first.items(): ded_rows.append((p["id"],gi,oi,vi))
    summary.append((p["id"],p["handle"],len(grefs),len(optset),n,len(first)))
    if n!=len(first): dupes.append((p["id"],p["handle"],n,len(first),n-len(first)))

def canon(rows):
    rows=sorted(rows)
    blob="\n".join("\t".join(r) for r in rows).encode()
    return rows, hashlib.sha256(blob).hexdigest()
raw_rows,raw_sha=canon(raw_rows)
ded_rows,ded_sha=canon(ded_rows)

def wgz(path,header,rows):
    buf = (header+"\n" + "".join("\t".join(map(str,r))+"\n" for r in rows)).encode()
    with open(path,"wb") as fh:
        with gzip.GzipFile(filename="", mode="wb", fileobj=fh, compresslevel=9, mtime=0) as g:
            g.write(buf)
H="product_id\tgroup_metaobject_id\toption_metaobject_id\toption_variant_id"
wgz(out+"/catalogue-rows-raw.tsv.gz",H,raw_rows)
wgz(out+"/catalogue-rows-deduped.tsv.gz",H,ded_rows)
with open(out+"/catalogue-per-product.tsv","w",newline="\n") as f:
    f.write("product_id\thandle\tgroup_refs\tdistinct_options\tentries_raw\tentries_deduped\n")
    for r in sorted(summary): f.write("\t".join(map(str,r))+"\n")
with open(out+"/duplicate-variant-products.tsv","w",newline="\n") as f:
    f.write("product_id\thandle\tentries_raw\tentries_deduped\tduplicate_entries\n")
    for r in sorted(dupes,key=lambda x:-x[4]): f.write("\t".join(map(str,r))+"\n")
with open(out+"/exempt-products.tsv","w",newline="\n") as f:
    f.write("product_id\thandle\n")
    for r in sorted(exempt,key=lambda x:x[1]): f.write("\t".join(r)+"\n")

src={n:hashlib.sha256(open(dd+"/"+n,"rb").read()).hexdigest() for n in
     ["products.jsonl","groups.jsonl","options.jsonl","options_ts.jsonl"]}
man={
 "generated_at_utc":"2026-10-07T16:16:10Z/16:22:09Z (four read-only bulk exports)",
 "store":"fitnesssuperstore.com (Shopify Plus)",
 "source_of_truth":"options.product_options (list.metaobject_reference) -> product_options -> product_option -> product_option_variants",
 "bulk_operation_ids":["gid://shopify/BulkOperation/8637984047420","gid://shopify/BulkOperation/8637985259836","gid://shopify/BulkOperation/8637988700476","gid://shopify/BulkOperation/8638001152316"],
 "source_snapshot_sha256":src,
 "cohort":{"active_products":sum(1 for p in products if p["status"]=="ACTIVE"),
           "catalogue_required":len(summary),"exempt":len(exempt),
           "group_references":sum(s[2] for s in summary),
           "distinct_option_records_referenced":len({r[2] for r in raw_rows}),
           "option_references_product_scoped":sum(s[3] for s in summary),
           "distinct_option_variants":len({r[3] for r in ded_rows})},
 "entries":{"raw_every_reference":len(raw_rows),"deduped_by_variant_per_product":len(ded_rows),
            "difference":len(raw_rows)-len(ded_rows),"products_with_duplicates":len(dupes)},
 "checksums_sha256_canonical_sorted_tsv_no_header":{"raw":raw_sha,"deduped":ded_sha},
}
with open(out+"/manifest.json","w",newline="\n") as f: json.dump(man,f,indent=2); f.write("\n")
print(json.dumps(man,indent=2))
