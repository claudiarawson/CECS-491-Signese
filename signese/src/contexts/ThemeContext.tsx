import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

type ThemeMode = "light" | "dark";

type ThemeColors = {
  background: string;
  card: string;
  text: string;
  subtext: string;
  border: string;
  primary: string;
};

type ThemeContextType = {
  theme: ThemeMode;
  colors: ThemeColors;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
  loading: boolean;
};

/** Matches `aslConnectTheme`: glass surfaces on gradient screens (ASL Connect–style UI). */
const LIGHT_COLORS: ThemeColors = {
  background: "transparent",
  card: "rgba(255,255,255,0.10)",
  text: "#FFFFFF",
  subtext: "rgba(255,255,255,0.72)",
  border: "rgba(255,255,255,0.16)",
  primary: "#F472B6",
};

/** Slightly deeper glass on dark preference (still maroon/purple gradient–friendly). */
const DARK_COLORS: ThemeColors = {
  background: "transparent",
  card: "rgba(255,255,255,0.08)",
  text: "#FFFFFF",
  subtext: "rgba(255,255,255,0.68)",
  border: "rgba(255,255,255,0.14)",
  primary: "#EC4899",
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

  const colors = theme === "light" ? LIGHT_COLORS : DARK_COLORS;

  const value = useMemo(
    () => ({
      theme,
      colors,
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