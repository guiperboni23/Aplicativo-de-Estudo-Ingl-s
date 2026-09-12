// Conteúdo de estudo: cenários de conversa, frases de pronúncia,
// ditados, temas de escrita e exercícios de correção.

export const SCENARIOS = [
  {
    id: 'warmup',
    title: 'Aquecimento diário',
    emoji: '☀️',
    level: 'A1',
    goal: 'Falar de você, sua rotina e seus planos.',
    turns: [
      {
        ask: "Good morning, Guilherme! How are you today?",
        hintPt: 'Diga como você está e por quê.',
        model: "I'm doing well, thanks. I'm a little tired because I woke up early.",
        expect: { good: "Glad to hear that!", tired: "I know the feeling.", fine: 'Nice.' },
      },
      {
        ask: 'What did you do yesterday?',
        hintPt: 'Use o passado: worked, studied, watched, went...',
        model: 'I worked until six and then I studied English for thirty minutes.',
        expect: { work: 'Busy day, then.', study: 'That’s great discipline.', gym: 'Nice, staying active.' },
      },
      {
        ask: 'What are you going to do today?',
        hintPt: 'Fale de planos: "I\'m going to..." / "I will...".',
        model: "I'm going to finish a project and cook dinner with my family.",
        expect: { work: 'Sounds like a productive day.', study: 'Consistency pays off.' },
      },
      {
        ask: 'Tell me one thing you want to get better at in English.',
        hintPt: 'Ex.: speaking, listening, pronunciation, vocabulary.',
        model: 'I want to get better at speaking without translating in my head.',
        expect: { speak: 'Speaking improves fastest with practice like this.', listen: 'Try podcasts with transcripts.' },
      },
    ],
  },
  {
    id: 'coffee',
    title: 'No café',
    emoji: '☕',
    level: 'A1',
    goal: 'Pedir algo, perguntar preço e agradecer.',
    turns: [
      { ask: "Hi! Welcome to Blue Bottle. What can I get you?", hintPt: 'Peça uma bebida: "I\'d like...".', model: "I'd like a medium latte, please.", expect: { coffee: 'Great choice.', latte: 'Coming right up.', tea: 'Good pick, very fresh today.' } },
      { ask: 'Anything to eat with that?', hintPt: 'Aceite ou recuse: "Yes, please..." / "No, thanks".', model: 'Yes, please. A croissant would be great.', expect: { no: 'No problem.', yes: 'Sure thing.' } },
      { ask: "That's six fifty. Is it for here or to go?", hintPt: '"For here, please" ou "To go, please".', model: 'To go, please. Can I pay by card?', expect: { here: 'Perfect, I\'ll bring it to your table.', go: 'I\'ll get that ready.', card: 'Card is fine.' } },
      { ask: 'Have a great day! Anything else before you go?', hintPt: 'Agradeça e se despeça.', model: "No, that's all. Thank you very much!", expect: { thank: 'You\'re welcome!', no: 'Enjoy your coffee!' } },
    ],
  },
  {
    id: 'smalltalk',
    title: 'Small talk no trabalho',
    emoji: '💬',
    level: 'A2',
    goal: 'Conversa leve com colegas.',
    turns: [
      { ask: 'Hey! Long weekend, huh? Did you do anything fun?', hintPt: 'Conte uma coisa que você fez.', model: 'Yes! I went to the beach with my family on Sunday.', expect: { beach: 'Nice, the weather was perfect.', home: 'Sometimes resting at home is the best plan.', family: 'Family time is always good.' } },
      { ask: 'Nice. How is your project going?', hintPt: 'Fale do andamento: "It\'s going well / We\'re behind schedule".', model: "It's going well. We're finishing the first version this week.", expect: { well: 'Good to hear.', difficult: 'Anything I can help with?', late: 'That happens. Do you need support?' } },
      { ask: 'Do you have any plans for the holidays?', hintPt: 'Planos futuros.', model: "I'm thinking about traveling to the coast for a few days.", expect: { travel: 'That sounds relaxing.', work: 'Try to rest a little too.' } },
      { ask: 'By the way, do you want to grab lunch later?', hintPt: 'Aceite, recuse ou sugira um horário.', model: 'Sure, how about one o\'clock?', expect: { sure: 'Great, see you then.', busy: 'No worries, another day.' } },
    ],
  },
  {
    id: 'interview',
    title: 'Entrevista de emprego',
    emoji: '💼',
    level: 'B1',
    goal: 'Apresentar experiência e responder perguntas clássicas.',
    turns: [
      { ask: "Thanks for joining us. Could you tell me a bit about yourself?", hintPt: 'Nome, área, tempo de experiência.', model: "Sure. I'm Guilherme. I've been working in technology for six years, mostly on web projects.", expect: { year: 'Solid experience.', work: 'Thanks for the overview.' } },
      { ask: 'What are you looking for in your next role?', hintPt: 'Fale de objetivos, não só de salário.', model: "I'm looking for a role where I can grow technically and work with an international team.", expect: { grow: 'We value that a lot here.', team: 'Collaboration is important for us too.' } },
      { ask: 'Tell me about a difficult problem you solved recently.', hintPt: 'Situação → ação → resultado.', model: 'We had a performance issue in production. I found a slow query, fixed the index, and the response time dropped by half.', expect: { problem: 'Good structure in your answer.', fix: 'Nice, results matter.' } },
      { ask: 'What is your biggest weakness?', hintPt: 'Seja honesto e diga o que você faz sobre isso.', model: "I used to avoid speaking English in meetings, so now I practice every day to be more confident.", expect: { english: 'And you are practicing right now — that counts.', time: 'Self-awareness is a good sign.' } },
      { ask: 'Do you have any questions for us?', hintPt: 'Pergunte algo sobre a equipe ou o produto.', model: 'Yes — how is the team organized, and what does success look like in the first six months?', expect: { team: 'Great question.', question: 'Happy to answer that.' } },
    ],
  },
  {
    id: 'travel',
    title: 'Aeroporto e hotel',
    emoji: '✈️',
    level: 'A2',
    goal: 'Resolver situações de viagem.',
    turns: [
      { ask: 'Good evening. May I see your passport, please? What is the purpose of your trip?', hintPt: '"Business" ou "tourism", e quanto tempo fica.', model: "Here it is. I'm here for tourism, for ten days.", expect: { tourism: 'Enjoy your stay.', business: 'Have a productive trip.' } },
      { ask: 'Where are you staying?', hintPt: 'Nome do hotel / endereço.', model: "I'm staying at a hotel downtown, near the central station.", expect: { hotel: 'Thank you.', friend: 'Noted, thank you.' } },
      { ask: 'Welcome to the hotel. Do you have a reservation?', hintPt: 'Confirme a reserva e o nome.', model: 'Yes, I have a reservation under Perazzoli, for three nights.', expect: { yes: 'Let me check that for you.', night: 'Perfect.' } },
      { ask: 'Your room is on the fourth floor. Do you need anything else?', hintPt: 'Peça algo: wi-fi, café da manhã, toalhas.', model: 'Could you tell me the wi-fi password and what time breakfast starts?', expect: { wifi: 'I\'ll write it down for you.', breakfast: 'Breakfast is from seven to ten.' } },
    ],
  },
  {
    id: 'restaurant',
    title: 'Restaurante',
    emoji: '🍽️',
    level: 'A1',
    goal: 'Pedir comida e pagar a conta.',
    turns: [
      { ask: 'Good evening! A table for how many?', hintPt: 'Diga quantas pessoas.', model: 'A table for two, please.', expect: { two: 'Right this way.', one: 'Of course, follow me.' } },
      { ask: 'Here is the menu. Can I get you something to drink first?', hintPt: 'Peça uma bebida.', model: 'Just water for now, please.', expect: { water: 'Sparkling or still?', beer: 'Good choice.', wine: 'Excellent.' } },
      { ask: 'Are you ready to order?', hintPt: '"I\'ll have..." / "I\'d like..."', model: "I'll have the grilled chicken with rice and a salad.", expect: { chicken: 'Great choice.', fish: 'That is our specialty.', vegetarian: 'We have good options for that.' } },
      { ask: 'How was everything? Can I bring you the bill?', hintPt: 'Elogie a comida e peça a conta.', model: 'Everything was delicious, thank you. Yes, the bill, please.', expect: { good: 'Glad you liked it.', bill: 'I\'ll be right back with it.' } },
    ],
  },
  {
    id: 'meeting',
    title: 'Reunião em inglês',
    emoji: '🧑‍💻',
    level: 'B1',
    goal: 'Dar updates, discordar com educação, combinar próximos passos.',
    turns: [
      { ask: "Let's start with a quick update. What did you work on this week?", hintPt: 'Use passado e present perfect.', model: "This week I finished the login screen and I've started the reports page.", expect: { finish: 'Great progress.', start: 'Thanks for the update.' } },
      { ask: 'Any blockers we should know about?', hintPt: 'Fale de impedimentos.', model: "Yes, I'm waiting for the API documentation to continue.", expect: { wait: 'I\'ll follow up on that today.', no: 'Good, smooth week then.' } },
      { ask: 'I think we should release on Friday. What do you think?', hintPt: 'Concorde ou discorde com educação: "I see your point, but...".', model: "I see your point, but I'd rather test for one more day and release on Monday.", expect: { agree: 'Alright, Friday it is.', but: 'That is fair. Let\'s discuss the risk.', monday: 'Let me check with the team.' } },
      { ask: 'Perfect. Can you summarize the next steps?', hintPt: 'Liste 2 ou 3 próximos passos.', model: "Sure. I'll finish the tests, send the report tomorrow, and we decide the release date on Thursday.", expect: { test: 'Sounds like a plan.', send: 'Thanks, talk soon.' } },
    ],
  },
  {
    id: 'doctor',
    title: 'No médico / farmácia',
    emoji: '🩺',
    level: 'A2',
    goal: 'Explicar sintomas e entender orientações.',
    turns: [
      { ask: 'Hello, what brings you in today?', hintPt: 'Diga o sintoma: "I have a headache / a sore throat".', model: "I have a bad headache and a sore throat since yesterday.", expect: { headache: 'How long has it been hurting?', throat: 'Let me take a look.', fever: 'Did you measure your temperature?' } },
      { ask: 'Are you taking any medication?', hintPt: '"I take..." / "No, I\'m not taking anything".', model: "No, I'm not taking any medication right now.", expect: { no: 'Good to know.', yes: 'Which one, and how often?' } },
      { ask: 'Any allergies?', hintPt: '"I\'m allergic to..." / "No allergies".', model: "I'm allergic to penicillin.", expect: { allerg: 'I\'ll note that in your file.', no: 'Perfect.' } },
      { ask: 'Take this twice a day after meals. Do you have any questions?', hintPt: 'Pergunte sobre dose ou duração.', model: 'How many days should I take it, and can I drink coffee?', expect: { day: 'For five days.', coffee: 'Coffee is fine, just drink water too.' } },
    ],
  },
];

export const PRONUNCIATION = {
  A1: [
    'I would like a cup of coffee, please.',
    'My name is Guilherme and I live in Brazil.',
    'What time does the meeting start?',
    'She works in a hospital downtown.',
    'I usually wake up at six thirty.',
    'This is the third time I try it.',
    'Thank you for your help today.',
  ],
  A2: [
    'I have been studying English for three months.',
    'Could you repeat that a little more slowly, please?',
    'The weather was really cold last weekend.',
    'I think that thirty thousand is enough.',
    'We should have left earlier this morning.',
    'He asked me whether I wanted to join the call.',
  ],
  B1: [
    'Although it was raining, we decided to walk to the restaurant.',
    'I would rather work from home three days a week.',
    'The team is responsible for testing and releasing the product.',
    'She suggested rescheduling the meeting to Thursday afternoon.',
    'Their thoughts were clearly worth considering.',
  ],
  B2: [
    'If I had known about the deadline, I would have prepared differently.',
    'The report highlights three significant risks that require attention.',
    'We are gradually shifting our focus towards long-term growth.',
  ],
};

export const DICTATION = {
  A1: [
    'I work in an office near my house.',
    'She does not like cold weather.',
    'They are going to travel next month.',
    'How much does this shirt cost?',
    'My brother and I play soccer on Sundays.',
  ],
  A2: [
    'I have lived in this city since two thousand nineteen.',
    'We were waiting for the bus when it started to rain.',
    'He has already finished his homework.',
    'You should drink more water during the day.',
  ],
  B1: [
    'If I have time tomorrow, I will review the whole document.',
    'The manager asked us to send the report by Friday morning.',
    'She has been working on that project for almost a year.',
  ],
  B2: [
    'Had we known the risks, we would have postponed the launch.',
    'The proposal was rejected because it lacked financial details.',
  ],
};

export const WRITING_PROMPTS = {
  A1: [
    'Escreva 3 frases sobre a sua rotina de manhã.',
    'Descreva a sua casa em 3 frases.',
    'Fale sobre a sua família: quem são e o que fazem.',
    'O que você gosta e não gosta de comer? Escreva 3 frases.',
  ],
  A2: [
    'Conte o que você fez no último fim de semana (use o passado).',
    'Descreva o seu trabalho e uma tarefa que você faz todos os dias.',
    'Escreva sobre uma viagem que você fez: onde, com quem, o que fez.',
    'Compare morar em uma cidade grande e em uma cidade pequena.',
  ],
  B1: [
    'Explique por que você está estudando inglês e qual é a sua meta para 6 meses.',
    'Escreva um e-mail curto pedindo para remarcar uma reunião.',
    'Conte um problema que você resolveu no trabalho: situação, ação e resultado.',
    'Você concorda que trabalhar de casa é melhor? Justifique.',
  ],
  B2: [
    'Escreva um parágrafo argumentando a favor ou contra inteligência artificial no trabalho.',
    'Descreva uma decisão difícil que você tomou e o que aprendeu com ela.',
  ],
};

// Exercícios de "conserte a frase" usados quando ainda não há erros seus salvos.
export const FIX_IT = [
  { wrong: 'I have 30 years old.', right: 'I am 30 years old.', why: 'Idade usa o verbo "to be".' },
  { wrong: 'He dont like pizza.', right: "He doesn't like pizza.", why: 'He/she/it usa "doesn\'t".' },
  { wrong: 'Yesterday I go to the mall.', right: 'Yesterday I went to the mall.', why: '"Yesterday" pede passado.' },
  { wrong: 'I am agree with you.', right: 'I agree with you.', why: '"Agree" já é verbo.' },
  { wrong: 'She work in a bank.', right: 'She works in a bank.', why: '3ª pessoa recebe -s.' },
  { wrong: 'I need informations about the course.', right: 'I need information about the course.', why: '"Information" é incontável.' },
  { wrong: 'We discussed about the project.', right: 'We discussed the project.', why: '"Discuss" não leva "about".' },
  { wrong: 'I live here since 2019.', right: 'I have lived here since 2019.', why: 'Since/for pede present perfect.' },
  { wrong: 'Can you explain me this?', right: 'Can you explain this to me?', why: '"Explain" pede "to".' },
  { wrong: 'There is many people here.', right: 'There are many people here.', why: 'Plural usa "there are".' },
  { wrong: 'I am boring in this class.', right: 'I am bored in this class.', why: '-ed = como você se sente; -ing = como a coisa é.' },
  { wrong: 'What means this word?', right: 'What does this word mean?', why: 'Perguntas precisam do auxiliar "does".' },
  { wrong: 'I have a doubt about the exercise.', right: 'I have a question about the exercise.', why: '"Doubt" é desconfiança, não dúvida escolar.' },
  { wrong: 'He is married with a doctor.', right: 'He is married to a doctor.', why: '"Married to".' },
  { wrong: 'I go to home after work.', right: 'I go home after work.', why: '"Home" não leva "to".' },
  { wrong: 'This exercise is more easy.', right: 'This exercise is easier.', why: 'Adjetivo curto: -er.' },
  { wrong: 'My mother make a cake every Sunday.', right: 'My mother makes a cake every Sunday.', why: 'Sujeito singular: verbo com -s.' },
  { wrong: 'I didn\'t went to the party.', right: "I didn't go to the party.", why: 'Depois de "didn\'t" o verbo fica na base.' },
];

const ORDER = ['A1', 'A2', 'B1', 'B2'];

/** Conteúdo do nível pedido, com fallback para o nível anterior. */
export function forLevel(bank, level) {
  const idx = Math.max(0, ORDER.indexOf(level));
  for (let i = idx; i >= 0; i--) {
    if (bank[ORDER[i]]?.length) return bank[ORDER[i]];
  }
  return bank.A1 || [];
}

export function scenariosForLevel(level) {
  const idx = Math.max(0, ORDER.indexOf(level));
  const allowed = ORDER.slice(0, idx + 1);
  const unlocked = SCENARIOS.filter((s) => allowed.includes(s.level));
  return unlocked.length ? unlocked : SCENARIOS.filter((s) => s.level === 'A1');
}
