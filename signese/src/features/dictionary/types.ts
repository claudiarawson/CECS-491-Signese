// src/dictionary/types.ts

export type Category = {
  id: string;
  label: string;
  icon?: string; // emoji or icon name
};

export type SignSource = "featured" | "community";

export type Sign = {
  id: string;                 // route key
  word: string;               // "Hello"
  mediaUrl?: string;          // image/video URL (can be placeholder)
  definition: string;         // short definition
  howToSign: string;          // instructions
  note?: string;              // optional note
  categoryId?: string;        // optional if you’re not using categories yet
  source: SignSource;         // featured vs community (changes card color)
};