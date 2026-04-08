"""
serve_first_model_api.py
------------------------
FastAPI inference server for the Signese first GRU baseline checkpoint.

This server accepts Translate runtime payloads from the Expo app and returns
label probabilities in a shape understood by BackendInferenceAdapter.
"""

from __future__ import annotations

import argparse
import json
import math
import tempfile
import urllib.request
from pathlib import Path
from typing import Any

import cv2
import mediapipe as mp
import numpy as np
import torch
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from pydantic import BaseModel, ConfigDict
from torch import nn


REPO_ROOT = Path(__file__).resolve().parent.parent.parent
DEFAULT_CHECKPOINT = REPO_ROOT / "data" / "processed" / "models" / "first_signese_baseline" / "model_checkpoint.pt"
DEFAULT_LABEL_MAP = REPO_ROOT / "data" / "processed" / "reduced_label_to_index.json"
MODEL_DIR = REPO_ROOT / "data" / "processed" / "landmarks" / "models"
MODEL_PATH = MODEL_DIR / "holistic_landmarker.task"
DEFAULT_MODEL_URL = (
    "https://storage.googleapis.com/mediapipe-models/holistic_landmarker/"
    "holistic_landmarker/float16/1/holistic_landmarker.task"
)

POSE_LANDMARKS = 33
HAND_LANDMARKS = 21
POSE_WIDTH = POSE_LANDMARKS * 4
HAND_WIDTH = HAND_LANDMARKS * 3
FEATURE_WIDTH = POSE_WIDTH + HAND_WIDTH + HAND_WIDTH


class LandmarkGRUClassifier(nn.Module):
    def __init__(self, input_size: int, hidden_size: int, num_layers: int, num_classes: int, dropout: float) -> None:
        super().__init__()
        self.encoder = nn.GRU(
            input_size=input_size,
            hidden_size=hidden_size,
            num_layers=num_layers,
            batch_first=True,
            dropout=dropout if num_layers > 1 else 0.0,
        )
        self.dropout = nn.Dropout(dropout)
        self.head = nn.Linear(hidden_size, num_classes)

    def forward(self, features: torch.Tensor) -> torch.Tensor:
        _, hidden = self.encoder(features)
        last_hidden = hidden[-1]
        return self.head(self.dropout(last_hidden))


class PredictRequest(BaseModel):
    model_config = ConfigDict(extra="allow")

    clip_id: str
    values: list[float]
    shape: list[int]
    metadata: dict[str, Any] | None = None


def extract_frame_indices(total_frames: int, source_fps: float, target_fps: int) -> list[int]:
    if total_frames <= 0:
        return []
    if source_fps <= 0:
        source_fps = float(target_fps)

    duration = total_frames / source_fps
    expected = max(1, int(math.ceil(duration * target_fps)))
    frame_count = min(total_frames, expected)
    if frame_count <= 1:
        return [0]

    indices = np.linspace(0, total_frames - 1, num=frame_count, dtype=int)
    return indices.tolist()


def pad_or_trim(features: list[np.ndarray], max_frames: int) -> np.ndarray:
    if not features:
        return np.zeros((max_frames, FEATURE_WIDTH), dtype=np.float32)

    array = np.stack(features).astype(np.float32)
    if array.shape[0] > max_frames:
        array = array[:max_frames]
    elif array.shape[0] < max_frames:
        pad = np.zeros((max_frames - array.shape[0], FEATURE_WIDTH), dtype=np.float32)
        array = np.concatenate([array, pad], axis=0)
    return array


def landmark_list_to_array(landmarks: Any, width: int, include_visibility: bool) -> np.ndarray:
    if landmarks is None:
        return np.zeros(width, dtype=np.float32)

    values: list[float] = []
    entries = getattr(landmarks, "landmark", landmarks)
    for landmark in entries:
        values.extend([landmark.x, landmark.y, landmark.z])
        if include_visibility:
            values.append(getattr(landmark, "visibility", 0.0))

    array = np.asarray(values, dtype=np.float32)
    if array.size >= width:
        return array[:width]

    padded = np.zeros(width, dtype=np.float32)
    padded[:array.size] = array
    return padded


def normalize_frame_feature(frame_feature: np.ndarray) -> np.ndarray:
    out = frame_feature.copy()

    pose = out[:POSE_WIDTH].reshape(POSE_LANDMARKS, 4)
    xy = pose[:, :2]
    visibility = pose[:, 3]

    left_shoulder = 11
    right_shoulder = 12
    if visibility[left_shoulder] > 0.1 and visibility[right_shoulder] > 0.1:
        center = (xy[left_shoulder] + xy[right_shoulder]) / 2.0
        scale = np.linalg.norm(xy[left_shoulder] - xy[right_shoulder])
    else:
        valid = visibility > 0.1
        if np.any(valid):
            center = xy[valid].mean(axis=0)
            mins = xy[valid].min(axis=0)
            maxs = xy[valid].max(axis=0)
            scale = float(np.linalg.norm(maxs - mins))
        else:
            return out

    if scale < 1e-6:
        scale = 1.0

    pose[:, 0] = (pose[:, 0] - center[0]) / scale
    pose[:, 1] = (pose[:, 1] - center[1]) / scale
    pose[:, 2] = pose[:, 2] / scale
    out[:POSE_WIDTH] = pose.reshape(-1)

    offset = POSE_WIDTH
    for _ in range(2):
        hand = out[offset : offset + HAND_WIDTH].reshape(HAND_LANDMARKS, 3)
        hand[:, 0] = (hand[:, 0] - center[0]) / scale
        hand[:, 1] = (hand[:, 1] - center[1]) / scale
        hand[:, 2] = hand[:, 2] / scale
        out[offset : offset + HAND_WIDTH] = hand.reshape(-1)
        offset += HAND_WIDTH

    return out


def frame_to_feature(results: Any, normalize_landmarks: bool) -> np.ndarray:
    pose = landmark_list_to_array(results.pose_landmarks, POSE_WIDTH, include_visibility=True)
    left_hand = landmark_list_to_array(results.left_hand_landmarks, HAND_WIDTH, include_visibility=False)
    right_hand = landmark_list_to_array(results.right_hand_landmarks, HAND_WIDTH, include_visibility=False)
    frame_feature = np.concatenate([pose, left_hand, right_hand]).astype(np.float32)

    if normalize_landmarks:
        frame_feature = normalize_frame_feature(frame_feature)
    return frame_feature


def ensure_model_asset() -> Path:
    if MODEL_PATH.exists():
        return MODEL_PATH

    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    print(f"[download] MediaPipe holistic model -> {MODEL_PATH}")
    urllib.request.urlretrieve(DEFAULT_MODEL_URL, MODEL_PATH)
    return MODEL_PATH


class LegacyHolisticDetector:
    def __init__(self) -> None:
        self._holistic = mp.solutions.holistic.Holistic(
            static_image_mode=False,
            model_complexity=1,
            smooth_landmarks=True,
            enable_segmentation=False,
            refine_face_landmarks=False,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5,
        )

    def process_frame(self, rgb: np.ndarray, timestamp_ms: int) -> Any:
        del timestamp_ms
        rgb.flags.writeable = False
        return self._holistic.process(rgb)

    def close(self) -> None:
        self._holistic.close()


class TasksHolisticDetector:
    def __init__(self, model_path: Path) -> None:
        base_options = mp.tasks.BaseOptions(model_asset_path=str(model_path))
        options = mp.tasks.vision.HolisticLandmarkerOptions(
            base_options=base_options,
            running_mode=mp.tasks.vision.RunningMode.VIDEO,
            min_face_detection_confidence=0.5,
            min_face_suppression_threshold=0.5,
            min_face_landmarks_confidence=0.5,
            min_pose_detection_confidence=0.5,
            min_pose_suppression_threshold=0.5,
            min_pose_landmarks_confidence=0.5,
            min_hand_landmarks_confidence=0.5,
            output_face_blendshapes=False,
            output_segmentation_mask=False,
        )
        self._landmarker = mp.tasks.vision.HolisticLandmarker.create_from_options(options)

    def process_frame(self, rgb: np.ndarray, timestamp_ms: int) -> Any:
        image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
        return self._landmarker.detect_for_video(image, timestamp_ms)

    def close(self) -> None:
        self._landmarker.close()


def build_holistic_detector() -> Any:
    if hasattr(mp, "solutions"):
        return LegacyHolisticDetector()

    model_path = ensure_model_asset()
    return TasksHolisticDetector(model_path)


class InferenceRuntime:
    def __init__(self, checkpoint_path: Path, label_mapping_path: Path | None) -> None:
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.checkpoint_path = checkpoint_path
        self.label_mapping_path = label_mapping_path

        checkpoint = torch.load(checkpoint_path, map_location=self.device)
        model_meta = checkpoint.get("model", {})
        hp = checkpoint.get("hyperparameters", {})

        labels_from_checkpoint = checkpoint.get("labels")
        if isinstance(labels_from_checkpoint, list) and labels_from_checkpoint:
            self.labels = [str(label) for label in labels_from_checkpoint]
        else:
            self.labels = self._load_labels_from_mapping(label_mapping_path)

        input_size = int(model_meta.get("input_size", 258))
        hidden_size = int(hp.get("hidden_size", 128))
        num_layers = int(hp.get("num_layers", 1))
        dropout = float(hp.get("dropout", 0.2))
        sequence_length = int(model_meta.get("sequence_length", 32))

        self.expected_sequence_length = sequence_length
        self.expected_input_size = input_size

        model = LandmarkGRUClassifier(
            input_size=input_size,
            hidden_size=hidden_size,
            num_layers=num_layers,
            num_classes=len(self.labels),
            dropout=dropout,
        )
        model.load_state_dict(checkpoint["model_state_dict"])
        model.to(self.device)
        model.eval()

        self.model = model
        self.model_id = f"first-signese-baseline:{checkpoint_path.name}"
        self.target_fps = 15
        self.normalize_landmarks = True

    def close(self) -> None:
        return None

    def _load_labels_from_mapping(self, label_mapping_path: Path | None) -> list[str]:
        if not label_mapping_path or not label_mapping_path.exists():
            raise RuntimeError("Could not load labels from checkpoint or mapping file.")

        payload = json.loads(label_mapping_path.read_text(encoding="utf-8-sig"))
        labels = payload.get("labels")
        if not isinstance(labels, list) or not labels:
            raise RuntimeError("Label mapping file does not contain a valid labels list.")

        return [str(label) for label in labels]

    def _expand_placeholder_input(self, values: list[float]) -> np.ndarray:
        # Expo currently sends a placeholder 5-feature vector; expand it for smoke-testing.
        base = np.asarray(values, dtype=np.float32)
        if base.size == 0:
            base = np.zeros((5,), dtype=np.float32)

        total = self.expected_sequence_length * self.expected_input_size
        tiled = np.resize(base, total)
        return tiled.reshape((1, self.expected_sequence_length, self.expected_input_size))

    def _to_model_input(self, payload: PredictRequest) -> np.ndarray:
        values = np.asarray(payload.values, dtype=np.float32)
        shape = [int(dim) for dim in payload.shape]

        # Preferred shape: [1, 32, 258] or [1, 32, 258, 1]
        # Current placeholder from app: [1, 5, 1, 1]
        if values.size == self.expected_sequence_length * self.expected_input_size:
            return values.reshape((1, self.expected_sequence_length, self.expected_input_size))

        if len(shape) == 4 and shape[-1] == 1:
            expected = int(np.prod(shape))
            if values.size == expected:
                shaped = values.reshape(tuple(shape))
                squeezed = np.squeeze(shaped, axis=-1)
                if squeezed.shape == (1, self.expected_sequence_length, self.expected_input_size):
                    return squeezed.astype(np.float32)

        if len(shape) == 3:
            expected = int(np.prod(shape))
            if values.size == expected:
                shaped = values.reshape(tuple(shape))
                if shaped.shape == (1, self.expected_sequence_length, self.expected_input_size):
                    return shaped.astype(np.float32)

        if len(shape) == 4 and shape == [1, 5, 1, 1] and values.size == 5:
            return self._expand_placeholder_input(payload.values)

        if values.size == 5:
            return self._expand_placeholder_input(payload.values)

        raise ValueError(
            f"Unsupported input shape/size. Received shape={shape}, values={values.size}; "
            f"expected 1x{self.expected_sequence_length}x{self.expected_input_size}."
        )

    def _extract_features_from_video_bytes(self, video_bytes: bytes, suffix: str = ".mp4") -> np.ndarray:
        safe_suffix = suffix if suffix.startswith(".") and len(suffix) <= 10 else ".mp4"
        with tempfile.NamedTemporaryFile(suffix=safe_suffix, delete=False) as temp_file:
            temp_file.write(video_bytes)
            temp_path = Path(temp_file.name)

        capture = cv2.VideoCapture(str(temp_path))
        if not capture.isOpened():
            temp_path.unlink(missing_ok=True)
            raise ValueError("Unable to decode uploaded clip as a video file.")

        holistic = build_holistic_detector()
        try:
            source_fps = float(capture.get(cv2.CAP_PROP_FPS) or 0.0)
            total_frames = int(capture.get(cv2.CAP_PROP_FRAME_COUNT) or 0)
            frame_indices = extract_frame_indices(total_frames, source_fps, self.target_fps)
            if not frame_indices:
                raise ValueError("Uploaded clip has no readable frames.")

            features: list[np.ndarray] = []
            for frame_index in frame_indices:
                capture.set(cv2.CAP_PROP_POS_FRAMES, frame_index)
                ok, frame = capture.read()
                if not ok or frame is None:
                    continue

                rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                timestamp_ms = int(round((frame_index / max(source_fps, 1e-6)) * 1000.0))
                results = holistic.process_frame(rgb, timestamp_ms)
                features.append(
                    frame_to_feature(results, normalize_landmarks=self.normalize_landmarks)
                )

            if not features:
                raise ValueError("Uploaded clip produced no landmark features.")

            return pad_or_trim(features, self.expected_sequence_length)
        finally:
            holistic.close()
            capture.release()
            temp_path.unlink(missing_ok=True)

    @torch.no_grad()
    def _predict_scores(self, array: np.ndarray) -> list[dict[str, float | str]]:
        tensor = torch.from_numpy(array).to(self.device)
        logits = self.model(tensor)
        probs = torch.softmax(logits, dim=1).squeeze(0).cpu().numpy()

        scores = [
            {"label": label, "score": float(prob)}
            for label, prob in zip(self.labels, probs.tolist())
        ]
        scores.sort(key=lambda row: row["score"], reverse=True)
        return scores

    def _format_response(
        self,
        *,
        clip_id: str,
        scores: list[dict[str, float | str]],
        start_ms: int,
        end_ms: int,
    ) -> dict[str, Any]:
        top = scores[0] if scores else None
        tokens = (
            [
                {
                    "label": str(top["label"]),
                    "confidence": float(top["score"]),
                    "start_ms": int(start_ms),
                    "end_ms": int(end_ms),
                }
            ]
            if top
            else []
        )

        return {
            "model_id": self.model_id,
            "clip_id": clip_id,
            "mode": "single",
            "tokens": tokens,
            "raw_top_k": scores[:5],
            "scores": scores,
            "probabilities": {str(row["label"]): float(row["score"]) for row in scores},
            # TODO(sequence-mode): return time-ordered token spans for multi-sign clips.
            # TODO(sequence-mode): include chunk-level metadata once sliding-window decoding lands.
        }

    @torch.no_grad()
    def predict(self, payload: PredictRequest) -> dict[str, Any]:
        array = self._to_model_input(payload)
        scores = self._predict_scores(array)
        return self._format_response(clip_id=payload.clip_id, scores=scores, start_ms=0, end_ms=0)

    @torch.no_grad()
    def predict_clip_video(
        self,
        *,
        clip_id: str,
        video_bytes: bytes,
        filename: str | None,
        start_ms: int,
        end_ms: int,
    ) -> dict[str, Any]:
        suffix = Path(filename).suffix if filename else ".mp4"
        features = self._extract_features_from_video_bytes(video_bytes, suffix=suffix)
        features = features.astype(np.float32)
        batched = np.expand_dims(features, axis=0)
        scores = self._predict_scores(batched)
        return self._format_response(
            clip_id=clip_id,
            scores=scores,
            start_ms=start_ms,
            end_ms=end_ms,
        )


def create_app(runtime: InferenceRuntime) -> FastAPI:
    app = FastAPI(title="Signese First Model Inference API", version="0.1.0")

    @app.get("/health")
    def health() -> dict[str, Any]:
        return {
            "ok": True,
            "model_id": runtime.model_id,
            "device": str(runtime.device),
            "labels": runtime.labels,
            "expected_input": [1, runtime.expected_sequence_length, runtime.expected_input_size],
        }

    @app.post("/predict")
    def predict(payload: PredictRequest) -> dict[str, Any]:
        try:
            return runtime.predict(payload)
        except ValueError as error:
            raise HTTPException(status_code=422, detail=str(error)) from error
        except Exception as error:  # pragma: no cover
            raise HTTPException(status_code=500, detail=f"Inference failed: {error}") from error

    @app.post("/predict/clip")
    async def predict_clip(
        clip_id: str = Form(...),
        video: UploadFile = File(...),
        start_ms: int = Form(0),
        end_ms: int = Form(0),
    ) -> dict[str, Any]:
        try:
            video_bytes = await video.read()
            if not video_bytes:
                raise ValueError("Uploaded video clip is empty.")

            return runtime.predict_clip_video(
                clip_id=clip_id,
                video_bytes=video_bytes,
                filename=video.filename,
                start_ms=start_ms,
                end_ms=end_ms,
            )
        except ValueError as error:
            raise HTTPException(status_code=422, detail=str(error)) from error
        except Exception as error:  # pragma: no cover
            raise HTTPException(status_code=500, detail=f"Clip inference failed: {error}") from error

    @app.on_event("shutdown")
    def shutdown_runtime() -> None:
        runtime.close()

    return app


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Serve Signese first-model inference API")
    parser.add_argument("--host", default="0.0.0.0", help="Host interface to bind")
    parser.add_argument("--port", type=int, default=8000, help="Port to bind")
    parser.add_argument("--checkpoint", type=Path, default=DEFAULT_CHECKPOINT, help="Path to .pt checkpoint")
    parser.add_argument(
        "--label-mapping",
        type=Path,
        default=DEFAULT_LABEL_MAP,
        help="Fallback label mapping path when checkpoint has no labels",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()

    checkpoint_path = args.checkpoint.resolve()
    if not checkpoint_path.exists():
        raise SystemExit(f"[error] Checkpoint not found: {checkpoint_path}")

    label_map = args.label_mapping.resolve() if args.label_mapping else None

    runtime = InferenceRuntime(checkpoint_path=checkpoint_path, label_mapping_path=label_map)
    app = create_app(runtime)

    import uvicorn

    uvicorn.run(app, host=args.host, port=args.port)


if __name__ == "__main__":
    main()
