export const THEME_STORAGE_KEY = 'vocari-theme';

export type ThemeInk = 'light' | 'dark';
export type ThemeAccent = 'cyan' | 'violet' | 'rose' | 'amber' | 'mint';
export type ThemeBackdrop = 'mist' | 'aurora' | 'tide' | 'quiet' | 'grain';

export type VocariTheme = {
  ink: ThemeInk;
  accent: ThemeAccent;
  backdrop: ThemeBackdrop;
};

export const DEFAULT_THEME: VocariTheme = {
  ink: 'light',
  accent: 'cyan',
  backdrop: 'mist',
};

export const INK_OPTIONS: { id: ThemeInk; label: string; hint: string }[] = [
  { id: 'light', label: 'Chiara', hint: 'Testo chiaro su fondo scuro' },
  { id: 'dark', label: 'Scura', hint: 'Testo scuro su fondo chiaro' },
];

export const ACCENT_OPTIONS: { id: ThemeAccent; label: string; swatch: string }[] = [
  { id: 'cyan', label: 'Ciano', swatch: '#7ec8d4' },
  { id: 'violet', label: 'Viola', swatch: '#8b7cff' },
  { id: 'rose', label: 'Rosa', swatch: '#e08aa8' },
  { id: 'amber', label: 'Ambra', swatch: '#d4a574' },
  { id: 'mint', label: 'Menta', swatch: '#7ebfa3' },
];

export const BACKDROP_OPTIONS: { id: ThemeBackdrop; label: string; hint: string }[] = [
  { id: 'mist', label: 'Nebbia', hint: 'Macchie lente, poco contrasto' },
  { id: 'aurora', label: 'Aurora', hint: 'Un po’ più di colore' },
  { id: 'tide', label: 'Onde', hint: 'Fasce orizzontali' },
  { id: 'grain', label: 'Grana', hint: 'Fondo fermo + texture' },
  { id: 'quiet', label: 'Calmo', hint: 'Tinta unita, zero animazione' },
];

export function parseTheme(raw: unknown): VocariTheme {
  if (!raw || typeof raw !== 'object') return DEFAULT_THEME;
  const row = raw as Partial<VocariTheme>;
  return {
    ink: row.ink === 'dark' ? 'dark' : 'light',
    accent: ACCENT_OPTIONS.some((item) => item.id === row.accent) ? (row.accent as ThemeAccent) : 'cyan',
    backdrop: BACKDROP_OPTIONS.some((item) => item.id === row.backdrop)
      ? (row.backdrop as ThemeBackdrop)
      : 'mist',
  };
}

export function loadTheme(): VocariTheme {
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY);
    if (!raw) return DEFAULT_THEME;
    return parseTheme(JSON.parse(raw));
  } catch {
    return DEFAULT_THEME;
  }
}

export function saveTheme(theme: VocariTheme) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(theme));
  } catch {
    // ignore
  }
}

export function applyThemeToDocument(theme: VocariTheme) {
  const root = document.documentElement;
  root.dataset.ink = theme.ink;
  root.dataset.accent = theme.accent;
  root.dataset.backdrop = theme.backdrop;
}
