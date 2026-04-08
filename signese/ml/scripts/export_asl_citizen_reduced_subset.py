"""
export_asl_citizen_reduced_subset.py
-----------------------------------
Export ASL Citizen samples for the reduced 8-label Signese experiment.

Reads:
  - data/processed/asl_citizen_vocabulary.json
  - data/processed/asl_citizen_reduced_label_probe.json
  - data/raw/ASL_Citizen/splits/*.csv

Writes:
  - data/processed/asl_citizen_reduced_subset_manifest.json
  - data/processed/asl_citizen_reduced_subset_summary.json

This script is export-only and does not merge with WLASL manifests yet.
"""

from __future__ import annotations

import csv
import json
import re
from collections import defaultdict
from datetime import date
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parent.parent.parent
PROCESSED_DIR = REPO_ROOT / "data" / "processed"
ASL_ROOT = REPO_ROOT / "data" / "raw" / "ASL_Citizen"
ASL_SPLITS_DIR = ASL_ROOT / "splits"
ASL_VIDEOS_DIR = ASL_ROOT / "videos"

IN_VOCAB = PROCESSED_DIR / "asl_citizen_vocabulary.json"
IN_PROBE = PROCESSED_DIR / "asl_citizen_reduced_label_probe.json"

OUT_MANIFEST = PROCESSED_DIR / "asl_citizen_reduced_subset_manifest.json"
OUT_SUMMARY = PROCESSED_DIR / "asl_citizen_reduced_subset_summary.json"

REDUCED_LABELS = [
    "MEET",
    "HOW",
    "GOOD",
    "NAME",
    "YOU",
    "NICE",
    "HELLO",
    "MORNING",
]

# Configurable source-gloss variants per reduced label.
LABEL_VARIANT_GLOSSES: dict[str, list[str]] = {
    "HOW": ["HOW1", "HOW2"],
}


def normalize_text(value: str) -> str:
    return re.sub(r"[^A-Z0-9]", "", value.upper())


def load_json(path: Path) -> dict[str, Any]:
    if not path.exists():
        raise FileNotFoundError(path)
    with path.open(encoding="utf-8-sig") as f:
        payload = json.load(f)
    if not isinstance(payload, dict):
        raise ValueError(f"Expected object in {path}")
    return payload


def choose_column(headers: list[str], aliases: list[str]) -> str | None:
    lower_to_original = {h.lower().strip(): h for h in headers}
    for alias in aliases:
        if alias in lower_to_original:
            return lower_to_original[alias]
    return None


def build_vocabulary_indexes(vocab_payload: dict[str, Any]) -> tuple[set[str], set[str]]:
    rows = vocab_payload.get("vocabulary", [])
    exact_glosses: set[str] = set()
    normalized_glosses: set[str] = set()

    for row in rows:
        if not isinstance(row, dict):
            continue
        rep = str(row.get("representative_gloss", "")).strip().upper()
        norm = str(row.get("normalized_gloss", "")).strip().upper()
        if rep:
            exact_glosses.add(rep)
        if norm:
            normalized_glosses.add(norm)
        for variant in row.get("variants", []):
            variant_upper = str(variant).strip().upper()
            if variant_upper:
                exact_glosses.add(variant_upper)
                normalized_glosses.add(normalize_text(variant_upper))

    return exact_glosses, normalized_glosses


def build_label_mapping(
    vocab_payload: dict[str, Any],
    probe_payload: dict[str, Any],
) -> tuple[dict[str, dict[str, Any]], set[str], list[str]]:
    exact_glosses, normalized_glosses = build_vocabulary_indexes(vocab_payload)
    probe_rows = {
        str(row.get("label", "")).upper(): row
        for row in probe_payload.get("probe", [])
        if isinstance(row, dict)
    }

    mapping: dict[str, dict[str, Any]] = {}
    source_glosses_used: set[str] = set()
    variant_labels: list[str] = []

    for label in REDUCED_LABELS:
        label_upper = label.upper()
        label_norm = normalize_text(label_upper)
        probe_row = probe_rows.get(label_upper, {})

        exact_sources: list[str] = []
        if label_upper in exact_glosses:
            exact_sources.append(label_upper)

        normalized_sources: list[str] = []
        if not exact_sources and label_norm in normalized_glosses:
            normalized_sources.append(label_upper)

        variant_sources: list[str] = []
        for candidate in LABEL_VARIANT_GLOSSES.get(label_upper, []):
            c = candidate.upper().strip()
            if not c:
                continue
            if c in exact_glosses or normalize_text(c) in normalized_glosses:
                variant_sources.append(c)

        all_sources = []
        all_sources.extend(exact_sources)
        all_sources.extend([s for s in normalized_sources if s not in all_sources])
        all_sources.extend([s for s in variant_sources if s not in all_sources])

        strategy = "unmapped"
        if exact_sources:
            strategy = "exact"
        elif normalized_sources:
            strategy = "normalized"
        if variant_sources:
            strategy = "exact+variant" if strategy == "exact" else "variant"
            variant_labels.append(label_upper)

        notes: list[str] = []
        if strategy == "unmapped":
            notes.append("No exact/normalized/variant source gloss found in vocabulary.")
        if probe_row:
            notes.append(str(probe_row.get("notes", "")).strip())

        mapping[label_upper] = {
            "label": label_upper,
            "strategy": strategy,
            "source_glosses": all_sources,
            "exact_source_glosses": exact_sources,
            "normalized_source_glosses": normalized_sources,
            "variant_source_glosses": variant_sources,
            "notes": [n for n in notes if n],
        }
        source_glosses_used.update(all_sources)

    return mapping, source_glosses_used, sorted(set(variant_labels))


def load_reduced_samples(
    mapping_by_label: dict[str, dict[str, Any]],
    source_glosses: set[str],
) -> tuple[list[dict[str, Any]], dict[str, int], list[dict[str, str]]]:
    csv_paths = sorted(ASL_SPLITS_DIR.glob("*.csv"))
    if not csv_paths:
        raise FileNotFoundError(f"No split CSV files found under {ASL_SPLITS_DIR}")

    gloss_to_label: dict[str, str] = {}
    for label, config in mapping_by_label.items():
        for gloss in config.get("source_glosses", []):
            if gloss in source_glosses:
                gloss_to_label[gloss] = label

    samples: list[dict[str, Any]] = []
    counts = {label: 0 for label in REDUCED_LABELS}
    unresolved_video_paths: list[dict[str, str]] = []

    for csv_path in csv_paths:
        split_name = csv_path.stem.lower()
        with csv_path.open(encoding="utf-8-sig", newline="") as f:
            reader = csv.DictReader(f)
            headers = reader.fieldnames or []
            gloss_col = choose_column(headers, ["gloss", "label", "word", "sign"])
            video_col = choose_column(headers, ["video file", "video", "filename", "file"])
            signer_col = choose_column(headers, ["participant id", "participant", "signer_id", "signer"])

            if not gloss_col:
                continue

            for row_num, row in enumerate(reader, start=1):
                source_gloss = str(row.get(gloss_col, "")).strip().upper()
                if not source_gloss:
                    continue
                label = gloss_to_label.get(source_gloss)
                if not label:
                    continue

                video_name = str(row.get(video_col, "")).strip() if video_col else ""
                relative_video_path = None
                note_parts = []
                if video_name:
                    maybe_rel = Path("data") / "raw" / "ASL_Citizen" / "videos" / video_name
                    absolute_video = REPO_ROOT / maybe_rel
                    relative_video_path = str(maybe_rel).replace("\\", "/")
                    if not absolute_video.exists():
                        unresolved_video_paths.append(
                            {
                                "split": split_name,
                                "label": label,
                                "source_gloss": source_gloss,
                                "video_path": relative_video_path,
                                "sample_row": str(row_num),
                            }
                        )
                        note_parts.append("video_path_not_found")
                else:
                    note_parts.append("missing_video_filename")

                sample_id = f"asl_citizen::{split_name}::{row_num}::{normalize_text(source_gloss)}"
                signer_id = str(row.get(signer_col, "")).strip() if signer_col else ""
                variant_note = ""
                if source_gloss in set(mapping_by_label[label].get("variant_source_glosses", [])):
                    variant_note = "variant_mapping"
                    note_parts.append(variant_note)

                notes = ",".join(note_parts) if note_parts else ""

                samples.append(
                    {
                        "label": label,
                        "source_dataset": "asl_citizen",
                        "source_gloss": source_gloss,
                        "video_path": relative_video_path,
                        "sample_id": sample_id,
                        "signer_id": signer_id or None,
                        "notes": notes,
                    }
                )
                counts[label] += 1

    return samples, counts, unresolved_video_paths


def export_asl_citizen_reduced_subset() -> tuple[dict[str, Any], dict[str, Any]]:
    vocab_payload = load_json(IN_VOCAB)
    probe_payload = load_json(IN_PROBE)

    mapping_by_label, source_glosses, variant_labels = build_label_mapping(vocab_payload, probe_payload)
    samples, per_label_counts, unresolved_video_paths = load_reduced_samples(mapping_by_label, source_glosses)

    manifest_payload: dict[str, Any] = {
        "generated_at": str(date.today()),
        "source_dataset": "asl_citizen",
        "reduced_labels": list(REDUCED_LABELS),
        "inputs": {
            "vocabulary": str(IN_VOCAB.relative_to(REPO_ROOT)),
            "probe": str(IN_PROBE.relative_to(REPO_ROOT)),
            "asl_root": str(ASL_ROOT.relative_to(REPO_ROOT)),
        },
        "mapping": mapping_by_label,
        "samples": samples,
        "totals": {
            "sample_count": len(samples),
            "label_count": len(REDUCED_LABELS),
            "labels_with_samples": sum(1 for _, count in per_label_counts.items() if count > 0),
        },
        "path_issues": {
            "unresolved_video_paths_count": len(unresolved_video_paths),
            "unresolved_video_paths": unresolved_video_paths,
        },
        "todos": [
            "TODO(split-assignment): Assign train/val/test for ASL Citizen reduced subset with signer-aware stratification.",
            "TODO(landmark-extraction): Run MediaPipe landmark extraction on exported ASL Citizen clips.",
            "TODO(merged-reduced-experiment): Merge ASL Citizen reduced subset with reduced WLASL/custom manifests after validation.",
        ],
    }

    summary_payload: dict[str, Any] = {
        "generated_at": str(date.today()),
        "source_dataset": "asl_citizen",
        "manifest_path": str(OUT_MANIFEST.relative_to(REPO_ROOT)),
        "reduced_labels": list(REDUCED_LABELS),
        "labels_exported": sorted([label for label, n in per_label_counts.items() if n > 0]),
        "clip_counts_per_label": per_label_counts,
        "labels_using_variant_mapping": variant_labels,
        "unresolved_file_path_issues": len(unresolved_video_paths),
        "mapping_overview": {
            label: {
                "strategy": config.get("strategy"),
                "source_glosses": config.get("source_glosses", []),
            }
            for label, config in mapping_by_label.items()
        },
        "notes": [
            "Export is intentionally separate from WLASL. No automatic merge was performed.",
        ],
    }

    OUT_MANIFEST.write_text(json.dumps(manifest_payload, indent=2), encoding="utf-8")
    OUT_SUMMARY.write_text(json.dumps(summary_payload, indent=2), encoding="utf-8")

    return manifest_payload, summary_payload


def main() -> None:
    _, summary = export_asl_citizen_reduced_subset()

    print(f"[ok] ASL reduced manifest -> {OUT_MANIFEST.relative_to(REPO_ROOT)}")
    print(f"[ok] ASL reduced summary  -> {OUT_SUMMARY.relative_to(REPO_ROOT)}")
    print()
    print(f"  Labels exported             : {', '.join(summary['labels_exported'])}")
    print("  Clip counts per label       :")
    for label in REDUCED_LABELS:
        print(f"    {label:<8} {summary['clip_counts_per_label'].get(label, 0)}")
    print(f"  Labels using variant mapping: {', '.join(summary['labels_using_variant_mapping']) or 'None'}")
    print(f"  Unresolved file path issues : {summary['unresolved_file_path_issues']}")


if __name__ == "__main__":
    main()