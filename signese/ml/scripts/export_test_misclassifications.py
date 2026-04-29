"""
export_test_misclassifications.py
----------------------------------
Runs the trained model over the configured test manifest, then exports a JSON
report of misclassified samples.

This is meant to answer: "Which exact samples are hurting test accuracy,
and which true-label -> predicted-label confusions dominate?"
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import numpy as np
import torch

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from ml.training.dataset import LandmarkSequenceDataset, create_dataloader
from ml.scripts.train_first_model import load_model_from_checkpoint


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8-sig"))


def parse_signer_id(sample_id: str) -> int | None:
    # Typical format in this repo: "<dataset>:<GLOSS>:<video_id>:<signer_id>"
    # Example: "wlasl:MEET:35513:5"
    parts = [p for p in str(sample_id).split(":") if p != ""]
    if not parts:
        return None
    last = parts[-1]
    if re.fullmatch(r"\d+", last):
        return int(last)
    return None


@dataclass
class Misclassification:
    true_label: str
    predicted_label: str
    sample_id: str
    signer_id: int | None
    source_dataset: str | None
    source_gloss: str | None
    feature_path: str | None
    topk: list[dict[str, Any]]
    correct: bool = False


def main() -> None:
    parser = argparse.ArgumentParser(description="Export test-set misclassifications")
    parser.add_argument(
        "--checkpoint",
        type=Path,
        default=Path("data/processed/models/first_signese_baseline/best_val_checkpoint.pt"),
        help="Path to model checkpoint .pt",
    )
    parser.add_argument(
        "--label-mapping",
        type=Path,
        default=Path("data/processed/reduced_label_to_index.json"),
        help="Path to reduced_label_to_index.json",
    )
    parser.add_argument(
        "--test-manifest",
        type=Path,
        default=Path("data/processed/reduced_merged_test.json"),
        help="Path to reduced_merged_test.json",
    )
    parser.add_argument("--top-k", type=int, default=5, help="Top-k probabilities to store per sample.")
    parser.add_argument(
        "--batch-size",
        type=int,
        default=16,
        help="Batch size for speed (features still loaded from .npy).",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("data/processed/models/first_signese_baseline/test_misclassifications.json"),
        help="Output JSON path.",
    )
    parser.add_argument(
        "--export-pair-manifests-dir",
        type=Path,
        default=Path("data/processed/models/first_signese_baseline/hard_example_manifests"),
        help="If provided, write filtered manifests for the top confusion pairs.",
    )
    parser.add_argument(
        "--min-pair-count",
        type=int,
        default=3,
        help="Only write pair-manifest files when true->pred count >= this threshold.",
    )
    args = parser.parse_args()

    # This repo stores all ML artifacts under `signese/data/...`.
    # So we treat the `signese/` directory as the "root" for relative artifact paths.
    repo_root = Path(__file__).resolve().parent.parent.parent
    checkpoint_path = (repo_root / args.checkpoint).resolve() if not args.checkpoint.is_absolute() else args.checkpoint
    label_mapping_path = (repo_root / args.label_mapping).resolve() if not args.label_mapping.is_absolute() else args.label_mapping
    test_manifest_path = (repo_root / args.test_manifest).resolve() if not args.test_manifest.is_absolute() else args.test_manifest
    output_path = (repo_root / args.output).resolve() if not args.output.is_absolute() else args.output
    export_dir = (repo_root / args.export_pair_manifests_dir).resolve() if not args.export_pair_manifests_dir.is_absolute() else args.export_pair_manifests_dir

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    checkpoint = torch.load(checkpoint_path, map_location=device)
    labels = load_json(label_mapping_path).get("labels")
    if not isinstance(labels, list) or not labels:
        raise ValueError(f"label mapping missing valid 'labels' list: {label_mapping_path}")

    model, _ = load_model_from_checkpoint(
        checkpoint_path,
        labels=[str(l) for l in labels],
        device=device,
    )
    model.eval()

    dataset = LandmarkSequenceDataset(
        split_manifest_path=test_manifest_path,
        label_mapping_path=label_mapping_path,
        warn_missing=True,
        normalize_per_sequence=False,
    )

    # Build lookup from original manifest rows so we can export filtered manifests.
    raw_rows = load_json(test_manifest_path)
    if not isinstance(raw_rows, list):
        raise ValueError(f"Expected list manifest at {test_manifest_path}")
    row_lookup: dict[tuple[str, str], dict[str, Any]] = {}
    for r in raw_rows:
        lab = str(r.get("label", "")).strip()
        sid = str(r.get("sample_id", "")).strip()
        if lab and sid:
            row_lookup[(lab, sid)] = dict(r)

    loader = create_dataloader(dataset, batch_size=int(args.batch_size), shuffle=False, num_workers=0)

    total = 0
    correct = 0
    confusion: dict[tuple[str, str], int] = {}
    misclassified: list[Misclassification] = []

    with torch.no_grad():
        for batch_idx, batch in enumerate(loader):
            features = batch["features"].to(device)
            target = batch["target"].to(device)
            logits = model(features)
            probs = torch.softmax(logits, dim=1)
            predictions = probs.argmax(dim=1)

            target_list = target.cpu().tolist()
            pred_list = predictions.cpu().tolist()

            # batch["metadata"] is in the same order as batch items.
            for i, (true_idx, pred_idx) in enumerate(zip(target_list, pred_list)):
                true_label = str(labels[int(true_idx)])
                pred_label = str(labels[int(pred_idx)])
                md = batch["metadata"][i]
                sample_id = str(md.get("sample_id", ""))
                source_dataset = md.get("source_dataset")
                source_gloss = md.get("source_gloss")

                feature_path = None
                # dataset.__getitem__ doesn't return feature_path, so we reconstruct via dataset.records.
                # The dataloader preserves order and uses sequential indices when shuffle=False.
                dataset_index = batch_idx * int(args.batch_size) + i
                if 0 <= dataset_index < len(dataset.records):
                    feature_path = dataset.records[dataset_index].get("feature_path")

                total += 1
                is_correct = true_idx == pred_idx
                correct += int(is_correct)
                confusion[(true_label, pred_label)] = confusion.get((true_label, pred_label), 0) + 1

                if not is_correct:
                    signer_id = parse_signer_id(sample_id)
                    topk_idx = probs[i].topk(int(args.top_k)).indices.cpu().tolist()
                    topk_probs = probs[i].topk(int(args.top_k)).values.cpu().tolist()
                    topk = [
                        {"label": str(labels[int(k)]), "score": float(p)}
                        for k, p in zip(topk_idx, topk_probs)
                    ]
                    misclassified.append(
                        Misclassification(
                            true_label=true_label,
                            predicted_label=pred_label,
                            sample_id=sample_id,
                            signer_id=signer_id,
                            source_dataset=source_dataset,
                            source_gloss=source_gloss,
                            feature_path=str(feature_path) if feature_path else None,
                            topk=topk,
                            correct=False,
                        )
                    )

    # Compute top confusion pairs (true != pred).
    pair_counts = [
        {"true_label": t, "predicted_label": p, "count": c}
        for (t, p), c in confusion.items()
        if t != p and c > 0
    ]
    pair_counts.sort(key=lambda x: x["count"], reverse=True)
    top_pairs = pair_counts[:20]

    export_dir.mkdir(parents=True, exist_ok=True)

    pair_files: list[dict[str, Any]] = []
    for pair in top_pairs:
        if int(pair["count"]) < int(args.min_pair_count):
            continue
        t = str(pair["true_label"])
        p = str(pair["predicted_label"])
        # Filter raw manifest rows for misclassified samples matching this pair.
        mis_ids = {m.sample_id for m in misclassified if m.true_label == t and m.predicted_label == p}
        filtered = [r for r in raw_rows if str(r.get("label", "")).strip() == t and str(r.get("sample_id", "")).strip() in mis_ids]
        out_file = export_dir / f"hard_{t}_as_{p}.json"
        out_file.write_text(json.dumps(filtered, indent=2), encoding="utf-8")
        pair_files.append({"true_label": t, "predicted_label": p, "count": pair["count"], "path": str(out_file.relative_to(repo_root))})

    overall_acc = correct / total if total else 0.0
    report = {
        "checkpoint": str(checkpoint_path),
        "test_manifest": str(test_manifest_path),
        "label_mapping": str(label_mapping_path),
        "labels": [str(l) for l in labels],
        "num_test_samples": total,
        "num_correct": correct,
        "accuracy": overall_acc,
        "top_confusion_pairs": top_pairs,
        "min_pair_count": int(args.min_pair_count),
        "misclassifications": [m.__dict__ for m in misclassified],
        "hard_example_pair_manifests": pair_files,
    }

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(report, indent=2), encoding="utf-8")

    # Print short terminal summary.
    print(f"[ok] Test accuracy (recomputed): {overall_acc:.4f} ({correct}/{total})")
    print("[ok] Top confusion pairs (true -> predicted):")
    for pair in top_pairs[:10]:
        print(f"  - {pair['true_label']} -> {pair['predicted_label']}: {pair['count']}")
    print(f"[ok] Wrote report: {output_path.relative_to(repo_root)}")
    if pair_files:
        print(f"[ok] Wrote pair manifests to: {export_dir.relative_to(repo_root)}")


if __name__ == "__main__":
    main()

