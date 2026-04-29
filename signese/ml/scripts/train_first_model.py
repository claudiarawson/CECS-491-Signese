"""
train_first_model.py
-------------------
Train the first Signese isolated-sign baseline on extracted landmark sequences.
"""

from __future__ import annotations

import json
import random
import sys
import argparse
from dataclasses import dataclass
from datetime import date
from pathlib import Path
from typing import Any

import numpy as np
import torch
from torch import nn
from torch.utils.data import DataLoader, WeightedRandomSampler


REPO_ROOT = Path(__file__).resolve().parent.parent.parent
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from ml.scripts.export_label_mapping import export_label_mapping
from ml.scripts.export_feature_available_splits import export_feature_available_splits
from ml.scripts.export_reduced_subset_experiment import export_reduced_subset_experiment
from ml.training.dataset import (
    DEFAULT_SPLITS,
    LandmarkSequenceDataset,
    collate_landmark_batch,
    create_dataloader,
)


SEED = 7
BATCH_SIZE = 16
NUM_WORKERS = 0
NUM_EPOCHS = 30
LEARNING_RATE = 1e-3
WEIGHT_DECAY = 1e-4
HIDDEN_SIZE = 128
NUM_LAYERS = 1
DROPOUT = 0.2
GRAD_CLIP_NORM = 1.0
USE_FEATURES_ONLY_SPLITS_DEFAULT = True
USE_CLASS_WEIGHTED_LOSS = True

# TODO(augmentation): Add feature-space and sequence-level augmentation once the baseline is stable.
# TODO(masking): Support variable-length masking instead of assuming all sequences are fixed at 32 frames.
# TODO(models): Compare GRU against LSTM, temporal CNNs, and lightweight transformer baselines.
# TODO(subset-experiments): Try smaller, cleaner subsets to reduce label noise and check overfitting behavior.
# TODO(models-bidirectional): Evaluate bidirectional GRU/LSTM once baseline metrics stabilize.
# TODO(normalization): Compare current normalization against stronger landmark normalization schemes.
# TODO(data-sources): Expand with additional data sources and curated custom recordings.

PROCESSED_DIR = REPO_ROOT / "data" / "processed"
LANDMARKS_DIR = PROCESSED_DIR / "landmarks"
LABEL_MAPPING_PATH = LANDMARKS_DIR / "label_to_index.json"
FEATURE_ONLY_SPLITS = {
    "train": PROCESSED_DIR / "first_model_train_features_only.json",
    "val": PROCESSED_DIR / "first_model_val_features_only.json",
    "test": PROCESSED_DIR / "first_model_test_features_only.json",
}
MODEL_DIR = PROCESSED_DIR / "models" / "first_signese_baseline"
CHECKPOINT_PATH = MODEL_DIR / "model_checkpoint.pt"
HISTORY_PATH = MODEL_DIR / "training_history.json"
EVALUATION_PATH = MODEL_DIR / "evaluation_summary.json"
CONFUSION_MATRIX_PATH = MODEL_DIR / "confusion_matrix.json"
BEST_CHECKPOINT_PATH = MODEL_DIR / "best_val_checkpoint.pt"
LAST_CHECKPOINT_PATH = MODEL_DIR / "last_checkpoint.pt"


def set_seed(seed: int) -> None:
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)
    torch.backends.cudnn.deterministic = True
    torch.backends.cudnn.benchmark = False


@dataclass
class Metrics:
    loss: float
    accuracy: float
    per_label_accuracy: dict[str, float]
    per_label_support: dict[str, int]
    predicted_label_distribution: dict[str, int]
    confusion_matrix: list[list[int]]
    total_samples: int


class LandmarkGRUClassifier(nn.Module):
    def __init__(
        self,
        input_size: int,
        hidden_size: int,
        num_layers: int,
        num_classes: int,
        dropout: float,
        bidirectional: bool = False,
    ) -> None:
        super().__init__()
        self.bidirectional = bidirectional
        self.encoder = nn.GRU(
            input_size=input_size,
            hidden_size=hidden_size,
            num_layers=num_layers,
            batch_first=True,
            dropout=dropout if num_layers > 1 else 0.0,
            bidirectional=bidirectional,
        )
        self.dropout = nn.Dropout(dropout)
        direction_width = hidden_size * (2 if bidirectional else 1)
        self.head = nn.Linear(direction_width, num_classes)

    def forward(self, features: torch.Tensor) -> torch.Tensor:
        _, hidden = self.encoder(features)
        if self.bidirectional:
            last_hidden = torch.cat([hidden[-2], hidden[-1]], dim=1)
        else:
            last_hidden = hidden[-1]
        return self.head(self.dropout(last_hidden))


class FocalLoss(nn.Module):
    """
    Simple multi-class focal loss.

    Uses the standard form:
      FL = alpha_t * (1 - pt)^gamma * CE
    where pt is the predicted probability for the true class.
    """

    def __init__(self, *, gamma: float = 2.0, alpha: torch.Tensor | None = None) -> None:
        super().__init__()
        self.gamma = float(gamma)
        self.alpha = alpha

    def forward(self, logits: torch.Tensor, target: torch.Tensor) -> torch.Tensor:
        ce = nn.functional.cross_entropy(logits, target, reduction="none", weight=self.alpha)
        pt = torch.exp(-ce)  # pt = exp(-CE) for CE defined as -log(pt)
        loss = (1.0 - pt) ** self.gamma * ce
        return loss.mean()


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Train first Signese GRU baseline")
    parser.add_argument(
        "--epochs",
        type=int,
        default=NUM_EPOCHS,
        help="Number of training epochs.",
    )
    parser.add_argument("--learning-rate", type=float, default=LEARNING_RATE, help="Optimizer learning rate.")
    parser.add_argument("--weight-decay", type=float, default=WEIGHT_DECAY, help="Adam weight decay.")
    parser.add_argument("--hidden-size", type=int, default=HIDDEN_SIZE, help="GRU hidden size.")
    parser.add_argument("--num-layers", type=int, default=NUM_LAYERS, help="Number of GRU layers.")
    parser.add_argument("--dropout", type=float, default=DROPOUT, help="GRU/dropout head rate.")
    parser.add_argument(
        "--bidirectional",
        action="store_true",
        help="Use a bidirectional GRU encoder.",
    )
    parser.add_argument(
        "--normalize-per-sequence",
        action="store_true",
        help="Z-normalize each sequence using only non-zero frames.",
    )
    parser.add_argument(
        "--scheduler",
        choices=["none", "plateau"],
        default="none",
        help="Optional learning-rate scheduler.",
    )
    parser.add_argument(
        "--scheduler-patience",
        type=int,
        default=3,
        help="Epochs without val improvement before scheduler steps.",
    )
    parser.add_argument(
        "--scheduler-factor",
        type=float,
        default=0.5,
        help="Multiplicative LR factor for scheduler.",
    )
    parser.add_argument(
        "--label-smoothing",
        type=float,
        default=0.0,
        help="Label smoothing factor for cross entropy (0 disables).",
    )
    parser.add_argument(
        "--loss",
        choices=["ce", "focal"],
        default="ce",
        help="Training loss function.",
    )
    parser.add_argument(
        "--focal-gamma",
        type=float,
        default=2.0,
        help="Gamma parameter for focal loss.",
    )
    parser.add_argument(
        "--balanced-sampler",
        action="store_true",
        help="Use a class-balanced sampler for the training DataLoader.",
    )
    parser.add_argument(
        "--augment",
        action="store_true",
        help="Enable simple feature-space and temporal augmentation for training.",
    )
    parser.add_argument("--augment-noise-std", type=float, default=0.0, help="Gaussian noise stddev added to features.")
    parser.add_argument("--augment-time-shift-max", type=int, default=0, help="Max temporal shift in frames (pad with zeros).")
    parser.add_argument("--augment-time-mask-prob", type=float, default=0.0, help="Probability of masking a contiguous time span.")
    parser.add_argument("--augment-time-mask-max-frames", type=int, default=0, help="Maximum masked frames when time masking.")
    parser.add_argument("--augment-feature-dropout-prob", type=float, default=0.0, help="Elementwise feature dropout probability.")
    parser.add_argument(
        "--use-features-only-splits",
        action="store_true",
        help="Use the prefiltered *features_only* split manifests.",
    )
    parser.add_argument(
        "--use-original-splits",
        action="store_true",
        help="Use original split manifests even if features-only mode is enabled by default.",
    )
    parser.add_argument(
        "--disable-weighted-loss",
        action="store_true",
        help="Disable class-weighted cross entropy.",
    )
    parser.add_argument(
        "--reduced-subset",
        action="store_true",
        help="Train on the reduced 8-label experiment manifests.",
    )
    parser.add_argument(
        "--merged-reduced-subset",
        action="store_true",
        help="Train on merged reduced 8-label manifests (WLASL + ASL Citizen).",
    )
    parser.add_argument(
        "--early-stopping-patience",
        type=int,
        default=0,
        help="Stop early after N epochs without validation improvement. 0 disables early stopping.",
    )
    parser.add_argument(
        "--eval-checkpoint",
        choices=["best", "last"],
        default="best",
        help="Checkpoint used for final evaluation metrics.",
    )
    return parser.parse_args()


def resolve_split_paths(args: argparse.Namespace) -> tuple[dict[str, Path], bool, Path]:
    if args.reduced_subset and args.merged_reduced_subset:
        raise SystemExit("[error] --reduced-subset and --merged-reduced-subset cannot be used together.")

    if args.merged_reduced_subset:
        merged_split_paths = {
            "train": PROCESSED_DIR / "reduced_merged_train.json",
            "val": PROCESSED_DIR / "reduced_merged_val.json",
            "test": PROCESSED_DIR / "reduced_merged_test.json",
        }
        return merged_split_paths, True, PROCESSED_DIR / "reduced_label_to_index.json"

    if args.reduced_subset:
        export_reduced_subset_experiment()
        reduced_split_paths = {
            "train": PROCESSED_DIR / "reduced_train.json",
            "val": PROCESSED_DIR / "reduced_val.json",
            "test": PROCESSED_DIR / "reduced_test.json",
        }
        return reduced_split_paths, True, PROCESSED_DIR / "reduced_label_to_index.json"

    use_features_only = USE_FEATURES_ONLY_SPLITS_DEFAULT
    if args.use_features_only_splits:
        use_features_only = True
    if args.use_original_splits:
        use_features_only = False

    if use_features_only:
        export_feature_available_splits()
        return FEATURE_ONLY_SPLITS, True, LABEL_MAPPING_PATH

    return DEFAULT_SPLITS, False, LABEL_MAPPING_PATH


def build_datasets(split_paths: dict[str, Path], label_mapping_path: Path) -> tuple[dict[str, LandmarkSequenceDataset], list[str]]:
    if label_mapping_path == LABEL_MAPPING_PATH:
        mapping_payload = export_label_mapping(LABEL_MAPPING_PATH)
    else:
        with label_mapping_path.open(encoding="utf-8-sig") as f:
            mapping_payload = json.load(f)

    labels = [str(label) for label in mapping_payload["labels"]]
    datasets = {split: LandmarkSequenceDataset(path, label_mapping_path=label_mapping_path) for split, path in split_paths.items()}
    return datasets, labels


def apply_training_augmentations(
    datasets: dict[str, LandmarkSequenceDataset],
    args: argparse.Namespace,
) -> None:
    for dataset in datasets.values():
        dataset.normalize_per_sequence = bool(getattr(args, "normalize_per_sequence", False))
    train = datasets.get("train")
    if not train:
        return
    if not getattr(args, "augment", False):
        return
    train.augment = True
    train.noise_std = float(getattr(args, "augment_noise_std", 0.0))
    train.time_shift_max = max(0, int(getattr(args, "augment_time_shift_max", 0)))
    train.time_mask_prob = float(getattr(args, "augment_time_mask_prob", 0.0))
    train.time_mask_max_frames = max(0, int(getattr(args, "augment_time_mask_max_frames", 0)))
    train.feature_dropout_prob = float(getattr(args, "augment_feature_dropout_prob", 0.0))


def create_train_dataloader(
    dataset: LandmarkSequenceDataset,
    *,
    balanced_sampler: bool,
) -> Any:
    if not balanced_sampler:
        return create_dataloader(dataset, batch_size=BATCH_SIZE, shuffle=True, num_workers=NUM_WORKERS)

    targets = np.asarray([int(record["target"]) for record in dataset.records], dtype=np.int64)
    if targets.size == 0:
        return create_dataloader(dataset, batch_size=BATCH_SIZE, shuffle=True, num_workers=NUM_WORKERS)
    counts = np.bincount(targets)
    counts = np.maximum(counts, 1)
    weights = torch.tensor([1.0 / float(counts[t]) for t in targets.tolist()], dtype=torch.double)
    sampler = WeightedRandomSampler(weights, num_samples=len(weights), replacement=True)
    return DataLoader(
        dataset,
        batch_size=BATCH_SIZE,
        sampler=sampler,
        shuffle=False,
        num_workers=NUM_WORKERS,
        collate_fn=collate_landmark_batch,
    )


def compute_class_weights(dataset: LandmarkSequenceDataset, labels: list[str], device: torch.device) -> torch.Tensor:
    counts = torch.zeros(len(labels), dtype=torch.float32)
    for row in dataset.records:
        counts[int(row["target"])] += 1.0

    # Inverse-frequency weights normalized so average weight is 1.0.
    weights = torch.zeros_like(counts)
    nonzero = counts > 0
    weights[nonzero] = counts[nonzero].sum() / (counts[nonzero] * nonzero.sum())
    weights[~nonzero] = 0.0
    return weights.to(device)


def accuracy_from_counts(correct: int, total: int) -> float:
    if total <= 0:
        return 0.0
    return correct / total


def run_epoch(
    model: nn.Module,
    dataloader: Any,
    criterion: nn.Module,
    device: torch.device,
    optimizer: torch.optim.Optimizer | None = None,
) -> tuple[float, float]:
    training = optimizer is not None
    model.train(training)

    total_loss = 0.0
    total_correct = 0
    total_samples = 0

    for batch in dataloader:
        features = batch["features"].to(device)
        target = batch["target"].to(device)

        if training:
            optimizer.zero_grad(set_to_none=True)

        logits = model(features)
        loss = criterion(logits, target)

        if training:
            loss.backward()
            nn.utils.clip_grad_norm_(model.parameters(), GRAD_CLIP_NORM)
            optimizer.step()

        predictions = logits.argmax(dim=1)
        total_loss += loss.item() * target.size(0)
        total_correct += int((predictions == target).sum().item())
        total_samples += int(target.size(0))

    if total_samples == 0:
        return 0.0, 0.0

    return total_loss / total_samples, accuracy_from_counts(total_correct, total_samples)


@torch.no_grad()
def evaluate_model(
    model: nn.Module,
    dataloader: Any,
    criterion: nn.Module,
    device: torch.device,
    labels: list[str],
) -> Metrics:
    model.eval()

    total_loss = 0.0
    total_samples = 0
    total_correct = 0
    label_correct = {label: 0 for label in labels}
    label_total = {label: 0 for label in labels}
    predicted_label_counts = {label: 0 for label in labels}
    confusion = np.zeros((len(labels), len(labels)), dtype=np.int64)

    for batch in dataloader:
        features = batch["features"].to(device)
        target = batch["target"].to(device)

        logits = model(features)
        loss = criterion(logits, target)
        predictions = logits.argmax(dim=1)

        total_loss += loss.item() * target.size(0)
        total_correct += int((predictions == target).sum().item())
        total_samples += int(target.size(0))

        target_list = target.cpu().tolist()
        prediction_list = predictions.cpu().tolist()
        for true_index, predicted_index in zip(target_list, prediction_list):
            true_label = labels[true_index]
            predicted_label = labels[predicted_index]
            label_total[true_label] += 1
            if true_index == predicted_index:
                label_correct[true_label] += 1
            predicted_label_counts[predicted_label] += 1
            confusion[true_index, predicted_index] += 1

    average_loss = total_loss / total_samples if total_samples else 0.0
    per_label_accuracy = {
        label: accuracy_from_counts(label_correct[label], label_total[label])
        for label in labels
        if label_total[label] > 0
    }
    return Metrics(
        loss=average_loss,
        accuracy=accuracy_from_counts(total_correct, total_samples),
        per_label_accuracy=per_label_accuracy,
        per_label_support={label: count for label, count in label_total.items() if count > 0},
        predicted_label_distribution={label: count for label, count in predicted_label_counts.items() if count > 0},
        confusion_matrix=confusion.tolist(),
        total_samples=total_samples,
    )


def metrics_to_dict(metrics: Metrics) -> dict[str, Any]:
    return {
        "loss": metrics.loss,
        "accuracy": metrics.accuracy,
        "total_samples": metrics.total_samples,
        "per_label_support": metrics.per_label_support,
        "per_label_accuracy": metrics.per_label_accuracy,
        "predicted_label_distribution": metrics.predicted_label_distribution,
    }


def build_model_from_config(
    *,
    input_size: int,
    hidden_size: int,
    num_layers: int,
    num_classes: int,
    dropout: float,
    bidirectional: bool,
    device: torch.device,
) -> LandmarkGRUClassifier:
    return LandmarkGRUClassifier(
        input_size=input_size,
        hidden_size=hidden_size,
        num_layers=num_layers,
        num_classes=num_classes,
        dropout=dropout,
        bidirectional=bidirectional,
    ).to(device)


def load_model_from_checkpoint(
    checkpoint_path: Path,
    *,
    labels: list[str],
    device: torch.device,
) -> tuple[LandmarkGRUClassifier, dict[str, Any]]:
    checkpoint = torch.load(checkpoint_path, map_location=device)
    model_meta = checkpoint.get("model", {})
    hyperparameters = checkpoint.get("hyperparameters", {})
    model = build_model_from_config(
        input_size=int(model_meta.get("input_size", 258)),
        hidden_size=int(hyperparameters.get("hidden_size", HIDDEN_SIZE)),
        num_layers=int(hyperparameters.get("num_layers", NUM_LAYERS)),
        num_classes=len(labels),
        dropout=float(hyperparameters.get("dropout", DROPOUT)),
        bidirectional=bool(model_meta.get("bidirectional", hyperparameters.get("bidirectional", False))),
        device=device,
    )
    model.load_state_dict(checkpoint["model_state_dict"])
    return model, checkpoint


def main() -> None:
    args = parse_args()
    set_seed(SEED)
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    MODEL_DIR.mkdir(parents=True, exist_ok=True)

    split_paths, using_features_only_splits, label_mapping_path = resolve_split_paths(args)
    datasets, labels = build_datasets(split_paths, label_mapping_path)
    apply_training_augmentations(datasets, args)
    if len(datasets["train"]) == 0:
        raise SystemExit("[error] No training samples with extracted features were found.")
    if len(datasets["val"]) == 0:
        raise SystemExit("[error] No validation samples with extracted features were found.")
    if len(datasets["test"]) == 0:
        raise SystemExit("[error] No test samples with extracted features were found.")

    dataloaders = {
        "train": create_train_dataloader(datasets["train"], balanced_sampler=bool(args.balanced_sampler)),
        "val": create_dataloader(datasets["val"], batch_size=BATCH_SIZE, shuffle=False, num_workers=NUM_WORKERS),
        "test": create_dataloader(datasets["test"], batch_size=BATCH_SIZE, shuffle=False, num_workers=NUM_WORKERS),
    }

    model = build_model_from_config(
        input_size=258,
        hidden_size=max(8, int(args.hidden_size)),
        num_layers=max(1, int(args.num_layers)),
        num_classes=len(labels),
        dropout=float(args.dropout),
        bidirectional=bool(args.bidirectional),
        device=device,
    )

    weighted_loss_enabled = USE_CLASS_WEIGHTED_LOSS and not args.disable_weighted_loss
    split_manifest_mode = (
        "merged_reduced_subset"
        if args.merged_reduced_subset
        else "reduced_subset"
        if args.reduced_subset
        else "features_only"
        if using_features_only_splits
        else "default"
    )
    class_weights = None
    if weighted_loss_enabled:
        class_weights = compute_class_weights(datasets["train"], labels, device)

    if str(args.loss).lower() == "focal":
        if float(args.label_smoothing) > 0:
            print("[warn] --loss=focal ignores --label-smoothing (kept for CLI compatibility).")
        criterion = FocalLoss(gamma=float(args.focal_gamma), alpha=class_weights)
    else:
        criterion = nn.CrossEntropyLoss(
            weight=class_weights,
            label_smoothing=max(0.0, float(args.label_smoothing)),
        )
    optimizer = torch.optim.Adam(
        model.parameters(),
        lr=float(args.learning_rate),
        weight_decay=float(args.weight_decay),
    )
    scheduler = None
    if args.scheduler == "plateau":
        scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(
            optimizer,
            mode="max",
            factor=float(args.scheduler_factor),
            patience=max(1, int(args.scheduler_patience)),
        )

    max_epochs = max(1, int(args.epochs))
    history: dict[str, Any] = {
        "generated_at": str(date.today()),
        "seed": SEED,
        "device": str(device),
        "using_features_only_splits": using_features_only_splits,
        "reduced_subset": bool(args.reduced_subset),
        "merged_reduced_subset": bool(args.merged_reduced_subset),
        "split_manifest_mode": split_manifest_mode,
        "split_paths": {split: str(path.relative_to(REPO_ROOT)) for split, path in split_paths.items()},
        "label_mapping_path": str(label_mapping_path.relative_to(REPO_ROOT)),
        "early_stopping_patience": max(0, args.early_stopping_patience),
        "weighted_loss_enabled": weighted_loss_enabled,
        "class_weights": class_weights.cpu().tolist() if class_weights is not None else None,
        "dataset_sizes": {split: len(dataset) for split, dataset in datasets.items()},
        "skipped_missing_features": {split: dataset.missing_feature_count for split, dataset in datasets.items()},
        "skipped_invalid_shapes": {split: dataset.invalid_shape_count for split, dataset in datasets.items()},
        "hyperparameters": {
            "batch_size": BATCH_SIZE,
            "epochs": max_epochs,
            "learning_rate": float(args.learning_rate),
            "weight_decay": float(args.weight_decay),
            "hidden_size": max(8, int(args.hidden_size)),
            "num_layers": max(1, int(args.num_layers)),
            "dropout": float(args.dropout),
            "bidirectional": bool(args.bidirectional),
            "normalize_per_sequence": bool(args.normalize_per_sequence),
            "scheduler": args.scheduler,
            "scheduler_patience": int(args.scheduler_patience),
            "scheduler_factor": float(args.scheduler_factor),
            "grad_clip_norm": GRAD_CLIP_NORM,
        },
        "model": {
            "type": "GRU",
            "input_size": 258,
            "sequence_length": 32,
            "num_classes": len(labels),
            "bidirectional": bool(args.bidirectional),
        },
        "epochs": [],
    }

    best_val_accuracy = -1.0
    best_epoch = 0
    epochs_without_improvement = 0
    stopped_early = False

    for epoch in range(1, max_epochs + 1):
        train_loss, train_accuracy = run_epoch(model, dataloaders["train"], criterion, device, optimizer=optimizer)
        val_metrics = evaluate_model(model, dataloaders["val"], criterion, device, labels)

        epoch_record = {
            "epoch": epoch,
            "train_loss": train_loss,
            "train_accuracy": train_accuracy,
            "val_loss": val_metrics.loss,
            "val_accuracy": val_metrics.accuracy,
        }
        history["epochs"].append(epoch_record)
        print(
            f"[epoch {epoch:02d}/{max_epochs}] "
            f"train_loss={train_loss:.4f} train_acc={train_accuracy:.4f} "
            f"val_loss={val_metrics.loss:.4f} val_acc={val_metrics.accuracy:.4f}"
        )
        if scheduler is not None:
            scheduler.step(val_metrics.accuracy)

        if val_metrics.accuracy > best_val_accuracy:
            best_val_accuracy = val_metrics.accuracy
            best_epoch = epoch
            epochs_without_improvement = 0
            torch.save(
                {
                    "model_state_dict": model.state_dict(),
                    "labels": labels,
                    "best_epoch": best_epoch,
                    "best_val_accuracy": best_val_accuracy,
                    "hyperparameters": history["hyperparameters"],
                    "model": history["model"],
                },
                BEST_CHECKPOINT_PATH,
            )
        else:
            epochs_without_improvement += 1

        torch.save(
            {
                "model_state_dict": model.state_dict(),
                "labels": labels,
                "last_epoch": epoch,
                "best_epoch": best_epoch,
                "best_val_accuracy": best_val_accuracy,
                "hyperparameters": history["hyperparameters"],
                "model": history["model"],
            },
            LAST_CHECKPOINT_PATH,
        )

        if args.early_stopping_patience > 0 and epochs_without_improvement >= args.early_stopping_patience:
            stopped_early = True
            print(
                f"[early-stop] No val improvement for {args.early_stopping_patience} epoch(s). "
                f"Stopping at epoch {epoch}."
            )
            break

    eval_checkpoint_path = BEST_CHECKPOINT_PATH if args.eval_checkpoint == "best" else LAST_CHECKPOINT_PATH
    model, checkpoint = load_model_from_checkpoint(eval_checkpoint_path, labels=labels, device=device)

    train_metrics = evaluate_model(model, dataloaders["train"], criterion, device, labels)
    val_metrics = evaluate_model(model, dataloaders["val"], criterion, device, labels)
    test_metrics = evaluate_model(model, dataloaders["test"], criterion, device, labels)

    evaluation_summary = {
        "generated_at": str(date.today()),
        "best_epoch": best_epoch,
        "best_val_accuracy": best_val_accuracy,
        "stopped_early": stopped_early,
        "evaluation_checkpoint": args.eval_checkpoint,
        "evaluation_checkpoint_path": str(eval_checkpoint_path.relative_to(REPO_ROOT)),
        "using_features_only_splits": using_features_only_splits,
        "reduced_subset": bool(args.reduced_subset),
        "merged_reduced_subset": bool(args.merged_reduced_subset),
        "split_manifest_mode": split_manifest_mode,
        "split_paths": {split: str(path.relative_to(REPO_ROOT)) for split, path in split_paths.items()},
        "label_mapping_path": str(label_mapping_path.relative_to(REPO_ROOT)),
        "weighted_loss_enabled": weighted_loss_enabled,
        "class_weights": class_weights.cpu().tolist() if class_weights is not None else None,
        "labels": labels,
        "train": metrics_to_dict(train_metrics),
        "val": metrics_to_dict(val_metrics),
        "test": metrics_to_dict(test_metrics),
    }
    confusion_matrix_payload = {
        "generated_at": str(date.today()),
        "labels": labels,
        "splits": {
            "train": train_metrics.confusion_matrix,
            "val": val_metrics.confusion_matrix,
            "test": test_metrics.confusion_matrix,
        },
    }

    HISTORY_PATH.write_text(json.dumps(history, indent=2), encoding="utf-8")
    EVALUATION_PATH.write_text(json.dumps(evaluation_summary, indent=2), encoding="utf-8")
    CONFUSION_MATRIX_PATH.write_text(json.dumps(confusion_matrix_payload, indent=2), encoding="utf-8")

    # Keep legacy path for compatibility with existing workflows.
    if BEST_CHECKPOINT_PATH.exists():
        CHECKPOINT_PATH.write_bytes(BEST_CHECKPOINT_PATH.read_bytes())

    print()
    print(f"[ok] Best checkpoint    -> {BEST_CHECKPOINT_PATH.relative_to(REPO_ROOT)}")
    print(f"[ok] Last checkpoint    -> {LAST_CHECKPOINT_PATH.relative_to(REPO_ROOT)}")
    print(f"[ok] Compatibility ckpt -> {CHECKPOINT_PATH.relative_to(REPO_ROOT)}")
    print(f"[ok] Training history   -> {HISTORY_PATH.relative_to(REPO_ROOT)}")
    print(f"[ok] Evaluation summary -> {EVALUATION_PATH.relative_to(REPO_ROOT)}")
    print(f"[ok] Confusion matrix   -> {CONFUSION_MATRIX_PATH.relative_to(REPO_ROOT)}")
    print()
    print(f"  Reduced subset mode       : {bool(args.reduced_subset)}")
    print(f"  Merged reduced mode       : {bool(args.merged_reduced_subset)}")
    print(f"  Split manifest mode       : {split_manifest_mode}")
    print(f"  Using features-only splits : {using_features_only_splits}")
    print(f"  Weighted loss enabled      : {weighted_loss_enabled}")
    print(f"  Evaluation checkpoint      : {args.eval_checkpoint}")
    print(f"  Early stopping used        : {args.early_stopping_patience > 0}")
    print(f"  Stopped early              : {stopped_early}")
    print(f"  Train accuracy : {train_metrics.accuracy:.4f}")
    print(f"  Val accuracy   : {val_metrics.accuracy:.4f}")
    print(f"  Test accuracy  : {test_metrics.accuracy:.4f}")


if __name__ == "__main__":
    main()