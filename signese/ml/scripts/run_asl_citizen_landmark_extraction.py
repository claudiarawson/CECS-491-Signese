"""
run_asl_citizen_landmark_extraction.py
--------------------------------------
Run landmark extraction for the ASL Citizen reduced Signese experiment using
MediaPipe Holistic.

Inputs:
  - data/processed/landmarks/asl_citizen_train_jobs.json
  - data/processed/landmarks/asl_citizen_val_jobs.json
  - data/processed/landmarks/asl_citizen_test_jobs.json

Outputs:
  - data/processed/landmarks/features/asl_citizen/<split>/<LABEL>/<sample_id>.npy
  - data/processed/landmarks/asl_citizen_extraction_report.json

Feature layout per frame:
  - pose:      33 landmarks * 4 values (x, y, z, visibility)
  - left hand: 21 landmarks * 3 values (x, y, z)
  - right hand:21 landmarks * 3 values (x, y, z)

This yields a fixed shape of (max_frames, 258) for the default config.
"""

from __future__ import annotations

import json
import math
import traceback
import urllib.request
from collections import defaultdict
from datetime import date
from pathlib import Path
from typing import Any

import cv2
import mediapipe as mp
import numpy as np


REPO_ROOT = Path(__file__).resolve().parent.parent.parent
LANDMARKS_DIR = REPO_ROOT / "data" / "processed" / "landmarks"
INPUTS = {
    "train": LANDMARKS_DIR / "asl_citizen_train_jobs.json",
    "val": LANDMARKS_DIR / "asl_citizen_val_jobs.json",
    "test": LANDMARKS_DIR / "asl_citizen_test_jobs.json",
}
REPORT_OUT = LANDMARKS_DIR / "asl_citizen_extraction_report.json"
MODEL_DIR = LANDMARKS_DIR / "models"
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


def load_jobs(path: Path) -> list[dict[str, Any]]:
    with path.open(encoding="utf-8-sig") as f:
        data = json.load(f)
    if not isinstance(data, list):
        raise ValueError(f"Expected list in {path}")
    return data


def ensure_parent(path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)


def ensure_model_asset() -> Path:
    if MODEL_PATH.exists():
        return MODEL_PATH

    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    print(f"[download] MediaPipe holistic model -> {MODEL_PATH}")
    urllib.request.urlretrieve(DEFAULT_MODEL_URL, MODEL_PATH)
    return MODEL_PATH


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
    for lm in entries:
        values.extend([lm.x, lm.y, lm.z])
        if include_visibility:
            values.append(getattr(lm, "visibility", 0.0))

    array = np.asarray(values, dtype=np.float32)
    if array.size >= width:
        return array[:width]

    padded = np.zeros(width, dtype=np.float32)
    padded[:array.size] = array
    return padded


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

    def __enter__(self) -> "LegacyHolisticDetector":
        return self

    def __exit__(self, exc_type: Any, exc: Any, tb: Any) -> None:
        self.close()

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

    def __enter__(self) -> "TasksHolisticDetector":
        return self

    def __exit__(self, exc_type: Any, exc: Any, tb: Any) -> None:
        self.close()

    def process_frame(self, rgb: np.ndarray, timestamp_ms: int) -> Any:
        image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
        return self._landmarker.detect_for_video(image, timestamp_ms)

    def close(self) -> None:
        self._landmarker.close()


def normalize_frame_feature(frame_feature: np.ndarray) -> np.ndarray:
    """
    Basic normalization for MVP:
      - center around pose shoulder midpoint if available
      - scale by shoulder distance when possible

    TODO(normalization): Add temporal normalization and dataset-level statistics.
    TODO(normalization): Evaluate wrist/torso fallback anchors for weak pose frames.
    """
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

    # Normalize pose x/y/z.
    pose[:, 0] = (pose[:, 0] - center[0]) / scale
    pose[:, 1] = (pose[:, 1] - center[1]) / scale
    pose[:, 2] = pose[:, 2] / scale
    out[:POSE_WIDTH] = pose.reshape(-1)

    # Normalize both hands using the same body-centered frame.
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


def extract_features_for_video(job: dict[str, Any], holistic: Any) -> np.ndarray:
    video_path = REPO_ROOT / str(job["video_path"])
    if not video_path.exists():
        raise FileNotFoundError(f"Video not found: {video_path}")

    config = job.get("extractor_config", {})
    target_fps = int(config.get("target_fps", 15))
    max_frames = int(config.get("max_frames", 32))
    normalize_landmarks = bool(config.get("normalize_landmarks", True))

    capture = cv2.VideoCapture(str(video_path))
    if not capture.isOpened():
        raise RuntimeError(f"Unable to open video: {video_path}")

    try:
        source_fps = float(capture.get(cv2.CAP_PROP_FPS) or 0.0)
        total_frames = int(capture.get(cv2.CAP_PROP_FRAME_COUNT) or 0)
        frame_indices = extract_frame_indices(total_frames, source_fps, target_fps)
        if not frame_indices:
            raise RuntimeError("No frames available for extraction")

        features: list[np.ndarray] = []
        for frame_index in frame_indices:
            capture.set(cv2.CAP_PROP_POS_FRAMES, frame_index)
            ok, frame = capture.read()
            if not ok or frame is None:
                continue

            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            timestamp_ms = int(round((frame_index / max(source_fps, 1e-6)) * 1000.0))
            results = holistic.process_frame(rgb, timestamp_ms)
            features.append(frame_to_feature(results, normalize_landmarks=normalize_landmarks))

        if not features:
            raise RuntimeError("No readable frames produced features")

        return pad_or_trim(features, max_frames)
    finally:
        capture.release()


def build_holistic_for_job(example_job: dict[str, Any]) -> Any:
    del example_job

    # TODO(unify-runners): Merge WLASL and ASL runner logic into one parameterized script.
    # TODO(extractor-backend): Add alternative backends such as MediaPipe Tasks or OpenPose.
    if hasattr(mp, "solutions"):
        return LegacyHolisticDetector()

    model_path = ensure_model_asset()
    return TasksHolisticDetector(model_path)


def process_jobs(split: str, jobs: list[dict[str, Any]], report: dict[str, Any]) -> None:
    split_counts = report["per_split_counts"][split]

    if not jobs:
        return

    total = len(jobs)
    for index, job in enumerate(jobs, start=1):
        sample_id = str(job.get("sample_id", "unknown"))
        label = str(job.get("label", "unknown"))
        output_path = REPO_ROOT / str(job["output_path"])
        ensure_parent(output_path)

        print(f"[{split} {index}/{total}] {sample_id}")

        try:
            with build_holistic_for_job(job) as holistic:
                features = extract_features_for_video(job, holistic)
            np.save(output_path, features)

            report["success_count"] += 1
            split_counts["success"] += 1
            report["per_label_counts"][label]["success"] += 1
        except Exception as exc:  # noqa: BLE001 - batch processing should continue.
            report["failure_count"] += 1
            split_counts["failure"] += 1
            report["per_label_counts"][label]["failure"] += 1
            report["failed_samples"].append(
                {
                    "sample_id": sample_id,
                    "split": split,
                    "label": label,
                    "video_path": job.get("video_path"),
                    "error": str(exc),
                    "traceback": traceback.format_exc(limit=1).strip(),
                }
            )


def main() -> None:
    jobs_by_split = {split: load_jobs(path) for split, path in INPUTS.items()}
    total_jobs = sum(len(rows) for rows in jobs_by_split.values())

    report: dict[str, Any] = {
        "generated_at": str(date.today()),
        "total_jobs_processed": total_jobs,
        "success_count": 0,
        "failure_count": 0,
        "per_split_counts": {
            split: {"jobs": len(rows), "success": 0, "failure": 0}
            for split, rows in jobs_by_split.items()
        },
        "per_label_counts": defaultdict(lambda: {"success": 0, "failure": 0}),
        "failed_samples": [],
        # TODO(parallelism): Add multi-worker extraction once single-process output is validated.
        # TODO(extractor-backend): Allow configurable backend selection from CLI/settings.
    }

    for split, jobs in jobs_by_split.items():
        process_jobs(split, jobs, report)

    report["per_label_counts"] = dict(sorted(report["per_label_counts"].items()))
    REPORT_OUT.write_text(json.dumps(report, indent=2), encoding="utf-8")

    print("[ok] Extraction report -> data/processed/landmarks/asl_citizen_extraction_report.json")
    print()
    print(f"  Total jobs processed : {report['total_jobs_processed']}")
    print(f"  Success count        : {report['success_count']}")
    print(f"  Failure count        : {report['failure_count']}")
    print("  Per-split counts:")
    for split, counts in report["per_split_counts"].items():
        print(
            f"    {split:<5} jobs={counts['jobs']:<3} success={counts['success']:<3} failure={counts['failure']:<3}"
        )
    print("  Per-label counts:")
    for label, counts in report["per_label_counts"].items():
        print(f"    {label:<10} success={counts['success']:<3} failure={counts['failure']:<3}")


if __name__ == "__main__":
    main()