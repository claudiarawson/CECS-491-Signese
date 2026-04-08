"""
match_wlasl.py
--------------
Match Signese manifest labels against Kaggle/WLASL-processed data and generate
coverage statistics per label.

Usage (run from signese/):
    python ml/scripts/match_wlasl.py

Optional flags:
    --manifest   path/to/dataset.manifest.json
    --wlasl-dir  path/to/kaggleASL/

Expected dataset layouts (auto-detected)
---------------------------------------
Layout A (preferred):
  data/raw/kaggleASL/
    WLASL_v0.3.json      # list of {gloss, instances:[...]}

Layout B (processed split-index style):
  data/raw/kaggleASL/
    nslt_300.json / nslt_1000.json / nslt_2000.json
    wlasl_class_list.txt # index -> gloss mapping

Layout C (directory tree fallback):
  data/raw/kaggleASL/
    videos/              # video files whose names may contain glosses
    OR <GLOSS>/          # one folder per gloss with clips inside

Output:
  data/processed/wlasl_match_report.json
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from datetime import date
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parent.parent.parent
DEFAULT_MANIFEST_PATH = (
    REPO_ROOT / "src" / "features" / "translate" / "model" / "dataset.manifest.json"
)
DEFAULT_WLASL_DIR = REPO_ROOT / "data" / "raw" / "kaggleASL"
PROCESSED_DIR = REPO_ROOT / "data" / "processed"

VIDEO_EXTENSIONS = {".mp4", ".avi", ".mov", ".webm", ".mkv"}
NSLT_FILES = ["nslt_300.json", "nslt_1000.json", "nslt_2000.json", "nslt_100.json"]


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


def load_manifest(path: Path) -> dict[str, Any]:
    if not path.exists():
        sys.exit(f"[error] Manifest not found: {path}")
    with path.open(encoding="utf-8-sig") as f:
        return json.load(f)


def get_included_entries(manifest: dict[str, Any]) -> list[dict[str, Any]]:
    entries: list[dict[str, Any]] = []
    for group_entries in manifest.get("label_groups", {}).values():
        for entry in group_entries:
            if entry.get("include") is True:
                entries.append(entry)
    return entries


def normalize_label(value: str) -> str:
    """Case/space/hyphen/underscore-insensitive key for robust matching."""
    return re.sub(r"[^A-Z0-9]", "", value.upper())


def numeric_variants(value: str) -> set[str]:
    """
    Return optional numeric-word variants: 1 <-> ONE, etc.
    Keeps behavior simple and explicit for v0 label range (0-20).
    """
    v = value.strip().upper()
    variants = {v}
    if v in DIGIT_TO_WORD:
        variants.add(DIGIT_TO_WORD[v])
    if v in WORD_TO_DIGIT:
        variants.add(WORD_TO_DIGIT[v])
    return variants


def count_video_files(path: Path) -> int:
    if not path.exists():
        return 0
    if path.is_file():
        return 1 if path.suffix.lower() in VIDEO_EXTENSIONS else 0
    return sum(
        1
        for file in path.rglob("*")
        if file.is_file() and file.suffix.lower() in VIDEO_EXTENSIONS
    )


def load_from_wlasl_v03_json(wlasl_dir: Path) -> tuple[dict[str, dict[str, Any]], str] | None:
    """
    Parse WLASL_v0.3.json entries:
      [{"gloss": "book", "instances": [{"video_id": ...}, ...]}, ...]
    """
    json_path = wlasl_dir / "WLASL_v0.3.json"
    if not json_path.exists():
        return None

    with json_path.open(encoding="utf-8-sig") as f:
        data = json.load(f)

    if not isinstance(data, list):
        print(f"[warn] Unexpected structure in {json_path.name}.")
        return None

    gloss_map: dict[str, dict[str, Any]] = {}
    for item in data:
        if not isinstance(item, dict):
            continue
        raw_gloss = str(item.get("gloss", "")).strip()
        if not raw_gloss:
            continue
        instances = item.get("instances", [])
        clip_count = len(instances) if isinstance(instances, list) else 0
        norm = normalize_label(raw_gloss)
        if not norm:
            continue
        existing = gloss_map.get(norm)
        if existing is None or clip_count > existing["clip_count"]:
            gloss_map[norm] = {
                "gloss": raw_gloss.upper(),
                "clip_count": clip_count,
                "source_path_or_metadata": str(json_path.relative_to(REPO_ROOT)),
            }
    if not gloss_map:
        return None
    return gloss_map, "wlasl_v0.3.json"


def load_from_nslt_files(wlasl_dir: Path) -> tuple[dict[str, dict[str, Any]], str] | None:
    """
    Parse nslt_*.json style:
      {"video_id": {"subset": "train", "action": [class_idx, ...]}}
    Requires wlasl_class_list.txt for class_idx -> gloss.

    TODO(dataset): Some Kaggle mirrors may rename these files.
    TODO(dataset): If class list uses a different format, adjust parser below.
    """
    class_list_path = wlasl_dir / "wlasl_class_list.txt"
    if not class_list_path.exists():
        return None

    class_map: dict[int, str] = {}
    with class_list_path.open(encoding="utf-8-sig") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            parts = line.split(maxsplit=1)
            if len(parts) != 2 or not parts[0].isdigit():
                continue
            class_map[int(parts[0])] = parts[1].strip().upper()

    if not class_map:
        return None

    counts: dict[str, int] = {}
    source_file_used: str | None = None
    for name in NSLT_FILES:
        path = wlasl_dir / name
        if not path.exists():
            continue
        source_file_used = name
        with path.open(encoding="utf-8-sig") as f:
            payload = json.load(f)
        if not isinstance(payload, dict):
            continue
        for _, sample in payload.items():
            if not isinstance(sample, dict):
                continue
            action = sample.get("action")
            if not isinstance(action, list) or not action:
                continue
            class_idx = action[0]
            if not isinstance(class_idx, int):
                continue
            gloss = class_map.get(class_idx)
            if not gloss:
                continue
            norm = normalize_label(gloss)
            if not norm:
                continue
            counts[norm] = counts.get(norm, 0) + 1

    if not counts:
        return None

    source = source_file_used or "nslt_*.json"
    gloss_map: dict[str, dict[str, Any]] = {}
    for norm, clip_count in counts.items():
        # Keep representative gloss from class_map by reverse lookup.
        gloss = next((g for g in class_map.values() if normalize_label(g) == norm), norm)
        gloss_map[norm] = {
            "gloss": gloss,
            "clip_count": clip_count,
            "source_path_or_metadata": str((wlasl_dir / source).relative_to(REPO_ROOT)),
        }
    return gloss_map, f"nslt:{source}"


def load_from_directory_layout(wlasl_dir: Path) -> tuple[dict[str, dict[str, Any]], str] | None:
    """
    Fallback for directory-based layouts.

    TODO(dataset): If your extracted folder stores labels only in filenames with
    numeric IDs, add a metadata parser branch above and avoid this heuristic.
    """
    gloss_map: dict[str, dict[str, Any]] = {}

    # Option 1: <root>/<GLOSS>/clips...
    for child in wlasl_dir.iterdir() if wlasl_dir.exists() else []:
        if not child.is_dir():
            continue
        if child.name.lower() in {"videos", "frames", "annotations"}:
            continue
        clip_count = count_video_files(child)
        if clip_count == 0:
            continue
        norm = normalize_label(child.name)
        if not norm:
            continue
        gloss_map[norm] = {
            "gloss": child.name.upper(),
            "clip_count": clip_count,
            "source_path_or_metadata": str(child.relative_to(REPO_ROOT)),
        }

    # Option 2: videos/ with label-like filenames
    videos_dir = wlasl_dir / "videos"
    if videos_dir.exists() and videos_dir.is_dir():
        for file in videos_dir.rglob("*"):
            if not file.is_file() or file.suffix.lower() not in VIDEO_EXTENSIONS:
                continue
            stem = file.stem.upper()
            # Heuristic: strip trailing id chunks e.g., HELLO_0001
            stem = re.sub(r"[_-]?\d+$", "", stem)
            norm = normalize_label(stem)
            if not norm:
                continue
            if norm not in gloss_map:
                gloss_map[norm] = {
                    "gloss": stem,
                    "clip_count": 0,
                    "source_path_or_metadata": str(videos_dir.relative_to(REPO_ROOT)),
                }
            gloss_map[norm]["clip_count"] += 1

    if not gloss_map:
        return None
    return gloss_map, "directory-layout"


def load_wlasl_index(wlasl_dir: Path) -> tuple[dict[str, dict[str, Any]], str]:
    loaders = [
        load_from_wlasl_v03_json,
        load_from_nslt_files,
        load_from_directory_layout,
    ]
    for loader in loaders:
        out = loader(wlasl_dir)
        if out is not None:
            return out

    searched = [
        str((wlasl_dir / "WLASL_v0.3.json")),
        str((wlasl_dir / "wlasl_class_list.txt")),
        *[str((wlasl_dir / n)) for n in NSLT_FILES],
        str((wlasl_dir / "videos")),
    ]
    msg = "\n  ".join(searched)
    sys.exit(
        "[error] Could not detect a supported WLASL layout.\n"
        f"  Searched:\n  {msg}\n"
        "  Verify extraction under data/raw/kaggleASL and inspect filenames/JSON keys."
    )


def find_best_match(
    label: str,
    source_gloss: str | None,
    index_map: dict[str, dict[str, Any]],
) -> tuple[bool, str | None, int, str, str]:
    """Return matched, matched_gloss, clip_count, source, notes."""
    candidates: list[tuple[str, str]] = []

    base_tokens = set(numeric_variants(label))
    if source_gloss:
        base_tokens |= set(numeric_variants(source_gloss))

    # 1) exact on source_gloss/label
    for token in base_tokens:
        key = normalize_label(token)
        if key in index_map:
            rec = index_map[key]
            return (
                True,
                rec["gloss"],
                int(rec["clip_count"]),
                rec["source_path_or_metadata"],
                "Exact match." if token.upper() == (source_gloss or "").upper() else "Exact label match.",
            )

    # 2) normalized contains relation fallback
    token_keys = {normalize_label(t) for t in base_tokens}
    for idx_key, rec in index_map.items():
        for tk in token_keys:
            if tk and (tk in idx_key or idx_key in tk):
                candidates.append((idx_key, rec["gloss"]))

    if candidates:
        first_key = candidates[0][0]
        rec = index_map[first_key]
        suggestion = ", ".join(sorted({g for _, g in candidates})[:5])
        return (
            False,
            None,
            0,
            rec["source_path_or_metadata"],
            f"No exact match. Near normalized candidates: {suggestion}",
        )

    return (
        False,
        None,
        0,
        "",
        "No match found.",
    )


def build_report(
    manifest: dict[str, Any],
    entries: list[dict[str, Any]],
    index_map: dict[str, dict[str, Any]],
    strategy: str,
    wlasl_dir: Path,
) -> dict[str, Any]:
    results: list[dict[str, Any]] = []

    for entry in entries:
        label = str(entry.get("label", "")).strip()
        source_gloss = entry.get("source_gloss")
        matched, matched_gloss, clip_count, source, notes = find_best_match(
            label,
            str(source_gloss) if source_gloss else None,
            index_map,
        )
        results.append(
            {
                "label": label,
                "matched": matched,
                "matched_gloss": matched_gloss,
                "clip_count": clip_count,
                "source_path_or_metadata": source,
                "notes": notes,
                "status": entry.get("status"),
                "group": entry.get("group"),
            }
        )

    matched = [r for r in results if r["matched"]]
    unmatched = [r for r in results if not r["matched"]]

    priority = [
        r
        for r in matched
        if r.get("status") == "needs_alt_dataset" and r.get("clip_count", 0) > 0
    ]
    priority_sorted = sorted(priority, key=lambda r: r.get("clip_count", 0), reverse=True)

    return {
        "generated_at": str(date.today()),
        "manifest_version": manifest.get("version", "unknown"),
        "wlasl_dir": str(wlasl_dir),
        "index_strategy": strategy,
        "counts": {
            "included_labels": len(results),
            "matched": len(matched),
            "unmatched": len(unmatched),
            "needs_alt_dataset_included": sum(1 for r in results if r.get("status") == "needs_alt_dataset"),
            "needs_alt_dataset_matched": sum(
                1 for r in matched if r.get("status") == "needs_alt_dataset"
            ),
        },
        "labels": results,
        "likely_first_model_training_candidates": [
            {
                "label": r["label"],
                "matched_gloss": r["matched_gloss"],
                "clip_count": r["clip_count"],
                "status": r.get("status"),
            }
            for r in priority_sorted[:20]
        ],
        "notes": [
            "Focus is include=true labels; status='needs_alt_dataset' is prioritized in summary.",
            "If matching is weak, inspect WLASL_v0.3.json gloss spellings and nslt class index mapping.",
            "TODO(dataset): Add explicit synonym map if gloss naming differs (e.g., THANK-YOU vs THANKYOU).",
        ],
    }


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Match Signese manifest labels against Kaggle/WLASL datasets."
    )
    parser.add_argument("--manifest", type=Path, default=DEFAULT_MANIFEST_PATH)
    parser.add_argument("--wlasl-dir", type=Path, default=DEFAULT_WLASL_DIR)
    args = parser.parse_args()

    manifest_path = args.manifest.resolve()
    wlasl_dir = args.wlasl_dir.resolve()

    manifest = load_manifest(manifest_path)
    included_entries = get_included_entries(manifest)

    if not included_entries:
        sys.exit("[info] No include=true labels found in manifest.")

    index_map, strategy = load_wlasl_index(wlasl_dir)
    report = build_report(manifest, included_entries, index_map, strategy, wlasl_dir)

    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    out_path = PROCESSED_DIR / "wlasl_match_report.json"
    with out_path.open("w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)

    counts = report["counts"]
    print(f"[ok] WLASL match report -> {out_path.relative_to(REPO_ROOT)}")
    print(f"[info] Index strategy: {strategy}")
    print()
    print(f"  Matched count   : {counts['matched']}")
    print(f"  Unmatched count : {counts['unmatched']}")

    candidates = report["likely_first_model_training_candidates"]
    print("  Likely first-model training candidates:")
    if not candidates:
        print("    (none yet; check matching and clip availability)")
    else:
        for row in candidates[:10]:
            print(
                f"    {row['label']:<10} -> {row['matched_gloss']:<15} clips={row['clip_count']}"
            )


if __name__ == "__main__":
    main()
