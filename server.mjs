import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const files = new Map([
  ['/', ['public/index.html', 'text/html; charset=utf-8']],
  ['/app.mjs', ['public/app.mjs', 'text/javascript; charset=utf-8']],
  ['/styles.css', ['public/styles.css', 'text/css; charset=utf-8']],
  ['/src/catalog.mjs', ['src/catalog.mjs', 'text/javascript; charset=utf-8']],
  ['/src/planner.mjs', ['src/planner.mjs', 'text/javascript; charset=utf-8']],
  ['/data/foods.json', ['data/foods.json', 'application/json']],
  ['/data/recipes.json', ['data/recipes.json', 'application/json']],
  ['/fixtures/plan-week.json', ['fixtures/plan-week.json', 'application/json']]
]);

export function makeServer() {
  return createServer(async (request, response) => {
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'");
    if (!['GET', 'HEAD'].includes(request.method)) {
      response.writeHead(405, { Allow: 'GET, HEAD' });
      response.end('Method not allowed');
      return;
    }
    const path = (request.url || '/').split('?')[0];
    const entry = files.get(path);
    if (!entry) {
      response.writeHead(404);
      response.end('Not found');
      return;
    }
    try {
      const content = await readFile(new URL(entry[0], import.meta.url));
      response.writeHead(200, { 'Content-Type': entry[1] });
      response.end(request.method === 'HEAD' ? undefined : content);
    } catch {
      response.writeHead(500);
      response.end('Unable to read local application file');
    }
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const port = Number(process.env.PORT || 3000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be 1 to 65535');
  const server = makeServer();
  server.on('error', error => {
    process.stderr.write(`Unable to start: ${error.message}\n`);
    process.exitCode = 1;
  });
  server.listen(port, '127.0.0.1', () => process.stdout.write(`Meal Planner: http://127.0.0.1:${port}\nPress Ctrl+C to stop.\n`));
}
