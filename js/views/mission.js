// Tela de uma fase: um item por vez, feedback imediato, estrelas no fim.

import { esc, $, words, alignWords } from '../utils.js';
import { analyze } from '../corrector/engine.js';
import {
  MISSIONS_BY_ID, TYPE_META, itemOf, starsFor,
} from '../missions.js';
import {
  getState, recordAttempt, completeMission, dueCards, gradeCard, addXp,
} from '../state.js';
import { createRecognizer, speak, stopSpeaking, asrSupported } from '../speech.js';

const norm = (s) => words(s).join(' ');

function reviewMission() {
  const cards = dueCards(6);
  return {
    id: 'review',
    title: 'Revisão do dia',
    focus: 'Os erros que você já cometeu',
    type: 'corrigir',
    review: true,
    items: cards.map((c) => ({
      kind: 'corrigir',
      wrong: c.front,
      right: c.back,
      why: c.why,
      context: words(c.front).length < 3 ? c.context : '',
      cardId: c.id,
    })),
  };
}

export function createMissionView({ onExit }) {
  let root;
  let mission = null;
  let index = 0;
  let scores = [];
  let phase = 'task';
  let feedback = null;
  let recognizer = null;
  let typing = false;

  const settings = () => getState().settings;
  const voiceOpts = () => ({ rate: settings().ttsRate, voiceURI: settings().ttsVoice });

  function item() {
    return itemOf(mission, index);
  }

  // ------------------------------------------------------------ correções ---
  function notesHtml(result, max = 3) {
    return result.issues.slice(0, max).map((i) => `
      <div class="note">
        ${i.suggestion ? `<b>${esc(i.original)} → ${esc(i.suggestion)}</b><br>` : `<b>${esc(i.original)}</b><br>`}
        ${esc(i.why)}
      </div>`).join('');
  }

  function gradeSentence(text, mode) {
    const result = analyze(text, { mode });
    recordAttempt(result, { mode, scenario: `fase-${mission.id}` });
    return {
      score: result.stats.accuracy,
      html: `
        <div class="fix ${result.issues.length ? '' : 'ok'}">
          <div class="said">você disse</div>
          <div class="diff">${result.diff}</div>
          ${result.issues.length ? `<div class="notes">${notesHtml(result)}</div>`
    : '<div class="notes"><div class="note">Perfeito, nada a corrigir. 🎯</div></div>'}
        </div>`,
    };
  }

  function gradeAgainstTarget(said, target, tipo) {
    const steps = alignWords(words(target), words(said));
    const points = steps.reduce((sum, s) => sum + (s.type === 'ok' ? 1 : s.type === 'close' ? 0.6 : 0), 0);
    const score = Math.round((points / Math.max(words(target).length, 1)) * 100);
    const marked = steps.map((s) => {
      if (s.type === 'ok') return `<span class="word-ok">${esc(s.target)}</span>`;
      if (s.type === 'close') return `<span class="word-close">${esc(s.spoken)}</span>`;
      if (s.type === 'missing') return `<span class="word-miss">${esc(s.target)}</span>`;
      return `<span class="word-extra">${esc(s.spoken)}</span>`;
    }).join(' ');
    const missing = steps.filter((s) => s.type === 'missing').map((s) => s.target);
    return {
      score,
      html: `
        <div class="fix ${score >= 85 ? 'ok' : ''}">
          <div class="said">${tipo === 'ditado' ? 'o que você escreveu' : 'o que saiu na sua fala'}</div>
          <div class="diff">${marked}</div>
          <div class="notes">
            <div class="note"><b>Frase certa:</b><br>${esc(target)}</div>
            ${missing.length ? `<div class="note">Faltou / saiu diferente: <b>${esc(missing.join(', '))}</b></div>` : ''}
          </div>
        </div>`,
    };
  }

  function submit(score, html) {
    scores.push(score);
    feedback = { score, html };
    phase = 'feedback';
    render();
  }

  // -------------------------------------------------------------- entradas ---
  function handleSpoken(text, cur) {
    if (cur.kind === 'pronuncia') {
      const { score, html } = gradeAgainstTarget(text, cur.text, 'pronuncia');
      submit(score, html);
      return;
    }
    const { score, html } = gradeSentence(text, 'voice');
    submit(score, html);
  }

  function micButton(cur) {
    if (!asrSupported()) {
      return `<div class="banner">Este navegador não escuta você. Use o Chrome (Android) ou o Safari (iPhone) — ou responda digitando.</div>
        <div class="row" style="margin-top:10px">
          <input type="text" class="js-typed" placeholder="digite sua resposta em inglês" />
          <button class="btn primary js-send-typed">Enviar</button>
        </div>`;
    }
    return `
      <div class="stack" style="margin-top:18px;justify-items:center">
        <button class="mic js-mic" data-state="idle" aria-label="Gravar sua resposta">🎙️</button>
        <div class="live js-live">${typing ? '' : 'toque no microfone e fale'}</div>
        ${typing
    ? `<div class="row" style="width:100%">
             <input type="text" class="js-typed" placeholder="digite sua resposta em inglês" />
             <button class="btn primary js-send-typed">Enviar</button>
           </div>`
    : '<button class="btn ghost small js-type">não posso falar agora</button>'}
      </div>`;
  }

  function wireMic(cur) {
    const mic = $('.js-mic', root);
    if (mic) {
      mic.addEventListener('click', () => {
        stopSpeaking();
        if (!recognizer) {
          recognizer = createRecognizer({
            lang: settings().asrLang,
            onState: (state) => {
              const btn = $('.js-mic', root);
              if (!btn) return;
              btn.dataset.state = state;
              btn.textContent = state === 'listening' ? '⏹' : state === 'processing' ? '⏳' : '🎙️';
              const live = $('.js-live', root);
              if (live && state === 'listening') live.textContent = 'ouvindo…';
            },
            onPartial: (text) => { const live = $('.js-live', root); if (live) live.textContent = text; },
            onFinal: (text) => handleSpoken(text, cur),
            onError: (msg) => { const live = $('.js-live', root); if (live) live.textContent = msg; },
          });
        }
        if (recognizer?.listening) recognizer.stop();
        else { recognizer?.setLang(settings().asrLang); recognizer?.start(); }
      });
    }
    $('.js-type', root)?.addEventListener('click', () => { typing = true; render(); });
    const typed = $('.js-typed', root);
    const send = () => {
      const value = typed.value.trim();
      if (value) handleSpoken(value, cur);
    };
    $('.js-send-typed', root)?.addEventListener('click', send);
    typed?.addEventListener('keydown', (e) => { if (e.key === 'Enter') send(); });
  }

  // ---------------------------------------------------------------- telas ---
  function taskHtml() {
    const cur = item();
    const meta = TYPE_META[cur.kind];

    if (cur.kind === 'falar') {
      return `
        <div class="task">
          <div class="kind">${meta.icon} ${esc(meta.label)}</div>
          <p class="prompt">${esc(cur.ask)}</p>
          <button class="btn ghost small js-say" data-text="${esc(cur.ask)}">🔊 ouvir a pergunta</button>
          ${cur.hint ? `<p class="hint" style="margin-top:12px">🇧🇷 ${esc(cur.hint)}</p>` : ''}
          ${cur.model ? `<details class="model"><summary>ver uma resposta modelo</summary><p>${esc(cur.model)}</p></details>` : ''}
        </div>
        ${micButton(cur)}`;
    }

    if (cur.kind === 'pronuncia') {
      return `
        <div class="task">
          <div class="kind">${meta.icon} ${esc(meta.label)}</div>
          <p class="prompt">${esc(cur.text)}</p>
          <div class="row">
            <button class="btn small js-say" data-text="${esc(cur.text)}">🔊 ouvir</button>
            <button class="btn small js-say-slow" data-text="${esc(cur.text)}">🐢 devagar</button>
          </div>
        </div>
        ${micButton(cur)}`;
    }

    if (cur.kind === 'escrever') {
      return `
        <div class="task">
          <div class="kind">${meta.icon} ${esc(meta.label)}</div>
          <p class="prompt pt">${esc(cur.ask)}</p>
          ${cur.hint ? `<p class="hint">🇧🇷 ${esc(cur.hint)}</p>` : ''}
          ${cur.model ? `<details class="model"><summary>ver uma resposta modelo</summary><p>${esc(cur.model)}</p></details>` : ''}
        </div>
        <div class="stack" style="margin-top:16px">
          <textarea class="js-answer" placeholder="escreva em inglês"></textarea>
          <button class="btn primary block js-check">Verificar</button>
        </div>`;
    }

    if (cur.kind === 'ditado') {
      return `
        <div class="task center">
          <div class="kind">${meta.icon} ${esc(meta.label)}</div>
          <p class="prompt pt">Ouça e escreva o que você entendeu.</p>
          <div class="row" style="justify-content:center">
            <button class="btn primary js-say" data-text="${esc(cur.text)}">🔊 ouvir</button>
            <button class="btn small js-say-slow" data-text="${esc(cur.text)}">🐢 devagar</button>
          </div>
        </div>
        <div class="stack" style="margin-top:16px">
          <input type="text" class="js-answer" placeholder="escreva a frase em inglês" />
          <button class="btn primary block js-check">Verificar</button>
        </div>`;
    }

    // corrigir
    return `
      <div class="task">
        <div class="kind">${meta.icon} ${esc(meta.label)}</div>
        <p class="prompt pt">Conserte ${cur.context ? 'o trecho' : 'a frase'}:</p>
        <p class="prompt"><span class="wrong">${esc(cur.wrong)}</span></p>
        ${cur.context ? `<p class="hint">na sua frase: "${esc(cur.context)}"</p>` : ''}
      </div>
      <div class="stack" style="margin-top:16px">
        <input type="text" class="js-answer" placeholder="escreva a frase correta" />
        <button class="btn primary block js-check">Verificar</button>
      </div>`;
  }

  function wireTask() {
    const cur = item();
    root.querySelectorAll('.js-say').forEach((b) => b.addEventListener('click', () => speak(b.dataset.text, voiceOpts())));
    root.querySelectorAll('.js-say-slow').forEach((b) => b.addEventListener('click', () => speak(b.dataset.text, { ...voiceOpts(), rate: 0.6 })));

    if (cur.kind === 'falar' || cur.kind === 'pronuncia') {
      wireMic(cur);
      if (cur.kind === 'falar' && settings().autoSpeak) speak(cur.ask, voiceOpts());
      return;
    }

    const answer = $('.js-answer', root);
    const check = () => {
      const value = answer.value.trim();
      if (!value) return;
      if (cur.kind === 'escrever') {
        const { score, html } = gradeSentence(value, 'text');
        submit(score, html);
      } else if (cur.kind === 'ditado') {
        const { score, html } = gradeAgainstTarget(value, cur.text, 'ditado');
        submit(score, html);
      } else {
        const ok = norm(value) === norm(cur.right) || norm(value).includes(norm(cur.right));
        if (cur.cardId) gradeCard(cur.cardId, ok);
        submit(ok ? 100 : 0, `
          <div class="fix ${ok ? 'ok' : ''}">
            <div class="said">${ok ? '✅ isso!' : '❌ ainda não'}</div>
            <div class="diff">${esc(cur.right)}</div>
            <div class="notes"><div class="note">${esc(cur.why || '')}</div></div>
          </div>`);
      }
    };
    $('.js-check', root).addEventListener('click', check);
    answer.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); check(); }
    });
    if (cur.kind === 'ditado') speak(cur.text, voiceOpts());
  }

  function feedbackHtml() {
    const last = index === mission.items.length - 1;
    return `
      ${feedback.html}
      <div class="stack" style="margin-top:16px">
        <div class="score-line center">${feedback.score}% nesta frase</div>
        <button class="btn primary block js-next">${last ? 'Ver resultado' : 'Continuar →'}</button>
      </div>`;
  }

  function resultHtml() {
    const score = Math.round(scores.reduce((a, b) => a + b, 0) / Math.max(scores.length, 1));
    const stars = starsFor(score);
    let gained;
    if (mission.review) {
      gained = 10 + stars * 10;
      addXp(gained);
    } else {
      gained = completeMission(mission.id, score, stars).gained;
    }
    return `
      <div class="result">
        <div class="stars-big">${[0, 1, 2].map((i) => `<span class="${i < stars ? 'on' : 'off'}">★</span>`).join('')}</div>
        <h2>${stars === 3 ? 'Perfeito!' : stars === 2 ? 'Muito bem!' : stars === 1 ? 'Passou!' : 'Quase lá'}</h2>
        <p class="muted">Precisão média de ${score}% nesta fase.</p>
        <p class="gain">+${gained} XP</p>
        ${stars === 0 ? '<p class="small muted">Você precisa de 55% para liberar a próxima fase. Repita com calma — frases completas ajudam.</p>' : ''}
        <div class="stack">
          <button class="btn primary block js-exit">${stars > 0 ? 'Voltar ao mapa' : 'Voltar'}</button>
          <button class="btn ghost block js-again">Repetir a fase</button>
        </div>
      </div>`;
  }

  function render() {
    if (phase === 'result') {
      root.innerHTML = `<div class="screen">${resultHtml()}</div>`;
      $('.js-exit', root).addEventListener('click', () => onExit());
      $('.js-again', root).addEventListener('click', () => start(mission.review ? { review: true } : { missionId: mission.id }));
      return;
    }

    const dots = mission.items.map((_, i) => `<span class="dot ${i < index ? 'done' : i === index ? 'now' : ''}"></span>`).join('');
    root.innerHTML = `
      <div class="mission-top">
        <button class="close js-back" aria-label="Sair da fase">✕</button>
        <h2>${esc(mission.title)}</h2>
        <span></span>
      </div>
      <div class="dots">${dots}</div>
      <div class="screen" style="padding-top:0">
        ${phase === 'task' ? taskHtml() : feedbackHtml()}
      </div>`;

    $('.js-back', root).addEventListener('click', () => { stopSpeaking(); onExit(); });
    if (phase === 'task') wireTask();
    else {
      $('.js-next', root).addEventListener('click', () => {
        if (index === mission.items.length - 1) phase = 'result';
        else { index += 1; phase = 'task'; typing = false; }
        render();
      });
    }
  }

  function start(params = {}) {
    stopSpeaking();
    recognizer?.abort();
    recognizer = null;
    mission = params.review ? reviewMission() : MISSIONS_BY_ID[params.missionId];
    index = 0;
    scores = [];
    typing = false;
    phase = 'task';
    if (!mission || !mission.items.length) { onExit(); return; }
    render();
  }

  return {
    id: 'mission',
    hidden: true,
    mount(container, params) { root = container; start(params); },
    unmount() { recognizer?.abort(); recognizer = null; stopSpeaking(); },
  };
}
