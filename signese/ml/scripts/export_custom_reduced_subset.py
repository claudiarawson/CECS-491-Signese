"""
export_custom_reduced_subset.py
------------------------------
Scan targeted custom label folders and export deterministic reduced split
manifests for custom data collection.

Expected custom input layout:
  data/raw/custom/<LABEL>/<signer_id>/<clip_name>.mp4

Default targeted labels:
  - GOOD
  - MEET
  - NICE

Outputs:
  - data/processed/custom_reduced_manifest.json
  - data/processed/custom_reduced_train.json
  - data/processed/custom_reduced_val.json
  - data/processed/custom_reduced_test.json
  - data/processed/custom_reduced_summary.json
"""

from __future__ import annotations

import argparse
import json
import random
from collections import defaultdict
from datetime import date
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parent.parent.parent
CUSTOM_ROOT = REPO_ROOT / "data" / "raw" / "custom"
PROCESSED_DIR = REPO_ROOT / "data" / "processed"

DEFAULT_TARGET_LABELS = ["HELLO", "HOW", "YOU", "GOOD", "MORNING", "NICE", "MEET", "SEE", "WHAT", "NAME", "MY"]
REDUCED_LABELS = ["HELLO", "HOW", "YOU", "GOOD", "MORNING", "NICE", "MEET", "SEE", "WHAT", "NAME", "MY"]
REDUCED_LABEL_SET = set(REDUCED_LABELS)
VIDEO_EXTS = {".mp4", ".avi", ".mov", ".webm", ".mkv"}

OUT_MANIFEST = PROCESSED_DIR / "custom_reduced_manifest.json"
OUT_TRAIN = PROCESSED_DIR / "custom_reduced_train.json"
OUT_VAL = PROCESSED_DIR / "custom_reduced_val.json"
OUT_TEST = PROCESSED_DIR / "custom_reduced_test.json"
OUT_SUMMARY = PROCESSED_DIR / "custom_reduced_summary.json"


def split_counts(n: int) -> tuple[int, int, int]:
    if n <= 2:
        return n, 0, 0

    n_train = int(round(n * 0.7))
    n_val = int(round(n * 0.15))
    n_test = n - n_train - n_val

    if n_val == 0 and n >= 3:
        n_val = 1
        n_train -= 1
    if n_test == 0 and n >= 4:
        n_test = 1
        n_train -= 1

    if n_train < 1:
        n_train = 1
        if n_val > 1:
            n_val -= 1
        elif n_test > 1:
            n_test -= 1

    return n_train, n_val, n_test


def assign_signer_aware(rows: list[dict[str, Any]], rng: random.Random) -> dict[str, list[dict[str, Any]]]:
    by_signer: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for row in rows:
        signer = str(row.get("signer_id", "")).strip() or "unknown"
        by_signer[signer].append(row)

    signer_groups = list(by_signer.items())
    rng.shuffle(signer_groups)
    signer_groups.sort(key=lambda x: len(x[1]), reverse=True)

    n_train, n_val, n_test = split_counts(len(rows))
    target = {"train": n_train, "val": n_val, "test": n_test}
    out = {"train": [], "val": [], "test": []}

    for _, signer_rows in signer_groups:
        split = min(
            ("train", "val", "test"),
            key=lambda s: (len(out[s]) / max(1, target[s]), len(out[s])),
        )
        out[split].extend(signer_rows)
    return out


def scan_custom_rows(target_labels: list[str]) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    summary: dict[str, Any] = {
        "target_labels": target_labels,
        "root_checks": {},
        "invalid_labels": [],
        "non_video_files": 0,
    }

    for label in target_labels:
        label_upper = label.upper().strip()
        label_dir = CUSTOM_ROOT / label_upper
        signer_dirs = [p for p in label_dir.iterdir() if p.is_dir()] if label_dir.exists() else []

        summary["root_checks"][label_upper] = {
            "path": str(label_dir.relative_to(REPO_ROOT)),
            "exists": label_dir.exists(),
            "signer_dirs": [p.name for p in sorted(signer_dirs)],
        }

        if label_upper not in REDUCED_LABEL_SET:
            summary["invalid_labels"].append(label_upper)
            continue

        for signer_dir in signer_dirs:
            signer_id = signer_dir.name.strip()
            for clip in sorted(signer_dir.iterdir()):
                if not clip.is_file():
                    continue
                if clip.suffix.lower() not in VIDEO_EXTS:
                    summary["non_video_files"] += 1
                    continue

                rel_video = clip.relative_to(REPO_ROOT)
                sample_id = f"custom:{label_upper}:{signer_id}:{clip.stem}"
                rows.append(
                    {
                        "label": label_upper,
                        "source_dataset": "custom",
                        "source_gloss": label_upper,
                        "sample_id": sample_id,
                        "signer_id": signer_id,
                        "split": "",
                        "video_path": str(rel_video).replace("\\", "/"),
                        "notes": "targeted_custom_weak_label",
                    }
                )

    # De-duplicate by sample_id while keeping deterministic order.
    dedup: dict[str, dict[str, Any]] = {}
    for row in rows:
        dedup[row["sample_id"]] = row
    rows = list(dedup.values())
    rows.sort(key=lambda x: (x["label"], x["signer_id"], x["sample_id"]))
    return rows, summary


def export_custom_reduced_subset(target_labels: list[str], seed: int) -> dict[str, Any]:
    rows, scan_summary = scan_custom_rows(target_labels)

    by_label: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for row in rows:
        by_label[row["label"]].append(row)

    split_rows = {"train": [], "val": [], "test": []}
    per_label: dict[str, dict[str, int]] = {}
    for label in target_labels:
        label_upper = label.upper().strip()
        label_rows = by_label.get(label_upper, [])
        label_rng = random.Random(f"{seed}:{label_upper}")
        assigned = assign_signer_aware(label_rows, label_rng)

        for split, rows_for_split in assigned.items():
            for row in rows_for_split:
                out_row = dict(row)
                out_row["split"] = split
                split_rows[split].append(out_row)

        per_label[label_upper] = {
            "total": len(label_rows),
            "train": len(assigned["train"]),
            "val": len(assigned["val"]),
            "test": len(assigned["test"]),
        }

    manifest_payload = {
        "generated_at": str(date.today()),
        "seed": seed,
        "reduced_labels": list(REDUCED_LABELS),
        "target_labels": [label.upper().strip() for label in target_labels],
        "scan_summary": scan_summary,
        "totals": {
            "samples": len(rows),
            "train": len(split_rows["train"]),
            "val": len(split_rows["val"]),
            "test": len(split_rows["test"]),
        },
        "samples": split_rows["train"] + split_rows["val"] + split_rows["test"],
    }

    summary_payload = {
        "generated_at": str(date.today()),
        "seed": seed,
        "target_labels": [label.upper().strip() for label in target_labels],
        "inputs": {
            "custom_root": str(CUSTOM_ROOT.relative_to(REPO_ROOT)),
        },
        "outputs": {
            "manifest": str(OUT_MANIFEST.relative_to(REPO_ROOT)),
            "train": str(OUT_TRAIN.relative_to(REPO_ROOT)),
            "val": str(OUT_VAL.relative_to(REPO_ROOT)),
            "test": str(OUT_TEST.relative_to(REPO_ROOT)),
        },
        "root_checks": scan_summary["root_checks"],
        "invalid_labels": scan_summary["invalid_labels"],
        "per_label": per_label,
        "totals": manifest_payload["totals"],
        "notes": [
            "Only reduced-label custom data is exported.",
            "Split assignment is deterministic and signer-aware.",
        ],
    }

    OUT_MANIFEST.write_text(json.dumps(manifest_payload, indent=2), encoding="utf-8")
    OUT_TRAIN.write_text(json.dumps(split_rows["train"], indent=2), encoding="utf-8")
    OUT_VAL.write_text(json.dumps(split_rows["val"], indent=2), encoding="utf-8")
    OUT_TEST.write_text(json.dumps(split_rows["test"], indent=2), encoding="utf-8")
    OUT_SUMMARY.write_text(json.dumps(summary_payload, indent=2), encoding="utf-8")
    return summary_payload


def main() -> None:
    parser = argparse.ArgumentParser(description="Export targeted custom reduced subset manifests.")
    parser.add_argument(
        "--labels",
        type=str,
        default=",".join(DEFAULT_TARGET_LABELS),
        help="Comma-separated target labels (default: GOOD,MEET,NICE)",
    )
    parser.add_argument("--seed", type=int, default=491)
    args = parser.parse_args()

    labels = [p.strip().upper() for p in args.labels.split(",") if p.strip()]
    summary = export_custom_reduced_subset(labels, args.seed)

    print(f"[ok] Custom manifest -> {OUT_MANIFEST.relative_to(REPO_ROOT)}")
    print(f"[ok] Custom train    -> {OUT_TRAIN.relative_to(REPO_ROOT)}")
    print(f"[ok] Custom val      -> {OUT_VAL.relative_to(REPO_ROOT)}")
    print(f"[ok] Custom test     -> {OUT_TEST.relative_to(REPO_ROOT)}")
    print(f"[ok] Summary         -> {OUT_SUMMARY.relative_to(REPO_ROOT)}")
    print()
    print(f"  Total samples: {summary['totals']['samples']}")
    print(
        f"  train={summary['totals']['train']} val={summary['totals']['val']} test={summary['totals']['test']}"
    )
    print("  Per-label counts:")
    for label, counts in summary["per_label"].items():
        print(
            f"    {label:<8} total={counts['total']:<3} train={counts['train']:<3} val={counts['val']:<3} test={counts['test']:<3}"
        )


if __name__ == "__main__":
    main()