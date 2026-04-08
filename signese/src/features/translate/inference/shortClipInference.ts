import {
  BackendInferenceAdapter,
  createMockTemporalClip,
  MockInferenceAdapter,
  SignRecognitionPipeline,
} from "../model/pipeline";
import { LabelId } from "../model/types";
import { RUNTIME_V0_LABELS } from "../model/supportedSigns";
import { TranslateInferenceResponse } from "./types";

interface ShortClipInferenceParams {
  sequence: number;
  frameCount?: number;
  fps?: number;
}

export class ShortClipInferenceService {
  constructor(private readonly pipeline: SignRecognitionPipeline) {}

  async inferShortClip(params: ShortClipInferenceParams): Promise<TranslateInferenceResponse> {
    const clip = createMockTemporalClip({
      sequence: params.sequence,
      frameCount: params.frameCount ?? 12,
      fps: params.fps ?? 12,
    });

    const result = await this.pipeline.processClip(clip);
    const rawTopK = result.prediction.scores.slice(0, 5);

    if (!result.decision.token) {
      return {
        mode: "single",
        tokens: [],
        raw_top_k: rawTopK,
        adapter_name: this.pipeline.getAdapterName(),
      };
    }

    return {
      mode: "single",
      tokens: [
        {
          label: result.decision.token.label,
          confidence: result.decision.token.confidence,
          start_ms: clip.startMs,
          end_ms: clip.endMs,
        },
      ],
      raw_top_k: rawTopK,
      adapter_name: this.pipeline.getAdapterName(),
    };
  }

  reset() {
    this.pipeline.reset();
  }
}

export function createShortClipInferenceService(labels?: LabelId[]) {
  const runtimeLabels = labels ?? RUNTIME_V0_LABELS;
  const mode = String(process.env.EXPO_PUBLIC_TRANSLATE_INFERENCE_MODE ?? "").trim().toLowerCase();
  const endpointUrl = String(process.env.EXPO_PUBLIC_TRANSLATE_INFERENCE_URL ?? "").trim();

  const shouldUseBackend = mode === "backend" || (mode === "" && endpointUrl.length > 0);

  const adapter = shouldUseBackend && endpointUrl.length > 0
    ? new BackendInferenceAdapter({ endpointUrl, labels: runtimeLabels })
    : new MockInferenceAdapter(runtimeLabels);

  const pipeline = new SignRecognitionPipeline(adapter);
  return new ShortClipInferenceService(pipeline);
}

// TODO(sequence-mode): Implement sliding-window clip chunking over longer recordings.
// TODO(sequence-mode): Run repeated inference over chunk windows and emit ordered token spans.
// TODO(sequence-mode): Add duplicate suppression across adjacent windows for stable captions.
// TODO(sequence-mode): Add confidence smoothing across neighboring windows/tokens.
// TODO(sequence-mode): Add boundary heuristics to split/merge token spans into words.
