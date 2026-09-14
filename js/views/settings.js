// Ajustes: o mínimo necessário.

import { esc } from '../utils.js';
import { getState, setSetting } from '../state.js';
import { englishVoices, onVoicesReady, speak, asrSupported } from '../speech.js';

export function createSettingsView() {
  let root;

  function render() {
    const s = getState().settings;

    root.innerHTML = `
      <div class="screen stack">
        <div class="card">
          <h3 style="margin:0 0 12px">Voz</h3>
          <label class="field"><span>Voz do tutor</span>
            <select class="js-voice">
              <option value="">padrão do aparelho</option>
              ${englishVoices().map((v) => `<option value="${esc(v.voiceURI)}" ${v.voiceURI === s.ttsVoice ? 'selected' : ''}>${esc(v.name)}</option>`).join('')}
            </select>
          </label>
          <label class="field"><span>Velocidade: <b class="js-rate-val">${s.ttsRate.toFixed(2)}</b>×</span>
            <input type="range" class="js-rate" min="0.55" max="1.25" step="0.05" value="${s.ttsRate}" />
          </label>
          <label class="row small" style="gap:8px">
            <input type="checkbox" class="js-autospeak" ${s.autoSpeak ? 'checked' : ''} /> falar as respostas automaticamente
          </label>
          <button class="btn small js-test" style="margin-top:12px">testar voz</button>
        </div>

        <div class="card">
          <h3 style="margin:0 0 12px">Microfone</h3>
          <label class="field"><span>Sotaque que o app espera ouvir</span>
            <select class="js-asr">
              ${['en-US', 'en-GB', 'en-AU', 'en-CA'].map((l) => `<option value="${l}" ${l === s.asrLang ? 'selected' : ''}>${l}</option>`).join('')}
            </select>
          </label>
          <p class="small muted" style="margin:0">
            ${asrSupported() ? '✅ Este navegador escuta você.' : '❌ Este navegador não escuta. Use Chrome (Android) ou Safari (iPhone).'}
          </p>
        </div>

      </div>`;

    const bind = (sel, ev, fn) => root.querySelector(sel).addEventListener(ev, fn);
    bind('.js-voice', 'change', (e) => setSetting('ttsVoice', e.target.value));
    bind('.js-asr', 'change', (e) => setSetting('asrLang', e.target.value));
    bind('.js-rate', 'input', (e) => {
      const value = Number(e.target.value);
      root.querySelector('.js-rate-val').textContent = value.toFixed(2);
      setSetting('ttsRate', value);
    });
    bind('.js-autospeak', 'change', (e) => setSetting('autoSpeak', e.target.checked));
    bind('.js-test', 'click', () => {
      const cur = getState().settings;
      speak('Hi Guilherme! Ready to practice your English today?', { rate: cur.ttsRate, voiceURI: cur.ttsVoice });
    });
    onVoicesReady(() => {
      const select = root.querySelector('.js-voice');
      if (!select) return;
      const current = getState().settings.ttsVoice;
      select.innerHTML = `<option value="">padrão do aparelho</option>${
        englishVoices().map((v) => `<option value="${esc(v.voiceURI)}" ${v.voiceURI === current ? 'selected' : ''}>${esc(v.name)}</option>`).join('')}`;
    });
  }

  return {
    id: 'settings',
    label: 'Ajustes',
    icon: '⚙️',
    mount(container) { root = container; render(); },
  };
}
