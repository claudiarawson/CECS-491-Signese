export type TranslationHistoryItem = {
  id: string;
  sequence: number;
  createdAt: string;
  sourceLanguage: string;
  targetLanguage: string;
  originalText: string;
  translatedText: string;
};
