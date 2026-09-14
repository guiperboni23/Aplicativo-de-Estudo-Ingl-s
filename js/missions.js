// As 50 fases do mapa. Cada fase tem itens curtos e um foco só.
//
// tipos de item:
//   falar     { ask, hint, model }   você responde falando
//   escrever  { ask, hint, model }   você responde escrevendo
//   pronuncia 'frase'                você lê a frase em voz alta
//   ditado    'frase'                você ouve e escreve
//   corrigir  { wrong, right, why }  você conserta a frase
//
// O tipo da fase vale para todos os itens; as fases-chefe misturam tipos
// usando `kind` em cada item.

export const TYPE_META = {
  falar: { icon: '🎤', label: 'Falar', verb: 'Responda falando' },
  escrever: { icon: '✍️', label: 'Escrever', verb: 'Responda escrevendo' },
  pronuncia: { icon: '🗣️', label: 'Pronúncia', verb: 'Leia em voz alta' },
  ditado: { icon: '🎧', label: 'Ditado', verb: 'Ouça e escreva' },
  corrigir: { icon: '🔧', label: 'Consertar', verb: 'Conserte a frase' },
  boss: { icon: '👑', label: 'Chefe', verb: 'Missão final do mundo' },
};

export const WORLDS = [
  { id: 1, name: 'Primeiros passos', sub: 'Você, sua família, o verbo to be', from: 1, to: 10 },
  { id: 2, name: 'Dia a dia', sub: 'Rotina, perguntas e pedidos', from: 11, to: 20 },
  { id: 3, name: 'O passado', sub: 'Ontem, semana passada, histórias', from: 21, to: 30 },
  { id: 4, name: 'Conversas reais', sub: 'Trabalho, viagem, present perfect', from: 31, to: 40 },
  { id: 5, name: 'Opinião e carreira', sub: 'Reunião, entrevista, condicional', from: 41, to: 50 },
];

const m = (id, world, type, title, focus, items) => ({ id, world, type, title, focus, items });

export const MISSIONS = [
  // ------------------------------------------- Mundo 1 — Primeiros passos ---
  m(1, 1, 'falar', 'Quem é você', 'Dizer nome, cidade e idade', [
    { ask: "Hi! What's your name?", hint: 'Comece com "My name is...".', model: 'My name is Guilherme.' },
    { ask: 'Where are you from?', hint: '"I am from..." + cidade.', model: "I'm from Curitiba, in Brazil." },
    { ask: 'How old are you?', hint: 'Idade usa o verbo TO BE.', model: "I'm thirty-four years old." },
  ]),
  m(2, 1, 'pronuncia', 'Sons do olá', 'Cumprimentos básicos', [
    'Good morning! How are you today?',
    'Nice to meet you.',
    'See you tomorrow, have a good night.',
  ]),
  m(3, 1, 'escrever', 'Sobre mim', 'Frases simples com to be', [
    { ask: 'Escreva quem você é e o que você faz.', hint: '"I am a..." + profissão.', model: 'I am a systems analyst and I live in Brazil.' },
    { ask: 'Escreva onde você mora e com quem.', hint: '"I live in..." / "I live with...".', model: 'I live in a small apartment with my wife.' },
    { ask: 'Escreva uma coisa que você gosta.', hint: '"I like..." + substantivo ou verbo-ing.', model: 'I like watching movies at night.' },
  ]),
  m(4, 1, 'corrigir', 'O verbo TO BE', 'Idade, sensações e "I agree"', [
    { wrong: 'I have 30 years.', right: 'I am 30 years old.', why: 'Idade em inglês usa TO BE.' },
    { wrong: 'I am agree with you.', right: 'I agree with you.', why: '"Agree" já é o verbo.' },
    { wrong: 'I have hungry.', right: 'I am hungry.', why: 'Estar com fome/frio/sono = TO BE.' },
  ]),
  m(5, 1, 'falar', 'Minha família', 'Falar de pessoas próximas', [
    { ask: 'Do you have any brothers or sisters?', hint: '"I have..." ou "I am an only child".', model: 'Yes, I have one brother and one sister.' },
    { ask: 'What does your family do on weekends?', hint: 'Use o presente: "We usually...".', model: 'We usually have lunch together on Sundays.' },
    { ask: 'Who are you closest to in your family?', hint: '"I am closest to my...".', model: "I'm closest to my mother. We talk every day." },
  ]),
  m(6, 1, 'ditado', 'Ouvir e escrever', 'Frases curtas no presente', [
    'I work in an office near my house.',
    'She does not like cold weather.',
    'They are going to travel next month.',
  ]),
  m(7, 1, 'escrever', 'Minha rotina', 'Presente simples', [
    { ask: 'Escreva o que você faz de manhã.', hint: '"I wake up at..." / "I have breakfast".', model: 'I wake up at six thirty and have coffee before work.' },
    { ask: 'Escreva o que você faz depois do trabalho.', hint: 'Use "after work, I...".', model: 'After work, I study English for thirty minutes.' },
    { ask: 'Escreva algo que você faz todo dia.', hint: 'Cuidado: "every day", no singular.', model: 'I walk my dog every day.' },
  ]),
  m(8, 1, 'corrigir', 'Ele trabalha, ela estuda', 'O -s da terceira pessoa', [
    { wrong: 'He work in a bank.', right: 'He works in a bank.', why: 'He/she/it: verbo com -s.' },
    { wrong: "She don't like coffee.", right: "She doesn't like coffee.", why: 'He/she/it usa doesn\'t.' },
    { wrong: 'My brother study English.', right: 'My brother studies English.', why: 'Sujeito singular: study → studies.' },
  ]),
  m(9, 1, 'pronuncia', 'Números e horas', 'Sons que travam brasileiro', [
    'The meeting starts at three thirty.',
    'I think thirty thousand is enough.',
    'It costs twelve dollars and fifteen cents.',
  ]),
  m(10, 1, 'boss', 'Chefe: sua apresentação', 'Tudo do Mundo 1 junto', [
    { kind: 'falar', ask: "Let's start. Tell me about yourself in three sentences.", hint: 'Nome, trabalho, onde mora.', model: "I'm Guilherme. I work with technology and I live in Brazil." },
    { kind: 'corrigir', wrong: 'I have 34 years and I am engineer.', right: 'I am 34 years old and I am an engineer.', why: 'Idade com TO BE; profissão com artigo.' },
    { kind: 'pronuncia', text: 'My family lives in a small city near the coast.' },
    { kind: 'escrever', ask: 'Escreva 2 frases sobre a sua rotina.', hint: 'Presente simples.', model: 'I start work at nine. I study English every evening.' },
    { kind: 'ditado', text: 'My brother and I play soccer on Sundays.' },
  ]),

  // -------------------------------------------------- Mundo 2 — Dia a dia ---
  m(11, 2, 'falar', 'Perguntas do dia a dia', 'Responder perguntas comuns', [
    { ask: 'What do you usually do on Mondays?', hint: '"I usually..." + rotina.', model: 'I usually have meetings in the morning.' },
    { ask: 'What time do you start work?', hint: 'Horas: "at eight o\'clock".', model: 'I start work at eight thirty.' },
    { ask: 'How do you go to work?', hint: '"I go by car / by bus / on foot".', model: 'I go to work by car, it takes twenty minutes.' },
  ]),
  m(12, 2, 'corrigir', 'Não gosto disso', 'Negativas com auxiliar', [
    { wrong: 'I no like fish.', right: "I don't like fish.", why: 'Negativa precisa de don\'t.' },
    { wrong: "He don't work here.", right: "He doesn't work here.", why: 'He/she/it: doesn\'t.' },
    { wrong: "I don't know nothing.", right: "I don't know anything.", why: 'Inglês não aceita dupla negativa.' },
  ]),
  m(13, 2, 'falar', 'Pedindo no café', 'Pedir e agradecer', [
    { ask: 'Hi! What can I get you?', hint: '"I\'d like..." é mais educado que "I want".', model: "I'd like a medium latte, please." },
    { ask: 'Anything to eat with that?', hint: 'Aceite ou recuse com "please/thanks".', model: 'Yes, please. A croissant would be great.' },
    { ask: "That's six fifty. For here or to go?", hint: '"To go, please."', model: 'To go, please. Can I pay by card?' },
  ]),
  m(14, 2, 'ditado', 'Ditado: rotina', 'Ouvir o -s e os artigos', [
    'He usually takes the bus to work.',
    'We have lunch at twelve thirty.',
    'My sister works in a big hospital.',
  ]),
  m(15, 2, 'corrigir', 'Muito ou muitos', 'Contáveis e incontáveis', [
    { wrong: 'I need informations about the course.', right: 'I need information about the course.', why: '"Information" não tem plural.' },
    { wrong: 'There is many people here.', right: 'There are many people here.', why: 'Plural pede "there are".' },
    { wrong: "I don't have many time today.", right: "I don't have much time today.", why: 'Incontável usa "much".' },
  ]),
  m(16, 2, 'pronuncia', 'O -s no fim', 'Terminações que somem na fala', [
    'She watches two movies every weekend.',
    'He finishes work and goes to the gym.',
    'My friend teaches English and studies at night.',
  ]),
  m(17, 2, 'escrever', 'Sobre o trabalho', 'Descrever o que você faz', [
    { ask: 'Escreva o que você faz no trabalho.', hint: '"I work with..." / "I am responsible for...".', model: 'I work with software and I am responsible for the reports.' },
    { ask: 'Escreva uma coisa difícil do seu trabalho.', hint: '"The hardest part is...".', model: 'The hardest part is talking to clients in English.' },
    { ask: 'Escreva o que você quer aprender este ano.', hint: '"I want to..." — não esqueça o TO.', model: 'I want to speak English in meetings without fear.' },
  ]),
  m(18, 2, 'corrigir', 'Perguntas com auxiliar', 'A ordem das palavras', [
    { wrong: 'What means this word?', right: 'What does this word mean?', why: 'Pergunta precisa do auxiliar does.' },
    { wrong: 'Do you can help me?', right: 'Can you help me?', why: 'Modais perguntam sozinhos.' },
    { wrong: 'How I can improve my English?', right: 'How can I improve my English?', why: 'Modal antes do sujeito.' },
  ]),
  m(19, 2, 'falar', 'No restaurante', 'Pedir comida e a conta', [
    { ask: 'Good evening! A table for how many?', hint: '"A table for two, please."', model: 'A table for two, please.' },
    { ask: 'Are you ready to order?', hint: '"I\'ll have..." + prato.', model: "I'll have the grilled chicken with rice, please." },
    { ask: 'How was everything?', hint: 'Elogie e peça a conta.', model: 'Everything was delicious. Could I have the bill, please?' },
  ]),
  m(20, 2, 'boss', 'Chefe: um dia inteiro', 'Rotina, perguntas e pedidos', [
    { kind: 'falar', ask: 'Tell me about your typical Monday.', hint: 'Use "I usually...".', model: 'I usually wake up early, work until six and study at night.' },
    { kind: 'corrigir', wrong: 'She go to work every days.', right: 'She goes to work every day.', why: '-s na 3ª pessoa; "every day" no singular.' },
    { kind: 'ditado', text: 'They do not work on Saturday mornings.' },
    { kind: 'falar', ask: "You're at a café. Order something and ask the price.", hint: '"I\'d like... How much is it?"', model: "I'd like a black coffee, please. How much is it?" },
    { kind: 'pronuncia', text: 'He usually finishes his work before six thirty.' },
  ]),

  // --------------------------------------------------- Mundo 3 — O passado ---
  m(21, 3, 'falar', 'Ontem eu...', 'Passado simples', [
    { ask: 'What did you do yesterday?', hint: 'Verbo no passado: worked, went, studied.', model: 'I worked until six and then I watched a movie.' },
    { ask: 'What did you eat for dinner?', hint: '"I had..." é o passado de have.', model: 'I had pasta with my family.' },
    { ask: 'Did you sleep well last night?', hint: '"Yes, I did" / "No, I didn\'t".', model: "No, I didn't. I went to bed too late." },
  ]),
  m(22, 3, 'corrigir', 'Verbos irregulares', 'Os passados que não têm -ed', [
    { wrong: 'Yesterday I go to the mall.', right: 'Yesterday I went to the mall.', why: 'go → went.' },
    { wrong: 'She buyed a new car.', right: 'She bought a new car.', why: 'buy → bought.' },
    { wrong: 'We eated at a nice restaurant.', right: 'We ate at a nice restaurant.', why: 'eat → ate.' },
  ]),
  m(23, 3, 'ditado', 'Ditado no passado', 'Ouvir o -ed e os irregulares', [
    'We watched a great movie last night.',
    'He arrived late because of the traffic.',
    'I told her the truth yesterday.',
  ]),
  m(24, 3, 'pronuncia', 'O som do -ed', 'Três sons diferentes', [
    'I worked from home and finished early.',
    'She decided to call him yesterday.',
    'They played outside until it rained.',
  ]),
  m(25, 3, 'escrever', 'Meu fim de semana', 'Contar o que aconteceu', [
    { ask: 'Escreva 2 frases sobre o seu último fim de semana.', hint: 'Tudo no passado.', model: 'I visited my parents on Saturday and we had a barbecue.' },
    { ask: 'Escreva algo bom que aconteceu na semana passada.', hint: '"Last week I...".', model: 'Last week I finished a difficult project at work.' },
    { ask: 'Escreva algo que você não fez e queria ter feito.', hint: '"I didn\'t..." + verbo base.', model: "I didn't go to the gym, but I wanted to." },
  ]),
  m(26, 3, 'corrigir', 'Não fui, não fiz', 'didn\'t + verbo base', [
    { wrong: "I didn't went to the party.", right: "I didn't go to the party.", why: 'Depois de didn\'t o verbo volta à base.' },
    { wrong: 'Did you saw my message?', right: 'Did you see my message?', why: 'Did já marca o passado.' },
    { wrong: "He didn't liked the food.", right: "He didn't like the food.", why: 'didn\'t + like.' },
  ]),
  m(27, 3, 'falar', 'Uma viagem que fiz', 'Narrar uma experiência', [
    { ask: 'Tell me about a trip you took.', hint: 'Onde, com quem, quando.', model: 'Two years ago I took a trip to Chile with my wife.' },
    { ask: 'What did you like the most?', hint: '"The best part was...".', model: 'The best part was the mountains and the food.' },
    { ask: 'Would you go back? Why?', hint: '"I would... because...".', model: "I would go back because there is a lot to see." },
  ]),
  m(28, 3, 'ditado', 'Ditado: história curta', 'Frases mais longas', [
    'When I arrived, the meeting had already started.',
    'She was waiting for the bus when it started to rain.',
    'They finished the project two days before the deadline.',
  ]),
  m(29, 3, 'escrever', 'Quando eu era criança', 'used to / passado contínuo', [
    { ask: 'Escreva o que você gostava de fazer quando era criança.', hint: '"I used to..." + verbo base.', model: 'I used to play soccer in the street with my friends.' },
    { ask: 'Escreva onde você morava.', hint: '"I lived in..." / "We lived...".', model: 'I lived in a small house near my grandmother.' },
    { ask: 'Escreva algo que mudou desde então.', hint: '"Now I..." para comparar.', model: 'Now I live in a big city and I work with computers.' },
  ]),
  m(30, 3, 'boss', 'Chefe: contando o passado', 'Tudo do Mundo 3', [
    { kind: 'falar', ask: 'Tell me everything you did last weekend.', hint: 'Três frases no passado.', model: 'I woke up late, went to the market and cooked dinner for my family.' },
    { kind: 'corrigir', wrong: "Last night I don't watched TV, I go to sleep.", right: "Last night I didn't watch TV, I went to sleep.", why: 'Passado negativo: didn\'t + base; go → went.' },
    { kind: 'ditado', text: 'He called me twice but I did not answer.' },
    { kind: 'pronuncia', text: 'We travelled to the coast and stayed there for a week.' },
    { kind: 'escrever', ask: 'Escreva sobre um dia marcante da sua vida.', hint: 'Passado, 2 ou 3 frases.', model: 'The day my daughter was born, I felt nervous and happy at the same time.' },
  ]),

  // --------------------------------------------- Mundo 4 — Conversas reais ---
  m(31, 4, 'falar', 'Small talk no trabalho', 'Conversa leve com colegas', [
    { ask: 'Hey! How was your weekend?', hint: 'Responda e devolva a pergunta.', model: 'It was great, thanks. I went to the beach. How about yours?' },
    { ask: 'How is your project going?', hint: '"It\'s going well" / "We\'re a bit late".', model: "It's going well. We're finishing the first version this week." },
    { ask: 'Do you want to grab lunch later?', hint: 'Aceite e combine o horário.', model: 'Sure, how about one o\'clock?' },
  ]),
  m(32, 4, 'corrigir', 'Preposições que grudam', 'listen to, depend on, married to', [
    { wrong: 'I listen music every day.', right: 'I listen to music every day.', why: '"Listen" sempre pede TO.' },
    { wrong: 'It depends of the weather.', right: 'It depends on the weather.', why: '"Depend" pede ON.' },
    { wrong: 'He is married with a doctor.', right: 'He is married to a doctor.', why: '"Married to".' },
  ]),
  m(33, 4, 'falar', 'No aeroporto', 'Resolver situações de viagem', [
    { ask: 'What is the purpose of your trip?', hint: '"Tourism" ou "business" + tempo.', model: "I'm here for tourism, for ten days." },
    { ask: 'Where are you staying?', hint: '"I\'m staying at...".', model: "I'm staying at a hotel downtown." },
    { ask: 'Do you have anything to declare?', hint: '"No, I don\'t" é suficiente.', model: "No, I don't have anything to declare." },
  ]),
  m(34, 4, 'ditado', 'Ditado: instruções', 'Entender orientações', [
    'Please send me the report by Friday morning.',
    'Turn left at the corner and walk two blocks.',
    'You should take this medicine twice a day after meals.',
  ]),
  m(35, 4, 'corrigir', 'Desde quando', 'since e for no present perfect', [
    { wrong: 'I live here since 2019.', right: 'I have lived here since 2019.', why: 'Começou no passado e continua: present perfect.' },
    { wrong: 'I work in this company for three years.', right: 'I have worked in this company for three years.', why: 'FOR + duração pede have/has + particípio.' },
    { wrong: 'I have seen him yesterday.', right: 'I saw him yesterday.', why: '"Yesterday" pede passado simples.' },
  ]),
  m(36, 4, 'pronuncia', 'O som do TH', 'think, this, three', [
    'I think this is the third time.',
    'They brought their brother with them.',
    'Thanks for everything you thought about.',
  ]),
  m(37, 4, 'escrever', 'E-mail curto', 'Escrever com objetivo', [
    { ask: 'Escreva um e-mail pedindo para remarcar uma reunião.', hint: '"Could we reschedule...?"', model: 'Hi Ana, could we reschedule our meeting to Thursday at 10? I have a conflict. Thanks!' },
    { ask: 'Escreva pedindo uma informação ao seu time.', hint: '"Could you send me...?"', model: 'Hi team, could you send me the numbers for last month? I need them today.' },
    { ask: 'Escreva agradecendo alguém pela ajuda.', hint: '"Thank you for..." + verbo-ing.', model: 'Thank you for helping me with the presentation yesterday.' },
  ]),
  m(38, 4, 'falar', 'No médico', 'Explicar sintomas', [
    { ask: 'Hello, what brings you in today?', hint: '"I have a..." + sintoma.', model: 'I have a bad headache and a sore throat since yesterday.' },
    { ask: 'Are you taking any medication?', hint: '"No, I\'m not taking anything".', model: "No, I'm not taking any medication right now." },
    { ask: 'Take this twice a day. Any questions?', hint: 'Pergunte quantos dias.', model: 'How many days should I take it?' },
  ]),
  m(39, 4, 'corrigir', 'Comparando coisas', 'Comparativos e superlativos', [
    { wrong: 'This one is more cheap.', right: 'This one is cheaper.', why: 'Adjetivo curto: -er.' },
    { wrong: 'It is the most big city in Brazil.', right: 'It is the biggest city in Brazil.', why: 'Adjetivo curto: -est.' },
    { wrong: 'This book is more better.', right: 'This book is better.', why: '"Better" já é comparativo.' },
  ]),
  m(40, 4, 'boss', 'Chefe: viagem completa', 'Tudo do Mundo 4', [
    { kind: 'falar', ask: "You just arrived at your hotel. Check in and ask about breakfast.", hint: 'Reserva + pergunta.', model: 'Hi, I have a reservation under Perazzoli. What time does breakfast start?' },
    { kind: 'corrigir', wrong: 'I am in this hotel since Monday and I listen music every night.', right: 'I have been in this hotel since Monday and I listen to music every night.', why: 'since → present perfect; listen TO.' },
    { kind: 'ditado', text: 'Could you tell me how to get to the train station?' },
    { kind: 'pronuncia', text: 'I think the third floor has a better view than this one.' },
    { kind: 'escrever', ask: 'Escreva um e-mail curto reclamando de um problema no hotel.', hint: 'Educado e direto.', model: 'Hello, the air conditioning in room 302 is not working. Could someone check it today?' },
  ]),

  // ----------------------------------------- Mundo 5 — Opinião e carreira ---
  m(41, 5, 'falar', 'Reunião: dando update', 'Contar o andamento', [
    { ask: 'What did you work on this week?', hint: 'Passado + present perfect.', model: "This week I finished the login screen and I've started the reports page." },
    { ask: 'Any blockers we should know about?', hint: '"I\'m waiting for...".', model: "Yes, I'm waiting for the API documentation to continue." },
    { ask: 'What are the next steps?', hint: 'Liste 2 passos.', model: "I'll finish the tests today and send the report tomorrow." },
  ]),
  m(42, 5, 'corrigir', 'Colocações do trabalho', 'make, do, take, have', [
    { wrong: 'I did a mistake in the report.', right: 'I made a mistake in the report.', why: '"Make a mistake".' },
    { wrong: 'We need to take a decision today.', right: 'We need to make a decision today.', why: '"Make a decision".' },
    { wrong: 'Can I make a question?', right: 'Can I ask a question?', why: '"Ask a question".' },
  ]),
  m(43, 5, 'escrever', 'Sua opinião', 'Defender um ponto de vista', [
    { ask: 'Escreva se você prefere trabalhar de casa ou no escritório, e por quê.', hint: '"I prefer... because...".', model: 'I prefer working from home because I can focus better and save time.' },
    { ask: 'Escreva uma vantagem e uma desvantagem do seu trabalho.', hint: '"On one hand... on the other hand...".', model: 'On one hand the salary is good, on the other hand the deadlines are hard.' },
    { ask: 'Escreva o que você mudaria na sua empresa.', hint: '"I would change..." — would + base.', model: 'I would change the number of meetings. We spend too much time talking.' },
  ]),
  m(44, 5, 'falar', 'Discordando com educação', 'Dizer não sem ofender', [
    { ask: 'I think we should release on Friday. What do you think?', hint: '"I see your point, but...".', model: "I see your point, but I'd rather test one more day and release on Monday." },
    { ask: 'Can you finish it by tomorrow?', hint: 'Recuse explicando o motivo.', model: "I'm afraid I can't. I need two more days to test it properly." },
    { ask: "Let's cut the documentation to save time.", hint: 'Discorde e ofereça alternativa.', model: "I don't think that's a good idea. We could write a shorter version instead." },
  ]),
  m(45, 5, 'ditado', 'Ditado: reunião', 'Vocabulário de trabalho', [
    'The manager asked us to review the numbers before the call.',
    'We have been working on this feature for three weeks.',
    'Let me know if you need anything else from my side.',
  ]),
  m(46, 5, 'pronuncia', 'Frases longas', 'Manter o ritmo até o fim', [
    'Although it was raining, we decided to walk to the restaurant.',
    'If I had known about the deadline, I would have prepared differently.',
    'The report highlights three significant risks that require attention.',
  ]),
  m(47, 5, 'falar', 'Entrevista de emprego', 'Perguntas clássicas', [
    { ask: 'Could you tell me a bit about yourself?', hint: 'Área + tempo de experiência.', model: "Sure. I've been working in technology for six years, mostly on web projects." },
    { ask: 'Tell me about a difficult problem you solved.', hint: 'Situação → ação → resultado.', model: 'We had a performance issue. I found a slow query, fixed it, and the response time dropped by half.' },
    { ask: 'Do you have any questions for us?', hint: 'Pergunte sobre time ou expectativas.', model: 'Yes — how is the team organized, and what does success look like in six months?' },
  ]),
  m(48, 5, 'corrigir', 'Se eu pudesse...', 'would e condicionais', [
    { wrong: 'If I would have time, I would travel.', right: 'If I had time, I would travel.', why: 'No "if" vai o passado, não "would".' },
    { wrong: 'I want that you come with me.', right: 'I want you to come with me.', why: '"Want + pessoa + to + verbo".' },
    { wrong: 'I will call you when I will arrive.', right: 'I will call you when I arrive.', why: 'Depois de "when" usa-se o presente.' },
  ]),
  m(49, 5, 'escrever', 'Sua meta em inglês', 'Planejar o próximo passo', [
    { ask: 'Escreva sua meta de inglês para os próximos 6 meses.', hint: '"In six months I want to be able to...".', model: 'In six months I want to be able to lead a meeting in English without preparing every sentence.' },
    { ask: 'Escreva como você vai treinar toda semana.', hint: '"I am going to..." + rotina.', model: 'I am going to practice speaking for fifteen minutes every day before work.' },
    { ask: 'Escreva o que te atrapalha e como resolver.', hint: '"My biggest problem is... so I will...".', model: 'My biggest problem is vocabulary, so I will review my mistakes twice a week.' },
  ]),
  m(50, 5, 'boss', 'Chefe final: entrevista', 'Tudo que você aprendeu', [
    { kind: 'falar', ask: 'Welcome! Introduce yourself and your experience.', hint: 'Três frases, sem pressa.', model: "I'm Guilherme. I've worked with technology for six years and I'm looking for a new challenge." },
    { kind: 'falar', ask: 'Why do you want to work with us?', hint: 'Fale do time e do produto.', model: 'I like the product, and I want to work with an international team to grow faster.' },
    { kind: 'corrigir', wrong: 'I work here since 2019 and I did many mistakes, but I learn a lot.', right: 'I have worked here since 2019 and I made many mistakes, but I learned a lot.', why: 'since → present perfect; make a mistake; passado.' },
    { kind: 'pronuncia', text: 'I would rather work on challenging projects with a strong team.' },
    { kind: 'escrever', ask: 'Escreva o e-mail de agradecimento depois da entrevista.', hint: 'Curto, 3 frases.', model: 'Hi Sarah, thank you for your time today. I enjoyed learning about the team and the roadmap. I look forward to hearing from you.' },
  ]),
];

export const MISSIONS_BY_ID = Object.fromEntries(MISSIONS.map((x) => [x.id, x]));

/** Normaliza um item da fase: devolve sempre { kind, ... }. */
export function itemOf(mission, index) {
  const raw = mission.items[index];
  const fallback = mission.type === 'boss' ? 'falar' : mission.type;
  if (typeof raw === 'string') return { kind: fallback, text: raw };
  return { kind: raw.kind || fallback, ...raw };
}

export function worldOf(missionId) {
  return WORLDS.find((w) => missionId >= w.from && missionId <= w.to) || WORLDS[0];
}

/** Estrelas a partir da nota média da fase. */
export function starsFor(score) {
  if (score >= 90) return 3;
  if (score >= 75) return 2;
  if (score >= 55) return 1;
  return 0;
}
