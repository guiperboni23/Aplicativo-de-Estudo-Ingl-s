// Ajustes: voz, velocidade, idioma do reconhecimento e modo IA opcional.

import { esc } from '../utils.js';
import { getState, setSetting } from '../state.js';
import { englishVoices, onVoicesReady, speak, ttsSupported, asrSupported } from '../speech.js';
import { aiHealth } from '../ai.js';

export function createSettingsView() {
  let root;

  function render() {
    const s = getState().settings;
    const voices = englishVoices();

    root.innerHTML = `
      <div class="card">
        <h2>🔊 Voz e microfone</h2>
        <div class="grid two">
          <label class="field"><span>Voz do tutor</span>
            <select class="js-voice">
              <option value="">(voz padrão do sistema)</option>
              ${voices.map((v) => `<option value="${esc(v.voiceURI)}" ${v.voiceURI === s.ttsVoice ? 'selected' : ''}>${esc(v.name)} — ${esc(v.lang)}</option>`).join('')}
            </select>
          </label>
          <label class="field"><span>Sotaque do reconhecimento de fala</span>
            <select class="js-asr">
              ${['en-US', 'en-GB', 'en-AU', 'en-CA', 'en-IN'].map((l) => `<option value="${l}" ${l === s.asrLang ? 'selected' : ''}>${l}</option>`).join('')}
            </select>
          </label>
        </div>
        <label class="field"><span>Velocidade da fala do tutor: <b class="js-rate-val">${s.ttsRate.toFixed(2)}</b>×</span>
          <input type="range" class="js-rate" min="0.55" max="1.25" step="0.05" value="${s.ttsRate}" />
        </label>
        <div class="row">
          <label class="row small" style="gap:6px">
            <input type="checkbox" class="js-autospeak" ${s.autoSpeak ? 'checked' : ''} />
            falar as respostas do tutor automaticamente
          </label>
          <button class="btn small js-test-voice">testar voz</button>
        </div>
        <p class="small muted" style="margin-top:10px">
          Reconhecimento de fala: ${asrSupported() ? '✅ disponível' : '❌ não disponível neste navegador (use Chrome/Edge)'} ·
          Voz sintetizada: ${ttsSupported() ? '✅ disponível' : '❌ não disponível'}
        </p>
      </div>

      <div class="card">
        <h2>🤖 Modo IA (opcional)</h2>
        <p class="small muted">
          Sem IA o app já corrige e conversa (tutor offline). Ligando o modo IA, as respostas ficam
          mais naturais e as correções mais detalhadas. Para isso rode o servidor local
          <code>node server/proxy.mjs</code> — sua chave da API fica no seu computador, nunca na página.
        </p>
        <label class="row small" style="gap:6px;margin:8px 0">
          <input type="checkbox" class="js-ai" ${s.aiEnabled ? 'checked' : ''} /> usar o tutor de IA quando disponível
        </label>
        <label class="field"><span>Endereço do servidor</span>
          <input type="text" class="js-endpoint" value="${esc(s.aiEndpoint)}" placeholder="http://localhost:8787" />
        </label>
        <div class="row">
          <button class="btn js-test-ai">testar conexão</button>
          <span class="small muted js-ai-status"></span>
        </div>
      </div>

      <div class="card">
        <h2>⌨️ Atalhos</h2>
        <ul class="list small">
          <li><kbd>1</kbd> … <kbd>4</kbd> — trocar de aba</li>
          <li><kbd>Espaço</kbd> — ligar/desligar o microfone no chat de voz</li>
          <li><kbd>Ctrl</kbd> + <kbd>Enter</kbd> — enviar no chat escrito</li>
        </ul>
      </div>

      <div class="card">
        <h2>Como tirar mais do treino</h2>
        <ul class="list small">
          <li>Fale frases de 8 a 15 palavras: frases curtas não treinam estrutura.</li>
          <li>Quando faltar a palavra, não troque para o português — diga <i>"How do you say ... in English?"</i>.</li>
          <li>Depois de cada correção, repita a frase corrigida em voz alta uma vez.</li>
          <li>Revise o deck de erros (aba Treinos) antes de começar uma conversa nova.</li>
          <li>15 minutos por dia valem mais que 2 horas no fim de semana — a ofensiva 🔥 cuida disso.</li>
        </ul>
      </div>`;

    const bind = (sel, event, handler) => root.querySelector(sel).addEventListener(event, handler);

    bind('.js-voice', 'change', (e) => setSetting('ttsVoice', e.target.value));
    bind('.js-asr', 'change', (e) => setSetting('asrLang', e.target.value));
    bind('.js-rate', 'input', (e) => {
      const value = Number(e.target.value);
      root.querySelector('.js-rate-val').textContent = value.toFixed(2);
      setSetting('ttsRate', value);
    });
    bind('.js-autospeak', 'change', (e) => setSetting('autoSpeak', e.target.checked));
    bind('.js-test-voice', 'click', () => {
      const cur = getState().settings;
      speak('Hi Guilherme! This is how I sound. Let us practice your English today.', {
        rate: cur.ttsRate, voiceURI: cur.ttsVoice,
      });
    });
    bind('.js-ai', 'change', (e) => setSetting('aiEnabled', e.target.checked));
    bind('.js-endpoint', 'change', (e) => setSetting('aiEndpoint', e.target.value.trim()));
    bind('.js-test-ai', 'click', async () => {
      const status = root.querySelector('.js-ai-status');
      status.textContent = 'testando…';
      try {
        const info = await aiHealth();
        status.textContent = `✅ conectado (${info.model || 'modelo configurado'})`;
      } catch (err) {
        status.textContent = `❌ ${err.message} — rode "node server/proxy.mjs" na pasta do projeto`;
      }
    });

    onVoicesReady(() => {
      if (!root.querySelector('.js-voice')) return;
      const current = getState().settings.ttsVoice;
      root.querySelector('.js-voice').innerHTML = `<option value="">(voz padrão do sistema)</option>${
        englishVoices().map((v) => `<option value="${esc(v.voiceURI)}" ${v.voiceURI === current ? 'selected' : ''}>${esc(v.name)} — ${esc(v.lang)}</option>`).join('')}`;
    });
  }

  return {
    id: 'settings',
    label: '⚙️ Ajustes',
    mount(container) { root = container; render(); },
  };
}
