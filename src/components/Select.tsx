import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '../utils/cn';

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
    () => options.find((o) => o.id === selectedValue) ?? options[0],
    [options, selectedValue]
  );

  const selectedRef = useRef<HTMLButtonElement | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (expanded && selectedRef.current) {
      selectedRef.current.focus();
    }
  }, [expanded]);

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
    <div ref={rootRef} className={cn('relative w-fit', className)}>
      <button
        type="button"
        className="
          flex items-center justify-between
          w-full p-2
          text-sm
          rounded-lg
          ring-1 ring-line
          hover:bg-white/10
        "
        onClick={() => setExpanded((prev) => !prev)}
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
          <ChevronRight className="w-4 h-4 stroke-1" />
        </span>
      </button>

      <div
        className={`
          vocari-pop absolute left-0 right-0 z-50 mt-2 min-w-full
          origin-top overflow-hidden rounded-lg ring-1 ring-line
          ${expanded ? 'scale-y-100 opacity-100' : 'pointer-events-none scale-y-0 opacity-0'}
          transition-all duration-150 ease-out
        `}
        aria-hidden={!expanded}
        inert={!expanded || undefined}
      >
        <div className="max-h-60 overflow-y-auto">
          {options.map((option) => {
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
                      ? 'bg-white/10 text-white'
                      : 'text-white/80 hover:bg-white/10'
                  }
                `}
              >
                <span
                  className={`
                    text-xs font-medium mr-2
                    ${isSelected ? 'text-white' : 'text-white/40'}
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
  );
};
