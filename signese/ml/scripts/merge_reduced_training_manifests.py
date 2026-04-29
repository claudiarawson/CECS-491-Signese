"""
merge_reduced_training_manifests.py
----------------------------------
Merge reduced 8-label split manifests from WLASL and ASL Citizen into unified
train/val/test manifests for combined training.

Inputs:
  - data/processed/reduced_train.json
  - data/processed/reduced_val.json
  - data/processed/reduced_test.json
  - data/processed/asl_citizen_reduced_train.json
  - data/processed/asl_citizen_reduced_val.json
  - data/processed/asl_citizen_reduced_test.json

Outputs:
  - data/processed/reduced_merged_train.json
  - data/processed/reduced_merged_val.json
  - data/processed/reduced_merged_test.json
  - data/processed/reduced_merged_summary.json
"""

from __future__ import annotations

import json
from collections import defaultdict
from datetime import date
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parent.parent.parent
PROCESSED_DIR = REPO_ROOT / "data" / "processed"
FEATURES_DIR = PROCESSED_DIR / "landmarks" / "features"

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
REDUCED_LABEL_SET = set(REDUCED_LABELS)

INPUTS = {
    "wlasl": {
        "train": PROCESSED_DIR / "reduced_train.json",
        "val": PROCESSED_DIR / "reduced_val.json",
        "test": PROCESSED_DIR / "reduced_test.json",
    },
    "asl_citizen": {
        "train": PROCESSED_DIR / "asl_citizen_reduced_train.json",
        "val": PROCESSED_DIR / "asl_citizen_reduced_val.json",
        "test": PROCESSED_DIR / "asl_citizen_reduced_test.json",
    },
    "custom": {
        "train": PROCESSED_DIR / "custom_reduced_train.json",
        "val": PROCESSED_DIR / "custom_reduced_val.json",
        "test": PROCESSED_DIR / "custom_reduced_test.json",
    },
}

OUTPUTS = {
    "train": PROCESSED_DIR / "reduced_merged_train.json",
    "val": PROCESSED_DIR / "reduced_merged_val.json",
    "test": PROCESSED_DIR / "reduced_merged_test.json",
}
OUT_SUMMARY = PROCESSED_DIR / "reduced_merged_summary.json"


def load_split(path: Path) -> list[dict[str, Any]]:
    if not path.exists():
        raise FileNotFoundError(path)
    with path.open(encoding="utf-8-sig") as f:
        payload = json.load(f)
    if not isinstance(payload, list):
        raise ValueError(f"Expected list in {path}")
    return [row for row in payload if isinstance(row, dict)]


def sanitize_label(label: str) -> str:
    return "".join(ch if ch.isalnum() else "_" for ch in label.upper())


def safe_sample_id(sample_id: str) -> str:
    return sample_id.replace(":", "__").replace("/", "_").replace("\\", "_")


def make_feature_path(source_dataset: str, split: str, label: str, sample_id: str) -> Path:
    base = FEATURES_DIR
    label_dir = sanitize_label(label)
    sample_file = f"{safe_sample_id(sample_id)}.npy"

    if source_dataset == "asl_citizen":
        return base / "asl_citizen" / split / label_dir / sample_file
    if source_dataset == "custom":
        return base / "custom" / split / label_dir / sample_file
    return base / split / label_dir / sample_file


def dataset_inputs_available(split_paths: dict[str, Path]) -> bool:
    return all(path.exists() for path in split_paths.values())


def merge_reduced_training_manifests() -> dict[str, Any]:
    merged: dict[str, list[dict[str, Any]]] = {"train": [], "val": [], "test": []}
    dropped: list[dict[str, Any]] = []

    # Track duplicates and potential cross-dataset sample_id collisions.
    seen_key: set[tuple[str, str, str]] = set()  # (split, source_dataset, sample_id)
    sample_id_refs: dict[str, list[dict[str, Any]]] = defaultdict(list)

    counts_by_dataset: dict[str, dict[str, int]] = defaultdict(lambda: {"train": 0, "val": 0, "test": 0, "total": 0})
    counts_by_label: dict[str, dict[str, int]] = defaultdict(lambda: {"train": 0, "val": 0, "test": 0, "total": 0})
    counts_by_split: dict[str, dict[str, int]] = {
        "train": {"total": 0},
        "val": {"total": 0},
        "test": {"total": 0},
    }
    skipped_input_datasets: list[str] = []

    for source_dataset, split_paths in INPUTS.items():
        if not dataset_inputs_available(split_paths):
            skipped_input_datasets.append(source_dataset)
            continue
        _ = counts_by_dataset[source_dataset]
        for split, path in split_paths.items():
            rows = load_split(path)
            for row in rows:
                label = str(row.get("label", "")).strip()
                sample_id = str(row.get("sample_id", "")).strip()
                source_gloss = row.get("source_gloss")
                video_path = row.get("video_path")

                if not label or not sample_id:
                    dropped.append(
                        {
                            "source_dataset": source_dataset,
                            "split": split,
                            "sample_id": sample_id or None,
                            "label": label or None,
                            "reason": "missing_required_fields",
                        }
                    )
                    continue

                if label not in REDUCED_LABEL_SET:
                    dropped.append(
                        {
                            "source_dataset": source_dataset,
                            "split": split,
                            "sample_id": sample_id,
                            "label": label,
                            "reason": "label_not_in_reduced_set",
                        }
                    )
                    continue

                unique_key = (split, source_dataset, sample_id)
                if unique_key in seen_key:
                    dropped.append(
                        {
                            "source_dataset": source_dataset,
                            "split": split,
                            "sample_id": sample_id,
                            "label": label,
                            "reason": "duplicate_split_dataset_sample_id",
                        }
                    )
                    continue
                seen_key.add(unique_key)

                feature_path = make_feature_path(source_dataset, split, label, sample_id)
                if not feature_path.exists():
                    dropped.append(
                        {
                            "source_dataset": source_dataset,
                            "split": split,
                            "sample_id": sample_id,
                            "label": label,
                            "reason": "missing_feature_file",
                            "feature_path": str(feature_path.relative_to(REPO_ROOT)),
                        }
                    )
                    continue

                out_row = {
                    "label": label,
                    "source_dataset": source_dataset,
                    "source_gloss": source_gloss,
                    "sample_id": sample_id,
                    "signer_id": row.get("signer_id"),
                    "split": split,
                    "feature_path": str(feature_path.relative_to(REPO_ROOT)),
                    "video_path": video_path,
                    "notes": row.get("notes"),
                }
                merged[split].append(out_row)
                sample_id_refs[sample_id].append(out_row)

                counts_by_split[split]["total"] += 1
                counts_by_dataset[source_dataset][split] += 1
                counts_by_dataset[source_dataset]["total"] += 1
                counts_by_label[label][split] += 1
                counts_by_label[label]["total"] += 1

    # Resolve sample_id collisions across datasets by namespacing only conflicting IDs.
    collisions_resolved = 0
    for sample_id, refs in sample_id_refs.items():
        datasets = {str(r.get("source_dataset", "")) for r in refs}
        if len(datasets) <= 1:
            continue
        collisions_resolved += 1
        for row in refs:
            row["original_sample_id"] = sample_id
            row["sample_id"] = f"{row['source_dataset']}::{sample_id}"

    summary = {
        "generated_at": str(date.today()),
        "reduced_labels": list(REDUCED_LABELS),
        "inputs": {
            dataset: {split: str(path.relative_to(REPO_ROOT)) for split, path in splits.items()}
            for dataset, splits in INPUTS.items()
        },
        "outputs": {split: str(path.relative_to(REPO_ROOT)) for split, path in OUTPUTS.items()},
        "totals": {
            "merged_samples": sum(len(rows) for rows in merged.values()),
            "train": len(merged["train"]),
            "val": len(merged["val"]),
            "test": len(merged["test"]),
        },
        "counts_by_split": counts_by_split,
        "counts_by_dataset": dict(sorted(counts_by_dataset.items())),
        "counts_by_label": dict(sorted(counts_by_label.items())),
        "dropped": {
            "total": len(dropped),
            "by_reason": {},
            "samples": dropped,
        },
        "sample_id_collisions_resolved": collisions_resolved,
        "notes": [
            "Merged manifests include only rows with existing extracted feature files.",
            "Source provenance is preserved via source_dataset and source_gloss fields.",
        ],
        "skipped_input_datasets": skipped_input_datasets,
    }

    dropped_reason_counts: dict[str, int] = defaultdict(int)
    for item in dropped:
        dropped_reason_counts[str(item.get("reason", "unknown"))] += 1
    summary["dropped"]["by_reason"] = dict(sorted(dropped_reason_counts.items()))

    for split, out_path in OUTPUTS.items():
        out_path.write_text(json.dumps(merged[split], indent=2), encoding="utf-8")
    OUT_SUMMARY.write_text(json.dumps(summary, indent=2), encoding="utf-8")

    return summary


def main() -> None:
    summary = merge_reduced_training_manifests()

    print(f"[ok] Merged train   -> {OUTPUTS['train'].relative_to(REPO_ROOT)}")
    print(f"[ok] Merged val     -> {OUTPUTS['val'].relative_to(REPO_ROOT)}")
    print(f"[ok] Merged test    -> {OUTPUTS['test'].relative_to(REPO_ROOT)}")
    print(f"[ok] Merged summary -> {OUT_SUMMARY.relative_to(REPO_ROOT)}")
    print()
    print(f"  Total merged samples : {summary['totals']['merged_samples']}")
    print(f"  train={summary['totals']['train']} val={summary['totals']['val']} test={summary['totals']['test']}")
    print("  Counts by dataset:")
    for dataset, counts in summary["counts_by_dataset"].items():
        print(
            f"    {dataset:<12} total={counts['total']:<4} train={counts['train']:<4} val={counts['val']:<4} test={counts['test']:<4}"
        )
    print("  Counts by label:")
    for label in REDUCED_LABELS:
        counts = summary["counts_by_label"].get(label, {"total": 0, "train": 0, "val": 0, "test": 0})
        print(
            f"    {label:<8} total={counts['total']:<4} train={counts['train']:<4} val={counts['val']:<4} test={counts['test']:<4}"
        )
    print(f"  Dropped samples      : {summary['dropped']['total']}")
    print(f"  sample_id collisions : {summary['sample_id_collisions_resolved']}")
    if summary["skipped_input_datasets"]:
        print(f"  skipped input sets   : {', '.join(summary['skipped_input_datasets'])}")


if __name__ == "__main__":
    main()