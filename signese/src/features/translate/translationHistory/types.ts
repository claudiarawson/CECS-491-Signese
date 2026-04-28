export type TranslationHistoryItem = {
  id: string;
  sequence: number;
  createdAt: string;
  sourceLanguage: string;
  targetLanguage: string;
  originalText: string;
  translatedText: string;
  timestamp?: string; // ISO string for when the sign was detected
  confidence?: number; // confidence score 0-1
};
