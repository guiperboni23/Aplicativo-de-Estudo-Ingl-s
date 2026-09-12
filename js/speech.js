// Reconhecimento de fala (Web Speech API) e síntese de voz.
// Chrome/Edge no desktop e Android têm o melhor suporte.

const SR = window.SpeechRecognition || window.webkitSpeechRecognition;

export function asrSupported() {
  return Boolean(SR);
}

export function ttsSupported() {
  return 'speechSynthesis' in window;
}

const ERRORS_PT = {
  'no-speech': 'Não ouvi nada. Fale um pouco mais perto do microfone.',
  'audio-capture': 'Não encontrei um microfone disponível.',
  'not-allowed': 'Permissão de microfone bloqueada. Libere o microfone para este site.',
  'service-not-allowed': 'O navegador bloqueou o serviço de reconhecimento de fala.',
  network: 'O reconhecimento de fala precisa de internet neste navegador.',
  aborted: 'Gravação interrompida.',
};

/**
 * Cria um controlador de reconhecimento de fala.
 * @param {{lang?:string, onPartial?:Function, onFinal?:Function, onState?:Function, onError?:Function}} opts
 */
export function createRecognizer({
  lang = 'en-US', onPartial, onFinal, onState, onError,
} = {}) {
  if (!SR) return null;
  const recognition = new SR();
  recognition.lang = lang;
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;

  let listening = false;
  let finalText = '';

  recognition.onstart = () => { listening = true; onState?.('listening'); };
  recognition.onaudiostart = () => onState?.('listening');
  recognition.onspeechend = () => onState?.('processing');

  recognition.onresult = (event) => {
    let interim = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const chunk = event.results[i][0].transcript;
      if (event.results[i].isFinal) finalText += `${chunk} `;
      else interim += chunk;
    }
    if (interim) onPartial?.(interim.trim());
    if (finalText) onPartial?.(finalText.trim());
  };

  recognition.onerror = (event) => {
    onError?.(ERRORS_PT[event.error] || `Erro no reconhecimento: ${event.error}`);
  };

  recognition.onend = () => {
    listening = false;
    onState?.('idle');
    const text = finalText.trim();
    finalText = '';
    if (text) onFinal?.(text);
  };

  return {
    start() {
      if (listening) return;
      finalText = '';
      try {
        recognition.start();
      } catch (err) {
        onError?.('Não consegui iniciar a gravação. Tente novamente.');
      }
    },
    stop() {
      if (!listening) return;
      try { recognition.stop(); } catch { /* já parou */ }
    },
    abort() {
      try { recognition.abort(); } catch { /* ignore */ }
    },
    setLang(value) { recognition.lang = value; },
    get listening() { return listening; },
  };
}

let cachedVoices = [];

export function englishVoices() {
  if (!ttsSupported()) return [];
  const all = speechSynthesis.getVoices();
  if (all.length) cachedVoices = all;
  return cachedVoices.filter((v) => /^en([-_]|$)/i.test(v.lang));
}

export function onVoicesReady(cb) {
  if (!ttsSupported()) return;
  if (englishVoices().length) cb(englishVoices());
  speechSynthesis.addEventListener('voiceschanged', () => cb(englishVoices()), { once: true });
}

/** Fala um texto em inglês. Devolve uma Promise que resolve no fim da fala. */
export function speak(text, { rate = 0.92, voiceURI = '', lang = 'en-US' } = {}) {
  return new Promise((resolve) => {
    if (!ttsSupported() || !text) { resolve(); return; }
    speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = lang;
    utter.rate = rate;
    const voice = englishVoices().find((v) => v.voiceURI === voiceURI);
    if (voice) utter.voice = voice;
    utter.onend = () => resolve();
    utter.onerror = () => resolve();
    speechSynthesis.speak(utter);
  });
}

export function stopSpeaking() {
  if (ttsSupported()) speechSynthesis.cancel();
}
