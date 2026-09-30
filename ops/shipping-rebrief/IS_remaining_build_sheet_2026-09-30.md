# Intuitive Shipping — remaining Testing build (generated from BEFORE capture e8322c88…)

Rules: Rate type **Weight** on every method (default is Quantity!). Per unit empty unless given. `~` = leave 'Up to' empty (unbounded). 6A = Zone 3 equivalent × 1.30; Zone 4 = × 1.10; Zone 5 = × 1.20; $50 credit once at 36–149.99 lb on freight only.


## Batch 4 — generic parcel, above-225 lb 6A, Combined carts

### 4.1. Fedex Ground Incremental Rates
Open: `v2.intuitiveshipping.app/scenarios/edit/131938`
*DUPLICATE → rename with ` REBRIEF` → Status **Testing** → Save. Edit/add inside the copy (method status doesn't matter inside a Testing scenario). Every new method: Rate type **Weight**. In the copy **delete every method except the two under the Northeast zone** (the Northeast zone method AND its Zone 6A Islands method) — the 6A one must stay so island ZIPs don't also get the Zone 5 price.*

- Edit the Northeast `Fedex Ground` method: row Up to **35** · cost **9.6** · per unit **1.001** · adjustment `Base Price` add flat **4.80**  (was $8.00/lb, no flat → Zone 3 × 1.20)
- Go-live: publish this copy + archive original method 543062 only.

### 4.2. Fedex Ground Incremental Rates < 1 lb
Open: `v2.intuitiveshipping.app/scenarios/edit/131936`
*Two parts.*

- (a) DUPLICATE → rename with ` REBRIEF` → Status **Testing** → Save. Edit/add inside the copy (method status doesn't matter inside a Testing scenario). Every new method: Rate type **Weight**. Delete every method in the copy except Northeast. Edit it: row Up to **1.001** · cost **1.44** · per unit **0.1**. Then, in the copy, add a method on Northeast → **Zone 6A Islands**: row Up to **1.001** · cost **1.56** · per unit **0.1**
- (b) In the **original** live scenario, ADD NEW METHODS to the live scenario. **Every new method: Status = Testing, Rate type = Weight.** Don't edit existing methods. Add 2 methods titled `Fedex Ground` on United States - USA Shipping & Handling → **Zone 6A Islands** and United States - Washington DC → **Zone 6A Islands** (the Northeast one goes in the copy, part a): row Up to **1.001** · cost **1.56** · per unit **0.1**

### 4.3. USA Shipping & Handling Incremental Rates
Open: `v2.intuitiveshipping.app/scenarios/edit/131924`
*ADD NEW METHODS to the live scenario. **Every new method: Status = Testing, Rate type = Weight.** Don't edit existing methods.*

- On United States - USA Shipping & Handling → **Zone 6A Islands** add 2 methods titled `USA Shipping & Handling`: (1) row Up to **452** · cost **1.95** · per unit **1.001** · adjustment `Base Price` add flat **76.70** (2) row Up to **99999** · cost **1.3** · per unit **1.001** · adjustment `Base Price` add flat **356.20**

### 4.4. USA Shipping & Handling Northeast Incremental Rates
Open: `v2.intuitiveshipping.app/scenarios/edit/131928`
*ADD NEW METHODS to the live scenario. **Every new method: Status = Testing, Rate type = Weight.** Don't edit existing methods.*

- On Northeast (…<!--USA Northeast…-->) → **Zone 6A Islands** add the same 2 methods as 4.3 (Zone 3 × 1.30; Zone 5 above 225 keeps its own formula).

### 4.5. Washington DC Shipping & Handling Incremental Rates REBRIEF
Open: `v2.intuitiveshipping.app/scenarios/edit/141916`
*Existing Testing copy — add methods.*

- On United States - Washington DC → **Zone 6A Islands** add the same 2 methods as 4.3.

### 4.6. WEST COAST Shipping & Handling Incremental Rates REBRIEF
Open: `v2.intuitiveshipping.app/scenarios/edit/141174`
*Existing Testing copy — add methods.*

- On United States - West Coast → **Zone 6A Islands** add the same 2 methods as 4.3, titled `WEST COAST Shipping & Handling`.

### 4.7. USA Shipping & Handling Tiered Rates (Combined)
Open: `v2.intuitiveshipping.app/scenarios/edit/135173`
*DUPLICATE → rename with ` REBRIEF` → Status **Testing** → Save. Edit/add inside the copy (method status doesn't matter inside a Testing scenario). Every new method: Rate type **Weight**.*

- Edit method on USA zone: rows **35.99 → 399.00** · **149.99 → 349.00** · **226 → 399.00**
- Add method on **United States - Washington DC** (zone): rows **35.99 → 438.90** · **149.99 → 388.90** · **226 → 438.90**
- Add method on United States - USA Shipping & Handling → **Zone 6A Islands**: rows **35.99 → 518.70** · **149.99 → 468.70** · **226 → 518.70**
- Add method on United States - Washington DC → **Zone 6A Islands**: same rows as the line above.

### 4.8. USA Shipping & Handling Incremental Rates (Combined)
Open: `v2.intuitiveshipping.app/scenarios/edit/135174`
*ADD NEW METHODS to the live scenario. **Every new method: Status = Testing, Rate type = Weight.** Don't edit existing methods.*

- On **United States - Washington DC** (zone): (1) row Up to **452** · cost **1.65** · per unit **1.001** · adjustment `Base Price` add flat **81.40** (2) row Up to **99999** · cost **1.1** · per unit **1.001** · adjustment `Base Price` add flat **383.90**
- On United States - USA Shipping & Handling → **Zone 6A Islands** and on United States - Washington DC → **Zone 6A Islands**: (1) row Up to **452** · cost **1.95** · per unit **1.001** · adjustment `Base Price` add flat **96.20** (2) row Up to **99999** · cost **1.3** · per unit **1.001** · adjustment `Base Price` add flat **453.70**

### 4.9. USA Shipping & Handling Northeast Tiered Rates (Combined)
Open: `v2.intuitiveshipping.app/scenarios/edit/135175`
*DUPLICATE → rename with ` REBRIEF` → Status **Testing** → Save. Edit/add inside the copy (method status doesn't matter inside a Testing scenario). Every new method: Rate type **Weight**.*

- Edit Northeast method rows: **35.99 → 478.80** · **149.99 → 428.80** · **226 → 478.80**
- Add method on Northeast (…<!--USA Northeast…-->) → **Zone 6A Islands**: rows **35.99 → 518.70** · **149.99 → 468.70** · **226 → 518.70**

### 4.10. USA Shipping & Handling Northeast Incremental Rates (Combined)
Open: `v2.intuitiveshipping.app/scenarios/edit/135176`
*ADD NEW METHODS to the live scenario. **Every new method: Status = Testing, Rate type = Weight.** Don't edit existing methods.*

- On Northeast (…<!--USA Northeast…-->) → **Zone 6A Islands**: (1) row Up to **452** · cost **1.95** · per unit **1.001** · adjustment `Base Price` add flat **96.20** (2) row Up to **99999** · cost **1.3** · per unit **1.001** · adjustment `Base Price` add flat **453.70**


## Batch 5 — SKU scenarios, tiered (uprights, RIT24, WBB)

### 5.1. USA Shipping & Handling Tiered Rates (Uprights 108)
Open: `v2.intuitiveshipping.app/scenarios/edit/131994`
*DUPLICATE → rename with ` REBRIEF` → Status **Testing** → Save. Edit/add inside the copy (method status doesn't matter inside a Testing scenario). Every new method: Rate type **Weight**.*

- Edit USA-zone method (543376): rows **149.99 → 399.00** · **225 → 449.00** · **451 → 549.00**
- Edit Northeast method (543380): rows **149.99 → 488.80** · **225 → 538.80** · **451 → 658.80**
- Edit West Coast method (543381): rows **149.99 → 399.00** · **225 → 449.00** · **451 → 549.00**
- Add method on **United States - Washington DC** (zone): rows **149.99 → 443.90** · **225 → 493.90** · **451 → 603.90**
- Add method on United States - USA Shipping & Handling → **Zone 6A Islands**: rows **149.99 → 533.70** · **225 → 583.70** · **451 → 713.70**
- Add method on Northeast (…<!--USA Northeast…-->) → **Zone 6A Islands**: rows **149.99 → 533.70** · **225 → 583.70** · **451 → 713.70**
- Add method on United States - West Coast → **Zone 6A Islands**: rows **149.99 → 533.70** · **225 → 583.70** · **451 → 713.70**
- Add method on United States - Washington DC → **Zone 6A Islands**: rows **149.99 → 533.70** · **225 → 583.70** · **451 → 713.70**

### 5.2. USA Shipping & Handling Tiered Rates (Uprights 120,132,142)
Open: `v2.intuitiveshipping.app/scenarios/edit/131997`
*DUPLICATE → rename with ` REBRIEF` → Status **Testing** → Save. Edit/add inside the copy (method status doesn't matter inside a Testing scenario). Every new method: Rate type **Weight**.*

- Edit USA-zone method (543384): rows **149.99 → 499.00** · **225 → 549.00**
- Edit Northeast method (543385): rows **149.99 → 608.80** · **225 → 658.80**
- Edit West Coast method (543386): rows **149.99 → 499.00** · **225 → 549.00**
- Add method on **United States - Washington DC** (zone): rows **149.99 → 553.90** · **225 → 603.90**
- Add method on United States - USA Shipping & Handling → **Zone 6A Islands**: rows **149.99 → 663.70** · **225 → 713.70**
- Add method on Northeast (…<!--USA Northeast…-->) → **Zone 6A Islands**: rows **149.99 → 663.70** · **225 → 713.70**
- Add method on United States - West Coast → **Zone 6A Islands**: rows **149.99 → 663.70** · **225 → 713.70**
- Add method on United States - Washington DC → **Zone 6A Islands**: rows **149.99 → 663.70** · **225 → 713.70**

### 5.3. USA Shipping & Handling (FF-RIT24) Tiered Rates
Open: `v2.intuitiveshipping.app/scenarios/edit/132506`
*DUPLICATE → rename with ` REBRIEF` → Status **Testing** → Save. Edit/add inside the copy (method status doesn't matter inside a Testing scenario). Every new method: Rate type **Weight**.*

- Edit USA-zone method (546247): rows **149.99 → 349.00** · **229.99 → 399.00** · **672.99 → 449.00** · **1352.99 → 549.00**
- Add method on **United States - Washington DC** (zone): rows **149.99 → 388.90** · **229.99 → 438.90** · **672.99 → 493.90** · **1352.99 → 603.90**
- Add method on United States - USA Shipping & Handling → **Zone 6A Islands**: rows **149.99 → 468.70** · **229.99 → 518.70** · **672.99 → 583.70** · **1352.99 → 713.70**
- Add method on United States - Washington DC → **Zone 6A Islands**: rows **149.99 → 468.70** · **229.99 → 518.70** · **672.99 → 583.70** · **1352.99 → 713.70**

### 5.4. USA Shipping & Handling Northeast (FF-RIT24) Tiered Rates
Open: `v2.intuitiveshipping.app/scenarios/edit/132512`
*DUPLICATE → rename with ` REBRIEF` → Status **Testing** → Save. Edit/add inside the copy (method status doesn't matter inside a Testing scenario). Every new method: Rate type **Weight**.*

- Edit Northeast method (546303): rows **149.99 → 428.80** · **229.99 → 478.80** · **672.99 → 538.80** · **1352.99 → 658.80**
- Add method on Northeast (…<!--USA Northeast…-->) → **Zone 6A Islands**: rows **149.99 → 468.70** · **229.99 → 518.70** · **672.99 → 583.70** · **1352.99 → 713.70**

### 5.5. WEST COAST Shipping & Handling (FF-RIT24) Tiered Rates
Open: `v2.intuitiveshipping.app/scenarios/edit/132508`
*DUPLICATE → rename with ` REBRIEF` → Status **Testing** → Save. Edit/add inside the copy (method status doesn't matter inside a Testing scenario). Every new method: Rate type **Weight**.*

- Edit West Coast method (546251): rows **35.99 → 299.00** · **149.99 → 249.00** · **444 → 299.00** · **675 → 349.00**
- Add method on United States - West Coast → **Zone 6A Islands**: rows **149.99 → 468.70** · **229.99 → 518.70** · **672.99 → 583.70** · **1352.99 → 713.70**

### 5.6. USA Shipping & Handling (FF-WBB-3, FF-WBB-6) Tiered Rates
Open: `v2.intuitiveshipping.app/scenarios/edit/140126`
*DUPLICATE → rename with ` REBRIEF` → Status **Testing** → Save. Edit/add inside the copy (method status doesn't matter inside a Testing scenario). Every new method: Rate type **Weight**.*

- Edit USA-zone method (587830): rows **35.99 → 399.00** · **149.99 → 349.00** · **222 → 399.00**
- Add method on **United States - Washington DC** (zone): rows **35.99 → 438.90** · **149.99 → 388.90** · **222 → 438.90**
- Add method on United States - USA Shipping & Handling → **Zone 6A Islands**: rows **35.99 → 518.70** · **149.99 → 468.70** · **222 → 518.70**
- Add method on United States - Washington DC → **Zone 6A Islands**: rows **35.99 → 518.70** · **149.99 → 468.70** · **222 → 518.70**

### 5.7. USA Shipping & Handling (FF-WBB-3, FF-WBB-6) Northeast Tiered Rates
Open: `v2.intuitiveshipping.app/scenarios/edit/140128`
*DUPLICATE → rename with ` REBRIEF` → Status **Testing** → Save. Edit/add inside the copy (method status doesn't matter inside a Testing scenario). Every new method: Rate type **Weight**.*

- Edit Northeast method (587833): rows **35.99 → 478.80** · **149.99 → 428.80** · **222 → 478.80**
- Add method on Northeast (…<!--USA Northeast…-->) → **Zone 6A Islands**: rows **35.99 → 518.70** · **149.99 → 468.70** · **222 → 518.70**

### 5.8. WEST COAST Shipping & Handling (FF-WBB-3, FF-WBB-6) Tiered Rates
Open: `v2.intuitiveshipping.app/scenarios/edit/140133`
*DUPLICATE → rename with ` REBRIEF` → Status **Testing** → Save. Edit/add inside the copy (method status doesn't matter inside a Testing scenario). Every new method: Rate type **Weight**.*

- Edit West Coast method (587843): rows **35.99 → 299.00** · **149.99 → 249.00** · **150 → 299.00** · **222 → 349.00**
- Add method on United States - West Coast → **Zone 6A Islands**: rows **35.99 → 518.70** · **149.99 → 468.70** · **222 → 518.70**

### 5.9. USA Shipping & Handling (FF-WBB-9) Tiered Rates
Open: `v2.intuitiveshipping.app/scenarios/edit/140466`
*DUPLICATE → rename with ` REBRIEF` → Status **Testing** → Save. Edit/add inside the copy (method status doesn't matter inside a Testing scenario). Every new method: Rate type **Weight**.*

- Edit USA-zone method (590083): rows **35.99 → 399.00** · **149.99 → 349.00** · **225 → 399.00**
- Add method on **United States - Washington DC** (zone): rows **35.99 → 438.90** · **149.99 → 388.90** · **225 → 438.90**
- Add method on United States - USA Shipping & Handling → **Zone 6A Islands**: rows **35.99 → 518.70** · **149.99 → 468.70** · **225 → 518.70**
- Add method on United States - Washington DC → **Zone 6A Islands**: rows **35.99 → 518.70** · **149.99 → 468.70** · **225 → 518.70**

### 5.10. USA Shipping & Handling Northeast (FF-WBB-9) Tiered Rates
Open: `v2.intuitiveshipping.app/scenarios/edit/140842`
*DUPLICATE → rename with ` REBRIEF` → Status **Testing** → Save. Edit/add inside the copy (method status doesn't matter inside a Testing scenario). Every new method: Rate type **Weight**.*

- Edit Northeast method (591994): rows **35.99 → 478.80** · **149.99 → 428.80** · **225 → 478.80**
- Add method on Northeast (…<!--USA Northeast…-->) → **Zone 6A Islands**: rows **35.99 → 518.70** · **149.99 → 468.70** · **225 → 518.70**

### 5.11. WEST COAST Shipping & Handling (FF-WBB-9) Tiered Rates
Open: `v2.intuitiveshipping.app/scenarios/edit/131925`
*DUPLICATE → rename with ` REBRIEF` → Status **Testing** → Save. Edit/add inside the copy (method status doesn't matter inside a Testing scenario). Every new method: Rate type **Weight**.*

- Edit West Coast method (543046): rows **35.99 → 299.00** · **144 → 249.00** · **149.99 → 299.00** · **225 → 349.00**
- Add method on United States - West Coast → **Zone 6A Islands**: rows **35.99 → 518.70** · **149.99 → 468.70** · **225 → 518.70**


## Batch 6 — SKU scenarios above 225 lb and SKU parcel (add-only, Testing)

### 6.1. USA Shipping & Handling Incremental Rates (Uprights 108)
Open: `v2.intuitiveshipping.app/scenarios/edit/131995`
*ADD NEW METHODS to the live scenario. **Every new method: Status = Testing, Rate type = Weight.** Don't edit existing methods.*

- On **United States - Washington DC** (zone): row Up to **~** · cost **0.66** · per unit **1.001** · adjustment `Base Price` add flat **210.10**
- On United States - USA Shipping & Handling → **Zone 6A Islands**: row Up to **~** · cost **0.78** · per unit **1.001** · adjustment `Base Price` add flat **248.30**
- On Northeast (…<!--USA Northeast…-->) → **Zone 6A Islands**: row Up to **~** · cost **0.78** · per unit **1.001** · adjustment `Base Price` add flat **248.30**
- On United States - Washington DC → **Zone 6A Islands**: row Up to **~** · cost **0.78** · per unit **1.001** · adjustment `Base Price` add flat **248.30**

### 6.2. USA Shipping & Handling Incremental Rates (Uprights 108)
Open: `v2.intuitiveshipping.app/scenarios/edit/131996`
*ADD NEW METHODS to the live scenario. **Every new method: Status = Testing, Rate type = Weight.** Don't edit existing methods.*

- On **United States - Washington DC** (zone): row Up to **~** · cost **0.22** · per unit **1.001** · adjustment `Base Price` add flat **474.65**
- On United States - USA Shipping & Handling → **Zone 6A Islands**: row Up to **~** · cost **0.26** · per unit **1.001** · adjustment `Base Price` add flat **560.95**
- On Northeast (…<!--USA Northeast…-->) → **Zone 6A Islands**: row Up to **~** · cost **0.26** · per unit **1.001** · adjustment `Base Price` add flat **560.95**
- On United States - West Coast → **Zone 6A Islands**: row Up to **~** · cost **0.26** · per unit **1.001** · adjustment `Base Price` add flat **560.95**
- On United States - Washington DC → **Zone 6A Islands**: row Up to **~** · cost **0.26** · per unit **1.001** · adjustment `Base Price` add flat **560.95**

### 6.3. USA Shipping & Handling Incremental Rates (Uprights 120,132,142, 130)
Open: `v2.intuitiveshipping.app/scenarios/edit/131998`
*ADD NEW METHODS to the live scenario. **Every new method: Status = Testing, Rate type = Weight.** Don't edit existing methods.*

- On **United States - Washington DC** (zone): row Up to **~** · cost **0.77** · per unit **1.001** · adjustment `Base Price` add flat **325.60**
- On United States - USA Shipping & Handling → **Zone 6A Islands**: row Up to **~** · cost **0.91** · per unit **1.001** · adjustment `Base Price` add flat **384.80**
- On Northeast (…<!--USA Northeast…-->) → **Zone 6A Islands**: row Up to **~** · cost **0.91** · per unit **1.001** · adjustment `Base Price` add flat **384.80**
- On United States - West Coast → **Zone 6A Islands**: row Up to **~** · cost **0.91** · per unit **1.001** · adjustment `Base Price` add flat **384.80**
- On United States - Washington DC → **Zone 6A Islands**: row Up to **~** · cost **0.91** · per unit **1.001** · adjustment `Base Price` add flat **384.80**

### 6.4. USA Shipping & Handling Incremental Rates (Uprights 120,132,142, 130)
Open: `v2.intuitiveshipping.app/scenarios/edit/131999`
*ADD NEW METHODS to the live scenario. **Every new method: Status = Testing, Rate type = Weight.** Don't edit existing methods.*

- On **United States - Washington DC** (zone): row Up to **~** · cost **0.22** · per unit **1.001** · adjustment `Base Price` add flat **656.15**
- On United States - USA Shipping & Handling → **Zone 6A Islands**: row Up to **~** · cost **0.26** · per unit **1.001** · adjustment `Base Price` add flat **775.45**
- On Northeast (…<!--USA Northeast…-->) → **Zone 6A Islands**: row Up to **~** · cost **0.26** · per unit **1.001** · adjustment `Base Price` add flat **775.45**
- On United States - West Coast → **Zone 6A Islands**: row Up to **~** · cost **0.26** · per unit **1.001** · adjustment `Base Price` add flat **775.45**
- On United States - Washington DC → **Zone 6A Islands**: row Up to **~** · cost **0.26** · per unit **1.001** · adjustment `Base Price` add flat **775.45**

### 6.5. USA Shipping & Handling (FF-RIT24) Incremental Rates
Open: `v2.intuitiveshipping.app/scenarios/edit/133597`
*ADD NEW METHODS to the live scenario. **Every new method: Status = Testing, Rate type = Weight.** Don't edit existing methods.*

- On **United States - Washington DC** (zone): row Up to **99999** · cost **0.3666** · per unit **1.001** · adjustment `Base Price` add flat **440.00**
- On United States - USA Shipping & Handling → **Zone 6A Islands**: row Up to **99999** · cost **0.4333** · per unit **1.001** · adjustment `Base Price` add flat **520.00**
- On United States - Washington DC → **Zone 6A Islands**: row Up to **99999** · cost **0.4333** · per unit **1.001** · adjustment `Base Price` add flat **520.00**

### 6.6. USA Shipping & Handling (FF-WBB-3, FF-WBB-6) Incremental Rates
Open: `v2.intuitiveshipping.app/scenarios/edit/140127`
*ADD NEW METHODS to the live scenario. **Every new method: Status = Testing, Rate type = Weight.** Don't edit existing methods.*

- On **United States - Washington DC** (zone): (1) row Up to **452** · cost **0.55** · per unit **1.001** · adjustment `Base Price` add flat **71.50** (2) row Up to **99999** · cost **0.3666** · per unit **1.001** · adjustment `Base Price` add flat **305.80**
- On United States - USA Shipping & Handling → **Zone 6A Islands** and United States - Washington DC → **Zone 6A Islands**: (1) row Up to **452** · cost **0.65** · per unit **1.001** · adjustment `Base Price` add flat **84.50** (2) row Up to **99999** · cost **0.4333** · per unit **1.001** · adjustment `Base Price` add flat **361.40**

### 6.7. USA Shipping & Handling (FF-WBB-3, FF-WBB-6) Northeast Incremental Rates
Open: `v2.intuitiveshipping.app/scenarios/edit/140129`
*ADD NEW METHODS to the live scenario. **Every new method: Status = Testing, Rate type = Weight.** Don't edit existing methods.*

- On Northeast (…<!--USA Northeast…-->) → **Zone 6A Islands**: (1) row Up to **452** · cost **0.65** · per unit **1.001** · adjustment `Base Price` add flat **84.50** (2) row Up to **99999** · cost **0.4333** · per unit **1.001** · adjustment `Base Price` add flat **361.40**

### 6.8. WEST COAST Shipping & Handling (FF-WBB-3, FF-WBB-6) Incremental Rates
Open: `v2.intuitiveshipping.app/scenarios/edit/140134`
*ADD NEW METHODS to the live scenario. **Every new method: Status = Testing, Rate type = Weight.** Don't edit existing methods.*

- On United States - West Coast → **Zone 6A Islands**: (1) row Up to **452** · cost **0.65** · per unit **1.001** · adjustment `Base Price` add flat **84.50** (2) row Up to **99999** · cost **0.4333** · per unit **1.001** · adjustment `Base Price` add flat **361.40**

### 6.9. USA Shipping & Handling Northeast (FF-WBB-9) Incremental Rates
Open: `v2.intuitiveshipping.app/scenarios/edit/140841`
*ADD NEW METHODS to the live scenario. **Every new method: Status = Testing, Rate type = Weight.** Don't edit existing methods.*

- On Northeast (…<!--USA Northeast…-->) → **Zone 6A Islands**: (1) row Up to **452** · cost **1.95** · per unit **1.001** · adjustment `Base Price` add flat **76.70** (2) row Up to **99999** · cost **1.3** · per unit **1.001** · adjustment `Base Price` add flat **356.20**

### 6.10. WEST COAST Shipping & Handling (FF-WBB-9) Incremental Rates
Open: `v2.intuitiveshipping.app/scenarios/edit/131926`
*ADD NEW METHODS to the live scenario. **Every new method: Status = Testing, Rate type = Weight.** Don't edit existing methods.*

- On United States - West Coast → **Zone 6A Islands**: (1) row Up to **452** · cost **1.95** · per unit **1.001** · adjustment `Base Price` add flat **76.70** (2) row Up to **99999** · cost **1.3** · per unit **1.001** · adjustment `Base Price` add flat **356.20**

### 6.11. Fedex Ground (FF-WBB-9) Incremental Rates (FF-WBB-9 parcel)
Open: `v2.intuitiveshipping.app/scenarios/edit/140465`
*Two parts.*

- (a) DUPLICATE → rename with ` REBRIEF` → Status **Testing** → Save. Edit/add inside the copy (method status doesn't matter inside a Testing scenario). Every new method: Rate type **Weight**. Delete every method in the copy except Northeast (590080's copy). Edit it: row Up to **35** · cost **4.2667** · per unit **1.001** · adjustment `Base Price` add flat **24.00**. Then in the copy add a method on Northeast → **Zone 6A Islands**: row Up to **35** · cost **4.6223** · per unit **1.001** · adjustment `Base Price` add flat **26.00**
- (b) In the **original**, ADD NEW METHODS to the live scenario. **Every new method: Status = Testing, Rate type = Weight.** Don't edit existing methods. On **United States - Washington DC** (zone): row Up to **35** · cost **3.9112** · per unit **1.001** · adjustment `Base Price` add flat **22.00**; on United States - USA Shipping & Handling → **Zone 6A Islands** and United States - Washington DC → **Zone 6A Islands**: row Up to **35** · cost **4.6223** · per unit **1.001** · adjustment `Base Price` add flat **26.00**

### 6.12. Fedex Ground (FF-WBB-3, FF-WBB-6) (FF-WBB-3/6 parcel)
Open: `v2.intuitiveshipping.app/scenarios/edit/139945`
*ADD NEW METHODS to the live scenario. **Every new method: Status = Testing, Rate type = Weight.** Don't edit existing methods.*

- On **United States - Washington DC** (zone): row Up to **35** · cost **2.937** · per unit **1.001** · adjustment `Base Price` add flat **39.60**
- On United States - USA Shipping & Handling → **Zone 6A Islands** and United States - Washington DC → **Zone 6A Islands**: row Up to **35** · cost **3.471** · per unit **1.001** · adjustment `Base Price` add flat **46.80**

### 6.13. Fedex Ground (FF-RIT24) (FF-RIT24 parcel)
Open: `v2.intuitiveshipping.app/scenarios/edit/132513`
*ADD NEW METHODS to the live scenario. **Every new method: Status = Testing, Rate type = Weight.** Don't edit existing methods.*

- On **United States - Washington DC** (zone): row Up to **35** · cost **2.9334** · per unit **1.001** · adjustment `Base Price` add flat **8.80**
- On United States - USA Shipping & Handling → **Zone 6A Islands** and United States - Washington DC → **Zone 6A Islands**: row Up to **35** · cost **3.4667** · per unit **1.001** · adjustment `Base Price` add flat **10.40**


## Batch 7 — AK/HI credit, territories credit, CA 1B SKU ladder

### 7.1. Hawaii Shipping & Handling Tiered Rates
Open: `v2.intuitiveshipping.app/scenarios/edit/131932`
*DUPLICATE → rename with ` REBRIEF` → Status **Testing** → Save. Edit/add inside the copy (method status doesn't matter inside a Testing scenario). Every new method: Rate type **Weight**. Keep the 27 lb scenario minimum (boundary move is on HOLD).*

- Edit Hawaii method (543054): rows **35.99 → 549.00** · **75 → 499.00** · **124 → 699.00** · **149 → 799.00** · **149.99 → 949.00** · **226 → 999.00**

### 7.2. Alaska Shipping & Handling Tiered Rates
Open: `v2.intuitiveshipping.app/scenarios/edit/131934`
*DUPLICATE → rename with ` REBRIEF` → Status **Testing** → Save. Edit/add inside the copy (method status doesn't matter inside a Testing scenario). Every new method: Rate type **Weight**. Keep the 27 lb minimum.*

- Edit Alaska method (543056): rows **35.99 → 549.00** · **75 → 499.00** · **124 → 699.00** · **149 → 799.00** · **149.99 → 949.00** · **226 → 999.00**

### 7.3. US Territories & APO's Tiered Rates
Open: `v2.intuitiveshipping.app/scenarios/edit/131930`
*DUPLICATE → rename with ` REBRIEF` → Status **Testing** → Save. Edit/add inside the copy (method status doesn't matter inside a Testing scenario). Every new method: Rate type **Weight**. (Separately identified Step 3 change per rebrief.)*

- Edit Territories method (543052): rows **74 → 499.00** · **149.99 → 799.00** · **150 → 849.00** · **225 → 999.00**

### 7.4. California Shipping & Handling (FF-RIT24) Tiered Rates
Open: `v2.intuitiveshipping.app/scenarios/edit/132515`
*DUPLICATE → rename with ` REBRIEF` → Status **Testing** → Save. Edit/add inside the copy (method status doesn't matter inside a Testing scenario). Every new method: Rate type **Weight**.*

- Edit ONLY the **Non Free Shipping Subzone** (1B) method (548826) to match live generic 1B 548830: row 1 Up to **149** · cost **149**; row 2 Up to **1797** · cost **1** · per unit **1**. Leave the Free Shipping Subzone (1A) method unchanged.

### 7.5. California Shipping (FF-WBB-3, FF-WBB-6) Tiered Rates
Open: `v2.intuitiveshipping.app/scenarios/edit/140131`
*DUPLICATE → rename with ` REBRIEF` → Status **Testing** → Save. Edit/add inside the copy (method status doesn't matter inside a Testing scenario). Every new method: Rate type **Weight**.*

- Edit ONLY the **Non Free Shipping Subzone** (1B) method (587838) to match live generic 1B 548830: row 1 Up to **149** · cost **149**; row 2 Up to **600** · cost **1** · per unit **1**. Leave the Free Shipping Subzone (1A) method unchanged.

### 7.6. California Shipping (FF-WBB-9) Tiered Rates
Open: `v2.intuitiveshipping.app/scenarios/edit/140658`
*DUPLICATE → rename with ` REBRIEF` → Status **Testing** → Save. Edit/add inside the copy (method status doesn't matter inside a Testing scenario). Every new method: Rate type **Weight**.*

- Edit ONLY the **Non Free Shipping Subzone** (1B) method (591032) to match live generic 1B 548830: row 1 Up to **149** · cost **149**; row 2 Up to **594** · cost **1** · per unit **1**. Leave the Free Shipping Subzone (1A) method unchanged.

### 7.7. California Shipping & Handling (FF-RIT24) Incremental Rates
Open: `v2.intuitiveshipping.app/scenarios/edit/133602`
*DUPLICATE → rename with ` REBRIEF` → Status **Testing** → Save. Edit/add inside the copy (method status doesn't matter inside a Testing scenario). Every new method: Rate type **Weight**.*

- Edit ONLY the 1B (Non Free Shipping Subzone) method (551459) to match live generic 1B 548829: one row, Up to empty (~) · cost **1** · per unit **1**; delete the `Base Price` adjustment.

### 7.8. California Shipping FF-WBB-3, FF-WBB-6) Incremental Rates
Open: `v2.intuitiveshipping.app/scenarios/edit/140132`
*DUPLICATE → rename with ` REBRIEF` → Status **Testing** → Save. Edit/add inside the copy (method status doesn't matter inside a Testing scenario). Every new method: Rate type **Weight**.*

- Edit ONLY the 1B (Non Free Shipping Subzone) method (587840) to match live generic 1B 548829: one row, Up to empty (~) · cost **1** · per unit **1**; delete the `Base Price` adjustment.

### 7.9. California Shipping (FF-WBB-9) Incremental Rates
Open: `v2.intuitiveshipping.app/scenarios/edit/140794`
*DUPLICATE → rename with ` REBRIEF` → Status **Testing** → Save. Edit/add inside the copy (method status doesn't matter inside a Testing scenario). Every new method: Rate type **Weight**.*

- Edit ONLY the 1B (Non Free Shipping Subzone) method (591779) to match live generic 1B 548829: one row, Up to empty (~) · cost **1** · per unit **1**; delete the `Base Price` adjustment.


## HOLD / not in this build (state honestly in the update)

- AK/HI parcel/freight boundary 27 → 36 lb: HOLD (parcel formula $25/lb + $29 gives $904 at 35 lb vs $499 freight at 36 lb).
- CA 90704 (Avalon) 6A: sits in the 1,808-ZIP 1B subzone; needs a CA subzone-overlap test before building.
- RIT24 Northeast above 675 lb (551448): rebrief isolates it as an exception — unchanged.
- RIT24 West Coast above 675 lb (551451/551454) for the 13 WA island ZIPs: formula ranges differ from Zone 3 — unchanged.
- Zone moves (NY/FL → Northeast; 13 states → DC zone; ID/UT → USA zone) are live-only: done in the go-live window after Tim's GO.
- Feeds/GMC: now Kevin's; hand over the FSS Free-Shipping expression fix and FF 150+ lb findings.

## Proof checkpoints (Cart Tester, after each batch)
| After | Product | Ship to | Expected (copy / Testing rate) |
|---|---|---|---|
| 4.1 | Hex Dumbbell Rack (20 lb) | Boston 02108 | Fedex **$196.80** (live $160) |
| 4.2 | a <1 lb item | Boston 02108 | **$1.44 per 0.1 lb** row applies |
| 4.3 | 300 lb cart | Mackinac 49757 | 6A **$661.70** (1.95×300+76.70) alongside live |
| 4.7 | mixed cart (Free Shipping item + 100 lb item) | DC 20001 | **$388.90** |
| 5.1 | FF-RR-U-108 upright, 100 lb | Dallas 75201 / Boston 02108 / DC 20001 | **$399 / $488.80 / $443.90** |
| 5.6 | FF-WBB-3, 100 lb | Dallas / DC | **$349 / $388.90** |
| 7.2 | 100 lb | Anchorage 99501 | **$699** (live $749) |
| 7.5 | FF-WBB-3, 200 lb | Los Angeles 90001 | **$200** (live $199) |
