"""
export_first_model_subset.py
----------------------------
Lock the first Signese baseline label subset from reconciled coverage results.

Inputs:
  - src/features/translate/model/dataset.manifest.json
  - data/processed/reconciled_dataset_coverage.json

Outputs:
  - data/processed/first_model_subset.json
  - data/processed/first_model_labels.txt
  - data/processed/first_model_summary.json

Usage (run from signese/):
    python ml/scripts/export_first_model_subset.py

Optional flags:
    --target-size 14
    --min-greetings 5
    --min-numbers 4
"""

from __future__ import annotations

import argparse
import json
import sys
from datetime import date
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parent.parent.parent
DEFAULT_MANIFEST = REPO_ROOT / "src" / "features" / "translate" / "model" / "dataset.manifest.json"
DEFAULT_RECONCILED = REPO_ROOT / "data" / "processed" / "reconciled_dataset_coverage.json"
PROCESSED_DIR = REPO_ROOT / "data" / "processed"

OUT_SUBSET = PROCESSED_DIR / "first_model_subset.json"
OUT_LABELS = PROCESSED_DIR / "first_model_labels.txt"
OUT_SUMMARY = PROCESSED_DIR / "first_model_summary.json"


def load_json(path: Path) -> dict[str, Any]:
    if not path.exists():
        sys.exit(f"[error] Missing required input: {path}")
    with path.open(encoding="utf-8-sig") as f:
        return json.load(f)


def build_manifest_index(manifest: dict[str, Any]) -> dict[str, dict[str, Any]]:
    index: dict[str, dict[str, Any]] = {}
    for group_entries in manifest.get("label_groups", {}).values():
        for entry in group_entries:
            if entry.get("include") is True:
                index[str(entry.get("label"))] = entry
    return index


def build_candidates(
    reconciled: dict[str, Any],
    manifest_index: dict[str, dict[str, Any]],
) -> list[dict[str, Any]]:
    candidates: list[dict[str, Any]] = []
    for row in reconciled.get("labels", []):
        if row.get("recommended_new_status") != "confirmed_in_dataset":
            continue

        label = str(row.get("label", "")).strip()
        if not label or label not in manifest_index:
            continue

        manifest_entry = manifest_index[label]
        clip_count = max(
            int(row.get("asl_citizen_clip_count", 0) or 0),
            int(row.get("wlasl_clip_count", 0) or 0),
        )

        candidates.append(
            {
                "label": label,
                "group": manifest_entry.get("group"),
                "current_status": manifest_entry.get("status"),
                "source_dataset": row.get("recommended_source", "unknown"),
                "clip_count": clip_count,
            }
        )

    candidates.sort(key=lambda x: (-x["clip_count"], x["label"]))
    return candidates


def choose_first_subset(
    candidates: list[dict[str, Any]],
    target_size: int,
    min_greetings: int,
    min_numbers: int,
) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    selected: list[dict[str, Any]] = []
    selected_labels: set[str] = set()

    greetings = [c for c in candidates if c.get("group") == "greetings_intro"]
    numbers = [c for c in candidates if c.get("group") == "numbers"]

    # 1) Guarantee greeting/introduction representation.
    for c in greetings[:min_greetings]:
        selected.append(c)
        selected_labels.add(c["label"])

    # 2) Guarantee numeric representation.
    for c in numbers:
        if len([x for x in selected if x.get("group") == "numbers"]) >= min_numbers:
            break
        if c["label"] in selected_labels:
            continue
        selected.append(c)
        selected_labels.add(c["label"])

    # 3) Fill remaining slots by strongest clip counts across all groups.
    for c in candidates:
        if len(selected) >= target_size:
            break
        if c["label"] in selected_labels:
            continue
        selected.append(c)
        selected_labels.add(c["label"])

    selected.sort(key=lambda x: (-x["clip_count"], x["label"]))
    deferred = [c for c in candidates if c["label"] not in selected_labels]
    return selected, deferred


def reason_for_selection(
    row: dict[str, Any],
    top_greetings: set[str],
    top_numbers: set[str],
) -> str:
    label = row["label"]
    if label in top_greetings:
        return "Selected as a top-coverage greeting/introduction label for baseline conversation utility."
    if label in top_numbers:
        return "Selected as a top-coverage number label for early numeric recognition coverage."
    return "Selected for high clip coverage to stabilize first baseline training."


def write_outputs(
    selected: list[dict[str, Any]],
    deferred: list[dict[str, Any]],
    manifest_version: str,
    target_size: int,
    min_greetings: int,
    min_numbers: int,
) -> None:
    top_greetings = {
        x["label"] for x in selected if x.get("group") == "greetings_intro"
    }
    top_numbers = {x["label"] for x in selected if x.get("group") == "numbers"}

    subset_payload = {
        "generated_at": str(date.today()),
        "manifest_version": manifest_version,
        "selection_policy": {
            "target_size": target_size,
            "min_greetings": min_greetings,
            "min_numbers": min_numbers,
            "strategy": "coverage-first with guaranteed greetings + numbers mix",
        },
        "labels": selected,
    }

    summary_payload = {
        "generated_at": str(date.today()),
        "selected_labels": [
            {
                "label": row["label"],
                "group": row["group"],
                "clip_count": row["clip_count"],
                "source_dataset": row["source_dataset"],
                "why_selected": reason_for_selection(row, top_greetings, top_numbers),
            }
            for row in selected
        ],
        "excluded_but_matched_labels": [
            {
                "label": row["label"],
                "group": row["group"],
                "clip_count": row["clip_count"],
                "source_dataset": row["source_dataset"],
                "reason_deferred": "Matched and trainable, but deferred to keep first baseline subset small and stable.",
            }
            for row in deferred
        ],
    }

    labels_text = "\n".join(row["label"] for row in selected) + "\n"

    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    OUT_SUBSET.write_text(json.dumps(subset_payload, indent=2), encoding="utf-8")
    OUT_LABELS.write_text(labels_text, encoding="utf-8")
    OUT_SUMMARY.write_text(json.dumps(summary_payload, indent=2), encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Export first locked Signese model subset from reconciled coverage."
    )
    parser.add_argument("--manifest", type=Path, default=DEFAULT_MANIFEST)
    parser.add_argument("--reconciled", type=Path, default=DEFAULT_RECONCILED)
    parser.add_argument("--target-size", type=int, default=14)
    parser.add_argument("--min-greetings", type=int, default=5)
    parser.add_argument("--min-numbers", type=int, default=4)
    args = parser.parse_args()

    target_size = max(12, min(15, args.target_size))
    min_greetings = max(0, args.min_greetings)
    min_numbers = max(0, args.min_numbers)

    manifest = load_json(args.manifest.resolve())
    reconciled = load_json(args.reconciled.resolve())

    manifest_index = build_manifest_index(manifest)
    candidates = build_candidates(reconciled, manifest_index)

    if not candidates:
        sys.exit("[error] No confirmed_in_dataset labels available in reconciled report.")

    selected, deferred = choose_first_subset(
        candidates,
        target_size=target_size,
        min_greetings=min_greetings,
        min_numbers=min_numbers,
    )

    write_outputs(
        selected,
        deferred,
        manifest_version=str(manifest.get("version", "unknown")),
        target_size=target_size,
        min_greetings=min_greetings,
        min_numbers=min_numbers,
    )

    print(f"[ok] First model subset -> {OUT_SUBSET.relative_to(REPO_ROOT)}")
    print(f"[ok] Label list         -> {OUT_LABELS.relative_to(REPO_ROOT)}")
    print(f"[ok] Summary            -> {OUT_SUMMARY.relative_to(REPO_ROOT)}")
    print()
    print(f"  Total selected labels : {len(selected)}")
    print(f"  First-model labels    : {', '.join(row['label'] for row in selected)}")
    if deferred:
        print(f"  Matched labels deferred: {', '.join(row['label'] for row in deferred)}")
    else:
        print("  Matched labels deferred: (none)")


if __name__ == "__main__":
    main()
