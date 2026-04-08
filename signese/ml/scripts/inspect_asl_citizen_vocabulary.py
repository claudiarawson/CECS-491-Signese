"""
inspect_asl_citizen_vocabulary.py
--------------------------------
Inspection-only workflow for ASL Citizen vocabulary coverage.

Goal:
  - discover actual gloss vocabulary in data/raw/ASL_Citizen/
  - probe overlap against reduced Signese labels

Outputs:
  - data/processed/asl_citizen_vocabulary.json
  - data/processed/asl_citizen_vocabulary.csv
  - data/processed/asl_citizen_reduced_label_probe.json
"""

from __future__ import annotations

import csv
import difflib
import json
import re
from collections import defaultdict
from datetime import date
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parent.parent.parent
ASL_ROOT = REPO_ROOT / "data" / "raw" / "ASL_Citizen"
PROCESSED_DIR = REPO_ROOT / "data" / "processed"

OUT_VOCAB_JSON = PROCESSED_DIR / "asl_citizen_vocabulary.json"
OUT_VOCAB_CSV = PROCESSED_DIR / "asl_citizen_vocabulary.csv"
OUT_PROBE_JSON = PROCESSED_DIR / "asl_citizen_reduced_label_probe.json"

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

GLOSS_COLUMN_CANDIDATES = [
    "gloss",
    "label",
    "word",
    "sign",
]


def normalize_text(value: str) -> str:
    # Uppercase + remove separators/punctuation for robust matching.
    return re.sub(r"[^A-Z0-9]", "", value.upper())


def tokenize_lexical(value: str) -> list[str]:
    return [token for token in re.split(r"[^A-Z0-9]+", value.upper()) if token]


def discover_metadata_files(root: Path) -> dict[str, list[Path]]:
    discovered: dict[str, list[Path]] = {
        "csv": [],
        "json": [],
        "tsv": [],
        "txt": [],
    }
    if not root.exists():
        return discovered

    for path in root.rglob("*"):
        if not path.is_file():
            continue
        suffix = path.suffix.lower()
        if suffix == ".csv":
            discovered["csv"].append(path)
        elif suffix == ".json":
            discovered["json"].append(path)
        elif suffix == ".tsv":
            discovered["tsv"].append(path)
        elif suffix == ".txt":
            discovered["txt"].append(path)

    for key in discovered:
        discovered[key].sort()
    return discovered


def choose_gloss_column(headers: list[str]) -> str | None:
    lower = {header.lower().strip(): header for header in headers}
    for candidate in GLOSS_COLUMN_CANDIDATES:
        if candidate in lower:
            return lower[candidate]
    return None


def inspect_csv_schema(path: Path) -> dict[str, Any]:
    with path.open(encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        headers = reader.fieldnames or []
        gloss_col = choose_gloss_column(headers)

        preview_rows: list[dict[str, str]] = []
        gloss_samples: list[str] = []
        row_count = 0

        for row in reader:
            row_count += 1
            if len(preview_rows) < 3:
                preview_rows.append({k: str(v) for k, v in row.items() if v is not None})
            if gloss_col:
                raw_gloss = str(row.get(gloss_col, "")).strip()
                if raw_gloss and len(gloss_samples) < 5:
                    gloss_samples.append(raw_gloss)

    return {
        "path": str(path.relative_to(REPO_ROOT)),
        "rows": row_count,
        "headers": headers,
        "detected_gloss_column": gloss_col,
        "gloss_samples": gloss_samples,
        "preview_rows": preview_rows,
    }


def extract_vocabulary_from_csv(path: Path) -> tuple[dict[str, dict[str, Any]], dict[str, Any]]:
    glossary: dict[str, dict[str, Any]] = {}

    with path.open(encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        headers = reader.fieldnames or []
        gloss_col = choose_gloss_column(headers)

        if not gloss_col:
            return glossary, {
                "path": str(path.relative_to(REPO_ROOT)),
                "rows": 0,
                "headers": headers,
                "detected_gloss_column": None,
                "used_for_vocabulary": False,
            }

        row_count = 0
        for row in reader:
            row_count += 1
            gloss = str(row.get(gloss_col, "")).strip()
            if not gloss:
                continue

            normalized = normalize_text(gloss)
            if not normalized:
                continue

            if normalized not in glossary:
                glossary[normalized] = {
                    "normalized_gloss": normalized,
                    "representative_gloss": gloss.upper(),
                    "variants": set(),
                    "count": 0,
                    "files": set(),
                }

            entry = glossary[normalized]
            entry["count"] += 1
            entry["variants"].add(gloss.upper())
            entry["files"].add(str(path.relative_to(REPO_ROOT)))

    return glossary, {
        "path": str(path.relative_to(REPO_ROOT)),
        "rows": row_count,
        "headers": headers,
        "detected_gloss_column": gloss_col,
        "used_for_vocabulary": True,
    }


def merge_vocabulary(chunks: list[dict[str, dict[str, Any]]]) -> list[dict[str, Any]]:
    merged: dict[str, dict[str, Any]] = {}
    for chunk in chunks:
        for normalized, entry in chunk.items():
            if normalized not in merged:
                merged[normalized] = {
                    "normalized_gloss": normalized,
                    "representative_gloss": entry["representative_gloss"],
                    "variants": set(entry["variants"]),
                    "count": int(entry["count"]),
                    "files": set(entry["files"]),
                }
            else:
                merged_entry = merged[normalized]
                merged_entry["variants"].update(entry["variants"])
                merged_entry["files"].update(entry["files"])
                merged_entry["count"] += int(entry["count"])

    rows: list[dict[str, Any]] = []
    for normalized, entry in merged.items():
        rows.append(
            {
                "normalized_gloss": normalized,
                "representative_gloss": entry["representative_gloss"],
                "variants": sorted(entry["variants"]),
                "count": entry["count"],
                "files": sorted(entry["files"]),
            }
        )

    rows.sort(key=lambda item: (-item["count"], item["normalized_gloss"]))
    return rows


def lexical_candidate_matches(label: str, vocabulary_rows: list[dict[str, Any]], limit: int = 8) -> list[str]:
    label_upper = label.upper()
    label_norm = normalize_text(label)
    label_tokens = set(tokenize_lexical(label_upper))

    lexical_hits: list[str] = []
    for row in vocabulary_rows:
        rep = str(row["representative_gloss"]).upper()
        rep_norm = str(row["normalized_gloss"])
        rep_tokens = set(tokenize_lexical(rep))

        if label_upper in rep or rep in label_upper:
            lexical_hits.append(rep)
            continue
        if label_norm and (label_norm in rep_norm or rep_norm in label_norm):
            lexical_hits.append(rep)
            continue
        if label_tokens and rep_tokens and label_tokens.intersection(rep_tokens):
            lexical_hits.append(rep)

    if len(lexical_hits) < limit:
        corpus = [str(row["representative_gloss"]).upper() for row in vocabulary_rows]
        close = difflib.get_close_matches(label_upper, corpus, n=limit, cutoff=0.6)
        lexical_hits.extend(close)

    deduped: list[str] = []
    seen: set[str] = set()
    for item in lexical_hits:
        if item in seen:
            continue
        seen.add(item)
        deduped.append(item)
        if len(deduped) >= limit:
            break
    return deduped


def build_reduced_probe(vocabulary_rows: list[dict[str, Any]]) -> dict[str, Any]:
    by_representative = defaultdict(list)
    by_normalized = defaultdict(list)
    for row in vocabulary_rows:
        by_representative[str(row["representative_gloss"]).upper()].append(row)
        by_normalized[str(row["normalized_gloss"])].append(row)

    probe_rows: list[dict[str, Any]] = []
    for label in REDUCED_LABELS:
        label_upper = label.upper()
        label_norm = normalize_text(label)

        exact_rows = by_representative.get(label_upper, [])
        normalized_rows = by_normalized.get(label_norm, [])

        exact_match_found = len(exact_rows) > 0
        normalized_match_found = len(normalized_rows) > 0

        candidates = lexical_candidate_matches(label, vocabulary_rows)
        if exact_match_found:
            notes = "Direct exact gloss overlap found in ASL Citizen metadata."
        elif normalized_match_found:
            notes = "Normalized overlap found (separator/casing variant)."
        elif candidates:
            notes = "No direct overlap; lexical neighbors exist and should be reviewed manually."
        else:
            notes = "No direct overlap or nearby lexical candidates found."

        probe_rows.append(
            {
                "label": label,
                "exact_match_found": exact_match_found,
                "normalized_match_found": normalized_match_found,
                "candidate_matches": candidates,
                "notes": notes,
            }
        )

    return {
        "generated_at": str(date.today()),
        "reduced_labels": list(REDUCED_LABELS),
        "probe": probe_rows,
        "summary": {
            "exact_overlap_count": sum(1 for row in probe_rows if row["exact_match_found"]),
            "normalized_overlap_count": sum(1 for row in probe_rows if row["normalized_match_found"]),
            "labels_with_candidates": sum(1 for row in probe_rows if len(row["candidate_matches"]) > 0),
        },
    }


def write_vocabulary_csv(vocabulary_rows: list[dict[str, Any]], path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(
            f,
            fieldnames=["representative_gloss", "normalized_gloss", "count", "variants", "files"],
        )
        writer.writeheader()
        for row in vocabulary_rows:
            writer.writerow(
                {
                    "representative_gloss": row["representative_gloss"],
                    "normalized_gloss": row["normalized_gloss"],
                    "count": row["count"],
                    "variants": "|".join(row["variants"]),
                    "files": "|".join(row["files"]),
                }
            )


def inspect_asl_citizen_vocabulary() -> tuple[dict[str, Any], dict[str, Any]]:
    discovered = discover_metadata_files(ASL_ROOT)

    csv_summaries: list[dict[str, Any]] = []
    vocab_chunks: list[dict[str, dict[str, Any]]] = []

    for csv_path in discovered["csv"]:
        schema = inspect_csv_schema(csv_path)
        csv_summaries.append(schema)

        chunk, usage = extract_vocabulary_from_csv(csv_path)
        schema["used_for_vocabulary"] = usage["used_for_vocabulary"]
        if usage["used_for_vocabulary"]:
            vocab_chunks.append(chunk)

    vocabulary_rows = merge_vocabulary(vocab_chunks)
    probe_payload = build_reduced_probe(vocabulary_rows)

    vocab_payload = {
        "generated_at": str(date.today()),
        "dataset_root": str(ASL_ROOT.relative_to(REPO_ROOT)),
        "detected_metadata_files": {
            key: [str(path.relative_to(REPO_ROOT)) for path in paths]
            for key, paths in discovered.items()
        },
        "csv_schema_summary": csv_summaries,
        "vocabulary_size": len(vocabulary_rows),
        "vocabulary": vocabulary_rows,
    }

    OUT_VOCAB_JSON.write_text(json.dumps(vocab_payload, indent=2), encoding="utf-8")
    write_vocabulary_csv(vocabulary_rows, OUT_VOCAB_CSV)
    OUT_PROBE_JSON.write_text(json.dumps(probe_payload, indent=2), encoding="utf-8")

    return vocab_payload, probe_payload


def main() -> None:
    vocab_payload, probe_payload = inspect_asl_citizen_vocabulary()

    print(f"[ok] ASL vocabulary JSON  -> {OUT_VOCAB_JSON.relative_to(REPO_ROOT)}")
    print(f"[ok] ASL vocabulary CSV   -> {OUT_VOCAB_CSV.relative_to(REPO_ROOT)}")
    print(f"[ok] Reduced label probe  -> {OUT_PROBE_JSON.relative_to(REPO_ROOT)}")
    print()
    print(f"  CSV metadata files detected : {len(vocab_payload['detected_metadata_files']['csv'])}")
    print(f"  Vocabulary size             : {vocab_payload['vocabulary_size']}")
    summary = probe_payload["summary"]
    print(f"  Exact overlap count         : {summary['exact_overlap_count']}")
    print(f"  Normalized overlap count    : {summary['normalized_overlap_count']}")


if __name__ == "__main__":
    main()