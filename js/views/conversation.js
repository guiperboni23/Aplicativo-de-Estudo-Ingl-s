// Chat de conversa — usado tanto no modo VOZ quanto no modo ESCRITA.
// Toda fala/escrita passa pelo motor de correção antes da resposta do tutor.

import { esc, $, pick } from '../utils.js';
import { analyze, summarize } from '../corrector/engine.js';
import { getState, recordAttempt, cefr, topErrors } from '../state.js';
import { SCENARIOS, scenariosForLevel, WRITING_PROMPTS, forLevel } from '../lessons.js';
import { openingLine, respond, miniLesson } from '../tutor.js';
import {
  asrSupported, createRecognizer, speak, stopSpeaking, ttsSupported,
} from '../speech.js';
import { aiConfigured, aiTurn } from '../ai.js';

const SEV_LABEL = { 3: 'importante', 2: 'atenção', 1: 'polimento' };

function fixCard(result) {
  if (!result.issues.length) {
    return `<div class="fix clean"><div class="diff">✅ ${esc(result.corrected)}</div>
      <div class="small muted">Sem ajustes — precisão ${result.stats.accuracy}%.</div></div>`;
  }
  const items = result.issues.map((i) => `
    <li>
      <div><span class="tag sev${i.sev}">${esc(i.cat)} · ${SEV_LABEL[i.sev]}</span>
      ${i.suggestion
    ? `<span class="wrong">${esc(i.original)}</span> → <span class="right">${esc(i.suggestion)}</span>`
    : `<span class="wrong">${esc(i.original)}</span>`}</div>
      <div class="small muted">${esc(i.why)}</div>
      ${i.ex ? `<div class="small" style="color:#a9c4ff">ex.: ${esc(i.ex)}</div>` : ''}
    </li>`).join('');
  return `<div class="fix">
      <div class="diff">${result.diff}</div>
      <div class="row spread" style="margin-bottom:8px">
        <span class="small muted">${esc(summarize(result))}</span>
        <button class="btn small js-hear-fix" data-text="${esc(result.corrected)}">🔊 ouvir correção</button>
      </div>
      <ul class="issues">${items}</ul>
    </div>`;
}

export function createConversationView(mode) {
  const isVoice = mode === 'voice';
  let root;
  let log;
  let scenario = null;
  let turnIndex = 0;
  let history = [];
  let recognizer = null;
  let pendingText = '';
  let busy = false;

  const settings = () => getState().settings;

  function scrollDown() {
    log.scrollTop = log.scrollHeight;
  }

  function addTutor(text, { hintPt = '', model = '', recast = '' } = {}) {
    const node = document.createElement('div');
    node.className = 'msg tutor';
    node.innerHTML = `
      <span class="speaker">tutor</span>
      <div class="bubble">${esc(text)}</div>
      ${recast ? `<div class="small" style="color:#a9f0cd">💡 ${esc(recast)}</div>` : ''}
      ${hintPt ? `<div class="hint">🇧🇷 ${esc(hintPt)}</div>` : ''}
      ${model ? `<details class="model-answer"><summary>ver uma resposta modelo</summary>${esc(model)}</details>` : ''}
      <div class="meta"><button class="btn small ghost js-hear" data-text="${esc(text)}">🔊 ouvir</button></div>`;
    log.appendChild(node);
    scrollDown();
    history.push({ role: 'assistant', content: text });
    if (settings().autoSpeak && ttsSupported()) {
      speak(text, { rate: settings().ttsRate, voiceURI: settings().ttsVoice });
    }
  }

  function addSystem(text) {
    const node = document.createElement('div');
    node.className = 'msg tutor';
    node.innerHTML = `<div class="bubble system">${esc(text)}</div>`;
    log.appendChild(node);
    scrollDown();
  }

  function addUser(text, result, gained) {
    const node = document.createElement('div');
    node.className = 'msg me';
    node.innerHTML = `
      <span class="speaker">você</span>
      <div class="bubble">${esc(text)}</div>
      ${fixCard(result)}
      <div class="meta">+${gained} XP · precisão ${result.stats.accuracy}% · ${result.stats.words} palavras</div>`;
    log.appendChild(node);
    scrollDown();
    history.push({ role: 'user', content: text });
  }

  async function handleInput(text) {
    const clean = String(text || '').trim();
    if (!clean || busy) return;
    busy = true;
    const result = analyze(clean, { mode });
    const gained = recordAttempt(result, { mode, scenario: scenario?.id || 'free' });
    addUser(clean, result, gained);

    let reply = null;
    if (aiConfigured()) {
      try {
        const ai = await aiTurn({
          history, userText: clean, level: cefr(), scenario, mode,
        });
        if (ai.reply) {
          reply = { reply: ai.reply, hintPt: ai.hintPt, model: '', recast: ai.recast };
          if (ai.corrections.length) {
            addSystem(`Notas do tutor de IA: ${ai.corrections
              .map((c) => `${c.original || ''} → ${c.suggestion || ''} (${c.explanation_pt || c.explanationPt || ''})`)
              .join(' | ')}`);
          }
        }
      } catch (err) {
        addSystem(`Modo IA indisponível (${err.message}). Seguindo com o tutor offline.`);
      }
    }

    if (!reply) {
      const offline = respond({ scenario, turnIndex, userText: clean, result });
      turnIndex = offline.nextIndex;
      reply = offline;
      if (offline.done) scenario = null;
    }

    addTutor(reply.reply, {
      hintPt: reply.hintPt,
      model: reply.model,
      recast: reply.recast,
    });
    busy = false;
    root.dispatchEvent(new CustomEvent('progress-changed', { bubbles: true }));
  }

  function startScenario(id) {
    stopSpeaking();
    scenario = SCENARIOS.find((s) => s.id === id) || null;
    turnIndex = 0;
    history = [];
    log.innerHTML = '';
    addSystem(scenario
      ? `Cenário: ${scenario.emoji} ${scenario.title} — ${scenario.goal}`
      : 'Conversa livre: fale sobre o que quiser. O tutor puxa assunto e corrige tudo.');
    const opening = openingLine(scenario);
    addTutor(opening.reply, { hintPt: opening.hintPt, model: opening.model });
  }

  function setMicState(state) {
    const mic = $('.mic', root);
    if (!mic) return;
    mic.dataset.state = state;
    mic.textContent = state === 'listening' ? '⏹' : state === 'processing' ? '⏳' : '🎙️';
    $('.js-mic-label', root).textContent = {
      idle: 'Toque e fale (ou pressione espaço)',
      listening: 'Ouvindo… toque para finalizar',
      processing: 'Processando sua fala…',
    }[state] || '';
  }

  function ensureRecognizer() {
    if (recognizer) return recognizer;
    recognizer = createRecognizer({
      lang: settings().asrLang,
      onState: setMicState,
      onPartial: (text) => { pendingText = text; $('.live', root).textContent = text; },
      onFinal: (text) => {
        $('.live', root).textContent = '';
        pendingText = '';
        handleInput(text);
      },
      onError: (msg) => { addSystem(msg); setMicState('idle'); },
    });
    return recognizer;
  }

  function toggleMic() {
    const rec = ensureRecognizer();
    if (!rec) return;
    stopSpeaking();
    if (rec.listening) rec.stop();
    else { rec.setLang(settings().asrLang); rec.start(); }
  }

  function composerHtml() {
    if (isVoice) {
      const unsupported = !asrSupported();
      return `
        <div class="composer">
          ${unsupported ? `<div class="banner">Este navegador não tem reconhecimento de fala.
            Use o Chrome ou o Edge para falar — enquanto isso você pode digitar abaixo.</div>` : ''}
          <div class="row" style="align-items:center;gap:16px">
            <button class="mic" data-state="idle" title="Gravar" ${unsupported ? 'disabled' : ''}>🎙️</button>
            <div>
              <div class="js-mic-label small muted">Toque e fale (ou pressione espaço)</div>
              <div class="live"></div>
            </div>
          </div>
          <div class="row">
            <input type="text" class="js-fallback" placeholder="…ou digite aqui o que você diria" />
            <button class="btn js-send">Enviar</button>
          </div>
        </div>`;
    }
    return `
      <div class="composer">
        <textarea class="js-text" placeholder="Escreva em inglês. Ex.: Yesterday I worked until late and then I studied English."></textarea>
        <div class="row spread">
          <span class="small muted"><kbd>Ctrl</kbd> + <kbd>Enter</kbd> envia</span>
          <div class="row">
            <button class="btn ghost js-prompt">🎲 tema para escrever</button>
            <button class="btn primary js-send">Enviar e corrigir</button>
          </div>
        </div>
      </div>`;
  }

  function render() {
    const unlocked = scenariosForLevel(cefr());
    const options = [
      '<option value="">💬 Conversa livre</option>',
      ...unlocked.map((s) => `<option value="${s.id}">${s.emoji} ${s.title} (${s.level})</option>`),
    ].join('');

    root.innerHTML = `
      <div class="card">
        <div class="row spread">
          <div>
            <h2>${isVoice ? '🎙️ Chat de voz' : '⌨️ Chat escrito'}</h2>
            <p class="muted small" style="margin:2px 0 0">
              ${isVoice
    ? 'Fale em inglês; eu transcrevo, corrijo cada erro e continuo a conversa em voz alta.'
    : 'Escreva sem medo de errar: cada frase volta corrigida e explicada em português.'}
            </p>
          </div>
          <span class="chip">${aiConfigured() ? '🤖 modo IA ligado' : '📴 tutor offline'}</span>
        </div>
        <div class="row" style="margin-top:12px">
          <select class="js-scenario" style="max-width:340px">${options}</select>
          <button class="btn small js-restart">↺ reiniciar conversa</button>
          ${ttsSupported() ? '<button class="btn small js-stop-audio">🔇 parar áudio</button>' : ''}
        </div>
        <div class="small muted" style="margin-top:8px">💡 Dica de hoje: ${esc(miniLesson(topErrors(3)))}</div>
      </div>

      <div class="card chat-shell">
        <div class="chat-log"></div>
        ${composerHtml()}
      </div>`;

    log = $('.chat-log', root);
    startScenario('');

    $('.js-scenario', root).addEventListener('change', (e) => startScenario(e.target.value));
    $('.js-restart', root).addEventListener('click', () => startScenario($('.js-scenario', root).value));
    $('.js-stop-audio', root)?.addEventListener('click', stopSpeaking);

    if (isVoice) {
      $('.mic', root)?.addEventListener('click', toggleMic);
      const fallback = $('.js-fallback', root);
      $('.js-send', root).addEventListener('click', () => {
        handleInput(fallback.value);
        fallback.value = '';
      });
      fallback.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { handleInput(fallback.value); fallback.value = ''; }
      });
    } else {
      const area = $('.js-text', root);
      const send = () => { handleInput(area.value); area.value = ''; };
      $('.js-send', root).addEventListener('click', send);
      area.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); send(); }
      });
      $('.js-prompt', root).addEventListener('click', () => {
        const prompt = pick(forLevel(WRITING_PROMPTS, cefr()));
        addSystem(`✍️ Tema: ${prompt}`);
      });
    }

    root.addEventListener('click', (e) => {
      const btn = e.target.closest('.js-hear, .js-hear-fix');
      if (!btn) return;
      speak(btn.dataset.text, { rate: settings().ttsRate, voiceURI: settings().ttsVoice });
    });
  }

  function onKey(e) {
    if (!isVoice || e.code !== 'Space') return;
    const tag = document.activeElement?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    e.preventDefault();
    toggleMic();
  }

  return {
    id: mode,
    label: isVoice ? '🎙️ Voz' : '⌨️ Escrita',
    mount(container) {
      root = container;
      render();
      document.addEventListener('keydown', onKey);
    },
    unmount() {
      document.removeEventListener('keydown', onKey);
      recognizer?.abort();
      recognizer = null;
      stopSpeaking();
    },
  };
}
