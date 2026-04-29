from __future__ import annotations

import json
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parent.parent.parent
MERGED_TRAIN_PATH = REPO_ROOT / "data" / "processed" / "reduced_merged_train.json"
FEATURE_LABEL_DIR = (
    REPO_ROOT / "data" / "processed" / "landmarks" / "features" / "asl_citizen" / "train" / "MEET"
)


def main() -> None:
    with MERGED_TRAIN_PATH.open(encoding="utf-8-sig") as f:
        merged_train = json.load(f)

    asl_citizen_samples = [
        sample
        for sample in merged_train
        if sample.get("source_dataset") == "asl_citizen" and sample.get("label") == "MEET"
    ][:3]

    print("Looking for ASL_Citizen MEET files in actual directory:")
    existing_files = sorted(FEATURE_LABEL_DIR.glob("*.npy"))[:5]

    print("First 5 actual files in MEET directory:")
    for f in existing_files:
        print(f"  {f.name}")

    print()
    print("Expected filenames from merged data:")
    for sample in asl_citizen_samples:
        sample_id = sample["sample_id"]
        print(f"  {sample_id}.npy")

    print()
    print("Do they match?")
    sample_ids = {sample["sample_id"] for sample in asl_citizen_samples}
    file_names = {f.stem for f in existing_files}
    print(f"Sample IDs: {len(sample_ids)}, File names: {len(file_names)}")
    print(f"Any overlap? {len(sample_ids & file_names) > 0}")


if __name__ == "__main__":
    main()
