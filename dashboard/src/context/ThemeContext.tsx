import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { useSettings } from "./SettingsContext";

type Theme = "light" | "dark";
const THEME_KEY = "pref_theme";
const SCALE_KEY = "pref_font_scale";
const MIN = 0.9;
const MAX = 1.4;
const STEP = 0.1;

interface ThemeCtx {
  theme: Theme;
  toggleTheme: () => void;
  fontScale: number;
  setFontScale: (s: number) => void;
  incFont: () => void;
  decFont: () => void;
  resetFont: () => void;
  MIN: number;
  MAX: number;
}

const ThemeContext = createContext<ThemeCtx | null>(null);
export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
};

const read = <T,>(key: string, fallback: T): T => {
  try {
    const v = localStorage.getItem(key);
    return v == null ? fallback : (JSON.parse(v) as T);
  } catch {
    return fallback;
  }
};

const clampScale = (s: number) => Math.min(MAX, Math.max(MIN, Math.round(s * 10) / 10));

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { resolved } = useSettings();
  const hasStoredTheme = useRef<boolean>((() => {
    try {
      return localStorage.getItem(THEME_KEY) != null;
    } catch {
      return false;
    }
  })());
  const [theme, setTheme] = useState<Theme>(() => read<Theme>(THEME_KEY, "light"));
  const [fontScale, setFontScaleState] = useState<number>(() => clampScale(read<number>(SCALE_KEY, 1)));

  // Apply the admin's default theme for viewers who haven't chosen one yet.
  useEffect(() => {
    if (!hasStoredTheme.current) setTheme(resolved.defaultTheme);
  }, [resolved.defaultTheme]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    try {
      localStorage.setItem(THEME_KEY, JSON.stringify(theme));
    } catch { /* ignore */ }
  }, [theme]);

  useEffect(() => {
    document.documentElement.style.fontSize = `${16 * fontScale}px`;
    try {
      localStorage.setItem(SCALE_KEY, JSON.stringify(fontScale));
    } catch { /* ignore */ }
  }, [fontScale]);

  const setFontScale = (s: number) => setFontScaleState(clampScale(s));

  return (
    <ThemeContext.Provider
      value={{
        theme,
        toggleTheme: () => setTheme((t) => (t === "dark" ? "light" : "dark")),
        fontScale,
        setFontScale,
        incFont: () => setFontScaleState((s) => clampScale(s + STEP)),
        decFont: () => setFontScaleState((s) => clampScale(s - STEP)),
        resetFont: () => setFontScaleState(1),
        MIN,
        MAX,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};
