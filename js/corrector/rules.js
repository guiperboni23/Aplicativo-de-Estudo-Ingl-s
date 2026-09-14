// Regras de correção focadas nos erros mais comuns de falantes de português.
//
// Cada regra tem:
//   id   - identificador estável (usado no histórico de erros e na revisão)
//   cat  - categoria mostrada ao usuário
//   sev  - 3 grave (muda o sentido) | 2 erro comum | 1 polimento
//   re   - regex global sobre o texto original
//   fix  - (match) => substituição. Se não existir, a regra é apenas um AVISO.
//   why  - explicação em português
//   ex   - exemplo curto (opcional)

import {
  third, past, participle, gerund, comparative, beOf, matchCase, articleFor,
  PAST_TO_BASE, OVERREGULARIZED,
} from './morphology.js';

export const CAT = {
  VERB: 'verbo',
  TENSE: 'tempo verbal',
  AGREE: 'concordância',
  PREP: 'preposição',
  ART: 'artigo',
  VOCAB: 'vocabulário',
  SPELL: 'ortografia',
  PLURAL: 'plural',
  ORDER: 'ordem das palavras',
  COMP: 'comparativo',
  STYLE: 'estilo',
  FALSE: 'falso cognato',
  PT: 'português no meio',
};

const COMMON_VERBS = [
  'go', 'have', 'do', 'make', 'take', 'get', 'see', 'eat', 'drink', 'buy', 'write',
  'read', 'speak', 'talk', 'say', 'tell', 'think', 'know', 'give', 'find', 'feel',
  'come', 'leave', 'meet', 'pay', 'play', 'run', 'send', 'sit', 'sleep', 'spend',
  'stand', 'study', 'teach', 'travel', 'try', 'use', 'visit', 'wake', 'walk',
  'want', 'watch', 'wear', 'win', 'work', 'learn', 'like', 'live', 'love', 'need',
  'open', 'call', 'ask', 'answer', 'help', 'start', 'finish', 'stay', 'arrive',
  'decide', 'forget', 'lose', 'choose', 'drive', 'fly', 'begin', 'bring', 'build',
  'catch', 'cut', 'fall', 'grow', 'hear', 'hold', 'keep', 'lead', 'let', 'mean',
  'put', 'ride', 'sell', 'sing', 'swim', 'understand',
];

const BASE_OVERRIDES = { goes: 'go', does: 'do', has: 'have', says: 'say' };

/** Volta um verbo (3ª pessoa ou passado) para a forma base. */
export function baseForm(verb) {
  const v = verb.toLowerCase();
  if (BASE_OVERRIDES[v]) return BASE_OVERRIDES[v];
  if (COMMON_VERBS.includes(v)) return v;
  if (PAST_TO_BASE[v]) return PAST_TO_BASE[v];
  if (/ied$/.test(v)) return `${v.slice(0, -3)}y`;
  if (/ed$/.test(v)) {
    const tentativas = [
      v.slice(0, -2),                                   // watched -> watch
      v.slice(0, -1),                                   // liked   -> like
      /([^aeiou])\1ed$/.test(v) ? v.slice(0, -3) : '',  // stopped -> stop
    ].filter(Boolean);
    return tentativas.find((t) => COMMON_VERBS.includes(t)) || tentativas[0];
  }
  if (/ies$/.test(v)) return `${v.slice(0, -3)}y`;
  if (/(?:s|x|z|ch|sh)es$/.test(v)) return v.slice(0, -2);
  if (/s$/.test(v)) return v.slice(0, -1);
  return v;
}

// Alternação "goes|go|studies|study|..." (mais longas primeiro).
const anyForm = (list) => [...new Set(list.flatMap((v) => [v, third(v)]))]
  .sort((a, b) => b.length - a.length)
  .join('|');

const VERB_ANY = anyForm(COMMON_VERBS);
const VERB_ANY_TENSE = [...new Set(COMMON_VERBS.flatMap((v) => [v, third(v), past(v)]))]
  .sort((a, b) => b.length - a.length).join('|');
const VERB_PAST = [...new Set(COMMON_VERBS.map((v) => past(v)))]
  .filter((v) => !COMMON_VERBS.includes(v))
  .sort((a, b) => b.length - a.length).join('|');
const VERB_BASE = [...COMMON_VERBS].sort((a, b) => b.length - a.length).join('|');
const SUBJ = 'I|you|we|they|he|she|it';
const TIME_PAST = 'yesterday|last night|last week|last month|last year|last weekend'
  + '|last (?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)'
  + '|\\d+ (?:days?|weeks?|months?|years?) ago|in \\d{4}';

const rx = (source, flags = 'gi') => new RegExp(source, flags);

// Mantém o tempo verbal ao trocar a colocação (did a mistake -> made a mistake).
const TENSE = {
  make: { make: 'make', makes: 'makes', made: 'made', making: 'making', do: 'make', does: 'makes', did: 'made', doing: 'making', take: 'make', takes: 'makes', took: 'made', taking: 'making' },
  have: { do: 'have', does: 'has', did: 'had', doing: 'having', make: 'have', makes: 'has', made: 'had', making: 'having', have: 'have', has: 'has', had: 'had' },
  ask: { make: 'ask', makes: 'asks', made: 'asked', do: 'ask', does: 'asks', did: 'asked', doing: 'asking', making: 'asking' },
};
const keepTense = (kind, verb) => TENSE[kind][verb.toLowerCase()] || kind;

// --- Erros de grafia (mapa simples) -----------------------------------------
const SPELLING = {
  beacause: 'because', becuase: 'because', becouse: 'because', recieve: 'receive',
  definitly: 'definitely', definately: 'definitely', wich: 'which', trough: 'through',
  alot: 'a lot', ocurred: 'occurred', occured: 'occurred', diferent: 'different',
  comunicate: 'communicate', pronounciation: 'pronunciation', allways: 'always',
  tomorow: 'tomorrow', tommorow: 'tomorrow', bussiness: 'business', sucess: 'success',
  sucessful: 'successful', adress: 'address', apreciate: 'appreciate',
  beleive: 'believe', carrer: 'career', confortable: 'comfortable',
  enviroment: 'environment', goverment: 'government', independant: 'independent',
  necesary: 'necessary', posible: 'possible', responsability: 'responsibility',
  untill: 'until', usualy: 'usually', writting: 'writing', begining: 'beginning',
  acess: 'access', teh: 'the', thier: 'their', wanna: 'want to', gonna: 'going to',
  gotta: 'have to', kinda: 'kind of', dont: "don't", doesnt: "doesn't",
  didnt: "didn't", cant: "can't", wont: "won't", isnt: "isn't", arent: "aren't",
  im: "I'm", ive: "I've", id: "I'd", thats: "that's", whats: "what's",
  its: "it's", hes: "he's", shes: "she's", youre: "you're", theyre: "they're",
  wasnt: "wasn't", couldnt: "couldn't", shouldnt: "shouldn't", wouldnt: "wouldn't",
  havent: "haven't", hasnt: "hasn't", lets: "let's",
};

// Substantivos incontáveis que brasileiros costumam pluralizar.
const UNCOUNTABLE = {
  informations: 'information', advices: 'advice', peoples: 'people',
  knowledges: 'knowledge', feedbacks: 'feedback', softwares: 'software',
  equipments: 'equipment', furnitures: 'furniture', moneys: 'money',
  homeworks: 'homework', trainings: 'training', vocabularies: 'vocabulary',
  researchs: 'research', staffs: 'staff', lucks: 'luck', progresses: 'progress',
};

const FALSE_FRIENDS = [
  ['actually', '"actually" = na verdade / na realidade. Para "atualmente" use "currently" ou "nowadays".'],
  ['pretend', '"pretend" = fingir. Para "pretender" use "intend to" ou "plan to".'],
  ['realize', '"realize" = perceber / se dar conta. Para "realizar (fazer)" use "carry out", "do" ou "hold".'],
  ['push', '"push" = empurrar. "Puxar" é "pull".'],
  ['fabric', '"fabric" = tecido. "Fábrica" é "factory".'],
  ['library', '"library" = biblioteca. "Livraria" é "bookstore".'],
  ['assist', '"assist" = ajudar. Para "assistir (ver)" use "watch".'],
  ['eventually', '"eventually" = no final, com o tempo. Para "eventualmente" use "occasionally".'],
  ['support', '"support" = apoiar. Para "suportar (tolerar)" use "put up with" ou "stand".'],
  ['parents', '"parents" = pai e mãe. "Parentes" é "relatives".'],
  ['costume', '"costume" = fantasia/traje. "Costume (hábito)" é "habit" ou "custom".'],
  ['sensible', '"sensible" = sensato. "Sensível" é "sensitive".'],
  ['college', '"college" = faculdade. "Colégio" é "high school".'],
  ['exit', '"exit" = saída. "Êxito" é "success".'],
  ['lunch', '"lunch" = almoço. "Lançar/lançamento" é "launch".'],
  ['legend', '"legend" = lenda. "Legenda" de filme é "subtitle".'],
  ['tax', '"tax" = imposto. "Taxa (percentual)" é "rate".'],
  ['pasta', '"pasta" = macarrão. "Pasta (arquivo)" é "folder".'],
];

// Palavras claramente portuguesas (para avisar quando a fala escorrega pro PT).
const PT_WORDS = [
  'eu', 'você', 'vocês', 'porque', 'então', 'obrigado', 'obrigada', 'muito',
  'também', 'gosto', 'trabalho', 'casa', 'amigo', 'amiga', 'estou', 'sou',
  'tenho', 'quero', 'preciso', 'fazer', 'coisa', 'gente', 'vamos', 'agora',
  'depois', 'ontem', 'hoje', 'amanhã', 'sempre', 'nunca', 'talvez', 'legal',
  'falar', 'entender', 'ajuda', 'difícil', 'fácil', 'melhor', 'pouco', 'tudo',
  'nada', 'isso', 'aquilo', 'bonito', 'ruim', 'certo', 'errado', 'cansado',
];

/** Regras geradas a partir dos mapas acima. */
function mapRules() {
  const out = [];
  for (const [wrong, right] of Object.entries(SPELLING)) {
    out.push({
      id: `spell-${wrong}`,
      cat: /'/.test(right) || right.includes(' ') ? CAT.STYLE : CAT.SPELL,
      sev: 1,
      re: rx(`\\b${wrong}\\b`),
      fix: (m) => matchCase(m[0], right),
      why: `Escreva "${right}".`,
    });
  }
  for (const [wrong, right] of Object.entries(UNCOUNTABLE)) {
    out.push({
      id: `uncountable-${wrong}`,
      cat: CAT.PLURAL,
      sev: 2,
      re: rx(`\\b${wrong}\\b`),
      fix: (m) => matchCase(m[0], right),
      why: `"${right}" é incontável em inglês: não tem plural com -s.`,
      ex: `I need some ${right}.`,
    });
  }
  for (const [word, note] of FALSE_FRIENDS) {
    out.push({
      id: `false-${word}`,
      cat: CAT.FALSE,
      sev: 1,
      re: rx(`\\b${word}\\b`),
      why: note,
      warn: true,
    });
  }
  for (const word of PT_WORDS) {
    out.push({
      id: 'pt-word',
      cat: CAT.PT,
      sev: 2,
      re: rx(`\\b${word}\\b`, 'giu'),
      why: 'Essa palavra é portuguesa. Tente dizer a ideia em inglês — se travar, use "How do you say ... in English?".',
      warn: true,
    });
  }
  return out;
}

export const RULES = [
  // ---------------------------------------------------------------- to be ---
  {
    id: 'age-have',
    cat: CAT.VERB,
    sev: 3,
    re: rx(`\\b(${SUBJ})\\s+(have|has)\\s+(\\d{1,3})\\s+years?(\\s+old)?\\b`),
    fix: (m) => `${m[1]} ${beOf(m[1])} ${m[3]} years old`,
    why: 'Idade em inglês usa o verbo "to be", não "have".',
    ex: 'I am 34 years old.',
  },
  {
    id: 'be-sensation',
    cat: CAT.VERB,
    sev: 3,
    re: rx(`\\b(${SUBJ})\\s+(have|has)\\s+(hungry|thirsty|cold|hot|sleepy|afraid|scared|lucky|right|wrong|sure|busy)\\b`),
    fix: (m) => `${m[1]} ${beOf(m[1])} ${m[3]}`,
    why: '"Estar com fome/frio/sono..." em inglês é com "to be": I am hungry.',
    ex: 'I am cold and hungry.',
  },
  {
    id: 'be-agree',
    cat: CAT.VERB,
    sev: 3,
    re: rx(`\\b(${SUBJ})\\s+(?:am|is|are|'m|'s|'re)\\s+agree\\b`),
    fix: (m) => `${m[1]} agree`,
    why: '"Agree" já é verbo: I agree (não "I am agree").',
    ex: 'I agree with you.',
  },
  {
    id: 'be-job-article',
    cat: CAT.ART,
    sev: 2,
    re: rx(`\\b(am|is|are|'m|'s|'re)\\s+(engineer|teacher|doctor|student|lawyer|nurse|designer|developer|programmer|manager|driver|dentist|journalist|architect|waiter|seller|accountant)\\b`),
    fix: (m) => `${m[1]} ${articleFor(m[2])} ${m[2]}`,
    why: 'Profissões no singular pedem artigo: "I am an engineer".',
    ex: 'She is a teacher.',
  },
  {
    id: 'missing-it-subject',
    cat: CAT.VERB,
    sev: 2,
    re: rx('(^|[.!?]\\s+|,\\s+)(is|was)\\s+(raining|snowing|cold|hot|difficult|easy|important|possible|necessary|late|early)\\b'),
    fix: (m) => `${m[1]}${matchCase(m[2], `it ${m[2].toLowerCase()}`)} ${m[3]}`,
    why: 'Inglês não deixa o sujeito oculto: use "It is ...".',
    ex: "It's raining.",
  },
  {
    id: 'existential-have',
    cat: CAT.VERB,
    sev: 3,
    re: rx('(^|[.!?]\\s+|,\\s+)(have|has)\\s+(a lot of|many|much|some|two|three|four|five|several)\\b'),
    fix: (m) => `${m[1]}${matchCase(m[2], 'there are')} ${m[3]}`,
    why: 'O "tem" de existência é "there is / there are", não "have".',
    ex: 'There are many people here.',
  },
  {
    id: 'people-is',
    cat: CAT.AGREE,
    sev: 2,
    re: rx('\\b(people|they|we|you)\\s+(is|was)\\b'),
    fix: (m) => `${m[1]} ${m[2].toLowerCase() === 'is' ? 'are' : 'were'}`,
    why: '"People" é plural: people are / people were.',
    ex: 'People are friendly here.',
  },
  {
    id: 'there-is-plural',
    cat: CAT.AGREE,
    sev: 2,
    re: rx("\\bthere\\s+(is|'s|was)\\s+(a lot of|many|several|two|three|four|five|some)\\b"),
    fix: (m) => `there ${m[1].toLowerCase() === 'was' ? 'were' : 'are'} ${m[2]}`,
    why: 'Com plural use "there are" / "there were".',
    ex: 'There are a lot of options.',
  },
  {
    id: 'everybody-are',
    cat: CAT.AGREE,
    sev: 2,
    re: rx('\\b(everybody|everyone|somebody|someone|nobody|everything|news)\\s+(are|were)\\b'),
    fix: (m) => `${m[1]} ${m[2].toLowerCase() === 'are' ? 'is' : 'was'}`,
    why: 'Essas palavras são tratadas como singular em inglês.',
    ex: 'Everybody is here.',
  },

  // ------------------------------------------------------- 3ª pessoa -s ---
  {
    id: 'third-person-s',
    cat: CAT.AGREE,
    sev: 3,
    re: rx(`\\b(he|she|it|my \\w+|the \\w+)\\s+(${VERB_BASE})\\b(?!\\s+(?:ing|to be))`),
    fix: (m) => {
      // "The kids play" / "My parents live": sujeito plural não leva -s.
      const nucleo = m[1].split(/\s+/).pop().toLowerCase();
      const pluralIrregular = ['people', 'children', 'men', 'women', 'friends', 'parents', 'kids'];
      const singularComS = ['bus', 'class', 'business', 'boss', 'address', 'news', 'process', 'this'];
      if (pluralIrregular.includes(nucleo)) return m[0];
      if (/s$/.test(nucleo) && !singularComS.includes(nucleo)) return m[0];
      return `${m[1]} ${third(m[2])}`;
    },
    why: 'Com he/she/it o verbo no presente termina em -s.',
    ex: 'He works in São Paulo.',
  },
  {
    id: 'third-person-dont',
    cat: CAT.AGREE,
    sev: 3,
    re: rx("\\b(he|she|it)\\s+(don't|do not)\\b"),
    fix: (m) => `${m[1]} ${m[2].includes("'") ? "doesn't" : 'does not'}`,
    why: 'He/she/it usa "doesn\'t".',
    ex: "She doesn't like coffee.",
  },
  {
    id: 'doesnt-plus-s',
    cat: CAT.AGREE,
    sev: 2,
    re: rx(`\\b(doesn't|does not|don't|do not|didn't|did not)\\s+(${VERB_ANY_TENSE})\\b`),
    fix: (m) => {
      const base = baseForm(m[2]);
      return base === m[2].toLowerCase() ? m[0] : `${m[1]} ${base}`;
    },
    why: 'Depois de don\'t / doesn\'t / didn\'t o verbo volta à forma base (sem -s e sem passado).',
    ex: "He doesn't work on Sundays.",
  },
  {
    id: 'did-plus-past',
    cat: CAT.TENSE,
    sev: 3,
    re: rx(`\\b(did)\\s+(${SUBJ})\\s+(${VERB_PAST})\\b`),
    fix: (m) => `${m[1]} ${m[2]} ${baseForm(m[3])}`,
    why: '"Did" já marca o passado: o verbo depois dele fica na forma base.',
    ex: 'Did you see my message?',
  },
  {
    id: 'overregularized-past',
    cat: CAT.TENSE,
    sev: 3,
    re: rx(`\\b(${Object.keys(OVERREGULARIZED).sort((a, b) => b.length - a.length).join('|')})\\b`),
    fix: (m) => matchCase(m[0], OVERREGULARIZED[m[0].toLowerCase()]),
    why: 'Esse verbo é irregular: o passado não leva -ed.',
    ex: 'buy → bought, eat → ate, go → went.',
  },
  {
    id: 'if-would',
    cat: CAT.TENSE,
    sev: 3,
    re: rx(`\\bif\\s+(${SUBJ})\\s+would\\s+(${VERB_BASE}|have|be)\\b`),
    fix: (m) => `if ${m[1]} ${past(baseForm(m[2]))}`,
    why: 'Depois de "if" vai o passado, nunca "would": If I had time, I would travel.',
    ex: 'If I had more time, I would study every day.',
  },
  {
    id: 'when-will',
    cat: CAT.TENSE,
    sev: 2,
    re: rx(`((?:know|knows|knew|tell|tells|told|ask|asks|asked|wonder|wonders|wondered|said|says)\\s+(?:[a-z']+\\s+){0,3})?\\b(when|as soon as|until|before|after|while)\\s+(${SUBJ})\\s+will\\s+(${VERB_BASE}|be|have|get)\\b`),
    fix: (m) => {
      // "I don't know when he will arrive" está certo: ali "when" abre uma
      // pergunta indireta, não uma frase de tempo.
      if (m[1]) return m[0];
      const verbo = /^(he|she|it)$/i.test(m[3]) ? third(m[4]) : m[4];
      return `${m[2]} ${m[3]} ${verbo}`;
    },
    why: 'Depois de when / as soon as / until / before / after não se usa "will": o verbo fica no presente.',
    ex: 'I will call you when I arrive.',
  },
  {
    id: 'negative-no-aux',
    cat: CAT.VERB,
    sev: 3,
    re: rx(`\\b(I|you|we|they)\\s+(?:no|not)\\s+(${VERB_BASE})\\b`),
    fix: (m) => `${m[1]} don't ${m[2]}`,
    why: 'A negativa do presente precisa do auxiliar: "I don\'t like".',
    ex: "I don't understand.",
  },
  {
    id: 'negative-no-aux-3rd',
    cat: CAT.VERB,
    sev: 3,
    re: rx(`\\b(he|she|it)\\s+(?:no|not)\\s+(${VERB_BASE})\\b`),
    fix: (m) => `${m[1]} doesn't ${m[2]}`,
    why: 'A negativa com he/she/it é "doesn\'t + verbo base".',
    ex: "He doesn't work here.",
  },
  {
    id: 'be-plus-base-verb',
    cat: CAT.VERB,
    sev: 3,
    re: rx(`\\b(I|you|we|they|he|she)\\s+(am|is|are|was|were|'m|'s|'re)\\s+(go|work|study|eat|drink|play|watch|read|write|speak|talk|learn|travel|wait|run|walk|sleep|cook|drive|try|look|listen|practice|train)\\b`),
    fix: (m) => `${m[1]} ${m[2]} ${gerund(m[3])}`,
    why: 'Depois de am/is/are o verbo vai no -ing (I am studying). Se for rotina, tire o "am": I study English every day.',
    ex: "I'm studying now. / I study every day.",
  },
  {
    id: 'want-plus-verb',
    cat: CAT.VERB,
    sev: 3,
    // Só verbos que não são substantivos comuns em inglês: "I need help" é
    // uma frase correta (help = ajuda) e não pode virar "I need to help".
    re: rx('\\b(want|wants|wanted|need|needs|needed|decide|decides|decided|hope|hopes|hoped|forget|forgets|promise|promises|refuse|refuses|learn|learns|learned|try|tries|tried|plan|plans|planned|agree|agrees|agreed|expect|expects|expected|prefer|prefers|preferred|offer|offers|offered|manage|manages|managed)'
      + '\\s+(go|speak|talk|learn|study|understand|improve|practice|travel|eat|drink|buy|sell|write|read|leave|arrive|become|sleep|listen|explain|remember|continue|finish|start|stop|meet|know|live|stay|wake)\\b'),
    fix: (m) => `${m[1]} to ${m[2]}`,
    why: 'Esses verbos pedem "to" antes do próximo verbo: want to work, need to go, try to speak.',
    ex: 'I want to work abroad.',
  },
  {
    id: 'modal-plus-to',
    cat: CAT.VERB,
    sev: 2,
    re: rx(`\\b(can|could|should|must|will|would|may|might|let's)\\s+to\\s+(${VERB_BASE})\\b`),
    fix: (m) => `${m[1]} ${m[2]}`,
    why: 'Depois de can/should/must/will não se usa "to".',
    ex: 'I can help you.',
  },
  {
    id: 'want-that',
    cat: CAT.ORDER,
    sev: 2,
    re: rx(`\\b(want|wants|need|needs|would like)\\s+that\\s+(${SUBJ})\\s+(${VERB_BASE})\\b`),
    fix: (m) => `${m[1]} ${m[2].toLowerCase() === 'i' ? 'me' : { you: 'you', we: 'us', they: 'them', he: 'him', she: 'her', it: 'it' }[m[2].toLowerCase()]} to ${m[3]}`,
    why: 'Inglês não usa "want that ...": use "want + pessoa + to + verbo".',
    ex: 'I want you to come with me.',
  },
  {
    id: 'for-purpose',
    cat: CAT.PREP,
    sev: 2,
    re: rx(`\\bfor\\s+(${VERB_BASE})\\b(?=\\s|[.,!?]|$)`),
    fix: (m) => `to ${m[1]}`,
    why: 'Finalidade ("para fazer algo") é "to + verbo" ou "for + verbo-ing".',
    ex: 'I came here to study English.',
  },

  // -------------------------------------------------------- tempo verbal ---
  {
    id: 'past-marker-before',
    cat: CAT.TENSE,
    sev: 3,
    re: rx(`\\b(${TIME_PAST})\\s*,?\\s+(${SUBJ})\\s+(${VERB_ANY})\\b`),
    fix: (m) => `${m[1]} ${m[2]} ${past(baseForm(m[3]))}`,
    why: 'Marcador de passado (yesterday, last week, ... ago) pede verbo no passado.',
    ex: 'Yesterday I went to the gym.',
  },
  {
    id: 'past-marker-after',
    cat: CAT.TENSE,
    sev: 3,
    re: rx(`(\\b(?:can|could|will|would|should|must|may|might|to|please)\\s+)?\\b(${SUBJ})\\s+((?:can|could|will|would|should|must|may|might|to)\\s+)?(${VERB_ANY})\\s+((?:[a-z']+\\s+){0,4}?)(${TIME_PAST})\\b`),
    fix: (m) => {
      // "Could you send the numbers for last month?" não é passado: o marcador
      // de tempo pertence ao substantivo, não ao verbo.
      if (m[1] || m[3] || /\b(for|of|from|until|since)\s+$/i.test(m[5])) return m[0];
      return `${m[2]} ${past(baseForm(m[4]))} ${m[5]}${m[6]}`;
    },
    why: 'Com yesterday / last week / ... ago o verbo vai para o passado.',
    ex: 'I watched a movie last night.',
  },
  {
    id: 'since-present',
    cat: CAT.TENSE,
    sev: 3,
    re: rx(`\\b(I|you|we|they|he|she)\\s+(live|lives|work|works|study|studies|know|knows|have|has)\\s+(?!been\\b|had\\b|gone\\b|lived\\b|worked\\b|studied\\b|known\\b|[a-z]+ed\\b)((?:[a-z']+\\s+){0,3}?)(since|for)\\s+(\\d|a |two|three|four|five|many|\\w+day|\\w+ ?\\d{4})`),
    fix: (m) => {
      const aux = /^(he|she|it)$/i.test(m[1]) ? 'has' : 'have';
      return `${m[1]} ${aux} ${participle(baseForm(m[2]))} ${m[3]}${m[4]} ${m[5]}`;
    },
    why: 'Ação que começou no passado e continua: present perfect ("have/has + particípio") com since/for.',
    ex: 'I have lived here for three years.',
  },
  {
    id: 'perfect-past-marker',
    cat: CAT.TENSE,
    sev: 2,
    re: rx(`\\b(have|has)\\s+(\\w+ed|been|gone|done|seen|eaten|made|written|taken)\\s+((?:[a-z']+\\s+){0,3}?)(yesterday|last (?:night|week|month|year))\\b`),
    why: 'Present perfect não combina com tempo passado definido (yesterday, last week). Use o passado simples.',
    warn: true,
  },

  // ---------------------------------------------------------- preposições ---
  {
    id: 'listen-to',
    cat: CAT.PREP,
    sev: 2,
    re: rx('\\b(listen|listens|listened|listening)\\s+(?!to\\b)(music|the radio|a song|songs|podcasts?|me|him|her|them|you)\\b'),
    fix: (m) => `${m[1]} to ${m[2]}`,
    why: '"Listen" sempre pede "to": listen to music.',
    ex: 'I listen to music every day.',
  },
  {
    id: 'depend-on',
    cat: CAT.PREP,
    sev: 2,
    re: rx('\\b(depend|depends|depended)\\s+(of|from)\\b'),
    fix: (m) => `${m[1]} on`,
    why: '"Depend" pede "on".',
    ex: 'It depends on the weather.',
  },
  {
    id: 'married-to',
    cat: CAT.PREP,
    sev: 2,
    re: rx('\\bmarried\\s+with\\b'),
    fix: () => 'married to',
    why: 'Casado "com" alguém em inglês é "married to".',
    ex: "He's married to Ana.",
  },
  {
    id: 'discuss-about',
    cat: CAT.PREP,
    sev: 2,
    re: rx('\\b(discuss|discussed|discussing|discusses)\\s+about\\b'),
    fix: (m) => m[1],
    why: '"Discuss" não leva "about": discuss the project.',
    ex: 'We discussed the plan.',
  },
  {
    id: 'enter-in',
    cat: CAT.PREP,
    sev: 2,
    re: rx('\\b(enter|entered|enters)\\s+(in|in the)\\b'),
    fix: (m) => `${m[1]}${m[2] === 'in the' ? ' the' : ''}`,
    why: '"Enter" já significa "entrar em".',
    ex: 'He entered the room.',
  },
  {
    id: 'arrive-to',
    cat: CAT.PREP,
    sev: 2,
    re: rx('\\b(arrive|arrived|arrives|arriving)\\s+(to|in)\\s+(the\\s+)?(office|airport|station|school|work|hotel|party|restaurant|gym)\\b'),
    fix: (m) => `${m[1]} at ${m[3] || 'the '}${m[4]}`,
    why: 'Chegar a um lugar específico é "arrive at" (cidades/países: arrive in).',
    ex: 'I arrived at the office at 9.',
  },
  {
    id: 'go-to-home',
    cat: CAT.PREP,
    sev: 2,
    re: rx('\\b(go|goes|going|went|come|comes|came)\\s+to\\s+home\\b'),
    fix: (m) => `${m[1]} home`,
    why: '"Home" não leva "to": go home.',
    ex: 'I want to go home.',
  },
  {
    id: 'in-home',
    cat: CAT.PREP,
    sev: 2,
    re: rx('\\bin\\s+home\\b'),
    fix: () => 'at home',
    why: '"Em casa" é "at home".',
    ex: "I'm working at home today.",
  },
  {
    id: 'in-weekday',
    cat: CAT.PREP,
    sev: 2,
    re: rx('\\bin\\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday|my birthday|the weekend)\\b'),
    fix: (m) => {
      const diaDaSemana = /^(monday|tuesday|wednesday|thursday|friday|saturday|sunday)$/i.test(m[1]);
      return `on ${diaDaSemana ? m[1].charAt(0).toUpperCase() + m[1].slice(1) : m[1]}`;
    },
    why: 'Dias da semana usam "on": on Monday, on the weekend.',
    ex: 'See you on Friday.',
  },
  {
    id: 'in-internet',
    cat: CAT.PREP,
    sev: 2,
    re: rx('\\bin\\s+the\\s+(internet|phone|bus|train|plane|radio|first floor)\\b'),
    fix: (m) => `on the ${m[1]}`,
    why: 'Esses lugares/meios usam "on": on the internet, on the bus, on the phone.',
    ex: 'I saw it on the internet.',
  },
  {
    id: 'in-night',
    cat: CAT.PREP,
    sev: 2,
    re: rx('\\bin\\s+the\\s+night\\b'),
    fix: () => 'at night',
    why: '"À noite" é "at night" (mas in the morning / in the afternoon / in the evening).',
    ex: 'I study at night.',
  },
  {
    id: 'at-morning',
    cat: CAT.PREP,
    sev: 2,
    re: rx('\\bat\\s+the\\s+(morning|afternoon|evening)\\b'),
    fix: (m) => `in the ${m[1]}`,
    why: 'Períodos do dia usam "in the": in the morning.',
    ex: 'I run in the morning.',
  },
  {
    id: 'in-last-next',
    cat: CAT.PREP,
    sev: 2,
    re: rx('\\bin\\s+(?:the\\s+)?(last|next)\\s+(week|month|year|weekend)\\b'),
    fix: (m) => `${m[1]} ${m[2]}`,
    why: 'Com last/next não se usa preposição nem artigo: "last week", "next year".',
    ex: 'I traveled last month.',
  },
  {
    id: 'good-in',
    cat: CAT.PREP,
    sev: 2,
    re: rx('\\b(good|bad|great|terrible)\\s+(in|on)\\s+(?=\\w)'),
    fix: (m) => `${m[1]} at `,
    why: 'Ser bom/ruim em algo é "good at / bad at".',
    ex: "I'm good at math.",
  },
  {
    id: 'interested-in',
    cat: CAT.PREP,
    sev: 2,
    re: rx('\\binterested\\s+(on|for|about)\\b'),
    fix: () => 'interested in',
    why: '"Interested" pede "in".',
    ex: "I'm interested in history.",
  },
  {
    id: 'responsible-for',
    cat: CAT.PREP,
    sev: 2,
    re: rx('\\bresponsible\\s+(of|by)\\b'),
    fix: () => 'responsible for',
    why: '"Responsible" pede "for".',
    ex: "I'm responsible for the reports.",
  },
  {
    id: 'worried-about',
    cat: CAT.PREP,
    sev: 2,
    re: rx('\\bworried\\s+(for|with)\\b'),
    fix: () => 'worried about',
    why: '"Worried" pede "about".',
    ex: "I'm worried about the test.",
  },
  {
    id: 'think-about',
    cat: CAT.PREP,
    sev: 2,
    re: rx('\\b(think|thinking|thought|thinks)\\s+(in|on)\\s+(?!time\\b)(?=\\w)'),
    fix: (m) => `${m[1]} about `,
    why: 'Pensar em algo é "think about" (ou "think of").',
    ex: "I'm thinking about my trip.",
  },
  {
    id: 'wait-for',
    cat: CAT.PREP,
    sev: 2,
    re: rx('\\b(wait|waiting|waited|waits)\\s+(?!for\\b|a moment|a minute|until\\b)(me|you|him|her|them|us|the bus|the train|my friend)\\b'),
    fix: (m) => `${m[1]} for ${m[2]}`,
    why: '"Wait" pede "for": wait for me.',
    ex: 'Wait for me, please.',
  },
  {
    id: 'answer-to',
    cat: CAT.PREP,
    sev: 1,
    re: rx('\\b(answer|answered|answers)\\s+to\\s+(the|my|your|his|her|this)\\b'),
    fix: (m) => `${m[1]} ${m[2]}`,
    why: '"Answer" não leva "to" antes do objeto: answer the question.',
    ex: 'Please answer the email.',
  },
  {
    id: 'explain-me-object',
    cat: CAT.PREP,
    sev: 2,
    re: rx('\\b(explain|explained|explains)\\s+(me|us|him|her|them)\\s+([^.?!,]{1,40}?)(?=\\s*[.?!,]|$)'),
    fix: (m) => `${m[1]} ${m[3].trim()} to ${m[2]}`,
    why: 'A ordem é "explain + coisa + to + pessoa".',
    ex: 'Can you explain this to me?',
  },
  {
    id: 'explain-me',
    cat: CAT.PREP,
    sev: 2,
    re: rx('\\b(explain|explained|explains)\\s+(me|us|him|her|them)\\b'),
    fix: (m) => `${m[1]} to ${m[2]}`,
    why: '"Explain" precisa de "to": explain to me.',
    ex: 'Can you explain this to me?',
  },
  {
    id: 'tell-to-me',
    cat: CAT.PREP,
    sev: 2,
    re: rx('\\b(tell|tells|told)\\s+to\\s+(me|us|him|her|them|you)\\b'),
    fix: (m) => `${m[1]} ${m[2]}`,
    why: '"Tell" vai direto na pessoa: tell me.',
    ex: 'Tell me more about it.',
  },
  {
    id: 'say-me',
    cat: CAT.VOCAB,
    sev: 2,
    re: rx('\\b(say|says|said)\\s+(me|us|him|her|them)\\b'),
    fix: (m) => `${m[1] === 'say' ? 'tell' : m[1] === 'says' ? 'tells' : 'told'} ${m[2]}`,
    why: 'Com pessoa use "tell": tell me. "Say" vai sem pessoa ou com "to me".',
    ex: 'He told me the truth.',
  },

  // ----------------------------------------------------------- vocabulário ---
  {
    id: 'make-question',
    cat: CAT.VOCAB,
    sev: 2,
    re: rx('\\b(make|makes|made|do|does|did)\\s+(a|one|some)?\\s*questions?\\b'),
    fix: (m) => `${keepTense('ask', m[1])} ${m[2] || 'a'} question${/s$/.test(m[0]) ? 's' : ''}`,
    why: 'Fazer uma pergunta = "ask a question".',
    ex: 'Can I ask a question?',
  },
  {
    id: 'do-mistake',
    cat: CAT.VOCAB,
    sev: 2,
    re: rx('\\b(do|does|did|doing)\\s+(a|some|many|any)?\\s*mistakes?\\b'),
    fix: (m) => `${keepTense('make', m[1])} ${m[2] ? `${m[2]} ` : ''}mistake${/s\b/.test(m[0]) ? 's' : ''}`,
    why: 'Errar é "make a mistake".',
    ex: 'I made a mistake.',
  },
  {
    id: 'take-decision',
    cat: CAT.VOCAB,
    sev: 2,
    re: rx('\\b(take|takes|took|taking)\\s+(a|the|this)?\\s*decisions?\\b'),
    fix: (m) => `${keepTense('make', m[1])} ${m[2] || 'a'} decision`,
    why: 'Tomar uma decisão = "make a decision".',
    ex: 'We need to make a decision.',
  },
  {
    id: 'do-party',
    cat: CAT.VOCAB,
    sev: 2,
    re: rx('\\b(do|does|did|make|makes|made)\\s+a\\s+(party|meeting|barbecue)\\b'),
    fix: (m) => `${keepTense('have', m[1])} a ${m[2]}`,
    why: 'Fazer uma festa/reunião = "have a party / have a meeting".',
    ex: "Let's have a party!",
  },
  {
    id: 'make-travel',
    cat: CAT.VOCAB,
    sev: 2,
    re: rx('\\b(make|made|do|did)\\s+a\\s+(travel|trip)\\b'),
    fix: (m) => `${keepTense('make', m[1]) === 'made' ? 'took' : 'take'} a trip`,
    why: 'Fazer uma viagem = "take a trip" ("travel" é verbo, não substantivo contável).',
    ex: 'We took a trip to Chile.',
  },
  {
    id: 'a-travel',
    cat: CAT.VOCAB,
    sev: 2,
    re: rx('\\b(a|my|the)\\s+travel\\b'),
    fix: (m) => `${m[1]} trip`,
    why: 'Como substantivo use "trip": "my trip was great".',
    ex: 'My trip was amazing.',
  },
  {
    id: 'win-money',
    cat: CAT.VOCAB,
    sev: 2,
    re: rx('\\b(win|wins|won|winning)\\s+(money|a salary|good)\\b'),
    fix: (m) => `earn ${m[2]}`,
    why: 'Ganhar dinheiro trabalhando = "earn money" ("win" é ganhar jogo/prêmio).',
    ex: 'She earns good money.',
  },
  {
    id: 'borrow-me',
    cat: CAT.VOCAB,
    sev: 2,
    re: rx('\\b(borrow)\\s+(me|us|him|her|them)\\b'),
    fix: (m) => `lend ${m[2]}`,
    why: '"Lend" = emprestar para alguém; "borrow" = pegar emprestado.',
    ex: 'Can you lend me your pen?',
  },
  {
    id: 'learn-me',
    cat: CAT.VOCAB,
    sev: 2,
    re: rx('\\b(learn|learns|learned)\\s+(me|us|him|her|them)\\b'),
    fix: (m) => `teach ${m[2]}`,
    why: '"Teach" = ensinar; "learn" = aprender.',
    ex: 'She teaches me English.',
  },
  {
    id: 'have-doubt',
    cat: CAT.VOCAB,
    sev: 2,
    re: rx('\\b(have|has|had)\\s+(a|one|some)?\\s*doubts?\\b'),
    fix: (m) => `${m[1]} ${m[2] || 'a'} question`,
    why: 'Ter uma dúvida = "have a question". "Doubt" é desconfiança.',
    ex: 'I have a question about the meeting.',
  },
  {
    id: 'with-doubt',
    cat: CAT.VOCAB,
    sev: 2,
    re: rx('\\b(am|is|are|'
      + "'m|'s|'re)\\s+with\\s+(doubt|doubts|a doubt)\\b"),
    fix: (m) => `${m[1] === 'am' || m[1] === "'m" ? 'have' : 'have'} a question`,
    why: 'Diga "I have a question".',
    ex: 'I have a question.',
  },
  {
    id: 'what-means',
    cat: CAT.ORDER,
    sev: 2,
    re: rx('\\bwhat\\s+means\\s+([^?.!,]{1,40}?)(?=\\s*[?.!,]|$)'),
    fix: (m) => `what does ${m[1].trim()} mean`,
    why: 'Pergunta em inglês precisa do auxiliar: "What does X mean?".',
    ex: 'What does "rely" mean?',
  },
  {
    id: 'do-you-can',
    cat: CAT.ORDER,
    sev: 2,
    re: rx('\\b(do|does|did)\\s+(you|he|she|we|they|I)\\s+(can|could|should|must|would)\\b'),
    fix: (m) => `${m[3]} ${m[2]}`,
    why: 'Modais fazem pergunta sozinhos: "Can you...?".',
    ex: 'Can you help me?',
  },
  {
    id: 'how-i-can',
    cat: CAT.ORDER,
    sev: 2,
    re: rx('\\b(how|what|where|when|why)\\s+(I|you|we|they|he|she)\\s+(can|should|could|must)\\b'),
    fix: (m) => `${m[1]} ${m[3]} ${m[2]}`,
    why: 'Em perguntas, o modal vem antes do sujeito: "How can I...?".',
    ex: 'How can I improve my English?',
  },
  {
    id: 'how-much-time',
    cat: CAT.VOCAB,
    sev: 2,
    re: rx('\\bhow\\s+much\\s+time\\s+(do|does|did|are|is|have|has)\\b'),
    fix: (m) => `how long ${m[1]}`,
    why: '"Quanto tempo" em perguntas é "how long".',
    ex: 'How long have you studied English?',
  },
  {
    id: 'much-countable',
    cat: CAT.AGREE,
    sev: 2,
    re: rx('\\bmuch\\s+(people|friends|things|words|books|hours|days|years|places|options|ideas)\\b'),
    fix: (m) => `many ${m[1]}`,
    why: 'Contáveis usam "many"; incontáveis usam "much".',
    ex: 'Many people speak English.',
  },
  {
    id: 'many-uncountable',
    cat: CAT.AGREE,
    sev: 2,
    re: rx('\\bmany\\s+(time|money|water|information|advice|work|homework|traffic|coffee)\\b'),
    fix: (m) => `much ${m[1]}`,
    why: 'Incontáveis usam "much" (ou "a lot of").',
    ex: "I don't have much time.",
  },
  {
    id: 'double-negative',
    cat: CAT.VERB,
    sev: 2,
    re: rx("\\b(don't|doesn't|didn't|can't|won't|isn't|aren't|never)\\s+((?:[a-z']+\\s+){0,2}?)(nothing|nobody|nowhere|no one|none)\\b"),
    fix: (m) => `${m[1]} ${m[2]}${{ nothing: 'anything', nobody: 'anybody', nowhere: 'anywhere', 'no one': 'anyone', none: 'any' }[m[3].toLowerCase()]}`,
    why: 'Inglês não aceita dupla negativa: "I don\'t know anything".',
    ex: "I don't know anything about it.",
  },
  {
    id: 'the-possessive',
    cat: CAT.ART,
    sev: 2,
    re: rx('\\bthe\\s+(my|your|his|her|our|their|its)\\b'),
    fix: (m) => m[1],
    why: 'Não se usa artigo antes de possessivo: "my house" (não "the my house").',
    ex: 'My house is small.',
  },
  {
    id: 'an-other',
    cat: CAT.SPELL,
    sev: 1,
    re: rx('\\ban\\s+other\\b'),
    fix: () => 'another',
    why: 'Escreve-se junto: "another".',
    ex: 'Can I have another coffee?',
  },
  {
    id: 'article-a-an',
    cat: CAT.ART,
    sev: 2,
    re: rx('\\b(a|an)\\s+([a-z]+)\\b'),
    fix: (m) => {
      const correct = articleFor(m[2]);
      return correct === m[1].toLowerCase() ? m[0] : `${matchCase(m[1], correct)} ${m[2]}`;
    },
    why: 'Use "an" antes de som de vogal e "a" antes de som de consoante.',
    ex: 'an apple / a university / an hour',
  },
  {
    id: 'every-days',
    cat: CAT.PLURAL,
    sev: 2,
    re: rx('\\bevery\\s+(days|weeks|months|years|mornings|nights|times)\\b'),
    fix: (m) => `every ${m[1].slice(0, -1)}`,
    why: 'Depois de "every" o substantivo fica no singular.',
    ex: 'I study every day.',
  },
  {
    id: 'me-and',
    cat: CAT.ORDER,
    sev: 1,
    re: rx('(^|[.!?]\\s+)me\\s+and\\s+(my|the)\\s+(\\w+)'),
    fix: (m) => `${m[1]}${m[2]} ${m[3]} and I`,
    why: 'Como sujeito, diga "My friend and I" (não "Me and my friend").',
    ex: 'My brother and I work together.',
  },
  {
    id: 'very-verb',
    cat: CAT.ORDER,
    sev: 1,
    re: rx('\\b(I|you|we|they|he|she)\\s+very\\s+(like|likes|love|loves|want|wants|miss|misses)\\b'),
    fix: (m) => `${m[1]} really ${m[2]}`,
    why: '"Very" não modifica verbo. Use "really" ou "a lot" no fim.',
    ex: 'I really like this song. / I like it a lot.',
  },
  {
    id: 'very-much-adj',
    cat: CAT.STYLE,
    sev: 1,
    re: rx('\\bvery\\s+much\\s+(\\w+)\\b'),
    fix: (m) => `very ${m[1]}`,
    why: 'Antes de adjetivo use só "very".',
    ex: 'It was very good.',
  },
  {
    id: 'more-comparative',
    cat: CAT.COMP,
    sev: 2,
    re: rx('\\bmore\\s+(good|bad|big|small|easy|hard|cheap|fast|slow|happy|sad|old|young|tall|short|strong|nice|simple|busy|early|late|clear|smart|clean|warm|cold|rich|poor|close|quick|safe|light|dark|loud)\\b'),
    fix: (m) => comparative(m[1]),
    why: 'Adjetivos curtos fazem comparativo com -er (sem "more").',
    ex: 'This one is cheaper.',
  },
  {
    id: 'most-superlative',
    cat: CAT.COMP,
    sev: 2,
    re: rx('\\bthe\\s+most\\s+(good|bad|big|small|easy|hard|cheap|fast|slow|happy|old|young|tall|short|strong|nice|simple|busy|early|late|smart|clean|warm|cold|rich|poor|close|quick|safe)\\b'),
    fix: (m) => `the ${comparative(m[1], true)}`,
    why: 'Adjetivos curtos fazem superlativo com -est.',
    ex: "It's the biggest city in Brazil.",
  },
  {
    id: 'more-better',
    cat: CAT.COMP,
    sev: 2,
    re: rx('\\bmore\\s+(better|worse|bigger|easier|faster|cheaper|older|happier)\\b'),
    fix: (m) => m[1],
    why: 'Não use "more" junto do comparativo com -er.',
    ex: 'This is better.',
  },
  {
    id: 'feeling-ing',
    cat: CAT.VOCAB,
    sev: 1,
    re: rx('\\b(I|we|you|they|he|she)\\s+(am|is|are|was|were|'
      + "'m|'s|'re)\\s+(boring|interesting|confusing|exciting|tiring|surprising|worrying|frustrating)\\b"),
    why: 'Para sentimento use -ed: "I am bored" (estou entediado). Com -ing você descreve a coisa ("the movie is boring").',
    warn: true,
  },
  {
    id: 'advice-verb',
    cat: CAT.VOCAB,
    sev: 2,
    re: rx('\\b(I|we|you|they)\\s+advice\\b'),
    fix: (m) => `${m[1]} advise`,
    why: '"Advise" é o verbo; "advice" é o substantivo.',
    ex: 'I advise you to rest. / Thanks for the advice.',
  },

  // --------------------------------------------------------- capitalização ---
  {
    id: 'lowercase-i',
    cat: CAT.SPELL,
    sev: 1,
    re: rx("\\bi\\b(?=\\s|'|[.,!?]|$)", 'g'),
    fix: () => 'I',
    why: 'O pronome "I" é sempre maiúsculo.',
    ex: 'I think so.',
  },
  {
    id: 'proper-noun-case',
    cat: CAT.SPELL,
    sev: 1,
    re: rx('\\b(english|portuguese|spanish|french|german|italian|japanese|brazil|brazilian|canada|mexico|argentina|france|germany|italy|japan|china|india|europe|london|paris|monday|tuesday|wednesday|thursday|friday|saturday|sunday|january|february|march|april|june|july|august|september|october|november|december|christmas)\\b', 'g'),
    fix: (m) => m[1].charAt(0).toUpperCase() + m[1].slice(1),
    why: 'Idiomas, países, dias da semana e meses são maiúsculos em inglês.',
    ex: 'I study English on Monday.',
  },

  ...mapRules(),
];

export const RULES_BY_ID = Object.fromEntries(RULES.map((r) => [r.id, r]));
