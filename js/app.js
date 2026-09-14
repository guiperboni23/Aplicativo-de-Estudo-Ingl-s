// Monta as telas, a barra de navegação e o topo (estrelas, ofensiva, nível).

import { $ } from './utils.js';
import { getState, onChange, levelInfo, totalStars } from './state.js';
import { createMapView } from './views/map.js';
import { createMissionView } from './views/mission.js';
import { createChatView } from './views/conversation.js';
import { createProgressView } from './views/progress.js';
import { createSettingsView } from './views/settings.js';
import { primeSpeech } from './speech.js';

const tabsEl = $('#tabs');
const viewEl = $('#view');

const mapView = createMapView({
  onOpenMission: (id) => show('mission', { missionId: id }),
  onOpenReview: () => show('mission', { review: true }),
});
const missionView = createMissionView({ onExit: () => show('map') });

const views = [mapView, createChatView(), createProgressView(), createSettingsView(), missionView];
const tabs = views.filter((v) => !v.hidden);
let active = null;

function renderTabs() {
  tabsEl.innerHTML = tabs.map((v) => `
    <button class="tab" role="tab" data-id="${v.id}" aria-selected="${v.id === active?.id}">
      <span class="ico">${v.icon}</span>${v.label}
    </button>`).join('');
  tabsEl.querySelectorAll('.tab').forEach((btn) => {
    btn.addEventListener('click', () => show(btn.dataset.id));
  });
}

function show(id, params) {
  const next = views.find((v) => v.id === id) || views[0];
  active?.unmount?.();
  active = next;
  viewEl.innerHTML = '';
  viewEl.scrollTop = 0;
  document.body.classList.toggle('in-mission', Boolean(next.hidden));
  tabsEl.hidden = Boolean(next.hidden);
  next.mount(viewEl, params);
  renderTabs();
  if (!next.hidden) localStorage.setItem('speakup.tab', next.id);
}

function refreshHud() {
  const state = getState();
  const lvl = levelInfo();
  $('#hud-stars').textContent = `⭐ ${totalStars()}`;
  $('#hud-streak').textContent = `🔥 ${state.streak.count}`;
  $('#hud-level').textContent = lvl.code;
}

function toast(message) {
  const el = $('#toast');
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.classList.remove('show'), 2400);
}

let lastXp = getState().xp;
onChange(() => {
  refreshHud();
  const now = getState().xp;
  if (now > lastXp) toast(`+${now - lastXp} XP`);
  lastXp = now;
  if (active?.id === 'progress') active.refresh?.();
});

document.addEventListener('progress-changed', refreshHud);
document.addEventListener('app-toast', (e) => toast(e.detail));
document.addEventListener('pointerdown', primeSpeech, { once: true });

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  const jaTinhaVersao = Boolean(navigator.serviceWorker.controller);
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => { /* segue sem offline */ });
  });
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (jaTinhaVersao) toast('Nova versão — recarregue a página.');
  });
}

refreshHud();
show(localStorage.getItem('speakup.tab') || 'map');

if (getState().attempts === 0) {
  setTimeout(() => toast('Comece pela fase 1 do mapa 👇'), 900);
}
