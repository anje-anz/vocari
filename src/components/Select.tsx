import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronRight } from 'lucide-react';

export type SelectId = string;

export interface SelectOption {
  id: SelectId;
  label: string;
}

interface SelectProps {
  options: SelectOption[];
  value?: SelectId;
  onChange?: (value: SelectId) => void;
  className?: string;
  startIcon?: React.ReactNode;
}

export const Select: React.FC<SelectProps> = ({
  options,
  value,
  onChange,
  className = '',
  startIcon,
}) => {
  const [internalValue, setInternalValue] = useState<SelectId | undefined>(
    () => options[0]?.id
  );
  const [expanded, setExpanded] = useState(false);

  const selectedValue = value ?? internalValue;

  const selectedOption = useMemo(
    () => options.find(o => o.id === selectedValue) ?? options[0],
    [options, selectedValue]
  );

  const selectedRef = useRef<HTMLButtonElement | null>(null);

  // ✅ nuovo: ref del “contenitore” per rilevare click fuori
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (expanded && selectedRef.current) {
      selectedRef.current.focus();
    }
  }, [expanded]);

  // ✅ nuovo: chiudi se clicchi fuori / Escape
  useEffect(() => {
    if (!expanded) return;

    const onPointerDown = (e: PointerEvent) => {
      const root = rootRef.current;
      if (!root) return;
      const target = e.target as Node | null;
      if (target && !root.contains(target)) {
        setExpanded(false);
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setExpanded(false);
    };

    window.addEventListener('pointerdown', onPointerDown, true);
    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('pointerdown', onPointerDown, true);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [expanded]);

  const handleSelect = (id: SelectId) => {
    if (value === undefined) {
      setInternalValue(id);
    }
    onChange?.(id);
    setExpanded(false);
  };

  return (
    <div className={`flex justify-center ${className}`}>
      {/* ✅ rootRef qui: include header + dropdown */}
      <div ref={rootRef} className="relative w-fit">
        {/* Header */}
        <button
          type="button"
          className="
            flex items-center justify-between
            w-full p-2
            text-sm
            rounded-lg
            ring-1 ring-cyan-50/20
            hover:bg-cyan-50/10
            backdrop-blur-sm
          "
          onClick={() => setExpanded(prev => !prev)}
          disabled={options.length === 0}
        >
          <span className="flex min-w-0 items-center gap-1">
            {startIcon && <span className="shrink-0">{startIcon}</span>}
            <span className="truncate">{selectedOption?.label ?? 'Seleziona'}</span>
          </span>

          <span
            className={`
              ml-2 text-xs opacity-80
              transition-transform duration-200 ease-out
              ${expanded ? 'rotate-90' : 'rotate-0'}
            `}
          >
            <ChevronRight className="w-4 h-4" />
          </span>
        </button>

        {/* Dropdown flottante */}
        <div
          className={`
            absolute w-fit left-0 right-0 mt-4
            z-50 overflow-hidden
            origin-top
            rounded-lg
            ring-1 ring-cyan-50/20
            backdrop-blur-lg
            ${
              expanded
                ? 'scale-y-100 opacity-100'
                : 'scale-y-0 opacity-0 pointer-events-none'
            }
            transition-all duration-150 ease-out
          `}
        >
          <div className="max-h-60 overflow-y-auto">
            {options.map(option => {
              const isSelected = option.id === selectedOption?.id;

              return (
                <button
                  key={option.id}
                  type="button"
                  ref={isSelected ? selectedRef : undefined}
                  onClick={() => handleSelect(option.id)}
                  className={`
                    flex w-full items-center text-left
                    px-2 py-2
                    text-sm
                    transition-colors duration-150
                    ${
                      isSelected
                        ? 'bg-cyan-50/10 text-cyan-100'
                        : 'text-white/80 hover:bg-cyan-50/5'
                    }
                  `}
                >
                  <span
                    className={`
                      text-xs font-medium mr-2
                      ${isSelected ? 'text-cyan-300' : 'text-white/40'}
                    `}
                  >
                    {isSelected ? '●' : '○'}
                  </span>
                  <span className="truncate">{option.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
