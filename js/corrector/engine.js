// Motor de correção: aplica as regras, gera o texto corrigido, o diff e a nota.

import { RULES } from './rules.js';
import { esc, clamp, words as wordList } from '../utils.js';

const MAX_PASSES = 3;

function collect(text) {
  const found = [];
  for (const rule of RULES) {
    rule.re.lastIndex = 0;
    let m;
    let guard = 0;
    while ((m = rule.re.exec(text)) !== null && guard++ < 60) {
      if (m[0] === '') { rule.re.lastIndex++; continue; }
      const suggestion = rule.fix ? rule.fix(m) : null;
      if (suggestion !== null && suggestion === m[0]) continue;
      found.push({
        ruleId: rule.id,
        cat: rule.cat,
        sev: rule.sev,
        why: rule.why,
        ex: rule.ex || '',
        warn: !rule.fix,
        start: m.index,
        end: m.index + m[0].length,
        original: m[0],
        suggestion,
      });
      if (!rule.re.global) break;
    }
  }
  return found;
}

/** Escolhe correções que não se sobrepõem (mais graves primeiro). */
function resolve(found) {
  const fixes = found.filter((f) => !f.warn)
    .sort((a, b) => b.sev - a.sev || a.start - b.start || (b.end - b.start) - (a.end - a.start));
  const taken = [];
  const accepted = [];
  for (const f of fixes) {
    if (taken.some(([s, e]) => f.start < e && f.end > s)) continue;
    taken.push([f.start, f.end]);
    accepted.push(f);
  }
  const warnings = found.filter((w) => w.warn
    && !accepted.some((f) => w.start < f.end && w.end > f.start));
  return { accepted: accepted.sort((a, b) => a.start - b.start), warnings };
}

function applyFixes(text, accepted) {
  let out = '';
  let cursor = 0;
  for (const f of accepted) {
    out += text.slice(cursor, f.start) + f.suggestion;
    cursor = f.end;
  }
  return out + text.slice(cursor);
}

/** Maiúscula no início das frases e pontuação final. */
function polish(text) {
  const issues = [];
  let out = text.replace(/(^|[.!?]\s+)([a-z])/g, (m, pre, ch) => pre + ch.toUpperCase());
  if (out !== text) {
    issues.push({
      ruleId: 'sentence-case',
      cat: 'ortografia',
      sev: 1,
      why: 'Comece as frases com letra maiúscula.',
      ex: '',
      warn: false,
      original: text.trim().slice(0, 24),
      suggestion: out.trim().slice(0, 24),
    });
  }
  if (out.length > 3 && !/[.!?…]$/.test(out.trim())) {
    const mark = /^(what|where|when|who|why|how|do|does|did|are|is|am|can|could|would|should|will|have|has)\b/i.test(out.trim()) ? '?' : '.';
    out = `${out.trim()}${mark}`;
    issues.push({
      ruleId: 'final-punctuation',
      cat: 'estilo',
      sev: 1,
      why: `Feche a frase com "${mark}".`,
      ex: '',
      warn: false,
      original: '(sem pontuação)',
      suggestion: mark,
    });
  }
  return { text: out, issues };
}

function tokenize(text) {
  return text.match(/\s+|[^\s]+/g) || [];
}

/** Diff palavra a palavra entre original e correção, em HTML. */
export function diffHtml(original, corrected) {
  const a = tokenize(original);
  const b = tokenize(corrected);
  const n = a.length;
  const m = b.length;
  const lcs = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      lcs[i][j] = a[i] === b[j]
        ? lcs[i + 1][j + 1] + 1
        : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
    }
  }
  const parts = [];
  let i = 0;
  let j = 0;
  const push = (type, txt) => {
    const last = parts[parts.length - 1];
    if (last && last.type === type) last.txt += txt;
    else parts.push({ type, txt });
  };
  while (i < n && j < m) {
    if (a[i] === b[j]) { push('same', a[i]); i++; j++; } else if (lcs[i + 1][j] >= lcs[i][j + 1]) { push('del', a[i]); i++; } else { push('ins', b[j]); j++; }
  }
  while (i < n) { push('del', a[i]); i++; }
  while (j < m) { push('ins', b[j]); j++; }
  return parts.map(({ type, txt }) => {
    if (type === 'same') return esc(txt);
    if (!txt.trim()) return esc(txt);
    return type === 'del' ? `<del>${esc(txt)}</del>` : `<ins>${esc(txt)}</ins>`;
  }).join('');
}

/**
 * Analisa uma frase (ou parágrafo) e devolve correção + explicações.
 * @param {string} input texto do aluno
 */
export function analyze(input, { mode = 'text' } = {}) {
  const original = String(input || '').replace(/\s+/g, ' ').trim();
  const issues = [];
  const usedRules = new Set();
  let current = original;

  for (let pass = 0; pass < MAX_PASSES; pass++) {
    const { accepted, warnings } = resolve(collect(current));
    if (pass === 0) issues.push(...warnings);
    // Uma regra só age em um passe: evita correções em cascata sobre si mesmas.
    const usable = pass === 0 ? accepted : accepted.filter((f) => !usedRules.has(f.ruleId));
    if (!usable.length) break;
    usable.forEach((f) => usedRules.add(f.ruleId));
    issues.push(...usable);
    current = applyFixes(current, usable);
  }

  const { text: corrected, issues: polishIssues } = polish(current);
  issues.push(...polishIssues);

  // No modo voz, o reconhecimento de fala decide pontuação e grafia:
  // cobrar isso do aluno seria injusto.
  const VOICE_MUTED = new Set(['sentence-case', 'final-punctuation', 'lowercase-i']);
  const relevant = mode === 'voice'
    ? issues.filter((it) => !VOICE_MUTED.has(it.ruleId) && it.cat !== 'ortografia')
    : issues;

  // Deduplica explicações repetidas da mesma regra.
  const seen = new Set();
  const unique = relevant.filter((it) => {
    const key = `${it.ruleId}|${it.original.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Pontuação/maiúsculas e avisos pesam menos que um erro de gramática.
  const FORMAT = new Set(['final-punctuation', 'sentence-case', 'lowercase-i', 'proper-noun-case']);
  const count = wordList(original).length;
  const weighted = unique.reduce((sum, it) => {
    if (it.warn) return sum + it.sev * 0.4;
    if (FORMAT.has(it.ruleId)) return sum + 0.5;
    return sum + it.sev;
  }, 0);
  const accuracy = count === 0 ? 0 : clamp(Math.round(100 - (weighted / Math.max(count, 5)) * 55), 0, 100);
  const changed = corrected.replace(/[.?!]$/, '').toLowerCase() !== original.replace(/[.?!]$/, '').toLowerCase();

  return {
    original,
    corrected,
    changed,
    issues: unique.sort((a, b) => b.sev - a.sev),
    stats: {
      words: count,
      errors: unique.filter((i) => !i.warn).length,
      warnings: unique.filter((i) => i.warn).length,
      weighted: Math.round(weighted * 10) / 10,
      accuracy,
    },
    diff: diffHtml(original, corrected),
  };
}

/** Resumo curto em português para mostrar no chat. */
export function summarize(result) {
  const { stats } = result;
  if (!stats.words) return 'Nada para analisar.';
  if (!stats.errors && !stats.warnings) return 'Perfeito! Nenhum ajuste necessário. 🎯';
  const bits = [];
  if (stats.errors) bits.push(`${stats.errors} ${stats.errors === 1 ? 'correção' : 'correções'}`);
  if (stats.warnings) bits.push(`${stats.warnings} ${stats.warnings === 1 ? 'observação' : 'observações'}`);
  return `${bits.join(' e ')} — precisão ${stats.accuracy}%`;
}
