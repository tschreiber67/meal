import test from 'node:test';
import assert from 'node:assert/strict';
import { createCatalog } from '../src/catalog.mjs';
import { loadCatalog, readJson } from '../src/load.mjs';
import { buildGroceryList, validatePlan, groceryText, planText } from '../src/planner.mjs';

const catalog = await loadCatalog();
const fixture = name => readJson(new URL(`../fixtures/${name}.json`, import.meta.url));
const one = () => ({ schemaVersion: 1, title: 'One bowl', entries: [{ id: 'one', date: '2026-10-26', slot: 'breakfast', recipeId: 'oat-bowl', servings: 1 }] });

test('scales a two-serving recipe to a single serving', () => {
  const result = buildGroceryList(one(), catalog);
  assert.deepEqual(result.items.map(item => [item.foodId, item.quantityGrams]), [['banana', 100], ['milk', 100], ['oats', 50]]);
  assert.equal(result.totalServings, 1);
});

test('combines shared ingredients across recipes and fractional servings', () => {
  const plan = one();
  plan.entries.push({ ...plan.entries[0], id: 'two', recipeId: 'yogurt-fruit', servings: 0.5 });
  const result = buildGroceryList(plan, catalog);
  assert.deepEqual(result.items.map(item => [item.foodId, item.quantityGrams]), [['banana', 150], ['berries', 25], ['milk', 100], ['oats', 50], ['yogurt', 75]]);
});

test('same plan yields identical output and does not mutate inputs', async () => {
  const plan = await fixture('plan-week');
  const before = JSON.stringify(plan);
  const a = buildGroceryList(plan, catalog);
  assert.deepEqual(buildGroceryList(plan, catalog), a);
  assert.deepEqual(buildGroceryList(plan, catalog), a);
  assert.equal(JSON.stringify(plan), before);
  const shuffled = { ...plan, entries: [...plan.entries].reverse() };
  assert.deepEqual(buildGroceryList(shuffled, catalog), a);
});

test('empty plan has an empty grocery list and readable message', async () => {
  const result = buildGroceryList(await fixture('plan-empty'), catalog);
  assert.deepEqual(result.items, []);
  assert.equal(result.totalServings, 0);
  assert.match(groceryText(result), /No meals selected/);
});

test('rejects supplied invalid recipe and zero-serving examples', async () => {
  for (const name of ['plan-invalid-recipe', 'plan-invalid-servings']) {
    const plan = await fixture(name);
    assert.throws(() => buildGroceryList(plan, catalog));
  }
});

test('rejects impossible dates, invalid slots and duplicate entries', () => {
  for (const changes of [{ date: '2026-02-30' }, { slot: 'midnight' }]) {
    const plan = one();
    Object.assign(plan.entries[0], changes);
    assert.throws(() => validatePlan(plan, catalog));
  }
  const plan = one();
  plan.entries.push({ ...plan.entries[0] });
  assert.throws(() => validatePlan(plan, catalog), /unique/);
});

test('rejects string, negative, nonfinite, excessive and missing serving amounts', () => {
  for (const servings of ['2', -1, NaN, Infinity, -Infinity, undefined, 101]) {
    const plan = one();
    plan.entries[0].servings = servings;
    assert.throws(() => validatePlan(plan, catalog));
  }
});

test('catalog rejects duplicate identifiers and unknown ingredient references', () => {
  const food = { id: 'test', name: 'Test food' };
  const recipe = { id: 'test-meal', name: 'Test meal', yieldServings: 1, ingredients: [{ foodId: 'test', grams: 10 }] };
  assert.throws(() => createCatalog([food, food], [recipe]), /Duplicate/);
  assert.throws(() => createCatalog([food], [{ ...recipe, ingredients: [{ foodId: 'missing', grams: 10 }] }]), /unknown food/);
});

test('prints planned meals in date and meal order', () => {
  const plan = one();
  plan.entries.unshift({ ...plan.entries[0], id: 'dinner', slot: 'dinner' });
  const text = planText(plan, catalog);
  assert.ok(text.indexOf('breakfast') < text.indexOf('dinner'));
});
