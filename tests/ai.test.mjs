// A API exige mensagens alternando user/assistant e começando por user.
import test from 'node:test';
import assert from 'node:assert/strict';

globalThis.localStorage = {
  store: {},
  getItem(k) { return this.store[k] || null; },
  setItem(k, v) { this.store[k] = v; },
};

const { messagesFrom } = await import('../js/ai.js');
const { systemPrompt } = await import('../js/persona.js');

const papeis = (msgs) => msgs.map((m) => m.role).join(',');

test('conversa nova manda só a fala do aluno', () => {
  const out = messagesFrom([], 'Hi there!');
  assert.deepEqual(out, [{ role: 'user', content: 'Hi there!' }]);
});

test('a abertura do nativo é preservada com um "Hey!" antes', () => {
  // A API não aceita começar por assistant, mas o Alex precisa ver a pergunta
  // que ele mesmo fez ao abrir a conversa.
  const out = messagesFrom([{ role: 'assistant', content: "Hey! How's your day?" }], 'It was good.');
  assert.equal(papeis(out), 'user,assistant,user');
  assert.equal(out[0].content, 'Hey!');
  assert.equal(out[1].content, "Hey! How's your day?");
  assert.equal(out[2].content, 'It was good.');
});

test('alterna user/assistant sem repetir papéis', () => {
  const history = [
    { role: 'assistant', content: 'Hey!' },
    { role: 'user', content: 'Hi' },
    { role: 'assistant', content: 'How are you?' },
    { role: 'user', content: 'Good' },
    { role: 'user', content: 'Really good' },
    { role: 'assistant', content: 'Nice!' },
  ];
  const out = messagesFrom(history, 'What about you?');
  assert.equal(papeis(out), 'user,assistant,user,assistant,user,assistant,user');
  assert.equal(out[out.length - 1].content, 'What about you?');
});

test('não manda duas falas do aluno seguidas no fim', () => {
  const history = [
    { role: 'assistant', content: 'Hey!' },
    { role: 'user', content: 'Hi' },
  ];
  const out = messagesFrom(history, 'Second message');
  assert.equal(papeis(out), 'user,assistant,user');
  assert.equal(out[out.length - 1].content, 'Second message');
});

test('ignora mensagens vazias e corta textos gigantes', () => {
  const out = messagesFrom([{ role: 'assistant', content: '   ' }], 'x'.repeat(5000));
  assert.equal(out.length, 1);
  assert.equal(out[0].content.length, 2000);
});

test('a persona pede conversa curta, em inglês e sem markdown', () => {
  const prompt = systemPrompt('A2');
  assert.match(prompt, /American/);
  assert.match(prompt, /A2/);
  assert.match(prompt, /No markdown/i);
  assert.match(prompt, /NOT his teacher/);
});
