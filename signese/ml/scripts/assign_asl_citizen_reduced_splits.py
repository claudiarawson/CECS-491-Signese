"""
assign_asl_citizen_reduced_splits.py
-----------------------------------
Assign reproducible train/val/test splits for the exported ASL Citizen reduced
subset manifest.

Input:
  - data/processed/asl_citizen_reduced_subset_manifest.json

Outputs:
  - data/processed/asl_citizen_reduced_train.json
  - data/processed/asl_citizen_reduced_val.json
  - data/processed/asl_citizen_reduced_test.json
  - data/processed/asl_citizen_reduced_split_summary.json
"""

from __future__ import annotations

import argparse
import json
import random
import sys
from collections import defaultdict
from datetime import date
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parent.parent.parent
PROCESSED_DIR = REPO_ROOT / "data" / "processed"

IN_MANIFEST = PROCESSED_DIR / "asl_citizen_reduced_subset_manifest.json"
OUT_TRAIN = PROCESSED_DIR / "asl_citizen_reduced_train.json"
OUT_VAL = PROCESSED_DIR / "asl_citizen_reduced_val.json"
OUT_TEST = PROCESSED_DIR / "asl_citizen_reduced_test.json"
OUT_SUMMARY = PROCESSED_DIR / "asl_citizen_reduced_split_summary.json"

SPLIT_RATIOS = {"train": 0.7, "val": 0.15, "test": 0.15}
DEFAULT_SEED = 491


def load_manifest(path: Path) -> dict[str, Any]:
    if not path.exists():
        sys.exit(f"[error] Missing required input: {path}")
    with path.open(encoding="utf-8-sig") as f:
        payload = json.load(f)
    if not isinstance(payload, dict):
        sys.exit(f"[error] Expected JSON object in {path}")
    return payload


def split_counts(n: int) -> tuple[int, int, int]:
    if n <= 2:
        return n, 0, 0

    n_train = int(round(n * SPLIT_RATIOS["train"]))
    n_val = int(round(n * SPLIT_RATIOS["val"]))
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


def choose_strategy(samples: list[dict[str, Any]]) -> str:
    signer_values = [
        str(s.get("signer_id")).strip()
        for s in samples
        if s.get("signer_id") is not None and str(s.get("signer_id")).strip()
    ]
    unique_signers = len(set(signer_values))
    signer_ratio = len(signer_values) / max(1, len(samples))

    if len(samples) >= 6 and unique_signers >= 3 and signer_ratio >= 0.6:
        return "signer_aware"
    return "sample_level"


def assign_sample_level(samples: list[dict[str, Any]], rng: random.Random) -> dict[str, list[dict[str, Any]]]:
    rows = list(samples)
    rng.shuffle(rows)
    n_train, n_val, _ = split_counts(len(rows))
    return {
        "train": rows[:n_train],
        "val": rows[n_train : n_train + n_val],
        "test": rows[n_train + n_val :],
    }


def assign_signer_aware(samples: list[dict[str, Any]], rng: random.Random) -> dict[str, list[dict[str, Any]]]:
    signer_groups: dict[str, list[dict[str, Any]]] = defaultdict(list)
    unknown_signer: list[dict[str, Any]] = []

    for sample in samples:
        signer = sample.get("signer_id")
        signer_text = str(signer).strip() if signer is not None else ""
        if signer_text:
            signer_groups[signer_text].append(sample)
        else:
            unknown_signer.append(sample)

    groups = list(signer_groups.items())
    rng.shuffle(groups)
    groups.sort(key=lambda item: len(item[1]), reverse=True)

    n_train, n_val, n_test = split_counts(len(samples))
    targets = {"train": n_train, "val": n_val, "test": n_test}
    out = {"train": [], "val": [], "test": []}

    for _, group_rows in groups:
        split_name = min(
            ("train", "val", "test"),
            key=lambda sp: (
                len(out[sp]) / max(1, targets[sp]),
                len(out[sp]),
            ),
        )
        out[split_name].extend(group_rows)

    rng.shuffle(unknown_signer)
    for row in unknown_signer:
        split_name = min(
            ("train", "val", "test"),
            key=lambda sp: (
                len(out[sp]) / max(1, targets[sp]),
                len(out[sp]),
            ),
        )
        out[split_name].append(row)

    return out


def deduplicate_samples(samples: list[dict[str, Any]]) -> tuple[list[dict[str, Any]], int]:
    dedup: dict[str, dict[str, Any]] = {}
    dropped = 0
    for row in samples:
        sample_id = str(row.get("sample_id", "")).strip()
        key = sample_id or json.dumps(row, sort_keys=True)
        if key in dedup:
            dropped += 1
            continue
        dedup[key] = row
    return list(dedup.values()), dropped


def per_label_counts(rows: list[dict[str, Any]], labels: list[str]) -> dict[str, int]:
    counts = {label: 0 for label in labels}
    for row in rows:
        label = str(row.get("label", "")).strip()
        if label in counts:
            counts[label] += 1
    return counts


def assign_asl_citizen_reduced_splits(seed: int) -> dict[str, Any]:
    manifest = load_manifest(IN_MANIFEST)
    labels = [str(label) for label in manifest.get("reduced_labels", [])]
    raw_samples = manifest.get("samples", [])

    if not isinstance(raw_samples, list):
        sys.exit("[error] Manifest field 'samples' must be a list.")

    samples = [row for row in raw_samples if isinstance(row, dict)]
    if not samples:
        sys.exit("[error] No samples found in ASL reduced subset manifest.")

    samples, duplicates_dropped = deduplicate_samples(samples)
    by_label: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for row in samples:
        label = str(row.get("label", "")).strip()
        if not label:
            continue
        by_label[label].append(row)

    train: list[dict[str, Any]] = []
    val: list[dict[str, Any]] = []
    test: list[dict[str, Any]] = []

    per_label_summary: dict[str, dict[str, Any]] = {}
    warnings: list[str] = []
    signer_aware_labels: list[str] = []
    sample_level_labels: list[str] = []

    for label in labels:
        label_rows = list(by_label.get(label, []))
        if not label_rows:
            warnings.append(f"Label {label}: no samples available.")
            per_label_summary[label] = {
                "total": 0,
                "train": 0,
                "val": 0,
                "test": 0,
                "strategy": "none",
            }
            continue

        label_rows.sort(key=lambda row: str(row.get("sample_id", "")))
        strategy = choose_strategy(label_rows)

        # Make per-label random stream deterministic regardless of label ordering.
        label_rng = random.Random(f"{seed}:{label}")
        if strategy == "signer_aware":
            split_map = assign_signer_aware(label_rows, label_rng)
            signer_aware_labels.append(label)
        else:
            split_map = assign_sample_level(label_rows, label_rng)
            sample_level_labels.append(label)

        for split_name, rows in split_map.items():
            for row in rows:
                out_row = dict(row)
                out_row["split"] = split_name
                if split_name == "train":
                    train.append(out_row)
                elif split_name == "val":
                    val.append(out_row)
                else:
                    test.append(out_row)

        l_train = len(split_map["train"])
        l_val = len(split_map["val"])
        l_test = len(split_map["test"])
        l_total = l_train + l_val + l_test

        if l_total >= 6 and (l_val == 0 or l_test == 0):
            warnings.append(
                f"Label {label}: split imbalance train={l_train}, val={l_val}, test={l_test}."
            )

        per_label_summary[label] = {
            "total": l_total,
            "train": l_train,
            "val": l_val,
            "test": l_test,
            "strategy": strategy,
        }

    # Global leakage check: no sample_id can appear across splits.
    train_ids = {str(row.get("sample_id", "")) for row in train}
    val_ids = {str(row.get("sample_id", "")) for row in val}
    test_ids = {str(row.get("sample_id", "")) for row in test}
    leakage = sorted((train_ids & val_ids) | (train_ids & test_ids) | (val_ids & test_ids))
    if leakage:
        warnings.append(f"Detected cross-split leakage for {len(leakage)} sample_id values.")

    summary = {
        "generated_at": str(date.today()),
        "seed": seed,
        "input_manifest": str(IN_MANIFEST.relative_to(REPO_ROOT)),
        "outputs": {
            "train": str(OUT_TRAIN.relative_to(REPO_ROOT)),
            "val": str(OUT_VAL.relative_to(REPO_ROOT)),
            "test": str(OUT_TEST.relative_to(REPO_ROOT)),
        },
        "totals": {
            "input_samples": len(raw_samples),
            "usable_samples": len(samples),
            "duplicates_dropped": duplicates_dropped,
            "train": len(train),
            "val": len(val),
            "test": len(test),
        },
        "split_strategy": {
            "signer_aware_labels": signer_aware_labels,
            "sample_level_labels": sample_level_labels,
            "signer_aware_used": len(signer_aware_labels) > 0,
        },
        "per_label": per_label_summary,
        "warnings": warnings,
        "notes": [
            "Stratification is label-wise; class balance is preserved across splits where possible.",
            "Deterministic assignment uses fixed seed and per-label seeded RNG.",
        ],
    }

    OUT_TRAIN.write_text(json.dumps(train, indent=2), encoding="utf-8")
    OUT_VAL.write_text(json.dumps(val, indent=2), encoding="utf-8")
    OUT_TEST.write_text(json.dumps(test, indent=2), encoding="utf-8")
    OUT_SUMMARY.write_text(json.dumps(summary, indent=2), encoding="utf-8")
    return summary


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Assign reproducible train/val/test splits for ASL Citizen reduced subset."
    )
    parser.add_argument("--seed", type=int, default=DEFAULT_SEED)
    args = parser.parse_args()

    summary = assign_asl_citizen_reduced_splits(seed=args.seed)
    print(f"[ok] ASL reduced train   -> {OUT_TRAIN.relative_to(REPO_ROOT)}")
    print(f"[ok] ASL reduced val     -> {OUT_VAL.relative_to(REPO_ROOT)}")
    print(f"[ok] ASL reduced test    -> {OUT_TEST.relative_to(REPO_ROOT)}")
    print(f"[ok] ASL split summary   -> {OUT_SUMMARY.relative_to(REPO_ROOT)}")
    print()
    print(
        "  Strategy used              : "
        + ("signer-aware + fallback" if summary["split_strategy"]["signer_aware_used"] else "sample-level")
    )
    print("  Per-label counts:")
    for label, counts in summary["per_label"].items():
        print(
            f"    {label:<8} train={counts['train']:<3} val={counts['val']:<3} test={counts['test']:<3} "
            f"(strategy={counts['strategy']})"
        )
    if summary["warnings"]:
        print("  Warnings:")
        for warning in summary["warnings"]:
            print(f"    - {warning}")
    else:
        print("  Warnings: none")


if __name__ == "__main__":
    main()