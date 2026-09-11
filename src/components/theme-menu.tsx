import { useEffect, useRef, useState } from 'react';
import { Palette } from 'lucide-react';
import { useTheme } from '../contexts/theme-context';
import {
  FIELD_ANCHORS,
  HUE_OPTIONS,
  INK_OPTIONS,
  MOTION_OPTIONS,
  PATTERN_OPTIONS,
  type ThemeHue,
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
      title={hint}
      onClick={onClick}
      className={`
        w-full rounded-lg px-2.5 py-1.5 text-left text-xs
        ${active ? 'bg-white/10 ring-1 ring-line' : 'hover:bg-white/10'}
      `}
    >
      {label}
    </button>
  );
}

function Swatches({
  active,
  onPick,
}: {
  active: ThemeHue;
  onPick: (hue: ThemeHue) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 px-1 pt-1">
      {HUE_OPTIONS.map((item) => {
        const selected = active === item.id;
        return (
          <button
            key={item.id}
            type="button"
            title={item.label}
            aria-label={item.label}
            onClick={() => onPick(item.id)}
            className={`h-6 w-6 rounded-full ${selected ? 'ring-1 ring-white' : 'ring-1 ring-line'}`}
            style={
              item.kind === 'palette'
                ? {
                    background:
                      'conic-gradient(from 120deg, #d07090, #7a6cff, #4aa0b0, #d4a050, #d07090)',
                  }
                : { background: item.mid }
            }
          />
        );
      })}
    </div>
  );
}

export function ThemeMenu() {
  const { theme, setInk, setHue, setField, setPattern, setMotion } = useTheme();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const current =
    PATTERN_OPTIONS.find((item) => item.id === theme.pattern)?.label ?? 'Temi';

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
        className="flex items-center gap-1 rounded-lg p-2 text-xs ring-1 ring-line hover:bg-white/10"
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <Palette className="h-3 w-3 stroke-1" />
        <span className="max-w-16 truncate">{current}</span>
      </button>

      <div
        role="dialog"
        aria-label="Temi"
        aria-hidden={!open}
        inert={!open || undefined}
        className={`
          vocari-pop absolute right-0 z-[70] mt-2 w-80
          origin-top-right rounded-lg p-3
          ring-1 ring-line
          ${open ? 'scale-100 opacity-100' : 'pointer-events-none scale-95 opacity-0'}
          transition-all duration-150 ease-out
        `}
      >
        <div className="mb-3 px-1 text-sm">Temi</div>
        <div className="flex flex-col gap-3">
          <div>
            <div className="mb-1 px-1 text-[10px] tracking-widest uppercase opacity-50">
              Tipografia
            </div>
            <div className="grid grid-cols-2 gap-1">
              {INK_OPTIONS.map((item) => (
                <Choice
                  key={item.id}
                  label={item.label}
                  hint={item.hint}
                  active={theme.ink === item.id}
                  onClick={() => setInk(item.id)}
                />
              ))}
            </div>
          </div>

          <div>
            <div className="px-1 text-[10px] tracking-widest uppercase opacity-50">Campo</div>
            <Swatches active={theme.hue} onPick={setHue} />
            <div className="px-1 pt-3">
              <div className="mb-2 flex justify-between text-[9px] uppercase tracking-wider opacity-50">
                <span>Light</span>
                <span>Dark</span>
              </div>
              <div className="relative h-7">
                <div className="pointer-events-none absolute inset-x-1 top-1/2 h-px -translate-y-1/2 bg-white/35" />
                <div className="relative flex h-full items-center justify-between">
                  {FIELD_ANCHORS.map((n) => {
                    const active = theme.field === n;
                    return (
                      <button
                        key={n}
                        type="button"
                        aria-label={`Campo ${n}%`}
                        title={`${n}%`}
                        onClick={() => setField(n)}
                        className={`
                          h-2.5 w-2.5 rounded-full transition-transform duration-150
                          ${active ? 'scale-125 bg-white' : 'bg-transparent ring-1 ring-white/45 hover:bg-white/25'}
                        `}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="mb-1 px-1 text-[10px] tracking-widest uppercase opacity-50">
              Pattern
            </div>
            <div className="grid grid-cols-2 gap-1">
              {PATTERN_OPTIONS.map((item) => (
                <Choice
                  key={item.id}
                  label={item.label}
                  hint={item.hint}
                  active={theme.pattern === item.id}
                  onClick={() => setPattern(item.id)}
                />
              ))}
            </div>
          </div>

          <div>
            <div className="mb-1 px-1 text-[10px] tracking-widest uppercase opacity-50">
              Movimento
            </div>
            <div className="grid grid-cols-2 gap-1">
              {MOTION_OPTIONS.map((item) => (
                <Choice
                  key={item.id}
                  label={item.label}
                  hint={item.hint}
                  active={theme.motion === item.id}
                  onClick={() => setMotion(item.id)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
