// ttsParser.ts
// Algoritmo di parsing fonetico minimale per TTS italiano (Vocari)
// ‣ Converte testo in sequenza di token audio (nomi dei file .wav) + silenzi
// ‣ Copre tutte le combinazioni "minime ma sufficienti" discusse (≈38 clip)
// -----------------------------------------------------------------------------
// CLIP SET di riferimento (nome → file):
// Vocali:            a, i, u, echiusa, eaperta, ochiusa, oaperta
// C/G:               c_dura, c_dolce, g_dura, g_dolce
// Consonanti base:   b, d, f, l, m, n, p, q, r, t, v, s, z_sonora, ts
// Palatali/Affric.:  ci, gi, sci, sch, gn, gl_pal, sh
// Geminate:          tt_double, ll_double, rr_double, ss_double
// Altri:             pause60 (silenzio 60 ms), pause150, pause250, pause300
// -----------------------------------------------------------------------------

export type Token =
  | { type: 'audio'; clip: string }
  | { type: 'silence'; ms: number };

// ---------------- Utility costanti ----------------
const VOWELS = 'aeiouàèéìòóù';
const CONSONANTS_SONORE = 'bdgvmnlr';
const SPACE_SILENCE = 60;
const COMMA_SILENCE = 150;
const DOT_SILENCE = 250;
const QUEST_SILENCE = 300;

// Accent mapping → clip
const ACCENT_MAP: Record<string, string> = {
  'à': 'a',
  'é': 'echiusa',
  'è': 'eaperta',
  'ì': 'i',
  'ó': 'ochiusa',
  'ò': 'oaperta',
  'ù': 'u',
};

// ---------------- Parser principale ----------------
export function textToClips(raw: string): Token[] {
  const clips: Token[] = [];

  // 1. normalizzazione di base
  let txt = raw.normalize('NFC').toLowerCase();
  txt = txt
    .replace(/[“”«»]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/\s+/g, ' ') // spazi multipli
    .replace(/\n+/g, ' ⏎ ');

  // 2. tokenizzazione approssimativa (parole + punteggiatura)
  const tokens = txt.match(/[a-zàèéìòóù']+|[,.!?;:]|⏎|\s/g) ?? [];

  for (const tok of tokens) {
    if (/^\s+$/.test(tok)) {
      clips.push({ type: 'silence', ms: SPACE_SILENCE });
      continue;
    }
    if (tok === '⏎') {
      clips.push({ type: 'silence', ms: DOT_SILENCE + 100 });
      continue;
    }
    if (/,/.test(tok)) {
      clips.push({ type: 'silence', ms: COMMA_SILENCE });
      continue;
    }
    if (/[.!;:]/.test(tok)) {
      clips.push({ type: 'silence', ms: DOT_SILENCE });
      continue;
    }
    if (/[!?]/.test(tok)) {
      clips.push({ type: 'silence', ms: QUEST_SILENCE });
      continue;
    }

    // parola
    clips.push(...wordToClips(tok));
    clips.push({ type: 'silence', ms: SPACE_SILENCE });
  }

  return clips;
}

// ---------------- Converti parola → clip array ----------------
function wordToClips(word: string): Token[] {
  const out: Token[] = [];
  let i = 0;
  const w = word;
  while (i < w.length) {
    // --- 1. geminate (doppie) ----------------
    if (/^(bb|cc|dd|ff|gg|ll|mm|nn|pp|qq|rr|ss|tt|zz)/.test(w.slice(i))) {
      const gem = w.slice(i, i + 2);
      out.push({ type: 'audio', clip: `${gem}_double.wav` });
      i += 2;
      continue;
    }

    // --- 2. digrammi / trigrammi speciali ------
    // sch (sch + e/i)
    if (/^sch[eiéè]/.test(w.slice(i))) {
      out.push({ type: 'audio', clip: 'sch.wav' });
      i += 3; // lascia vocali da processare dopo
      continue;
    }
    // sci + quals.
    if (/^sci[aou]?/.test(w.slice(i))) {
      out.push({ type: 'audio', clip: 'sci.wav' });
      i += 3; // vocali residue gestite nel loop
      continue;
    }
    // gn, gli (palatale)
    if (/^gn/.test(w.slice(i))) {
      out.push({ type: 'audio', clip: 'gn.wav' });
      i += 2;
      continue;
    }
    if (/^gli[aoueìéè]?/.test(w.slice(i))) {
      out.push({ type: 'audio', clip: 'gl_pal.wav' });
      i += 2; // "gli" conta 2 char qui; la i/vocale seguente resta
      continue;
    }

    // --- 3. trattare 'c' e 'g' (dolce/dura) -----------
    const char = w[i];
    if (char === 'c' || char === 'g') {
      const clip = classifyCG(w, i);
      out.push({ type: 'audio', clip: `${clip}.wav` });
      i += 1;
      continue;
    }

    // --- 4. lettera "s" con regole di sonorizzazione ----
    if (char === 's') {
      const clip = classifyS(w, i);
      out.push({ type: 'audio', clip: `${clip}.wav` });
      i += 1;
      continue;
    }

    // --- 5. z iniziale / intervocalica (affricata vs fricata)
    if (char === 'z') {
      const clip = classifyZ(w, i);
      out.push({ type: 'audio', clip: `${clip}.wav` });
      i += 1;
      continue;
    }

    // --- 6. altre consonanti o vocali normali -----------
    const mapped = mapSimpleChar(char);
    if (mapped) out.push({ type: 'audio', clip: `${mapped}.wav` });
    i += 1;
  }
  return out;
}

// ---------------- Helpers ----------------
function classifyCG(word: string, idx: number): 'c_dolce' | 'c_dura' | 'g_dolce' | 'g_dura' {
  const char = word[idx];
  let rest = word.slice(idx + 1);

  // contrazione: c' + vocale = dolce (c'è, c'ho, g'è ...)
  if (/^'/.test(rest)) {
    const next = rest.replace(/^'/, '')[0] || '';
    if (VOWELS.includes(next)) {
      return char === 'c' ? 'c_dolce' : 'g_dolce';
    }
  }

  // skip apostrofo o h muta per guardare la vera vocale/consonante
  rest = rest.replace(/^['h]/, '');
  const next = rest[0] || '';

  const isDolce = 'eiéè'.includes(next);
  if (char === 'c') return isDolce ? 'c_dolce' : 'c_dura';
  return isDolce ? 'g_dolce' : 'g_dura';
}

function classifyS(word: string, idx: number): 's' | 'z_sonora' | 'ss_double' {
  // geminata già gestita prima, qui solo singola
  const prev = word[idx - 1] || '';
  const next = word[idx + 1] || '';
  const betweenVowels = VOWELS.includes(prev) && VOWELS.includes(next);
  const beforeSonora = CONSONANTS_SONORE.includes(next);
  return betweenVowels || beforeSonora ? 'z_sonora' : 's';
}

function classifyZ(word: string, idx: number): 'dz' | 'ts' {
  const prev = word[idx - 1] || '';
  const next = word[idx + 1] || '';
  // affricata sonora in inizio parola seguita da vocale
  const isStart = idx === 0;
  if (isStart && VOWELS.includes(next)) return 'dz';
  // intervocalica sonora
  if (VOWELS.includes(prev) && VOWELS.includes(next)) return 'dz';
  // altrimenti /ts/
  return 'ts';
}

function mapSimpleChar(ch: string): string | null {
  // vocali accentate
  if (ACCENT_MAP[ch]) return ACCENT_MAP[ch];

  // vocali base
  if ('aeiou'.includes(ch)) return ch;

  // consonanti base disponibili come clip singolo
  const consonantMap: Record<string, string> = {
    b: 'b', d: 'd', f: 'f', l: 'l', m: 'm', n: 'n', p: 'p', q: 'q', r: 'r', t: 't', v: 'v',
    // "s" già gestita, "z" già gestita, "c/g" gestite prima
  };
  return consonantMap[ch] || null;
}
