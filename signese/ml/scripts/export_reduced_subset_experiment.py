"""
export_reduced_subset_experiment.py
----------------------------------
Export reduced feature-available split manifests for a smaller clean-label
experiment and a reduced label mapping.

Default reduced label set:
  - MEET
  - HOW
  - GOOD
  - NAME
  - YOU
  - NICE
  - HELLO
  - MORNING

Outputs:
  - data/processed/reduced_train.json
  - data/processed/reduced_val.json
  - data/processed/reduced_test.json
  - data/processed/reduced_label_to_index.json
  - data/processed/reduced_subset_summary.json
"""

from __future__ import annotations

import json
import sys
from collections import defaultdict
from datetime import date
from pathlib import Path
from typing import Any

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from ml.scripts.export_feature_available_splits import export_feature_available_splits


PROCESSED_DIR = REPO_ROOT / "data" / "processed"

REDUCED_LABELS = [
    "HELLO",
    "HOW",
    "YOU",
    "GOOD",
    "MORNING",
    "NICE",
    "MEET",
    "SEE",
    "WHAT",
    "NAME",
    "MY",
]

INPUT_SPLITS = {
    "train": PROCESSED_DIR / "first_model_train_features_only.json",
    "val": PROCESSED_DIR / "first_model_val_features_only.json",
    "test": PROCESSED_DIR / "first_model_test_features_only.json",
}

OUTPUT_SPLITS = {
    "train": PROCESSED_DIR / "reduced_train.json",
    "val": PROCESSED_DIR / "reduced_val.json",
    "test": PROCESSED_DIR / "reduced_test.json",
}

OUT_LABEL_MAP = PROCESSED_DIR / "reduced_label_to_index.json"
OUT_SUMMARY = PROCESSED_DIR / "reduced_subset_summary.json"


def load_split(path: Path) -> list[dict[str, Any]]:
    if not path.exists():
        raise FileNotFoundError(path)
    with path.open(encoding="utf-8-sig") as f:
        payload = json.load(f)
    if not isinstance(payload, list):
        raise ValueError(f"Expected list in {path}")
    return [row for row in payload if isinstance(row, dict)]


def export_reduced_subset_experiment() -> dict[str, Any]:
    # Ensure feature-only inputs are up to date before filtering to reduced labels.
    export_feature_available_splits()

    label_set = set(REDUCED_LABELS)
    summary: dict[str, Any] = {
        "generated_at": str(date.today()),
        "reduced_labels": list(REDUCED_LABELS),
        "label_count": len(REDUCED_LABELS),
        "inputs": {k: str(v.relative_to(REPO_ROOT)) for k, v in INPUT_SPLITS.items()},
        "outputs": {k: str(v.relative_to(REPO_ROOT)) for k, v in OUTPUT_SPLITS.items()},
        "per_split": {},
        "totals": {"input": 0, "kept": 0, "dropped": 0},
        "kept_per_label": {},
    }

    kept_per_label: dict[str, dict[str, int]] = defaultdict(
        lambda: {"train": 0, "val": 0, "test": 0, "total": 0}
    )

    for split, input_path in INPUT_SPLITS.items():
        rows = load_split(input_path)
        kept = [row for row in rows if str(row.get("label", "")).strip() in label_set]

        OUTPUT_SPLITS[split].write_text(json.dumps(kept, indent=2), encoding="utf-8")

        summary["per_split"][split] = {
            "input": len(rows),
            "kept": len(kept),
            "dropped": len(rows) - len(kept),
        }
        summary["totals"]["input"] += len(rows)
        summary["totals"]["kept"] += len(kept)
        summary["totals"]["dropped"] += len(rows) - len(kept)

        for row in kept:
            label = str(row.get("label", "")).strip()
            if not label:
                continue
            kept_per_label[label][split] += 1
            kept_per_label[label]["total"] += 1

    reduced_label_to_index = {label: index for index, label in enumerate(REDUCED_LABELS)}
    reduced_index_to_label = {str(index): label for index, label in enumerate(REDUCED_LABELS)}
    label_mapping_payload = {
        "generated_at": str(date.today()),
        "label_count": len(REDUCED_LABELS),
        "labels": list(REDUCED_LABELS),
        "label_to_index": reduced_label_to_index,
        "index_to_label": reduced_index_to_label,
    }
    OUT_LABEL_MAP.write_text(json.dumps(label_mapping_payload, indent=2), encoding="utf-8")

    summary["kept_per_label"] = dict(sorted(kept_per_label.items()))
    summary["label_mapping_path"] = str(OUT_LABEL_MAP.relative_to(REPO_ROOT))
    OUT_SUMMARY.write_text(json.dumps(summary, indent=2), encoding="utf-8")
    return summary


def main() -> None:
    summary = export_reduced_subset_experiment()
    print(f"[ok] Reduced train split  -> {OUTPUT_SPLITS['train'].relative_to(REPO_ROOT)}")
    print(f"[ok] Reduced val split    -> {OUTPUT_SPLITS['val'].relative_to(REPO_ROOT)}")
    print(f"[ok] Reduced test split   -> {OUTPUT_SPLITS['test'].relative_to(REPO_ROOT)}")
    print(f"[ok] Reduced label map    -> {OUT_LABEL_MAP.relative_to(REPO_ROOT)}")
    print(f"[ok] Reduced summary      -> {OUT_SUMMARY.relative_to(REPO_ROOT)}")
    print()
    for split, counts in summary["per_split"].items():
        print(
            f"  {split:<5} input={counts['input']:<3} kept={counts['kept']:<3} dropped={counts['dropped']:<3}"
        )


if __name__ == "__main__":
    main()
