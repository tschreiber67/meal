import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { makeServer } from '../server.mjs';

test('local server serves the app and data, but not arbitrary repo files', async t => {
  const server = makeServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise(resolve => {
    server.close(resolve);
    server.closeAllConnections?.();
  }));
  const base = `http://127.0.0.1:${server.address().port}`;
  const index = await fetch(base);
  assert.equal(index.status, 200);
  assert.match(await index.text(), /Your meal plan/);
  const food = await fetch(`${base}/data/foods.json`);
  assert.equal((await food.json()).length, 18);
  for (const path of ['/app.mjs', '/styles.css', '/src/catalog.mjs', '/src/planner.mjs', '/data/recipes.json', '/fixtures/plan-week.json']) {
    assert.equal((await fetch(base + path)).status, 200, path);
  }
  assert.equal((await fetch(`${base}/package.json`)).status, 404);
  assert.equal((await fetch(`${base}/.env`)).status, 404);
  assert.equal((await fetch(base, { method: 'POST' })).status, 405);
});
