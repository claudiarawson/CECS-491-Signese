"""
export_landmark_extraction_jobs.py
----------------------------------
Prepare landmark extraction job files for the locked first Signese model subset.

Inputs:
  - data/processed/first_model_train.json
  - data/processed/first_model_val.json
  - data/processed/first_model_test.json

Outputs:
  - data/processed/landmarks/train_jobs.json
  - data/processed/landmarks/val_jobs.json
  - data/processed/landmarks/test_jobs.json
  - data/processed/landmarks/job_summary.json

This script does not run extraction. It only prepares job manifests.
"""

from __future__ import annotations

import json
import sys
from collections import defaultdict
from datetime import date
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parent.parent.parent
PROCESSED_DIR = REPO_ROOT / "data" / "processed"
LANDMARKS_DIR = PROCESSED_DIR / "landmarks"
FEATURES_DIR = LANDMARKS_DIR / "features"

INPUTS = {
    "train": PROCESSED_DIR / "first_model_train.json",
    "val": PROCESSED_DIR / "first_model_val.json",
    "test": PROCESSED_DIR / "first_model_test.json",
}

OUTPUTS = {
    "train": LANDMARKS_DIR / "train_jobs.json",
    "val": LANDMARKS_DIR / "val_jobs.json",
    "test": LANDMARKS_DIR / "test_jobs.json",
}
SUMMARY_OUT = LANDMARKS_DIR / "job_summary.json"

DEFAULT_EXTRACTOR_TYPE = "mediapipe_holistic"
DEFAULT_EXTRACTOR_CONFIG = {
    "target_fps": 15,
    "max_frames": 32,
    "use_hands": True,
    "use_pose": True,
    "use_face": False,
    "normalize_landmarks": True,
}


def load_json(path: Path) -> list[dict[str, Any]]:
    if not path.exists():
        sys.exit(f"[error] Missing required input: {path}")
    with path.open(encoding="utf-8-sig") as f:
        data = json.load(f)
    if not isinstance(data, list):
        sys.exit(f"[error] Expected a list in {path}")
    return data


def sanitize_label(label: str) -> str:
    return "".join(ch if ch.isalnum() else "_" for ch in label.upper())


def make_output_path(split: str, label: str, sample_id: str) -> str:
    label_dir = sanitize_label(label)
    safe_sample_id = sample_id.replace(":", "__").replace("/", "_").replace("\\", "_")
    out = FEATURES_DIR / split / label_dir / f"{safe_sample_id}.npy"
    return str(out.relative_to(REPO_ROOT))


def process_split(split: str, rows: list[dict[str, Any]]) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    jobs: list[dict[str, Any]] = []
    skipped: list[dict[str, Any]] = []

    for row in rows:
        sample_id = str(row.get("sample_id", "")).strip()
        label = str(row.get("label", "")).strip()
        video_path = row.get("video_path")

        if not sample_id or not label:
            skipped.append(
                {
                    "split": split,
                    "sample_id": sample_id or None,
                    "label": label or None,
                    "reason": "missing_sample_id_or_label",
                }
            )
            continue

        if video_path is None:
            skipped.append(
                {
                    "split": split,
                    "sample_id": sample_id,
                    "label": label,
                    "reason": "video_path_null",
                }
            )
            continue

        video_file = REPO_ROOT / str(video_path)
        if not video_file.exists():
            skipped.append(
                {
                    "split": split,
                    "sample_id": sample_id,
                    "label": label,
                    "video_path": str(video_path),
                    "reason": "video_file_missing",
                }
            )
            continue

        job = {
            "sample_id": sample_id,
            "label": label,
            "split": split,
            "source_dataset": row.get("source_dataset"),
            "source_gloss": row.get("source_gloss"),
            "video_path": str(video_path),
            "output_path": make_output_path(split, label, sample_id),
            "extractor_type": DEFAULT_EXTRACTOR_TYPE,
            "extractor_config": dict(DEFAULT_EXTRACTOR_CONFIG),
        }
        jobs.append(job)

    return jobs, skipped


def main() -> None:
    split_rows = {split: load_json(path) for split, path in INPUTS.items()}

    LANDMARKS_DIR.mkdir(parents=True, exist_ok=True)

    all_jobs: dict[str, list[dict[str, Any]]] = {}
    all_skipped: dict[str, list[dict[str, Any]]] = {}

    for split, rows in split_rows.items():
        jobs, skipped = process_split(split, rows)
        all_jobs[split] = jobs
        all_skipped[split] = skipped
        OUTPUTS[split].write_text(json.dumps(jobs, indent=2), encoding="utf-8")

    per_label_counts: dict[str, dict[str, int]] = defaultdict(lambda: {"train": 0, "val": 0, "test": 0, "total": 0})
    for split, jobs in all_jobs.items():
        for job in jobs:
            label = str(job["label"])
            per_label_counts[label][split] += 1
            per_label_counts[label]["total"] += 1

    skipped_summary: dict[str, Any] = {
        "total": sum(len(v) for v in all_skipped.values()),
        "by_split": {split: len(rows) for split, rows in all_skipped.items()},
        "by_reason": {},
        "samples": [sample for rows in all_skipped.values() for sample in rows],
    }

    reason_counts: dict[str, int] = defaultdict(int)
    for rows in all_skipped.values():
        for sample in rows:
            reason_counts[str(sample.get("reason"))] += 1
    skipped_summary["by_reason"] = dict(sorted(reason_counts.items()))

    summary = {
        "generated_at": str(date.today()),
        "extractor_type": DEFAULT_EXTRACTOR_TYPE,
        "extractor_config": dict(DEFAULT_EXTRACTOR_CONFIG),
        "valid_jobs": {
            "total": sum(len(v) for v in all_jobs.values()),
            "by_split": {split: len(rows) for split, rows in all_jobs.items()},
        },
        "skipped_samples": skipped_summary,
        "per_label_counts": dict(sorted(per_label_counts.items())),
    }
    SUMMARY_OUT.write_text(json.dumps(summary, indent=2), encoding="utf-8")

    print(f"[ok] Train jobs  -> {OUTPUTS['train'].relative_to(REPO_ROOT)}")
    print(f"[ok] Val jobs    -> {OUTPUTS['val'].relative_to(REPO_ROOT)}")
    print(f"[ok] Test jobs   -> {OUTPUTS['test'].relative_to(REPO_ROOT)}")
    print(f"[ok] Job summary -> {SUMMARY_OUT.relative_to(REPO_ROOT)}")
    print()
    print(f"  Total valid jobs : {summary['valid_jobs']['total']}")
    print(f"  Skipped samples  : {summary['skipped_samples']['total']}")
    print(f"  Train jobs       : {summary['valid_jobs']['by_split']['train']}")
    print(f"  Val jobs         : {summary['valid_jobs']['by_split']['val']}")
    print(f"  Test jobs        : {summary['valid_jobs']['by_split']['test']}")
    print("  Per-label counts:")
    for label, counts in summary["per_label_counts"].items():
        print(
            f"    {label:<10} total={counts['total']:<3} train={counts['train']:<3} val={counts['val']:<3} test={counts['test']:<3}"
        )


if __name__ == "__main__":
    main()
