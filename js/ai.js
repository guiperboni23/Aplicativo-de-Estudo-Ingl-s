// Conversa com um nativo: fala com a API da Anthropic.
//
// Dois modos:
//   'key'    — o próprio navegador chama a API (funciona no celular, sem servidor).
//              A chave fica no aparelho e vai nos mesmos cabeçalhos que o SDK
//              oficial usa quando roda no navegador (dangerouslyAllowBrowser).
//   'server' — passa pelo servidor local (server/proxy.mjs), para quem prefere
//              deixar a chave fora do navegador. Só funciona no computador.
//
// Sem nenhum dos dois, o app cai no tutor offline — nada quebra.

import { getState } from './state.js';
import { systemPrompt } from './persona.js';

const API_URL = 'https://api.anthropic.com/v1/messages';
const API_VERSION = '2023-06-01';

export const MODELS = [
  { id: 'claude-opus-5', label: 'Claude Opus 5 — conversa mais natural' },
  { id: 'claude-sonnet-5', label: 'Claude Sonnet 5 — bom e mais barato' },
  { id: 'claude-haiku-4-5', label: 'Claude Haiku 4.5 — o mais rápido e barato' },
];

export function aiMode() {
  const { aiMode: mode, aiKey, aiEndpoint } = getState().settings;
  if (mode === 'key' && aiKey) return 'key';
  if (mode === 'server' && aiEndpoint) return 'server';
  return 'off';
}

export function aiConfigured() {
  return aiMode() !== 'off';
}

export function messagesFrom(history, userText) {
  const turns = history
    .filter((m) => m.content && m.content.trim())
    .slice(-16)
    .map((m) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: String(m.content).slice(0, 2000),
    }));
  // A API exige começar por 'user' e alternar sem repetir papéis. A conversa
  // abre com uma fala do Alex, então entra um "Hey!" antes dela — assim ele
  // continua enxergando a própria pergunta de abertura.
  if (turns.length && turns[0].role === 'assistant') turns.unshift({ role: 'user', content: 'Hey!' });
  const clean = turns.filter((m, i) => i === 0 || m.role !== turns[i - 1].role);
  if (clean.length && clean[clean.length - 1].role === 'user') clean.pop();
  return [...clean, { role: 'user', content: String(userText).slice(0, 2000) }];
}

function errorMessage(status, body) {
  if (status === 401) return 'Chave da API inválida ou sem permissão. Confira em Ajustes.';
  if (status === 403) return 'A chave não tem acesso a esse modelo.';
  if (status === 429) return 'Muitas mensagens seguidas. Espere alguns segundos.';
  if (status === 400 && /credit|balance/i.test(body)) return 'Sua conta da API está sem créditos.';
  if (status >= 500) return 'A API está instável agora. Tente de novo em instantes.';
  return `A API respondeu ${status}.`;
}

async function callDirect({ history, userText, level }) {
  const { aiKey, aiModel } = getState().settings;
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': aiKey,
      'anthropic-version': API_VERSION,
      // Mesmo cabeçalho que o SDK oficial envia com dangerouslyAllowBrowser.
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: aiModel || MODELS[0].id,
      max_tokens: 1000,
      system: systemPrompt(level),
      output_config: { effort: 'low' },
      messages: messagesFrom(history, userText),
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(errorMessage(response.status, body));
  }

  const data = await response.json();
  if (data.stop_reason === 'refusal') {
    return "Let's talk about something else. What did you do today?";
  }
  return (data.content || [])
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join(' ')
    .trim();
}

async function callServer({ history, userText, level }) {
  const base = getState().settings.aiEndpoint.replace(/\/+$/, '');
  const response = await fetch(`${base}/api/chat`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ history: history.slice(-16), userText, level }),
  });
  if (!response.ok) throw new Error(`O servidor local respondeu ${response.status}.`);
  const data = await response.json();
  return String(data.reply || '').trim();
}

/** Próxima fala do nativo. Lança erro com mensagem em português se falhar. */
export async function aiReply({ history = [], userText, level }) {
  const mode = aiMode();
  if (mode === 'off') throw new Error('Conversa com nativo desligada.');
  try {
    const reply = mode === 'key'
      ? await callDirect({ history, userText, level })
      : await callServer({ history, userText, level });
    if (!reply) throw new Error('A resposta veio vazia.');
    return reply;
  } catch (err) {
    if (err instanceof TypeError) throw new Error('Sem conexão com a internet.');
    throw err;
  }
}

/** Testa a configuração com uma mensagem curta. */
export async function aiTest() {
  const reply = await aiReply({
    history: [],
    userText: 'Hey! Just testing the connection. Say hi in one short sentence.',
    level: 'A2',
  });
  return reply;
}
