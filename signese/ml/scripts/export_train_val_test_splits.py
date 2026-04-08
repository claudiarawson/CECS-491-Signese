"""
export_train_val_test_splits.py
-------------------------------
Export reproducible train/val/test split manifests for the locked first Signese
subset using WLASL metadata.

Inputs:
  - data/processed/first_model_subset.json
  - src/features/translate/model/dataset.manifest.json
  - data/raw/kaggleASL/WLASL_v0.3.json (+ videos/)

Outputs:
  - data/processed/first_model_train.json
  - data/processed/first_model_val.json
  - data/processed/first_model_test.json
  - data/processed/first_model_split_summary.json
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

DEFAULT_SUBSET = REPO_ROOT / "data" / "processed" / "first_model_subset.json"
DEFAULT_MANIFEST = REPO_ROOT / "src" / "features" / "translate" / "model" / "dataset.manifest.json"
DEFAULT_WLASL_JSON = REPO_ROOT / "data" / "raw" / "kaggleASL" / "WLASL_v0.3.json"
DEFAULT_WLASL_VIDEOS = REPO_ROOT / "data" / "raw" / "kaggleASL" / "videos"

OUT_TRAIN = REPO_ROOT / "data" / "processed" / "first_model_train.json"
OUT_VAL = REPO_ROOT / "data" / "processed" / "first_model_val.json"
OUT_TEST = REPO_ROOT / "data" / "processed" / "first_model_test.json"
OUT_SUMMARY = REPO_ROOT / "data" / "processed" / "first_model_split_summary.json"

VIDEO_EXTS = [".mp4", ".avi", ".mov", ".webm", ".mkv"]
DIGIT_TO_WORD = {
    "0": "ZERO",
    "1": "ONE",
    "2": "TWO",
    "3": "THREE",
    "4": "FOUR",
    "5": "FIVE",
    "6": "SIX",
    "7": "SEVEN",
    "8": "EIGHT",
    "9": "NINE",
    "10": "TEN",
    "11": "ELEVEN",
    "12": "TWELVE",
    "13": "THIRTEEN",
    "14": "FOURTEEN",
    "15": "FIFTEEN",
    "16": "SIXTEEN",
    "17": "SEVENTEEN",
    "18": "EIGHTEEN",
    "19": "NINETEEN",
    "20": "TWENTY",
}
WORD_TO_DIGIT = {v: k for k, v in DIGIT_TO_WORD.items()}


def load_json(path: Path) -> dict[str, Any]:
    if not path.exists():
        sys.exit(f"[error] Missing required file: {path}")
    with path.open(encoding="utf-8-sig") as f:
        return json.load(f)


def normalize(value: str) -> str:
    return "".join(ch for ch in value.upper() if ch.isalnum())


def candidate_glosses(label: str, source_gloss: str | None) -> set[str]:
    out = set()
    if source_gloss:
        out.add(str(source_gloss).upper())
    out.add(label.upper())

    # Numeric fallback support for labels like 1/2/3.
    if label in DIGIT_TO_WORD:
        out.add(DIGIT_TO_WORD[label])
    if label.upper() in WORD_TO_DIGIT:
        out.add(WORD_TO_DIGIT[label.upper()])

    return out


def find_video_path(video_id: str, videos_dir: Path) -> str | None:
    # TODO(dataset): Some extractions use different naming (e.g. clip_<id>.mp4).
    # If your local layout differs, adjust this resolver accordingly.
    for ext in VIDEO_EXTS:
        p = videos_dir / f"{video_id}{ext}"
        if p.exists():
            return str(p.relative_to(REPO_ROOT))
    return None


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


def assign_splits_sample_level(samples: list[dict[str, Any]], rng: random.Random) -> dict[str, list[dict[str, Any]]]:
    items = list(samples)
    rng.shuffle(items)
    n_train, n_val, _ = split_counts(len(items))

    train = items[:n_train]
    val = items[n_train:n_train + n_val]
    test = items[n_train + n_val:]
    return {"train": train, "val": val, "test": test}


def assign_splits_signer_safe(samples: list[dict[str, Any]], rng: random.Random) -> dict[str, list[dict[str, Any]]]:
    signer_groups: dict[str, list[dict[str, Any]]] = defaultdict(list)
    unknown: list[dict[str, Any]] = []

    for s in samples:
        signer = s.get("signer_id")
        if signer is None:
            unknown.append(s)
        else:
            signer_groups[str(signer)].append(s)

    groups = list(signer_groups.items())
    rng.shuffle(groups)

    n = len(samples)
    target_train, target_val, target_test = split_counts(n)
    targets = {"train": target_train, "val": target_val, "test": target_test}

    out = {"train": [], "val": [], "test": []}

    # Greedy signer-group placement to keep signers in one split.
    for _, group_samples in groups:
        split_name = min(
            ("train", "val", "test"),
            key=lambda sp: (len(out[sp]) / max(1, targets[sp]), len(out[sp])),
        )
        out[split_name].extend(group_samples)

    # Place unknown-signer samples by current deficit.
    rng.shuffle(unknown)
    for s in unknown:
        split_name = min(
            ("train", "val", "test"),
            key=lambda sp: (len(out[sp]) / max(1, targets[sp]), len(out[sp])),
        )
        out[split_name].append(s)

    return out


def choose_split_strategy(samples: list[dict[str, Any]]) -> str:
    signer_values = [s.get("signer_id") for s in samples if s.get("signer_id") is not None]
    unique_signers = len(set(signer_values))
    signer_ratio = len(signer_values) / max(1, len(samples))

    if len(samples) >= 6 and unique_signers >= 3 and signer_ratio >= 0.6:
        return "signer_safe"
    return "sample_level"


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Export train/val/test manifests for first Signese subset."
    )
    parser.add_argument("--subset", type=Path, default=DEFAULT_SUBSET)
    parser.add_argument("--manifest", type=Path, default=DEFAULT_MANIFEST)
    parser.add_argument("--wlasl-json", type=Path, default=DEFAULT_WLASL_JSON)
    parser.add_argument("--videos-dir", type=Path, default=DEFAULT_WLASL_VIDEOS)
    parser.add_argument("--seed", type=int, default=491)
    args = parser.parse_args()

    subset = load_json(args.subset.resolve())
    manifest = load_json(args.manifest.resolve())
    wlasl_data = load_json(args.wlasl_json.resolve())
    videos_dir = args.videos_dir.resolve()

    if not isinstance(wlasl_data, list):
        sys.exit("[error] WLASL_v0.3.json must be a list of gloss entries.")

    rng = random.Random(args.seed)

    manifest_idx: dict[str, dict[str, Any]] = {}
    for group_entries in manifest.get("label_groups", {}).values():
        for entry in group_entries:
            if entry.get("include") is True:
                manifest_idx[str(entry.get("label"))] = entry

    wlasl_gloss_idx: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for entry in wlasl_data:
        gloss = str(entry.get("gloss", "")).strip().upper()
        if not gloss:
            continue
        wlasl_gloss_idx[normalize(gloss)].append(entry)

    selected = subset.get("labels", [])
    if not selected:
        sys.exit("[error] first_model_subset.json contains no labels.")

    all_samples: list[dict[str, Any]] = []
    warnings: list[str] = []
    label_resolution: dict[str, dict[str, Any]] = {}

    for label_row in selected:
        label = str(label_row.get("label", "")).strip()
        m = manifest_idx.get(label)
        if m is None:
            warnings.append(f"Label {label}: missing from include=true manifest entries.")
            continue

        source_gloss = m.get("source_gloss")
        keys = {normalize(v) for v in candidate_glosses(label, source_gloss)}

        matched_entries: list[dict[str, Any]] = []
        for key in keys:
            matched_entries.extend(wlasl_gloss_idx.get(key, []))

        # De-duplicate gloss entries if multiple keys hit same entry.
        unique_entries: dict[str, dict[str, Any]] = {}
        for e in matched_entries:
            gloss = str(e.get("gloss", "")).upper()
            unique_entries[gloss] = e
        matched_entries = list(unique_entries.values())

        if not matched_entries:
            warnings.append(f"Label {label}: no WLASL gloss match for keys={sorted(keys)}")
            label_resolution[label] = {"matched_glosses": [], "raw_instances": 0}
            continue

        label_samples: list[dict[str, Any]] = []
        for e in matched_entries:
            gloss = str(e.get("gloss", "")).upper()
            instances = e.get("instances", [])
            if not isinstance(instances, list):
                continue

            for inst in instances:
                # TODO(dataset): Some WLASL variants may rename these keys.
                # Expected keys include video_id, signer_id, source, url, split.
                video_id = str(inst.get("video_id", "")).strip()
                if not video_id:
                    continue

                instance_id = inst.get("instance_id")
                signer_id = inst.get("signer_id")
                sample_id = f"wlasl:{gloss}:{video_id}:{instance_id if instance_id is not None else 'na'}"
                video_path = find_video_path(video_id, videos_dir)
                notes = []
                if video_path is None:
                    notes.append("local_video_missing")
                if inst.get("url"):
                    notes.append(f"url={inst.get('url')}")
                if inst.get("source"):
                    notes.append(f"source={inst.get('source')}")

                label_samples.append(
                    {
                        "label": label,
                        "source_dataset": "wlasl",
                        "source_gloss": gloss,
                        "video_path": video_path,
                        "split": "",
                        "sample_id": sample_id,
                        "signer_id": signer_id,
                        "notes": "; ".join(notes),
                    }
                )

        # Prevent duplicate clip leakage due to repeated metadata rows.
        dedup: dict[str, dict[str, Any]] = {}
        for s in label_samples:
            dedup[s["sample_id"]] = s
        label_samples = list(dedup.values())

        label_resolution[label] = {
            "matched_glosses": sorted({s["source_gloss"] for s in label_samples}),
            "raw_instances": len(label_samples),
        }

        if len(label_samples) < 6:
            warnings.append(f"Label {label}: low clip count ({len(label_samples)}).")

        strategy = choose_split_strategy(label_samples)
        if strategy == "signer_safe":
            split_map = assign_splits_signer_safe(label_samples, rng)
        else:
            split_map = assign_splits_sample_level(label_samples, rng)

        for split_name, rows in split_map.items():
            for row in rows:
                row["split"] = split_name
                all_samples.append(row)

    train = [s for s in all_samples if s["split"] == "train"]
    val = [s for s in all_samples if s["split"] == "val"]
    test = [s for s in all_samples if s["split"] == "test"]

    # Per-label summary table.
    per_label: dict[str, dict[str, Any]] = {}
    for label_row in selected:
        label = str(label_row.get("label"))
        rows = [s for s in all_samples if s["label"] == label]
        per_label[label] = {
            "total": len(rows),
            "train": sum(1 for s in rows if s["split"] == "train"),
            "val": sum(1 for s in rows if s["split"] == "val"),
            "test": sum(1 for s in rows if s["split"] == "test"),
            "matched_glosses": label_resolution.get(label, {}).get("matched_glosses", []),
        }

    summary = {
        "generated_at": str(date.today()),
        "seed": args.seed,
        "inputs": {
            "subset": str(args.subset.resolve()),
            "manifest": str(args.manifest.resolve()),
            "wlasl_json": str(args.wlasl_json.resolve()),
            "videos_dir": str(videos_dir),
        },
        "counts": {
            "train": len(train),
            "val": len(val),
            "test": len(test),
            "total": len(all_samples),
        },
        "per_label_counts": per_label,
        "warnings": warnings,
    }

    OUT_TRAIN.parent.mkdir(parents=True, exist_ok=True)
    OUT_TRAIN.write_text(json.dumps(train, indent=2), encoding="utf-8")
    OUT_VAL.write_text(json.dumps(val, indent=2), encoding="utf-8")
    OUT_TEST.write_text(json.dumps(test, indent=2), encoding="utf-8")
    OUT_SUMMARY.write_text(json.dumps(summary, indent=2), encoding="utf-8")

    print(f"[ok] Train split   -> {OUT_TRAIN.relative_to(REPO_ROOT)}")
    print(f"[ok] Val split     -> {OUT_VAL.relative_to(REPO_ROOT)}")
    print(f"[ok] Test split    -> {OUT_TEST.relative_to(REPO_ROOT)}")
    print(f"[ok] Split summary -> {OUT_SUMMARY.relative_to(REPO_ROOT)}")
    print()
    print(f"  Train samples: {len(train)}")
    print(f"  Val samples  : {len(val)}")
    print(f"  Test samples : {len(test)}")

    print("  Per-label counts:")
    for label in sorted(per_label):
        r = per_label[label]
        print(f"    {label:<10} total={r['total']:<3} train={r['train']:<3} val={r['val']:<3} test={r['test']:<3}")

    if warnings:
        print("  Warnings:")
        for w in warnings:
            print(f"    - {w}")


if __name__ == "__main__":
    main()
