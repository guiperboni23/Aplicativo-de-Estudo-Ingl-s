// Modo IA (opcional). O app funciona 100% sem isso — o tutor offline assume
// quando não há servidor configurado ou quando a chamada falha.
//
// Suba o servidor local (server/proxy.mjs) para que a chave da API fique no
// seu computador e nunca dentro da página.

import { getState } from './state.js';

export function aiConfigured() {
  const { aiEnabled, aiEndpoint } = getState().settings;
  return Boolean(aiEnabled && aiEndpoint);
}

function endpoint(path) {
  const base = getState().settings.aiEndpoint.replace(/\/+$/, '');
  return `${base}${path}`;
}

export async function aiHealth() {
  const res = await fetch(endpoint('/api/health'), { method: 'GET' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

/**
 * Pede ao tutor de IA a próxima resposta da conversa + correções.
 * @returns {Promise<{reply:string, recast:string, hintPt:string, corrections:Array}>}
 */
export async function aiTurn({ history, userText, level, scenario, mode }) {
  const res = await fetch(endpoint('/api/tutor'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      history: history.slice(-12),
      userText,
      level,
      mode,
      scenario: scenario ? { title: scenario.title, goal: scenario.goal } : null,
    }),
  });
  if (!res.ok) throw new Error(`Servidor de IA respondeu ${res.status}`);
  const data = await res.json();
  return {
    reply: data.reply || '',
    recast: data.recast || '',
    hintPt: data.hint_pt || data.hintPt || '',
    corrections: Array.isArray(data.corrections) ? data.corrections : [],
  };
}
