import {
  ClipPreprocessor,
  NormalizedModelInput,
  TemporalClip,
  TrainingSampleRecord,
} from "./types";

export class BasicTemporalClipPreprocessor implements ClipPreprocessor {
  name = "basic-temporal-clip-preprocessor";

  async preprocess(clip: TemporalClip): Promise<NormalizedModelInput> {
    const frameCount = Math.max(clip.frames.length, 1);
    const durationMs = Math.max(clip.endMs - clip.startMs, 1);

    // TODO(model): Replace handcrafted temporal features with real pixel/keypoint tensors.
    // This placeholder keeps the runtime pipeline testable before model assets are integrated.
    const values = [
      frameCount / 32,
      Math.min(durationMs / 2000, 1),
      clip.fps / 60,
      this.computeTemporalVariance(clip),
      this.computeAspectRatioHint(clip),
    ];

    return {
      clipId: clip.clipId,
      values,
      shape: [1, values.length, 1, 1],
      metadata: {
        sourceClipFps: clip.fps,
        sampledFrames: clip.frames.length,
      },
    };
  }

  private computeTemporalVariance(clip: TemporalClip): number {
    if (clip.frames.length < 3) {
      return 0;
    }

    const intervals: number[] = [];
    for (let index = 1; index < clip.frames.length; index += 1) {
      intervals.push(clip.frames[index].timestampMs - clip.frames[index - 1].timestampMs);
    }

    const mean = intervals.reduce((sum, value) => sum + value, 0) / intervals.length;
    const variance =
      intervals.reduce((sum, value) => sum + (value - mean) * (value - mean), 0) /
      intervals.length;

    return Math.min(variance / 10000, 1);
  }

  private computeAspectRatioHint(clip: TemporalClip): number {
    const firstFrame = clip.frames[0];
    if (!firstFrame || firstFrame.height === 0) {
      return 1;
    }

    return Math.min(firstFrame.width / firstFrame.height, 2);
  }
}

export interface TrainingExportBundle {
  schemaVersion: string;
  generatedAt: string;
  samples: TrainingSampleRecord[];
}

export function buildTrainingSampleRecord(input: {
  sampleId: string;
  label: string;
  datasetSourceId: string;
  split: "train" | "validation" | "test";
  clipPath: string;
  frameCount: number;
  durationMs: number;
  fps: number;
}): TrainingSampleRecord {
  return { ...input };
}

export function serializeTrainingBundle(bundle: TrainingExportBundle): string {
  return JSON.stringify(bundle, null, 2);
}
