import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const run = (...args) => spawnSync(process.execPath, ['cli.mjs', ...args], { cwd: root, encoding: 'utf8' });

test('CLI exports machine-readable groceries without unrelated stdout', () => {
  const result = run('groceries', 'fixtures/plan-week.json', '--format', 'json');
  assert.equal(result.status, 0, result.stderr);
  const output = JSON.parse(result.stdout);
  assert.equal(output.entryCount, 9);
  assert.equal(output.totalServings, 18);
  assert.equal(output.items.find(item => item.foodId === 'banana').quantityGrams, 600);
});

test('CLI rejects malformed input without producing a successful list', () => {
  const result = run('groceries', 'fixtures/plan-invalid-recipe.json');
  assert.equal(result.status, 1);
  assert.equal(result.stdout, '');
  assert.match(result.stderr, /unknown recipe/);
});

test('CLI rejects unknown options and prints readable output', () => {
  assert.equal(run('groceries', '--format', 'xml').status, 1);
  assert.equal(run('recipes', '--anything').status, 1);
  assert.match(run('groceries').stdout, /Banana, edible portion: 600 g/);
  assert.match(run('plan').stdout, /2026-10-26 breakfast: Banana oat bowl/);
});
