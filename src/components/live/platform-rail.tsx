import { Plus } from 'lucide-react';
import { useLive } from '../../contexts/live-context';
import { PlatformIcon } from './platform-icon';

export function PlatformRail() {
  const { platforms, selectedPlatform, selectPlatform, openHub } = useLive();

  return (
    <div className="flex h-full w-16 shrink-0 flex-col items-center gap-1 py-3 border-r border-cyan-50/10">
      {platforms
        .filter((item) => item.id !== 'custom')
        .map((platform) => {
          const active = platform.id === selectedPlatform;
          return (
            <button
              key={platform.id}
              type="button"
              title={platform.label}
              onClick={() => selectPlatform(platform.id)}
              className={`
                flex h-10 w-10 items-center justify-center rounded-lg
                ${active ? 'bg-cyan-50/10 ring-1 ring-cyan-50/40' : 'hover:bg-cyan-50/10'}
              `}
            >
              <PlatformIcon id={platform.id} className="w-6 h-6 opacity-80" />
            </button>
          );
        })}
      <button
        type="button"
        title="Piattaforme"
        onClick={openHub}
        className="mt-auto mb-8 flex h-10 w-10 items-center justify-center rounded-lg hover:bg-cyan-50/10"
      >
        <Plus className="w-5 h-5 stroke-1 opacity-80" />
      </button>
    </div>
  );
}
