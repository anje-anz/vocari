import { useEffect, useRef, useState } from 'react';
import { Palette } from 'lucide-react';
import { useTheme } from '../contexts/theme-context';
import {
  ACCENT_OPTIONS,
  BACKDROP_OPTIONS,
  INK_OPTIONS,
} from '../lib/theme';

function Choice({
  label,
  hint,
  active,
  onClick,
}: {
  label: string;
  hint?: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        flex w-full flex-col rounded-lg px-2.5 py-1.5 text-left text-xs
        ${active ? 'bg-cyan-50/15 ring-1 ring-cyan-50/40' : 'hover:bg-cyan-50/10'}
      `}
    >
      <span>{label}</span>
      {hint && <span className="text-[10px] opacity-50">{hint}</span>}
    </button>
  );
}

export function ThemeMenu() {
  const { theme, setInk, setAccent, setBackdrop } = useTheme();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const current =
    BACKDROP_OPTIONS.find((item) => item.id === theme.backdrop)?.label ?? 'Temi';

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      const root = rootRef.current;
      if (!root) return;
      if (event.target instanceof Node && !root.contains(event.target)) {
        setOpen(false);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('pointerdown', onPointer, true);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('pointerdown', onPointer, true);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-1 rounded-lg p-2 text-xs ring-1 ring-cyan-50/20 hover:bg-cyan-50/10"
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <Palette className="h-3 w-3" />
        <span className="max-w-16 truncate">{current}</span>
      </button>

      <div
        role="dialog"
        aria-label="Temi"
        className={`
          absolute right-0 z-[70] mt-2 w-[28rem]
          origin-top-right rounded-xl p-3
          ring-1 ring-cyan-50/20 backdrop-blur-lg
          ${open ? 'scale-100 opacity-100' : 'pointer-events-none scale-95 opacity-0'}
          transition-all duration-150 ease-out
        `}
        style={{ background: 'color-mix(in oklab, var(--vocari-panel) 82%, transparent)' }}
      >
        <div className="mb-3 px-1 text-sm">Temi</div>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <div className="px-1 text-[10px] tracking-widest uppercase opacity-50">Tipografia</div>
            {INK_OPTIONS.map((item) => (
              <Choice
                key={item.id}
                label={item.label}
                hint={item.hint}
                active={theme.ink === item.id}
                onClick={() => setInk(item.id)}
              />
            ))}
            <div className="mt-2 px-1 text-[10px] tracking-widest uppercase opacity-50">Colore</div>
            <div className="flex flex-wrap gap-2 px-1 pt-1">
              {ACCENT_OPTIONS.map((item) => {
                const active = theme.accent === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    title={item.label}
                    aria-label={item.label}
                    onClick={() => setAccent(item.id)}
                    className={`h-6 w-6 rounded-full ${active ? 'ring-2 ring-white/80' : 'ring-1 ring-white/20'}`}
                    style={{ background: item.swatch }}
                  />
                );
              })}
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <div className="px-1 text-[10px] tracking-widest uppercase opacity-50">Sfondo</div>
            {BACKDROP_OPTIONS.map((item) => (
              <Choice
                key={item.id}
                label={item.label}
                hint={item.hint}
                active={theme.backdrop === item.id}
                onClick={() => setBackdrop(item.id)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
