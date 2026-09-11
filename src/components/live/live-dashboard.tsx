import { useLive } from '../../contexts/live-context';
import { AccountPanel } from './account-panel';
import { AccountSwitcher } from './account-switcher';
import { LiveSettings } from './live-settings';
import { MessageQueue } from './message-queue';
import { NowReading } from './now-reading';
import { PlatformRail } from './platform-rail';

export function LiveDashboard() {
  const { selectedPlatform, selectedAccount, accountsFor, platforms, notice } = useLive();
  const meta = platforms.find((item) => item.id === selectedPlatform);
  const needsAccount = accountsFor(selectedPlatform).length === 0;

  return (
    <div className="flex h-full min-h-0 w-full">
      <PlatformRail />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between px-6 py-3">
          <div>
            <div className="text-xl">{meta?.label ?? 'Live'}</div>
            {selectedAccount && (
              <div className="text-xs opacity-60">{selectedAccount.displayName}</div>
            )}
          </div>
          <AccountSwitcher />
        </div>
        {notice && <div className="px-6 pb-2 text-xs opacity-70">{notice}</div>}
        {needsAccount ? (
          <div className="flex flex-1 items-start justify-center px-6 py-4">
            <div className="w-full max-w-md">
              <AccountPanel platformId={selectedPlatform} available={meta?.available ?? false} />
            </div>
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col gap-3 px-6 pb-6">
            <MessageQueue />
            <NowReading />
            <div className="max-h-[40%] overflow-y-auto">
              <LiveSettings />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
