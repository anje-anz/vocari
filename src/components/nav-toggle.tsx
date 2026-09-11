import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useLive } from '../contexts/live-context';
import { useNav } from '../contexts/nav-context';

export function NavToggle() {
  const { open, toggle } = useNav();
  const { view } = useLive();
  const onLive = view === 'live';
  const left = open ? (onLive ? 'left-80' : 'left-64') : onLive ? 'left-32' : 'left-16';

  return (
    <button
      type="button"
      aria-label={open ? 'Chiudi menu' : 'Apri menu'}
      onClick={toggle}
      className={`
        absolute top-3 z-50 ml-2 w-fit h-fit
        ${left}
        rounded-lg ring-1 ring-line backdrop-blur-sm hover:bg-white/10
        transition-all duration-500 ease-out
      `}
    >
      {open ? <PanelLeftClose className="h-5 w-5 m-2 stroke-1" /> : <PanelLeftOpen className="h-5 w-5 m-2 stroke-1" />}
    </button>
  );
}
