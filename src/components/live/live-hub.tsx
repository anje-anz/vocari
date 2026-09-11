import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useLive } from '../../contexts/live-context';
import { PlatformIcon } from './platform-icon';
import { AccountPanel } from './account-panel';

export function LiveHub() {
  const { platforms, selectedPlatform, selectPlatform, addCustomPlatform } = useLive();
  const [picked, setPicked] = useState(false);
  const [customName, setCustomName] = useState('');
  const selected = platforms.find((item) => item.id === selectedPlatform) ?? platforms[0];
  const showCustomForm = selectedPlatform === 'custom';

  return (
    <div className="flex h-full w-full items-center justify-center px-6">
      <div
        className={`
          flex items-start gap-8 transition-all duration-500 ease-out
          ${picked ? '-translate-x-4' : ''}
        `}
      >
        <div className="w-72 shrink-0">
          <div className="mb-4 pl-3 text-2xl">Piattaforme</div>
          <div className="flex flex-col gap-1 rounded-lg ring-1 ring-line backdrop-blur-sm p-1">
            {platforms.map((platform) => {
              const active = picked && platform.id === selectedPlatform;
              return (
                <button
                  key={platform.id}
                  type="button"
                  onClick={() => {
                    setPicked(true);
                    selectPlatform(platform.id);
                  }}
                  className={`
                    relative flex w-full items-center rounded-lg
                    ${active ? 'ring-1 ring-line bg-white/10' : 'hover:bg-white/10'}
                  `}
                >
                  <PlatformIcon id={platform.id} className="w-6 h-6 m-1.5 opacity-80" />
                  <span className="ml-2 py-2 text-left">{platform.label}</span>
                  {!platform.available && platform.id !== 'custom' && (
                    <span className="ml-auto mr-3 text-[10px] opacity-50">presto</span>
                  )}
                  {platform.id === 'custom' && (
                    <Plus className="ml-auto mr-3 w-4 h-4 opacity-70" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {picked && selected && (
          <div className="w-80 shrink-0 rounded-lg ring-1 ring-line backdrop-blur-sm p-4">
            {showCustomForm ? (
              <form
                className="flex flex-col gap-3"
                onSubmit={(event) => {
                  event.preventDefault();
                  const name = customName.trim();
                  if (!name) return;
                  void addCustomPlatform(name);
                  setCustomName('');
                }}
              >
                <div className="text-lg">Nuova piattaforma custom</div>
                <p className="text-sm opacity-70">
                  Solo un nome per ora. L&apos;ingest arriverà come webhook.
                </p>
                <input
                  value={customName}
                  onChange={(event) => setCustomName(event.target.value)}
                  placeholder="Nome"
                  className="rounded-lg bg-transparent px-3 py-2 ring-1 ring-line outline-none"
                />
                <button
                  type="submit"
                  className="rounded-lg ring-1 ring-line hover:bg-white/10 px-3 py-2"
                >
                  Aggiungi
                </button>
              </form>
            ) : (
              <AccountPanel platformId={selected.id} available={selected.available} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
