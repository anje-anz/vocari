import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron';
import type {
  AudioOutput,
  ChatMessage,
  DeviceCodeInfo,
  LinkedAccount,
  LivePersistedState,
  SystemVoice,
  TtsProgress,
  TtsState,
  TwitchStatus,
} from '../src/lib/live/types';

contextBridge.exposeInMainWorld('ipcRenderer', {
  send: (channel: string, ...args: unknown[]) => ipcRenderer.send(channel, ...args),
  on: (channel: string, listener: (event: IpcRendererEvent, ...args: unknown[]) => void) =>
    ipcRenderer.on(channel, listener),
  off: (channel: string, listener: (...args: unknown[]) => void) =>
    ipcRenderer.off(channel, listener),
  invoke: (channel: string, ...args: unknown[]) => ipcRenderer.invoke(channel, ...args),
});

contextBridge.exposeInMainWorld('windowControls', {
  minimize: () => ipcRenderer.send('window:minimize'),
  maximize: () => ipcRenderer.send('window:maximize'),
  close: () => ipcRenderer.send('window:close'),
});

function subscribe<T>(channel: string, cb: (payload: T) => void) {
  const handler = (_event: IpcRendererEvent, payload: T) => cb(payload);
  ipcRenderer.on(channel, handler);
  return () => ipcRenderer.off(channel, handler);
}

contextBridge.exposeInMainWorld('electronAPI', {
  speakSystem: (
    text: string,
    voiceId?: string,
    rate?: number,
    pitch?: number,
    volume?: number,
    outputId?: string
  ) => ipcRenderer.invoke('tts:system-speak', { text, voiceId, rate, pitch, volume, outputId }),
  stopSystem: () => ipcRenderer.invoke('tts:system-stop'),
  getSystemVoices: () => ipcRenderer.invoke('tts:get-system-voices') as Promise<SystemVoice[]>,
  onTtsState: (cb: (state: TtsState) => void) => subscribe<TtsState>('tts:state', cb),
  onTtsProgress: (cb: (progress: TtsProgress) => void) =>
    subscribe<TtsProgress>('tts:progress', cb),
  getAudioOutputs: () => ipcRenderer.invoke('audio:outputs') as Promise<AudioOutput[]>,
  getLiveState: () => ipcRenderer.invoke('live:get-state') as Promise<LivePersistedState>,
  setLiveState: (patch: Partial<LivePersistedState>) =>
    ipcRenderer.invoke('live:set-state', patch) as Promise<LivePersistedState>,
  twitchLogin: (clientId?: string) =>
    ipcRenderer.invoke('twitch:login', clientId) as Promise<{
      ok: boolean;
      account?: LinkedAccount;
      error?: string;
      state: LivePersistedState;
    }>,
  twitchLogout: (accountId: string) =>
    ipcRenderer.invoke('twitch:logout', accountId) as Promise<LivePersistedState>,
  twitchConnect: (accountId: string) =>
    ipcRenderer.invoke('twitch:connect', accountId) as Promise<{
      ok: boolean;
      status: TwitchStatus;
      error?: string;
    }>,
  twitchDisconnect: () => ipcRenderer.invoke('twitch:disconnect') as Promise<TwitchStatus>,
  twitchStatus: () => ipcRenderer.invoke('twitch:status') as Promise<TwitchStatus>,
  onDeviceCode: (cb: (info: DeviceCodeInfo) => void) =>
    subscribe<DeviceCodeInfo>('twitch:device-code', cb),
  onChatMessage: (cb: (message: ChatMessage) => void) =>
    subscribe<ChatMessage>('chat:message', cb),
  onTwitchStatus: (cb: (status: TwitchStatus) => void) =>
    subscribe<TwitchStatus>('twitch:status', cb),
  addCustomPlatform: (label: string) =>
    ipcRenderer.invoke('live:add-custom-platform', label) as Promise<LivePersistedState>,
  addCustomAccount: (platformId: string, name: string) =>
    ipcRenderer.invoke('live:add-custom-account', { platformId, name }) as Promise<{
      account: LinkedAccount;
      state: LivePersistedState;
    }>,
  openExternal: (url: string) => ipcRenderer.invoke('shell:open-external', url),
  onCloseRequested: (cb: () => void) => {
    const handler = () => cb();
    ipcRenderer.on('app:close-requested', handler);
    return () => ipcRenderer.off('app:close-requested', handler);
  },
  confirmQuit: () => ipcRenderer.invoke('app:confirm-quit') as Promise<boolean>,
  cancelClose: () => ipcRenderer.send('app:cancel-close'),
});
