import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export type ThemeMode = "light" | "dark";

/** Semantic colors for glass/gradient UI. Light mode uses yellow–orange–blue–pink accents on a soft gradient. */
export type ThemeColors = {
  background: string;
  card: string;
  text: string;
  subtext: string;
  border: string;
  /** Primary CTA / emphasis (pink) */
  primary: string;
  accentOrange: string;
  accentBlue: string;
  accentYellow: string;
  /** Settings / account header strip */
  headerScrim: string;
  /** Camera wells, deep surfaces (translate, cards) */
  panel: string;
  /** Control strips, secondary panels */
  panelMuted: string;
  controlWell: string;
  controlBorder: string;
};

type ThemeContextType = {
  theme: ThemeMode;
  colors: ThemeColors;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
  loading: boolean;
};

const LIGHT_COLORS: ThemeColors = {
  background: "transparent",
  card: "rgba(255,255,255,0.78)",
  text: "#0F172A",
  subtext: "rgba(15,23,42,0.68)",
  border: "rgba(15,23,42,0.14)",
  primary: "#DB2777",
  accentOrange: "#EA580C",
  accentBlue: "#2563EB",
  accentYellow: "#CA8A04",
  headerScrim: "rgba(255,255,255,0.62)",
  panel: "rgba(255,255,255,0.52)",
  panelMuted: "rgba(255,255,255,0.72)",
  controlWell: "rgba(15,23,42,0.07)",
  controlBorder: "rgba(15,23,42,0.12)",
};

const DARK_COLORS: ThemeColors = {
  background: "transparent",
  card: "rgba(255,255,255,0.08)",
  text: "#FFFFFF",
  subtext: "rgba(255,255,255,0.68)",
  border: "rgba(255,255,255,0.14)",
  primary: "#EC4899",
  accentOrange: "#FB923C",
  accentBlue: "#38BDF8",
  accentYellow: "#FACC15",
  headerScrim: "rgba(8,2,10,0.2)",
  panel: "rgba(8, 4, 18, 0.72)",
  panelMuted: "rgba(12, 6, 24, 0.78)",
  controlWell: "rgba(255,255,255,0.14)",
  controlBorder: "rgba(255,255,255,0.22)",
};

const THEME_STORAGE_KEY = "app_theme";

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>("dark");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedTheme === "light" || savedTheme === "dark") {
          setThemeState(savedTheme);
        }
      } catch (error) {
        console.warn("Failed to load theme", error);
      } finally {
        setLoading(false);
      }
    };

    void loadTheme();
  }, []);

  const setTheme = async (mode: ThemeMode) => {
    try {
      setThemeState(mode);
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (error) {
      console.warn("Failed to save theme", error);
    }
  };

  const toggleTheme = async () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    await setTheme(nextTheme);
  };

  const value = useMemo(
    () => ({
      theme,
      colors: theme === "light" ? LIGHT_COLORS : DARK_COLORS,
      toggleTheme,
      setTheme,
      loading,
    }),
    [theme, loading]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used inside ThemeProvider");
  }
  return context;
}
