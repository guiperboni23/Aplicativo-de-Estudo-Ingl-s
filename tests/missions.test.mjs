// Garante que o conteúdo das 50 fases está íntegro e coerente com o corretor.
import test from 'node:test';
import assert from 'node:assert/strict';

import { MISSIONS, WORLDS, itemOf, starsFor, TYPE_META } from '../js/missions.js';
import { analyze } from '../js/corrector/engine.js';

test('são 50 fases numeradas em ordem', () => {
  assert.equal(MISSIONS.length, 50);
  MISSIONS.forEach((mission, i) => assert.equal(mission.id, i + 1));
});

test('cada mundo cobre exatamente as suas fases', () => {
  for (const world of WORLDS) {
    const fases = MISSIONS.filter((m) => m.world === world.id);
    assert.equal(fases.length, world.to - world.from + 1, `mundo ${world.id}`);
    assert.equal(fases[0].id, world.from);
  }
});

test('todo item tem os campos que a tela precisa', () => {
  for (const mission of MISSIONS) {
    assert.ok(mission.items.length >= 3, `fase ${mission.id} tem poucos itens`);
    assert.ok(TYPE_META[mission.type], `tipo desconhecido na fase ${mission.id}`);
    mission.items.forEach((_, i) => {
      const item = itemOf(mission, i);
      const onde = `fase ${mission.id}, item ${i + 1}`;
      if (item.kind === 'falar' || item.kind === 'escrever') {
        assert.ok(item.ask, `${onde}: falta a pergunta`);
        assert.ok(item.model, `${onde}: falta a resposta modelo`);
      } else if (item.kind === 'pronuncia' || item.kind === 'ditado') {
        assert.ok(item.text, `${onde}: falta a frase`);
      } else if (item.kind === 'corrigir') {
        assert.ok(item.wrong && item.right, `${onde}: falta wrong/right`);
        assert.notEqual(item.wrong, item.right, `${onde}: wrong e right iguais`);
        assert.ok(item.why, `${onde}: falta a explicação`);
      } else {
        assert.fail(`${onde}: tipo ${item.kind} desconhecido`);
      }
    });
  }
});

test('as respostas certas passam limpas pelo próprio corretor', () => {
  const problemas = [];
  for (const mission of MISSIONS) {
    mission.items.forEach((_, i) => {
      const item = itemOf(mission, i);
      const alvos = [item.model, item.text, item.right].filter(Boolean);
      for (const alvo of alvos) {
        const out = analyze(alvo).corrected;
        if (out !== alvo) problemas.push(`fase ${mission.id} item ${i + 1}: "${alvo}" → "${out}"`);
      }
    });
  }
  assert.deepEqual(problemas, [], `\n${problemas.join('\n')}`);
});

test('as frases erradas dos exercícios são realmente pegas pelo corretor', () => {
  const passaramBatido = [];
  for (const mission of MISSIONS) {
    mission.items.forEach((_, i) => {
      const item = itemOf(mission, i);
      if (item.kind !== 'corrigir') return;
      if (!analyze(item.wrong).changed) passaramBatido.push(`fase ${mission.id} item ${i + 1}: ${item.wrong}`);
    });
  }
  assert.deepEqual(passaramBatido, [], `\n${passaramBatido.join('\n')}`);
});

test('estrelas seguem a nota', () => {
  assert.equal(starsFor(100), 3);
  assert.equal(starsFor(76), 2);
  assert.equal(starsFor(55), 1);
  assert.equal(starsFor(54), 0);
});
