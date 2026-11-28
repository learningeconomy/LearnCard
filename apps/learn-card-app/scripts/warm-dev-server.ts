import type { Plugin, ViteDevServer } from 'vite';

/**
 * Playwright and `lc verify` treat "the HTML document is 200" as ready. On a cold Vite
 * 8 server, the first sign-in still discovers pre-bundle chunks and triggers
 * "optimized dependencies changed. reloading", which aborts `import('/src/entry.client.tsx')`.
 * Warm these entries after listen and expose a readiness URL that stays 503 until that
 * reload has already happened, with no browser attached.
 */
export const DEV_SERVER_READY_PATH = '/__lc-dev-ready';

export const DEV_SERVER_WARMUP_URLS = [
    '/src/entry.client.tsx',
    '/src/root.tsx',
    '/src/App.tsx',
    // App lazy-imports FullApp; warmupRequest only follows static imports, so the
    // first sign-in used to discover this graph in the browser and abort Firefox's
    // module import (the page stays on the HydrateFallback "Loading").
    '/src/FullApp.tsx',
    '/src/Routes.tsx',
    '/src/pages/developer/DeveloperSignInPage.tsx',
    '/src/components/app-url-listener/AppUrlListener.tsx',
] as const;

const IMPORT_SPEC_RE =
    /(?:(?:import|export)\s+(?:type\s+)?(?:[^'"();]+from\s*)?|import\s*\(\s*)["']([^"']+)["']/g;

/** Pull same-origin import/export specifiers out of a Vite HTML or JS response. */
export const importSpecsInModule = (source: string, base: string): string[] => {
    const found: string[] = [];
    for (const match of source.matchAll(new RegExp(IMPORT_SPEC_RE, 'g'))) {
        const spec = match[1];
        if (!spec || spec.startsWith('data:')) continue;
        try {
            found.push(new URL(spec, base).href);
        } catch {
            // Invalid specifier; skip.
        }
    }
    return found;
};

export const originForViteServer = (server: ViteDevServer): string => {
    const address = server.httpServer?.address();
    const port = typeof address === 'object' && address ? address.port : server.config.server.port;
    if (!port) throw new Error('Vite server is not listening');
    return `http://127.0.0.1:${port}`;
};

/**
 * Sequentially fetch the sign-in document and its JS graph over HTTP. A first
 * Firefox tab otherwise bursts dozens of still-cold @fs modules and hangs on
 * Loading until those transforms finish (or deadlock under the 6-connection cap).
 */
const HTTP_WARMUP_SEEDS = [
    '/developer/sign-in',
    '/@react-router/critical.css?pathname=/developer/sign-in',
    '/@id/__x00__virtual:react-router/inject-hmr-runtime',
    '/@id/__x00__virtual:react-router/browser-manifest',
    ...DEV_SERVER_WARMUP_URLS,
] as const;

const isAppModule = (pathname: string): boolean =>
    pathname.startsWith('/src/') || pathname.startsWith('/@fs/') || pathname.startsWith('/@id/');

export const warmViteDevServerThroughHttp = async (
    origin: string,
    seeds: readonly string[] = HTTP_WARMUP_SEEDS
): Promise<void> => {
    const seen = new Set<string>();
    const high: string[] = [];
    const low: string[] = [];
    const enqueue = (href: string): void => {
        try {
            const url = new URL(href);
            if (url.origin !== origin || url.pathname === DEV_SERVER_READY_PATH) return;
            // Pre-bundled deps are cheap for the browser; spend warmup on app/workspace graphs.
            if (url.pathname.includes('/node_modules/')) return;
            (isAppModule(url.pathname) ? high : low).push(href);
        } catch {
            // Invalid URL; skip.
        }
    };
    for (const seed of seeds) enqueue(new URL(seed, origin).href);
    while (high.length > 0 || low.length > 0) {
        const href = high.shift() ?? low.shift()!;
        if (seen.has(href)) continue;
        seen.add(href);
        const response = await fetch(href).catch(() => undefined);
        if (!response?.ok) continue;
        const contentType = response.headers.get('content-type') ?? '';
        if (!/javascript|ecmascript|html|xml|css/.test(contentType)) continue;
        const text = await response.text();
        if (/javascript|ecmascript|html|xml/.test(contentType)) {
            for (const next of importSpecsInModule(text, href)) enqueue(next);
        }
    }
};

export const warmViteDevServer = async (server: ViteDevServer): Promise<void> => {
    for (const url of DEV_SERVER_WARMUP_URLS) await server.warmupRequest(url);
    // warmupRequest only waits for that URL. Static imports are queued as further
    // warmup work and would otherwise still be transforming when /__lc-dev-ready
    // flipped, so the first Firefox document could hang on Loading.
    await server.environments.client.waitForRequestsIdle();
    await warmViteDevServerThroughHttp(originForViteServer(server));
    await server.environments.client.waitForRequestsIdle();
};

export const warmDevServer = (): Plugin => {
    let ready = false;
    let warming: Promise<void> | undefined;

    const startWarmup = (server: ViteDevServer): void => {
        warming ??= warmViteDevServer(server)
            .then(() => {
                ready = true;
            })
            .catch(error => {
                warming = undefined;
                throw error;
            });
    };

    return {
        name: 'learncard-warm-dev-server',
        apply: 'serve',
        configureServer(server) {
            const onListen = (): void => {
                startWarmup(server);
            };
            if (server.httpServer?.listening) onListen();
            else server.httpServer?.once('listening', onListen);
            return () => {
                if (server.httpServer?.listening) onListen();
                else server.httpServer?.once('listening', onListen);
                server.middlewares.use((request, response, next) => {
                    const pathname = new URL(request.url ?? '/', 'http://localhost').pathname;
                    if (pathname !== DEV_SERVER_READY_PATH) {
                        next();
                        return;
                    }
                    if (!ready) {
                        response.statusCode = 503;
                        response.setHeader('Cache-Control', 'no-store');
                        response.end('warming');
                        return;
                    }
                    response.statusCode = 200;
                    response.setHeader('Cache-Control', 'no-store');
                    response.end('ready');
                });
            };
        },
    };
};
