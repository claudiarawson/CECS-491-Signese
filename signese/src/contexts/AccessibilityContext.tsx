import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { readLocalJson, writeLocalJson } from "../storage/localJsonFile";

type AccessibilitySettings = {
  captions: boolean;
  tts: boolean;
  largeText: boolean;
};

type AccessibilityContextType = AccessibilitySettings & {
  setCaptions: (value: boolean) => void;
  setTts: (value: boolean) => void;
  setLargeText: (value: boolean) => void;
  textScale: number;
  loading: boolean;
};

const SETTINGS_FILE = "accessibility_settings.json";
const WEB_SETTINGS_KEY = "signese_accessibility_settings";

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [captions, setCaptions] = useState(true);
  const [tts, setTts] = useState(true);
  const [largeText, setLargeText] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const parsed = await readLocalJson<Partial<AccessibilitySettings> | null>(
          SETTINGS_FILE,
          WEB_SETTINGS_KEY,
          null
        );
        if (parsed) {
          setCaptions(typeof parsed.captions === "boolean" ? parsed.captions : true);
          setTts(typeof parsed.tts === "boolean" ? parsed.tts : true);
          setLargeText(typeof parsed.largeText === "boolean" ? parsed.largeText : false);
        }
      } catch (error) {
        console.warn("Failed to load accessibility settings", error);
      } finally {
        setLoading(false);
      }
    };

    void loadSettings();
  }, []);

  useEffect(() => {
    if (loading) return;

    const saveSettings = async () => {
      try {
        await writeLocalJson(SETTINGS_FILE, WEB_SETTINGS_KEY, { captions, tts, largeText });
      } catch (error) {
        console.warn("Failed to save accessibility settings", error);
      }
    };

    void saveSettings();
  }, [captions, tts, largeText, loading]);

  const value = useMemo(
    () => ({
      captions,
      tts,
      largeText,
      setCaptions,
      setTts,
      setLargeText,
      textScale: largeText ? 1.15 : 1,
      loading,
    }),
    [captions, tts, largeText, loading]
  );

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error("useAccessibility must be used within AccessibilityProvider");
  }
  return context;
}