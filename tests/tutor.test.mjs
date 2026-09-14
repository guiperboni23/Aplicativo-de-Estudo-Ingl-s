// O parceiro de conversa precisa soar vivo: reagir, variar e não repetir.
import test from 'node:test';
import assert from 'node:assert/strict';

import { createPartner, createScripted, TOPICS } from '../js/tutor.js';
import { SCENARIOS } from '../js/lessons.js';

const falar = (p, texto, result = { issues: [] }) => p.respond(texto, result).reply;

test('abre a conversa com uma pergunta', () => {
  const p = createPartner();
  const abertura = p.open();
  assert.match(abertura.reply, /\?$/);
});

test('toda resposta termina em pergunta, para o papo continuar', () => {
  const p = createPartner();
  const falas = [
    'I worked all day and I am tired',
    'My family is fine, we had dinner together',
    'I watched a movie yesterday with my wife',
    'I want to travel to Chile next year',
    'I play soccer every Saturday with my friends',
  ];
  for (const fala of falas) {
    assert.match(falar(p, fala), /\?/, `sem pergunta depois de: ${fala}`);
  }
});

test('segue o assunto que o aluno trouxe', () => {
  // A pergunta tem que sair do banco daquele assunto, não de outro qualquer.
  const daPara = (reply, topico) => TOPICS[topico].asks.some((ask) => reply.includes(ask));

  const trabalho = falar(createPartner(), 'I worked until late at the office today');
  assert.ok(daPara(trabalho, 'work'), `esperava pergunta sobre trabalho, veio: ${trabalho}`);

  const bichos = falar(createPartner(), 'I have two dogs at home');
  assert.ok(daPara(bichos, 'pets'), `esperava pergunta sobre bichos, veio: ${bichos}`);

  const comida = falar(createPartner(), 'I cooked dinner for my family yesterday');
  assert.ok(daPara(comida, 'food'), `esperava pergunta sobre comida, veio: ${comida}`);
});

test('reage ao tom do que foi dito', () => {
  const bom = createPartner();
  assert.match(falar(bom, 'Today was great, I had an amazing day with my family'), /awesome|Love|great|good for you|fun|win/i);

  const ruim = createPartner();
  assert.match(falar(ruim, 'I am very tired and my day was bad and stressful'), /sorry|rough|tough|get that|better/i);
});

// A reação ("Nice.", "Got it.") varia sozinha; o que não pode repetir é a pergunta.
const perguntaDe = (reply) => {
  const partes = reply.split(/(?<=[.!?])\s+/).filter((x) => x.includes('?'));
  return partes[partes.length - 1] || reply;
};

test('não repete a mesma pergunta na mesma conversa (nem depois de 30 turnos)', () => {
  const p = createPartner();
  const feitas = [];
  for (let i = 0; i < 30; i++) {
    feitas.push(perguntaDe(falar(p, 'I like to work and study English every day at home')));
  }
  const repetidas = feitas.filter((q, i) => feitas.indexOf(q) !== i);
  assert.deepEqual(repetidas, [], `repetiu: ${repetidas[0]}`);
});

test('cobra frase completa quando a resposta é curta demais', () => {
  const p = createPartner();
  assert.match(falar(p, 'yes'), /more|detail|sentence/i);
});

test('oferece frase pronta quando há erro de gramática', () => {
  const p = createPartner();
  const comErro = { issues: [{ cat: 'preposição', sev: 2, warn: false }] };
  const dicas = [];
  for (let i = 0; i < 6; i++) {
    dicas.push(p.respond('I listen music every day at home when I am working', comErro).hintPt);
  }
  assert.ok(dicas.some((d) => d && d.includes('frase pronta')), 'nunca ofereceu uma frase pronta');
});

test('cenário com roteiro segue a ordem e termina', () => {
  const cenario = SCENARIOS[1];
  const s = createScripted(cenario);
  assert.equal(s.open().reply, cenario.turns[0].ask);
  for (let i = 1; i < cenario.turns.length; i++) {
    const r = s.respond('ok, sounds good to me');
    assert.ok(r.reply.includes(cenario.turns[i].ask), `passo ${i} fora de ordem`);
  }
  assert.equal(s.respond('thank you very much').done, true);
});
