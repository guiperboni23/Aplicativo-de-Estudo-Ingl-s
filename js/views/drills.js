// Treinos curtos: pronúncia, ditado e revisão dos SEUS erros (repetição espaçada).

import { $, esc, pick, alignWords, words } from '../utils.js';
import {
  cefr, dueCards, gradeCard, addXp, getState, stats,
} from '../state.js';
import { PRONUNCIATION, DICTATION, FIX_IT, forLevel } from '../lessons.js';
import {
  asrSupported, createRecognizer, speak, stopSpeaking, ttsSupported,
} from '../speech.js';
import { analyze } from '../corrector/engine.js';

const MODES = [
  { id: 'pron', label: '🗣️ Pronúncia' },
  { id: 'dictation', label: '✍️ Ditado' },
  { id: 'review', label: '🧠 Revisar meus erros' },
];

const norm = (s) => words(s).join(' ');

export function createDrillsView() {
  let root;
  let mode = 'pron';
  let target = '';
  let card = null;
  let recognizer = null;
  const settings = () => getState().settings;

  function voiceOpts() {
    return { rate: settings().ttsRate, voiceURI: settings().ttsVoice };
  }

  // ----------------------------------------------------------- pronúncia ---
  function scorePronunciation(spoken) {
    const steps = alignWords(words(target), words(spoken));
    const points = steps.reduce((sum, s) => sum + (s.type === 'ok' ? 1 : s.type === 'close' ? 0.6 : 0), 0);
    const score = Math.round((points / Math.max(words(target).length, 1)) * 100);
    const marked = steps.map((s) => {
      if (s.type === 'ok') return `<span class="word-ok">${esc(s.target)}</span>`;
      if (s.type === 'close') return `<span class="word-close">${esc(s.spoken)}</span>`;
      if (s.type === 'missing') return `<span class="word-miss">${esc(s.target)}</span>`;
      return `<span class="word-extra">${esc(s.spoken)}</span>`;
    }).join(' ');
    return { score, marked, steps };
  }

  function showPronResult(spoken) {
    const { score, marked, steps } = scorePronunciation(spoken);
    const missing = steps.filter((s) => s.type === 'missing').map((s) => s.target);
    addXp(score >= 85 ? 12 : score >= 60 ? 7 : 3);
    $('.js-result', root).innerHTML = `
      <div class="fix ${score >= 85 ? 'clean' : ''}">
        <div class="row spread">
          <b style="font-size:18px">${score}% de acerto</b>
          <span class="small muted">o reconhecimento ouviu: "${esc(spoken)}"</span>
        </div>
        <div class="target-sentence" style="font-size:18px;margin:10px 0">${marked}</div>
        ${missing.length
    ? `<div class="small">Palavras que não saíram claras: <b>${esc(missing.join(', '))}</b>.
         Ouça o modelo e repita devagar, exagerando o som final.</div>`
    : '<div class="small">Pronúncia limpa! Aumente a velocidade e mantenha a entonação.</div>'}
      </div>`;
    root.dispatchEvent(new CustomEvent('progress-changed', { bubbles: true }));
  }

  // -------------------------------------------------------------- ditado ---
  function checkDictation(typed) {
    const steps = alignWords(words(target), words(typed));
    const hits = steps.filter((s) => s.type === 'ok').length;
    const score = Math.round((hits / Math.max(words(target).length, 1)) * 100);
    addXp(score >= 90 ? 12 : score >= 60 ? 7 : 3);
    const marked = steps.map((s) => {
      if (s.type === 'ok') return `<span class="word-ok">${esc(s.target)}</span>`;
      if (s.type === 'missing') return `<span class="word-miss">${esc(s.target)}</span>`;
      if (s.type === 'extra') return `<span class="word-extra">${esc(s.spoken)}</span>`;
      return `<span class="word-close">${esc(s.spoken)}</span>`;
    }).join(' ');
    $('.js-result', root).innerHTML = `
      <div class="fix ${score >= 90 ? 'clean' : ''}">
        <div class="row spread"><b style="font-size:18px">${score}%</b>
          <button class="btn small js-say">🔊 ouvir de novo</button></div>
        <div class="target-sentence" style="font-size:18px;margin:10px 0">${marked}</div>
        <div class="small muted">Frase correta: <b>${esc(target)}</b></div>
      </div>`;
    root.dispatchEvent(new CustomEvent('progress-changed', { bubbles: true }));
  }

  // ------------------------------------------------------------- revisão ---
  function nextReviewCard() {
    const due = dueCards(20);
    if (due.length) {
      card = pick(due);
      return {
        wrong: card.front,
        right: card.back,
        why: card.why,
        context: card.context,
        own: true,
      };
    }
    card = null;
    return { ...pick(FIX_IT), own: false };
  }

  function renderReview() {
    const item = nextReviewCard();
    const box = $('.js-drill', root);
    box.innerHTML = `
      <p class="small muted">${item.own
    ? '↩️ Este erro é seu — apareceu numa conversa recente.'
    : '📚 Exercício clássico (seus erros entram aqui automaticamente).'}</p>
      <div class="target-sentence">Conserte o trecho: <span class="wrong">${esc(item.wrong)}</span></div>
      ${item.context ? `<p class="small muted">Contexto: "${esc(item.context)}"</p>` : ''}
      <label class="field"><span>Escreva a versão correta</span>
        <input type="text" class="js-answer" placeholder="digite aqui e pressione Enter" />
      </label>
      <div class="row">
        <button class="btn primary js-check">Verificar</button>
        <button class="btn ghost js-reveal">Mostrar resposta</button>
        <button class="btn ghost js-skip">Pular</button>
      </div>
      <div class="js-result" style="margin-top:12px"></div>`;

    const answer = $('.js-answer', box);
    const verdict = (ok, typed) => {
      const analysis = analyze(typed || '', { mode: 'text' });
      $('.js-result', box).innerHTML = `
        <div class="fix ${ok ? 'clean' : ''}">
          <div>${ok ? '✅ Isso!' : '❌ Ainda não.'} Resposta esperada:
            <span class="right">${esc(item.right)}</span></div>
          <div class="small muted" style="margin-top:6px">${esc(item.why || '')}</div>
          ${!ok && typed && analysis.changed
    ? `<div class="small" style="margin-top:6px">Sua frase corrigida ficaria: <b>${esc(analysis.corrected)}</b></div>`
    : ''}
          <div class="row" style="margin-top:10px">
            <button class="btn small js-say" data-text="${esc(item.right)}">🔊 ouvir</button>
            <button class="btn small primary js-next-card">Próximo →</button>
          </div>
        </div>`;
      if (card) gradeCard(card.id, ok);
      if (ok) addXp(6);
      root.dispatchEvent(new CustomEvent('progress-changed', { bubbles: true }));
    };

    const check = () => {
      const typed = answer.value.trim();
      const alvo = norm(item.right);
      const dado = norm(typed);
      // Aceita o trecho isolado ou a frase inteira contendo a correção.
      verdict(Boolean(alvo) && (dado === alvo || dado.includes(alvo)), typed);
    };
    $('.js-check', box).addEventListener('click', check);
    answer.addEventListener('keydown', (e) => { if (e.key === 'Enter') check(); });
    $('.js-reveal', box).addEventListener('click', () => verdict(false, answer.value.trim()));
    $('.js-skip', box).addEventListener('click', renderReview);
    box.addEventListener('click', (e) => {
      if (e.target.closest('.js-next-card')) renderReview();
      const say = e.target.closest('.js-say');
      if (say) speak(say.dataset.text || item.right, voiceOpts());
    });
  }

  // ------------------------------------------------------------ pronúncia ---
  function renderPron() {
    target = pick(forLevel(PRONUNCIATION, cefr()));
    const box = $('.js-drill', root);
    box.innerHTML = `
      <p class="small muted">Ouça, repita em voz alta e veja palavra por palavra o que saiu.</p>
      <div class="target-sentence">${esc(target)}</div>
      <div class="row">
        <button class="btn js-say">🔊 ouvir modelo</button>
        <button class="btn js-say-slow">🐢 bem devagar</button>
        <button class="mic js-mic" data-state="idle" ${asrSupported() ? '' : 'disabled'}>🎙️</button>
        <button class="btn ghost js-next">próxima frase →</button>
      </div>
      ${asrSupported() ? '' : '<div class="banner" style="margin-top:10px">Seu navegador não reconhece fala. Use Chrome ou Edge para este treino.</div>'}
      <div class="live" style="margin-top:10px"></div>
      <div class="js-result" style="margin-top:12px"></div>`;

    $('.js-say', box).addEventListener('click', () => speak(target, voiceOpts()));
    $('.js-say-slow', box).addEventListener('click', () => speak(target, { ...voiceOpts(), rate: 0.6 }));
    $('.js-next', box).addEventListener('click', renderPron);
    $('.js-mic', box).addEventListener('click', () => {
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
          onPartial: (text) => { const live = $('.live', root); if (live) live.textContent = text; },
          onFinal: (text) => { const live = $('.live', root); if (live) live.textContent = ''; showPronResult(text); },
          onError: (msg) => { $('.js-result', root).innerHTML = `<div class="banner">${esc(msg)}</div>`; },
        });
      }
      if (recognizer?.listening) recognizer.stop();
      else { recognizer?.setLang(settings().asrLang); recognizer?.start(); }
    });
  }

  // --------------------------------------------------------------- ditado ---
  function renderDictation() {
    target = pick(forLevel(DICTATION, cefr()));
    const box = $('.js-drill', root);
    box.innerHTML = `
      <p class="small muted">Clique em ouvir, escreva exatamente o que você entendeu e confira.</p>
      <div class="row">
        <button class="btn primary js-say">🔊 ouvir a frase</button>
        <button class="btn js-say-slow">🐢 devagar</button>
        <button class="btn ghost js-next">outra frase →</button>
      </div>
      <label class="field" style="margin-top:12px"><span>O que você ouviu</span>
        <input type="text" class="js-answer" placeholder="escreva em inglês e pressione Enter" />
      </label>
      <button class="btn js-check">Verificar</button>
      <div class="js-result" style="margin-top:12px"></div>`;

    const say = (rate) => speak(target, { ...voiceOpts(), ...(rate ? { rate } : {}) });
    $('.js-say', box).addEventListener('click', () => say());
    $('.js-say-slow', box).addEventListener('click', () => say(0.6));
    $('.js-next', box).addEventListener('click', renderDictation);
    const answer = $('.js-answer', box);
    const run = () => checkDictation(answer.value);
    $('.js-check', box).addEventListener('click', run);
    answer.addEventListener('keydown', (e) => { if (e.key === 'Enter') run(); });
    box.addEventListener('click', (e) => { if (e.target.closest('.js-say') && e.target.closest('.js-result')) say(); });
    say();
  }

  function renderMode() {
    if (mode === 'pron') renderPron();
    else if (mode === 'dictation') renderDictation();
    else renderReview();
  }

  function render() {
    const s = stats();
    root.innerHTML = `
      <div class="card">
        <h2>🏋️ Treinos rápidos</h2>
        <p class="muted small" style="margin:2px 0 10px">
          Sessões de 3 minutos. Nível atual: <b>${cefr()}</b> ·
          ${s.dueCount} ${s.dueCount === 1 ? 'correção esperando revisão' : 'correções esperando revisão'}.
        </p>
        <div class="pill-row">
          ${MODES.map((m) => `<button class="pill js-mode" data-mode="${m.id}" aria-pressed="${m.id === mode}">${m.label}</button>`).join('')}
        </div>
        ${ttsSupported() ? '' : '<div class="banner" style="margin-top:10px">Sem voz sintetizada neste navegador: o ditado vai precisar de outro navegador.</div>'}
      </div>
      <div class="card js-drill"></div>`;

    root.querySelectorAll('.js-mode').forEach((btn) => btn.addEventListener('click', () => {
      mode = btn.dataset.mode;
      stopSpeaking();
      render();
    }));
    renderMode();
  }

  return {
    id: 'drills',
    label: '🏋️ Treinos',
    mount(container) { root = container; render(); },
    unmount() { recognizer?.abort(); recognizer = null; stopSpeaking(); },
  };
}
