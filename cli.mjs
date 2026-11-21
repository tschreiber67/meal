import { loadCatalog, readJson } from './src/load.mjs';
import { buildGroceryList, groceryText, planText, validatePlan } from './src/planner.mjs';
import { InputError } from './src/catalog.mjs';

const help = `Meal Planner\n\nnode cli.mjs recipes\nnode cli.mjs plan [plan.json]\nnode cli.mjs validate [plan.json]\nnode cli.mjs groceries [plan.json] [--format text|json]\n\nDefault plan: fixtures/plan-week.json\nAll food quantities are grams as listed in the food catalog.\n`;

try {
  const [command, ...args] = process.argv.slice(2);
  if (!command || command === '--help') {
    process.stdout.write(help);
  } else {
    if (!['recipes', 'plan', 'validate', 'groceries'].includes(command)) throw new InputError('Unknown command');
    let format = 'text';
    let path;
    for (let i = 0; i < args.length; i++) {
      if (args[i] === '--format' && command === 'groceries') {
        format = args[++i];
        if (!['text', 'json'].includes(format)) throw new InputError('Format must be text or json');
      } else if (!args[i].startsWith('-') && path === undefined && command !== 'recipes') {
        path = args[i];
      } else throw new InputError(`Unexpected argument: ${args[i]}`);
    }
    const catalog = await loadCatalog();
    if (command === 'recipes') {
      process.stdout.write([...catalog.recipesById.values()].map(r => `${r.id}: ${r.name} (recipe yields ${r.yieldServings})`).join('\n') + '\n');
    } else {
      const plan = await readJson(path || new URL('./fixtures/plan-week.json', import.meta.url));
      validatePlan(plan, catalog);
      if (command === 'validate') process.stdout.write(`Valid: ${plan.entries.length} planned meals\n`);
      if (command === 'plan') process.stdout.write(planText(plan, catalog));
      if (command === 'groceries') {
        const result = buildGroceryList(plan, catalog);
        process.stdout.write(format === 'json' ? JSON.stringify(result, null, 2) + '\n' : groceryText(result));
      }
    }
  }
} catch (error) {
  process.stderr.write(`Error: ${error.message}\n`);
  process.exitCode = 1;
}
