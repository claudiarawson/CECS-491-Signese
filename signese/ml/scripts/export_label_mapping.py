"""
export_label_mapping.py
-----------------------
Export a deterministic label mapping for the locked first Signese baseline.

Input:
  - data/processed/first_model_subset.json

Output:
  - data/processed/landmarks/label_to_index.json
"""

from __future__ import annotations

import json
import sys
from collections.abc import Sequence
from datetime import date
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parent.parent.parent
PROCESSED_DIR = REPO_ROOT / "data" / "processed"
LANDMARKS_DIR = PROCESSED_DIR / "landmarks"
FIRST_MODEL_SUBSET = PROCESSED_DIR / "first_model_subset.json"
OUTPUT_PATH = LANDMARKS_DIR / "label_to_index.json"


def load_json(path: Path) -> Any:
    if not path.exists():
        sys.exit(f"[error] Missing required input: {path}")
    with path.open(encoding="utf-8-sig") as f:
        return json.load(f)


def load_locked_labels(path: Path = FIRST_MODEL_SUBSET) -> list[str]:
    payload = load_json(path)
    labels = payload.get("labels")
    if not isinstance(labels, Sequence):
        sys.exit(f"[error] Expected 'labels' list in {path}")

    ordered_labels: list[str] = []
    seen: set[str] = set()
    for row in labels:
        if not isinstance(row, dict):
            sys.exit(f"[error] Expected each label row in {path} to be an object")
        label = str(row.get("label", "")).strip()
        if not label:
            sys.exit(f"[error] Found empty label entry in {path}")
        if label in seen:
            sys.exit(f"[error] Duplicate label in locked subset: {label}")
        seen.add(label)
        ordered_labels.append(label)

    if not ordered_labels:
        sys.exit(f"[error] No labels found in {path}")

    return ordered_labels


def build_mapping_payload(labels: list[str]) -> dict[str, Any]:
    label_to_index = {label: index for index, label in enumerate(labels)}
    index_to_label = {str(index): label for index, label in enumerate(labels)}
    return {
        "generated_at": str(date.today()),
        "source": str(FIRST_MODEL_SUBSET.relative_to(REPO_ROOT)),
        "label_count": len(labels),
        "labels": labels,
        "label_to_index": label_to_index,
        "index_to_label": index_to_label,
    }


def export_label_mapping(output_path: Path = OUTPUT_PATH) -> dict[str, Any]:
    labels = load_locked_labels()
    payload = build_mapping_payload(labels)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    return payload


def main() -> None:
    payload = export_label_mapping()
    print(f"[ok] Label mapping -> {OUTPUT_PATH.relative_to(REPO_ROOT)}")
    print(f"  Labels exported: {payload['label_count']}")
    for label, index in payload["label_to_index"].items():
        print(f"    {index:>2} -> {label}")


if __name__ == "__main__":
    main()