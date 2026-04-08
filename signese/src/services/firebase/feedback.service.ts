import { auth, db, storage } from "./firebase.config";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { Platform } from "react-native";

export type FeedbackCategory = "Bug" | "Suggestion" | "Improvement" | "Other";

export interface FeedbackPayload {
  category: FeedbackCategory;
  message: string;
  imageUri?: string | null;
}

async function uploadFeedbackImage(userId: string, uri: string): Promise<string> {
  // Expo returns a file:// URI; fetch -> blob is the most portable way to upload
  const res = await fetch(uri);
  const blob = await res.blob();

  const fileName = `feedback_${Date.now()}.jpg`;
  const objectRef = ref(storage, `feedback/${userId}/${fileName}`);

  await uploadBytes(objectRef, blob);
  return getDownloadURL(objectRef);
}

export async function submitFeedback(payload: FeedbackPayload): Promise<void> {
  const user = auth.currentUser;

  const uid = user?.uid ?? "anonymous";
  const userEmail = user?.email ?? null;

  let imageUrl: string | null = null;
  if (payload.imageUri) {
    try {
      imageUrl = await uploadFeedbackImage(uid, payload.imageUri);
    } catch (error) {
      console.warn("Feedback image upload failed; saving text-only feedback", error);
    }
  }

  await addDoc(collection(db, "feedback"), {
    category: payload.category,
    message: payload.message.trim(),
    imageUrl,
    uid,
    userEmail,
    createdAt: serverTimestamp(),
    // Firestore does not allow `undefined` values. Keep this a string or null.
    platform: Platform.OS,
    platformVersion: String(Platform.Version),
  });
}

