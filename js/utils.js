// Pequenas funções utilitárias usadas em todo o app.

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

export function esc(s = '') {
  return String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

export function html(strings, ...values) {
  return strings.reduce((acc, s, i) => acc + s + (i < values.length ? values[i] : ''), '');
}

export function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

export function uid(prefix = 'id') {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

export function cap(s = '') {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function todayKey(d = new Date()) {
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d - tz).toISOString().slice(0, 10);
}

export function daysBetween(a, b) {
  const ms = new Date(`${b}T00:00:00`) - new Date(`${a}T00:00:00`);
  return Math.round(ms / 86400000);
}

export function addDays(days, from = new Date()) {
  const d = new Date(from);
  d.setDate(d.getDate() + days);
  return todayKey(d);
}

export function fmtDateBR(key) {
  const [y, m, d] = key.split('-');
  return `${d}/${m}/${y}`;
}

export function words(text = '') {
  return (text.toLowerCase().match(/[a-z']+/g) || []).filter((w) => w !== "'");
}

export function debounce(fn, ms = 250) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

export function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

export function pick(arr, seed = Math.random()) {
  return arr[Math.floor(seed * arr.length) % arr.length];
}

export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Distância de Levenshtein entre duas strings (usada na pronúncia). */
export function levenshtein(a = '', b = '') {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    for (let j = 1; j <= b.length; j++) {
      row[j] = Math.min(
        prev[j] + 1,
        row[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
    prev = row;
  }
  return prev[b.length];
}

export function similarity(a = '', b = '') {
  const max = Math.max(a.length, b.length);
  if (!max) return 1;
  return 1 - levenshtein(a, b) / max;
}

/**
 * Alinha duas listas de palavras (alvo x falado) via LCS e devolve
 * uma lista de passos: ok | wrong | missing | extra.
 */
export function alignWords(target = [], spoken = []) {
  const n = target.length;
  const m = spoken.length;
  const table = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      table[i][j] = similarity(target[i], spoken[j]) > 0.8
        ? table[i + 1][j + 1] + 1
        : Math.max(table[i + 1][j], table[i][j + 1]);
    }
  }
  const steps = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    const sim = similarity(target[i], spoken[j]);
    if (sim > 0.8) {
      steps.push({ type: sim === 1 ? 'ok' : 'close', target: target[i], spoken: spoken[j] });
      i++; j++;
    } else if (table[i + 1][j] >= table[i][j + 1]) {
      steps.push({ type: 'missing', target: target[i] });
      i++;
    } else {
      steps.push({ type: 'extra', spoken: spoken[j] });
      j++;
    }
  }
  while (i < n) steps.push({ type: 'missing', target: target[i++] });
  while (j < m) steps.push({ type: 'extra', spoken: spoken[j++] });
  return steps;
}
