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
} from '../lib/live/types';

export {};

declare global {
  interface Window {
    ipcRenderer: {
      send(channel: string, ...args: unknown[]): void;
      on(channel: string, listener: (event: unknown, ...args: unknown[]) => void): void;
      off(channel: string, listener: (...args: unknown[]) => void): void;
      invoke(channel: string, ...args: unknown[]): Promise<unknown>;
    };
    windowControls: {
      minimize: () => void;
      maximize: () => void;
      close: () => void;
    };
    electronAPI: {
      speakSystem: (
        text: string,
        voiceId?: string,
        rate?: number,
        pitch?: number,
        volume?: number,
        outputId?: string
      ) => Promise<unknown>;
      stopSystem: () => Promise<unknown>;
      getSystemVoices: () => Promise<SystemVoice[]>;
      onTtsState: (cb: (state: TtsState) => void) => () => void;
      onTtsProgress: (cb: (progress: TtsProgress) => void) => () => void;
      getAudioOutputs: () => Promise<AudioOutput[]>;
      getLiveState: () => Promise<LivePersistedState>;
      setLiveState: (patch: Partial<LivePersistedState>) => Promise<LivePersistedState>;
      twitchLogin: (clientId?: string) => Promise<{
        ok: boolean;
        account?: LinkedAccount;
        error?: string;
        state: LivePersistedState;
      }>;
      twitchLogout: (accountId: string) => Promise<LivePersistedState>;
      twitchConnect: (accountId: string) => Promise<{
        ok: boolean;
        status: TwitchStatus;
        error?: string;
      }>;
      twitchDisconnect: () => Promise<TwitchStatus>;
      twitchStatus: () => Promise<TwitchStatus>;
      onDeviceCode: (cb: (info: DeviceCodeInfo) => void) => () => void;
      onChatMessage: (cb: (message: ChatMessage) => void) => () => void;
      onTwitchStatus: (cb: (status: TwitchStatus) => void) => () => void;
      addCustomPlatform: (label: string) => Promise<LivePersistedState>;
      addCustomAccount: (
        platformId: string,
        name: string
      ) => Promise<{ account: LinkedAccount; state: LivePersistedState }>;
      openExternal: (url: string) => Promise<unknown>;
      onCloseRequested: (cb: () => void) => () => void;
      confirmQuit: () => Promise<boolean>;
      cancelClose: () => void;
    };
  }
}
