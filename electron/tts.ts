import { spawn, execFile, type ChildProcessWithoutNullStreams } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { TtsProgress, TtsState } from '../src/lib/live/types';
import { isShuttingDown } from './lifecycle';

const ttsProcBySender = new Map<number, ChildProcessWithoutNullStreams>();

function psSingleQuote(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

const stoppedPids = new Set<number>();

export function stopForSender(senderId: number): boolean {
  const proc = ttsProcBySender.get(senderId);
  if (!proc) return false;

  if (proc.pid) stoppedPids.add(proc.pid);

  try {
    proc.kill();
  } catch {
    // ignore
  }

  if (process.platform === 'win32' && proc.pid) {
    try {
      spawn('taskkill', ['/PID', String(proc.pid), '/T', '/F']);
    } catch {
      // ignore
    }
  }

  ttsProcBySender.delete(senderId);
  return true;
}

export function stopAllTts(): boolean {
  const ids = [...ttsProcBySender.keys()];
  let stopped = false;
  for (const id of ids) {
    if (stopForSender(id)) stopped = true;
  }
  return stopped;
}

export function speakSystem(
  senderId: number,
  text: string,
  voiceId: string | undefined,
  rate: number | undefined,
  pitch: number | undefined,
  volume: number | undefined,
  outputId: string | undefined,
  sendState: (state: TtsState) => void,
  sendProgress: (progress: TtsProgress) => void
): Promise<void> {
  if (isShuttingDown()) return Promise.resolve();

  const trimmed = text.trim();
  if (!trimmed) return Promise.resolve();

  stopForSender(senderId);

  return new Promise((resolve, reject) => {
    let child: ChildProcessWithoutNullStreams;
    let scriptPath: string | undefined;
    let ssmlPath: string | undefined;
    let stderrBuf = '';

    if (process.platform === 'darwin') {
      child = spawn('say', [trimmed]);
      setTimeout(() => sendState('start'), 120);
    } else if (process.platform === 'win32') {
      const rateValue = typeof rate === 'number' ? rate : 0;
      const pitchValue = typeof pitch === 'number' ? pitch : 0;
      const volumeValue = Math.max(
        0,
        Math.min(100, typeof volume === 'number' && Number.isFinite(volume) ? Math.round(volume) : 80)
      );
      const ratePct = Math.max(50, Math.min(200, 100 + rateValue * 8));
      const pitchPct = Math.max(-50, Math.min(50, pitchValue * 5));
      const pitchAttr = `${pitchPct >= 0 ? '+' : ''}${pitchPct}%`;
      const inner = escapeXml(trimmed);
      const ssml =
        `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="it-IT">` +
        `<prosody pitch="${pitchAttr}" rate="${ratePct}%">${inner}</prosody></speak>`;
      const useDevice = Boolean(outputId && outputId !== 'default');

      const voiceSelectNet = voiceId
        ? `$speak.SelectVoice(${psSingleQuote(voiceId)})`
        : '';
      const voiceSelectCom = voiceId
        ? `
$voices = $voice.GetVoices()
$want = ${psSingleQuote(voiceId)}
for ($i = 0; $i -lt $voices.Count; $i++) {
  $tok = $voices.Item($i)
  $desc = [string]$tok.GetDescription()
  if ($desc -eq $want -or $tok.Id -eq $want -or $desc.Contains($want)) {
    $voice.Voice = $tok
    break
  }
}
`
        : '';
      const deviceSelect = useDevice
        ? `
$outs = $voice.GetAudioOutputs()
$wantOut = ${psSingleQuote(outputId ?? '')}
$matched = $false
for ($i = 0; $i -lt $outs.Count; $i++) {
  $tok = $outs.Item($i)
  if ([string]$tok.Id -eq $wantOut) {
    $voice.AudioOutput = $tok
    $matched = $true
    break
  }
}
if (-not $matched) { throw "Uscita audio non trovata" }
`
        : '';

      const stamp = Date.now();
      ssmlPath = path.join(os.tmpdir(), `vocari-tts-${senderId}-${stamp}.ssml`);
      scriptPath = path.join(os.tmpdir(), `vocari-tts-${senderId}-${stamp}.ps1`);
      fs.writeFileSync(ssmlPath, ssml, 'utf8');
      const ssmlLoad = `$ssml = Get-Content -Raw -Encoding UTF8 ${psSingleQuote(ssmlPath)}`;

      const script = useDevice
        ? `
$ErrorActionPreference = 'Stop'
$voice = New-Object -ComObject SAPI.SpVoice
$voice.Volume = ${volumeValue}
$voice.EventInterests = 33790
${deviceSelect}
${voiceSelectCom}
${ssmlLoad}
try {
  $null = $voice.add_StartStream({ [Console]::Out.WriteLine("__VOCARI_START__") })
  $null = $voice.add_Word({
    param($streamNumber, $streamPosition, $characterPosition, $length)
    [Console]::Out.WriteLine(("__VOCARI_PROGRESS__|{0}|{1}" -f $characterPosition, $length))
  })
  $null = $voice.add_EndStream({ [Console]::Out.WriteLine("__VOCARI_END__") })
} catch {}
[Console]::Out.WriteLine("__VOCARI_START__")
$null = $voice.Speak($ssml, 8)
[Console]::Out.WriteLine("__VOCARI_END__")
`
        : `
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Speech
$speak = New-Object System.Speech.Synthesis.SpeechSynthesizer
$speak.Volume = ${volumeValue}
${voiceSelectNet}
${ssmlLoad}
$null = $speak.add_SpeakStarted({ [Console]::Out.WriteLine("__VOCARI_START__") })
$null = $speak.add_SpeakProgress({
  param($sender, $e)
  [Console]::Out.WriteLine(("__VOCARI_PROGRESS__|{0}|{1}" -f $e.CharacterPosition, $e.CharacterCount))
})
$null = $speak.add_SpeakCompleted({ [Console]::Out.WriteLine("__VOCARI_END__") })
$speak.SpeakSsml($ssml)
`;
      fs.writeFileSync(scriptPath, `\uFEFF${script}`, 'utf8');
      child = spawn(
        'powershell.exe',
        [
          '-NoProfile',
          '-NonInteractive',
          '-STA',
          '-ExecutionPolicy',
          'Bypass',
          '-File',
          scriptPath,
        ],
        { windowsHide: true }
      );

      child.stderr.on('data', (chunk) => {
        stderrBuf += chunk.toString('utf8');
      });

      let buf = '';
      child.stdout.on('data', (chunk) => {
        buf += chunk.toString('utf8');
        const lines = buf.split(/\r?\n/);
        buf = lines.pop() ?? '';
        for (const line of lines) {
          const t = line.trim();
          if (t === '__VOCARI_START__') sendState('start');
          if (t === '__VOCARI_END__') sendState('end');
          if (t.startsWith('__VOCARI_PROGRESS__|')) {
            const parts = t.split('|');
            const position = Number(parts[1] ?? 0);
            const count = Number(parts[2] ?? 0);
            if (!Number.isFinite(position)) continue;
            const innerStart = ssml.indexOf(inner);
            let adjusted = position;
            if (position > trimmed.length && innerStart >= 0) {
              adjusted = Math.max(0, position - innerStart);
            }
            sendProgress({ position: adjusted, count });
          }
        }
      });
    } else {
      child = spawn('spd-say', [trimmed]);
      setTimeout(() => sendState('start'), 120);
    }

    ttsProcBySender.set(senderId, child);

    const cleanup = () => {
      const current = ttsProcBySender.get(senderId);
      if (current === child) ttsProcBySender.delete(senderId);
      if (scriptPath) {
        try {
          fs.unlinkSync(scriptPath);
        } catch {
          // ignore
        }
      }
      if (ssmlPath) {
        try {
          fs.unlinkSync(ssmlPath);
        } catch {
          // ignore
        }
      }
    };

    child.on('error', (err) => {
      sendState('end');
      cleanup();
      reject(err);
    });

    child.on('close', (code) => {
      sendState('end');
      cleanup();
      const stopped = child.pid != null && stoppedPids.delete(child.pid);
      if (isShuttingDown() || stopped || code === 0 || code === null) {
        resolve();
        return;
      }
      const detail = stderrBuf.trim();
      reject(
        new Error(
          detail
            ? `TTS process exited with code ${code}: ${detail}`
            : `TTS process exited with code ${code}`
        )
      );
    });
  });
}

export function getSystemVoices(): Promise<{ id: string; name: string; culture: string }[]> {
  if (process.platform !== 'win32') return Promise.resolve([]);

  const psCommand = `
    Add-Type -AssemblyName System.Speech;
    $speak = New-Object System.Speech.Synthesis.SpeechSynthesizer;
    $speak.GetInstalledVoices() | ForEach-Object {
      [PSCustomObject]@{
        Name    = $_.VoiceInfo.Name;
        Culture = $_.VoiceInfo.Culture.Name;
      }
    } | ConvertTo-Json -Depth 2
  `;

  return new Promise((resolve) => {
    execFile(
      'powershell.exe',
      ['-NoProfile', '-NonInteractive', '-STA', '-ExecutionPolicy', 'Bypass', '-Command', psCommand],
      (error, stdout, stderr) => {
        if (error) {
          console.error('Errore PowerShell getSystemVoices:', error, stderr);
          return resolve([]);
        }
        const out = stdout.trim();
        if (!out) return resolve([]);
        try {
          const json = JSON.parse(out) as unknown;
          const arr = Array.isArray(json) ? json : [json];
          const voices = arr
            .map((item) => {
              if (!item || typeof item !== 'object') return null;
              const row = item as { Name?: string; Culture?: string };
              if (!row.Name) return null;
              return { id: row.Name, name: row.Name, culture: row.Culture ?? '' };
            })
            .filter((item): item is { id: string; name: string; culture: string } => item !== null);
          resolve(voices);
        } catch (err) {
          console.error('Errore parsing JSON voci di sistema:', err);
          resolve([]);
        }
      }
    );
  });
}
