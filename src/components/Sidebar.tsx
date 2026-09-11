import React from 'react';
import { AudioWaveform, Radio, Settings, ExternalLink } from 'lucide-react';
import { useLive } from '../contexts/live-context';
import { useNav } from '../contexts/nav-context';

const hit = 'hover:bg-white/10';
const on = 'bg-white/10 ring-1 ring-line';

export const Sidebar: React.FC = () => {
  const { view, goVoce, goLive } = useLive();
  const { open } = useNav();

  return (
    <div className={`
      relative z-40 h-full ${open ? 'w-64' : 'w-16'}
      flex flex-col gap-3 pt-3 pb-3
      backdrop-blur-sm
      transition-all duration-500 ease-out
    `}>
      <div className="absolute inset-y-0 right-0 w-px bg-white/20" />

      <div className="px-3">
        <button
          type="button"
          onClick={goVoce}
          className={`relative flex h-10 w-full items-center rounded-lg ${view === 'voce' ? on : hit}`}
        >
          <AudioWaveform className="ml-2 h-6 w-6 stroke-1" />
          {open && <span className="absolute ml-10 text-nowrap">Voce</span>}
        </button>
      </div>

      <div className="px-3">
        <button
          type="button"
          onClick={goLive}
          className={`relative flex h-10 w-full items-center rounded-lg ${view === 'live' ? on : hit}`}
        >
          <Radio className="ml-2 h-6 w-6 stroke-1" />
          {open && <span className="absolute ml-10 text-nowrap">Live</span>}
        </button>
      </div>

      <div className="mt-auto px-3">
        <button type="button" className={`relative flex h-10 w-full items-center rounded-lg ${hit}`}>
          <Settings className="ml-2 h-6 w-6 stroke-1" />
          {open && <span className="absolute ml-10 text-nowrap">Impostazioni</span>}
        </button>
      </div>

      <div className="px-3">
        <button type="button" className={`relative flex h-10 w-full items-center rounded-lg ${hit}`}>
          <ExternalLink className="ml-2 h-6 w-6 stroke-1" />
          {open && <span className="absolute ml-10 text-nowrap">Collegamenti Esterni</span>}
        </button>
      </div>
    </div>
  );
};
