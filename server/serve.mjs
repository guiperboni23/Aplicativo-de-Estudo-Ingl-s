#!/usr/bin/env node
// Servidor estático mínimo, para abrir o app no computador durante os testes.
// Sem dependências, sem chaves, sem custo:
//
//   node server/serve.mjs        → http://localhost:8787
//
// Serve para o mesmo que `python3 -m http.server`; use o que for mais fácil.

import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.PORT || 8787);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const rel = url.pathname === '/' ? 'index.html' : decodeURIComponent(url.pathname).replace(/^\/+/, '');
  const alvo = path.resolve(ROOT, rel);
  if (!alvo.startsWith(ROOT)) {
    res.writeHead(403).end('Forbidden');
    return;
  }
  try {
    const data = await fs.readFile(alvo);
    res.writeHead(200, { 'Content-Type': MIME[path.extname(alvo)] || 'application/octet-stream' });
    res.end(data);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Não encontrei esse arquivo.');
  }
}).listen(PORT, () => {
  console.log(`\n  🎧 Speak Up em http://localhost:${PORT}\n`);
});
