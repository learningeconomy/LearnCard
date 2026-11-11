import { readFile, writeFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { createServer, loadConfigFromFile } from 'vite';
import type { Plugin } from 'vite';
import { z } from 'zod';
import { APP_ROOT } from './constants';
import { verificationBrandingPlugin } from './branding';
import { readStackEndpoints } from './stack';
import { processIdentity } from './process';

// This is a direct child entrypoint, not imported by lc. The real app configuration,
// transforms and source modules are unchanged; only deployment configuration differs.
const start = async (): Promise<void> => {
    const [directory, token] = process.argv.slice(2);
    if (!directory || !token || !/^[a-f0-9]{32}$/.test(token))
        throw new Error('Verification directory/token required');
    const app = APP_ROOT;
    z.object({
        token: z.literal(token),
        directory: z.literal(directory),
        phase: z.literal('starting'),
    }).parse(JSON.parse(await readFile(join(directory, 'state.json'), 'utf8')));
    const identity = processIdentity(process.pid);
    if (!identity) throw new Error('Cannot identify verification frontend process');
    await writeFile(
        join(directory, 'frontend-process.json'),
        JSON.stringify({
            token,
            identity,
        }),
        { mode: 0o600 }
    );
    const stack = await readStackEndpoints(directory);
    const tenant = await readFile(join(directory, 'tenant-config.json'), 'utf8');
    const html = await readFile(join(directory, 'index.html'), 'utf8');
    const overlay: Plugin = {
        name: 'lc-verification-tenant',
        enforce: 'pre',
        configureServer(server) {
            server.middlewares.use((request, response, next) => {
                const url = new URL(request.url ?? '/', stack.app);
                const pathname = url.pathname;
                if (
                    pathname === '/tenant-config.json' ||
                    pathname === '/__tenant-config' ||
                    pathname === '/__verification'
                ) {
                    response.setHeader('Content-Type', 'application/json');
                    response.setHeader('Cache-Control', 'no-store');
                    response.end(
                        pathname === '/__verification' ? JSON.stringify({ token }) : tenant
                    );
                    return;
                }
                // Serve the production template through Vite's own transforms, without
                // creating/replacing app/index.html (another stack or lc dev may own it).
                if (
                    (request.method === 'GET' || request.method === 'HEAD') &&
                    !url.searchParams.has('html-proxy') &&
                    (pathname === '/' ||
                        pathname === '/index.html' ||
                        (!extname(pathname) && request.headers.accept?.includes('text/html')))
                ) {
                    void server
                        .transformIndexHtml('/index.html', html, request.url)
                        .then(transformed => {
                            response.setHeader('Content-Type', 'text/html; charset=utf-8');
                            response.setHeader('Cache-Control', 'no-store');
                            response.end(request.method === 'HEAD' ? undefined : transformed);
                        }, next);
                    return;
                }
                next();
            });
        },
    };
    // Vite's config factory reads .env itself. Override every sanctioned setting it
    // consumes, and disable Vite's second env import so user VITE_* values cannot leak.
    Object.assign(process.env, {
        VITE_ENABLE_AUTH_DEBUG_WIDGET: 'false',
        VITE_CREDENTIAL_REFRESH_LOCAL_QA: 'true',
        VITE_DOCKER_SOURCE: 'true',
        VITE_AI_AGENT_URL: `http://localhost:${stack.ports.api}`,
        ANALYZE: 'false',
        CHOKIDAR_USEPOLLING: 'false',
        CHOKIDAR_INTERVAL: '1000',
    });
    // Bun loads TypeScript with development exports. Vite's default bundler ignores
    // that condition while externalizing config imports and requires stale dist builds.
    const loaded = await loadConfigFromFile(
        { command: 'serve', mode: 'development', isSsrBuild: false, isPreview: false },
        join(app, 'vite.config.mts'),
        app,
        undefined,
        undefined,
        'native'
    );
    if (!loaded) throw new Error('LearnCard Vite configuration not found');
    const resolved = loaded.config;
    const server = await createServer({
        ...resolved,
        root: app,
        configFile: false,
        envFile: false,
        mode: 'development',
        cacheDir: join(directory, 'vite-cache'),
        optimizeDeps: {
            ...resolved.optimizeDeps,
            // The checkout intentionally has no generated index.html. Scan the tracked
            // template instead; /src imports still resolve against the real app root.
            entries: [join(app, 'index.template.html')],
        },
        plugins: [overlay, verificationBrandingPlugin(), ...(resolved.plugins ?? [])],
        server: {
            ...resolved.server,
            host: '127.0.0.1',
            port: stack.ports.app,
            strictPort: true,
            open: false,
        },
    });
    const shutdown = async (): Promise<void> => {
        await server.close();
        process.exit(0);
    };
    process.once('SIGINT', () => {
        void shutdown();
    });
    process.once('SIGTERM', () => {
        void shutdown();
    });
    await server.listen();
    server.printUrls();
};

void start().catch(error => {
    console.error(error);
    process.exit(1);
});
