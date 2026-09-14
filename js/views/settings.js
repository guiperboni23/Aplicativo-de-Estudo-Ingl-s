// Ajustes: o mínimo necessário.

import { esc } from '../utils.js';
import { getState, setSetting } from '../state.js';
import { englishVoices, onVoicesReady, speak, asrSupported } from '../speech.js';
import { aiTest, MODELS } from '../ai.js';

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

        <div class="card">
          <h3 style="margin:0 0 6px">🇺🇸 Conversa com nativo</h3>
          <p class="small muted" style="margin:0 0 12px">
            Um americano conversando com você por voz ou texto, sobre qualquer assunto.
            Precisa de uma chave da API da Anthropic, que é paga por uso.
          </p>
          <label class="field"><span>Como conectar</span>
            <select class="js-ai-mode">
              <option value="off" ${s.aiMode === 'off' ? 'selected' : ''}>Desligado — usa o tutor do app</option>
              <option value="key" ${s.aiMode === 'key' ? 'selected' : ''}>Chave neste aparelho — funciona no celular</option>
              <option value="server" ${s.aiMode === 'server' ? 'selected' : ''}>Servidor local — só no computador</option>
            </select>
          </label>

          ${s.aiMode === 'key' ? `
            <label class="field"><span>Chave da API (começa com sk-ant-)</span>
              <input type="password" class="js-key" value="${esc(s.aiKey)}" placeholder="sk-ant-..." autocomplete="off" />
            </label>
            <label class="field"><span>Modelo</span>
              <select class="js-model">
                ${MODELS.map((m) => `<option value="${m.id}" ${m.id === s.aiModel ? 'selected' : ''}>${esc(m.label)}</option>`).join('')}
              </select>
            </label>
            <p class="small muted" style="margin:0 0 12px">
              Pegue a chave em <b>console.anthropic.com</b> → API keys, e coloque um limite de gastos lá.
              Cada mensagem custa cerca de 1 centavo de dólar no Opus 5 — o Haiku custa umas 5 vezes menos.
            </p>
            <div class="banner" style="margin-bottom:12px">
              A chave fica salva só neste aparelho, no navegador. Quem pegar seu celular desbloqueado
              consegue vê-la — se isso preocupar, use o servidor local no computador.
            </div>` : ''}

          ${s.aiMode === 'server' ? `
            <label class="field"><span>Endereço do servidor</span>
              <input type="text" class="js-endpoint" value="${esc(s.aiEndpoint)}" placeholder="http://localhost:8787" />
            </label>
            <p class="small muted" style="margin:0 0 12px">
              Rode <b>node server/proxy.mjs</b> no computador, com a chave na variável
              ANTHROPIC_API_KEY. Assim ela nunca entra no navegador.
            </p>` : ''}

          ${s.aiMode !== 'off' ? `
            <div class="row">
              <button class="btn small js-test-ai">testar conversa</button>
              <span class="small muted js-ai-status"></span>
            </div>` : ''}
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
    bind('.js-ai-mode', 'change', (e) => { setSetting('aiMode', e.target.value); render(); });
    root.querySelector('.js-key')?.addEventListener('change', (e) => setSetting('aiKey', e.target.value.trim()));
    root.querySelector('.js-model')?.addEventListener('change', (e) => setSetting('aiModel', e.target.value));
    root.querySelector('.js-endpoint')?.addEventListener('change', (e) => setSetting('aiEndpoint', e.target.value.trim()));
    root.querySelector('.js-test-ai')?.addEventListener('click', async () => {
      const status = root.querySelector('.js-ai-status');
      const campo = root.querySelector('.js-key');
      if (campo) setSetting('aiKey', campo.value.trim());
      status.textContent = 'testando…';
      try {
        const reply = await aiTest();
        status.textContent = `✅ ${reply.slice(0, 60)}`;
      } catch (err) {
        status.textContent = `❌ ${err.message}`;
      }
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
