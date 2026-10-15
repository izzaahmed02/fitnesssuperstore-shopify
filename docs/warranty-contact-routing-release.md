# Warranty contact routing — release record and rollback

Approved by Tim on the "Warranty claim routing — confirm intake and handoff for website alignment"
thread (Oct 13 corrections + Oct 13 other-brand revision; Saliha's final copy Oct 14). Contact-only:
no change to coverage, eligibility, exclusions, duration, warranty provider or legal terms.

| Page | Where the content lives | Change |
|---|---|---|
| /pages/warranty | `templates/page.warranty.json` → `rich_text_mwkV3i` / `text_bzQ7HD` | "Filing a Warranty Claim" → three-way contact block |
| /pages/warranty-legal-addendum | Shopify page body (Page `gid://shopify/Page/153650954556`) | "Filing a Warranty Claim" block; "Minor Defects" contact bullet; "Company Information" NGS label + French Fitness intake line |
| /pages/french-fitness-warranty | `templates/page.french-fitness-warranty.json` | None (links verified only) |

## Rollback

- Warranty page: revert this commit.
- Warranty Legal Addendum: in Shopify admin → Online Store → Pages → Warranty Legal Addendum → Show HTML,
  replace the body with the BEFORE block below (or run `pageUpdate` with it).

### Addendum body — BEFORE (live until this release)

```html
<style>
  ul {
    list-style: disc;
  }
</style>
<p>Effective Date: June 1, 2026</p>
<div class="warranty-addendum-content">
<h3>Warranty Service Coordination</h3>
<p>All warranty service, including parts, labor, and on-site repairs, is coordinated by National Gym Service LLC ("National Gym Service"), our in-house service coordinator. National Gym Service is an affiliated company under common ownership with TJF Ventures LLC d/b/a Fitness Superstore.</p>
<p>National Gym Service may use qualified third-party service providers and contractors to perform the actual repair and maintenance work. When you require warranty service, National Gym Service will coordinate these services by engaging appropriate service providers as needed.</p>
<p>You always contract with Fitness Superstore for all warranty coverage. National Gym Service is our service coordinator, not a separate party to your warranty agreement.</p>
<h3>Remanufactured Equipment Condition</h3>
<p>Remanufactured fitness equipment has been professionally refurbished to meet or exceed original manufacturer specifications for mechanical function and performance. However, remanufactured equipment may have:</p>
<ul>
<li>Minor cosmetic imperfections (scratches, scuffs, small dents)</li>
<li>Touch-up paint or color variations from original specifications</li>
<li>Replacement parts or components from different production runs</li>
<li>Signs of previous commercial use that do not affect function</li>
</ul>
<p>These cosmetic characteristics are normal for remanufactured equipment and are not considered defects. They do not constitute grounds for return, chargeback, or warranty claim. All remanufactured equipment is guaranteed to be mechanically sound and fully functional at delivery.</p>
<p>Important: Remanufactured commercial equipment is NOT returnable once delivered, except where a return is required by applicable law. These products are serviced and repaired under warranty rather than returned for comfort preference, noise level, buyer's remorse, or minor cosmetic concerns. See our Return Policy for details.</p>
<h3>Minor Defects and Cosmetic Issues at Delivery</h3>
<p>Report any concerns within 7 days of delivery. Resolution is through repair/parts – not returns.</p>
<p>If you notice minor defects or cosmetic issues when your equipment is delivered:</p>
<ul>
<li>Report within 7 days of delivery by contacting <a href="mailto:sales@fitnesssuperstore.com">sales@fitnesssuperstore.com</a>
</li>
<li>Provide photos documenting the issue</li>
<li>We will evaluate whether repair parts, touch-up solutions, or cosmetic components can be sent</li>
<li>If repair is needed, warranty service will be scheduled</li>
</ul>
<p>Resolution process: Minor issues are resolved through repair or replacement parts under warranty. This is faster and more cost-effective than returning heavy equipment. Returns are not accepted for issues that can be repaired or for cosmetic imperfections that do not affect function.</p>
<p>Note: Cosmetic imperfections on remanufactured equipment (scratches, scuffs, touch-up paint, color variations) that do not affect function are not covered and are not grounds for return or chargeback.</p>
<h3>Additional Warranty Costs</h3>
<p>The following actions and situations may incur additional warranty costs:</p>
<ul>
<li>Making an appointment for a service call and waiting until the service provider is in transit to cancel, or not canceling at all</li>
<li>Mislocating parts sent, or any situation that requires additional time and/or trips</li>
<li>Not being on site or not allowing the service provider to work on the equipment when they arrive, causing idle time</li>
<li>Providing inaccurate address info, causing reshipment of parts</li>
<li>Losing parts, or not sending parts back when asked</li>
</ul>
<p>If you cause additional warranty costs due to these behaviors, we reserve the right to assess the additional costs incurred, and you agree to be responsible for such costs.</p>
<p><strong>Service Appointment Requirements</strong></p>
<p>You must be present for scheduled service appointments. If you fail to be present for a scheduled appointment without prior notice:</p>
<ul>
<li>You will be responsible for the trip charge incurred by the service provider</li>
<li>Warranty service will be suspended until the trip charge is paid</li>
<li>A new service appointment will need to be scheduled</li>
</ul>
<p>You agree to work with us by providing photos, allowing technicians access to the equipment, and returning any requested parts.</p>
<p><strong>Parts Return Requirement</strong></p>
<p>When replacement parts are sent to you under warranty, you must return any unused, defective, or old parts using the return shipping label provided. Failure to return parts may void your warranty coverage.</p>
<h3>Filing a Warranty Claim</h3>
<p>To file a warranty claim, contact National Gym Service LLC:</p>
<p>Email: <a href="mailto:service@nationalgymservice.com">service@nationalgymservice.com</a><br>Phone: <a href="tel:+19252152927">+1-925-215-2927</a></p>
  
<h3>Legal Terms</h3>
<p>This warranty is provided by TJF Ventures LLC d/b/a Fitness Superstore, a California limited liability company. All warranty terms are subject to our Terms and Conditions, including the binding arbitration agreement and class action waiver. Any disputes relating to warranty coverage shall be resolved in accordance with our Terms and Conditions, with exclusive venue in Solano County, California.</p>
<p>This Warranty Legal Addendum applies to, and is incorporated into, all warranties we publish on our Website, including our general Warranty page and our French Fitness Warranty page.</p>
<p>See our full Terms and Conditions at: <a href="https://www.fitnesssuperstore.com/pages/terms-conditions">https://www.fitnesssuperstore.com/pages/terms-conditions</a></p>
<h3>Company Information</h3>
<p>Sales &amp; Warranty Administration:<br>TJF Ventures LLC d/b/a Fitness Superstore<br>537 Stone Rd. STE F, Benicia, CA 94510<br>California Limited Liability Company</p>
<p>In-House Service Coordinator:<br>National Gym Service LLC d/b/a National Gym Service<br>(May use qualified third-party service providers)<br>Warranty claims and service requests: <a href="mailto:service@nationalgymservice.com">service@nationalgymservice.com</a> | <a href="tel:+19252152927">+1-925-215-2927</a></p>
  
</div>
```

### Addendum body — AFTER

```html
<style>
  ul {
    list-style: disc;
  }
</style>
<p>Effective Date: June 1, 2026</p>
<div class="warranty-addendum-content">
<h3>Warranty Service Coordination</h3>
<p>All warranty service, including parts, labor, and on-site repairs, is coordinated by National Gym Service LLC ("National Gym Service"), our in-house service coordinator. National Gym Service is an affiliated company under common ownership with TJF Ventures LLC d/b/a Fitness Superstore.</p>
<p>National Gym Service may use qualified third-party service providers and contractors to perform the actual repair and maintenance work. When you require warranty service, National Gym Service will coordinate these services by engaging appropriate service providers as needed.</p>
<p>You always contract with Fitness Superstore for all warranty coverage. National Gym Service is our service coordinator, not a separate party to your warranty agreement.</p>
<h3>Remanufactured Equipment Condition</h3>
<p>Remanufactured fitness equipment has been professionally refurbished to meet or exceed original manufacturer specifications for mechanical function and performance. However, remanufactured equipment may have:</p>
<ul>
<li>Minor cosmetic imperfections (scratches, scuffs, small dents)</li>
<li>Touch-up paint or color variations from original specifications</li>
<li>Replacement parts or components from different production runs</li>
<li>Signs of previous commercial use that do not affect function</li>
</ul>
<p>These cosmetic characteristics are normal for remanufactured equipment and are not considered defects. They do not constitute grounds for return, chargeback, or warranty claim. All remanufactured equipment is guaranteed to be mechanically sound and fully functional at delivery.</p>
<p>Important: Remanufactured commercial equipment is NOT returnable once delivered, except where a return is required by applicable law. These products are serviced and repaired under warranty rather than returned for comfort preference, noise level, buyer's remorse, or minor cosmetic concerns. See our Return Policy for details.</p>
<h3>Minor Defects and Cosmetic Issues at Delivery</h3>
<p>Report any concerns within 7 days of delivery. Resolution is through repair/parts – not returns.</p>
<p>If you notice minor defects or cosmetic issues when your equipment is delivered:</p>
<ul>
<li>Report within 7 days of delivery using the contact instructions for your equipment type under “Filing a Warranty Claim” below.</li>
<li>Provide photos documenting the issue</li>
<li>We will evaluate whether repair parts, touch-up solutions, or cosmetic components can be sent</li>
<li>If repair is needed, warranty service will be scheduled</li>
</ul>
<p>Resolution process: Minor issues are resolved through repair or replacement parts under warranty. This is faster and more cost-effective than returning heavy equipment. Returns are not accepted for issues that can be repaired or for cosmetic imperfections that do not affect function.</p>
<p>Note: Cosmetic imperfections on remanufactured equipment (scratches, scuffs, touch-up paint, color variations) that do not affect function are not covered and are not grounds for return or chargeback.</p>
<h3>Additional Warranty Costs</h3>
<p>The following actions and situations may incur additional warranty costs:</p>
<ul>
<li>Making an appointment for a service call and waiting until the service provider is in transit to cancel, or not canceling at all</li>
<li>Mislocating parts sent, or any situation that requires additional time and/or trips</li>
<li>Not being on site or not allowing the service provider to work on the equipment when they arrive, causing idle time</li>
<li>Providing inaccurate address info, causing reshipment of parts</li>
<li>Losing parts, or not sending parts back when asked</li>
</ul>
<p>If you cause additional warranty costs due to these behaviors, we reserve the right to assess the additional costs incurred, and you agree to be responsible for such costs.</p>
<p><strong>Service Appointment Requirements</strong></p>
<p>You must be present for scheduled service appointments. If you fail to be present for a scheduled appointment without prior notice:</p>
<ul>
<li>You will be responsible for the trip charge incurred by the service provider</li>
<li>Warranty service will be suspended until the trip charge is paid</li>
<li>A new service appointment will need to be scheduled</li>
</ul>
<p>You agree to work with us by providing photos, allowing technicians access to the equipment, and returning any requested parts.</p>
<p><strong>Parts Return Requirement</strong></p>
<p>When replacement parts are sent to you under warranty, you must return any unused, defective, or old parts using the return shipping label provided. Failure to return parts may void your warranty coverage.</p>
<h3>Filing a Warranty Claim</h3>
<p>Use the contact instructions for your equipment type:</p>
<p><strong>French Fitness:</strong> For warranty claims or parts requests, contact <a href="mailto:support@frenchfitness.com">support@frenchfitness.com</a> or <a href="tel:+19254306111">(925) 430-6111</a>. Support handles your request and coordinates the appropriate service handoff with National Gym Service.</p>
<p><strong>Remanufactured equipment covered by our warranty:</strong> Contact <a href="mailto:service@nationalgymservice.com">service@nationalgymservice.com</a> or <a href="tel:+19252152927">(925) 215-2927</a>.</p>
<p><strong>Other-brand new equipment purchased from Fitness Superstore:</strong> Contact National Gym Service at <a href="mailto:service@nationalgymservice.com">service@nationalgymservice.com</a> or <a href="tel:+19252152927">(925) 215-2927</a> for assistance with your manufacturer warranty claim. NGS will help coordinate the claim with the manufacturer and advise you of any steps you need to complete. The applicable manufacturer’s warranty terms and claim requirements apply; these products are not covered by our remanufactured-equipment warranty.</p>
  
<h3>Legal Terms</h3>
<p>This warranty is provided by TJF Ventures LLC d/b/a Fitness Superstore, a California limited liability company. All warranty terms are subject to our Terms and Conditions, including the binding arbitration agreement and class action waiver. Any disputes relating to warranty coverage shall be resolved in accordance with our Terms and Conditions, with exclusive venue in Solano County, California.</p>
<p>This Warranty Legal Addendum applies to, and is incorporated into, all warranties we publish on our Website, including our general Warranty page and our French Fitness Warranty page.</p>
<p>See our full Terms and Conditions at: <a href="https://www.fitnesssuperstore.com/pages/terms-conditions">https://www.fitnesssuperstore.com/pages/terms-conditions</a></p>
<h3>Company Information</h3>
<p>Sales &amp; Warranty Administration:<br>TJF Ventures LLC d/b/a Fitness Superstore<br>537 Stone Rd. STE F, Benicia, CA 94510<br>California Limited Liability Company</p>
<p>In-House Service Coordinator:<br>National Gym Service LLC d/b/a National Gym Service<br>(May use qualified third-party service providers)<br>Remanufactured-equipment warranty intake, other-brand manufacturer-claim assistance, and NGS service coordination: <a href="mailto:service@nationalgymservice.com">service@nationalgymservice.com</a> | <a href="tel:+19252152927">+1-925-215-2927</a></p>
<p>French Fitness warranty and parts intake: <a href="mailto:support@frenchfitness.com">support@frenchfitness.com</a> | <a href="tel:+19254306111">(925) 430-6111</a></p>
  
</div>
```
