// Ponto de entrada: monta as abas, o HUD (nível / XP / ofensiva) e os atalhos.

import { $ } from './utils.js';
import { getState, onChange, levelInfo, stats } from './state.js';
import { createConversationView } from './views/conversation.js';
import { createDrillsView } from './views/drills.js';
import { createProgressView } from './views/progress.js';
import { createSettingsView } from './views/settings.js';
import { primeSpeech } from './speech.js';

const views = [
  createConversationView('voice'),
  createConversationView('text'),
  createDrillsView(),
  createProgressView(),
  createSettingsView(),
];

const tabsEl = $('#tabs');
const viewEl = $('#view');
let active = null;

function renderTabs() {
  tabsEl.innerHTML = views.map((v, i) => `
    <button role="tab" data-id="${v.id}" aria-selected="${v.id === active?.id}"
      title="atalho: ${i + 1}">${v.label}</button>`).join('');
  tabsEl.querySelectorAll('button').forEach((btn) => {
    btn.addEventListener('click', () => show(btn.dataset.id));
  });
}

function show(id) {
  const next = views.find((v) => v.id === id) || views[0];
  if (active?.id === next.id) return;
  active?.unmount?.();
  active = next;
  viewEl.innerHTML = '';
  next.mount(viewEl);
  renderTabs();
  localStorage.setItem('speakup.tab', next.id);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function refreshHud() {
  const state = getState();
  const lvl = levelInfo();
  const s = stats();
  $('#hud-level').innerHTML = `${lvl.code}<span class="lvl-name"> · ${lvl.name}</span>`;
  $('#hud-xp-fill').style.width = `${lvl.progress}%`;
  $('#hud-xp-text').textContent = lvl.next
    ? `${state.xp} XP · ${lvl.toNext} para ${lvl.next.code}`
    : `${state.xp} XP · nível máximo`;
  $('#hud-streak').textContent = `🔥 ${state.streak.count}`;
  $('#hud-due').textContent = `🧠 ${s.dueCount}`;
}

function toast(message) {
  const el = $('#toast');
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.classList.remove('show'), 2600);
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

document.addEventListener('keydown', (e) => {
  const tag = document.activeElement?.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
  const index = Number(e.key) - 1;
  if (Number.isInteger(index) && index >= 0 && index < views.length) show(views[index].id);
});

// Destrava a voz do tutor no primeiro toque (exigência de iOS e Android).
document.addEventListener('pointerdown', primeSpeech, { once: true });

// Instalação no celular: o service worker faz o app abrir offline.
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  const jaTinhaVersao = Boolean(navigator.serviceWorker.controller);
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => { /* segue sem offline */ });
  });
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (jaTinhaVersao) toast('Nova versão instalada — recarregue a página.');
  });
}

refreshHud();
show(localStorage.getItem('speakup.tab') || 'voice');

// Boas-vindas na primeira visita do dia.
const state = getState();
if (state.attempts === 0) {
  setTimeout(() => toast('Bem-vindo, Guilherme! Diga ou escreva sua primeira frase em inglês.'), 700);
} else if (stats().dueCount > 0) {
  setTimeout(() => toast(`${stats().dueCount} correções esperando revisão na aba Treinos.`), 700);
}
