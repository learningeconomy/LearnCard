// Serves a built app the way a static host does, for local performance runs only.
// Usage: node scripts/perf/serve-build.mjs <buildDir> <port>
// - gzip for text responses (production hosts compress; Lighthouse should see real transfer sizes)
// - `/path` serves `path/index.html` or `path.html` when the build has one, else the SPA `index.html`
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';
import { gzipSync } from 'node:zlib';

const [buildArg, portArg] = process.argv.slice(2);
if (!buildArg || !portArg) throw new Error('Usage: serve-build.mjs <buildDir> <port>');
const root = resolve(buildArg);
const port = Number(portArg);

const TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.mjs': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.webp': 'image/webp',
    '.woff2': 'font/woff2',
    '.wasm': 'application/wasm',
    '.txt': 'text/plain; charset=utf-8',
    '.webmanifest': 'application/manifest+json',
};
const COMPRESSIBLE = new Set(['.html', '.js', '.mjs', '.css', '.json', '.svg', '.wasm', '.txt']);

const isFile = async path => (await stat(path).catch(() => undefined))?.isFile() ?? false;

const resolveFile = async pathname => {
    const clean = normalize(decodeURIComponent(pathname)).replace(/^(\.\.[/\\])+/, '');
    const direct = join(root, clean);
    if (!direct.startsWith(root)) return join(root, 'index.html');
    const candidates = [direct, join(direct, 'index.html'), `${direct.replace(/\/$/, '')}.html`];
    for (const candidate of candidates) if (await isFile(candidate)) return candidate;
    return join(root, 'index.html');
};

createServer(async (request, response) => {
    try {
        const { pathname } = new URL(request.url ?? '/', 'http://localhost');
        const file = await resolveFile(pathname);
        const extension = extname(file);
        let body = await readFile(file);
        const headers = {
            'content-type': TYPES[extension] ?? 'application/octet-stream',
            'cache-control': pathname.startsWith('/assets/')
                ? 'public, max-age=31536000, immutable'
                : 'no-cache',
        };
        if (COMPRESSIBLE.has(extension) && /\bgzip\b/.test(request.headers['accept-encoding'] ?? '')) {
            body = gzipSync(body);
            headers['content-encoding'] = 'gzip';
        }
        response.writeHead(200, headers);
        response.end(body);
    } catch (error) {
        response.writeHead(500);
        response.end(String(error));
    }
}).listen(port, '127.0.0.1', () => console.log(`Serving ${root} on http://127.0.0.1:${port}`));
