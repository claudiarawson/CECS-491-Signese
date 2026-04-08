"""
export_reduced_label_data_needs.py
---------------------------------
Export a data-expansion report for the reduced 8-label Signese experiment.

Inputs:
  - data/processed/reduced_subset_summary.json
  - data/processed/reduced_train.json
  - data/processed/reduced_val.json
  - data/processed/reduced_test.json

Outputs:
  - data/processed/reduced_label_data_needs.json
  - data/processed/reduced_label_counts.csv
"""

from __future__ import annotations

import csv
import json
from datetime import date
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parent.parent.parent
PROCESSED_DIR = REPO_ROOT / "data" / "processed"

SUMMARY_PATH = PROCESSED_DIR / "reduced_subset_summary.json"
SPLIT_PATHS = {
    "train": PROCESSED_DIR / "reduced_train.json",
    "val": PROCESSED_DIR / "reduced_val.json",
    "test": PROCESSED_DIR / "reduced_test.json",
}

OUT_JSON = PROCESSED_DIR / "reduced_label_data_needs.json"
OUT_CSV = PROCESSED_DIR / "reduced_label_counts.csv"

# Target split ratios for basic balance checks.
TARGET_SPLIT_RATIOS = {
    "train": 0.70,
    "val": 0.15,
    "test": 0.15,
}


def load_json(path: Path) -> Any:
    if not path.exists():
        raise FileNotFoundError(path)
    with path.open(encoding="utf-8-sig") as f:
        return json.load(f)


def load_split(path: Path) -> list[dict[str, Any]]:
    payload = load_json(path)
    if not isinstance(payload, list):
        raise ValueError(f"Expected list in {path}")
    return [row for row in payload if isinstance(row, dict)]


def compute_counts_per_label(
    labels: list[str],
    split_rows: dict[str, list[dict[str, Any]]],
) -> dict[str, dict[str, int]]:
    counts = {
        label: {"train": 0, "val": 0, "test": 0, "total": 0}
        for label in labels
    }

    for split, rows in split_rows.items():
        for row in rows:
            label = str(row.get("label", "")).strip()
            if label not in counts:
                continue
            counts[label][split] += 1
            counts[label]["total"] += 1

    return counts


def compute_balance_flags(label_counts: dict[str, int]) -> tuple[list[str], float]:
    total = max(1, label_counts["total"])
    ratios = {
        "train": label_counts["train"] / total,
        "val": label_counts["val"] / total,
        "test": label_counts["test"] / total,
    }

    flags: list[str] = []
    if label_counts["val"] == 0:
        flags.append("no_val")
    if label_counts["test"] == 0:
        flags.append("no_test")

    # Manhattan distance to target split mix as a simple imbalance score.
    imbalance_score = sum(abs(ratios[s] - TARGET_SPLIT_RATIOS[s]) for s in ("train", "val", "test"))
    if imbalance_score >= 0.45:
        flags.append("weak_split_balance")

    return flags, imbalance_score


def build_recommendation(total_count: int, flags: list[str]) -> str:
    notes: list[str] = []

    if total_count <= 6:
        notes.append("Highest urgency: prioritize custom Signese recordings immediately")
    elif total_count <= 8:
        notes.append("High urgency: expand with both public dataset clips and custom Signese recordings")
    else:
        notes.append("Moderate urgency: continue collecting more public dataset clips")

    if "no_val" in flags or "no_test" in flags:
        notes.append("Recover additional WLASL clips for missing validation/test coverage")

    if "weak_split_balance" in flags:
        notes.append("Add data specifically for weaker splits to improve balance")

    return "; ".join(notes)


def build_report() -> dict[str, Any]:
    summary = load_json(SUMMARY_PATH)
    if not isinstance(summary, dict):
        raise ValueError(f"Expected object in {SUMMARY_PATH}")

    reduced_labels = summary.get("reduced_labels")
    if not isinstance(reduced_labels, list) or not all(isinstance(label, str) for label in reduced_labels):
        raise ValueError("reduced_subset_summary.json missing valid reduced_labels list")

    split_rows = {split: load_split(path) for split, path in SPLIT_PATHS.items()}
    counts_per_label = compute_counts_per_label(reduced_labels, split_rows)

    ranking_rows: list[dict[str, Any]] = []
    for label in reduced_labels:
        label_counts = counts_per_label[label]
        flags, imbalance_score = compute_balance_flags(label_counts)
        recommendation = build_recommendation(label_counts["total"], flags)

        ranking_rows.append(
            {
                "label": label,
                "train_count": label_counts["train"],
                "val_count": label_counts["val"],
                "test_count": label_counts["test"],
                "total_count": label_counts["total"],
                "recommendation": recommendation,
                "balance_flags": flags,
                "imbalance_score": round(imbalance_score, 4),
            }
        )

    # Priority: fewest usable clips first, then most imbalanced.
    ranking_rows.sort(key=lambda row: (row["total_count"], -row["imbalance_score"], row["label"]))
    for index, row in enumerate(ranking_rows, start=1):
        row["priority_rank"] = index

    return {
        "generated_at": str(date.today()),
        "inputs": {
            "summary": str(SUMMARY_PATH.relative_to(REPO_ROOT)),
            "splits": {split: str(path.relative_to(REPO_ROOT)) for split, path in SPLIT_PATHS.items()},
        },
        "reduced_label_count": len(reduced_labels),
        "total_usable_clips": sum(row["total_count"] for row in ranking_rows),
        "labels": ranking_rows,
    }


def write_csv(rows: list[dict[str, Any]], path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fieldnames = [
        "label",
        "priority_rank",
        "train_count",
        "val_count",
        "test_count",
        "total_count",
        "recommendation",
    ]
    with path.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for row in rows:
            writer.writerow({name: row[name] for name in fieldnames})


def export_reduced_label_data_needs() -> dict[str, Any]:
    report = build_report()

    OUT_JSON.write_text(json.dumps(report, indent=2), encoding="utf-8")
    write_csv(report["labels"], OUT_CSV)
    return report


def main() -> None:
    report = export_reduced_label_data_needs()

    print(f"[ok] Reduced data-needs report -> {OUT_JSON.relative_to(REPO_ROOT)}")
    print(f"[ok] Reduced label counts CSV  -> {OUT_CSV.relative_to(REPO_ROOT)}")
    print()
    print("  Highest-priority labels:")
    for row in report["labels"][:5]:
        print(
            f"    #{row['priority_rank']:<2} {row['label']:<8} "
            f"total={row['total_count']:<3} "
            f"train={row['train_count']:<3} val={row['val_count']:<3} test={row['test_count']:<3}"
        )


if __name__ == "__main__":
    main()