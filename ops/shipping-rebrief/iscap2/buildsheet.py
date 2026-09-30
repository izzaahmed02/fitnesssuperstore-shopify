import json
exec(open('changelist.py').read().split("\nout = []\ndef add")[0])   # reuse helpers: M, c, tier_target, fmt, cur_rows, f
S = c['scenarios']
def st(sid): return S[sid]['title'] + f"` — open v2.intuitiveshipping.app/scenarios/edit/{sid} `"
def rows_md(rows): return ' · '.join(f"**{m:g} → {v:.2f}**" for m, v in rows)
def inc_md(mid, mult, ceil=None):
    m = M[mid]; r = m['rates'][0]; a = m['adjustments']
    cap = ceil or r['max'] or '~(leave Up to empty)'
    flat = f" · adjustment `Base Price` add flat **{round(f(a[0]['value'])*mult,2):.2f}**" if a else ''
    return f"row Up to **{cap}** · cost **{round(f(r['cost'])*mult,4):g}** · per unit **{r['per_unit']}**{flat}"
Z = {'USA':'United States - USA Shipping & Handling','NE':'Northeast (…<!--USA Northeast…-->)','WC':'United States - West Coast','DC':'United States - Washington DC'}
def sub(z): return f"{Z[z]} → **Zone 6A Islands**"
L = []
def H(t): L.append(f"\n## {t}\n")
def item(n, title, how, steps):
    L.append(f"### {n}. `{title}`\n*{how}*\n")
    for s in steps: L.append(f"- {s}")
    L.append("")
DUP = "DUPLICATE → rename with ` REBRIEF` → Status **Testing** → Save. Edit/add inside the copy (method status doesn't matter inside a Testing scenario). Every new method: Rate type **Weight**."
ADD = "ADD NEW METHODS to the live scenario. **Every new method: Status = Testing, Rate type = Weight.** Don't edit existing methods."
L.append("# Intuitive Shipping — remaining Testing build (generated from BEFORE capture e8322c88…)\n")
L.append("Rules: Rate type **Weight** on every method (default is Quantity!). Per unit empty unless given. `~` = leave 'Up to' empty (unbounded). 6A = Zone 3 equivalent × 1.30; Zone 4 = × 1.10; Zone 5 = × 1.20; $50 credit once at 36–149.99 lb on freight only.\n")

H("Batch 4 — generic parcel, above-225 lb 6A, Combined carts")
item('4.1', st('131938'), DUP + " In the copy **delete every method except the Northeast one** (so the copy = Northeast only).",
     [f"Edit the Northeast `Fedex Ground` method: {inc_md('543061',1.20)}  (was $8.00/lb, no flat → Zone 3 × 1.20)",
      "Go-live: publish this copy + archive original method 543062 only."])
item('4.2', st('131936'), "Two parts.",
     [f"(a) {DUP} Delete every method in the copy except Northeast. Edit it: {inc_md('543058',1.20)}",
      f"(b) In the **original** live scenario, {ADD} Add 3 methods titled `Fedex Ground` on {sub('USA')}, {sub('NE')}, {sub('DC')}: {inc_md('543058',1.30)}"])
item('4.3', st('131924'), ADD, [f"On {sub('USA')} add 2 methods titled `USA Shipping & Handling`: (1) {inc_md('543044',1.30)} (2) {inc_md('543045',1.30)}"])
item('4.4', st('131928'), ADD, [f"On {sub('NE')} add the same 2 methods as 4.3 (Zone 3 × 1.30; Zone 5 above 225 keeps its own formula)."])
item('4.5', st('141916')+' REBRIEF', "Existing Testing copy — add methods.", [f"On {sub('DC')} add the same 2 methods as 4.3."])
item('4.6', st('141174')+' REBRIEF', "Existing Testing copy — add methods.", [f"On {sub('WC')} add the same 2 methods as 4.3, titled `WEST COAST Shipping & Handling`."])
item('4.7', st('135173'), DUP, [
     f"Edit method on USA zone: rows {rows_md(tier_target('560047',1.0))}",
     f"Add method on **{Z['DC']}** (zone): rows {rows_md(tier_target('560047',1.10))}",
     f"Add method on {sub('USA')}: rows {rows_md(tier_target('560047',1.30))}",
     f"Add method on {sub('DC')}: same rows as the line above."])
item('4.8', st('135174'), ADD, [
     f"On **{Z['DC']}** (zone): (1) {inc_md('560048',1.10)} (2) {inc_md('560049',1.10)}",
     f"On {sub('USA')} and on {sub('DC')}: (1) {inc_md('560048',1.30)} (2) {inc_md('560049',1.30)}"])
item('4.9', st('135175'), DUP, [
     f"Edit Northeast method rows: {rows_md(tier_target('560047',1.20))}",
     f"Add method on {sub('NE')}: rows {rows_md(tier_target('560047',1.30))}"])
item('4.10', st('135176'), ADD, [f"On {sub('NE')}: (1) {inc_md('560048',1.30)} (2) {inc_md('560049',1.30)}"])

H("Batch 5 — SKU scenarios, tiered (uprights, RIT24, WBB)")
def sku_tier(n, sid, z3, others, dc=True, subs=('USA','DC')):
    steps = [f"Edit USA-zone method ({z3}): rows {rows_md(tier_target(z3,1.0))}"] if z3 in c['method_lists'][sid] else []
    for mid, zc, mult in others:
        steps.append(f"Edit {zc} method ({mid}): rows {rows_md(tier_target(z3 if mult!=1.0 else mid, mult))}")
    if dc: steps.append(f"Add method on **{Z['DC']}** (zone): rows {rows_md(tier_target(z3,1.10))}")
    for s in subs: steps.append(f"Add method on {sub(s)}: rows {rows_md(tier_target(z3,1.30))}")
    item(n, st(sid), DUP, steps)
sku_tier('5.1','131994','543376',[('543380','Northeast',1.20),('543381','West Coast',1.0)], subs=('USA','NE','WC','DC'))
sku_tier('5.2','131997','543384',[('543385','Northeast',1.20),('543386','West Coast',1.0)], subs=('USA','NE','WC','DC'))
sku_tier('5.3','132506','546247',[])
item('5.4', st('132512'), DUP, [f"Edit Northeast method (546303): rows {rows_md(tier_target('546247',1.20))}", f"Add method on {sub('NE')}: rows {rows_md(tier_target('546247',1.30))}"])
item('5.5', st('132508'), DUP, [f"Edit West Coast method (546251): rows {rows_md(tier_target('546251',1.0))}", f"Add method on {sub('WC')}: rows {rows_md(tier_target('546247',1.30))}"])
sku_tier('5.6','140126','587830',[])
item('5.7', st('140128'), DUP, [f"Edit Northeast method (587833): rows {rows_md(tier_target('587830',1.20))}", f"Add method on {sub('NE')}: rows {rows_md(tier_target('587830',1.30))}"])
item('5.8', st('140133'), DUP, [f"Edit West Coast method (587843): rows {rows_md(tier_target('587843',1.0))}", f"Add method on {sub('WC')}: rows {rows_md(tier_target('587830',1.30))}"])
sku_tier('5.9','140466','590083',[])
item('5.10', st('140842'), DUP, [f"Edit Northeast method (591994): rows {rows_md(tier_target('590083',1.20))}", f"Add method on {sub('NE')}: rows {rows_md(tier_target('590083',1.30))}"])
item('5.11', st('131925'), DUP, [f"Edit West Coast method (543046): rows {rows_md(tier_target('543046',1.0))}", f"Add method on {sub('WC')}: rows {rows_md(tier_target('590083',1.30))}"])

H("Batch 6 — SKU scenarios above 225 lb and SKU parcel (add-only, Testing)")
def sku_inc(n, sid, usa_mid, subs):
    item(n, st(sid), ADD, [f"On **{Z['DC']}** (zone): {inc_md(usa_mid,1.10)}"] + [f"On {sub(s)}: {inc_md(usa_mid,1.30)}" for s in subs])
sku_inc('6.1','131995','543377',('USA','NE','DC'))
sku_inc('6.2','131996','543378',('USA','NE','WC','DC'))
sku_inc('6.3','131998','543387',('USA','NE','WC','DC'))
sku_inc('6.4','131999','543390',('USA','NE','WC','DC'))
sku_inc('6.5','133597','551446',('USA','DC'))
item('6.6', st('140127'), ADD, [f"On **{Z['DC']}** (zone): (1) {inc_md('587831',1.10)} (2) {inc_md('587832',1.10)}",
     f"On {sub('USA')} and {sub('DC')}: (1) {inc_md('587831',1.30)} (2) {inc_md('587832',1.30)}"])
item('6.7', st('140129'), ADD, [f"On {sub('NE')}: (1) {inc_md('587831',1.30)} (2) {inc_md('587832',1.30)}"])
item('6.8', st('140134'), ADD, [f"On {sub('WC')}: (1) {inc_md('587831',1.30)} (2) {inc_md('587832',1.30)}"])
item('6.9', st('140841'), ADD, [f"On {sub('NE')}: (1) {inc_md('543044',1.30)} (2) {inc_md('543045',1.30)}"])
item('6.10', st('131926'), ADD, [f"On {sub('WC')}: (1) {inc_md('543044',1.30)} (2) {inc_md('543045',1.30)}"])
item('6.11', st('140465')+'  (FF-WBB-9 parcel)', "Two parts.", [
     f"(a) {DUP} Delete every method in the copy except Northeast (590080). Edit it: {inc_md('590079',1.20)}",
     f"(b) In the **original**, {ADD} On **{Z['DC']}** (zone): {inc_md('590079',1.10)}; on {sub('USA')}, {sub('NE')}, {sub('DC')}: {inc_md('590079',1.30)}"])
item('6.12', st('139945')+'  (FF-WBB-3/6 parcel)', ADD, [f"On **{Z['DC']}** (zone): {inc_md('587286',1.10)}", f"On {sub('USA')} and {sub('DC')}: {inc_md('587286',1.30)}"])
item('6.13', st('132513')+'  (FF-RIT24 parcel)', ADD, [f"On **{Z['DC']}** (zone): {inc_md('546306',1.10)}", f"On {sub('USA')} and {sub('DC')}: {inc_md('546306',1.30)}"])

H("Batch 7 — AK/HI credit, territories credit, CA 1B SKU ladder")
item('7.1', st('131932'), DUP + " Keep the 27 lb scenario minimum (boundary move is on HOLD).", [f"Edit Hawaii method (543054): rows {rows_md(tier_target('543054',1.0))}"])
item('7.2', st('131934'), DUP + " Keep the 27 lb minimum.", [f"Edit Alaska method (543056): rows {rows_md(tier_target('543056',1.0))}"])
item('7.3', st('131930'), DUP + " (Separately identified Step 3 change per rebrief.)", [f"Edit Territories method (543052): rows {rows_md(tier_target('543052',1.0))}"])
for n, sid, mid, cap in [('7.4','132515','548826','1797'),('7.5','140131','587838','600'),('7.6','140658','591032','594')]:
    item(n, st(sid), DUP, [f"Edit ONLY the **Non Free Shipping Subzone** (1B) method ({mid}) to match live generic 1B 548830: row 1 Up to **149** · cost **149**; row 2 Up to **{cap}** · cost **1** · per unit **1**. Leave the Free Shipping Subzone (1A) method unchanged."])
for n, sid, mid in [('7.7','133602','551459'),('7.8','140132','587840'),('7.9','140794','591779')]:
    item(n, st(sid), DUP, [f"Edit ONLY the 1B (Non Free Shipping Subzone) method ({mid}) to match live generic 1B 548829: one row, Up to empty (~) · cost **1** · per unit **1**; delete the `Base Price` adjustment."])

H("HOLD / not in this build (state honestly in the update)")
L += ["- AK/HI parcel/freight boundary 27 → 36 lb: HOLD (parcel formula $25/lb + $29 gives $904 at 35 lb vs $499 freight at 36 lb).",
      "- CA 90704 (Avalon) 6A: sits in the 1,808-ZIP 1B subzone; needs a CA subzone-overlap test before building.",
      "- RIT24 Northeast above 675 lb (551448): rebrief isolates it as an exception — unchanged.",
      "- RIT24 West Coast above 675 lb (551451/551454) for the 13 WA island ZIPs: formula ranges differ from Zone 3 — unchanged.",
      "- Zone moves (NY/FL → Northeast; 13 states → DC zone; ID/UT → USA zone) are live-only: done in the go-live window after Tim's GO.",
      "- Feeds/GMC: now Kevin's; hand over the FSS Free-Shipping expression fix and FF 150+ lb findings."]
open('../IS_remaining_build_sheet_2026-09-30.md','w').write('\n'.join(L))
print('\n'.join(L))
