import { SkipForward, Square } from 'lucide-react';
import { useLive } from '../../contexts/live-context';
import { utteranceText } from '../../lib/live/policy';

export function NowReading() {
  const { current, spokenChars, ttsBusy, queue, stopReading, skipCurrent, twitchStatus } = useLive();
  const text = current ? utteranceText(current) : '';
  const cursor = Math.max(0, Math.min(text.length, spokenChars));
  const before = text.slice(0, cursor);
  const after = text.slice(cursor);
  const speaking = ttsBusy || Boolean(current);
  const canSkip = speaking || queue.length > 0;

  return (
    <div className="flex flex-col rounded-xl ring-1 ring-cyan-50/20 backdrop-blur-sm">
      <div className="flex items-center justify-between px-4 py-2">
        <div className="text-sm opacity-70">In lettura</div>
        <div className="text-[10px] opacity-50">
          {twitchStatus.connected
            ? `chat #${twitchStatus.channel ?? ''}`
            : twitchStatus.connecting
              ? 'connessione…'
              : 'offline'}
        </div>
      </div>
      <div className="flex items-start gap-3 px-4 pb-4">
        <p className="min-h-16 flex-1 text-lg leading-relaxed">
          {text ? (
            <>
              <span className="text-white">{before}</span>
              <span className="text-white/35">{after}</span>
            </>
          ) : (
            <span className="opacity-40">In attesa della chat…</span>
          )}
        </p>
        <div className="flex shrink-0 gap-1">
          <button
            type="button"
            disabled={!canSkip}
            onClick={() => void skipCurrent()}
            className="rounded-full ring-1 ring-cyan-50/20 hover:bg-cyan-50/10 disabled:opacity-30"
            title="Salta e leggi il prossimo"
          >
            <SkipForward className="w-5 h-5 m-2 stroke-1" />
          </button>
          <button
            type="button"
            disabled={!speaking}
            onClick={() => void stopReading()}
            className="rounded-full ring-1 ring-cyan-50/20 hover:bg-cyan-50/10 disabled:opacity-30"
            title="Pausa: ferma questo, coda in attesa"
          >
            <Square className="w-5 h-5 m-2 stroke-1" />
          </button>
        </div>
      </div>
    </div>
  );
}
