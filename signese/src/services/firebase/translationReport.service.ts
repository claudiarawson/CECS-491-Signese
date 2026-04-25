import { Platform } from "react-native";
import { auth, db } from "./firebase.config";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

/** Payload sent from the client; stored in Firestore `translationReports`. */
export interface TranslationReportPayload {
  translationId?: string;
  sourceText: string;
  translatedText: string;
  sourceLanguage?: string;
  targetLanguage?: string;
  issueDescription: string;
  createdAt: string;
  conversationId?: string;
  sessionId?: string;
}

function validatePayload(p: TranslationReportPayload): void {
  const issue = p.issueDescription?.trim() ?? "";
  const source = p.sourceText?.trim() ?? "";
  const target = p.translatedText?.trim() ?? "";
  const createdAt = p.createdAt?.trim() ?? "";
  if (!issue) {
    throw new Error("Please describe the issue before submitting.");
  }
  if (!source || !target) {
    throw new Error("Translation context is missing.");
  }
  if (!createdAt) {
    throw new Error("Invalid report timestamp.");
  }
}

/**
 * Persists an incorrect-translation report for review (Firestore: `translationReports`).
 * Align server-side security rules with your privacy model (auth optional vs required).
 */
export async function submitTranslationReport(payload: TranslationReportPayload): Promise<void> {
  validatePayload(payload);

  const user = auth.currentUser;
  const docData: Record<string, unknown> = {
    translationId: payload.translationId ?? null,
    sourceText: payload.sourceText.trim(),
    translatedText: payload.translatedText.trim(),
    sourceLanguage: payload.sourceLanguage ?? null,
    targetLanguage: payload.targetLanguage ?? null,
    issueDescription: payload.issueDescription.trim(),
    createdAt: payload.createdAt,
    conversationId: payload.conversationId ?? null,
    sessionId: payload.sessionId ?? null,
    uid: user?.uid ?? "anonymous",
    userEmail: user?.email ?? null,
    submittedAt: serverTimestamp(),
    platform: Platform.OS,
    platformVersion: String(Platform.Version),
  };

  await addDoc(collection(db, "translationReports"), docData);
}
