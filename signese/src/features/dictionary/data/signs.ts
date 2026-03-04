// src/dictionary/data/signs.ts
import type { Sign } from "../types";

export const SIGNS: Sign[] = [
  {
    id: "hello",
    word: "Hello",
    mediaUrl: "", // put an image url later (or leave blank for now)
    definition: "Used as a greeting or to begin a conversation.",
    howToSign:
      "Dominant flat hand with palm facing outward near your forehead moves away from the head in a small wave.",
    note:
      "This sign is the base. In the real world you’ll see variations depending on tone/context.",
    categoryId: "greetings",
    source: "featured",
  },
  {
    id: "thank-you",
    word: "Thank you",
    mediaUrl: "",
    definition: "Expression of gratitude.",
    howToSign: "Touch fingertips to chin then move hand forward.",
    note: "Add a nod or warm facial expression to match tone.",
    categoryId: "greetings",
    source: "featured",
  },
  {
    id: "wow",
    word: "Wow",
    mediaUrl: "",
    definition: "Used to show amazement or surprise.",
    howToSign: "Bring one hand near mouth then move outward as your face shows surprise.",
    note: "Facial expression is key.",
    categoryId: "general",
    source: "featured",
  },
  {
    id: "pah",
    word: "Pah",
    mediaUrl: "",
    definition: "Community slang—an expressive reaction term (example).",
    howToSign: "Community-submitted sign; see media/instructions from contributor.",
    note: "This is a community sign and may vary by region/group.",
    categoryId: "slang",
    source: "community",
  },
];