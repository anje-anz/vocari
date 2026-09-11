import type { BuiltinPlatformId, PlatformId } from './types';

export type PlatformMeta = {
  id: PlatformId;
  label: string;
  available: boolean;
  kind: 'builtin' | 'custom';
};

export const BUILTIN_PLATFORMS: PlatformMeta[] = [
  { id: 'twitch', label: 'Twitch', available: true, kind: 'builtin' },
  { id: 'youtube', label: 'YouTube', available: false, kind: 'builtin' },
  { id: 'tiktok', label: 'TikTok', available: false, kind: 'builtin' },
  { id: 'instagram', label: 'Instagram', available: false, kind: 'builtin' },
  { id: 'custom', label: 'Custom', available: true, kind: 'custom' },
];

export function isBuiltinPlatform(id: string): id is BuiltinPlatformId {
  return BUILTIN_PLATFORMS.some((p) => p.id === id);
}
