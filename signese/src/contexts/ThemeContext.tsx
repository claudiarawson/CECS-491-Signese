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

const LIGHT_COLORS: ThemeColors = {
  background: "#F6FBFA",
  card: "#FFFFFF",
  text: "#163C39",
  subtext: "#5B7A75",
  border: "#D9E7E4",
  primary: "#52B7A5",
};

const DARK_COLORS: ThemeColors = {
  background: "#0F1720",
  card: "#1B2630",
  text: "#F3F7F6",
  subtext: "#A7B7B3",
  border: "#2B3A45",
  primary: "#52B7A5",
};

const THEME_STORAGE_KEY = "app_theme";

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>("light");
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