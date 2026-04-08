"""Dataset utilities for the first Signese landmark baseline."""

from __future__ import annotations

import json
import warnings
from collections.abc import Sequence
from pathlib import Path
from typing import Any

import numpy as np
import torch
from torch.utils.data import DataLoader, Dataset


REPO_ROOT = Path(__file__).resolve().parent.parent.parent
PROCESSED_DIR = REPO_ROOT / "data" / "processed"
LANDMARKS_DIR = PROCESSED_DIR / "landmarks"
DEFAULT_LABEL_MAPPING_PATH = LANDMARKS_DIR / "label_to_index.json"
DEFAULT_SPLITS = {
    "train": PROCESSED_DIR / "first_model_train.json",
    "val": PROCESSED_DIR / "first_model_val.json",
    "test": PROCESSED_DIR / "first_model_test.json",
}
EXPECTED_FEATURE_SHAPE = (32, 258)


def load_json(path: Path) -> Any:
    with path.open(encoding="utf-8-sig") as f:
        return json.load(f)


def sanitize_label(label: str) -> str:
    return "".join(ch if ch.isalnum() else "_" for ch in label.upper())


def make_feature_path(split: str, label: str, sample_id: str) -> Path:
    safe_sample_id = sample_id.replace(":", "__").replace("/", "_").replace("\\", "_")
    return LANDMARKS_DIR / "features" / split / sanitize_label(label) / f"{safe_sample_id}.npy"


def resolve_feature_path(row: dict[str, Any], split: str, label: str, sample_id: str) -> Path:
    """Resolve feature path from manifest row with backward-compatible fallback.

    Preferred order:
      1) explicit row['feature_path']
      2) dataset-aware legacy reconstruction for ASL Citizen namespace
      3) original legacy reconstruction (WLASL/default)
    """
    explicit = row.get("feature_path")
    if explicit:
        explicit_path = Path(str(explicit))
        if not explicit_path.is_absolute():
            return REPO_ROOT / explicit_path
        return explicit_path

    source_dataset = str(row.get("source_dataset", "")).strip().lower()
    safe_sample_id = sample_id.replace(":", "__").replace("/", "_").replace("\\", "_")
    if source_dataset == "asl_citizen":
        return LANDMARKS_DIR / "features" / "asl_citizen" / split / sanitize_label(label) / f"{safe_sample_id}.npy"
    if source_dataset == "custom":
        return LANDMARKS_DIR / "features" / "custom" / split / sanitize_label(label) / f"{safe_sample_id}.npy"

    return make_feature_path(split=split, label=label, sample_id=sample_id)


def load_label_mapping(path: Path = DEFAULT_LABEL_MAPPING_PATH) -> dict[str, Any]:
    payload = load_json(path)
    label_to_index = payload.get("label_to_index")
    index_to_label = payload.get("index_to_label")
    labels = payload.get("labels")
    if not isinstance(label_to_index, dict) or not isinstance(index_to_label, dict) or not isinstance(labels, Sequence):
        raise ValueError(f"Invalid label mapping payload: {path}")
    return payload


def collate_landmark_batch(batch: list[dict[str, Any]]) -> dict[str, Any]:
    features = torch.stack([item["features"] for item in batch], dim=0)
    targets = torch.tensor([item["target"] for item in batch], dtype=torch.long)
    metadata = [item["metadata"] for item in batch]
    return {"features": features, "target": targets, "metadata": metadata}


class LandmarkSequenceDataset(Dataset[dict[str, Any]]):
    def __init__(
        self,
        split_manifest_path: Path,
        label_mapping_path: Path = DEFAULT_LABEL_MAPPING_PATH,
        expected_feature_shape: tuple[int, int] = EXPECTED_FEATURE_SHAPE,
        warn_missing: bool = True,
    ) -> None:
        self.split_manifest_path = split_manifest_path
        self.label_mapping_path = label_mapping_path
        self.expected_feature_shape = expected_feature_shape
        self.warn_missing = warn_missing

        mapping_payload = load_label_mapping(label_mapping_path)
        self.label_to_index: dict[str, int] = {
            str(label): int(index) for label, index in mapping_payload["label_to_index"].items()
        }
        self.index_to_label: dict[int, str] = {
            int(index): str(label) for index, label in mapping_payload["index_to_label"].items()
        }

        rows = load_json(split_manifest_path)
        if not isinstance(rows, list):
            raise ValueError(f"Expected list in split manifest: {split_manifest_path}")

        self.records: list[dict[str, Any]] = []
        self.missing_feature_count = 0
        self.invalid_shape_count = 0
        missing_examples: list[str] = []
        invalid_shape_examples: list[str] = []

        for row in rows:
            label = str(row.get("label", "")).strip()
            sample_id = str(row.get("sample_id", "")).strip()
            split = str(row.get("split", "")).strip()

            if not label or not sample_id or not split:
                if warn_missing:
                    warnings.warn(
                        f"Skipping malformed split row in {split_manifest_path.name}: label={label!r}, sample_id={sample_id!r}, split={split!r}",
                        stacklevel=2,
                    )
                continue

            if label not in self.label_to_index:
                if warn_missing:
                    warnings.warn(
                        f"Skipping row with unknown label {label!r} in {split_manifest_path.name}",
                        stacklevel=2,
                    )
                continue

            feature_path = resolve_feature_path(row=row, split=split, label=label, sample_id=sample_id)
            if not feature_path.exists():
                self.missing_feature_count += 1
                if len(missing_examples) < 3:
                    try:
                        display_path = str(feature_path.relative_to(REPO_ROOT))
                    except ValueError:
                        display_path = str(feature_path)
                    missing_examples.append(f"{sample_id} -> {display_path}")
                continue

            try:
                feature_shape = tuple(np.load(feature_path, mmap_mode="r").shape)
            except Exception as exc:  # noqa: BLE001 - keep dataset construction tolerant.
                self.invalid_shape_count += 1
                if len(invalid_shape_examples) < 3:
                    invalid_shape_examples.append(f"{sample_id} -> unreadable ({exc})")
                continue

            if feature_shape != expected_feature_shape:
                self.invalid_shape_count += 1
                if len(invalid_shape_examples) < 3:
                    invalid_shape_examples.append(
                        f"{sample_id} -> shape {feature_shape}, expected {expected_feature_shape}"
                    )
                continue

            self.records.append(
                {
                    "feature_path": feature_path,
                    "target": self.label_to_index[label],
                    "metadata": {
                        "label": label,
                        "sample_id": sample_id,
                        "split": split,
                        "source_dataset": row.get("source_dataset"),
                        "source_gloss": row.get("source_gloss"),
                    },
                }
            )

        if warn_missing and self.missing_feature_count:
            examples = "; ".join(missing_examples)
            warnings.warn(
                f"Skipped {self.missing_feature_count} rows without extracted features from {split_manifest_path.name}. "
                f"Examples: {examples}",
                stacklevel=2,
            )

        if warn_missing and self.invalid_shape_count:
            examples = "; ".join(invalid_shape_examples)
            warnings.warn(
                f"Skipped {self.invalid_shape_count} rows with unreadable or invalid feature shapes from {split_manifest_path.name}. "
                f"Examples: {examples}",
                stacklevel=2,
            )

    def __len__(self) -> int:
        return len(self.records)

    def __getitem__(self, index: int) -> dict[str, Any]:
        record = self.records[index]
        array = np.load(record["feature_path"]).astype(np.float32)
        if tuple(array.shape) != self.expected_feature_shape:
            raise ValueError(
                f"Unexpected feature shape in {record['feature_path']}: {tuple(array.shape)}; expected {self.expected_feature_shape}"
            )
        return {
            "features": torch.from_numpy(array),
            "target": int(record["target"]),
            "metadata": dict(record["metadata"]),
        }


def create_dataloader(
    dataset: LandmarkSequenceDataset,
    batch_size: int,
    shuffle: bool,
    num_workers: int = 0,
) -> DataLoader[dict[str, Any]]:
    return DataLoader(
        dataset,
        batch_size=batch_size,
        shuffle=shuffle,
        num_workers=num_workers,
        collate_fn=collate_landmark_batch,
    )