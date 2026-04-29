from __future__ import annotations

import os
import urllib.request
from pathlib import Path

from fastapi import FastAPI

# Reuse the existing runtime + routes.
from serve_first_model_api import InferenceRuntime, create_app


HERE = Path(__file__).resolve().parent
ASSETS_DIR = HERE / "assets"
ASSETS_DIR.mkdir(parents=True, exist_ok=True)


def _download(url: str, path: Path) -> Path:
    path.parent.mkdir(parents=True, exist_ok=True)
    if path.exists() and path.stat().st_size > 0:
        return path
    print(f"[download] {url} -> {path}")
    urllib.request.urlretrieve(url, path)
    return path


def _get_asset_path(env_key: str, default_name: str) -> Path:
    # If user provides a local path in env, use it.
    raw = os.environ.get(env_key, "").strip()
    if raw and "://" not in raw:
        return Path(raw).expanduser().resolve()
    return (ASSETS_DIR / default_name).resolve()


def build_runtime() -> InferenceRuntime:
    # These can be either:
    # - local file paths, OR
    # - https:// URLs (Firebase Storage public URL / signed URL / GCS URL via https)
    checkpoint = os.environ.get("SIGNESE_CHECKPOINT", "").strip()
    label_map = os.environ.get("SIGNESE_LABEL_MAP", "").strip()

    checkpoint_path = _get_asset_path("SIGNESE_CHECKPOINT", "model_checkpoint.pt")
    label_map_path = _get_asset_path("SIGNESE_LABEL_MAP", "reduced_label_to_index.json")

    if checkpoint and "://" in checkpoint:
        _download(checkpoint, checkpoint_path)
    if label_map and "://" in label_map:
        _download(label_map, label_map_path)

    if not checkpoint_path.exists():
        raise RuntimeError(
            "Missing model checkpoint. Set SIGNESE_CHECKPOINT to a local path or https URL."
        )
    if not label_map_path.exists():
        raise RuntimeError(
            "Missing label map. Set SIGNESE_LABEL_MAP to a local path or https URL."
        )

    return InferenceRuntime(checkpoint_path=checkpoint_path, label_mapping_path=label_map_path)


runtime = build_runtime()
app: FastAPI = create_app(runtime)

