export class InputError extends Error {
  constructor(message) {
    super(message);
    this.name = 'InputError';
  }
}

export function requirePositive(value, label) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    throw new InputError(`${label} must be a finite positive number`);
  }
}

function index(records, label) {
  if (!Array.isArray(records) || !records.length) {
    throw new InputError(`${label} must be a nonempty array`);
  }
  const result = new Map();
  for (const row of records) {
    if (!row || typeof row.id !== 'string' || !/^[a-z][a-z0-9-]*$/.test(row.id)) {
      throw new InputError(`${label} contains an invalid id`);
    }
    if (result.has(row.id)) throw new InputError(`Duplicate ${label} id: ${row.id}`);
    if (typeof row.name !== 'string' || !row.name.trim()) {
      throw new InputError(`${row.id} needs a name`);
    }
    result.set(row.id, row);
  }
  return result;
}

export function createCatalog(foods, recipes) {
  const foodsById = index(foods, 'food');
  const recipesById = index(recipes, 'recipe');
  for (const recipe of recipes) {
    requirePositive(recipe.yieldServings, `${recipe.id}.yieldServings`);
    if (!Array.isArray(recipe.ingredients) || !recipe.ingredients.length) {
      throw new InputError(`${recipe.id} needs ingredients`);
    }
    for (const ingredient of recipe.ingredients) {
      if (!ingredient || !foodsById.has(ingredient.foodId)) {
        throw new InputError(`${recipe.id} contains an unknown food`);
      }
      requirePositive(ingredient.grams, `${recipe.id}.${ingredient.foodId}.grams`);
    }
  }
  return { foodsById, recipesById };
}
