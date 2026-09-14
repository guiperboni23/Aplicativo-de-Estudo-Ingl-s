// Estado do app: XP, nível, ofensiva (streak), histórico de erros e revisão.
// Tudo fica no localStorage do navegador — nada sai da máquina.

import { todayKey, daysBetween, addDays, uid, clamp } from './utils.js';

const KEY = 'speakup.guilherme.v1';

const DEFAULTS = {
  version: 1,
  createdAt: null,
  xp: 0,
  attempts: 0,
  totalWords: 0,
  accuracySum: 0,
  streak: { count: 0, best: 0, last: null },
  days: {},              // '2026-09-12': { attempts, words, accuracySum, xp }
  errorCounts: {},       // ruleId -> { count, cat, why, ex, last, sample }
  cards: [],             // revisão espaçada
  missions: {},          // id -> { stars, best, plays, at }
  log: [],               // últimas tentativas (máx. 200)
  settings: {
    asrLang: 'en-US',
    ttsVoice: '',
    ttsRate: 0.92,
    autoSpeak: true,
    showTranslationHints: true,
  },
};

export const LEVELS = [
  { code: 'A1', name: 'Iniciante', xp: 0 },
  { code: 'A1+', name: 'Iniciante sólido', xp: 250 },
  { code: 'A2', name: 'Básico', xp: 700 },
  { code: 'A2+', name: 'Básico sólido', xp: 1400 },
  { code: 'B1', name: 'Intermediário', xp: 2600 },
  { code: 'B1+', name: 'Intermediário sólido', xp: 4200 },
  { code: 'B2', name: 'Avançado', xp: 6500 },
  { code: 'C1', name: 'Fluente', xp: 10000 },
];

const BOX_INTERVALS = [0, 1, 3, 7, 16, 35];

let state = load();
const listeners = new Set();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...structuredClone(DEFAULTS), createdAt: todayKey() };
    const parsed = JSON.parse(raw);
    const merged = {
      ...structuredClone(DEFAULTS),
      ...parsed,
      settings: { ...DEFAULTS.settings, ...(parsed.settings || {}) },
      streak: { ...DEFAULTS.streak, ...(parsed.streak || {}) },
    };
    // O app não usa mais nenhum serviço pago: apaga o que versões antigas
    // tenham guardado (inclusive chave de API) na primeira vez que abrir.
    for (const antigo of ['aiEnabled', 'aiMode', 'aiKey', 'aiModel', 'aiEndpoint']) {
      if (antigo in merged.settings) {
        delete merged.settings[antigo];
        merged.limpezaPendente = true;
      }
    }
    return merged;
  } catch (err) {
    console.warn('Não consegui ler o progresso salvo, começando do zero.', err);
    return { ...structuredClone(DEFAULTS), createdAt: todayKey() };
  }
}

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (err) {
    console.warn('Não consegui salvar o progresso.', err);
  }
  listeners.forEach((fn) => fn(state));
}

// Se a versão anterior tinha deixado chave de API guardada, grava agora o
// estado já limpo — sem esperar o próximo ajuste.
if (state.limpezaPendente) {
  delete state.limpezaPendente;
  persist();
}

export function getState() {
  return state;
}

export function onChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function update(mutator) {
  mutator(state);
  persist();
  return state;
}

export function setSetting(key, value) {
  return update((s) => { s.settings[key] = value; });
}

export function levelInfo(xp = state.xp) {
  let index = 0;
  LEVELS.forEach((lvl, i) => { if (xp >= lvl.xp) index = i; });
  const current = LEVELS[index];
  const next = LEVELS[index + 1];
  const span = next ? next.xp - current.xp : 1;
  const progress = next ? clamp(Math.round(((xp - current.xp) / span) * 100), 0, 100) : 100;
  return { ...current, index, next, progress, toNext: next ? next.xp - xp : 0 };
}

/** Nível em código CEFR simplificado (A1, A2, B1...) para escolher conteúdo. */
export function cefr() {
  return levelInfo().code.replace('+', '');
}

function touchStreak(s) {
  const today = todayKey();
  if (s.streak.last === today) return;
  const gap = s.streak.last ? daysBetween(s.streak.last, today) : null;
  s.streak.count = gap === 1 ? s.streak.count + 1 : 1;
  s.streak.best = Math.max(s.streak.best || 0, s.streak.count);
  s.streak.last = today;
}

function xpFor(result) {
  const base = Math.min(result.stats.words, 30);
  const bonus = result.stats.accuracy >= 95 ? 12
    : result.stats.accuracy >= 80 ? 7
      : result.stats.accuracy >= 60 ? 4 : 2;
  return Math.max(3, Math.round(base * 0.8) + bonus);
}

/**
 * Registra uma tentativa (fala ou escrita) e devolve o XP ganho.
 * @param {object} result saída de analyze()
 * @param {{mode:string, scenario?:string}} meta
 */
export function recordAttempt(result, meta = {}) {
  const gained = xpFor(result);
  const today = todayKey();
  update((s) => {
    touchStreak(s);
    s.xp += gained;
    s.attempts += 1;
    s.totalWords += result.stats.words;
    s.accuracySum += result.stats.accuracy;
    const day = s.days[today] || { attempts: 0, words: 0, accuracySum: 0, xp: 0 };
    day.attempts += 1;
    day.words += result.stats.words;
    day.accuracySum += result.stats.accuracy;
    day.xp += gained;
    s.days[today] = day;

    for (const issue of result.issues) {
      const entry = s.errorCounts[issue.ruleId] || {
        count: 0, cat: issue.cat, why: issue.why, ex: issue.ex, sample: '', last: null,
      };
      entry.count += 1;
      entry.cat = issue.cat;
      entry.why = issue.why;
      entry.ex = issue.ex;
      entry.last = today;
      entry.sample = issue.suggestion
        ? `${issue.original} → ${issue.suggestion}`
        : issue.original;
      s.errorCounts[issue.ruleId] = entry;
      if (!issue.warn) addCard(s, issue, result);
    }

    s.log.unshift({
      id: uid('att'),
      at: new Date().toISOString(),
      mode: meta.mode || 'text',
      scenario: meta.scenario || '',
      original: result.original,
      corrected: result.corrected,
      accuracy: result.stats.accuracy,
      errors: result.stats.errors,
      xp: gained,
    });
    s.log = s.log.slice(0, 200);
  });
  return gained;
}

// Pontuação e maiúsculas não viram cartão de revisão: não há o que decorar.
const NOT_FLASHCARD = new Set([
  'final-punctuation', 'sentence-case', 'lowercase-i', 'proper-noun-case',
]);

function addCard(s, issue, result) {
  const front = issue.original.trim();
  const back = issue.suggestion?.trim();
  if (NOT_FLASHCARD.has(issue.ruleId)) return;
  if (!front || !back || front.length < 3 || front.toLowerCase() === back.toLowerCase()) return;
  const existing = s.cards.find((c) => c.ruleId === issue.ruleId && c.front.toLowerCase() === front.toLowerCase());
  if (existing) {
    existing.seen += 1;
    existing.box = Math.max(1, existing.box - 1);
    existing.due = todayKey();
    return;
  }
  if (s.cards.length > 400) s.cards.pop();
  s.cards.unshift({
    id: uid('card'),
    ruleId: issue.ruleId,
    cat: issue.cat,
    front,
    back,
    why: issue.why,
    ex: issue.ex,
    context: result.original.slice(0, 120),
    box: 1,
    seen: 1,
    correct: 0,
    due: todayKey(),
    createdAt: todayKey(),
  });
}

export function dueCards(limit = 10) {
  const today = todayKey();
  return state.cards
    .filter((c) => !c.due || c.due <= today)
    .sort((a, b) => b.box - a.box || (a.due || '').localeCompare(b.due || ''))
    .slice(0, limit);
}

export function gradeCard(id, ok) {
  update((s) => {
    const card = s.cards.find((c) => c.id === id);
    if (!card) return;
    if (ok) {
      card.correct += 1;
      card.box = Math.min(BOX_INTERVALS.length - 1, card.box + 1);
      s.xp += 5;
    } else {
      card.box = 1;
    }
    card.due = addDays(BOX_INTERVALS[card.box]);
  });
}

// ------------------------------------------------------------- missões ---

/** Progresso de uma fase. A fase 1 está sempre liberada. */
export function missionState(id) {
  const done = state.missions[id] || { stars: 0, best: 0, plays: 0 };
  const previous = id <= 1 ? null : state.missions[id - 1];
  return {
    ...done,
    unlocked: id <= 1 || Boolean(previous && previous.stars > 0),
    completed: done.stars > 0,
  };
}

/** Primeira fase ainda não concluída — é onde o mapa abre. */
export function currentMissionId(total = 50) {
  for (let id = 1; id <= total; id++) {
    if (!(state.missions[id]?.stars > 0)) return id;
  }
  return total;
}

/** Guarda o resultado de uma fase e devolve o que foi ganho. */
export function completeMission(id, score, stars) {
  const previous = state.missions[id];
  const first = !previous || previous.stars === 0;
  const improved = stars > (previous?.stars || 0);
  const gained = stars > 0 ? (first ? 40 + stars * 15 : stars * 8) : 5;
  update((s) => {
    touchStreak(s);
    const entry = s.missions[id] || { stars: 0, best: 0, plays: 0 };
    entry.plays += 1;
    entry.best = Math.max(entry.best, Math.round(score));
    entry.stars = Math.max(entry.stars, stars);
    entry.at = todayKey();
    s.missions[id] = entry;
    s.xp += gained;
    const day = s.days[todayKey()] || { attempts: 0, words: 0, accuracySum: 0, xp: 0 };
    day.xp += gained;
    s.days[todayKey()] = day;
  });
  return { gained, first, improved, stars };
}

export function totalStars() {
  return Object.values(state.missions).reduce((sum, x) => sum + (x.stars || 0), 0);
}

export function missionsDone() {
  return Object.values(state.missions).filter((x) => x.stars > 0).length;
}

export function topErrors(limit = 6) {
  return Object.entries(state.errorCounts)
    .map(([ruleId, data]) => ({ ruleId, ...data }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export function stats() {
  const dayKeys = Object.keys(state.days).sort();
  const last14 = dayKeys.slice(-14).map((k) => ({
    day: k,
    accuracy: Math.round(state.days[k].accuracySum / Math.max(state.days[k].attempts, 1)),
    attempts: state.days[k].attempts,
    xp: state.days[k].xp,
  }));
  const recent = state.log.slice(0, 20);
  const recentAccuracy = recent.length
    ? Math.round(recent.reduce((a, b) => a + b.accuracy, 0) / recent.length)
    : 0;
  return {
    attempts: state.attempts,
    words: state.totalWords,
    avgAccuracy: state.attempts ? Math.round(state.accuracySum / state.attempts) : 0,
    recentAccuracy,
    activeDays: dayKeys.length,
    last14,
    dueCount: dueCards(999).length,
    cards: state.cards.length,
  };
}

export function addXp(amount) {
  update((s) => { s.xp += amount; touchStreak(s); });
}

export function exportJson() {
  return JSON.stringify(state, null, 2);
}

export function importJson(text) {
  const parsed = JSON.parse(text);
  if (typeof parsed !== 'object' || parsed === null) throw new Error('Arquivo inválido');
  state = { ...structuredClone(DEFAULTS), ...parsed };
  persist();
}

export function resetAll() {
  state = { ...structuredClone(DEFAULTS), createdAt: todayKey() };
  persist();
}
