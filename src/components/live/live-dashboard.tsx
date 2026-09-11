import { CircleOff, Radio } from 'lucide-react';
import { useLive } from '../../contexts/live-context';
import { AccountPanel } from './account-panel';
import { AccountSwitcher } from './account-switcher';
import { LiveSettings } from './live-settings';
import { MessageQueue } from './message-queue';
import { NowReading } from './now-reading';

export function LiveDashboard() {
  const { selectedPlatform, accountsFor, platforms, notice, twitchStatus } = useLive();
  const meta = platforms.find((item) => item.id === selectedPlatform);
  const needsAccount = accountsFor(selectedPlatform).length === 0;
  const online = selectedPlatform === 'twitch' && Boolean(twitchStatus.live);

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col px-3 pt-3 pb-3 backdrop-blur-sm">
      {notice && <div className="mb-3 text-sm opacity-70">{notice}</div>}
      <div className="vocari-scroll min-h-0 flex-1 overflow-y-auto">
        <div className="flex justify-center py-1">
          {needsAccount ? (
            <div className="w-4/5 rounded-lg p-4 ring-1 ring-line backdrop-blur-sm">
              <AccountPanel platformId={selectedPlatform} available={meta?.available ?? false} />
            </div>
          ) : (
            <div className="flex w-4/5 flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm ring-1 ring-line">
                  {online ? (
                    <Radio className="h-4 w-4 stroke-1" />
                  ) : (
                    <CircleOff className="h-4 w-4 stroke-1" />
                  )}
                  <span>{online ? 'Online' : 'Offline'}</span>
                </div>
                <AccountSwitcher />
              </div>
              <MessageQueue />
              <NowReading />
              <LiveSettings />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
