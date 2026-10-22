import voix from './voix.json';
import timings from './voix-timings.json';

/**
 * Minutage mot par mot des sous-titres. La synthèse donne le début et la fin réels de chaque phrase
 * (voix-timings.json, écrit par scripts/make_voiceover.py) ; dans une phrase, les mots se répartissent
 * selon leur longueur, avec une petite pause après une virgule ou des points de suspension.
 */
export type Word = { line: number; sentence: number; text: string; t0: number; t1: number; last: boolean };

const splitSentences = (s: string) => s.split(/(?<=[.?!…])\s+/).filter(Boolean);

const tokens = (s: string) => {
  const raw = s.replace(/(\d) (\d{3})/g, '$1\u00a0$2').split(/[ \t\n]+/).filter(Boolean);
  const out: string[] = [];
  for (const w of raw) {
    // La ponctuation isolée (« bourse ? ») reste collée au mot précédent.
    if (/^[?!:;]$/.test(w) && out.length) out[out.length - 1] += '\u00a0' + w;
    else out.push(w);
  }
  return out;
};

const weight = (w: string) => {
  const core = w.replace(/[^\p{L}\p{N}]/gu, '').replace(/\d/g, 'xxx');
  return Math.max(2, core.length) + (/[,…]$/.test(w) ? 4 : 0);
};

const build = (): Word[] => {
  const words: Word[] = [];
  voix.lines.forEach((ln, line) => {
    const shown = (ln as { show?: string }).show ?? ln.text;
    const segs = timings.lines[line].sentences;
    let sentences = splitSentences(shown);
    let spans: number[][] = segs;
    if (sentences.length !== segs.length) {
      sentences = [shown];
      spans = [[segs[0][0], segs[segs.length - 1][1]]];
    }
    sentences.forEach((s, si) => {
      const ws = tokens(s);
      const total = ws.reduce((a, w) => a + weight(w), 0);
      const [a, b] = spans[si];
      let cum = 0;
      ws.forEach((w, wi) => {
        const t0 = a + ((b - a) * cum) / total;
        cum += weight(w);
        const t1 = a + ((b - a) * cum) / total;
        words.push({ line, sentence: si, text: w, t0, t1, last: wi === ws.length - 1 });
      });
    });
  });
  return words;
};

export const WORDS = build();

/** Début (s) du mot qui commence par `prefix` dans la réplique `line` (n-ième occurrence). */
export const wordT = (line: number, prefix: string, nth = 0) => {
  const m = WORDS.filter((w) => w.line === line && w.text.toLowerCase().startsWith(prefix.toLowerCase()));
  const w = m[nth] ?? m[0];
  if (!w) throw new Error(`mot introuvable : ${prefix} (réplique ${line})`);
  return w.t0;
};

export const lineWords = (line: number) => WORDS.filter((w) => w.line === line);
