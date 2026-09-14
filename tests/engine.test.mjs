// Testes do motor de correção: node --test tests/
import test from 'node:test';
import assert from 'node:assert/strict';

import { analyze } from '../js/corrector/engine.js';
import { third, past, comparative, articleFor, gerund } from '../js/corrector/morphology.js';
import { alignWords, similarity } from '../js/utils.js';

const corrige = (input, esperado, opts) => {
  const out = analyze(input, opts).corrected;
  assert.equal(out, esperado, `\n  entrada: ${input}\n  obtido : ${out}\n  esperado: ${esperado}`);
};

test('morfologia', () => {
  assert.equal(third('go'), 'goes');
  assert.equal(third('study'), 'studies');
  assert.equal(third('watch'), 'watches');
  assert.equal(past('go'), 'went');
  assert.equal(past('stop'), 'stopped');
  assert.equal(past('study'), 'studied');
  assert.equal(gerund('run'), 'running');
  assert.equal(comparative('easy'), 'easier');
  assert.equal(comparative('big', true), 'biggest');
  assert.equal(comparative('good'), 'better');
  assert.equal(articleFor('apple'), 'an');
  assert.equal(articleFor('university'), 'a');
  assert.equal(articleFor('hour'), 'an');
});

test('idade e sensações usam "to be"', () => {
  corrige('I have 34 years old', 'I am 34 years old.');
  corrige('she has 12 years', 'She is 12 years old.');
  corrige('I have hungry', 'I am hungry.');
});

test('terceira pessoa do singular', () => {
  corrige('he work in a bank', 'He works in a bank.');
  corrige('she dont like coffee', "She doesn't like coffee.");
  corrige("he doesn't likes pizza", "He doesn't like pizza.");
});

test('tempo verbal com marcadores', () => {
  corrige('yesterday I go to the beach', 'Yesterday I went to the beach.');
  corrige('I watch a movie last night', 'I watched a movie last night.');
  corrige('I live here since 2019', 'I have lived here since 2019.');
});

test('preposições e colocações', () => {
  corrige('I listen music every day', 'I listen to music every day.');
  corrige('it depends of you', 'It depends on you.');
  corrige('we discussed about the project', 'We discussed the project.');
  corrige('I go to home after work', 'I go home after work.');
  corrige('see you in monday', 'See you on Monday.');
  corrige('I made a mistake? no, I did a mistake', 'I made a mistake? No, I made a mistake.');
  corrige('can you explain me this', 'Can you explain this to me?');
});

test('incontáveis, artigos e comparativos', () => {
  corrige('I need informations', 'I need information.');
  corrige('I am engineer', 'I am an engineer.');
  corrige('this is more easy', 'This is easier.');
  corrige('he is the most big', 'He is the biggest.');
  corrige('there is many people', 'There are many people.');
});

test('verbo auxiliar e infinitivo com "to"', () => {
  corrige('i am study english every days', 'I am studying English every day.');
  corrige('I want speak with my boss', 'I want to speak with my boss.');
  corrige('I try speak english every day', 'I try to speak English every day.');
  corrige('she need study more', 'She needs to study more.');
});

test('negativas e perguntas', () => {
  corrige("I don't know nothing", "I don't know anything.");
  corrige('what means this word', 'What does this word mean?');
  corrige('do you can help me', 'Can you help me?');
  corrige('how I can improve', 'How can I improve?');
});

test('frases corretas não são alteradas', () => {
  const corretas = [
    'I have lived in São Paulo for three years.',
    'She works at a hospital downtown.',
    "I don't like waking up early, but I do it anyway.",
    'Yesterday we watched a great movie together.',
    'Could you repeat that more slowly, please?',
    'There are a lot of options on the menu.',
    'He is an engineer and she is a teacher.',
    'You are like your father in many ways.',
    'I am going to the gym after work.',
    'I need help with this report.',
    'She is studying for the test right now.',
    'I want to work abroad next year.',
  ];
  for (const frase of corretas) {
    const r = analyze(frase);
    assert.equal(r.corrected, frase, `alterou frase correta: ${frase} -> ${r.corrected}`);
    assert.equal(r.stats.accuracy, 100, `nota baixa em frase correta: ${frase}`);
  }
});

test('modo voz ignora pontuação e grafia', () => {
  const texto = 'i work in a bank and i like my job';
  const escrita = analyze(texto, { mode: 'text' });
  const voz = analyze(texto, { mode: 'voice' });
  assert.ok(escrita.issues.length > 0, 'no modo escrita a pontuação conta');
  assert.equal(voz.issues.length, 0, 'no modo voz não deve cobrar pontuação/maiúsculas');
  assert.equal(voz.stats.accuracy, 100);
});

test('explicações e diff acompanham cada correção', () => {
  const r = analyze('he go to work every days');
  assert.ok(r.issues.length >= 2);
  for (const issue of r.issues) {
    assert.ok(issue.why && issue.why.length > 8, 'toda correção precisa de explicação em português');
    assert.ok(issue.cat, 'toda correção precisa de categoria');
  }
  assert.match(r.diff, /<del>/);
  assert.match(r.diff, /<ins>/);
});

test('avisos (falso cognato / português) não mudam o texto', () => {
  const r = analyze('I need to pretend the promotion');
  assert.equal(r.corrected, 'I need to pretend the promotion.');
  assert.ok(r.issues.some((i) => i.warn && i.cat === 'falso cognato'));

  const pt = analyze('I want to falar about my trabalho');
  assert.ok(pt.issues.some((i) => i.cat === 'português no meio'));
});

test('alinhamento de palavras para pronúncia', () => {
  const steps = alignWords(['i', 'would', 'like', 'a', 'coffee'], ['i', 'like', 'a', 'coffee']);
  assert.equal(steps.filter((s) => s.type === 'missing').length, 1);
  assert.equal(steps.find((s) => s.type === 'missing').target, 'would');
  assert.ok(similarity('three', 'tree') > 0.7);
});

test('precisão cai com erros graves e sobe com acertos', () => {
  const ruim = analyze('he dont have 20 years and he no like study english');
  const boa = analyze('He is twenty years old and he loves studying English.');
  assert.ok(ruim.stats.accuracy < 70, `esperava nota baixa, veio ${ruim.stats.accuracy}`);
  assert.equal(boa.stats.accuracy, 100);
});
