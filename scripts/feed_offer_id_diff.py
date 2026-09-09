"""Check a Multifeeds offer-ID change against the acceptance criteria.

Usage:
    python3 scripts/feed_offer_id_diff.py <before.tsv> <after.tsv>

Both files are primary-feed exports (googleshoppingfs or
googleshoppingfrenchfitness). `before` is the live feed, `after` the duplicate
feed carrying the changed Item ID expression.

The criteria, per Tim's Sept 8 direction:

  - every row present in both files, joined on (item_group_id, old_id).
    `old_id` alone is NOT unique: five hex-dumbbell SKUs also exist as
    standalone Set products in googleshoppingfrenchfitness.
  - every column other than `id` byte-identical
  - a row's id changes only if it sat on the fallback, which is true exactly
    when its id equalled its item_group_id
  - each changed id becomes that row's variant SKU
  - composite <product ID>-<variant ID> ids never move
  - no duplicate ids remain in the output
"""

import csv
import sys
from pathlib import Path

HEX_COMPOSITE_PRODUCT = '10247596147004'


def load(path: str):
    with Path(path).open(encoding='utf-8-sig', newline='') as handle:
        rows = list(csv.DictReader(handle, delimiter='\t'))
    if not rows:
        raise AssertionError(f'{path} has no data rows')
    keys = [(r['item_group_id'].strip(), r['old_id'].strip()) for r in rows]
    if len(set(keys)) != len(keys):
        raise AssertionError(f'{path}: join key is not unique, cannot align rows')
    return {k: r for k, r in zip(keys, rows)}


def is_composite(value: str):
    return '-' in value and value.split('-')[0] == HEX_COMPOSITE_PRODUCT


def main(before_path: str, after_path: str):
    before = load(before_path)
    after = load(after_path)

    if set(before) != set(after):
        only_before = sorted(set(before) - set(after))[:10]
        only_after = sorted(set(after) - set(before))[:10]
        raise AssertionError(
            f'row sets differ: {len(before)} vs {len(after)} rows; '
            f'missing after={only_before} new after={only_after}'
        )

    columns = [c for c in next(iter(before.values())) if c != 'id']
    changed = []

    for key, old_row in before.items():
        new_row = after[key]

        for column in columns:
            if (old_row.get(column) or '') != (new_row.get(column) or ''):
                raise AssertionError(
                    f'{key}: column "{column}" changed, only id may move'
                )

        old_id = old_row['id'].strip()
        new_id = new_row['id'].strip()
        if old_id == new_id:
            continue

        group = old_row['item_group_id'].strip()
        if is_composite(old_id):
            raise AssertionError(f'{key}: composite id {old_id} moved to {new_id}')
        if old_id != group:
            raise AssertionError(
                f'{key}: id {old_id} changed but was not on the fallback '
                f'(item_group_id is {group}), so it came off the approved branch'
            )
        sku = key[1]
        if new_id != sku:
            raise AssertionError(f'{key}: id became {new_id}, expected the SKU {sku}')
        changed.append((key, old_id, new_id))

    new_ids = [r['id'].strip() for r in after.values()]
    duplicates = sorted({i for i in new_ids if new_ids.count(i) > 1})
    if duplicates:
        raise AssertionError(f'duplicate ids remain in the output: {duplicates}')

    old_ids = [r['id'].strip() for r in before.values()]
    print(f'rows            {len(before)}')
    print(f'rows changed    {len(changed)}')
    print(f'offers before   {len(set(old_ids))}')
    print(f'offers after    {len(set(new_ids))}')
    print(f'net offers      {len(set(new_ids)) - len(set(old_ids)):+d}')
    print('duplicate ids   0')
    print()
    for key, old_id, new_id in changed:
        print(f'  {old_id} -> {new_id}')


if __name__ == '__main__':
    if len(sys.argv) != 3:
        raise SystemExit(__doc__)
    main(sys.argv[1], sys.argv[2])
