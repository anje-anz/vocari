/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import {
  applyThemeToDocument,
  loadTheme,
  saveTheme,
  snapField,
  type ThemeHue,
  type ThemeInk,
  type ThemeMotion,
  type ThemePattern,
  type VocariTheme,
} from '../lib/theme';

type ThemeContextValue = {
  theme: VocariTheme;
  setInk: (ink: ThemeInk) => void;
  setHue: (hue: ThemeHue) => void;
  setField: (field: number) => void;
  setPattern: (pattern: ThemePattern) => void;
  setMotion: (motion: ThemeMotion) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme deve essere usato dentro ThemeProvider');
  return ctx;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<VocariTheme>(() => {
    const loaded = loadTheme();
    applyThemeToDocument(loaded);
    return loaded;
  });

  const commit = useCallback((next: VocariTheme) => {
    setTheme(next);
    applyThemeToDocument(next);
    saveTheme(next);
  }, []);

  const setInk = useCallback((ink: ThemeInk) => commit({ ...theme, ink }), [commit, theme]);
  const setHue = useCallback((hue: ThemeHue) => commit({ ...theme, hue }), [commit, theme]);
  const setField = useCallback(
    (field: number) => commit({ ...theme, field: snapField(field) }),
    [commit, theme]
  );
  const setPattern = useCallback(
    (pattern: ThemePattern) => commit({ ...theme, pattern }),
    [commit, theme]
  );
  const setMotion = useCallback(
    (motion: ThemeMotion) => commit({ ...theme, motion }),
    [commit, theme]
  );

  const value = useMemo(
    () => ({ theme, setInk, setHue, setField, setPattern, setMotion }),
    [theme, setInk, setHue, setField, setPattern, setMotion]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
