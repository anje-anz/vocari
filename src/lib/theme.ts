import { fieldHex, hexToRgb, mixHex, rgbToHue, type Rgb } from './color';

export const THEME_STORAGE_KEY = 'vocari-theme';

export type ThemeInk = 'light' | 'dark';
export type ThemeHue = 'cyan' | 'violet' | 'rose' | 'amber' | 'mint' | 'dusk' | 'spectrum';
export type ThemePattern =
  | 'quiet'
  | 'pixel'
  | 'dither'
  | 'bends'
  | 'rays'
  | 'ether'
  | 'prism'
  | 'iris';
export type ThemeMotion = 'static' | 'live';

export type VocariTheme = {
  ink: ThemeInk;
  hue: ThemeHue;
  field: number;
  pattern: ThemePattern;
  motion: ThemeMotion;
};

export const DEFAULT_THEME: VocariTheme = {
  ink: 'light',
  hue: 'cyan',
  field: 75,
  pattern: 'iris',
  motion: 'live',
};

export const FIELD_ANCHORS = [0, 25, 50, 75, 100] as const;

export function snapField(value: number): number {
  return FIELD_ANCHORS.reduce((best, n) =>
    Math.abs(n - value) < Math.abs(best - value) ? n : best,
  );
}

export const INK_OPTIONS: { id: ThemeInk; label: string; hint: string }[] = [
  { id: 'light', label: 'Chiara', hint: 'Testo e bordi chiari' },
  { id: 'dark', label: 'Scura', hint: 'Testo e bordi scuri' },
];

export const HUE_OPTIONS: { id: ThemeHue; label: string; kind: 'hue' | 'palette'; mid: string }[] = [
  { id: 'cyan', label: 'Ciano', kind: 'hue', mid: '#4aa0b0' },
  { id: 'violet', label: 'Viola', kind: 'hue', mid: '#7a6cff' },
  { id: 'rose', label: 'Rosa', kind: 'hue', mid: '#d07090' },
  { id: 'amber', label: 'Ambra', kind: 'hue', mid: '#d4a050' },
  { id: 'mint', label: 'Menta', kind: 'hue', mid: '#5aaa88' },
  { id: 'dusk', label: 'Crepuscolo', kind: 'palette', mid: '#8a5a9a' },
  { id: 'spectrum', label: 'Spettro', kind: 'palette', mid: '#7a6cff' },
];

export const PATTERN_OPTIONS: { id: ThemePattern; label: string; hint: string }[] = [
  { id: 'quiet', label: 'Calmo', hint: 'Fondo a gradienti' },
  { id: 'pixel', label: 'Pixel', hint: 'Griglia che vive' },
  { id: 'dither', label: 'Dither', hint: 'Onde quantizzate' },
  { id: 'bends', label: 'Curve', hint: 'Bande di colore' },
  { id: 'rays', label: 'Raggi', hint: 'Luce volumetrica' },
  { id: 'ether', label: 'Etere', hint: 'Liquido lento' },
  { id: 'prism', label: 'Prisma', hint: 'Volume rifratto' },
  { id: 'iris', label: 'Iride', hint: 'Iridescenza' },
];

export const MOTION_OPTIONS: { id: ThemeMotion; label: string; hint: string }[] = [
  { id: 'static', label: 'Statico', hint: 'Fermo' },
  { id: 'live', label: 'Animato', hint: 'In movimento' },
];

const SPECTRUM = ['#ff4d8d', '#7ec8d4', '#8b7cff', '#d4a574', '#7ebfa3'];

function hueMid(id: ThemeHue): string {
  return HUE_OPTIONS.find((item) => item.id === id)?.mid ?? '#4aa0b0';
}

export function companions(hue: ThemeHue): [string, string, string, string, string] {
  if (hue === 'spectrum') return SPECTRUM as [string, string, string, string, string];
  if (hue === 'dusk') {
    return ['#d07090', '#7a6cff', '#8a5a9a', '#e08aa8', '#8b7cff'];
  }
  const mid = hueMid(hue);
  return [
    mid,
    mixHex(mid, '#fcfcf7', 0.38),
    mixHex(mid, '#08090c', 0.22),
    mixHex(mid, '#7a6cff', 0.42),
    mixHex(mid, '#d07090', 0.38),
  ];
}

export type ThemeColors = {
  field: string;
  fieldRgb: Rgb;
  tint: string;
  tintRgb: Rgb;
  tintHue: number;
  tintStr: number;
  palette: [string, string, string, string, string];
  paletteRgb: Rgb[];
  blobs: [string, string, string];
};

export function themeColors(theme: VocariTheme): ThemeColors {
  const mid = hueMid(theme.hue);
  const field = fieldHex(mid, theme.field);
  const palette = companions(theme.hue);
  const tintRgb = hexToRgb(mid);
  return {
    field,
    fieldRgb: hexToRgb(field),
    tint: mid,
    tintRgb,
    tintHue: rgbToHue(tintRgb),
    tintStr: theme.hue === 'spectrum' ? 0 : theme.hue === 'dusk' ? 0.28 : 0.55,
    palette,
    paletteRgb: palette.map(hexToRgb),
    blobs: [
      fieldHex(mixHex(palette[0], '#fcfcf7', 0.22), Math.max(0, theme.field - 18)),
      fieldHex(palette[3], theme.field),
      fieldHex(palette[2], Math.min(100, theme.field + 14)),
    ],
  };
}

const HUES = new Set<string>(HUE_OPTIONS.map((item) => item.id));
const PATTERNS = new Set<string>(PATTERN_OPTIONS.map((item) => item.id));

function isHue(value: unknown): value is ThemeHue {
  return typeof value === 'string' && HUES.has(value);
}

function isPattern(value: unknown): value is ThemePattern {
  return typeof value === 'string' && PATTERNS.has(value);
}

const OLD_PATTERN: Record<string, ThemePattern> = {
  mist: 'quiet',
  aurora: 'quiet',
  dots: 'dither',
  grain: 'dither',
  grid: 'pixel',
  sine: 'bends',
  tide: 'bends',
  glass: 'ether',
  quiet: 'quiet',
};

function clampField(value: unknown, tone?: string): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return snapField(value);
  }
  return tone === 'pale' ? 25 : 75;
}

export function parseTheme(raw: unknown): VocariTheme {
  if (!raw || typeof raw !== 'object') return DEFAULT_THEME;
  const row = raw as Partial<VocariTheme> & {
    accent?: string;
    backdrop?: string;
    tone?: string;
  };
  const hue = isHue(row.hue) ? row.hue : isHue(row.accent) ? row.accent : 'cyan';
  let pattern: ThemePattern = isPattern(row.pattern) ? row.pattern : 'iris';
  if (!row.pattern && row.backdrop && OLD_PATTERN[row.backdrop]) {
    pattern = OLD_PATTERN[row.backdrop];
  }
  return {
    ink: row.ink === 'dark' ? 'dark' : 'light',
    hue,
    field: clampField(row.field, row.tone),
    pattern,
    motion: row.motion === 'static' ? 'static' : 'live',
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
  const colors = themeColors(theme);
  root.dataset.ink = theme.ink;
  root.dataset.pattern = theme.pattern;
  root.dataset.motion = theme.motion;
  root.style.setProperty('--vocari-bg', colors.field);
  root.style.setProperty('--vocari-blob-1', colors.blobs[0]);
  root.style.setProperty('--vocari-blob-2', colors.blobs[1]);
  root.style.setProperty('--vocari-blob-3', colors.blobs[2]);
  root.style.removeProperty('--vocari-hero');
  root.style.removeProperty('--color-cyan-50');
  root.style.removeProperty('--color-cyan-100');
  root.style.removeProperty('--color-cyan-300');
}
