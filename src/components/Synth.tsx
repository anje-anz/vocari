import React, { useState, useEffect, useRef } from 'react';
import { Select, SelectOption, SelectId } from './Select';
import { AudioControls } from './audio-controls';
import { useLive } from '../contexts/live-context';
import { ArrowUpRight, Square } from 'lucide-react';

import Lottie, { LottieRefCurrentProps } from 'lottie-react';
import octaring from '../assets/lottie/octaring.json';

const MODEL_OPTIONS: SelectOption[] = [
  { id: 'model-1', label: 'Nativo OS' },
  { id: 'model-2', label: 'Modello 2' },
  { id: 'model-3', label: 'Modello 3' },
  { id: 'model-4', label: 'Modello 4' },
];

const SPEED_OPTIONS: SelectOption[] = [
  { id: 'speed-1', label: '0.2x' },
  { id: 'speed-2', label: '0.5x' },
  { id: 'speed-3', label: '1.0x' },
  { id: 'speed-4', label: '1.5x' },
  { id: 'speed-5', label: '2.0x' },
];

type TtsPhase = 'idle' | 'starting' | 'speaking';

const mapSpeedToRate = (speedId: SelectId): number => {
  switch (speedId) {
    case 'speed-1': return -6;
    case 'speed-2': return -3;
    case 'speed-3': return 0;
    case 'speed-4': return 3;
    case 'speed-5': return 6;
    default: return 0;
  }
};

// ✅ moltiplicatore per la velocità dell’animazione (indipendente dal rate del TTS)
const mapSpeedToAnimMultiplier = (speedId: SelectId): number => {
  switch (speedId) {
    case 'speed-1': return 0.7;
    case 'speed-2': return 0.85;
    case 'speed-3': return 1.0;
    case 'speed-4': return 1.15;
    case 'speed-5': return 1.3;
    default: return 1.0;
  }
};

function OctaRingIndicator({
  phase,
  animSpeed,
}: {
  phase: TtsPhase;
  animSpeed: number;
}) {
  const lottieRef = useRef<LottieRefCurrentProps>(null);

  useEffect(() => {
    const inst = lottieRef.current;
    if (!inst) return;

    // ✅ parte SOLO durante speaking
    if (phase !== 'speaking') {
      inst.stop();
      inst.goToAndStop(0, true);
      return;
    }

    // base: quanto vuoi energica l’animazione quando parla
    const baseSpeed = 1.6;

    inst.setSpeed(baseSpeed * animSpeed);
    inst.play();
  }, [phase, animSpeed]);

  return (
    <div className="w-10 h-10">
      <Lottie
        lottieRef={lottieRef}
        animationData={octaring}
        autoplay={false}
        loop={true}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
}

export const Synth: React.FC = () => {
  const { state } = useLive();
  const [text, setText] = useState('');
  const [selectedModel, setSelectedModel] = useState<SelectId>(MODEL_OPTIONS[0].id);
  const [selectedSpeed, setSelectedSpeed] = useState<SelectId>(SPEED_OPTIONS[2].id);

  const [voiceOptions, setVoiceOptions] = useState<SelectOption[]>([
    { id: 'voice-auto', label: 'Auto' },
  ]);
  const [selectedVoice, setSelectedVoice] = useState<SelectId>('voice-auto');

  const [ttsPhase, setTtsPhase] = useState<TtsPhase>('idle');

  const canSpeak = text.trim().length > 0;
  const isActive = ttsPhase !== 'idle';

  useEffect(() => {
    const off = window.electronAPI?.onTtsState?.((ttsState) => {
      if (ttsState === 'start') setTtsPhase('speaking');
      if (ttsState === 'end') setTtsPhase('idle');
    });
    return () => off?.();
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadVoicesForModel = async () => {
      if (selectedModel === 'model-1') {
        try {
          const systemVoices = await window.electronAPI?.getSystemVoices?.();

          let options: SelectOption[];
          if (systemVoices && systemVoices.length > 0) {
            const mapped = systemVoices.map((v) => ({
              id: v.id,
              label: v.culture ? `${v.name} (${v.culture})` : v.name,
            }));
            options = [{ id: 'voice-auto', label: 'Auto' }, ...mapped];
          } else {
            options = [
              { id: 'voice-auto', label: 'Auto' },
              { id: 'voice-1', label: 'Voce di sistema 1' },
              { id: 'voice-2', label: 'Voce di sistema 2' },
            ];
          }

          if (!cancelled) {
            setVoiceOptions(options);
            setSelectedVoice((prev) => (options.some((o) => o.id === prev) ? prev : 'voice-auto'));
          }
        } catch (err) {
          console.error('Errore caricando le voci di sistema:', err);
          if (!cancelled) {
            setVoiceOptions([{ id: 'voice-auto', label: 'Auto' }]);
            setSelectedVoice('voice-auto');
          }
        }
      } else {
        if (!cancelled) {
          setVoiceOptions([{ id: 'voice-auto', label: 'Auto' }]);
          setSelectedVoice('voice-auto');
        }
      }
    };

    loadVoicesForModel();
    return () => { cancelled = true; };
  }, [selectedModel]);

  const handleSpeak = async () => {
    const toSpeak = text.trim();
    if (!toSpeak) return;
    if (ttsPhase !== 'idle') return;

    // puoi lasciarlo: l’animazione NON parte in starting ora
    setTtsPhase('starting');

    try {
      if (selectedModel === 'model-1') {
        const rate = mapSpeedToRate(selectedSpeed);
        const voiceId = selectedVoice === 'voice-auto' ? undefined : selectedVoice;
        await window.electronAPI?.speakSystem?.(
          toSpeak,
          voiceId,
          rate,
          undefined,
          state.audioVolume,
          state.audioOutputId
        );
      } else {
        console.log('TODO: TTS per modello', selectedModel);
        setTtsPhase('idle');
      }
    } catch (err) {
      console.error('Errore TTS:', err);
      setTtsPhase('idle');
    }
  };

  const handleStop = async () => {
    if (ttsPhase === 'idle') return;

    try {
      await window.electronAPI?.stopSystem?.();
      setTtsPhase('idle');
    } catch (err) {
      console.error('Errore STOP TTS:', err);
      setTtsPhase('idle');
    }
  };

  return (
    <div className="flex flex-col h-full w-full items-center justify-center space-y-4">
      <h1 className="w-4/5 text-left text-2xl pl-4">Dai Voce alle tue Parole!</h1>

      <div className="flex flex-col w-4/5 h-fit ring ring-cyan-50/20 rounded-lg backdrop-blur-sm">
        <div className="flex items-center gap-3 p-4">
          <input
            type="text"
            placeholder="Scrivi qui"
            className="flex-1 outline-none bg-transparent"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <OctaRingIndicator
            phase={ttsPhase}
            animSpeed={mapSpeedToAnimMultiplier(selectedSpeed)}
          />
        </div>

        <div className="flex flex-row items-center space-x-4 px-4 pb-2">
          <Select options={MODEL_OPTIONS} value={selectedModel} onChange={setSelectedModel} />
          <Select options={voiceOptions} value={selectedVoice} onChange={setSelectedVoice} />
          <Select options={SPEED_OPTIONS} value={selectedSpeed} onChange={setSelectedSpeed} />

          <button
            className={`
              flex w-fit h-fit rounded-full ring-1 ring-cyan-50/20
              hover:bg-cyan-50/10 ml-auto
              disabled:opacity-80 disabled:cursor-not-allowed
            `}
            disabled={!isActive && !canSpeak}
            onClick={isActive ? handleStop : handleSpeak}
            title={isActive ? 'Stop' : 'Parla'}
          >
            {isActive ? (
              <Square className="w-6 h-6 m-2 stroke-1" />
            ) : (
              <ArrowUpRight className="w-6 h-6 m-2 stroke-1" />
            )}
          </button>
        </div>
        <div className="px-4 pb-4">
          <AudioControls compact />
        </div>
      </div>
    </div>
  );
};
