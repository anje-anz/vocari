import { Plus } from 'lucide-react';
import { useLive } from '../../contexts/live-context';
import { PlatformIcon } from './platform-icon';

export function PlatformRail() {
  const { platforms, selectedPlatform, selectPlatform, openHub } = useLive();

  return (
    <div className="relative flex h-full w-16 shrink-0 flex-col items-stretch gap-3 px-3 pt-3 pb-3 backdrop-blur-sm">
      <div className="absolute inset-y-0 right-0 w-px bg-white/20" />
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
                flex h-10 w-full items-center justify-center rounded-lg
                ${active ? 'bg-white/10 ring-1 ring-line' : 'hover:bg-white/10'}
              `}
            >
              <PlatformIcon id={platform.id} className="h-6 w-6 opacity-80" />
            </button>
          );
        })}
      <button
        type="button"
        title="Piattaforme"
        onClick={openHub}
        className="flex h-10 w-full items-center justify-center rounded-lg hover:bg-white/10"
      >
        <Plus className="h-6 w-6 stroke-1 opacity-80" />
      </button>
    </div>
  );
}
