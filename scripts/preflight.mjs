import { loadCatalog, readJson } from '../src/load.mjs';
import { buildGroceryList } from '../src/planner.mjs';

const major = Number(process.versions.node.split('.')[0]);
if (major < 18) throw new Error(`Node 18 or later required; found ${process.version}`);
const catalog = await loadCatalog();
const plan = await readJson(new URL('../fixtures/plan-week.json', import.meta.url));
const groceries = buildGroceryList(plan, catalog);
console.log(`Node ${process.version}`);
console.log(`${catalog.foodsById.size} foods; ${catalog.recipesById.size} recipes; ${plan.entries.length} planned meals; ${groceries.items.length} grocery items`);
console.log('Local baseline ready. No package installation or external connection needed.');
