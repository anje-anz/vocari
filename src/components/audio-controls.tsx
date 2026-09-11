import { useEffect, useMemo, useState } from 'react';
import { Select } from './Select';
import { useLive } from '../contexts/live-context';
import type { AudioOutput } from '../lib/live/types';

export function AudioControls({ compact = false }: { compact?: boolean }) {
  const { state, patchAudio } = useLive();
  const [outputs, setOutputs] = useState<AudioOutput[]>([
    { id: 'default', name: 'Uscita predefinita di Windows' },
  ]);

  useEffect(() => {
    let cancelled = false;
    const currentId = state.audioOutputId;
    const load = async () => {
      try {
        const audio = await window.electronAPI?.getAudioOutputs?.();
        if (cancelled || !audio?.length) return;
        setOutputs(audio);
        if (!audio.some((item) => item.id === currentId)) {
          patchAudio({ audioOutputId: 'default' });
        }
      } catch {
        // resta il fallback
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [patchAudio, state.audioOutputId]);

  const options = useMemo(
    () => outputs.map((item) => ({ id: item.id, label: item.name })),
    [outputs]
  );

  return (
    <div className={`flex ${compact ? 'flex-wrap items-center gap-3' : 'flex-col gap-3'}`}>
      <Select
        className={compact ? 'max-w-56' : 'max-w-full'}
        options={options}
        value={state.audioOutputId}
        onChange={(id) => patchAudio({ audioOutputId: id })}
      />
      <label className={`flex items-center gap-3 text-sm ${compact ? 'min-w-48 flex-1' : ''}`}>
        <span className="w-16 shrink-0 opacity-70">Volume</span>
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          aria-label="Volume TTS"
          value={state.audioVolume}
          onChange={(event) => patchAudio({ audioVolume: Number(event.target.value) })}
          className="flex-1 accent-cyan-100"
        />
        <span className="w-8 text-right opacity-70">{state.audioVolume}</span>
      </label>
    </div>
  );
}
