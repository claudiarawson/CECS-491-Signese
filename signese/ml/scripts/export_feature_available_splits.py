"""
export_feature_available_splits.py
---------------------------------
Filter first-model split manifests down to rows that already have extracted
landmark feature files.

Inputs:
  - data/processed/first_model_train.json
  - data/processed/first_model_val.json
  - data/processed/first_model_test.json

Outputs:
  - data/processed/first_model_train_features_only.json
  - data/processed/first_model_val_features_only.json
  - data/processed/first_model_test_features_only.json
  - data/processed/first_model_feature_split_summary.json
"""

from __future__ import annotations

import json
import sys
from collections import defaultdict
from collections.abc import Sequence
from datetime import date
from pathlib import Path
from typing import Any

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from ml.training.dataset import REPO_ROOT, make_feature_path


PROCESSED_DIR = REPO_ROOT / "data" / "processed"
INPUT_SPLITS = {
    "train": PROCESSED_DIR / "first_model_train.json",
    "val": PROCESSED_DIR / "first_model_val.json",
    "test": PROCESSED_DIR / "first_model_test.json",
}
OUTPUT_SPLITS = {
    "train": PROCESSED_DIR / "first_model_train_features_only.json",
    "val": PROCESSED_DIR / "first_model_val_features_only.json",
    "test": PROCESSED_DIR / "first_model_test_features_only.json",
}
SUMMARY_OUT = PROCESSED_DIR / "first_model_feature_split_summary.json"


def load_split(path: Path) -> list[dict[str, Any]]:
    with path.open(encoding="utf-8-sig") as f:
        payload = json.load(f)
    if not isinstance(payload, Sequence):
        raise ValueError(f"Expected a list in {path}")
    rows: list[dict[str, Any]] = []
    for row in payload:
        if not isinstance(row, dict):
            continue
        rows.append(row)
    return rows


def filter_rows(rows: list[dict[str, Any]]) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    kept: list[dict[str, Any]] = []
    dropped: list[dict[str, Any]] = []

    for row in rows:
        label = str(row.get("label", "")).strip()
        sample_id = str(row.get("sample_id", "")).strip()
        split = str(row.get("split", "")).strip()

        if not label or not sample_id or not split:
            dropped.append({
                "sample_id": sample_id or None,
                "label": label or None,
                "split": split or None,
                "reason": "missing_required_fields",
            })
            continue

        feature_path = make_feature_path(split=split, label=label, sample_id=sample_id)
        if feature_path.exists():
            kept.append(row)
        else:
            dropped.append(
                {
                    "sample_id": sample_id,
                    "label": label,
                    "split": split,
                    "reason": "missing_feature_file",
                    "feature_path": str(feature_path.relative_to(REPO_ROOT)),
                }
            )

    return kept, dropped


def export_feature_available_splits() -> dict[str, Any]:
    summary: dict[str, Any] = {
        "generated_at": str(date.today()),
        "inputs": {k: str(v.relative_to(REPO_ROOT)) for k, v in INPUT_SPLITS.items()},
        "outputs": {k: str(v.relative_to(REPO_ROOT)) for k, v in OUTPUT_SPLITS.items()},
        "per_split": {},
        "totals": {"input": 0, "kept": 0, "dropped": 0},
        "dropped_by_reason": {},
        "kept_per_label": {},
    }

    dropped_by_reason: dict[str, int] = defaultdict(int)
    kept_per_label: dict[str, dict[str, int]] = defaultdict(lambda: {"train": 0, "val": 0, "test": 0, "total": 0})

    for split, input_path in INPUT_SPLITS.items():
        rows = load_split(input_path)
        kept, dropped = filter_rows(rows)

        OUTPUT_SPLITS[split].write_text(json.dumps(kept, indent=2), encoding="utf-8")

        summary["per_split"][split] = {
            "input": len(rows),
            "kept": len(kept),
            "dropped": len(dropped),
        }
        summary["totals"]["input"] += len(rows)
        summary["totals"]["kept"] += len(kept)
        summary["totals"]["dropped"] += len(dropped)

        for row in kept:
            label = str(row.get("label", ""))
            if label:
                kept_per_label[label][split] += 1
                kept_per_label[label]["total"] += 1

        for item in dropped:
            reason = str(item.get("reason", "unknown"))
            dropped_by_reason[reason] += 1

    summary["dropped_by_reason"] = dict(sorted(dropped_by_reason.items()))
    summary["kept_per_label"] = dict(sorted(kept_per_label.items()))
    SUMMARY_OUT.write_text(json.dumps(summary, indent=2), encoding="utf-8")
    return summary


def main() -> None:
    summary = export_feature_available_splits()
    print(f"[ok] Train features-only split -> {OUTPUT_SPLITS['train'].relative_to(REPO_ROOT)}")
    print(f"[ok] Val features-only split   -> {OUTPUT_SPLITS['val'].relative_to(REPO_ROOT)}")
    print(f"[ok] Test features-only split  -> {OUTPUT_SPLITS['test'].relative_to(REPO_ROOT)}")
    print(f"[ok] Summary                   -> {SUMMARY_OUT.relative_to(REPO_ROOT)}")
    print()
    for split, counts in summary["per_split"].items():
        print(
            f"  {split:<5} input={counts['input']:<3} kept={counts['kept']:<3} dropped={counts['dropped']:<3}"
        )


if __name__ == "__main__":
    main()
