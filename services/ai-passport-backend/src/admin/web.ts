import { resolve } from 'node:path';
const assets = new Map([
    ['/admin', 'index.html'],
    ['/admin/', 'index.html'],
    ['/admin/assets/admin.js', 'admin.js'],
    ['/admin/assets/admin.css', 'admin.css'],
]);
const directory = resolve(import.meta.dir, '../../dist/admin');
export async function handleAdminWeb(req: Request): Promise<Response | null> {
    const path = new URL(req.url).pathname;
    if (path !== '/admin' && path !== '/admin/' && !path.startsWith('/admin/assets/')) return null;
    const headers = {
        'Cache-Control': 'no-store',
        'Content-Security-Policy':
            "default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data:; font-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'",
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'no-referrer',
    };
    if (process.env.EMBEDDINGS_ADMIN_ENABLED !== 'true')
        return new Response('Not found', { status: 404, headers });
    if (req.method !== 'GET' && req.method !== 'HEAD')
        return new Response('Method not allowed', { status: 405, headers });
    const name = assets.get(path);
    if (!name) return new Response('Not found', { status: 404, headers });
    const file = Bun.file(resolve(directory, name));
    if (!(await file.exists()))
        return new Response('Admin bundle unavailable', { status: 503, headers });
    return new Response(req.method === 'HEAD' ? null : file, {
        headers: {
            ...headers,
            'Content-Type': name.endsWith('.html')
                ? 'text/html; charset=utf-8'
                : name.endsWith('.js')
                  ? 'text/javascript; charset=utf-8'
                  : 'text/css; charset=utf-8',
        },
    });
}
