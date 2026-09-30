"""Current -> target change list for Phase B, computed only from the 2026-09-30 BEFORE capture
and the Sept 26 rebrief rules (mult before $50 credit; credit once for 36.00 <= w < 150.00;
parcel gets multiplier, never the credit)."""
import json, csv
c = json.load(open('is-config-2026-09-30-BEFORE.json'))
M = c['methods']
MULT = {'Z3': 1.00, 'Z4': 1.10, 'Z5': 1.20, '6A': 1.30}
LO, HI = 35.99, 149.99   # row ceilings that give w<36 and w<150 (use 35.9999/149.9999 if the field takes 4 dp)

def f(x):
    try: return float(x)
    except: return None

def smin(mid):
    s = c['scenarios'].get(M[mid]['scenario_id'], {})
    for r in s.get('conditions', []):
        if 'weight' in str(r.get('type')) and 'greater' in str(r.get('operation')):
            v = [x for x in (r['value'] if isinstance(r['value'], list) else [r['value']]) if isinstance(x, str) and x.strip()]
            return f(v[0]) if v else 0.0
    return 0.0

def fmt(rows):
    return ' | '.join(f"≤{m:g}: ${v:.2f}" for m, v in rows)

def cur_rows(mid):
    return [(f(r['max']), f(r['cost'])) for r in M[mid]['rates']]

def tier_target(src_mid, mult, credit=True, lo=None):
    """Split src rows at LO/HI, apply mult, then credit once in [36,150)."""
    rows = cur_rows(src_mid)
    lo = smin(src_mid) if lo is None else lo
    cuts = sorted({m for m, _ in rows} | ({LO, HI} if credit else set()))
    cuts = [x for x in cuts if x > lo and x <= rows[-1][0]]
    out = []
    for cap in cuts:
        base = next(v for m, v in rows if cap <= m)
        v = round(base * mult, 2)
        if credit and LO < cap <= HI:
            v = max(0.0, round(v - 50, 2))
        if out and abs(out[-1][1] - v) < 0.005:
            out[-1] = (cap, v)
        else:
            out.append((cap, v))
    return out

def inc_target(src_mid, mult, ceil_mid=None):
    m = M[src_mid]
    caps = [r['max'] for r in M[ceil_mid or src_mid]['rates']]
    rr = [f"≤{caps[i] if i < len(caps) else r['max'] or '~'}: ${round(f(r['cost'])*mult,4):g} per {r['per_unit']} lb" for i, r in enumerate(m['rates'])]
    ad = [f"+ flat ${round(f(a['value'])*mult,2):.2f}" for a in m['adjustments']]
    return ' | '.join(rr + ad)

def inc_cur(mid):
    m = M[mid]
    return ' | '.join([f"≤{r['max'] or '~'}: ${r['cost']} per {r['per_unit']} lb" for r in m['rates']] +
                      [f"+ flat ${a['value']}" for a in m['adjustments']])

out = []
def add(step, action, mid, zone_cls, target, rule, note=''):
    m = M.get(mid) if mid else None
    cur = (fmt(cur_rows(mid)) if m and not any(r['per_unit'] for r in m['rates']) else inc_cur(mid)) if m else '—'
    out.append(dict(step=step, action=action, method=mid or 'NEW', scenario=m['scenario_id'] if m else '',
                    title=(m['title'] if m else ''), live_zone=(m['zone'] if m else ''), target_zone=zone_cls,
                    current=cur, target=target, rule=rule, note=note))

# ---- Zone 3 (81548 residual) : credit only
Z3_TIER = ['543043', '560047']           # generic + Combined
Z3_SKU_TIER = ['543376', '543384', '546247', '587830', '590083']
for mid in Z3_TIER + Z3_SKU_TIER:
    add('B6/Z3', 'EDIT rows', mid, 'Z3', fmt(tier_target(mid, 1.0)), 'B x1.00, then -$50 at 36-149.99')
# ---- Zone 2 (81558) : credit only, own base
for mid in ['594017', '543046', '546251', '587843', '543381', '543386']:
    add('B7/Z2', 'EDIT rows', mid, 'Z2', fmt(tier_target(mid, 1.0)), 'preserve own base, -$50 at 36-149.99')
# ---- Zone 5 (81549 + NY, FL): Z3 counterpart x1.20
PAIR5 = {'543048': '543043', '560050': '560047', '543380': '543376', '543385': '543384',
         '587833': '587830', '591994': '590083', '546303': '546247'}
for ne, z3 in PAIR5.items():
    add('B3/Z5', 'EDIT rows', ne, 'Z5', fmt(tier_target(z3, 1.20)), f'= Zone 3 method {z3} B x1.20, then -$50',
        'RIT24: Northeast tier ceilings differ from Zone 3 today' if ne == '546303' else '')
PAIR5_INC = {'557354': '543044', '543049': '543045', '560052': '560048', '560051': '560049',
             '543379': '543377', '543382': '543378', '543388': '543387', '543391': '543390',
             '587835': '587831', '587834': '587832'}
for ne, z3 in PAIR5_INC.items():
    add('B3/Z5 >225', 'EDIT rate+flat', ne, 'Z5', inc_target(z3, 1.20, ne), f'= Zone 3 method {z3} x1.20 (no credit >150)', 'confirm in ruling G4')
add('B3/Z5', 'EDIT parcel', '543062', 'Z5', inc_target('543061', 1.20), '= FedEx 543061 x1.20 (parcel, no credit)', 'today has NO $4 flat')
add('B3/Z5', 'EDIT parcel', '543059', 'Z5', inc_target('543058', 1.20), '= <1 lb 543058 x1.20')
add('B3/Z5', 'EDIT parcel', '590080', 'Z5', inc_target('590079', 1.20), '= FedEx WBB-9 590079 x1.20')
# ---- Zone 4 (83925 + 13 states): Z3 counterpart x1.10  (needs new methods in zone 83925)
for z3 in ['543043', '560047'] + Z3_SKU_TIER:
    add('B4/Z4', 'NEW method in zone 83925 (copy of %s)' % z3, None, 'Z4', fmt(tier_target(z3, 1.10)), f'= {z3} B x1.10, then -$50')
for z3 in ['543044', '543045', '560048', '560049', '543377', '543378', '543387', '543390', '587831', '587832']:
    add('B4/Z4 >225', 'NEW method in zone 83925 (copy of %s)' % z3, None, 'Z4', inc_target(z3, 1.10), f'= {z3} x1.10', 'confirm in ruling G4')
for z3 in ['543061', '543058', '590079', '587286', '546306']:
    add('B1+B4/Z4 parcel', 'NEW method in zone 83925 (copy of %s)' % z3, None, 'Z4', inc_target(z3, 1.10), f'= {z3} x1.10 (parcel)',
        'B1 P0: DC has NO parcel method today' if z3 == '543061' else '')
add('B4/Z4', 'DECIDE', '597912', 'Z4', 'disable, or set = new Z4 rows', 'legacy DC freight', 'ruling G3: if left active it undercuts Zone 4 ($299 vs $388.90 at 100 lb) for all 14 jurisdictions')
add('B4/Z4', 'DECIDE', '597913', 'Z4', 'disable, or = 543044/543045 x1.10', 'legacy DC >225', 'ruling G3')
# ---- Zone 6A: new zone, Z3 x1.30
for z3 in ['543043', '560047', '543061', '543058'] + Z3_SKU_TIER:
    tgt = inc_target(z3, 1.30) if any(r['per_unit'] for r in M[z3]['rates']) else fmt(tier_target(z3, 1.30))
    add('B2/6A', 'NEW method in new 6A zone (copy of %s)' % z3, None, '6A', tgt, f'= {z3} x1.30' + ('' if z3 in ('543061', '543058') else ', then -$50'),
        'mechanism (override precedence) pending subzone capture pass 3')
# ---- AK / HI (6B): floor 27 -> 36, credit on own base
for mid in ['543054', '543056']:
    add('B8/6B', 'EDIT rows + scenario min 27->36', mid, '6B', fmt(tier_target(mid, 1.0, lo=35.99)), 'preserve own base, -$50 at 36-149.99')
add('B8/6B', 'EDIT scenario 131939 max 26 -> 35.99', '543063', '6B', 'unchanged rate ($25.00 per 1.001 lb + $29)', 'parcel <36', 'ruling G5: 35 lb parcel = $904 vs 36 lb freight $499')
add('B8/6B', 'EDIT scenario 131939 max 26 -> 35.99', '543064', '6B', 'unchanged rate', 'parcel <36', 'ruling G5')
# ---- Territories (separately identified Step 3)
add('B6/TERR', 'EDIT rows', '543052', 'TERR', fmt(tier_target('543052', 1.0)), 'preserve own base, -$50 at 36-149.99', 'rebrief: territory Step 3 is a separately identified change')
# ---- scenario-level fixes
for s in ['141173', '141174', '141915', '141916']:
    out.append(dict(step='B0 free-ship', action=f'EDIT scenario {s} product filter', method='', scenario=s, title=c['scenarios'][s]['title'],
                    live_zone='', target_zone='', current='Tag filter EMPTY (no Free Shipping exclusion)',
                    target='Tag does not equal "Free Shipping" (same as 131923)', rule='Free Shipping items must not see a paid rate', note='root cause of paid option on WC/DC/ID/UT'))
# ---- zone membership
Z = lambda z: c['zones'][z]['fields']['countries[US][]']
for zid, cur, tgt in [
    ('81549', Z('81549'), sorted(Z('81549') + ['NY', 'FL'])),
    ('83925', [Z('83925')], sorted(['DC', 'LA', 'MS', 'AL', 'GA', 'SC', 'NC', 'KY', 'WV', 'VA', 'MD', 'DE', 'NJ', 'PA'])),
    ('81558', Z('81558'), ['AZ', 'NV', 'OR', 'WA']),
]:
    out.append(dict(step='zones', action=f'EDIT zone {zid}', method='', scenario='', title=c['zones'][zid]['fields']['title'][:40], live_zone=zid,
                    target_zone='', current=','.join(cur), target=','.join(tgt), rule='rebrief s.1', note=''))
z3 = sorted(set(Z('81548')) - {'NY', 'FL', 'LA', 'MS', 'AL', 'GA', 'SC', 'NC', 'KY', 'WV', 'VA', 'MD', 'DE', 'NJ', 'PA'} | {'ID', 'UT'})
out.append(dict(step='zones', action='EDIT zone 81548 (same save as 83925 add)', method='', scenario='', title='USA Shipping & Handling', live_zone='81548',
                target_zone='Z3', current=','.join(Z('81548')), target=','.join(z3), rule='rebrief s.1 Zone 3 list', note=f'{len(z3)} states'))

w = csv.DictWriter(open('../evidence/IS_phaseB_change_list_2026-09-30.csv', 'w'), fieldnames=list(out[0].keys()))
w.writeheader(); w.writerows(out)
print(len(out), 'rows')
for r in out: print(f"{r['step']:<16} {r['action'][:44]:<44} M{r['method']:<7} {r['current'][:70]:<70} -> {r['target'][:90]}  {r['note']}")
