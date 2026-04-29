from __future__ import annotations

import json
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parent.parent.parent
MERGED_TRAIN_PATH = REPO_ROOT / "data" / "processed" / "reduced_merged_train.json"
LANDMARKS_DIR = REPO_ROOT / "data" / "processed" / "landmarks"


def main() -> None:
    with MERGED_TRAIN_PATH.open(encoding="utf-8-sig") as f:
        merged_train = json.load(f)

    asl_citizen_samples = [sample for sample in merged_train if sample.get("source_dataset") == "asl_citizen"][:3]

    print("Sample ASL_Citizen records:")
    for i, sample in enumerate(asl_citizen_samples):
        sample_id = sample.get("sample_id")
        label = sample.get("label")
        print(f"{i}: {label} - {sample_id}")

    print()
    print("Checking if feature files exist:")
    for i, sample in enumerate(asl_citizen_samples):
        label = sample.get("label")
        sample_id = sample.get("sample_id")

        feature_path = LANDMARKS_DIR / "asl_citizen" / "train" / str(label) / f"{sample_id}.npy"
        exists = feature_path.exists()
        print(
            f"{i}: {label}/{sample_id} -> {feature_path.relative_to(LANDMARKS_DIR)} : "
            f"{'EXISTS' if exists else 'MISSING'}"
        )

        if not exists:
            label_dir = LANDMARKS_DIR / "asl_citizen" / "train" / str(label)
            if label_dir.exists():
                files = list(label_dir.glob("*.npy"))
                preview = [f.name[:20] for f in files[:3]]
                print(f"   Files in {label} dir: {preview}...")


if __name__ == "__main__":
    main()
