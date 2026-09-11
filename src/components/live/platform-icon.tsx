import { Puzzle } from 'lucide-react';
import { InstagramIcon, TiktokIcon, TwitchIcon, YoutubeIcon } from '../../icons';
import type { PlatformId } from '../../lib/live/types';

export function PlatformIcon({
  id,
  className = 'w-6 h-6',
}: {
  id: PlatformId;
  className?: string;
}) {
  if (id === 'twitch') return <TwitchIcon className={className} />;
  if (id === 'youtube') return <YoutubeIcon className={className} />;
  if (id === 'tiktok') return <TiktokIcon className={className} />;
  if (id === 'instagram') return <InstagramIcon className={className} />;
  return <Puzzle className={`${className} stroke-1`} />;
}
