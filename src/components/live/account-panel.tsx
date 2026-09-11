import { useState } from 'react';
import { useLive } from '../../contexts/live-context';
import type { PlatformId } from '../../lib/live/types';

export function AccountPanel({
  platformId,
  available,
}: {
  platformId: PlatformId;
  available: boolean;
}) {
  const {
    accountsFor,
    selectAccount,
    loginTwitch,
    loginBusy,
    deviceCode,
    state,
    patchClientId,
    addCustomAccount,
    notice,
  } = useLive();
  const accounts = accountsFor(platformId);
  const [clientId, setClientId] = useState(state.twitchClientId);
  const [stubName, setStubName] = useState('');

  if (!available) {
    return (
      <div className="flex flex-col gap-2">
        <div className="text-lg">Account</div>
        <p className="text-sm opacity-70">Disponibile a breve. Per ora solo Twitch ha l&apos;ingest vero.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="text-lg">Account</div>
      {accounts.length === 0 && (
        <p className="text-sm opacity-70">Nessun account collegato.</p>
      )}
      <div className="flex flex-col gap-1">
        {accounts.map((account) => (
          <button
            key={account.id}
            type="button"
            onClick={() => void selectAccount(account.id)}
            className="rounded-lg px-3 py-2 text-left hover:bg-white/10 ring-1 ring-line"
          >
            {account.displayName}
          </button>
        ))}
      </div>

      {platformId === 'twitch' ? (
        <div className="flex flex-col gap-2 pt-2">
          <p className="text-sm opacity-70">
            Crea un&apos;app su Twitch (tipo <span className="opacity-100">Pubblico</span>, redirect{' '}
            <span className="opacity-100">https://localhost</span>), poi incolla il Client ID. Non serve
            essere streamer: basta l&apos;account con cui ti sei loggato in console.
          </p>
          <button
            type="button"
            className="self-start text-sm underline opacity-80 hover:opacity-100"
            onClick={() =>
              void window.electronAPI?.openExternal?.('https://dev.twitch.tv/console/apps/create')
            }
          >
            Apri la console Twitch
          </button>
          <label className="text-xs opacity-70">Twitch Client ID</label>
          <input
            value={clientId}
            onChange={(event) => {
              setClientId(event.target.value);
              patchClientId(event.target.value);
            }}
            placeholder="Client ID dell'app Vocari"
            className="rounded-lg bg-transparent px-3 py-2 ring-1 ring-line outline-none text-sm"
          />
          <button
            type="button"
            disabled={loginBusy || !clientId.trim()}
            onClick={() => void loginTwitch(clientId)}
            className="rounded-lg ring-1 ring-line hover:bg-white/10 px-3 py-2 disabled:opacity-50"
          >
            {loginBusy ? 'In attesa su Twitch…' : 'Aggiungi account Twitch'}
          </button>
          {deviceCode && (
            <div className="text-sm opacity-80">
              Codice: <span className="tracking-widest">{deviceCode.userCode}</span>
              <button
                type="button"
                className="ml-2 underline"
                onClick={() => void window.electronAPI.openExternal(deviceCode.verificationUri)}
              >
                Apri Twitch
              </button>
            </div>
          )}
        </div>
      ) : (
        <form
          className="flex flex-col gap-2 pt-2"
          onSubmit={(event) => {
            event.preventDefault();
            const name = stubName.trim();
            if (!name) return;
            void addCustomAccount(platformId, name);
            setStubName('');
          }}
        >
          <input
            value={stubName}
            onChange={(event) => setStubName(event.target.value)}
            placeholder="Nome account"
            className="rounded-lg bg-transparent px-3 py-2 ring-1 ring-line outline-none text-sm"
          />
          <button type="submit" className="rounded-lg ring-1 ring-line hover:bg-white/10 px-3 py-2">
            Aggiungi
          </button>
        </form>
      )}
      {notice && <p className="text-sm opacity-70">{notice}</p>}
    </div>
  );
}
