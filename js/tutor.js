// Parceiro de conversa do app: roda inteiro dentro do aparelho, de graça.
//
// Não é um modelo de linguagem — é um motor de diálogo que reconhece o assunto
// pelo que você escreve, reage, dá opinião, faz uma pergunta nova e lembra do
// que você já contou. O objetivo é te manter falando em inglês.

import { pick, words, shuffle } from './utils.js';

// --------------------------------------------------------------- reações ---
const POSITIVE = ['good', 'great', 'nice', 'love', 'like', 'happy', 'fun', 'awesome', 'amazing', 'cool', 'best', 'excited', 'perfect', 'beautiful', 'better'];
const NEGATIVE = ['bad', 'tired', 'hard', 'difficult', 'stress', 'stressed', 'busy', 'sad', 'sick', 'problem', 'worse', 'worst', 'boring', 'angry', 'late', 'expensive'];

const REACT_POSITIVE = [
  "That's awesome.", 'Love that.', 'Nice, good for you.', "That's great to hear.",
  'Sounds like a win.', 'Oh, that sounds fun.',
];
const REACT_NEGATIVE = [
  'Oh man, sorry to hear that.', 'Yeah, that sounds rough.', 'Ugh, I get that.',
  "That's tough.", 'Hope it gets better soon.',
];
const REACT_NEUTRAL = [
  'Got it.', 'Okay, nice.', 'Yeah?', 'Makes sense.', 'Oh, interesting.',
  'Huh, okay.', 'Right on.', 'Fair enough.', 'I hear you.',
];

const NUDGE_SHORT = [
  'Give me a little more than that — full sentence.',
  'Come on, one more detail.',
  "Don't stop there. Tell me more.",
];

// --------------------------------------------------------------- assuntos ---
// keys: palavras que ativam o assunto · mine: opinião do parceiro · asks: perguntas
export const TOPICS = {
  work: {
    keys: ['work', 'working', 'worked', 'job', 'office', 'boss', 'deadline', 'report', 'email', 'meeting', 'company', 'client', 'project', 'colleague', 'team', 'career', 'salary'],
    mine: ["I've had jobs I loved and jobs I couldn't wait to leave.", 'Work is work, right?'],
    asks: ['What exactly do you do there?', 'How long have you been doing that?', "What's the hardest part of your job?", 'Do you like the people you work with?', 'Would you change jobs if you could?', 'How do you switch off after work?'],
  },
  english: {
    keys: ['english', 'study', 'studying', 'learn', 'learning', 'class', 'teacher', 'practice', 'speak', 'grammar', 'vocabulary'],
    mine: ['Honestly, your English is better than my Portuguese.', 'Learning a language is a grind, but it pays off.'],
    asks: ['How long have you been studying English?', "What's the hardest part for you — speaking or listening?", 'Where do you want your English to be in a year?', 'Do you get to use English at work?', 'What made you start again?'],
  },
  family: {
    keys: ['family', 'wife', 'husband', 'son', 'daughter', 'kid', 'kids', 'child', 'children', 'mother', 'father', 'mom', 'dad', 'brother', 'sister', 'parents', 'grandma', 'grandpa'],
    mine: ['Family stuff is everything, honestly.', 'I call my parents every Sunday, no matter what.'],
    asks: ['How many people are in your family?', 'What do you guys usually do together?', 'Who are you closest to?', 'Do they live near you?', "What's a family tradition you have?"],
  },
  food: {
    keys: ['food', 'eat', 'eating', 'ate', 'dinner', 'lunch', 'breakfast', 'cook', 'cooking', 'restaurant', 'pizza', 'coffee', 'barbecue', 'meat', 'rice', 'beans', 'cake'],
    mine: ["I'm a terrible cook, so I eat out way too much.", 'I could eat Brazilian barbecue every week.'],
    asks: ['Do you cook, or do you eat out?', "What's your favorite thing to eat?", "What's the best meal you've had recently?", 'Is there anything you absolutely will not eat?', 'Who cooks at your house?'],
  },
  music: {
    keys: ['music', 'song', 'songs', 'band', 'singer', 'album', 'guitar', 'listen', 'concert', 'rock', 'samba', 'sertanejo'],
    mine: ["I'm stuck listening to the same three albums lately.", 'Live shows hit different, man.'],
    asks: ['What kind of music do you listen to?', 'Who is your favorite artist?', "What's the last concert you went to?", 'Do you play any instrument?', 'What do you listen to while working?'],
  },
  movies: {
    keys: ['movie', 'movies', 'film', 'series', 'netflix', 'show', 'watch', 'watched', 'watching', 'tv', 'actor', 'comedy', 'drama', 'horror', 'action', 'documentary', 'episode', 'season', 'cinema'],
    mine: ['I always fall asleep halfway through movies at home.', 'I need a new series, mine just ended.'],
    asks: ['What did you watch recently?', 'Movies or series?', "What's a movie you can watch over and over?", 'Do you watch with subtitles in English?', 'Any recommendation for me?'],
  },
  sports: {
    keys: ['soccer', 'football', 'game', 'match', 'team', 'play', 'played', 'gym', 'run', 'running', 'training', 'basketball', 'volleyball', 'workout', 'gol'],
    mine: ["I'm trying to get into soccer, honestly.", 'I go to the gym mostly so I can eat whatever I want.'],
    asks: ['Do you play, or just watch?', "What's your team?", 'Did you watch any games this weekend?', 'How often do you train?', 'Were you into sports as a kid?'],
  },
  travel: {
    keys: ['travel', 'trip', 'beach', 'vacation', 'holiday', 'hotel', 'flight', 'airport', 'visit', 'visited', 'city', 'country', 'abroad'],
    mine: ["I've never been to Brazil, but it's on my list.", 'I always overpack, every single trip.'],
    asks: ['Where was your last trip?', 'Where would you go if money was not a problem?', 'Beach or mountains?', 'Do you travel for work?', "What's the best place you've been to?"],
  },
  weekend: {
    keys: ['weekend', 'saturday', 'sunday', 'friday', 'holiday', 'rest', 'relax', 'party', 'friends', 'barbecue', 'beer', 'bar'],
    mine: ['My weekends disappear way too fast.', 'I try to keep Sundays completely free.'],
    asks: ['What did you do last weekend?', 'Any plans for the next one?', 'Do you prefer going out or staying home?', 'Who do you usually hang out with?'],
  },
  weather: {
    keys: ['weather', 'rain', 'raining', 'hot', 'cold', 'sun', 'sunny', 'snow', 'summer', 'winter', 'heat'],
    mine: ["It's freezing here in Denver right now.", 'I miss warm weather so much.'],
    asks: ["How's the weather over there?", 'Do you like the heat?', "What's your favorite season?", 'Does the weather change your plans a lot?'],
  },
  pets: {
    keys: ['dog', 'cat', 'pet', 'puppy', 'animal', 'dogs', 'cats'],
    mine: ['I have a dog who thinks he owns the house.', "I'm a dog person, no question."],
    asks: ["What's your pet's name?", 'How long have you had it?', 'Dogs or cats?', 'Who takes care of it?'],
  },
  home: {
    keys: ['house', 'home', 'apartment', 'live', 'living', 'moved', 'neighborhood', 'room'],
    mine: ['I moved three times in five years. Never again.', 'My place is small but I like it.'],
    asks: ['How long have you lived there?', 'What do you like about your neighborhood?', 'Would you move to another city?', 'House or apartment?'],
  },
  tech: {
    keys: ['computer', 'phone', 'app', 'apps', 'internet', 'software', 'code', 'programming', 'ai', 'technology', 'game', 'games', 'gaming', 'playstation', 'xbox'],
    mine: ['I spend way too much time on my phone at night.', 'I still cannot set up a printer without crying.'],
    asks: ['What do you use the most, phone or computer?', 'Do you play any games?', 'Any app you use every day?', 'Do you think technology helps you study?'],
  },
  money: {
    keys: ['money', 'price', 'expensive', 'cheap', 'buy', 'bought', 'pay', 'paid', 'cost', 'shopping', 'save'],
    mine: ['Everything is expensive here too, trust me.', "I'm trying to save, and failing."],
    asks: ['Are you saving up for something?', "What's something you think is worth paying more for?", 'Do you shop online or in stores?'],
  },
  health: {
    keys: ['sleep', 'slept', 'tired', 'sick', 'doctor', 'health', 'headache', 'stress', 'gym', 'water', 'diet'],
    mine: ['I never sleep enough, and I always regret it.', 'I keep telling myself I will drink more water.'],
    asks: ['How many hours do you sleep?', 'Are you a morning person?', 'What do you do to relax?', 'Have you been feeling okay lately?'],
  },
  future: {
    keys: ['plan', 'plans', 'future', 'want', 'dream', 'goal', 'next year', 'someday', 'hope'],
    mine: ['I make plans and then change them every two weeks.', 'I like having something to look forward to.'],
    asks: ["What's something you want to do this year?", 'Where do you see yourself in five years?', "What's one thing you'd love to learn?", 'Any big plans coming up?'],
  },
  childhood: {
    keys: ['child', 'childhood', 'young', 'school', 'used to', 'kid', 'grew up', 'teenager'],
    mine: ['I was outside all day as a kid. No phones.', 'School was not my favorite time, honestly.'],
    asks: ['What did you love doing as a kid?', 'Where did you grow up?', 'What were you like in school?', 'What do you miss about being a kid?'],
  },
  city: {
    keys: ['brazil', 'city', 'traffic', 'bus', 'car', 'drive', 'driving', 'street', 'downtown', 'people'],
    mine: ['Traffic here makes me want to move to the woods.', 'I love a city you can walk around in.'],
    asks: ['What is your city like?', 'How do you get around?', 'Is traffic bad there?', "What's the best thing about where you live?"],
  },
};

const GENERIC_ASKS = [
  "So what's been going on with you lately?",
  'Tell me something good that happened this week.',
  'What did you do today?',
  "What's on your mind right now?",
  'If tomorrow was free, what would you do?',
  'What are you looking forward to?',
  'Tell me something most people do not know about you.',
  'What would you do with an extra hour every day?',
];

// Frases naturais para oferecer conforme a categoria do erro cometido.
const PHRASEBOOK = {
  'tempo verbal': ['Yesterday I went to…', 'Last week I worked on…', "I've been doing that for two years."],
  'concordância': ['He works downtown.', "She doesn't like it either.", 'My wife studies at night.'],
  preposição: ['I listen to music every day.', 'It depends on the weather.', "I'm good at fixing things."],
  vocabulário: ['I made a mistake.', 'Can I ask you a question?', 'We had a barbecue.'],
  verbo: ["I don't know yet.", "It's raining here.", "I'm 34 years old."],
  artigo: ["I'm an engineer.", 'It took an hour.', 'She is a teacher.'],
  plural: ['I need some information.', 'He gave me good advice.', 'There are many people here.'],
  comparativo: ['This one is cheaper.', "It's the biggest city around.", 'That sounds better.'],
  'ordem das palavras': ['What does that mean?', 'How can I help?', 'Where did you go?'],
  'português no meio': ['How do you say that in English?', "I don't know the word for it.", 'Let me try again in English.'],
};

function sentiment(text) {
  const bag = words(text);
  const good = bag.filter((w) => POSITIVE.includes(w)).length;
  const bad = bag.filter((w) => NEGATIVE.includes(w)).length;
  if (bad > good) return 'negative';
  if (good > bad) return 'positive';
  return 'neutral';
}

/** Palavras do aluno + radicais, para "worked" casar com "work". */
function stems(text) {
  const bag = new Set();
  for (const w of words(text)) {
    bag.add(w);
    if (w.endsWith('ing') && w.length > 5) bag.add(w.slice(0, -3));
    if (w.endsWith('ed') && w.length > 4) { bag.add(w.slice(0, -2)); bag.add(w.slice(0, -1)); }
    if (w.endsWith('s') && w.length > 3) bag.add(w.slice(0, -1));
  }
  return bag;
}

function detectTopic(text) {
  const bag = stems(text);
  let best = null;
  let bestScore = 0;
  for (const [id, topic] of Object.entries(TOPICS)) {
    const score = topic.keys.filter((k) => bag.has(k)).length;
    if (score > bestScore) { best = id; bestScore = score; }
  }
  return bestScore ? best : null;
}

/**
 * Cria um parceiro de conversa com memória da sessão.
 * @param {{level?: string}} opts
 */
export function createPartner({ level = 'A2' } = {}) {
  const usedAsks = new Set();
  const mentioned = [];        // assuntos que ele já trouxe
  const usedMine = new Set();
  let currentTopic = null;
  let turns = 0;
  let lastCallback = -99;
  const usedTips = new Set();

  function nextAsk(topicId) {
    const inedita = (pool) => shuffle(pool).find((q) => !usedAsks.has(q));
    // Assunto atual → perguntas gerais → qualquer outro assunto. Só depois de
    // esgotar tudo (são ~90 perguntas) a conversa recomeça o ciclo.
    const escolhida = (topicId && inedita(TOPICS[topicId].asks))
      || inedita(GENERIC_ASKS)
      || inedita(Object.values(TOPICS).flatMap((t) => t.asks))
      || (usedAsks.clear(), pick(GENERIC_ASKS));
    usedAsks.add(escolhida);
    return escolhida;
  }

  function maybeOpinion(topicId) {
    if (!topicId || turns < 2) return '';
    const frases = TOPICS[topicId].mine.filter((f) => !usedMine.has(f));
    if (!frases.length || Math.random() > 0.45) return '';
    const escolhida = pick(frases);
    usedMine.add(escolhida);
    return `${escolhida} `;
  }

  function callback() {
    // Retomar um assunto antigo é bom de vez em quando — não a cada frase.
    const antigos = mentioned.slice(0, -1).filter((t) => t !== currentTopic);
    if (!antigos.length || turns < 5 || turns - lastCallback < 5 || Math.random() > 0.35) return null;
    lastCallback = turns;
    const topicId = pick(antigos);
    currentTopic = topicId;
    const ask = nextAsk(topicId);
    return `By the way, back to what you said earlier — ${ask.charAt(0).toLowerCase()}${ask.slice(1)}`;
  }

  function phraseTip(result) {
    if (!result || !result.issues.length || turns % 3 !== 0) return '';
    const grave = result.issues.find((i) => !i.warn && i.sev >= 2);
    if (!grave) return '';
    const frases = (PHRASEBOOK[grave.cat] || []).filter((f) => !usedTips.has(f));
    if (!frases.length) return '';
    const frase = pick(frases);
    usedTips.add(frase);
    return `Uma frase pronta pra guardar: "${frase}"`;
  }

  return {
    /** Primeira fala da conversa. */
    open(topic) {
      turns = 0;
      currentTopic = topic?.id || null;
      if (currentTopic && TOPICS[currentTopic]) usedAsks.add(topic.opener);
      return {
        reply: topic?.opener || "Hey Guilherme! Good to see you. How's your day going?",
        hintPt: level === 'A1'
          ? 'Responda com uma frase completa — nem que seja simples.'
          : 'Se travar numa palavra, pergunte: "How do you say ... in English?".',
      };
    },

    /** Resposta à fala do aluno. */
    respond(userText, result) {
      turns += 1;
      const count = words(userText).length;

      if (count > 0 && count < 3) {
        return {
          reply: `${pick(REACT_NEUTRAL)} ${pick(NUDGE_SHORT)}`,
          hintPt: 'Frases de uma palavra não treinam nada. Tente 6 ou mais.',
        };
      }

      const topicId = detectTopic(userText);
      if (topicId) {
        currentTopic = topicId;
        if (!mentioned.includes(topicId)) mentioned.push(topicId);
      }

      const reacao = {
        positive: pick(REACT_POSITIVE),
        negative: pick(REACT_NEGATIVE),
        neutral: pick(REACT_NEUTRAL),
      }[sentiment(userText)];

      const volta = callback();
      const pergunta = volta || `${maybeOpinion(currentTopic)}${nextAsk(currentTopic)}`;

      return {
        reply: `${reacao} ${pergunta}`,
        hintPt: phraseTip(result),
      };
    },
  };
}

/** Conversa com roteiro (os cenários da lista). */
export function createScripted(scenario) {
  let index = 0;
  return {
    open() {
      index = 0;
      const first = scenario.turns[0];
      return { reply: first.ask, hintPt: first.hintPt, model: first.model };
    },
    respond(userText) {
      const turn = scenario.turns[index];
      const lower = userText.toLowerCase();
      const reacao = Object.entries(turn?.expect || {})
        .find(([key]) => lower.includes(key))?.[1] || pick(REACT_NEUTRAL);
      index += 1;
      const next = scenario.turns[index];
      if (!next) {
        return {
          reply: `${reacao} That's the end of this one — you handled it well. Want to pick another?`,
          hintPt: 'Cenário concluído. Escolha outro no seletor ou volte para a conversa livre.',
          done: true,
        };
      }
      return { reply: `${reacao} ${next.ask}`, hintPt: next.hintPt, model: next.model };
    },
  };
}
