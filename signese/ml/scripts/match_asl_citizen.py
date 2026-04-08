"""
match_asl_citizen.py
--------------------
Matches Signese v0 manifest labels against ASL Citizen dataset metadata and
produces a per-label coverage report showing which candidate labels are present
in the dataset and how many clips are available.

Usage (run from the repo root, i.e. signese/):
    python ml/scripts/match_asl_citizen.py

Optional flags:
    --manifest   path/to/dataset.manifest.json   (default: src/features/translate/model/dataset.manifest.json)
    --asl-dir    path/to/asl_citizen/            (default: data/raw/asl_citizen/)

Expected ASL Citizen folder layout
-----------------------------------
The script tries two common release layouts in order:

  Layout A – flat CSV index (most common public release):
    data/raw/asl_citizen/
        metadata.csv          columns: video_id, gloss, signer_id, ...
    OR  clips.csv / index.csv / labels.csv / asl_citizen.csv

  Layout B – per-split JSON files (some Hugging Face mirror):
    data/raw/asl_citizen/
        train.json            list of {"video_id": ..., "label": ..., ...}
        test.json
        val.json   (optional)

  Layout C – WLASL-style directory tree (manual download):
    data/raw/asl_citizen/
        <GLOSS>/              one sub-folder per gloss
            *.mp4 / *.avi

If none of these are found the script exits with a helpful message listing
what it looked for so you can adjust the folder structure or add a new
parsing branch.

Output
-------
  data/processed/asl_citizen_match_report.json
"""

from __future__ import annotations

import argparse
import csv
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
DEFAULT_ASL_DIR = REPO_ROOT / "data" / "raw" / "asl_citizen"
PROCESSED_DIR = REPO_ROOT / "data" / "processed"

# Candidate CSV filenames to probe (Layout A)
_CSV_CANDIDATES = [
    "metadata.csv",
    "clips.csv",
    "index.csv",
    "labels.csv",
    "asl_citizen.csv",
    "asl_citizen_metadata.csv",
]

# Candidate JSON split files to probe (Layout B)
_JSON_SPLITS = ["train.json", "test.json", "val.json", "dev.json"]

# Common column name aliases for gloss/label in CSV files
# TODO(dataset): Extend this list once you know the exact column headers in
#               your downloaded ASL Citizen release.
_GLOSS_COL_ALIASES = ["gloss", "label", "sign", "word", "class"]
_CLIP_COL_ALIASES  = ["video_id", "clip_id", "file", "filename", "id"]


# ---------------------------------------------------------------------------
# Manifest helpers  (mirrors build_dataset_subset.py)
# ---------------------------------------------------------------------------

def load_manifest(path: Path) -> dict:
    if not path.exists():
        sys.exit(f"[error] Manifest not found: {path}")
    with path.open(encoding="utf-8-sig") as f:
        return json.load(f)


def get_candidate_entries(manifest: dict) -> list[dict]:
    """Return included labels whose source_dataset is 'asl_citizen'."""
    entries = []
    for group_entries in manifest.get("label_groups", {}).values():
        for entry in group_entries:
            if (
                entry.get("include") is True
                and entry.get("source_dataset") == "asl_citizen"
            ):
                entries.append(entry)
    return entries


# ---------------------------------------------------------------------------
# ASL Citizen index loading
# ---------------------------------------------------------------------------

def _find_gloss_col(header: list[str]) -> str | None:
    lower = [h.lower().strip() for h in header]
    for alias in _GLOSS_COL_ALIASES:
        if alias in lower:
            return header[lower.index(alias)]
    return None


def _find_clip_col(header: list[str]) -> str | None:
    lower = [h.lower().strip() for h in header]
    for alias in _CLIP_COL_ALIASES:
        if alias in lower:
            return header[lower.index(alias)]
    return None


def _load_csv_index(csv_path: Path) -> dict[str, int]:
    """
    Parse a CSV metadata file into {gloss_upper -> clip_count}.

    TODO(dataset): If the CSV uses a different delimiter (tab, pipe), change
                   the `delimiter` argument to csv.DictReader below.
    TODO(dataset): Some ASL Citizen releases store the gloss in a column called
                   'Sign' or 'Word' — add those to _GLOSS_COL_ALIASES if needed.
    """
    counts: dict[str, int] = {}
    with csv_path.open(encoding="utf-8-sig", newline="") as fh:
        reader = csv.DictReader(fh)
        if reader.fieldnames is None:
            return counts
        gloss_col = _find_gloss_col(list(reader.fieldnames))
        if gloss_col is None:
            print(
                f"[warn] Could not find a gloss column in {csv_path.name}. "
                f"Headers: {list(reader.fieldnames)}"
            )
            return counts
        for row in reader:
            gloss = row.get(gloss_col, "").strip().upper()
            if gloss:
                counts[gloss] = counts.get(gloss, 0) + 1
    return counts


def _load_json_splits(asl_dir: Path) -> dict[str, int]:
    """
    Parse one or more JSON split files into {gloss_upper -> clip_count}.

    TODO(dataset): Adjust the key names ("label", "gloss", "sign") to match
                   the actual JSON schema in your downloaded release.
    TODO(dataset): Some Hugging Face mirrors use a "features" dict structure —
                   inspect the raw JSON and update the key lookup below.
    """
    counts: dict[str, int] = {}
    for split_name in _JSON_SPLITS:
        split_path = asl_dir / split_name
        if not split_path.exists():
            continue
        with split_path.open(encoding="utf-8-sig") as fh:
            data = json.load(fh)
        # Handle both a bare list and a {"data": [...]} wrapper
        if isinstance(data, dict):
            data = data.get("data") or data.get("samples") or []
        if not isinstance(data, list):
            print(f"[warn] Unexpected JSON structure in {split_name}, skipping.")
            continue
        for item in data:
            # TODO(dataset): Replace "label" with the correct key for your release.
            gloss = (
                item.get("label") or item.get("gloss") or item.get("sign") or ""
            )
            gloss = str(gloss).strip().upper()
            if gloss:
                counts[gloss] = counts.get(gloss, 0) + 1
    return counts


def _load_directory_tree(asl_dir: Path) -> dict[str, int]:
    """
    Count video files in a per-gloss sub-directory tree:
        asl_citizen/<GLOSS>/*.mp4
    """
    counts: dict[str, int] = {}
    video_exts = {".mp4", ".avi", ".mov", ".webm"}
    for child in asl_dir.iterdir():
        if child.is_dir():
            clips = [f for f in child.iterdir() if f.suffix.lower() in video_exts]
            if clips:
                counts[child.name.upper()] = len(clips)
    return counts


def load_asl_citizen_index(asl_dir: Path) -> tuple[dict[str, int], str]:
    """
    Try all three layout strategies.  Returns (gloss_to_count, strategy_used).
    Exits with a helpful message if nothing is found.
    """
    # Layout A – CSV metadata file
    for name in _CSV_CANDIDATES:
        csv_path = asl_dir / name
        if csv_path.exists():
            counts = _load_csv_index(csv_path)
            if counts:
                return counts, f"csv:{name}"
            print(f"[warn] {name} found but no gloss data extracted — check column names.")

    # Layout B – JSON split files
    json_counts = _load_json_splits(asl_dir)
    if json_counts:
        return json_counts, "json-splits"

    # Layout C – directory tree
    if asl_dir.exists() and any(asl_dir.iterdir()):
        dir_counts = _load_directory_tree(asl_dir)
        if dir_counts:
            return dir_counts, "directory-tree"

    # Nothing found
    searched = "\n  ".join(
        [str(asl_dir / n) for n in _CSV_CANDIDATES]
        + [str(asl_dir / n) for n in _JSON_SPLITS]
        + [f"{asl_dir}/<GLOSS>/ (directory tree)"]
    )
    print(
        f"\n[error] No ASL Citizen data found under: {asl_dir}\n"
        f"  Searched:\n  {searched}\n"
        f"  Download the dataset and place it under data/raw/asl_citizen/,\n"
        f"  then re-run this script.  See ml/README.md for details.\n"
    )
    sys.exit(1)


# ---------------------------------------------------------------------------
# Matching
# ---------------------------------------------------------------------------

def match_labels(
    candidates: list[dict],
    gloss_index: dict[str, int],
) -> list[dict]:
    """
    For each candidate label attempt an exact match then a case-insensitive
    prefix/substring fallback.

    Returns a list of per-label match records.

    TODO(dataset): If ASL Citizen uses different gloss spellings (e.g.
                   "GOOD-MORNING" vs "GOOD"), add a normalisation map here.
    """
    results = []
    for entry in candidates:
        label        = entry["label"]
        source_gloss = (entry.get("source_gloss") or label).upper()

        # 1. Exact match on source_gloss
        if source_gloss in gloss_index:
            clip_count    = gloss_index[source_gloss]
            matched       = True
            matched_gloss = source_gloss
            note          = ""

        # 2. Exact match on label itself (in case source_gloss differs)
        elif label.upper() in gloss_index:
            clip_count    = gloss_index[label.upper()]
            matched       = True
            matched_gloss = label.upper()
            note          = f"Matched on label '{label}', not source_gloss '{source_gloss}'."

        # 3. Substring fallback — surface candidates for manual review
        else:
            substring_hits = [
                g for g in gloss_index if source_gloss in g or g in source_gloss
            ]
            matched       = False
            matched_gloss = None
            clip_count    = 0
            if substring_hits:
                note = (
                    f"No exact match. Possible near-matches in dataset: "
                    + ", ".join(substring_hits[:5])
                    + (" ..." if len(substring_hits) > 5 else "")
                )
            else:
                note = "No match found. Check gloss spelling or try WLASL / custom recording."

        results.append(
            {
                "label":          label,
                "group":          entry.get("group"),
                "source_gloss":   source_gloss,
                "matched":        matched,
                "matched_gloss":  matched_gloss,
                "clip_count":     clip_count,
                "notes":          note,
            }
        )

    return results


# ---------------------------------------------------------------------------
# Report
# ---------------------------------------------------------------------------

def build_report(
    match_results: list[dict],
    manifest_version: str,
    asl_dir: Path,
    strategy: str,
) -> dict:
    matched      = [r for r in match_results if r["matched"]]
    unmatched    = [r for r in match_results if not r["matched"]]
    total_clips  = sum(r["clip_count"] for r in matched)

    return {
        "generated_at":       str(date.today()),
        "manifest_version":   manifest_version,
        "asl_citizen_dir":    str(asl_dir),
        "index_strategy":     strategy,
        "counts": {
            "candidate_labels": len(match_results),
            "matched":          len(matched),
            "unmatched":        len(unmatched),
            "total_clips":      total_clips,
        },
        "matched_labels":   matched,
        "unmatched_labels": unmatched,
        # TODO(dataset): Populate after running split-export step.
        "next_steps": {
            "update_manifest_status": "Set status='confirmed_in_dataset' for matched labels with sufficient clip_count.",
            "split_export":           "Run ml/scripts/build_dataset_subset.py --export-splits after confirming labels.",
            "wlasl_fallback":         "Run ml/scripts/match_wlasl.py for unmatched labels.",
            "custom_recording":       "Schedule custom recordings for labels that remain unmatched after WLASL.",
        },
    }


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:
    parser = argparse.ArgumentParser(
        description="Match Signese v0 manifest labels against ASL Citizen dataset."
    )
    parser.add_argument(
        "--manifest",
        type=Path,
        default=DEFAULT_MANIFEST_PATH,
        help="Path to dataset.manifest.json",
    )
    parser.add_argument(
        "--asl-dir",
        type=Path,
        default=DEFAULT_ASL_DIR,
        help="Root directory of the ASL Citizen dataset (default: data/raw/asl_citizen/)",
    )
    args = parser.parse_args()

    manifest_path: Path = args.manifest.resolve()
    asl_dir: Path       = args.asl_dir.resolve()

    manifest   = load_manifest(manifest_path)
    candidates = get_candidate_entries(manifest)

    if not candidates:
        print("[info] No candidate labels found with source_dataset='asl_citizen'.")
        sys.exit(0)

    print(f"[info] {len(candidates)} candidate labels to match against ASL Citizen.")
    print(f"[info] Looking for dataset under: {asl_dir}")

    gloss_index, strategy = load_asl_citizen_index(asl_dir)
    print(f"[info] Loaded {len(gloss_index)} unique glosses  (strategy: {strategy})")

    match_results = match_labels(candidates, gloss_index)

    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    report = build_report(
        match_results,
        manifest.get("version", "unknown"),
        asl_dir,
        strategy,
    )
    out_path = PROCESSED_DIR / "asl_citizen_match_report.json"
    with out_path.open("w", encoding="utf-8") as fh:
        json.dump(report, fh, indent=2)

    print(f"[ok] Match report -> {out_path.relative_to(REPO_ROOT)}")

    # Console summary
    c = report["counts"]
    print()
    print(f"  Candidate labels : {c['candidate_labels']}")
    print(f"  Matched          : {c['matched']}")
    print(f"  Unmatched        : {c['unmatched']}")
    print(f"  Total clips      : {c['total_clips']}")

    if report["unmatched_labels"]:
        print()
        print("  Unmatched labels:")
        for r in report["unmatched_labels"]:
            print(f"    {r['label']:<16}  {r['notes']}")


if __name__ == "__main__":
    main()
