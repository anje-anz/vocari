import type { ChatMessage, ChatRole, LiveRules, MinReadRole } from './types';

const ROLE_RANK: Record<MinReadRole, number> = {
  everyone: 0,
  sub: 1,
  vip: 2,
  mod: 3,
  broadcaster: 4,
};

function highestRoleRank(roles: ChatRole[]): number {
  if (roles.length === 0) return 0;
  return Math.max(...roles.map((role) => ROLE_RANK[role]));
}

export function utteranceText(message: ChatMessage): string {
  const user = message.user.trim() || 'utente';
  return `${user} dice: ${message.text}`;
}

export function passesPolicy(
  message: ChatMessage,
  rules: LiveRules,
  channelLogin: string | undefined
): boolean {
  const text = message.text.trim();
  if (!text) return false;

  if (rules.ignoreBots && message.isBot) return false;
  if (rules.ignoreEmoteOnly && message.isEmoteOnly) return false;

  const prefix = rules.skipCommandPrefix.trim();
  if (prefix && text.startsWith(prefix)) return false;

  if (highestRoleRank(message.roles) < ROLE_RANK[rules.minRole]) return false;

  if (rules.mentionOnly) {
    const channel = (channelLogin ?? message.channel).replace(/^#/, '').toLowerCase();
    const mentioned = message.mentionedLogins.some((login) => login === channel);
    if (!mentioned) return false;
  }

  return true;
}
