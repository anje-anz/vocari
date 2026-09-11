import React, { useEffect, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { Select, type SelectId } from '../Select';
import { useLive } from '../../contexts/live-context';
import { AudioControls } from '../audio-controls';
import type { MinReadRole, SystemVoice } from '../../lib/live/types';

function Section({
  title,
  hint,
  children,
  defaultOpen = true,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between px-1 py-2"
      >
        <span className="flex items-baseline gap-2">
          <span>{title}</span>
          {hint && <span className="text-xs opacity-50">{hint}</span>}
        </span>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-1 ring-line">
          <ChevronRight
            className={`h-4 w-4 stroke-1 transition-transform duration-200 ease-out ${
              open ? 'rotate-90' : ''
            }`}
          />
        </span>
      </button>
      <div className="h-px bg-white/20" />
      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-out ${
          open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div className="overflow-hidden">
          <div className="px-1 pb-3 pt-3">{children}</div>
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
    <div className="flex flex-col gap-1 rounded-lg p-3 ring-1 ring-line backdrop-blur-sm">
      <Section title="Voce">
        <div className="flex flex-col gap-3">
          <Select
            options={voices}
            value={state.voice.voiceId}
            onChange={(id) => patchVoice({ voiceId: id })}
          />
          <label className="flex items-center gap-3 text-sm">
            <span className="w-20 opacity-70">Velocità</span>
            <input
              type="range"
              min={-6}
              max={6}
              step={1}
              value={state.voice.rate}
              onChange={(event) => patchVoice({ rate: Number(event.target.value) })}
              className="vocari-range flex-1"
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
              className="vocari-range flex-1"
            />
            <span className="w-8 text-right opacity-70">{state.voice.pitch}</span>
          </label>
        </div>
      </Section>

      <Section title="Audio" hint="Stereo, non Hands-Free">
        <AudioControls />
      </Section>

      <Section title="Piattaforma" defaultOpen={false}>
        <div className="flex flex-col gap-3 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              className="vocari-check"
              checked={state.rules.ignoreBots}
              onChange={(event) => patchRules({ ignoreBots: event.target.checked })}
            />
            Ignora bot noti
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              className="vocari-check"
              checked={state.rules.ignoreEmoteOnly}
              onChange={(event) => patchRules({ ignoreEmoteOnly: event.target.checked })}
            />
            Ignora messaggi solo emote
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              className="vocari-check"
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
              className="w-16 rounded-lg bg-transparent px-2 py-1 ring-1 ring-line outline-none"
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
              className="rounded-lg bg-transparent px-3 py-2 ring-1 ring-line outline-none"
              placeholder="dev.twitch.tv/console"
            />
          </label>
        </div>
      </Section>
    </div>
  );
}
