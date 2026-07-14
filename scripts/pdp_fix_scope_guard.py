"""Fails CI if this branch's diff against main touches anything outside the
approved PDP option-picker CSS fix. Guards against the Shopify<->GitHub theme
sync recontaminating this branch with unrelated app-embed/collection/search
changes, as happened on PR #610 and #612."""

import os
import subprocess
import sys

ALLOWED_FILES = {
    "sections/main-product.liquid",
    "sections/main-product-comb.liquid",
    "sections/main-product-variants.liquid",
    "scripts/pdp_fix_scope_guard.py",
    ".github/workflows/pdp-fix-scope-guard.yml",
}

base_ref = os.environ.get("GITHUB_BASE_REF") or "main"
subprocess.run(["git", "fetch", "origin", base_ref], check=True)

diff = subprocess.run(
    ["git", "diff", "--name-only", f"origin/{base_ref}...HEAD"],
    capture_output=True,
    text=True,
    check=True,
).stdout.split()

extra = [f for f in diff if f not in ALLOWED_FILES]

if extra:
    print("Files outside the approved PDP fix scope were detected:")
    for f in extra:
        print(f"  - {f}")
    print(
        "\nIf this came from an automated 'Update from Shopify for theme ...' "
        "commit, the preview theme for this branch is still GitHub-connected "
        "and someone edited it in the Shopify theme editor. Disconnect that "
        "sync and rebuild this branch from a clean main."
    )
    sys.exit(1)

print("Scope check passed: only the approved PDP fix files changed.")
