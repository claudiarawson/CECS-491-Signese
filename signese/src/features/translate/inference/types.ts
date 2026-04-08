import { LabelScore } from "../model/types";

export type TranslateInferenceMode = "single" | "sequence";

export interface TranslateTokenPrediction {
  label: string;
  confidence: number;
  start_ms: number;
  end_ms: number;
}

export interface TranslateInferenceResponse {
  mode: TranslateInferenceMode;
  tokens: TranslateTokenPrediction[];
  raw_top_k?: LabelScore[];
  adapter_name?: string;
}
