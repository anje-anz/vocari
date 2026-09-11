import React, { useEffect, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { Select, type SelectId } from '../Select';
import { useLive } from '../../contexts/live-context';
import { AudioControls } from '../audio-controls';
import type { MinReadRole, SystemVoice } from '../../lib/live/types';

function Section({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl ring-1 ring-cyan-50/10 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between px-4 py-2 hover:bg-cyan-50/5"
      >
        <span>{title}</span>
        <ChevronRight className={`w-4 h-4 opacity-70 transition-transform ${open ? 'rotate-90' : ''}`} />
      </button>
      <div className={`grid transition-[grid-template-rows] duration-300 ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
        <div className="overflow-hidden">
          <div className="px-4 pb-4 pt-1">{children}</div>
        </div>
      </div>
    </div>
  );
}

const ROLE_OPTIONS: { id: MinReadRole; label: string }[] = [
  { id: 'everyone', label: 'Tutti' },
  { id: 'sub', label: 'Sub+' },
  { id: 'vip', label: 'VIP+' },
  { id: 'mod', label: 'Mod+' },
  { id: 'broadcaster', label: 'Broadcaster' },
];

export function LiveSettings() {
  const { state, patchRules, patchVoice, patchClientId } = useLive();
  const [voices, setVoices] = useState<{ id: SelectId; label: string }[]>([
    { id: 'voice-auto', label: 'Auto' },
  ]);
  const [clientId, setClientId] = useState(state.twitchClientId);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const systemVoices = (await window.electronAPI?.getSystemVoices?.()) ?? [];
      if (cancelled) return;
      const mapped: { id: string; label: string }[] = [
        { id: 'voice-auto', label: 'Auto' },
        ...systemVoices.map((voice: SystemVoice) => ({
          id: voice.id,
          label: voice.culture ? `${voice.name} (${voice.culture})` : voice.name,
        })),
      ];
      setVoices(mapped);
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setClientId(state.twitchClientId);
  }, [state.twitchClientId]);

  return (
    <div className="flex flex-col gap-2">
      <Section title="Voce">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <Select
              options={voices}
              value={state.voice.voiceId}
              onChange={(id) => patchVoice({ voiceId: id })}
            />
          </div>
          <label className="flex items-center gap-3 text-sm">
            <span className="w-20 opacity-70">Velocità</span>
            <input
              type="range"
              min={-6}
              max={6}
              step={1}
              value={state.voice.rate}
              onChange={(event) => patchVoice({ rate: Number(event.target.value) })}
              className="flex-1 accent-cyan-100"
            />
            <span className="w-8 text-right opacity-70">{state.voice.rate}</span>
          </label>
          <label className="flex items-center gap-3 text-sm">
            <span className="w-20 opacity-70">Pitch</span>
            <input
              type="range"
              min={-10}
              max={10}
              step={1}
              value={state.voice.pitch}
              onChange={(event) => patchVoice({ pitch: Number(event.target.value) })}
              className="flex-1 accent-cyan-100"
            />
            <span className="w-8 text-right opacity-70">{state.voice.pitch}</span>
          </label>
        </div>
      </Section>

      <Section title="Audio">
        <p className="text-sm opacity-70 mb-3">
          Scegli le cuffie o il cavo virtuale qui, non dal default di Windows. Con Bluetooth
          preferisci l&apos;uscita Stereo, non Hands-Free.
        </p>
        <AudioControls />
      </Section>

      <Section title="Piattaforma">
        <div className="flex flex-col gap-3 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={state.rules.ignoreBots}
              onChange={(event) => patchRules({ ignoreBots: event.target.checked })}
            />
            Ignora bot noti
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={state.rules.ignoreEmoteOnly}
              onChange={(event) => patchRules({ ignoreEmoteOnly: event.target.checked })}
            />
            Ignora messaggi solo emote
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={state.rules.mentionOnly}
              onChange={(event) => patchRules({ mentionOnly: event.target.checked })}
            />
            Leggi solo menzioni del canale
          </label>
          <label className="flex items-center gap-3">
            <span className="opacity-70">Ruolo minimo</span>
            <Select
              options={ROLE_OPTIONS.map((item) => ({ id: item.id, label: item.label }))}
              value={state.rules.minRole}
              onChange={(id) => patchRules({ minRole: id as MinReadRole })}
            />
          </label>
          <label className="flex items-center gap-3">
            <span className="opacity-70">Salta comandi</span>
            <input
              value={state.rules.skipCommandPrefix}
              onChange={(event) => patchRules({ skipCommandPrefix: event.target.value })}
              className="w-16 rounded-lg bg-transparent px-2 py-1 ring-1 ring-cyan-50/20 outline-none"
              placeholder="!"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="opacity-70">Twitch Client ID</span>
            <input
              value={clientId}
              onChange={(event) => {
                setClientId(event.target.value);
                patchClientId(event.target.value);
              }}
              className="rounded-lg bg-transparent px-3 py-2 ring-1 ring-cyan-50/20 outline-none"
              placeholder="dev.twitch.tv/console"
            />
          </label>
        </div>
      </Section>
    </div>
  );
}
