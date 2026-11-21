import { createCatalog } from '/src/catalog.mjs';
import { buildGroceryList, groceryText, sortedEntries, validatePlan } from '/src/planner.mjs';

const byId = id => document.getElementById(id);
const key = 'meal-planner-v1';
let catalog, plan, example, groceryList;

function notice(text, error = false) {
  byId('message').textContent = text;
  byId('message').className = error ? 'error' : '';
}

function node(tag, text, className) {
  const el = document.createElement(tag);
  if (text !== undefined) el.textContent = text;
  if (className) el.className = className;
  return el;
}

function download(filename, content, type) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = node('a');
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function commit(next) {
  validatePlan(next, catalog);
  buildGroceryList(next, catalog);
  plan = next;
  render();
  try {
    localStorage.setItem(key, JSON.stringify(plan));
    notice('Plan saved in this browser.');
  } catch {
    notice('Plan updated. Browser storage is unavailable; export your plan to keep it.', true);
  }
}

function safely(action) {
  try { action(); } catch (error) { notice(error.message, true); }
}

function showRecipe() {
  const recipe = catalog.recipesById.get(byId('recipe').value);
  const detail = byId('recipe-detail');
  detail.replaceChildren(node('p', `Recipe yields ${recipe.yieldServings} servings.`));
  const list = node('ul');
  for (const ingredient of recipe.ingredients) {
    list.append(node('li', `${catalog.foodsById.get(ingredient.foodId).name}: ${ingredient.grams} g`));
  }
  detail.append(list, ...recipe.instructions.map(text => node('p', text)));
}

function render() {
  groceryList = buildGroceryList(plan, catalog);
  byId('title').value = plan.title;
  byId('meal-count').textContent = `${plan.entries.length} meals`;
  const meals = byId('meals');
  meals.replaceChildren();
  for (const entry of sortedEntries(plan)) {
    const row = node('div', undefined, 'meal');
    row.append(node('p', `${entry.date} / ${entry.slot}`, 'muted'), node('strong', catalog.recipesById.get(entry.recipeId).name));
    const controls = node('div', undefined, 'meal-controls');
    const label = node('label', 'Servings');
    const input = node('input');
    Object.assign(input, { type: 'number', min: '0.25', max: '100', step: '0.25', value: String(entry.servings) });
    input.setAttribute('aria-label', `Servings for ${entry.date} ${entry.slot} ${catalog.recipesById.get(entry.recipeId).name}`);
    input.addEventListener('change', () => {
      if (!input.checkValidity()) { notice('Enter servings in increments of 0.25, from 0.25 to 100.', true); input.value = entry.servings; return; }
      safely(() => commit({ ...plan, entries: plan.entries.map(item => item.id === entry.id ? { ...item, servings: Number(input.value) } : item) }));
    });
    label.append(input);
    const remove = node('button', 'Remove');
    remove.setAttribute('aria-label', `Remove ${entry.date} ${entry.slot} ${catalog.recipesById.get(entry.recipeId).name}`);
    remove.addEventListener('click', () => safely(() => commit({ ...plan, entries: plan.entries.filter(item => item.id !== entry.id) })));
    controls.append(label, remove);
    row.append(controls);
    meals.append(row);
  }
  if (!plan.entries.length) meals.append(node('p', 'No meals yet. Add your first meal above.', 'muted'));
  const groceries = byId('groceries');
  groceries.replaceChildren();
  for (const item of groceryList.items) {
    const row = node('li');
    row.append(node('span', item.name), node('span', `${item.quantityGrams} g`));
    groceries.append(row);
  }
  if (!groceryList.items.length) groceries.append(node('li', 'Your grocery list will appear here.'));
}

async function start() {
  const json = async path => {
    const response = await fetch(path);
    if (!response.ok) throw new Error(`Unable to load ${path}`);
    return response.json();
  };
  const [foods, recipes, initial] = await Promise.all([json('/data/foods.json'), json('/data/recipes.json'), json('/fixtures/plan-week.json')]);
  catalog = createCatalog(foods, recipes);
  example = initial;
  plan = structuredClone(example);
  let storageMessage = 'Ready. Example week loaded.';
  try {
    const saved = localStorage.getItem(key);
    if (saved) { const parsed = JSON.parse(saved); validatePlan(parsed, catalog); buildGroceryList(parsed, catalog); plan = parsed; storageMessage = 'Your saved plan is ready.'; }
  } catch { storageMessage = 'Saved plan unavailable. Example week loaded.'; }
  byId('recipe').replaceChildren(...recipes.map(recipe => {
    const option = node('option', recipe.name);
    option.value = recipe.id;
    return option;
  }));
  byId('recipe').addEventListener('change', showRecipe);
  byId('meal-form').addEventListener('submit', event => {
    event.preventDefault();
    safely(() => commit({ ...plan, entries: [...plan.entries, { id: crypto.randomUUID(), date: byId('date').value, slot: byId('slot').value, recipeId: byId('recipe').value, servings: Number(byId('servings').value) }] }));
  });
  byId('title').addEventListener('change', () => safely(() => commit({ ...plan, title: byId('title').value.trim() })));
  byId('reset').addEventListener('click', () => {
    if (confirm('Replace the current plan with the example week?')) safely(() => commit(structuredClone(example)));
  });
  byId('download-plan').addEventListener('click', () => download('meal-plan.json', JSON.stringify(plan, null, 2) + '\n', 'application/json'));
  byId('download-list').addEventListener('click', () => download('grocery-list.txt', groceryText(groceryList), 'text/plain'));
  byId('download-json').addEventListener('click', () => download('grocery-list.json', JSON.stringify(groceryList, null, 2) + '\n', 'application/json'));
  byId('import-plan').addEventListener('change', async event => {
    const file = event.target.files[0];
    if (!file) return;
    try {
      if (file.size > 1_000_000) throw new Error('Plan file exceeds 1 MB');
      const imported = JSON.parse(await file.text());
      validatePlan(imported, catalog);
      if (confirm('Replace the current plan with the imported plan?')) commit(imported);
    } catch (error) { notice(error.message, true); }
    event.target.value = '';
  });
  showRecipe();
  render();
  notice(storageMessage);
}

start().catch(error => {
  notice(`Could not start: ${error.message}`, true);
  for (const input of document.querySelectorAll('input, select, button')) input.disabled = true;
});
