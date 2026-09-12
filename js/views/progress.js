// Painel de evolução: XP, nível, ofensiva, precisão ao longo do tempo,
// erros recorrentes e histórico das últimas frases.

import { esc, fmtDateBR } from '../utils.js';
import {
  stats, levelInfo, topErrors, getState, LEVELS, exportJson, importJson, resetAll,
} from '../state.js';
import { miniLesson } from '../tutor.js';

function sparkline(points) {
  if (points.length < 2) {
    return '<p class="small muted">Faça algumas frases em dias diferentes para ver a curva aparecer aqui.</p>';
  }
  const w = 560;
  const h = 78;
  const pad = 4;
  const step = (w - pad * 2) / (points.length - 1);
  const coords = points.map((p, i) => [pad + i * step, h - pad - (p.accuracy / 100) * (h - pad * 2)]);
  const line = coords.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
  const area = `${line} L${coords[coords.length - 1][0].toFixed(1)} ${h - pad} L${pad} ${h - pad} Z`;
  return `<svg class="spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" role="img"
      aria-label="Precisão média por dia">
      <path d="${area}" fill="rgba(91,140,255,0.18)" />
      <path d="${line}" fill="none" stroke="#5b8cff" stroke-width="2.5" stroke-linejoin="round" />
      ${coords.map(([x, y], i) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3"
        fill="${points[i].accuracy >= 85 ? '#3ddc97' : '#5b8cff'}" />`).join('')}
    </svg>
    <div class="row spread small muted">
      <span>${fmtDateBR(points[0].day)}</span><span>${fmtDateBR(points[points.length - 1].day)}</span>
    </div>`;
}

export function createProgressView() {
  let root;

  function render() {
    const s = stats();
    const lvl = levelInfo();
    const errors = topErrors(8);
    const allErrors = topErrors(999);
    const catTotals = allErrors.reduce((acc, e) => {
      acc[e.cat] = (acc[e.cat] || 0) + e.count;
      return acc;
    }, {});
    const byCategory = Object.entries(catTotals).sort((a, b) => b[1] - a[1]).slice(0, 8);
    const maxCat = Math.max(1, ...byCategory.map(([, count]) => count));
    const state = getState();
    const recent = state.log.slice(0, 8);

    root.innerHTML = `
      <div class="card">
        <div class="row spread">
          <div>
            <h2>📈 Sua evolução</h2>
            <p class="muted small" style="margin:2px 0 0">
              Nível <b>${lvl.code} — ${lvl.name}</b>${lvl.next ? ` · faltam ${lvl.toNext} XP para ${lvl.next.code}` : ' · nível máximo'}
            </p>
          </div>
          <span class="chip">🔥 ${state.streak.count} ${state.streak.count === 1 ? 'dia' : 'dias'} seguidos (recorde ${state.streak.best || 0})</span>
        </div>
        <div class="xp-bar" style="margin-top:12px"><i style="width:${lvl.progress}%"></i></div>
        <div class="xp-text">${state.xp} XP acumulados</div>
      </div>

      <div class="grid three">
        <div class="stat"><b>${s.attempts}</b><span>frases analisadas</span></div>
        <div class="stat"><b>${s.avgAccuracy}%</b><span>precisão média geral</span></div>
        <div class="stat"><b>${s.recentAccuracy}%</b><span>precisão nas últimas 20</span></div>
        <div class="stat"><b>${s.words}</b><span>palavras produzidas</span></div>
        <div class="stat"><b>${s.activeDays}</b><span>dias de estudo</span></div>
        <div class="stat"><b>${s.dueCount}</b><span>revisões para hoje</span></div>
      </div>

      <div class="card">
        <h2>Precisão por dia</h2>
        ${sparkline(s.last14)}
      </div>

      <div class="card">
        <h2>Seus erros recorrentes</h2>
        <p class="small muted" style="margin:2px 0 12px">${esc(miniLesson(errors))}</p>
        ${errors.length ? `
          <div class="bars">${byCategory.map(([cat, count]) => `
            <div class="bar-row">
              <span>${esc(cat)}</span>
              <span class="bar"><i style="width:${Math.round((count / maxCat) * 100)}%"></i></span>
              <span class="small muted">${count}x</span>
            </div>`).join('')}</div>
          <h3 style="margin-top:16px">Os erros específicos que mais aparecem</h3>
          <ul class="list">${errors.map((e) => `
            <li>
              <div><span class="tag">${esc(e.cat)}</span> <span class="small muted">${e.count}x</span></div>
              ${e.sample ? `<div class="small">${esc(e.sample)}</div>` : ''}
              <div class="small muted">${esc(e.why)}</div>
            </li>`).join('')}</ul>`
    : '<p class="small muted">Nenhum erro registrado ainda.</p>'}
      </div>

      <div class="card">
        <h2>Últimas frases</h2>
        ${recent.length ? `<ul class="list">${recent.map((r) => `
          <li>
            <div class="small muted">${new Date(r.at).toLocaleString('pt-BR')} · ${r.mode === 'voice' ? '🎙️ voz' : '⌨️ escrita'} · ${r.accuracy}%</div>
            <div class="wrong">${esc(r.original)}</div>
            ${r.corrected.toLowerCase() !== r.original.toLowerCase() ? `<div class="right">${esc(r.corrected)}</div>` : ''}
          </li>`).join('')}</ul>` : '<p class="small muted">Comece uma conversa para preencher esta lista.</p>'}
      </div>

      <div class="card">
        <h2>Trilha de níveis</h2>
        <ul class="list">${LEVELS.map((l, i) => `
          <li class="row spread">
            <span>${i <= lvl.index ? '✅' : '🔒'} <b>${l.code}</b> — ${l.name}</span>
            <span class="small muted">${l.xp} XP</span>
          </li>`).join('')}</ul>
      </div>

      <div class="card">
        <h2>Backup do progresso</h2>
        <p class="small muted">Os dados ficam apenas neste navegador. Exporte de vez em quando.</p>
        <div class="row">
          <button class="btn js-export">⬇️ exportar JSON</button>
          <label class="btn ghost" style="margin:0">⬆️ importar
            <input type="file" accept="application/json" class="js-import" hidden />
          </label>
          <button class="btn bad js-reset">apagar tudo</button>
        </div>
      </div>`;

    root.querySelector('.js-export').addEventListener('click', () => {
      const blob = new Blob([exportJson()], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `speakup-progresso-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(a.href);
    });

    root.querySelector('.js-import').addEventListener('change', async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        importJson(await file.text());
        render();
      } catch (err) {
        alert(`Não consegui importar: ${err.message}`);
      }
    });

    root.querySelector('.js-reset').addEventListener('click', () => {
      if (confirm('Apagar todo o progresso (XP, erros, revisões)? Isso não tem volta.')) {
        resetAll();
        render();
      }
    });
  }

  return {
    id: 'progress',
    label: '📈 Progresso',
    mount(container) { root = container; render(); },
    refresh() { if (root) render(); },
  };
}
