import { Dimensions, PixelRatio } from "react-native";

const { width, height } = Dimensions.get("window");

export const BASE_WIDTH = 375;
export const BASE_HEIGHT = 667;

export const scale = (size: number) => (width / BASE_WIDTH) * size;
export const verticalScale = (size: number) => (height / BASE_HEIGHT) * size;
export const moderateScale = (size: number, factor = 0.5) =>
  size + (scale(size) - size) * factor;

export const fontScale = (size: number) =>
  moderateScale(size) / PixelRatio.getFontScale();

export const getDeviceDensity = (screenWidth: number, screenHeight: number) => {
  if (screenHeight <= 670 || screenWidth <= 350) return 0.84;
  if (screenHeight <= 760 || screenWidth <= 390) return 0.92;
  return 1;
};

/** Layout tokens for multi-column / shell UIs (e.g. translate history sidebar). */
export const AppShell = {
  sidebarWidth: 300,
  wideMinWidth: 880,
} as const;
