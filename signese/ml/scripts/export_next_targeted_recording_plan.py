"""
export_next_targeted_recording_plan.py
-------------------------------------
Build the next targeted custom-data recording plan from latest reduced merged
evaluation artifacts.

Inputs:
  - data/processed/models/first_signese_baseline/evaluation_summary.json
  - data/processed/models/first_signese_baseline/confusion_matrix.json

Outputs:
  - data/processed/next_targeted_recording_plan.json
  - data/processed/next_targeted_recording_checklist.csv
"""

from __future__ import annotations

import csv
import json
from datetime import date
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parent.parent.parent
PROCESSED_DIR = REPO_ROOT / "data" / "processed"
MODEL_DIR = PROCESSED_DIR / "models" / "first_signese_baseline"

IN_EVAL = MODEL_DIR / "evaluation_summary.json"
IN_CONFUSION = MODEL_DIR / "confusion_matrix.json"

OUT_PLAN = PROCESSED_DIR / "next_targeted_recording_plan.json"
OUT_CHECKLIST = PROCESSED_DIR / "next_targeted_recording_checklist.csv"

REDUCED_LABELS = ["MEET", "HOW", "GOOD", "NAME", "YOU", "NICE", "HELLO", "MORNING"]
FOCUS_LABELS = {"YOU", "GOOD", "NICE"}


def load_json(path: Path) -> dict[str, Any]:
    if not path.exists():
        raise FileNotFoundError(path)
    with path.open(encoding="utf-8-sig") as f:
        payload = json.load(f)
    if not isinstance(payload, dict):
        raise ValueError(f"Expected object in {path}")
    return payload


def round4(value: float) -> float:
    return float(f"{value:.4f}")


def recommended_new_clips(score: float, accuracy: float, two_way_strength: int) -> int:
    # Conservative, targeted expansion focused on confusion-heavy weak labels.
    if score >= 55 or accuracy <= 0.55:
        return 12
    if score >= 40 or two_way_strength >= 3:
        return 10
    if score >= 30 or accuracy <= 0.70:
        return 8
    if score >= 20:
        return 6
    return 4


def target_signer_count(clips: int, two_way_strength: int) -> int:
    if clips >= 12 or two_way_strength >= 3:
        return 5
    if clips >= 8:
        return 4
    return 3


def build_plan(eval_payload: dict[str, Any], confusion_payload: dict[str, Any]) -> dict[str, Any]:
    labels = [str(label) for label in eval_payload.get("labels", [])]
    if labels != REDUCED_LABELS:
        raise ValueError("Evaluation labels do not match expected reduced 8-label ordering.")

    test_metrics = eval_payload.get("test", {})
    test_acc = test_metrics.get("per_label_accuracy", {})
    test_support = test_metrics.get("per_label_support", {})

    confusion_test = confusion_payload.get("splits", {}).get("test", [])
    if not isinstance(confusion_test, list) or len(confusion_test) != len(labels):
        raise ValueError("Invalid test confusion matrix dimensions.")

    label_to_idx = {label: idx for idx, label in enumerate(labels)}

    rows: list[dict[str, Any]] = []
    for label in labels:
        i = label_to_idx[label]
        row_vals = confusion_test[i]
        if not isinstance(row_vals, list) or len(row_vals) != len(labels):
            raise ValueError(f"Invalid confusion matrix row for label={label}")

        # Off-diagonal outbound confusion from true label -> predicted label.
        outbound: list[tuple[str, int]] = []
        for j, count in enumerate(row_vals):
            if j == i:
                continue
            count_int = int(count)
            if count_int > 0:
                outbound.append((labels[j], count_int))
        outbound.sort(key=lambda x: (-x[1], x[0]))

        # Two-way confusion strength with each partner: a->b + b->a.
        two_way: list[tuple[str, int]] = []
        for partner, forward in outbound:
            p_idx = label_to_idx[partner]
            backward = int(confusion_test[p_idx][i])
            two_way.append((partner, int(forward + backward)))
        two_way.sort(key=lambda x: (-x[1], x[0]))

        accuracy = float(test_acc.get(label, 0.0) or 0.0)
        support = int(test_support.get(label, 0) or 0)
        total_confusions = int(sum(c for _, c in outbound))
        max_two_way = int(two_way[0][1]) if two_way else 0

        # Priority score: low test accuracy + confusion pressure + two-way confusion signal.
        weakness = (1.0 - accuracy) * 100.0
        score = weakness + (total_confusions * 5.0) + (max_two_way * 6.0)
        if label in FOCUS_LABELS:
            score += 8.0

        new_clips = recommended_new_clips(score=score, accuracy=accuracy, two_way_strength=max_two_way)
        signer_count = target_signer_count(new_clips, max_two_way)

        key_partners = [name for name, _ in two_way[:3]]
        pair_text = ", ".join(f"{name}({strength})" for name, strength in two_way[:3])
        if not pair_text:
            pair_text = "none"

        notes = (
            f"Test acc={accuracy:.3f}, support={support}. "
            f"Two-way confusion strength: {pair_text}. "
            "Prioritize cleaner signer-diverse clips before architecture changes."
        )

        rows.append(
            {
                "label": label,
                "current_test_accuracy": round4(accuracy),
                "test_support": support,
                "key_confusion_partners": key_partners,
                "two_way_confusion_strength": {name: strength for name, strength in two_way[:3]},
                "recommended_new_clips": int(new_clips),
                "target_signer_count": int(signer_count),
                "priority_score": round4(score),
                "priority_rank": 0,
                "notes": notes,
            }
        )

    # Keep focus on the most actionable confusion cluster.
    rows.sort(key=lambda r: (-float(r["priority_score"]), r["current_test_accuracy"], r["label"]))

    # Select target list: top 3 by score, but always include focus labels.
    selected_labels = {r["label"] for r in rows[:3]}
    selected_labels.update(FOCUS_LABELS)
    selected_rows = [r for r in rows if r["label"] in selected_labels]
    selected_rows.sort(key=lambda r: (-float(r["priority_score"]), r["current_test_accuracy"], r["label"]))

    for rank, row in enumerate(selected_rows, start=1):
        row["priority_rank"] = rank

    return {
        "generated_at": str(date.today()),
        "inputs": {
            "evaluation_summary": str(IN_EVAL.relative_to(REPO_ROOT)),
            "confusion_matrix": str(IN_CONFUSION.relative_to(REPO_ROOT)),
        },
        "reduced_labels": list(REDUCED_LABELS),
        "focus_labels": sorted(FOCUS_LABELS),
        "selection_policy": {
            "objective": "Prioritize low test accuracy and two-way confusion labels for targeted custom recordings.",
            "selected_count": len(selected_rows),
        },
        "targets": selected_rows,
        "totals": {
            "recommended_new_clips": sum(int(r["recommended_new_clips"]) for r in selected_rows),
            "target_labels": len(selected_rows),
        },
    }


def write_checklist_csv(rows: list[dict[str, Any]]) -> None:
    OUT_CHECKLIST.parent.mkdir(parents=True, exist_ok=True)
    fieldnames = [
        "label",
        "current_test_accuracy",
        "key_confusion_partners",
        "recommended_new_clips",
        "target_signer_count",
        "priority_rank",
        "notes",
    ]
    with OUT_CHECKLIST.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for row in rows:
            writer.writerow(
                {
                    "label": row["label"],
                    "current_test_accuracy": row["current_test_accuracy"],
                    "key_confusion_partners": "|".join(row["key_confusion_partners"]),
                    "recommended_new_clips": row["recommended_new_clips"],
                    "target_signer_count": row["target_signer_count"],
                    "priority_rank": row["priority_rank"],
                    "notes": row["notes"],
                }
            )


def export_next_targeted_recording_plan() -> dict[str, Any]:
    eval_payload = load_json(IN_EVAL)
    confusion_payload = load_json(IN_CONFUSION)

    plan = build_plan(eval_payload, confusion_payload)
    OUT_PLAN.write_text(json.dumps(plan, indent=2), encoding="utf-8")
    write_checklist_csv(plan["targets"])
    return plan


def main() -> None:
    plan = export_next_targeted_recording_plan()

    print(f"[ok] Next targeted plan      -> {OUT_PLAN.relative_to(REPO_ROOT)}")
    print(f"[ok] Next targeted checklist -> {OUT_CHECKLIST.relative_to(REPO_ROOT)}")
    print()
    print("  Record next:")
    for row in plan["targets"]:
        print(
            f"    #{row['priority_rank']} {row['label']:<8} acc={row['current_test_accuracy']:.3f} "
            f"new={row['recommended_new_clips']:<2} signers={row['target_signer_count']} "
            f"partners={','.join(row['key_confusion_partners']) or 'none'}"
        )


if __name__ == "__main__":
    main()