#!/usr/bin/env node
// Servidor local OPCIONAL do Speak Up.
//
//   1. serve os arquivos estáticos do app (http://localhost:8787)
//   2. expõe /api/tutor, que fala com a API da Anthropic usando o SDK oficial
//
// A chave da API fica só aqui (variável de ambiente), nunca no navegador.
//
//   npm install            (dentro de server/)
//   export ANTHROPIC_API_KEY=...   # ou: ant auth login
//   node server/proxy.mjs
//
// O app funciona sem este servidor — o tutor offline assume o lugar da IA.

import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const PORT = Number(process.env.PORT || 8787);
const MODEL = process.env.SPEAKUP_MODEL || 'claude-opus-5';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

let client = null;
let clientError = '';

async function getClient() {
  if (client || clientError) return client;
  try {
    const { default: Anthropic } = await import('@anthropic-ai/sdk');
    client = new Anthropic();
  } catch (err) {
    clientError = err.message;
    console.error('[speakup] SDK da Anthropic indisponível:', err.message);
    console.error('[speakup] rode "npm install" dentro de server/ para ligar o modo IA.');
  }
  return client;
}

const SYSTEM = `You are Guilherme's personal English tutor. He is Brazilian, speaks Portuguese,
and is studying English on his own. He is returning to English after a break.

Your job on every turn:
1. Correct his English precisely but kindly — grammar, word choice, prepositions, verb tense.
2. Keep the conversation going with ONE natural follow-up question so he keeps talking.
3. Explain each correction in Brazilian Portuguese, short and concrete.

Rules:
- Speak to him in English only in "reply" (simple vocabulary, adapted to his CEFR level).
- Keep "reply" under 45 words, conversational, never a lecture, and always end with a question
  unless the conversation is clearly finished.
- Explanations ("explanation_pt", "hint_pt") are in Portuguese.
- Only list real mistakes. If the sentence is correct, return an empty "corrections" array and
  say so briefly in "recast".
- Answer with ONLY a JSON object, no markdown fences, in this exact shape:
{
  "reply": "your English reply with one follow-up question",
  "recast": "the corrected version of his sentence, or a short praise if it was already correct",
  "hint_pt": "uma dica curta em português sobre o que praticar agora",
  "corrections": [
    {"original": "...", "suggestion": "...", "category": "verbo|preposição|vocabulário|tempo verbal|artigo|plural|ordem das palavras|pronúncia",
     "explanation_pt": "por que está errado, em português"}
  ]
}`;

function extractJson(text) {
  const cleaned = text.replace(/^```(?:json)?/m, '').replace(/```$/m, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start >= 0 && end > start) {
      try { return JSON.parse(cleaned.slice(start, end + 1)); } catch { /* abaixo */ }
    }
  }
  return { reply: text.slice(0, 400), recast: '', hint_pt: '', corrections: [] };
}

async function askClaude({ history, userText, level, scenario, mode }) {
  const anthropic = await getClient();
  if (!anthropic) throw new Error(`SDK indisponível: ${clientError}`);

  const context = [
    `Guilherme's estimated level: ${level || 'A1'}.`,
    `Channel: ${mode === 'voice' ? 'speaking practice (transcribed speech — ignore punctuation and capitalization)' : 'writing practice'}.`,
    scenario ? `Role-play scenario: ${scenario.title} — ${scenario.goal}. Stay in character.` : 'Free conversation.',
  ].join(' ');

  const messages = [
    ...history.map((m) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: String(m.content || '').slice(0, 2000),
    })),
    { role: 'user', content: `${context}\n\nHis new message: "${userText}"` },
  ];

  const params = {
    model: MODEL,
    max_tokens: 2000,
    system: SYSTEM,
    thinking: { type: 'adaptive' },
    output_config: { effort: 'low' },
    messages,
  };

  // Primeiro com fallback no servidor (evita respostas vazias em recusas);
  // se o beta não estiver liberado na conta, repete sem ele.
  let response;
  try {
    response = await anthropic.beta.messages.create({
      ...params,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
    });
  } catch (err) {
    if (err?.status !== 400) throw err;
    response = await anthropic.messages.create(params);
  }

  if (response.stop_reason === 'refusal') {
    return {
      reply: "Let's keep practicing with another topic. What did you do today?",
      recast: '',
      hint_pt: 'O tutor de IA não respondeu a essa mensagem. Tente outro assunto.',
      corrections: [],
    };
  }

  const text = response.content
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('\n');

  return extractJson(text);
}

function json(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Length': Buffer.byteLength(payload),
  });
  res.end(payload);
}

async function serveStatic(req, res) {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const rel = url.pathname === '/' ? 'index.html' : decodeURIComponent(url.pathname).replace(/^\/+/, '');
  const target = path.resolve(ROOT, rel);
  if (!target.startsWith(ROOT)) {
    res.writeHead(403).end('Forbidden');
    return;
  }
  try {
    const data = await fs.readFile(target);
    res.writeHead(200, { 'Content-Type': MIME[path.extname(target)] || 'application/octet-stream' });
    res.end(data);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Não encontrei esse arquivo.');
  }
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    }).end();
    return;
  }

  if (req.url.startsWith('/api/health')) {
    const anthropic = await getClient();
    json(res, anthropic ? 200 : 503, {
      ok: Boolean(anthropic),
      model: MODEL,
      error: clientError || undefined,
    });
    return;
  }

  if (req.url.startsWith('/api/tutor') && req.method === 'POST') {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > 200_000) req.destroy();
    });
    req.on('end', async () => {
      try {
        const body = JSON.parse(raw || '{}');
        if (!body.userText) { json(res, 400, { error: 'userText é obrigatório' }); return; }
        json(res, 200, await askClaude({
          history: Array.isArray(body.history) ? body.history : [],
          userText: String(body.userText).slice(0, 2000),
          level: body.level,
          scenario: body.scenario,
          mode: body.mode,
        }));
      } catch (err) {
        console.error('[speakup] erro no /api/tutor:', err);
        json(res, 500, { error: err.message });
      }
    });
    return;
  }

  await serveStatic(req, res);
});

server.listen(PORT, () => {
  console.log(`\n  🎧 Speak Up rodando em http://localhost:${PORT}`);
  console.log(`  Modelo do modo IA: ${MODEL}`);
  console.log('  (sem chave da API o app ainda funciona com o tutor offline)\n');
});
