import { useLive } from '../../contexts/live-context';
import { LiveDashboard } from './live-dashboard';
import { LiveHub } from './live-hub';

export function LiveView() {
  const { liveSurface, ready } = useLive();
  if (!ready) {
    return <div className="flex h-full items-center justify-center opacity-60">Caricamento…</div>;
  }
  return liveSurface === 'dash' ? <LiveDashboard /> : <LiveHub />;
}
