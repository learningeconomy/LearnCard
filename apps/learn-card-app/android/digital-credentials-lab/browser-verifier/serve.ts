import { build } from 'esbuild';
import { createVerifierHandler } from './handler';

// Development-only loopback server. Use a trusted HTTPS reverse proxy/tunnel; never production accounts.
const origin = process.env.LC_VERIFIER_ORIGIN;
if (!origin) throw new Error('Set LC_VERIFIER_ORIGIN to the HTTPS URL of this test server');
const port = Number(process.env.LC_VERIFIER_PORT ?? 43164);
const handler = createVerifierHandler(origin);
const bundled = await build({
    entryPoints: [new URL('./client.ts', import.meta.url).pathname],
    bundle: true,
    write: false,
    platform: 'browser',
    target: 'chrome141',
    format: 'iife',
});
const js = bundled.outputFiles[0].contents;
const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Independent credential verifier</title><style>
*{box-sizing:border-box}body{margin:0;background:#eff0f5;color:#18224e;font:14px/1.6 system-ui,sans-serif}main{width:calc(100% - 32px);max-width:480px;margin:24px auto;padding:24px;border-radius:20px;background:#fff}h1{font-size:20px;line-height:1.4}p{color:#6f7590}.eyebrow{font-size:12px}.status{padding:16px;border:1px solid #a7f3d0;border-radius:16px;color:#047857;background:#ecfdf5}.error{border-color:#fee2e2;color:#b91c1c;background:#fef2f2}button{width:100%;margin:12px 0;padding:14px 16px;border:0;border-radius:20px;background:#18224e;color:#fff;font:500 14px system-ui}button:disabled{opacity:.4}button:focus-visible{outline:2px solid #059669;outline-offset:3px}.secondary{background:#fff;color:#52597a;border:1px solid #c5c8d3}[hidden]{display:none}
</style></head><body><main><p class="eyebrow">Independent browser verifier</p><h1>Verify course completion</h1><p>Request two fields from a synthetic LearnCard sample.</p><p>Development test only. No personal credentials.</p><button id="request" disabled>Preparing request...</button><button id="cancel" class="secondary" hidden>Cancel Request</button><p id="status" class="status" role="status">Preparing the independent verifier.</p></main><script src="/client.js"></script></body></html>`;
const server = Bun.serve({
    hostname: '127.0.0.1',
    port,
    maxRequestBodySize: 64 * 1024,
    async fetch(request) {
        const url = new URL(request.url);
        const response = url.pathname.startsWith('/api/')
            ? await handler(request)
            : request.method !== 'GET'
              ? new Response('Not found', { status: 404 })
              : url.pathname === '/'
                ? new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
                : url.pathname === '/client.js'
                  ? new Response(js, { headers: { 'Content-Type': 'text/javascript' } })
                  : new Response('Not found', { status: 404 });
        response.headers.set('Cache-Control', 'no-store');
        response.headers.set(
            'Content-Security-Policy',
            "default-src 'self'; script-src 'self'; style-src 'unsafe-inline'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'"
        );
        response.headers.set('X-Content-Type-Options', 'nosniff');
        response.headers.set('Referrer-Policy', 'no-referrer');
        return response;
    },
});
console.log(`Synthetic-only independent verifier listening on loopback port ${server.port}`);
