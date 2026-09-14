// Conversa livre: mesma tela para falar ou escrever, com correção na hora.

import { esc, $, pick } from '../utils.js';
import { analyze } from '../corrector/engine.js';
import { getState, recordAttempt, cefr, setSetting } from '../state.js';
import { SCENARIOS, scenariosForLevel, WRITING_PROMPTS, forLevel } from '../lessons.js';
import { openingLine, respond } from '../tutor.js';
import { asrSupported, createRecognizer, speak, stopSpeaking } from '../speech.js';
import { aiConfigured, aiTurn } from '../ai.js';

export function createChatView() {
  let root;
  let log;
  let mode = 'voice';
  let scenario = null;
  let turnIndex = 0;
  let history = [];
  let recognizer = null;
  let busy = false;

  const settings = () => getState().settings;
  const voiceOpts = () => ({ rate: settings().ttsRate, voiceURI: settings().ttsVoice });

  function scrollDown() { log.scrollTop = log.scrollHeight; }

  function addTutor(text, hint = '') {
    const node = document.createElement('div');
    node.className = 'msg tutor';
    node.innerHTML = `
      <div class="bubble">${esc(text)}</div>
      ${hint ? `<div class="small muted">🇧🇷 ${esc(hint)}</div>` : ''}
      <button class="btn ghost small js-say" data-text="${esc(text)}">🔊</button>`;
    log.appendChild(node);
    scrollDown();
    history.push({ role: 'assistant', content: text });
    if (settings().autoSpeak) speak(text, voiceOpts());
  }

  function addSystem(text) {
    const node = document.createElement('div');
    node.className = 'msg tutor';
    node.innerHTML = `<div class="bubble system">${esc(text)}</div>`;
    log.appendChild(node);
    scrollDown();
  }

  function addMine(text, result, gained) {
    const notes = result.issues.slice(0, 3).map((i) => `
      <div class="note">${i.suggestion
    ? `<b>${esc(i.original)} → ${esc(i.suggestion)}</b><br>` : `<b>${esc(i.original)}</b><br>`}${esc(i.why)}</div>`).join('');
    const node = document.createElement('div');
    node.className = 'msg me';
    node.innerHTML = `
      <div class="bubble">${esc(text)}</div>
      <div class="fix ${result.issues.length ? '' : 'ok'}" style="width:100%">
        <div class="diff">${result.diff}</div>
        ${notes ? `<div class="notes">${notes}</div>` : ''}
      </div>
      <div class="small muted">+${gained} XP · ${result.stats.accuracy}%</div>`;
    log.appendChild(node);
    scrollDown();
    history.push({ role: 'user', content: text });
  }

  async function send(text) {
    const clean = String(text || '').trim();
    if (!clean || busy) return;
    busy = true;
    const result = analyze(clean, { mode: mode === 'voice' ? 'voice' : 'text' });
    addMine(clean, result, recordAttempt(result, { mode, scenario: scenario?.id || 'livre' }));

    let reply = null;
    if (aiConfigured()) {
      try {
        const ai = await aiTurn({ history, userText: clean, level: cefr(), scenario, mode });
        if (ai.reply) reply = { reply: ai.reply, hintPt: ai.hintPt };
      } catch (err) {
        addSystem(`Modo IA fora do ar (${err.message}). Seguindo com o tutor do app.`);
      }
    }
    if (!reply) {
      const offline = respond({ scenario, turnIndex, userText: clean, result });
      turnIndex = offline.nextIndex;
      if (offline.done) scenario = null;
      reply = offline;
    }
    addTutor(reply.reply, reply.hintPt);
    busy = false;
    root.dispatchEvent(new CustomEvent('progress-changed', { bubbles: true }));
  }

  function startChat(id) {
    stopSpeaking();
    scenario = SCENARIOS.find((s) => s.id === id) || null;
    turnIndex = 0;
    history = [];
    log.innerHTML = '';
    const opening = openingLine(scenario);
    addTutor(opening.reply, opening.hintPt);
  }

  function toggleMic() {
    stopSpeaking();
    if (!recognizer) {
      recognizer = createRecognizer({
        lang: settings().asrLang,
        onState: (state) => {
          const mic = $('.js-mic', root);
          if (!mic) return;
          mic.dataset.state = state;
          mic.textContent = state === 'listening' ? '⏹' : state === 'processing' ? '⏳' : '🎙️';
        },
        onPartial: (text) => { const live = $('.js-live', root); if (live) live.textContent = text; },
        onFinal: (text) => { const live = $('.js-live', root); if (live) live.textContent = ''; send(text); },
        onError: (msg) => addSystem(msg),
      });
    }
    if (recognizer?.listening) recognizer.stop();
    else { recognizer?.setLang(settings().asrLang); recognizer?.start(); }
  }

  function composer() {
    if (mode === 'voice') {
      return `
        <div class="composer">
          ${asrSupported() ? `
            <div class="stack" style="justify-items:center">
              <button class="mic js-mic" data-state="idle" aria-label="Falar">🎙️</button>
              <div class="live js-live"></div>
            </div>` : '<div class="banner">Este navegador não escuta você. Use Chrome (Android) ou Safari (iPhone), ou escreva abaixo.</div>'}
          <div class="row">
            <input type="text" class="js-input" placeholder="…ou digite o que você diria" />
            <button class="btn js-send">Enviar</button>
          </div>
        </div>`;
    }
    return `
      <div class="composer">
        <textarea class="js-input" placeholder="Escreva em inglês"></textarea>
        <div class="row spread">
          <button class="btn ghost small js-theme">🎲 tema</button>
          <button class="btn primary js-send">Enviar</button>
        </div>
      </div>`;
  }

  function render() {
    const options = [
      '<option value="">Conversa livre</option>',
      ...scenariosForLevel(cefr()).map((s) => `<option value="${s.id}">${s.emoji} ${esc(s.title)}</option>`),
    ].join('');

    root.innerHTML = `
      <div class="screen">
        <div class="switch" style="margin-bottom:14px">
          <button data-mode="voice" aria-pressed="${mode === 'voice'}">🎤 Falar</button>
          <button data-mode="text" aria-pressed="${mode === 'text'}">✍️ Escrever</button>
        </div>
        <div class="row" style="margin-bottom:14px">
          <select class="js-scenario" style="flex:1">${options}</select>
          <button class="btn small js-restart">↺</button>
        </div>
        <div class="chat js-log" style="min-height:40vh"></div>
        ${composer()}
      </div>`;

    log = $('.js-log', root);
    startChat('');

    root.querySelectorAll('.switch button').forEach((b) => b.addEventListener('click', () => {
      mode = b.dataset.mode;
      stopSpeaking();
      render();
    }));
    $('.js-scenario', root).addEventListener('change', (e) => startChat(e.target.value));
    $('.js-restart', root).addEventListener('click', () => startChat($('.js-scenario', root).value));
    $('.js-mic', root)?.addEventListener('click', toggleMic);

    const input = $('.js-input', root);
    const fire = () => { send(input.value); input.value = ''; };
    $('.js-send', root).addEventListener('click', fire);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && (mode === 'voice' || e.ctrlKey || e.metaKey)) { e.preventDefault(); fire(); }
    });
    $('.js-theme', root)?.addEventListener('click', () => addSystem(`✍️ ${pick(forLevel(WRITING_PROMPTS, cefr()))}`));

    root.addEventListener('click', (e) => {
      const say = e.target.closest('.js-say');
      if (say) speak(say.dataset.text, voiceOpts());
    });
  }

  return {
    id: 'chat',
    label: 'Conversa',
    icon: '💬',
    mount(container) { root = container; render(); },
    unmount() { recognizer?.abort(); recognizer = null; stopSpeaking(); },
  };
}
