import { shell, type WebContents } from 'electron';
import { randomUUID } from 'node:crypto';
import { ApiClient } from '@twurple/api';
import { getTokenInfo } from '@twurple/auth';
import { ChatClient, type ChatMessage } from '@twurple/chat';
import { KNOWN_CHAT_BOTS, TWITCH_SCOPES } from '../src/lib/live/constants';
import type {
  ChatRole,
  DeviceCodeInfo,
  LinkedAccount,
  ChatMessage as LiveChatMessage,
  TwitchStatus,
} from '../src/lib/live/types';
import { loadState, setToken, upsertAccount } from './store';
import { VocariAuthProvider } from './twitch-auth';
import { isShuttingDown } from './lifecycle';

const DEVICE_URL = 'https://id.twitch.tv/oauth2/device';
const TOKEN_URL = 'https://id.twitch.tv/oauth2/token';

let chatClient: ChatClient | null = null;
let apiClient: ApiClient | null = null;
let chatAccountId: string | null = null;
let chatChannel: string | null = null;
let sender: WebContents | null = null;
let quitting = false;

export function setTwitchSender(contents: WebContents | null) {
  sender = contents;
}

function sendSafe(channel: string, payload: unknown) {
  if (!sender || sender.isDestroyed()) return;
  try {
    sender.send(channel, payload);
  } catch {
    // finestra già chiusa
  }
}

function emitStatus(partial: TwitchStatus) {
  sendSafe('twitch:status', partial);
}

function emitChat(message: LiveChatMessage) {
  sendSafe('chat:message', message);
}

function emitDevice(info: DeviceCodeInfo) {
  sendSafe('twitch:device-code', info);
}

function formBody(data: Record<string, string>) {
  return new URLSearchParams(data).toString();
}

function resolveClientId(explicit?: string) {
  const fromArg = explicit?.trim();
  if (fromArg) return fromArg;
  const fromState = loadState().twitchClientId.trim();
  if (fromState) return fromState;
  return (process.env.VOCARI_TWITCH_CLIENT_ID ?? '').trim();
}

function parseMentions(text: string): string[] {
  const found = text.match(/@([a-zA-Z0-9_]+)/g) ?? [];
  return found.map((item) => item.slice(1).toLowerCase());
}

function isEmoteOnly(text: string, emoteOffsets: Map<string, string[]>): boolean {
  if (emoteOffsets.size === 0) return false;
  const covered = new Array(text.length).fill(false);
  for (const ranges of emoteOffsets.values()) {
    for (const range of ranges) {
      const [startRaw, endRaw] = range.split('-');
      const start = Number(startRaw);
      const end = Number(endRaw);
      if (!Number.isFinite(start) || !Number.isFinite(end)) continue;
      for (let i = start; i <= end && i < text.length; i += 1) covered[i] = true;
    }
  }
  for (let i = 0; i < text.length; i += 1) {
    if (!covered[i] && text[i] !== ' ') return false;
  }
  return text.trim().length > 0;
}

function rolesFromMessage(msg: ChatMessage): ChatRole[] {
  const roles: ChatRole[] = [];
  if (msg.userInfo.isBroadcaster) roles.push('broadcaster');
  if (msg.userInfo.isMod) roles.push('mod');
  if (msg.userInfo.isVip) roles.push('vip');
  if (msg.userInfo.isSubscriber || msg.userInfo.isFounder) roles.push('sub');
  return roles;
}

function toLiveMessage(channel: string, text: string, msg: ChatMessage): LiveChatMessage {
  const login = msg.userInfo.userName.toLowerCase();
  return {
    id: msg.id || randomUUID(),
    platform: 'twitch',
    channel: channel.replace(/^#/, ''),
    user: msg.userInfo.displayName || msg.userInfo.userName,
    userId: msg.userInfo.userId,
    text,
    roles: rolesFromMessage(msg),
    isBot: KNOWN_CHAT_BOTS.has(login),
    isEmoteOnly: isEmoteOnly(text, msg.emoteOffsets),
    mentionedLogins: parseMentions(text),
    timestamp: msg.date.getTime(),
  };
}

function disposeClient() {
  const previous = chatClient;
  chatClient = null;
  apiClient = null;
  chatAccountId = null;
  chatChannel = null;
  if (!previous) return;
  try {
    previous.quit();
  } catch {
    // ignore
  }
}

export function getTwitchApi(): ApiClient | null {
  return apiClient;
}

export async function connectChat(accountId: string): Promise<TwitchStatus> {
  if (isShuttingDown()) throw new Error('Chiusura in corso');
  const state = loadState();
  const account = state.accounts.find((item) => item.id === accountId);
  if (!account || account.kind !== 'twitch' || !account.login || !account.userId) {
    throw new Error('Account Twitch non valido');
  }
  const clientId = resolveClientId();
  if (!clientId) throw new Error('Client ID Twitch mancante');

  quitting = false;
  disposeClient();

  const login = account.login.toLowerCase();
  const channel = login;
  emitStatus({ connected: false, connecting: true, accountId, channel });

  const authProvider = new VocariAuthProvider(clientId, accountId, account.userId);
  apiClient = new ApiClient({ authProvider });
  const client = new ChatClient({
    authProvider,
    channels: [login],
    readOnly: true,
    rejoinChannelsOnReconnect: true,
  });
  chatClient = client;
  chatAccountId = accountId;
  chatChannel = channel;

  client.onMessage((chan, _user, text, msg) => {
    emitChat(toLiveMessage(chan, text, msg));
  });

  client.onDisconnect((manually, reason) => {
    if (quitting || manually) return;
    emitStatus({
      connected: false,
      accountId,
      channel,
      error: reason?.message ?? 'Disconnesso, riconnessione…',
    });
  });

  client.onConnect(() => {
    emitStatus({ connected: true, connecting: false, accountId, channel });
  });

  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Timeout connessione chat Twitch'));
    }, 20000);
    client.onConnect(() => {
      clearTimeout(timeout);
      resolve();
    });
    client.onAuthenticationFailure((message) => {
      clearTimeout(timeout);
      reject(new Error(message || 'Autenticazione chat Twitch fallita'));
    });
    try {
      client.connect();
    } catch (err) {
      clearTimeout(timeout);
      reject(err instanceof Error ? err : new Error('Connessione chat Twitch fallita'));
    }
  });

  const status: TwitchStatus = { connected: true, connecting: false, accountId, channel };
  emitStatus(status);
  return status;
}

export function disconnectChat(): TwitchStatus {
  quitting = true;
  disposeClient();
  const status: TwitchStatus = { connected: false };
  emitStatus(status);
  return status;
}

export function getChatStatus(): TwitchStatus {
  return {
    connected: Boolean(chatClient?.isConnected),
    connecting: Boolean(chatClient?.isConnecting),
    accountId: chatAccountId ?? undefined,
    channel: chatChannel ?? undefined,
  };
}

export async function loginTwitch(clientIdArg?: string): Promise<LinkedAccount> {
  if (isShuttingDown()) throw new Error('Chiusura in corso');
  const clientId = resolveClientId(clientIdArg);
  if (!clientId) throw new Error('Inserisci il Client ID della Twitch Developer Application');

  const deviceRes = await fetch(DEVICE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formBody({
      client_id: clientId,
      scopes: TWITCH_SCOPES.join(' '),
    }),
  });
  const device = (await deviceRes.json()) as {
    device_code?: string;
    user_code?: string;
    verification_uri?: string;
    interval?: number;
    expires_in?: number;
    message?: string;
  };
  if (!deviceRes.ok || !device.device_code || !device.user_code || !device.verification_uri) {
    throw new Error(device.message || 'Avvio Device Code Twitch fallito');
  }

  emitDevice({ userCode: device.user_code, verificationUri: device.verification_uri });
  void shell.openExternal(device.verification_uri);

  const started = Date.now();
  const expiresMs = (device.expires_in ?? 1800) * 1000;
  let intervalMs = (device.interval ?? 5) * 1000;

  while (Date.now() - started < expiresMs) {
    if (isShuttingDown()) throw new Error('Chiusura in corso');
    await new Promise((r) => setTimeout(r, intervalMs));
    const tokenRes = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formBody({
        client_id: clientId,
        device_code: device.device_code,
        grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
      }),
    });
    const tokenJson = (await tokenRes.json()) as {
      access_token?: string;
      refresh_token?: string;
      expires_in?: number;
      message?: string;
    };

    if (tokenJson.message === 'authorization_pending') continue;
    if (tokenJson.message === 'slow_down') {
      intervalMs += 2000;
      continue;
    }
    if (!tokenRes.ok || !tokenJson.access_token) {
      throw new Error(tokenJson.message || 'Autorizzazione Twitch rifiutata');
    }

    const info = await getTokenInfo(tokenJson.access_token, clientId);
    if (!info.userId || !info.userName) {
      throw new Error('Validazione token Twitch fallita');
    }

    const existing = loadState().accounts.find(
      (item) => item.kind === 'twitch' && item.userId === info.userId
    );
    const account: LinkedAccount = existing ?? {
      id: randomUUID(),
      platform: 'twitch',
      displayName: info.userName,
      login: info.userName,
      userId: info.userId,
      kind: 'twitch',
    };
    account.displayName = info.userName;
    account.login = info.userName;
    account.userId = info.userId;

    setToken(account.id, {
      accessToken: tokenJson.access_token,
      refreshToken: tokenJson.refresh_token ?? '',
      expiresAt: Date.now() + (tokenJson.expires_in ?? 3600) * 1000,
      obtainmentTimestamp: Date.now(),
      scope: info.scopes.length ? info.scopes : [...TWITCH_SCOPES],
    });
    upsertAccount(account);
    return account;
  }

  throw new Error('Tempo scaduto per autorizzare Twitch');
}

export function currentChatAccountId() {
  return chatAccountId;
}
