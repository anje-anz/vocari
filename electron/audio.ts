import { execFile } from 'node:child_process';
import type { AudioOutput } from '../src/lib/live/types';

const FALLBACK: AudioOutput[] = [{ id: 'default', name: 'Uscita predefinita di Windows' }];

export function getAudioOutputs(): Promise<AudioOutput[]> {
  if (process.platform !== 'win32') return Promise.resolve(FALLBACK);

  const psCommand = `
$ErrorActionPreference = 'Stop'
try {
  $voice = New-Object -ComObject SAPI.SpVoice
  $outs = $voice.GetAudioOutputs()
  $items = @()
  $items += [pscustomobject]@{ id = 'default'; name = 'Uscita predefinita di Windows' }
  for ($i = 0; $i -lt $outs.Count; $i++) {
    $tok = $outs.Item($i)
    $items += [pscustomobject]@{ id = [string]$tok.Id; name = [string]$tok.GetDescription() }
  }
  $items | ConvertTo-Json -Compress -Depth 3
} catch {
  [pscustomobject]@{ id = 'default'; name = 'Uscita predefinita di Windows' } | ConvertTo-Json -Compress
}
`.trim();

  return new Promise((resolve) => {
    execFile(
      'powershell.exe',
      ['-NoProfile', '-NonInteractive', '-STA', '-ExecutionPolicy', 'Bypass', '-Command', psCommand],
      { timeout: 15000, windowsHide: true },
      (error, stdout) => {
        if (error) return resolve(FALLBACK);
        const out = stdout.trim();
        if (!out) return resolve(FALLBACK);
        try {
          const json = JSON.parse(out) as unknown;
          const arr = Array.isArray(json) ? json : [json];
          const devices = arr
            .map((item) => {
              if (!item || typeof item !== 'object') return null;
              const row = item as { id?: string; name?: string };
              if (!row.id || !row.name) return null;
              return { id: row.id, name: row.name };
            })
            .filter((item): item is AudioOutput => item !== null);
          resolve(devices.length > 0 ? devices : FALLBACK);
        } catch {
          resolve(FALLBACK);
        }
      }
    );
  });
}
