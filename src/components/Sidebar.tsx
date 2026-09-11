import React from 'react';
import {
  AudioWaveform, Radio, Settings, ExternalLink,
  PanelLeftClose, PanelLeftOpen, ChevronRight,
} from 'lucide-react';
import { useLive } from '../contexts/live-context';

export const Sidebar: React.FC = () => {
  const { view, goVoce, goLive } = useLive();
  const [open, setOpen] = React.useState(true);
  const [collapsed, setCollapsed] = React.useState(true);

  return (
    <div className={`
      relative z-40 h-full ${open ? 'w-64' : 'w-16'}
      flex flex-col space-y-1
      backdrop-blur-sm
      transition-all duration-500 ease-out
    `}>
      <div className="absolute right-0 h-full w-[1px] bg-linear-to-b from-cyan-50 to-cyan-100 opacity-10" />
      <div className="h-2 w-full" />
      <button
        type="button"
        className={`
          absolute w-fit h-fit ml-2 top-3 z-40
          ${open ? 'left-64' : 'left-16'}
          backdrop-blur-sm
          border border-white/20 rounded-lg hover:bg-cyan-50/10
          transition-all duration-500 ease-out
        `}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? <PanelLeftClose className="w-5 h-5 stroke-1 m-2" /> : <PanelLeftOpen className="w-5 h-5 stroke-1 m-2" />}
      </button>

      <div className="flex justify-center-safe px-3">
        <button
          type="button"
          onClick={goVoce}
          className={`relative flex w-full rounded-lg overflow-hidden ${
            view === 'voce' ? 'ring ring-cyan-50/80 bg-cyan-50/10' : 'hover:bg-cyan-50/10'
          }`}
        >
          <AudioWaveform className="w-6 h-6 stroke-1 m-2" />
          {open && <div className="absolute flex self-center ml-10 text-nowrap">Voce</div>}
        </button>
      </div>

      <div className="flex justify-center-safe px-3">
        <button
          type="button"
          onClick={goLive}
          className={`relative flex w-full rounded-lg overflow-hidden ${
            view === 'live' ? 'ring ring-cyan-50/80 bg-cyan-50/10' : 'hover:bg-cyan-50/10'
          }`}
        >
          <Radio className="w-6 h-6 stroke-1 m-2" />
          {open && <div className="absolute flex self-center ml-10 text-nowrap">Live</div>}
        </button>
      </div>

      <div className="flex justify-center-safe px-3 mt-auto">
        <div className="flex flex-col w-full rounded-lg overflow-hidden ring-1 ring-cyan-50/10">
          <button
            type="button"
            className="flex items-center justify-between w-full px-2 py-2 rounded-lg hover:bg-cyan-50/10"
            onClick={() => setCollapsed((prev) => !prev)}
            aria-expanded={!collapsed}
          >
            <div className="flex items-center gap-2">
              <Settings className="w-6 h-6 stroke-1" />
              {open && <div className="text-nowrap">Impostazioni</div>}
            </div>
            {open && (
              <ChevronRight
                className={`w-4 h-4 opacity-70 transition-transform duration-200 ease-out ${
                  collapsed ? 'rotate-0' : 'rotate-90'
                }`}
              />
            )}
          </button>
          <div
            className={`grid transition-[grid-template-rows] duration-300 ease-out ${
              collapsed ? 'grid-rows-[0fr]' : 'grid-rows-[1fr]'
            }`}
          >
            <div className="overflow-hidden">
              <button
                type="button"
                onClick={goVoce}
                className="relative flex w-full hover:bg-cyan-50/10 rounded-lg overflow-hidden"
              >
                <AudioWaveform className="w-5 h-5 stroke-1 m-2" />
                {open && <div className="absolute flex self-center ml-10 text-nowrap">Voce</div>}
              </button>
              <button
                type="button"
                onClick={goLive}
                className="relative flex w-full hover:bg-cyan-50/10 rounded-lg overflow-hidden"
              >
                <Radio className="w-5 h-5 stroke-1 m-2" />
                {open && <div className="absolute flex self-center ml-10 text-nowrap">Live</div>}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-center-safe px-3 mb-12">
        <div className="relative flex w-full hover:bg-cyan-50/10 rounded-lg overflow-hidden">
          <ExternalLink className="w-6 h-6 stroke-1 m-2" />
          {open && <div className="absolute flex self-center ml-10 text-nowrap">Collegamenti Esterni</div>}
        </div>
      </div>
    </div>
  );
};
