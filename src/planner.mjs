import { InputError, requirePositive } from './catalog.mjs';

export const MEAL_SLOTS = ['breakfast', 'lunch', 'dinner', 'snack'];

export function validatePlan(plan, catalog) {
  if (!plan || plan.schemaVersion !== 1 || !Array.isArray(plan.entries)) {
    throw new InputError('Plan needs schemaVersion 1 and an entries array');
  }
  if (typeof plan.title !== 'string' || !plan.title.trim()) {
    throw new InputError('Plan needs a title');
  }
  if (plan.entries.length > 366) throw new InputError('Plan exceeds 366 entries');
  const ids = new Set();
  for (const entry of plan.entries) {
    if (!entry || typeof entry.id !== 'string' || !entry.id.trim() || ids.has(entry.id)) {
      throw new InputError('Plan entry ids must be nonempty and unique');
    }
    ids.add(entry.id);
    const date = typeof entry.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(entry.date)
      ? new Date(`${entry.date}T00:00:00Z`) : new Date(NaN);
    if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== entry.date) {
      throw new InputError(`${entry.id} has an invalid date`);
    }
    if (!MEAL_SLOTS.includes(entry.slot)) throw new InputError(`${entry.id} has an invalid meal slot`);
    if (!catalog.recipesById.has(entry.recipeId)) throw new InputError(`${entry.id} has an unknown recipe`);
    requirePositive(entry.servings, `${entry.id}.servings`);
    if (entry.servings > 100) throw new InputError(`${entry.id}.servings exceeds 100`);
  }
  return plan;
}

export function sortedEntries(plan) {
  return [...plan.entries].sort((a, b) => a.date.localeCompare(b.date)
    || MEAL_SLOTS.indexOf(a.slot) - MEAL_SLOTS.indexOf(b.slot)
    || a.id.localeCompare(b.id));
}

export function buildGroceryList(plan, catalog) {
  validatePlan(plan, catalog);
  const quantities = new Map();
  for (const entry of sortedEntries(plan)) {
    const recipe = catalog.recipesById.get(entry.recipeId);
    for (const ingredient of recipe.ingredients) {
      const grams = ingredient.grams * entry.servings / recipe.yieldServings;
      const next = (quantities.get(ingredient.foodId) || 0) + grams;
      if (!Number.isFinite(next)) throw new InputError('Calculated grocery quantity exceeds numeric range');
      quantities.set(ingredient.foodId, next);
    }
  }
  return {
    schemaVersion: 1,
    title: plan.title,
    entryCount: plan.entries.length,
    totalServings: plan.entries.reduce((total, entry) => total + entry.servings, 0),
    items: [...quantities.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([foodId, grams]) => {
      const food = catalog.foodsById.get(foodId);
      return { foodId, name: food.name, category: food.category || 'other', quantityGrams: Number(grams.toFixed(3)) };
    })
  };
}

export function groceryText(result) {
  const lines = [result.title, `${result.entryCount} planned meals; ${result.totalServings} total servings`, ''];
  for (const item of result.items) lines.push(`${item.name}: ${item.quantityGrams} g`);
  if (!result.items.length) lines.push('No meals selected.');
  return lines.join('\n') + '\n';
}

export function planText(plan, catalog) {
  validatePlan(plan, catalog);
  return [plan.title, '', ...sortedEntries(plan).map(entry =>
    `${entry.date} ${entry.slot}: ${catalog.recipesById.get(entry.recipeId).name} (${entry.servings} servings)`
  )].join('\n') + '\n';
}
