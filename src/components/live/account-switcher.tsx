import { useEffect, useRef, useState } from 'react';
import { ChevronRight, UserRound } from 'lucide-react';
import { useLive } from '../../contexts/live-context';

export function AccountSwitcher() {
  const {
    selectedAccount,
    selectedPlatform,
    accountsFor,
    selectAccount,
    logoutAccount,
    loginTwitch,
    loginBusy,
    deviceCode,
    state,
  } = useLive();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const accounts = accountsFor(selectedPlatform);

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
        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm ring-1 ring-line hover:bg-white/10"
      >
        <UserRound className="w-4 h-4 stroke-1" />
        <span className="max-w-40 truncate">{selectedAccount?.displayName ?? 'Nessun account'}</span>
        <ChevronRight
          className={`w-3 h-3 stroke-1 transition-transform duration-200 ease-out ${
            open ? 'rotate-90' : 'rotate-0'
          }`}
        />
      </button>
      <div
        className={`
          vocari-pop absolute right-0 z-40 mt-2 w-56 origin-top-right overflow-hidden
          rounded-lg ring-1 ring-line
          ${open ? 'scale-100 opacity-100' : 'pointer-events-none scale-95 opacity-0'}
          transition-all duration-150 ease-out
        `}
        aria-hidden={!open}
        inert={!open || undefined}
      >
        {accounts.map((account) => (
          <button
            key={account.id}
            type="button"
            onClick={() => {
              setOpen(false);
              void selectAccount(account.id);
            }}
            className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-white/10 ${
              account.id === selectedAccount?.id ? 'bg-white/10' : ''
            }`}
          >
            <span className="truncate">{account.displayName}</span>
            <span className="ml-2 text-xs opacity-70">
              {account.id === selectedAccount?.id ? '●' : '○'}
            </span>
          </button>
        ))}
        {selectedPlatform === 'twitch' && (
          <button
            type="button"
            disabled={loginBusy}
            onClick={() => {
              void loginTwitch(state.twitchClientId);
            }}
            className="flex w-full px-3 py-2 text-left text-sm hover:bg-white/10 disabled:opacity-50"
          >
            {loginBusy ? 'Autorizzazione…' : 'Aggiungi account'}
          </button>
        )}
        {deviceCode && (
          <div className="px-3 py-2 text-xs opacity-80">Codice {deviceCode.userCode}</div>
        )}
        {selectedAccount && (
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              void logoutAccount(selectedAccount.id);
            }}
            className="flex w-full px-3 py-2 text-left text-sm opacity-70 hover:bg-white/10"
          >
            Scollega
          </button>
        )}
      </div>
    </div>
  );
}
