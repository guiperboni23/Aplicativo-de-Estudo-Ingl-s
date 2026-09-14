#!/usr/bin/env node
// Servidor local OPCIONAL do Speak Up.
//
//   1. serve os arquivos estáticos do app (http://localhost:8787)
//   2. expõe /api/chat, que fala com a API da Anthropic usando o SDK oficial
//
// A chave da API fica só aqui (variável de ambiente), nunca no navegador.
// No celular, use o modo "chave neste aparelho" em Ajustes — este servidor só
// funciona no computador em que ele está rodando.
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

import { systemPrompt } from '../js/persona.js';

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
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webmanifest': 'application/manifest+json',
  '.woff2': 'font/woff2',
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

function messagesFrom(history, userText) {
  const turns = history
    .filter((m) => m.content && String(m.content).trim())
    .slice(-16)
    .map((m) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: String(m.content).slice(0, 2000),
    }));
  if (turns.length && turns[0].role === 'assistant') turns.unshift({ role: 'user', content: 'Hey!' });
  const clean = turns.filter((m, i) => i === 0 || m.role !== turns[i - 1].role);
  if (clean.length && clean[clean.length - 1].role === 'user') clean.pop();
  return [...clean, { role: 'user', content: String(userText).slice(0, 2000) }];
}

async function askClaude({ history, userText, level }) {
  const anthropic = await getClient();
  if (!anthropic) throw new Error(`SDK indisponível: ${clientError}`);

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1000,
    system: systemPrompt(level),
    output_config: { effort: 'low' },
    messages: messagesFrom(history, userText),
  });

  if (response.stop_reason === 'refusal') {
    return { reply: "Let's talk about something else. What did you do today?" };
  }

  return {
    reply: response.content
      .filter((block) => block.type === 'text')
      .map((block) => block.text)
      .join(' ')
      .trim(),
  };
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

  if (req.url.startsWith('/api/chat') && req.method === 'POST') {
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
        }));
      } catch (err) {
        console.error('[speakup] erro no /api/chat:', err);
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
