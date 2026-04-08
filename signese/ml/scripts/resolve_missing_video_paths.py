"""
resolve_missing_video_paths.py
-----------------------------
Recover missing local video_path values in first-model split manifests by
matching sample_id/video_id against files under data/raw/kaggleASL/videos/.

Inputs:
  - data/processed/first_model_train.json
  - data/processed/first_model_val.json
  - data/processed/first_model_test.json

Outputs:
  - data/processed/first_model_train_resolved.json
  - data/processed/first_model_val_resolved.json
  - data/processed/first_model_test_resolved.json
  - data/processed/video_path_resolution_report.json
"""

from __future__ import annotations

import json
import re
import sys
from collections import defaultdict
from datetime import date
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parent.parent.parent
PROCESSED_DIR = REPO_ROOT / "data" / "processed"
VIDEOS_DIR = REPO_ROOT / "data" / "raw" / "kaggleASL" / "videos"

INPUTS = {
    "train": PROCESSED_DIR / "first_model_train.json",
    "val": PROCESSED_DIR / "first_model_val.json",
    "test": PROCESSED_DIR / "first_model_test.json",
}

OUTPUTS = {
    "train": PROCESSED_DIR / "first_model_train_resolved.json",
    "val": PROCESSED_DIR / "first_model_val_resolved.json",
    "test": PROCESSED_DIR / "first_model_test_resolved.json",
}

REPORT_OUT = PROCESSED_DIR / "video_path_resolution_report.json"
VIDEO_EXTS = {".mp4", ".avi", ".mov", ".webm", ".mkv"}


def load_json_list(path: Path) -> list[dict[str, Any]]:
    if not path.exists():
        sys.exit(f"[error] Missing required input: {path}")
    with path.open(encoding="utf-8-sig") as f:
        data = json.load(f)
    if not isinstance(data, list):
        sys.exit(f"[error] Expected list in {path}")
    return data


def normalize_name(value: str) -> str:
    return re.sub(r"[^A-Za-z0-9]", "", value).upper()


def build_video_indexes(
    videos_dir: Path,
) -> tuple[dict[str, Path], dict[str, list[Path]], dict[str, list[Path]]]:
    exact: dict[str, Path] = {}
    by_stem: dict[str, list[Path]] = defaultdict(list)
    by_norm_stem: dict[str, list[Path]] = defaultdict(list)

    if not videos_dir.exists():
        sys.exit(f"[error] Videos directory not found: {videos_dir}")

    for file in videos_dir.iterdir():
        if not file.is_file() or file.suffix.lower() not in VIDEO_EXTS:
            continue
        exact[file.name.lower()] = file
        by_stem[file.stem].append(file)
        by_norm_stem[normalize_name(file.stem)].append(file)

    return exact, by_stem, by_norm_stem


def extract_video_id(row: dict[str, Any]) -> str | None:
    sample_id = str(row.get("sample_id", "")).strip()
    if not sample_id:
        return None

    # Expected pattern: wlasl:LABEL:VIDEO_ID:INSTANCE_ID
    parts = sample_id.split(":")
    if len(parts) >= 4 and parts[2]:
        return parts[2]

    # TODO(dataset): If sample_id format changes, update extraction logic here.
    match = re.search(r":(\d+):", sample_id)
    return match.group(1) if match else None


def resolve_path(
    row: dict[str, Any],
    exact: dict[str, Path],
    by_stem: dict[str, list[Path]],
    by_norm_stem: dict[str, list[Path]],
) -> tuple[str | None, str]:
    video_id = extract_video_id(row)
    if not video_id:
        return None, "missing_video_id"

    # 1) Exact filename from video_id + extension.
    for ext in VIDEO_EXTS:
        name = f"{video_id}{ext}".lower()
        if name in exact:
            return str(exact[name].relative_to(REPO_ROOT)), "exact_video_id"

    # 2) Exact basename match on video_id.
    stem_matches = by_stem.get(video_id, [])
    if len(stem_matches) == 1:
        return str(stem_matches[0].relative_to(REPO_ROOT)), "stem_video_id"

    # 3) Normalized basename match.
    norm_id = normalize_name(video_id)
    norm_matches = by_norm_stem.get(norm_id, [])
    if len(norm_matches) == 1:
        return str(norm_matches[0].relative_to(REPO_ROOT)), "normalized_video_id"

    # 4) Optional basename matching from notes URL.
    notes = str(row.get("notes", ""))
    url_match = re.search(r"url=([^;]+)", notes)
    if url_match:
        basename = Path(url_match.group(1)).name
        lower_name = basename.lower()
        if lower_name in exact:
            return str(exact[lower_name].relative_to(REPO_ROOT)), "exact_url_basename"

        stem = Path(basename).stem
        stem_matches = by_stem.get(stem, [])
        if len(stem_matches) == 1:
            return str(stem_matches[0].relative_to(REPO_ROOT)), "stem_url_basename"

        norm_stem = normalize_name(stem)
        norm_matches = by_norm_stem.get(norm_stem, [])
        if len(norm_matches) == 1:
            return str(norm_matches[0].relative_to(REPO_ROOT)), "normalized_url_basename"

    # TODO(dataset): Some WLASL local copies may prefix filenames, use alternate
    # zero-padding, or store nested paths. Add additional heuristics here if needed.
    return None, "no_local_match"


def process_split(
    split: str,
    rows: list[dict[str, Any]],
    exact: dict[str, Path],
    by_stem: dict[str, list[Path]],
    by_norm_stem: dict[str, list[Path]],
) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    resolved_rows: list[dict[str, Any]] = []
    stats: dict[str, Any] = {
        "total_rows": len(rows),
        "unresolved_before": 0,
        "resolved": 0,
        "still_unresolved": 0,
        "resolution_methods": defaultdict(int),
        "unresolved_examples": [],
    }

    for row in rows:
        out = dict(row)
        if out.get("video_path") is not None:
            resolved_rows.append(out)
            continue

        stats["unresolved_before"] += 1
        resolved_path, method = resolve_path(out, exact, by_stem, by_norm_stem)

        if resolved_path is not None:
            out["video_path"] = resolved_path
            notes = str(out.get("notes", "")).strip()
            suffix = f"resolved_video_path={method}"
            out["notes"] = notes + ("; " if notes else "") + suffix
            stats["resolved"] += 1
            stats["resolution_methods"][method] += 1
        else:
            stats["still_unresolved"] += 1
            if len(stats["unresolved_examples"]) < 12:
                stats["unresolved_examples"].append(
                    {
                        "sample_id": out.get("sample_id"),
                        "label": out.get("label"),
                        "notes": out.get("notes"),
                        "reason": method,
                    }
                )

        resolved_rows.append(out)

    stats["resolution_methods"] = dict(sorted(stats["resolution_methods"].items()))
    return resolved_rows, stats


def main() -> None:
    exact, by_stem, by_norm_stem = build_video_indexes(VIDEOS_DIR)

    overall: dict[str, Any] = {
        "generated_at": str(date.today()),
        "videos_dir": str(VIDEOS_DIR),
        "total_unresolved_before": 0,
        "total_resolved": 0,
        "still_unresolved": 0,
        "per_split": {},
        "examples_of_unresolved_entries": [],
        "notes_on_likely_filename_mismatches": [
            "Resolution prefers video_id parsed from sample_id.",
            "Current local videos directory appears to contain only numeric .mp4 basenames.",
            "Unresolved rows are likely true local-file gaps rather than extension mismatches.",
        ],
    }

    for split, input_path in INPUTS.items():
        rows = load_json_list(input_path)
        resolved_rows, stats = process_split(split, rows, exact, by_stem, by_norm_stem)
        OUTPUTS[split].write_text(json.dumps(resolved_rows, indent=2), encoding="utf-8")

        overall["per_split"][split] = {
            "unresolved_before": stats["unresolved_before"],
            "resolved": stats["resolved"],
            "still_unresolved": stats["still_unresolved"],
            "resolution_methods": stats["resolution_methods"],
        }
        overall["total_unresolved_before"] += stats["unresolved_before"]
        overall["total_resolved"] += stats["resolved"]
        overall["still_unresolved"] += stats["still_unresolved"]
        overall["examples_of_unresolved_entries"].extend(stats["unresolved_examples"])

    overall["examples_of_unresolved_entries"] = overall["examples_of_unresolved_entries"][:12]

    REPORT_OUT.write_text(json.dumps(overall, indent=2), encoding="utf-8")

    print(f"[ok] Train resolved -> {OUTPUTS['train'].relative_to(REPO_ROOT)}")
    print(f"[ok] Val resolved   -> {OUTPUTS['val'].relative_to(REPO_ROOT)}")
    print(f"[ok] Test resolved  -> {OUTPUTS['test'].relative_to(REPO_ROOT)}")
    print(f"[ok] Report         -> {REPORT_OUT.relative_to(REPO_ROOT)}")
    print()
    print(f"  Total unresolved before : {overall['total_unresolved_before']}")
    print(f"  Total resolved          : {overall['total_resolved']}")
    print(f"  Still unresolved        : {overall['still_unresolved']}")
    print("  Per-split counts:")
    for split, stats in overall["per_split"].items():
        print(
            f"    {split:<5} before={stats['unresolved_before']:<3} resolved={stats['resolved']:<3} remaining={stats['still_unresolved']:<3}"
        )


if __name__ == "__main__":
    main()
