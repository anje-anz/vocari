import type {
  AccessTokenMaybeWithUserId,
  AccessTokenWithUserId,
  AuthProvider,
} from '@twurple/auth';
import { extractUserId, type UserIdResolvable } from '@twurple/common';
import { TWITCH_SCOPES } from '../src/lib/live/constants';
import { getToken, setToken, type TokenRecord } from './store';

const TOKEN_URL = 'https://id.twitch.tv/oauth2/token';

function formBody(data: Record<string, string>) {
  return new URLSearchParams(data).toString();
}

export async function refreshIfNeeded(
  accountId: string,
  clientId: string,
  forceRefresh = false
): Promise<TokenRecord> {
  const token = getToken(accountId);
  if (!token) throw new Error('Token Twitch mancante');
  if (!forceRefresh && token.expiresAt - 60_000 > Date.now()) return token;
  if (!token.refreshToken) throw new Error('Refresh token Twitch mancante');

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formBody({
      client_id: clientId,
      grant_type: 'refresh_token',
      refresh_token: token.refreshToken,
    }),
  });
  const json = (await res.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    message?: string;
  };
  if (!res.ok || !json.access_token) {
    throw new Error(json.message || 'Refresh token Twitch fallito');
  }
  const next: TokenRecord = {
    accessToken: json.access_token,
    refreshToken: json.refresh_token || token.refreshToken,
    expiresAt: Date.now() + (json.expires_in ?? 3600) * 1000,
    obtainmentTimestamp: Date.now(),
    scope: token.scope ?? TWITCH_SCOPES,
  };
  setToken(accountId, next);
  return next;
}

function toAccessToken(token: TokenRecord, userId: string): AccessTokenWithUserId {
  return {
    accessToken: token.accessToken,
    refreshToken: token.refreshToken,
    expiresIn: Math.max(0, Math.floor((token.expiresAt - Date.now()) / 1000)),
    obtainmentTimestamp: token.obtainmentTimestamp ?? Date.now(),
    scope: token.scope ?? TWITCH_SCOPES,
    userId,
  };
}

export class VocariAuthProvider implements AuthProvider {
  constructor(
    readonly clientId: string,
    private readonly accountId: string,
    private readonly userId: string
  ) {}

  getCurrentScopesForUser(user: UserIdResolvable): string[] {
    if (extractUserId(user) !== this.userId) return [];
    return getToken(this.accountId)?.scope ?? [...TWITCH_SCOPES];
  }

  async getAccessTokenForUser(user: UserIdResolvable): Promise<AccessTokenWithUserId | null> {
    if (extractUserId(user) !== this.userId) return null;
    return toAccessToken(await refreshIfNeeded(this.accountId, this.clientId), this.userId);
  }

  async getAccessTokenForIntent(intent: string): Promise<AccessTokenWithUserId | null> {
    if (intent !== 'chat') return null;
    return toAccessToken(await refreshIfNeeded(this.accountId, this.clientId), this.userId);
  }

  async getAnyAccessToken(): Promise<AccessTokenMaybeWithUserId> {
    return toAccessToken(await refreshIfNeeded(this.accountId, this.clientId), this.userId);
  }

  async refreshAccessTokenForUser(user: UserIdResolvable): Promise<AccessTokenWithUserId> {
    if (extractUserId(user) !== this.userId) {
      throw new Error('Refresh richiesto per un utente Twitch diverso');
    }
    return toAccessToken(await refreshIfNeeded(this.accountId, this.clientId, true), this.userId);
  }

  async refreshAccessTokenForIntent(intent: string): Promise<AccessTokenWithUserId> {
    if (intent !== 'chat') throw new Error(`Intent Twitch sconosciuto: ${intent}`);
    return toAccessToken(await refreshIfNeeded(this.accountId, this.clientId, true), this.userId);
  }
}
