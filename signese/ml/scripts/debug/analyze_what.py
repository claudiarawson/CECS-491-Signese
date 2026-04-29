from __future__ import annotations

import json
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parent.parent.parent
MERGED_TEST_PATH = REPO_ROOT / "data" / "processed" / "reduced_merged_test.json"


def main() -> None:
    with MERGED_TEST_PATH.open(encoding="utf-8-sig") as f:
        merged_test = json.load(f)

    test_what = [sample for sample in merged_test if sample.get("label") == "WHAT"]

    print(f"Total test WHAT samples: {len(test_what)}")
    print()
    print("Test WHAT samples by signer:")
    signer_counts: dict[object, int] = {}
    for sample in test_what:
        signer = sample.get("signer_id")
        signer_counts[signer] = signer_counts.get(signer, 0) + 1

    for signer in sorted(signer_counts.keys(), key=lambda value: str(value)):
        print(f"  {signer}: {signer_counts[signer]}")

    print()
    print("All test WHAT samples:")
    for sample in test_what:
        source = sample.get("source_dataset")
        signer = sample.get("signer_id")
        sample_id = sample.get("sample_id")
        print(f"  {sample_id} ({source}, {signer})")


if __name__ == "__main__":
    main()
