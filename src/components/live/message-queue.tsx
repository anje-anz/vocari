import { Pin, X } from 'lucide-react';
import { useLive } from '../../contexts/live-context';

const ROLE_LABEL: Record<string, string> = {
  broadcaster: 'live',
  mod: 'mod',
  vip: 'vip',
  sub: 'sub',
};

export function MessageQueue() {
  const { queue, pinQueued, dropQueued } = useLive();

  return (
    <div className="flex min-h-44 flex-col rounded-lg ring-1 ring-line backdrop-blur-sm">
      <div className="px-4 py-2 text-sm opacity-70">Coda</div>
      <div className="flex flex-col-reverse px-3 pb-3">
        {queue.length === 0 && (
          <div className="px-1 py-8 text-center text-sm opacity-60">Nessun messaggio in attesa</div>
        )}
        {queue.map((message, index) => (
          <div
            key={message.id}
            className="group flex items-start gap-2 rounded-lg px-2 py-1.5 hover:bg-white/10"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-xs opacity-70">
                {index === 0 && (
                  <span className="rounded px-1 ring-1 ring-line">prossimo</span>
                )}
                <span>{message.user}</span>
                {message.roles.map((role) => (
                  <span key={role} className="rounded px-1 ring-1 ring-line">
                    {ROLE_LABEL[role] ?? role}
                  </span>
                ))}
              </div>
              <div className="truncate text-sm">{message.text}</div>
            </div>
            <div className="flex shrink-0 opacity-0 group-hover:opacity-100">
              <button
                type="button"
                title="Leggi per prossimo"
                onClick={() => pinQueued(message.id)}
                className="rounded-lg p-1 hover:bg-white/10"
              >
                <Pin className="w-3.5 h-3.5 stroke-1" />
              </button>
              <button
                type="button"
                title="Togli dalla coda"
                onClick={() => dropQueued(message.id)}
                className="rounded-lg p-1 hover:bg-white/10"
              >
                <X className="w-3.5 h-3.5 stroke-1" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
