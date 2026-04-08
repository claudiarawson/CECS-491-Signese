import * as FileSystem from "expo-file-system/legacy";
import {
  BackendInferenceAdapter,
  createMockTemporalClip,
  MockInferenceAdapter,
  SignRecognitionPipeline,
} from "../model/pipeline";
import { LabelScore, LabelId } from "../model/types";
import { RUNTIME_V0_LABELS } from "../model/supportedSigns";
import { TranslateInferenceResponse, TranslateTokenPrediction } from "./types";

interface ShortClipInferenceParams {
  sequence: number;
  frameCount?: number;
  fps?: number;
}

interface RecordedClipInferenceParams {
  sequence: number;
  clipUri: string;
  startMs?: number;
  endMs?: number;
}

interface ServiceOptions {
  adapterName: string;
  endpointUrl?: string;
}

function getClipFileMetadata(clipUri: string): { fileName: string; mimeType: string } {
  const cleanUri = clipUri.split("?")[0] ?? clipUri;
  const fileName = cleanUri.split("/").pop() || `recorded-clip-${Date.now()}.mov`;
  const extension = fileName.split(".").pop()?.toLowerCase();

  switch (extension) {
    case "mov":
      return { fileName, mimeType: "video/quicktime" };
    case "m4v":
      return { fileName, mimeType: "video/x-m4v" };
    case "mp4":
    default:
      return { fileName, mimeType: "video/mp4" };
  }
}

function parseLabelScore(value: unknown): LabelScore | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const row = value as Record<string, unknown>;
  if (typeof row.label !== "string" || typeof row.score !== "number") {
    return null;
  }

  return { label: row.label, score: row.score };
}

function parseToken(value: unknown): TranslateTokenPrediction | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const row = value as Record<string, unknown>;
  if (
    typeof row.label !== "string" ||
    typeof row.confidence !== "number" ||
    typeof row.start_ms !== "number" ||
    typeof row.end_ms !== "number"
  ) {
    return null;
  }

  return {
    label: row.label,
    confidence: row.confidence,
    start_ms: row.start_ms,
    end_ms: row.end_ms,
  };
}

function normalizeBackendInferenceResponse(
  payload: unknown,
  fallback: {
    adapterName: string;
    startMs: number;
    endMs: number;
  }
): TranslateInferenceResponse {
  const obj = payload && typeof payload === "object" ? (payload as Record<string, unknown>) : {};

  const rawTopK = Array.isArray(obj.raw_top_k)
    ? obj.raw_top_k.map(parseLabelScore).filter((row): row is LabelScore => row != null)
    : Array.isArray(obj.scores)
      ? obj.scores.map(parseLabelScore).filter((row): row is LabelScore => row != null).slice(0, 5)
      : [];

  const payloadTokens = Array.isArray(obj.tokens)
    ? obj.tokens.map(parseToken).filter((row): row is TranslateTokenPrediction => row != null)
    : [];

  const fallbackToken = rawTopK[0]
    ? {
        label: rawTopK[0].label,
        confidence: rawTopK[0].score,
        start_ms: fallback.startMs,
        end_ms: fallback.endMs,
      }
    : null;

  return {
    mode: "single",
    tokens: payloadTokens.length > 0 ? payloadTokens : fallbackToken ? [fallbackToken] : [],
    raw_top_k: rawTopK,
    adapter_name: fallback.adapterName,
  };
}

export class ShortClipInferenceService {
  constructor(
    private readonly pipeline: SignRecognitionPipeline,
    private readonly options: ServiceOptions
  ) {}

  async inferShortClip(params: ShortClipInferenceParams): Promise<TranslateInferenceResponse> {
    const clip = createMockTemporalClip({
      sequence: params.sequence,
      frameCount: params.frameCount ?? 12,
      fps: params.fps ?? 12,
    });

    const result = await this.pipeline.processClip(clip);
    const rawTopK = result.prediction.scores.slice(0, 5);

    // Keep frontend contract stable even when postprocessing suppresses token emission.
    const fallbackToken = rawTopK[0]
      ? {
          label: rawTopK[0].label,
          confidence: rawTopK[0].score,
          start_ms: clip.startMs,
          end_ms: clip.endMs,
        }
      : null;

    const normalizedResponse: TranslateInferenceResponse = {
      mode: "single",
      tokens: result.decision.token
        ? [
            {
              label: result.decision.token.label,
              confidence: result.decision.token.confidence,
              start_ms: clip.startMs,
              end_ms: clip.endMs,
            },
          ]
        : fallbackToken
        ? [fallbackToken]
        : [],
      raw_top_k: rawTopK,
      adapter_name: this.options.adapterName,
    };

    if (__DEV__) {
      console.log("[Translate] normalized inference response", {
        clipId: clip.clipId,
        adapter: this.options.adapterName,
        rawTopK,
        normalizedResponse,
      });
    }

    return normalizedResponse;
  }

  async inferRecordedClip(params: RecordedClipInferenceParams): Promise<TranslateInferenceResponse> {
    if (!this.options.endpointUrl) {
      return this.inferShortClip({ sequence: params.sequence });
    }

    const clipEndpointUrl = this.options.endpointUrl.replace(/\/predict\/?$/, "/predict/clip");
    const now = Date.now();
    const clipId = `recorded-clip-${params.sequence}-${now}`;
    const { fileName, mimeType } = getClipFileMetadata(params.clipUri);
    const clipInfo = await FileSystem.getInfoAsync(params.clipUri, { size: true });

    if (!clipInfo.exists) {
      throw new Error("Recorded clip file was not found on device.");
    }

    if (!clipInfo.size || clipInfo.size <= 0) {
      throw new Error("Recorded clip file is empty.");
    }

    const form = new FormData();
    form.append("clip_id", clipId);
    form.append("start_ms", String(params.startMs ?? 0));
    form.append("end_ms", String(params.endMs ?? 0));
    form.append(
      "video",
      {
        uri: params.clipUri,
        name: fileName,
        type: mimeType,
      } as any
    );

    const response = await fetch(clipEndpointUrl, {
      method: "POST",
      headers: {
        Accept: "application/json",
      },
      body: form,
    });

    if (!response.ok) {
      let detail = `Backend clip inference failed with status ${response.status}`;

      try {
        const errorPayload: unknown = await response.json();
        if (errorPayload && typeof errorPayload === "object") {
          const errorObj = errorPayload as Record<string, unknown>;
          if (typeof errorObj.detail === "string") {
            detail = errorObj.detail;
          }
        }
      } catch {
        // Keep default status text if error body is not JSON.
      }

      throw new Error(detail);
    }

    const payload: unknown = await response.json();
    const normalizedResponse = normalizeBackendInferenceResponse(payload, {
      adapterName: this.options.adapterName,
      startMs: params.startMs ?? 0,
      endMs: params.endMs ?? 0,
    });

    if (__DEV__) {
      console.log("[Translate] raw backend clip response", payload);
      console.log("[Translate] normalized clip inference response", normalizedResponse);
      console.log("[Translate] recorded clip upload metadata", {
        clipUri: params.clipUri,
        fileName,
        mimeType,
        fileSize: clipInfo.size ?? 0,
      });
    }

    return normalizedResponse;
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
  return new ShortClipInferenceService(pipeline, {
    adapterName: adapter.name,
    endpointUrl: shouldUseBackend ? endpointUrl : undefined,
  });
}

// TODO(sequence-mode): Implement sliding-window clip chunking over longer recordings.
// TODO(sequence-mode): Run repeated inference over chunk windows and emit ordered token spans.
// TODO(sequence-mode): Add duplicate suppression across adjacent windows for stable captions.
// TODO(sequence-mode): Add confidence smoothing across neighboring windows/tokens.
// TODO(sequence-mode): Add boundary heuristics to split/merge token spans into words.
