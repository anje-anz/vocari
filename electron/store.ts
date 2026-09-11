import { app, safeStorage } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import {
  DEFAULT_LIVE_STATE,
  clampAudioVolume,
  type LinkedAccount,
  type LivePersistedState,
} from '../src/lib/live/types';

export type TokenRecord = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  obtainmentTimestamp?: number;
  scope?: string[];
};

type TokenMap = Record<string, TokenRecord>;

function statePath() {
  return path.join(app.getPath('userData'), 'vocari-state.json');
}

function tokenPath() {
  return path.join(app.getPath('userData'), 'vocari-tokens.bin');
}

function readJsonFile<T>(file: string, fallback: T): T {
  try {
    if (!fs.existsSync(file)) return fallback;
    const raw = fs.readFileSync(file, 'utf8');
    return { ...fallback, ...JSON.parse(raw) } as T;
  } catch {
    return fallback;
  }
}

export function loadState(): LivePersistedState {
  const loaded = readJsonFile(statePath(), DEFAULT_LIVE_STATE);
  return {
    ...DEFAULT_LIVE_STATE,
    ...loaded,
    rules: { ...DEFAULT_LIVE_STATE.rules, ...loaded.rules },
    voice: { ...DEFAULT_LIVE_STATE.voice, ...loaded.voice },
    accounts: Array.isArray(loaded.accounts) ? loaded.accounts : [],
    customPlatforms: Array.isArray(loaded.customPlatforms) ? loaded.customPlatforms : [],
    audioVolume: clampAudioVolume(loaded.audioVolume),
    audioOutputId: loaded.audioOutputId?.trim() ? loaded.audioOutputId : DEFAULT_LIVE_STATE.audioOutputId,
  };
}

export function saveState(state: LivePersistedState) {
  fs.mkdirSync(path.dirname(statePath()), { recursive: true });
  fs.writeFileSync(statePath(), JSON.stringify(state, null, 2), 'utf8');
}

export function patchState(patch: Partial<LivePersistedState>): LivePersistedState {
  const current = loadState();
  const next: LivePersistedState = {
    ...current,
    ...patch,
    rules: patch.rules ? { ...current.rules, ...patch.rules } : current.rules,
    voice: patch.voice ? { ...current.voice, ...patch.voice } : current.voice,
  };
  saveState(next);
  return next;
}

function readTokens(): TokenMap {
  try {
    if (!fs.existsSync(tokenPath())) return {};
    const buf = fs.readFileSync(tokenPath());
    const json = safeStorage.isEncryptionAvailable()
      ? safeStorage.decryptString(buf)
      : buf.toString('utf8');
    const parsed = JSON.parse(json) as TokenMap;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeTokens(map: TokenMap) {
  const json = JSON.stringify(map);
  const buf = safeStorage.isEncryptionAvailable()
    ? safeStorage.encryptString(json)
    : Buffer.from(json, 'utf8');
  fs.writeFileSync(tokenPath(), buf);
}

export function getToken(accountId: string): TokenRecord | null {
  return readTokens()[accountId] ?? null;
}

export function setToken(accountId: string, token: TokenRecord) {
  const map = readTokens();
  map[accountId] = token;
  writeTokens(map);
}

export function deleteToken(accountId: string) {
  const map = readTokens();
  delete map[accountId];
  writeTokens(map);
}

export function upsertAccount(account: LinkedAccount): LivePersistedState {
  const state = loadState();
  const idx = state.accounts.findIndex((item) => item.id === account.id);
  if (idx >= 0) state.accounts[idx] = account;
  else state.accounts.push(account);
  state.lastPlatform = account.platform;
  state.lastAccountId = account.id;
  saveState(state);
  return state;
}

export function removeAccount(accountId: string): LivePersistedState {
  deleteToken(accountId);
  const state = loadState();
  state.accounts = state.accounts.filter((item) => item.id !== accountId);
  if (state.lastAccountId === accountId) {
    const fallback = state.accounts[0];
    state.lastAccountId = fallback?.id ?? null;
    state.lastPlatform = fallback?.platform ?? null;
  }
  saveState(state);
  return state;
}
