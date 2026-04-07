export type ProfileIcon = {
  id: string;
  emoji: string;
  label: string;
  starsRequired: number;
};

export type UserProfileIconState = {
  selectedIcon: string;
  unlockedIconIds: string[];
};

export const PROFILE_ICONS: ProfileIcon[] = [
  { id: "seedling", emoji: "🌱", label: "Seedling", starsRequired: 0 },
  { id: "sparkles", emoji: "✨", label: "Sparkles", starsRequired: 5 },
  { id: "rocket", emoji: "🚀", label: "Rocket", starsRequired: 10 },
  { id: "crown", emoji: "👑", label: "Crown", starsRequired: 15 },
  { id: "unicorn", emoji: "🦄", label: "Unicorn", starsRequired: 20 },
  { id: "fire", emoji: "🔥", label: "Fire", starsRequired: 25 },
];

export const DEFAULT_PROFILE_ICON_ID = PROFILE_ICONS[0].id;

export function getProfileIconById(id?: string | null): ProfileIcon {
  return (
    PROFILE_ICONS.find((icon) => icon.id === id) ??
    PROFILE_ICONS[0]
  );
}