// O mapa: 50 fases em trilha, agrupadas em 5 mundos.

import { esc, $ } from '../utils.js';
import { MISSIONS, WORLDS, TYPE_META } from '../missions.js';
import {
  missionState, currentMissionId, totalStars, missionsDone, dueCards,
} from '../state.js';

const STEP = 17;      // distância vertical entre fases (unidades do SVG)
const BANNER = 24;    // espaço do título de cada mundo
const R = 6.6;        // raio da bolinha

function layout() {
  const nodes = [];
  const banners = [];
  let y = 10;
  for (const world of WORLDS) {
    banners.push({ y, world });
    y += BANNER;
    for (let id = world.from; id <= world.to; id++) {
      nodes.push({ id, x: 50 + 28 * Math.sin(id * 0.75), y });
      y += STEP;
    }
    y += 3;
  }
  return { nodes, banners, height: y };
}

function curve(points) {
  if (points.length < 2) return '';
  let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    const mid = (b.y - a.y) / 2;
    d += ` C ${a.x.toFixed(1)} ${(a.y + mid).toFixed(1)}, ${b.x.toFixed(1)} ${(b.y - mid).toFixed(1)}, ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
  }
  return d;
}

function starsSvg(x, y, count) {
  return [0, 1, 2].map((i) => `<text x="${(x - 3.6 + i * 3.6).toFixed(1)}" y="${y.toFixed(1)}"
    text-anchor="middle" font-size="4"
    fill="${i < count ? 'var(--gold)' : 'var(--line)'}">★</text>`).join('');
}

function nodeSvg(node, mission, state, isCurrent) {
  const label = state.completed ? String(mission.id) : isCurrent ? String(mission.id) : state.unlocked ? String(mission.id) : '';
  const fill = state.completed ? 'var(--green)' : isCurrent ? 'var(--panel-2)' : 'var(--panel)';
  const stroke = state.completed ? 'var(--green-dim)' : isCurrent ? 'var(--green)' : 'var(--line)';
  const textFill = state.completed ? '#04130a' : state.unlocked ? 'var(--txt)' : 'var(--muted)';
  return `
    <g class="node-btn" role="button" tabindex="0"
       data-id="${mission.id}" data-unlocked="${state.unlocked ? '1' : '0'}"
       aria-label="Fase ${mission.id}: ${esc(mission.title)}${state.unlocked ? '' : ' (bloqueada)'}">
      ${isCurrent ? `<circle class="pulse" cx="${node.x.toFixed(1)}" cy="${node.y.toFixed(1)}" r="8.4" fill="var(--green)" />` : ''}
      <circle cx="${node.x.toFixed(1)}" cy="${node.y.toFixed(1)}" r="9.5" fill="transparent" />
      <circle class="node-ring" cx="${node.x.toFixed(1)}" cy="${node.y.toFixed(1)}" r="${R}"
              fill="${fill}" stroke="${stroke}" stroke-width="0.9" />
      ${state.completed ? starsSvg(node.x, node.y - R - 1.6, state.stars) : ''}
      ${state.unlocked
    ? `<text x="${node.x.toFixed(1)}" y="${(node.y + 2.1).toFixed(1)}" text-anchor="middle"
           font-size="6" font-family="Fredoka, sans-serif" font-weight="600" fill="${textFill}">${label}</text>`
    : `<text x="${node.x.toFixed(1)}" y="${(node.y + 1.9).toFixed(1)}" text-anchor="middle" font-size="5"
           style="filter:grayscale(1);opacity:.45">🔒</text>`}
    </g>`;
}

export function createMapView({ onOpenMission, onOpenReview }) {
  let root;

  function render() {
    const { nodes, banners, height } = layout();
    const current = currentMissionId(MISSIONS.length);
    const nextMission = MISSIONS.find((x) => x.id === current) || MISSIONS[0];
    const done = missionsDone();
    const due = dueCards(99).length;

    const lastDone = nodes.filter((n) => missionState(n.id).completed).pop();
    const trailDone = lastDone ? nodes.slice(0, nodes.findIndex((n) => n.id === lastDone.id) + 1) : [];

    root.innerHTML = `
      <div class="screen flush">
        <div class="world-head">
          <h2>Fase ${current} · ${esc(nextMission.title)}</h2>
          <p>${TYPE_META[nextMission.type].icon} ${esc(TYPE_META[nextMission.type].label)}
             · ${esc(nextMission.focus)}</p>
          <p>${done}/${MISSIONS.length} fases · ${totalStars()} ⭐</p>
        </div>

        ${due ? `
          <div class="daily">
            <span style="font-size:26px">🧠</span>
            <div style="flex:1">
              <b>Revisão do dia</b>
              <p>${due} ${due === 1 ? 'erro seu esperando' : 'erros seus esperando'}</p>
            </div>
            <button class="btn primary small js-review">Revisar</button>
          </div>` : ''}

        <div class="map">
          <svg viewBox="0 0 100 ${height.toFixed(0)}" xmlns="http://www.w3.org/2000/svg">
            <path d="${curve(nodes)}" fill="none" stroke="var(--line)" stroke-width="1.2"
                  stroke-linecap="round" stroke-dasharray="2 3" />
            ${trailDone.length > 1 ? `<path d="${curve(trailDone)}" fill="none" stroke="var(--green-dim)"
                  stroke-width="1.4" stroke-linecap="round" />` : ''}
            ${banners.map(({ y, world }) => `
              <line x1="18" y1="${(y - 3).toFixed(1)}" x2="82" y2="${(y - 3).toFixed(1)}"
                    stroke="var(--line)" stroke-width="0.3" />
              <text x="50" y="${(y + 6).toFixed(1)}" text-anchor="middle" font-size="5.2"
                    font-family="Fredoka, sans-serif" fill="var(--txt)">${esc(world.name)}</text>
              <text x="50" y="${(y + 11).toFixed(1)}" text-anchor="middle" font-size="3.4"
                    fill="var(--muted)">${esc(world.sub)}</text>`).join('')}
            ${nodes.map((node) => {
    const mission = MISSIONS.find((x) => x.id === node.id);
    return nodeSvg(node, mission, missionState(node.id), node.id === current);
  }).join('')}
          </svg>
        </div>
      </div>`;

    $('.js-review', root)?.addEventListener('click', onOpenReview);

    const open = (group) => {
      const id = Number(group.dataset.id);
      if (group.dataset.unlocked === '1') onOpenMission(id);
      else root.dispatchEvent(new CustomEvent('app-toast', {
        bubbles: true, detail: 'Termine a fase anterior para liberar esta.',
      }));
    };
    root.querySelectorAll('.node-btn').forEach((group) => {
      group.addEventListener('click', () => open(group));
      group.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(group); }
      });
    });

    // Centraliza a fase atual na tela.
    requestAnimationFrame(() => {
      const svg = $('.map svg', root);
      const node = nodes.find((n) => n.id === current);
      if (!svg || !node) return;
      const scale = svg.getBoundingClientRect().width / 100;
      const main = root.closest('main') || root.parentElement;
      main.scrollTop = Math.max(0, svg.offsetTop + node.y * scale - main.clientHeight * 0.55);
    });
  }

  return {
    id: 'map',
    label: 'Mapa',
    icon: '🗺️',
    mount(container) { root = container; render(); },
    refresh() { if (root) render(); },
  };
}
