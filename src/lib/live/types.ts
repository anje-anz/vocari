export type AppView = 'voce' | 'live';

export type BuiltinPlatformId = 'twitch' | 'youtube' | 'tiktok' | 'instagram' | 'custom';

export type PlatformId = BuiltinPlatformId | string;

export type AccountKind = 'twitch' | 'stub' | 'custom';

export type ChatRole = 'broadcaster' | 'mod' | 'vip' | 'sub';

export type MinReadRole = 'everyone' | ChatRole;

export type LinkedAccount = {
  id: string;
  platform: PlatformId;
  displayName: string;
  login?: string;
  userId?: string;
  kind: AccountKind;
};

export type CustomPlatform = {
  id: string;
  label: string;
};

export type LiveRules = {
  ignoreBots: boolean;
  ignoreEmoteOnly: boolean;
  minRole: MinReadRole;
  mentionOnly: boolean;
  skipCommandPrefix: string;
};

export type VoiceSettings = {
  voiceId: string;
  rate: number;
  pitch: number;
};

export type ChatMessage = {
  id: string;
  platform: PlatformId;
  channel: string;
  user: string;
  userId?: string;
  text: string;
  roles: ChatRole[];
  isBot: boolean;
  isEmoteOnly: boolean;
  mentionedLogins: string[];
  timestamp: number;
};

export type TwitchStatus = {
  connected: boolean;
  connecting?: boolean;
  live?: boolean;
  accountId?: string;
  channel?: string;
  error?: string;
};

export type DeviceCodeInfo = {
  userCode: string;
  verificationUri: string;
};

export type AudioOutput = {
  id: string;
  name: string;
};

export type SystemVoice = {
  id: string;
  name: string;
  culture: string;
};

export type TtsState = 'start' | 'end';

export type TtsProgress = {
  position: number;
  count: number;
};

export type LivePersistedState = {
  twitchClientId: string;
  lastPlatform: PlatformId | null;
  lastAccountId: string | null;
  lastView: AppView;
  accounts: LinkedAccount[];
  customPlatforms: CustomPlatform[];
  rules: LiveRules;
  voice: VoiceSettings;
  audioOutputId: string;
  audioVolume: number;
};

export function clampAudioVolume(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return 80;
  return Math.max(0, Math.min(100, Math.round(n)));
}

export const DEFAULT_LIVE_RULES: LiveRules = {
  ignoreBots: true,
  ignoreEmoteOnly: true,
  minRole: 'everyone',
  mentionOnly: false,
  skipCommandPrefix: '!',
};

export const DEFAULT_VOICE_SETTINGS: VoiceSettings = {
  voiceId: 'voice-auto',
  rate: 0,
  pitch: 0,
};

export const DEFAULT_LIVE_STATE: LivePersistedState = {
  twitchClientId: '',
  lastPlatform: null,
  lastAccountId: null,
  lastView: 'voce',
  accounts: [],
  customPlatforms: [],
  rules: DEFAULT_LIVE_RULES,
  voice: DEFAULT_VOICE_SETTINGS,
  audioOutputId: 'default',
  audioVolume: 80,
};

export const QUEUE_CAP = 25;
