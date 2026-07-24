import json
from pathlib import Path


def reject_duplicate_keys(pairs):
    result = {}
    for key, value in pairs:
        if key in result:
            raise AssertionError(f"Duplicate JSON key: {key}")
        result[key] = value
    return result


def load_shopify_template(path):
    source = Path(path).read_text()
    document = source[source.index("{") :]
    return json.loads(document, object_pairs_hook=reject_duplicate_keys)


def require_disclosure(text, provider):
    required = {
        "Affirm": (
            "Affirm lending disclosure:",
            "Payment options through Affirm are subject to an eligibility check",
        ),
        "Shop Pay Installments": (
            "Shop Pay Installments lending disclosure:",
            "Payment options through Shop Pay Installments are subject to an eligibility check",
        ),
    }

    for phrase in (*required[provider], "https://www.affirm.com/lenders", "https://www.affirm.com/licenses"):
        if phrase not in text:
            raise AssertionError(f"Missing {provider} disclosure text: {phrase}")


financing = load_shopify_template("templates/page.financing.json")
require_disclosure(financing["sections"]["image_with_text_bEcbEi"]["blocks"]["text_YkT9EE"]["settings"]["text"], "Shop Pay Installments")
require_disclosure(financing["sections"]["blocks_with_icons_grid_8R46NW"]["settings"]["text"], "Affirm")

updated = load_shopify_template("templates/page.financing-updated.json")
pay_overtime = updated["sections"]["pay_overtime_mWYXJJ"]
if not all(isinstance(block_id, str) for block_id in pay_overtime["block_order"]):
    raise AssertionError("Pay Over Time block_order must contain only block IDs")
if "card_title_6rNgUC" not in pay_overtime["block_order"]:
    raise AssertionError("Pay Over Time block_order is missing card_title_6rNgUC")

steps = updated["sections"]["installment_options_financing_nP68xW"]["blocks"]
require_disclosure(steps["step_pKfKQQ"]["settings"]["text"], "Shop Pay Installments")
require_disclosure(steps["step_nWpxmA"]["settings"]["text"], "Affirm")

print("Financing compliance checks passed.")
