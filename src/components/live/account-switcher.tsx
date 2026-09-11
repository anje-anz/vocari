import { useState } from 'react';
import { ChevronDown, UserRound } from 'lucide-react';
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
  const accounts = accountsFor(selectedPlatform);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm ring-1 ring-cyan-50/20 hover:bg-cyan-50/10"
      >
        <UserRound className="w-4 h-4 stroke-1" />
        <span className="max-w-40 truncate">{selectedAccount?.displayName ?? 'Nessun account'}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-56 rounded-lg ring-1 ring-cyan-50/20 backdrop-blur-lg overflow-hidden z-40">
          {accounts.map((account) => (
            <button
              key={account.id}
              type="button"
              onClick={() => {
                setOpen(false);
                void selectAccount(account.id);
              }}
              className={`flex w-full items-center justify-between px-3 py-2 text-sm text-left hover:bg-cyan-50/10 ${
                account.id === selectedAccount?.id ? 'bg-cyan-50/10' : ''
              }`}
            >
              {account.displayName}
            </button>
          ))}
          {selectedPlatform === 'twitch' && (
            <button
              type="button"
              disabled={loginBusy}
              onClick={() => {
                void loginTwitch(state.twitchClientId);
              }}
              className="flex w-full px-3 py-2 text-sm text-left hover:bg-cyan-50/10"
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
              className="flex w-full px-3 py-2 text-sm text-left hover:bg-cyan-50/10 opacity-70"
            >
              Scollega
            </button>
          )}
        </div>
      )}
    </div>
  );
}
