import { useLive } from '../../contexts/live-context';
import { LiveDashboard } from './live-dashboard';
import { LiveHub } from './live-hub';
import { PlatformRail } from './platform-rail';

export function LiveView() {
  const { liveSurface, ready } = useLive();
  if (!ready) {
    return <div className="flex h-full items-center justify-center opacity-60">Caricamento…</div>;
  }
  return (
    <div className="flex h-full min-h-0 w-full">
      <PlatformRail />
      {liveSurface === 'dash' ? <LiveDashboard /> : <LiveHub />}
    </div>
  );
}
