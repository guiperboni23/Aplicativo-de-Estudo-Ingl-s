// Progresso: só o essencial — fases, estrelas, precisão e erros que mais repetem.

import { esc } from '../utils.js';
import {
  stats, levelInfo, topErrors, getState, totalStars, missionsDone,
  exportJson, importJson, resetAll,
} from '../state.js';
import { MISSIONS } from '../missions.js';

export function createProgressView() {
  let root;

  function render() {
    const s = stats();
    const lvl = levelInfo();
    const state = getState();
    const errors = topErrors(3);
    const recent = state.log.slice(0, 5);

    root.innerHTML = `
      <div class="screen stack">
        <div class="tiles">
          <div class="tile"><b>${missionsDone()}<span style="font-size:14px;color:var(--muted)">/${MISSIONS.length}</span></b><span>fases</span></div>
          <div class="tile"><b style="color:var(--gold)">${totalStars()}</b><span>estrelas</span></div>
          <div class="tile"><b>${s.recentAccuracy}%</b><span>precisão recente</span></div>
          <div class="tile"><b>${state.streak.count}</b><span>dias seguidos</span></div>
        </div>

        <div class="card">
          <div class="row spread">
            <b>${lvl.code} · ${esc(lvl.name)}</b>
            <span class="small muted">${state.xp} XP</span>
          </div>
          <div class="bar" style="margin-top:10px"><i style="width:${lvl.progress}%"></i></div>
          <div class="small muted" style="margin-top:6px">
            ${lvl.next ? `faltam ${lvl.toNext} XP para ${lvl.next.code}` : 'nível máximo'}
          </div>
        </div>

        <div class="card">
          <h3 style="margin:0 0 10px">Onde você mais erra</h3>
          ${errors.length ? `<ul class="list">${errors.map((e) => `
            <li>
              <div class="row spread">
                <b>${esc(e.cat)}</b><span class="small muted">${e.count}x</span>
              </div>
              ${e.sample ? `<div class="small" style="margin-top:4px">${esc(e.sample)}</div>` : ''}
              <div class="small muted" style="margin-top:2px">${esc(e.why)}</div>
            </li>`).join('')}</ul>`
    : '<p class="small muted" style="margin:0">Sem erros registrados ainda.</p>'}
        </div>

        <div class="card">
          <h3 style="margin:0 0 10px">Últimas frases</h3>
          ${recent.length ? `<ul class="list">${recent.map((r) => `
            <li>
              <div class="wrong small">${esc(r.original)}</div>
              ${r.corrected.toLowerCase() !== r.original.toLowerCase()
    ? `<div class="right small">${esc(r.corrected)}</div>` : '<div class="right small">✓ sem erros</div>'}
            </li>`).join('')}</ul>`
    : '<p class="small muted" style="margin:0">Fale ou escreva algo para começar.</p>'}
        </div>

        <details class="card">
          <summary class="small muted">Backup e reinício</summary>
          <p class="small muted">O progresso fica só neste aparelho.</p>
          <div class="row">
            <button class="btn small js-export">⬇️ exportar</button>
            <label class="btn small ghost" style="margin:0">⬆️ importar
              <input type="file" accept="application/json" class="js-import" hidden />
            </label>
            <button class="btn small ghost js-reset" style="color:var(--err)">apagar tudo</button>
          </div>
        </details>
      </div>`;

    root.querySelector('.js-export').addEventListener('click', () => {
      const blob = new Blob([exportJson()], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `speakup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(a.href);
    });
    root.querySelector('.js-import').addEventListener('change', async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try { importJson(await file.text()); render(); } catch (err) { alert(`Arquivo inválido: ${err.message}`); }
    });
    root.querySelector('.js-reset').addEventListener('click', () => {
      if (confirm('Apagar todo o progresso? Isso não tem volta.')) { resetAll(); render(); }
    });
  }

  return {
    id: 'progress',
    label: 'Progresso',
    icon: '📊',
    mount(container) { root = container; render(); },
    refresh() { if (root) render(); },
  };
}
