/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { BUILTIN_PLATFORMS, type PlatformMeta } from '../lib/live/platforms';
import { passesPolicy, utteranceText } from '../lib/live/policy';
import {
  DEFAULT_LIVE_STATE,
  QUEUE_CAP,
  type AppView,
  type ChatMessage,
  type DeviceCodeInfo,
  type LinkedAccount,
  type LivePersistedState,
  type LiveRules,
  type PlatformId,
  type TwitchStatus,
  type VoiceSettings,
  clampAudioVolume,
} from '../lib/live/types';

type LiveContextValue = {
  ready: boolean;
  view: AppView;
  liveSurface: 'hub' | 'dash';
  state: LivePersistedState;
  selectedPlatform: PlatformId;
  selectedAccount: LinkedAccount | null;
  platforms: PlatformMeta[];
  queue: ChatMessage[];
  current: ChatMessage | null;
  spokenChars: number;
  ttsBusy: boolean;
  twitchStatus: TwitchStatus;
  deviceCode: DeviceCodeInfo | null;
  loginBusy: boolean;
  notice: string | null;
  goVoce: () => void;
  goLive: () => void;
  openHub: () => void;
  selectPlatform: (id: PlatformId) => void;
  selectAccount: (accountId: string) => Promise<void>;
  accountsFor: (platformId: PlatformId) => LinkedAccount[];
  loginTwitch: (clientId?: string) => Promise<void>;
  logoutAccount: (accountId: string) => Promise<void>;
  addCustomPlatform: (label: string) => Promise<void>;
  addCustomAccount: (platformId: PlatformId, name: string) => Promise<void>;
  patchRules: (patch: Partial<LiveRules>) => void;
  patchVoice: (patch: Partial<VoiceSettings>) => void;
  patchAudio: (patch: { audioOutputId?: string; audioVolume?: number }) => void;
  patchClientId: (clientId: string) => void;
  stopReading: () => Promise<void>;
  skipCurrent: () => Promise<void>;
  dropQueued: (id: string) => void;
  pinQueued: (id: string) => void;
  beginShutdown: () => Promise<void>;
};

const LiveContext = createContext<LiveContextValue | null>(null);

/** @see LiveProvider */
export function useLive() {
  const ctx = useContext(LiveContext);
  if (!ctx) throw new Error('useLive deve essere usato dentro LiveProvider');
  return ctx;
}

export function LiveProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [view, setView] = useState<AppView>('voce');
  const [liveSurface, setLiveSurface] = useState<'hub' | 'dash'>('hub');
  const [state, setState] = useState<LivePersistedState>(DEFAULT_LIVE_STATE);
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformId>('twitch');
  const [queue, setQueue] = useState<ChatMessage[]>([]);
  const [current, setCurrent] = useState<ChatMessage | null>(null);
  const [spokenChars, setSpokenChars] = useState(0);
  const [ttsBusy, setTtsBusy] = useState(false);
  const [twitchStatus, setTwitchStatus] = useState<TwitchStatus>({ connected: false });
  const [deviceCode, setDeviceCode] = useState<DeviceCodeInfo | null>(null);
  const [loginBusy, setLoginBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [pumpEpoch, setPumpEpoch] = useState(0);

  const stateRef = useRef(state);
  const currentRef = useRef(current);
  const pumpLock = useRef(false);
  const connectLock = useRef(false);
  const shuttingDownRef = useRef(false);
  stateRef.current = state;
  currentRef.current = current;

  const applyState = useCallback((next: LivePersistedState) => {
    setState(next);
    if (next.lastPlatform) setSelectedPlatform(next.lastPlatform);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const boot = async () => {
      try {
        const loaded = await window.electronAPI?.getLiveState?.();
        if (cancelled) return;
        if (!loaded) return;
        applyState(loaded);
        setView(loaded.lastView);
        if (loaded.accounts.length > 0 && loaded.lastAccountId) setLiveSurface('dash');
        else setLiveSurface('hub');
        const status = await window.electronAPI?.twitchStatus?.();
        if (!cancelled && status) setTwitchStatus(status);
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelled) setReady(true);
      }
    };
    void boot();
    return () => {
      cancelled = true;
    };
  }, [applyState]);

  useEffect(() => {
    if (!window.electronAPI?.onChatMessage) return;
    const offMsg = window.electronAPI.onChatMessage((message) => {
      const currentState = stateRef.current;
      const account = currentState.accounts.find((item) => item.id === currentState.lastAccountId);
      if (!passesPolicy(message, currentState.rules, account?.login)) return;
      setQueue((prev) => {
        const next = [...prev, message];
        return next.length > QUEUE_CAP ? next.slice(next.length - QUEUE_CAP) : next;
      });
    });
    const offStatus = window.electronAPI.onTwitchStatus((status) => {
      setTwitchStatus(status);
      if (status.error) setNotice(status.error);
    });
    const offDevice = window.electronAPI.onDeviceCode((info) => setDeviceCode(info));
    const offTts = window.electronAPI.onTtsState((ttsState) => {
      if (ttsState === 'end') setTtsBusy(false);
      if (ttsState === 'start') setTtsBusy(true);
    });
    const offProgress = window.electronAPI.onTtsProgress((progress) => {
      const text = currentRef.current ? utteranceText(currentRef.current) : '';
      let pos = progress.position;
      if (text && pos > text.length) pos = Math.max(0, pos - (pos - text.length));
      setSpokenChars(Math.max(0, Math.min(text.length, pos + progress.count)));
    });
    return () => {
      offMsg();
      offStatus();
      offDevice();
      offTts();
      offProgress();
    };
  }, []);

  const speakNext = useCallback(async (message: ChatMessage) => {
    const voice = stateRef.current.voice;
    const voiceId = voice.voiceId === 'voice-auto' ? undefined : voice.voiceId;
    setSpokenChars(0);
    setTtsBusy(true);
    try {
      await window.electronAPI.speakSystem(
        utteranceText(message),
        voiceId,
        voice.rate,
        voice.pitch,
        stateRef.current.audioVolume,
        stateRef.current.audioOutputId
      );
    } catch (err) {
      console.error(err);
    } finally {
      setTtsBusy(false);
      setCurrent(null);
      setSpokenChars(0);
      pumpLock.current = false;
    }
  }, []);

  useEffect(() => {
    if (shuttingDownRef.current) return;
    if (view !== 'live') return;
    if (pumpLock.current || ttsBusy || current) return;
    const next = queue[0];
    if (!next) return;
    pumpLock.current = true;
    setQueue((prev) => prev.slice(1));
    setCurrent(next);
    void speakNext(next);
  }, [queue, ttsBusy, current, speakNext, view, pumpEpoch]);

  const platforms = useMemo<PlatformMeta[]>(() => {
    const extras = state.customPlatforms.map((item) => ({
      id: item.id,
      label: item.label,
      available: true,
      kind: 'custom' as const,
    }));
    const customSlot = BUILTIN_PLATFORMS.find((item) => item.id === 'custom');
    return [
      ...BUILTIN_PLATFORMS.filter((item) => item.id !== 'custom'),
      ...extras,
      ...(customSlot ? [customSlot] : []),
    ];
  }, [state.customPlatforms]);

  const accountsFor = useCallback(
    (platformId: PlatformId) => state.accounts.filter((item) => item.platform === platformId),
    [state.accounts]
  );

  const selectedAccount = useMemo(() => {
    return (
      state.accounts.find((item) => item.id === state.lastAccountId && item.platform === selectedPlatform) ??
      accountsFor(selectedPlatform)[0] ??
      null
    );
  }, [state.accounts, state.lastAccountId, selectedPlatform, accountsFor]);

  const persist = useCallback(async (patch: Partial<LivePersistedState>) => {
    try {
      const next = await window.electronAPI.setLiveState(patch);
      applyState(next);
      return next;
    } catch (err) {
      console.error(err);
      const fallback: LivePersistedState = {
        ...stateRef.current,
        ...patch,
        rules: patch.rules ?? stateRef.current.rules,
        voice: patch.voice ?? stateRef.current.voice,
      };
      applyState(fallback);
      return fallback;
    }
  }, [applyState]);

  const goVoce = useCallback(() => {
    setView('voce');
    void persist({ lastView: 'voce' });
  }, [persist]);

  const goLive = useCallback(() => {
    setView('live');
    const hasAccounts = stateRef.current.accounts.length > 0;
    setLiveSurface(hasAccounts ? 'dash' : 'hub');
    void persist({ lastView: 'live' });
  }, [persist]);

  const openHub = useCallback(() => {
    setLiveSurface('hub');
    setView('live');
    void persist({ lastView: 'live' });
  }, [persist]);

  const selectPlatform = useCallback(
    (id: PlatformId) => {
      setSelectedPlatform(id);
      const accounts = stateRef.current.accounts.filter((item) => item.platform === id);
      const nextAccount = accounts.find((item) => item.id === stateRef.current.lastAccountId) ?? accounts[0];
      void persist({
        lastPlatform: id,
        lastAccountId: nextAccount?.id ?? stateRef.current.lastAccountId,
      });
    },
    [persist]
  );

  const selectAccount = useCallback(
    async (accountId: string) => {
      const account = stateRef.current.accounts.find((item) => item.id === accountId);
      if (!account) return;
      setSelectedPlatform(account.platform);
      setLiveSurface('dash');
      await persist({ lastPlatform: account.platform, lastAccountId: account.id, lastView: 'live' });
      setView('live');
      if (account.kind !== 'twitch') {
        await window.electronAPI.twitchDisconnect();
      }
    },
    [persist]
  );

  const loginTwitch = useCallback(
    async (clientId?: string) => {
      setLoginBusy(true);
      setNotice(null);
      setDeviceCode(null);
      try {
        const result = await window.electronAPI.twitchLogin(clientId);
        applyState(result.state);
        if (!result.ok || !result.account) {
          setNotice(result.error ?? 'Login Twitch fallito');
          return;
        }
        setSelectedPlatform('twitch');
        setLiveSurface('dash');
        setView('live');
      } catch (err) {
        setNotice(err instanceof Error ? err.message : 'Login Twitch fallito');
      } finally {
        setLoginBusy(false);
        setDeviceCode(null);
      }
    },
    [applyState]
  );

  const logoutAccount = useCallback(
    async (accountId: string) => {
      const next = await window.electronAPI.twitchLogout(accountId);
      applyState(next);
      if (next.accounts.length === 0) setLiveSurface('hub');
    },
    [applyState]
  );

  const addCustomPlatform = useCallback(
    async (label: string) => {
      const next = await window.electronAPI.addCustomPlatform(label);
      applyState(next);
      const created = next.customPlatforms[next.customPlatforms.length - 1];
      if (created) selectPlatform(created.id);
    },
    [applyState, selectPlatform]
  );

  const addCustomAccount = useCallback(
    async (platformId: PlatformId, name: string) => {
      const result = await window.electronAPI.addCustomAccount(platformId, name);
      applyState(result.state);
      await selectAccount(result.account.id);
    },
    [applyState, selectAccount]
  );

  const patchRules = useCallback(
    (patch: Partial<LiveRules>) => {
      void persist({ rules: { ...stateRef.current.rules, ...patch } });
    },
    [persist]
  );

  const patchVoice = useCallback(
    (patch: Partial<VoiceSettings>) => {
      void persist({ voice: { ...stateRef.current.voice, ...patch } });
    },
    [persist]
  );

  const patchAudio = useCallback(
    (patch: { audioOutputId?: string; audioVolume?: number }) => {
      void persist({
        audioOutputId: patch.audioOutputId ?? stateRef.current.audioOutputId,
        audioVolume:
          patch.audioVolume !== undefined
            ? clampAudioVolume(patch.audioVolume)
            : stateRef.current.audioVolume,
      });
    },
    [persist]
  );

  const patchClientId = useCallback(
    (clientId: string) => {
      void persist({ twitchClientId: clientId });
    },
    [persist]
  );

  const stopReading = useCallback(async () => {
    await window.electronAPI?.stopSystem?.();
    setCurrent(null);
    setSpokenChars(0);
    setTtsBusy(false);
    pumpLock.current = true;
  }, []);

  const skipCurrent = useCallback(async () => {
    await window.electronAPI?.stopSystem?.();
    setCurrent(null);
    setSpokenChars(0);
    setTtsBusy(false);
    pumpLock.current = false;
    setPumpEpoch((tick) => tick + 1);
  }, []);

  const dropQueued = useCallback((id: string) => {
    setQueue((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const pinQueued = useCallback((id: string) => {
    setQueue((prev) => {
      const item = prev.find((entry) => entry.id === id);
      if (!item) return prev;
      return [item, ...prev.filter((entry) => entry.id !== id)];
    });
  }, []);

  const beginShutdown = useCallback(async () => {
    shuttingDownRef.current = true;
    setQueue([]);
    await stopReading();
    pumpLock.current = true;
  }, [stopReading]);

  useEffect(() => {
    if (shuttingDownRef.current) return;
    if (!ready || view !== 'live' || liveSurface !== 'dash') return;
    const accountId = selectedAccount?.id;
    const account = stateRef.current.accounts.find((item) => item.id === accountId);
    if (account?.kind !== 'twitch') return;
    if (!window.electronAPI?.twitchConnect) return;
    if (connectLock.current) return;
    connectLock.current = true;
    void window.electronAPI
      .twitchConnect(account.id)
      .then((result) => {
        if (!result.ok) setNotice(result.error ?? 'Connessione Twitch fallita');
        else setNotice(null);
      })
      .finally(() => {
        connectLock.current = false;
      });
  }, [ready, view, liveSurface, selectedAccount?.id]);

  const value: LiveContextValue = {
    ready,
    view,
    liveSurface,
    state,
    selectedPlatform,
    selectedAccount,
    platforms,
    queue,
    current,
    spokenChars,
    ttsBusy,
    twitchStatus,
    deviceCode,
    loginBusy,
    notice,
    goVoce,
    goLive,
    openHub,
    selectPlatform,
    selectAccount,
    accountsFor,
    loginTwitch,
    logoutAccount,
    addCustomPlatform,
    addCustomAccount,
    patchRules,
    patchVoice,
    patchAudio,
    patchClientId,
    stopReading,
    skipCurrent,
    dropQueued,
    pinQueued,
    beginShutdown,
  };

  return <LiveContext.Provider value={value}>{children}</LiveContext.Provider>;
}
