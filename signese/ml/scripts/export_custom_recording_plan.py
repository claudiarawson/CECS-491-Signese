"""
export_custom_recording_plan.py
------------------------------
Create a custom-data recording plan for the reduced 8-label Signese experiment.

Inputs:
  - data/processed/reduced_label_data_needs.json

Outputs:
  - data/processed/custom_recording_plan.json
  - data/processed/custom_recording_checklist.csv

Expected custom data layout:
  - data/raw/custom/<LABEL>/<signer_id>/<clip_name>.mp4
"""

from __future__ import annotations

import csv
import json
from datetime import date
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parent.parent.parent
PROCESSED_DIR = REPO_ROOT / "data" / "processed"
CUSTOM_ROOT = REPO_ROOT / "data" / "raw" / "custom"

INPUT_NEEDS_PATH = PROCESSED_DIR / "reduced_label_data_needs.json"
OUT_PLAN_PATH = PROCESSED_DIR / "custom_recording_plan.json"
OUT_CHECKLIST_PATH = PROCESSED_DIR / "custom_recording_checklist.csv"

TARGET_TOTAL_PER_LABEL = 12


def load_json(path: Path) -> Any:
    if not path.exists():
        raise FileNotFoundError(path)
    with path.open(encoding="utf-8-sig") as f:
        return json.load(f)


def compute_target_signer_count(recommended_new_clips: int) -> int:
    if recommended_new_clips >= 12:
        return 5
    if recommended_new_clips >= 8:
        return 4
    return 3


def compute_recommended_clips(label_row: dict[str, Any]) -> tuple[int, dict[str, int], list[str]]:
    current_total = int(label_row["total_count"])
    train_count = int(label_row["train_count"])
    val_count = int(label_row["val_count"])
    test_count = int(label_row["test_count"])

    balance_flags = label_row.get("balance_flags", [])
    if not isinstance(balance_flags, list):
        balance_flags = []
    balance_flags = [str(flag) for flag in balance_flags]

    # Baseline volume target.
    volume_gap = max(0, TARGET_TOTAL_PER_LABEL - current_total)

    # Explicit split-balance fixes.
    add_val = 0
    add_test = 0
    notes: list[str] = []

    if val_count == 0:
        add_val += 2
        notes.append("Missing validation support; record extra val-oriented clips")
    elif val_count == 1:
        add_val += 1

    if test_count == 0:
        add_test += 2
        notes.append("Missing test support; record extra test-oriented clips")
    elif test_count == 1:
        add_test += 1

    if "weak_split_balance" in balance_flags:
        # Add a little more to help rebalance away from train-heavy distributions.
        add_val += 1
        add_test += 1
        notes.append("Weak split balance; bias additional clips toward val/test")

    balance_gap = add_val + add_test
    recommended_new = max(volume_gap, balance_gap)

    # Keep momentum for moderate labels even if close to target.
    if recommended_new == 0 and current_total < 14:
        recommended_new = 2

    target_val = min(add_val, recommended_new)
    target_test = min(add_test, max(0, recommended_new - target_val))
    target_train = max(0, recommended_new - target_val - target_test)

    # If train becomes zero while val/test are covered, keep at least one train clip for signer diversity.
    if recommended_new >= 3 and target_train == 0:
        target_train = 1
        if target_val > target_test and target_val > 0:
            target_val -= 1
        elif target_test > 0:
            target_test -= 1

    if train_count <= 4:
        notes.append("Low train support; include several training clips from diverse signers")

    return recommended_new, {
        "train": target_train,
        "val": target_val,
        "test": target_test,
    }, notes


def build_notes(label_row: dict[str, Any], split_targets: dict[str, int], extra_notes: list[str]) -> str:
    notes: list[str] = []
    notes.append(
        "Suggested split allocation: "
        f"train={split_targets['train']}, val={split_targets['val']}, test={split_targets['test']}"
    )

    notes.extend(extra_notes)

    recommendation = str(label_row.get("recommendation", "")).lower()
    if "recover additional wlasl" in recommendation:
        notes.append("Also attempt recovered WLASL clips for this label")
    notes.append("Prioritize signer diversity and varied backgrounds/lighting")
    return "; ".join(notes)


def build_plan(needs_payload: dict[str, Any]) -> dict[str, Any]:
    labels_payload = needs_payload.get("labels")
    if not isinstance(labels_payload, list):
        raise ValueError("reduced_label_data_needs.json missing labels list")

    plan_rows: list[dict[str, Any]] = []
    for row in labels_payload:
        if not isinstance(row, dict):
            continue
        label = str(row.get("label", "")).strip()
        if not label:
            continue

        recommended_new, split_targets, extra_notes = compute_recommended_clips(row)
        target_signers = compute_target_signer_count(recommended_new)
        notes = build_notes(row, split_targets, extra_notes)

        missing_val = int(row.get("val_count", 0)) == 0
        missing_test = int(row.get("test_count", 0)) == 0

        plan_rows.append(
            {
                "label": label,
                "current_total_count": int(row.get("total_count", 0)),
                "recommended_new_clips": recommended_new,
                "target_signer_count": target_signers,
                "priority_rank": int(row.get("priority_rank", 9999)),
                "missing_val_support": missing_val,
                "missing_test_support": missing_test,
                "recommended_split_targets": split_targets,
                "notes": notes,
            }
        )

    # Priority: lowest volume first, then split support gaps, then existing urgency rank.
    plan_rows.sort(
        key=lambda item: (
            item["current_total_count"],
            -int(item["missing_val_support"]),
            -int(item["missing_test_support"]),
            item["priority_rank"],
            item["label"],
        )
    )
    for index, row in enumerate(plan_rows, start=1):
        row["priority_rank"] = index

    return {
        "generated_at": str(date.today()),
        "inputs": {
            "reduced_label_data_needs": str(INPUT_NEEDS_PATH.relative_to(REPO_ROOT)),
        },
        "custom_data_layout": {
            "root": str(CUSTOM_ROOT.relative_to(REPO_ROOT)),
            "pattern": "data/raw/custom/<LABEL>/<signer_id>/<clip_name>.mp4",
        },
        "recording_targets": plan_rows,
        "totals": {
            "labels": len(plan_rows),
            "current_total_clips": sum(item["current_total_count"] for item in plan_rows),
            "recommended_new_clips": sum(item["recommended_new_clips"] for item in plan_rows),
        },
        # TODO(ingest-custom): Implement ml/scripts/ingest_custom_recordings.py to scan
        #   data/raw/custom/<LABEL>/<signer_id>/<clip_name>.mp4 and validate metadata.
        # TODO(split-custom): Implement deterministic train/val/test assignment for custom clips,
        #   with signer-aware split constraints to reduce leakage.
        # TODO(merge-custom): Implement reduced-manifest merge so validated custom clips are added
        #   into reduced_train.json, reduced_val.json, and reduced_test.json.
    }


def ensure_custom_layout(labels: list[str]) -> None:
    CUSTOM_ROOT.mkdir(parents=True, exist_ok=True)
    for label in labels:
        # Create a starter signer bucket to make expected nesting explicit.
        (CUSTOM_ROOT / label / "signer_001").mkdir(parents=True, exist_ok=True)


def write_checklist_csv(rows: list[dict[str, Any]]) -> None:
    OUT_CHECKLIST_PATH.parent.mkdir(parents=True, exist_ok=True)
    fieldnames = [
        "label",
        "current_total_count",
        "recommended_new_clips",
        "target_signer_count",
        "priority_rank",
        "notes",
    ]
    with OUT_CHECKLIST_PATH.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for row in rows:
            writer.writerow({name: row[name] for name in fieldnames})


def export_custom_recording_plan() -> dict[str, Any]:
    needs_payload = load_json(INPUT_NEEDS_PATH)
    if not isinstance(needs_payload, dict):
        raise ValueError(f"Expected object in {INPUT_NEEDS_PATH}")

    plan = build_plan(needs_payload)
    target_rows = plan["recording_targets"]
    ensure_custom_layout([row["label"] for row in target_rows])

    OUT_PLAN_PATH.write_text(json.dumps(plan, indent=2), encoding="utf-8")
    write_checklist_csv(target_rows)
    return plan


def main() -> None:
    plan = export_custom_recording_plan()

    print(f"[ok] Custom recording plan      -> {OUT_PLAN_PATH.relative_to(REPO_ROOT)}")
    print(f"[ok] Custom recording checklist -> {OUT_CHECKLIST_PATH.relative_to(REPO_ROOT)}")
    print(f"[ok] Custom folder root         -> {CUSTOM_ROOT.relative_to(REPO_ROOT)}")
    print()
    print("  Record first (top 5):")
    for row in plan["recording_targets"][:5]:
        print(
            f"    #{row['priority_rank']:<2} {row['label']:<8} "
            f"current={row['current_total_count']:<3} "
            f"new={row['recommended_new_clips']:<3} "
            f"signers={row['target_signer_count']}"
        )


if __name__ == "__main__":
    main()