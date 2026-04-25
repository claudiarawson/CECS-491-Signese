import { semanticColors } from "./colors";

/** Card, panel, and hairline tokens aligned with translate / dictionary shells. */
export const Surfaces = {
  hairline: "#E2E8E8",
  card: semanticColors.background.primary,
  cardMuted: semanticColors.background.secondary,
  border: "#D8E8E4",
  borderStrong: "#C6DEDA",
  accentWash: "#E8F2F0",
  pressed: "#D5E6E3",
} as const;
