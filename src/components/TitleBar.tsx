import React from 'react';
import { Minus, Square, X } from 'lucide-react';
import { ThemeMenu } from './theme-menu';
import logoUrl from '/logo_var.svg'; // Assicurati che sia in public/

export const TitleBar: React.FC<{ onRequestClose?: () => void }> = ({ onRequestClose }) => {
  return (
    <div className="relative z-50 h-10 w-full">
      <div className="flex items-center h-full w-full backdrop-blur-sm backdrop-brightness-110 border-b border-cyan-50/20 select-none">
        <div
          className="flex items-center h-full px-4 space-x-2"
          style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
        >
          <img src={logoUrl} alt="Vocari" className="h-4" />
          <span className="text-sm">V1</span>
        </div>

        <div
          className="flex-1 h-full"
          style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
        />

        <div
          className="flex items-center space-x-4 pr-4"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          <ThemeMenu />

          <button
            type="button"
            className="w-10 h-8 hover:bg-gray-50/20 rounded-lg flex items-center justify-center"
            onClick={() => window.windowControls?.minimize()}
          >
            <Minus className="w-5 h-5 stroke-1" />
          </button>
          <button
            type="button"
            className="w-10 h-8 hover:bg-gray-50/20 rounded-lg flex items-center justify-center"
            onClick={() => window.windowControls?.maximize()}
          >
            <Square className="w-4 h-4 stroke-1" />
          </button>
          <button
            type="button"
            aria-label="Chiudi"
            className="w-10 h-8 hover:bg-gray-50/20 rounded-lg flex items-center justify-center"
            onClick={() => {
              if (window.windowControls?.close) window.windowControls.close();
              else onRequestClose?.();
            }}
          >
            <X className="w-5 h-5 stroke-1" />
          </button>
        </div>
      </div>
    </div>
  );
};
