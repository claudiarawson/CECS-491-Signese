export type AslSignAsset = {
  id: string;
  label: string;
  category: "greetings";
  sourceVideoPath: string | null;
  previewGifPath: string | null;
};

// Centralized greeting sign dataset for Lesson 1.
// Keep components ID-driven and map assets through this file only.
export const ASL_GREETINGS: AslSignAsset[] = [
  {
    id: "hello",
    label: "Hello",
    category: "greetings",
    sourceVideoPath: null,
    previewGifPath: null,
  },
  {
    id: "hi",
    label: "Hi",
    category: "greetings",
    sourceVideoPath: null,
    previewGifPath: null,
  },
  {
    id: "good_morning",
    label: "Good Morning",
    category: "greetings",
    sourceVideoPath: null,
    previewGifPath: null,
  },
  {
    id: "how_are_you",
    label: "How Are You",
    category: "greetings",
    sourceVideoPath: null,
    previewGifPath: null,
  },
  {
    id: "nice_to_meet_you",
    label: "Nice To Meet You",
    category: "greetings",
    sourceVideoPath: "assets/asl/greetings/nice_to_meet_you/source.mp4",
    previewGifPath: "assets/asl/greetings/nice_to_meet_you/preview.gif",
  },
];

export const ASL_GREETINGS_BY_ID = Object.fromEntries(
  ASL_GREETINGS.map((sign) => [sign.id, sign])
);
