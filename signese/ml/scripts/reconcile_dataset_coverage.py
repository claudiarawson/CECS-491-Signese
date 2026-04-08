"""
reconcile_dataset_coverage.py
-----------------------------
Combine ASL Citizen and WLASL match reports with the Signese manifest to
recommend an initial trainable v0 subset.

Usage (run from signese/):
    python ml/scripts/reconcile_dataset_coverage.py

Optional flags:
    --manifest path/to/dataset.manifest.json
    --wlasl-report data/processed/wlasl_match_report.json
    --asl-report data/processed/asl_citizen_match_report.json

Output:
    data/processed/reconciled_dataset_coverage.json
"""

from __future__ import annotations

import argparse
import json
import sys
from datetime import date
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parent.parent.parent
DEFAULT_MANIFEST = REPO_ROOT / "src" / "features" / "translate" / "model" / "dataset.manifest.json"
DEFAULT_WLASL_REPORT = REPO_ROOT / "data" / "processed" / "wlasl_match_report.json"
DEFAULT_ASL_REPORT = REPO_ROOT / "data" / "processed" / "asl_citizen_match_report.json"
OUTPUT_PATH = REPO_ROOT / "data" / "processed" / "reconciled_dataset_coverage.json"


def load_json(path: Path) -> dict[str, Any]:
    if not path.exists():
        sys.exit(f"[error] Required file not found: {path}")
    with path.open(encoding="utf-8-sig") as f:
        return json.load(f)


def get_included_manifest_entries(manifest: dict[str, Any]) -> list[dict[str, Any]]:
    entries: list[dict[str, Any]] = []
    for group_entries in manifest.get("label_groups", {}).values():
        for entry in group_entries:
            if entry.get("include") is True:
                entries.append(entry)
    return entries


def report_to_label_map(report: dict[str, Any]) -> dict[str, dict[str, Any]]:
    """
    Support both matcher formats:
      - labels: [{label, matched, clip_count, ...}]
      - matched_labels + unmatched_labels arrays
    """
    records: list[dict[str, Any]] = []
    if isinstance(report.get("labels"), list):
        records.extend(report["labels"])
    if isinstance(report.get("matched_labels"), list):
        records.extend(report["matched_labels"])
    if isinstance(report.get("unmatched_labels"), list):
        records.extend(report["unmatched_labels"])

    out: dict[str, dict[str, Any]] = {}
    for rec in records:
        label = str(rec.get("label", "")).strip()
        if not label:
            continue
        out[label] = {
            "matched": bool(rec.get("matched", False)),
            "clip_count": int(rec.get("clip_count", 0) or 0),
            "matched_gloss": rec.get("matched_gloss"),
            "notes": rec.get("notes", ""),
        }
    return out


def choose_recommendation(
    label_entry: dict[str, Any],
    asl: dict[str, Any] | None,
    wlasl: dict[str, Any] | None,
) -> tuple[str, str, str]:
    """
    Returns (recommended_source, recommended_new_status, notes).
    Rules:
      - prefer ASL Citizen for greetings/intro when matched
      - fallback to WLASL when ASL does not match
      - keep needs_alt_dataset or needs_custom_recording when neither matches
    """
    label = str(label_entry.get("label", ""))
    group = str(label_entry.get("group", ""))
    current_status = str(label_entry.get("status", "needs_alt_dataset"))

    asl_matched = bool(asl and asl.get("matched"))
    wlasl_matched = bool(wlasl and wlasl.get("matched"))

    is_greeting = group == "greetings_intro"

    if is_greeting and asl_matched:
        return (
            "asl_citizen",
            "confirmed_in_dataset",
            "Greeting/intro label matched in ASL Citizen (preferred source).",
        )

    if wlasl_matched:
        return (
            "wlasl",
            "confirmed_in_dataset",
            "Matched in WLASL (used as fallback or primary available source).",
        )

    if asl_matched:
        return (
            "asl_citizen",
            "confirmed_in_dataset",
            "Matched in ASL Citizen.",
        )

    if current_status == "needs_custom_recording":
        return (
            "none",
            "needs_custom_recording",
            "No match in ASL Citizen or WLASL; keep custom recording status.",
        )

    return (
        "none",
        "needs_alt_dataset",
        "No match in ASL Citizen or WLASL; keep needs_alt_dataset.",
    )


def reconcile(
    manifest: dict[str, Any],
    wlasl_report: dict[str, Any],
    asl_report: dict[str, Any],
) -> dict[str, Any]:
    included_entries = get_included_manifest_entries(manifest)

    wlasl_map = report_to_label_map(wlasl_report)
    asl_map = report_to_label_map(asl_report)

    rows: list[dict[str, Any]] = []
    for entry in included_entries:
        label = str(entry.get("label", ""))
        current_status = str(entry.get("status", ""))

        wlasl = wlasl_map.get(label)
        asl = asl_map.get(label)

        source, new_status, rule_note = choose_recommendation(entry, asl, wlasl)

        row = {
            "label": label,
            "current_status": current_status,
            "asl_citizen_matched": bool(asl and asl.get("matched")),
            "asl_citizen_clip_count": int(asl.get("clip_count", 0) if asl else 0),
            "wlasl_matched": bool(wlasl and wlasl.get("matched")),
            "wlasl_clip_count": int(wlasl.get("clip_count", 0) if wlasl else 0),
            "recommended_source": source,
            "recommended_new_status": new_status,
            "notes": rule_note,
        }
        rows.append(row)

    asl_confirmed = [r for r in rows if r["recommended_source"] == "asl_citizen"]
    wlasl_confirmed = [r for r in rows if r["recommended_source"] == "wlasl"]
    unmatched = [r for r in rows if r["recommended_source"] == "none"]

    best_first_model = sorted(
        [r for r in rows if r["recommended_new_status"] == "confirmed_in_dataset"],
        key=lambda r: max(r["asl_citizen_clip_count"], r["wlasl_clip_count"]),
        reverse=True,
    )

    return {
        "generated_at": str(date.today()),
        "manifest_version": manifest.get("version", "unknown"),
        "input_reports": {
            "wlasl_match_report": str(DEFAULT_WLASL_REPORT.relative_to(REPO_ROOT)),
            "asl_citizen_match_report": str(DEFAULT_ASL_REPORT.relative_to(REPO_ROOT)),
        },
        "summary": {
            "included_labels": len(rows),
            "labels_confirmed_in_asl_citizen": len(asl_confirmed),
            "labels_confirmed_in_wlasl": len(wlasl_confirmed),
            "labels_still_unmatched": len(unmatched),
            "likely_first_model_label_count": len(best_first_model),
        },
        "labels": rows,
        "likely_best_first_model_label_set": [
            {
                "label": r["label"],
                "recommended_source": r["recommended_source"],
                "clip_count": max(r["asl_citizen_clip_count"], r["wlasl_clip_count"]),
            }
            for r in best_first_model
        ],
        "manifest_update_note": "This report does not auto-edit dataset.manifest.json.",
    }


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Reconcile ASL Citizen + WLASL coverage with Signese manifest labels."
    )
    parser.add_argument("--manifest", type=Path, default=DEFAULT_MANIFEST)
    parser.add_argument("--wlasl-report", type=Path, default=DEFAULT_WLASL_REPORT)
    parser.add_argument("--asl-report", type=Path, default=DEFAULT_ASL_REPORT)
    parser.add_argument("--out", type=Path, default=OUTPUT_PATH)
    args = parser.parse_args()

    manifest_path = args.manifest.resolve()
    wlasl_path = args.wlasl_report.resolve()
    asl_path = args.asl_report.resolve()
    out_path = args.out.resolve()

    manifest = load_json(manifest_path)
    wlasl_report = load_json(wlasl_path)
    asl_report = load_json(asl_path)

    result = reconcile(manifest, wlasl_report, asl_report)

    out_path.parent.mkdir(parents=True, exist_ok=True)
    with out_path.open("w", encoding="utf-8") as f:
        json.dump(result, f, indent=2)

    s = result["summary"]
    print(f"[ok] Reconciled report -> {out_path.relative_to(REPO_ROOT)}")
    print()
    print(f"  Labels confirmed in ASL Citizen : {s['labels_confirmed_in_asl_citizen']}")
    print(f"  Labels confirmed in WLASL       : {s['labels_confirmed_in_wlasl']}")
    print(f"  Labels still unmatched          : {s['labels_still_unmatched']}")
    print(f"  Likely first-model label set    : {s['likely_first_model_label_count']}")

    top = result["likely_best_first_model_label_set"][:12]
    print("  Top candidates:")
    if not top:
        print("    (none)")
    else:
        for row in top:
            print(
                f"    {row['label']:<10} source={row['recommended_source']:<11} clips={row['clip_count']}"
            )


if __name__ == "__main__":
    main()
