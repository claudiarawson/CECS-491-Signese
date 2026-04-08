"""
build_dataset_subset.py
-----------------------
Reads the Signese v0 dataset manifest and produces:

  data/processed/coverage_report.json  --  per-label readiness summary
  data/processed/target_labels.json    --  flat list of runtime labels for dataset matching

Usage (run from the repo root, i.e. signese/):
    python ml/scripts/build_dataset_subset.py

Optional: point to a different manifest with --manifest:
    python ml/scripts/build_dataset_subset.py --manifest path/to/dataset.manifest.json
"""

from __future__ import annotations

import argparse
import json
import sys
from datetime import date
from pathlib import Path


# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------

REPO_ROOT = Path(__file__).resolve().parent.parent.parent  # signese/
DEFAULT_MANIFEST_PATH = (
    REPO_ROOT / "src" / "features" / "translate" / "model" / "dataset.manifest.json"
)
PROCESSED_DIR = REPO_ROOT / "data" / "processed"


# ---------------------------------------------------------------------------
# Manifest parsing
# ---------------------------------------------------------------------------

def load_manifest(path: Path) -> dict:
    if not path.exists():
        sys.exit(f"[error] Manifest not found: {path}")
    with path.open(encoding="utf-8-sig") as f:
        return json.load(f)


def get_all_entries(manifest: dict) -> list[dict]:
    entries = []
    for group_entries in manifest.get("label_groups", {}).values():
        entries.extend(group_entries)
    return entries


def get_included_entries(manifest: dict) -> list[dict]:
    return [e for e in get_all_entries(manifest) if e.get("include") is True]


def get_trainable_entries(manifest: dict) -> list[dict]:
    """
    Trainable = included AND status == 'confirmed_in_dataset'
    AND the label is not a composed phrase with train_as_single_label=False.
    """
    composed_non_trainable = {
        p["phrase"]
        for p in manifest.get("composed_phrases", [])
        if p.get("train_as_single_label") is False
    }
    return [
        e for e in get_included_entries(manifest)
        if e.get("status") == "confirmed_in_dataset"
        and e["label"] not in composed_non_trainable
    ]


def get_composed_phrases(manifest: dict) -> list[dict]:
    return manifest.get("composed_phrases", [])


# ---------------------------------------------------------------------------
# Coverage report
# ---------------------------------------------------------------------------

def build_coverage_report(manifest: dict, manifest_path: Path) -> dict:
    all_entries = get_all_entries(manifest)
    included = get_included_entries(manifest)
    trainable = get_trainable_entries(manifest)
    composed = get_composed_phrases(manifest)

    # Group runtime labels by status
    by_status: dict[str, list[str]] = {}
    for entry in included:
        status = entry.get("status", "unknown")
        by_status.setdefault(status, []).append(entry["label"])

    # Group by source_dataset for future matching
    by_source: dict[str, list[str]] = {}
    for entry in included:
        src = entry.get("source_dataset") or "none"
        by_source.setdefault(src, []).append(entry["label"])

    return {
        "generated_at": str(date.today()),
        "manifest_version": manifest.get("version", "unknown"),
        "manifest_path": str(manifest_path),
        "counts": {
            "total_entries": len(all_entries),
            "runtime_labels": len(included),
            "trainable_labels": len(trainable),
            "composed_phrases": len(composed),
        },
        "runtime_labels_by_status": by_status,
        "runtime_labels_by_source_dataset": by_source,
        "trainable_labels": [e["label"] for e in trainable],
        "composed_phrases": [
            {
                "phrase": p["phrase"],
                "from_labels": p["from_labels"],
                "train_as_single_label": p["train_as_single_label"],
            }
            for p in composed
        ],
        # TODO(dataset): Add per-label clip_count once ASL Citizen / WLASL index is loaded.
        # TODO(dataset): Add per-label verified=True/False after dataset matching step.
        "dataset_matching": {
            "asl_citizen": None,   # TODO: populate after running ASL Citizen matching script
            "wlasl": None,         # TODO: populate after running WLASL matching script
            "custom_recordings": None,  # TODO: populate after custom recording collection
        },
    }


# ---------------------------------------------------------------------------
# Target labels list (flat, for dataset matching tools)
# ---------------------------------------------------------------------------

def build_target_labels(manifest: dict) -> dict:
    included = get_included_entries(manifest)

    # TODO(dataset): attach clip_count and verified fields once dataset indexes are available.
    labels = [
        {
            "label": e["label"],
            "group": e.get("group"),
            "status": e.get("status"),
            "source_dataset": e.get("source_dataset"),
            "source_gloss": e.get("source_gloss"),
            "notes": e.get("notes", ""),
            # placeholder fields for matching step
            "clip_count": None,       # TODO(dataset): fill from ASL Citizen / WLASL index
            "verified": False,        # TODO(dataset): set to True after manual or automated check
        }
        for e in included
    ]

    return {
        "generated_at": str(date.today()),
        "count": len(labels),
        "labels": labels,
    }


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:
    parser = argparse.ArgumentParser(description="Build Signese v0 dataset subset plan.")
    parser.add_argument(
        "--manifest",
        type=Path,
        default=DEFAULT_MANIFEST_PATH,
        help="Path to dataset.manifest.json (default: src/features/translate/model/dataset.manifest.json)",
    )
    args = parser.parse_args()

    manifest_path: Path = args.manifest.resolve()
    manifest = load_manifest(manifest_path)

    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)

    # --- Coverage report ---
    coverage = build_coverage_report(manifest, manifest_path)
    coverage_out = PROCESSED_DIR / "coverage_report.json"
    with coverage_out.open("w", encoding="utf-8") as f:
        json.dump(coverage, f, indent=2)
    print(f"[ok] Coverage report -> {coverage_out.relative_to(REPO_ROOT)}")

    # --- Target labels ---
    target = build_target_labels(manifest)
    target_out = PROCESSED_DIR / "target_labels.json"
    with target_out.open("w", encoding="utf-8") as f:
        json.dump(target, f, indent=2)
    print(f"[ok] Target labels   -> {target_out.relative_to(REPO_ROOT)}")

    # --- Console summary ---
    c = coverage["counts"]
    print()
    print(f"  Total entries    : {c['total_entries']}")
    print(f"  Runtime labels   : {c['runtime_labels']}")
    print(f"  Trainable labels : {c['trainable_labels']}")
    print(f"  Composed phrases : {c['composed_phrases']}")

    # --- Readiness breakdown ---
    print()
    print("  Status breakdown (runtime labels):")
    for status, labels in coverage["runtime_labels_by_status"].items():
        print(f"    {status:<30} {len(labels):>3} labels")

    # TODO(training): Generate per-split file manifests (train.json, val.json, test.json)
    #                 once per-label clip lists are available from matching steps.

    # TODO(training): Add optional --export-splits flag that writes split-stratified
    #                 file lists to data/processed/splits/ for use by the training pipeline.


if __name__ == "__main__":
    main()
