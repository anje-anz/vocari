import { SkipForward, Square } from 'lucide-react';
import { useLive } from '../../contexts/live-context';
import { utteranceText } from '../../lib/live/policy';

export function NowReading() {
  const { current, spokenChars, ttsBusy, queue, stopReading, skipCurrent } = useLive();
  const text = current ? utteranceText(current) : '';
  const cursor = Math.max(0, Math.min(text.length, spokenChars));
  const before = text.slice(0, cursor);
  const after = text.slice(cursor);
  const speaking = ttsBusy || Boolean(current);
  const canSkip = speaking || queue.length > 0;

  return (
    <div className="flex flex-col rounded-lg ring-1 ring-line backdrop-blur-sm">
      <div className="px-4 py-2">
        <div>In lettura</div>
      </div>
      <div className="flex items-center gap-3 px-4 pb-3">
        <p className="min-h-10 flex-1 text-lg leading-relaxed">
          {text ? (
            <>
              <span className="text-white">{before}</span>
              <span className="text-white/40">{after}</span>
            </>
          ) : (
            <span className="opacity-60">In attesa della chat…</span>
          )}
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            disabled={!canSkip}
            onClick={() => void skipCurrent()}
            className="flex h-10 w-10 items-center justify-center rounded-full ring-1 ring-line hover:bg-white/10 disabled:opacity-40"
            title="Salta e leggi il prossimo"
          >
            <SkipForward className="h-6 w-6 stroke-1" />
          </button>
          <button
            type="button"
            disabled={!speaking}
            onClick={() => void stopReading()}
            className="flex h-10 w-10 items-center justify-center rounded-full ring-1 ring-line hover:bg-white/10 disabled:opacity-40"
            title="Pausa: ferma questo, coda in attesa"
          >
            <Square className="h-6 w-6 stroke-1" />
          </button>
        </div>
      </div>
    </div>
  );
}
