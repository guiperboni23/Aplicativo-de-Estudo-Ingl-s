// Tutor offline: gera as respostas da conversa sem depender de internet.
// (No modo IA, as respostas vêm de js/ai.js; este arquivo é o plano B sempre disponível.)

import { pick, words } from './utils.js';

const ACKS = [
  'Nice.', 'Got it.', 'That makes sense.', 'Good.', 'I see.', 'Interesting.',
  'Cool.', 'Thanks for sharing.',
];

const SHORT_NUDGES = [
  'Can you say a bit more? Try a full sentence.',
  'Good start — now give me one more detail.',
  'Try to answer with a complete sentence, like "I usually ...".',
];

const FOLLOW_UPS = {
  work: ['What exactly do you do there?', 'How long have you worked there?', 'What is the hardest part of your job?'],
  family: ['How many people are there in your family?', 'What do you usually do together?'],
  food: ['What is your favorite dish?', 'Do you cook at home or eat out?'],
  music: ['What kind of music do you listen to?', 'Who is your favorite artist?'],
  travel: ['Where would you like to travel next?', 'What was the best trip you have taken?'],
  movie: ['What did you watch recently?', 'Do you prefer movies or series?'],
  study: ['How much time do you study every day?', 'What is the hardest part of learning English for you?'],
  weekend: ['What do you usually do on weekends?', 'Any plans for next weekend?'],
  game: ['Which games do you play?', 'Do you play online with friends?'],
  sport: ['Do you play or just watch?', 'How often do you train?'],
  city: ['What do you like about your city?', 'Would you like to live somewhere else?'],
  dog: ['What is your pet like?', 'Who takes care of it?'],
  coffee: ['How many cups do you drink a day?', 'Do you prefer coffee or tea?'],
};

const GENERIC_QUESTIONS = [
  'What did you do before we started talking?',
  'Tell me something you are looking forward to.',
  'What is something new you learned this week?',
  'If you had a free day tomorrow, what would you do?',
  'What is your favorite way to relax after work?',
  'Describe your typical morning in three sentences.',
  'What is one goal you have for this year?',
];

function reactTo(userText, expect = {}) {
  const lower = userText.toLowerCase();
  for (const [key, reply] of Object.entries(expect)) {
    if (lower.includes(key)) return reply;
  }
  return null;
}

function followUp(userText) {
  const lower = userText.toLowerCase();
  for (const [key, questions] of Object.entries(FOLLOW_UPS)) {
    if (lower.includes(key)) return pick(questions);
  }
  return pick(GENERIC_QUESTIONS);
}

export function openingLine(scenario) {
  if (!scenario) {
    return {
      reply: "Hi Guilherme! Let's just talk. How was your day?",
      hintPt: 'Responda com uma frase completa. Se travar, diga "How do you say ... in English?".',
      model: 'It was good. I worked in the morning and studied a little in the evening.',
    };
  }
  const first = scenario.turns[0];
  return { reply: first.ask, hintPt: first.hintPt, model: first.model };
}

/**
 * Resposta do tutor para uma fala/escrita do aluno.
 * @param {object} p
 * @param {object|null} p.scenario cenário atual (ou null = conversa livre)
 * @param {number} p.turnIndex índice da pergunta atual
 * @param {string} p.userText texto do aluno (já corrigido ou original)
 * @param {object} p.result saída de analyze()
 */
export function respond({ scenario, turnIndex = 0, userText = '', result = null }) {
  const count = words(userText).length;
  const recast = result?.changed ? `We usually say: "${result.corrected}"` : '';

  if (count > 0 && count < 3) {
    return {
      reply: `${pick(SHORT_NUDGES)}`,
      hintPt: 'Frases curtas demais não treinam estrutura. Tente 6+ palavras.',
      model: scenario?.turns[turnIndex]?.model || '',
      nextIndex: turnIndex,
      recast,
      done: false,
    };
  }

  if (!scenario) {
    return {
      reply: `${pick(ACKS)} ${followUp(userText)}`,
      hintPt: '',
      model: '',
      nextIndex: turnIndex + 1,
      recast,
      done: false,
    };
  }

  const turn = scenario.turns[turnIndex];
  const reaction = turn ? reactTo(userText, turn.expect) || pick(ACKS) : pick(ACKS);
  const next = scenario.turns[turnIndex + 1];

  if (!next) {
    return {
      reply: `${reaction} That's the end of this scenario — you handled it well. Want to try another one?`,
      hintPt: 'Cenário concluído! Escolha outro no seletor acima ou continue na conversa livre.',
      model: '',
      nextIndex: turnIndex + 1,
      recast,
      done: true,
    };
  }

  return {
    reply: `${reaction} ${next.ask}`,
    hintPt: next.hintPt,
    model: next.model,
    nextIndex: turnIndex + 1,
    recast,
    done: false,
  };
}

const LESSONS_BY_CAT = {
  'concordância': 'Revise a regra do -s: he/she/it + verbo com -s no presente (he works, she studies). Na negativa, o -s vai para o auxiliar: he doesn\'t work.',
  'tempo verbal': 'Escolha o tempo pelo marcador: yesterday/last week/ago → passado simples; since/for + agora → present perfect (have/has + particípio).',
  'preposição': 'Preposições andam com o verbo, não com a tradução. Decore em bloco: listen TO, depend ON, married TO, arrive AT, good AT, interested IN.',
  'verbo': 'Em inglês quase toda frase precisa de sujeito e de auxiliar na negativa/pergunta: "It is raining", "I don\'t know", "Does he work?".',
  'artigo': 'Profissão no singular pede artigo (I am an engineer) e "an" vem antes de som de vogal (an hour, a university).',
  'plural': 'Incontáveis não pluralizam: information, advice, money, furniture, feedback. Use "some", "a piece of", "a lot of".',
  'vocabulário': 'Colocações resolvem metade dos erros: make a mistake, ask a question, make a decision, have a party, take a trip, earn money.',
  'ordem das palavras': 'Pergunta em inglês = auxiliar + sujeito + verbo: "What does it mean?", "How can I help?".',
  'comparativo': 'Adjetivo curto: -er / -est (cheaper, the biggest). Adjetivo longo: more / the most (more interesting).',
  'ortografia': 'Leia em voz alta e escreva depois: because, receive, definitely, through, a lot, different, environment.',
  'estilo': 'Contrações e pontuação deixam o texto natural: I\'m, don\'t, it\'s. Feche as frases com ponto ou interrogação.',
  'falso cognato': 'Cuidado com falsos amigos: actually (na verdade), pretend (fingir), realize (perceber), push (empurrar), library (biblioteca).',
  'português no meio': 'Quando faltar a palavra, não troque de idioma: use "How do you say ... in English?" ou descreva com outras palavras.',
};

/** Mini-lição em português baseada nos erros mais frequentes. */
export function miniLesson(topErrors = []) {
  if (!topErrors.length) {
    return 'Sem erros recorrentes ainda. Fale frases mais longas para o tutor ter o que analisar.';
  }
  const cat = topErrors[0].cat;
  return LESSONS_BY_CAT[cat] || `Foque em ${cat}: revise os exemplos nas suas correções recentes.`;
}
