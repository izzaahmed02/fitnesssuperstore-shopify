"""Read-only guardrails for the PDP AI Master export.

The approved sample lane has no write path. That is not a promise in a
README, it is enforced here and asserted on every run. If any of these
checks fail the run aborts before a single HTTP request is made.
"""

from __future__ import annotations

import re

# Anything that could mutate the store. Checked against every GraphQL
# document the harness is about to send.
_FORBIDDEN_TOKENS = (
    "mutation",
    "productUpdate",
    "productCreate",
    "productDelete",
    "productVariantsBulk",
    "metafieldsSet",
    "metafieldsDelete",
    "metaobjectUpdate",
    "metaobjectCreate",
    "metaobjectDelete",
    "inventorySet",
    "inventoryAdjust",
    "publishablePublish",
    "publishableUnpublish",
    "bulkOperationRunMutation",
    "stagedUploadsCreate",
)

# Fields that must never leave an internal output, no matter what an
# operator passes on the command line.
INTERNAL_ONLY_FIELDS = frozenset({"cost_internal"})

# Fields that are fetched for QA visibility but must never be embedded or
# cached as a persistent AI fact. Mirrors field_source_matrix_v5.csv.
VOLATILE_FIELDS = frozenset(
    {
        "price",
        "compare_at_price",
        "retail_price",
        "inventory_quantity",
        "inventory_policy",
        "available_for_sale",
        "cost_internal",
        "warranty",
        "warranty_info",
        "ships",
        "processing_time",
        "processing_time_long",
        "promo_messaging",
        "financing_messaging",
        "delivery_installation_notes",
        "preorder_backorder_status",
        "review_rating",
        "review_count",
    }
)


class ReadOnlyViolation(RuntimeError):
    """Raised when something in the run could write to Shopify."""


def assert_read_only(document: str, source: str) -> None:
    """Abort unless `document` is a pure read.

    Comment lines are stripped first so that prose in the query file (which
    legitimately uses the word "mutation" to say there isn't one) does not
    trip the check.
    """
    body = "\n".join(
        line for line in document.splitlines() if not line.lstrip().startswith("#")
    )

    for token in _FORBIDDEN_TOKENS:
        if re.search(rf"\b{re.escape(token)}\b", body, flags=re.IGNORECASE):
            raise ReadOnlyViolation(
                f"{source}: found forbidden token {token!r}. "
                "The approved sample lane is read-only; refusing to run."
            )

    if not re.search(r"\bquery\b", body):
        raise ReadOnlyViolation(
            f"{source}: no query operation found. Refusing to send an "
            "unidentified document."
        )


def assert_no_seed_input(paths: list[str]) -> None:
    """Refuse to read anything from the ChatGPT starter CSV lineage.

    Per the V5 correction, starter values are scaffolding and must never be
    carried into an export. Enforcing it here is why seed_origin_flag can be
    reported as false rather than merely asserted.
    """
    for path in paths:
        lowered = path.lower()
        if "pdp_ai_master" in lowered and lowered.endswith(".csv"):
            if "field_source_matrix" in lowered:
                continue
            raise ReadOnlyViolation(
                f"{path}: refusing to seed an export from a starter CSV. "
                "Shopify is the only factual source in this lane."
            )


def scrub_internal(record: dict) -> dict:
    """Drop internal-only fields. Used for any non-internal artifact."""
    return {k: v for k, v in record.items() if k not in INTERNAL_ONLY_FIELDS}
