import { readFile } from 'node:fs/promises';
import { createCatalog } from './catalog.mjs';

export async function readJson(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}

export async function loadCatalog() {
  const foods = await readJson(new URL('../data/foods.json', import.meta.url));
  const recipes = await readJson(new URL('../data/recipes.json', import.meta.url));
  return createCatalog(foods, recipes);
}
