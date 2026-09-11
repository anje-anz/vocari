/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import {
  applyThemeToDocument,
  loadTheme,
  saveTheme,
  type ThemeAccent,
  type ThemeBackdrop,
  type ThemeInk,
  type VocariTheme,
} from '../lib/theme';

type ThemeContextValue = {
  theme: VocariTheme;
  setInk: (ink: ThemeInk) => void;
  setAccent: (accent: ThemeAccent) => void;
  setBackdrop: (backdrop: ThemeBackdrop) => void;
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
  const setAccent = useCallback(
    (accent: ThemeAccent) => commit({ ...theme, accent }),
    [commit, theme]
  );
  const setBackdrop = useCallback(
    (backdrop: ThemeBackdrop) => commit({ ...theme, backdrop }),
    [commit, theme]
  );

  const value = useMemo(
    () => ({ theme, setInk, setAccent, setBackdrop }),
    [theme, setInk, setAccent, setBackdrop]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
