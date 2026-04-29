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
  loading: boolean;
  toggleTheme: () => Promise<void>;
  setTheme: (mode: ThemeMode) => Promise<void>;
};

const LIGHT_COLORS: ThemeColors = {
  background: "#F1F6F5",
  card: "#FFFFFF",
  text: "#111827",
  subtext: "#6B7280",
  border: "#E5ECEA",
  primary: "#53B1A3",
};

const DARK_COLORS: ThemeColors = {
  background: "#0F1720",
  card: "#18212B",
  text: "#F9FAFB",
  subtext: "#9CA3AF",
  border: "#253241",
  primary: "#53B1A3",
};

const STORAGE_KEY = "app_theme_mode";

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>("light");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(STORAGE_KEY);
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
      await AsyncStorage.setItem(STORAGE_KEY, mode);
    } catch (error) {
      console.warn("Failed to save theme", error);
    }
  };

  const toggleTheme = async () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    await setTheme(nextTheme);
  };

  const colors = theme === "dark" ? DARK_COLORS : LIGHT_COLORS;

  const value = useMemo(
    () => ({
      theme,
      colors,
      loading,
      toggleTheme,
      setTheme,
    }),
    [theme, loading]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }

  return context;
}