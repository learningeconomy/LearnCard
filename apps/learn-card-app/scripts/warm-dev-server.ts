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
 * Sequentially fetch the sign-in document and the app's `/src/` graph over HTTP.
 * A first Firefox tab otherwise bursts still-cold app modules and hangs on
 * Loading (or deadlocks under HTTP/1.1's 6-connection cap).
 *
 * Do not recursively walk `/@fs/` workspace packages. That crawl pulled ~2000
 * package modules, discovered lazy-route deps (xterm, streamdown, …), and
 * triggered repeated "optimized dependencies changed. reloading" cycles that
 * blew the 240s verification readiness budget when three shards ran at once.
 * `warmupRequest(FullApp)` plus `waitForRequestsIdle` already transforms the
 * static package graph those routes need.
 */
// FullApp and Routes are still in DEV_SERVER_WARMUP_URLS (warmupRequest +
// waitForRequestsIdle). Seeding them here would walk the entire /src graph
// over HTTP (~2000 modules, ~50s) and is what blew the CI readiness budget.
const HTTP_WARMUP_SEEDS = [
    '/developer/sign-in',
    '/@react-router/critical.css?pathname=/developer/sign-in',
    '/@id/__x00__virtual:react-router/inject-hmr-runtime',
    '/@id/__x00__virtual:react-router/browser-manifest',
    '/src/entry.client.tsx',
    '/src/root.tsx',
    '/src/App.tsx',
    '/src/pages/developer/DeveloperSignInPage.tsx',
    '/src/components/app-url-listener/AppUrlListener.tsx',
] as const;

const HTTP_WARMUP_SKIP_PREFIXES = ['/src/FullApp.tsx', '/src/Routes.tsx'] as const;

const isAppModule = (pathname: string): boolean =>
    pathname.startsWith('/src/') || pathname.startsWith('/@id/');

/** Follow imports from the sign-in document and app/virtual modules, not @fs packages. */
export const shouldFollowHttpWarmupImports = (pathname: string): boolean => {
    if (HTTP_WARMUP_SKIP_PREFIXES.some(skip => pathname === skip || pathname.endsWith(skip))) {
        return false;
    }
    return (
        pathname === '/' ||
        pathname.startsWith('/src/') ||
        pathname.startsWith('/@id/') ||
        pathname.startsWith('/@react-router/') ||
        pathname.startsWith('/developer/')
    );
};

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
    const started = performance.now();
    while (high.length > 0 || low.length > 0) {
        const href = high.shift() ?? low.shift()!;
        if (seen.has(href)) continue;
        seen.add(href);
        const response = await fetch(href).catch(() => undefined);
        if (!response?.ok) continue;
        const contentType = response.headers.get('content-type') ?? '';
        if (!/javascript|ecmascript|html|xml|css/.test(contentType)) continue;
        const text = await response.text();
        const pathname = new URL(href).pathname;
        if (
            /javascript|ecmascript|html|xml/.test(contentType) &&
            shouldFollowHttpWarmupImports(pathname)
        ) {
            for (const next of importSpecsInModule(text, href)) enqueue(next);
        }
    }
    let src = 0;
    let fs = 0;
    let id = 0;
    let other = 0;
    for (const href of seen) {
        const pathname = new URL(href).pathname;
        if (pathname.startsWith('/src/')) src += 1;
        else if (pathname.startsWith('/@fs/')) fs += 1;
        else if (pathname.startsWith('/@id/')) id += 1;
        else other += 1;
    }
    const ms = Math.round(performance.now() - started);
    console.info(
        `[warm] http crawl ${seen.size} urls (src=${src} fs=${fs} id=${id} other=${other}) in ${ms}ms`
    );
};

// vite.config.mts (loaded by Vite's config loader) and verification/server.ts each get
// their own instance of this module, so the registry lives on globalThis.
const WARMUP_REGISTRY = Symbol.for('learncard.warmViteDevServer');
const warmupByServer: WeakMap<ViteDevServer, Promise<void>> = ((
    globalThis as Record<symbol, unknown>
)[WARMUP_REGISTRY] ??= new WeakMap()) as WeakMap<ViteDevServer, Promise<void>>;

export const warmViteDevServer = async (server: ViteDevServer): Promise<void> => {
    const existing = warmupByServer.get(server);
    if (existing) return existing;
    const warmup = (async () => {
        const started = performance.now();
        for (const url of DEV_SERVER_WARMUP_URLS) await server.warmupRequest(url);
        // warmupRequest only waits for that URL. Static imports are queued as further
        // warmup work and would otherwise still be transforming when /__lc-dev-ready
        // flipped, so the first Firefox document could hang on Loading.
        await server.environments.client.waitForRequestsIdle();
        const afterSeed = Math.round(performance.now() - started);
        console.info(`[warm] warmupRequest+idle in ${afterSeed}ms`);
        const origin = originForViteServer(server);
        // The first HTML fetch discovers prebundle entries and can reload. Do that
        // once, then wait, so the HTTP crawl is not aborted mid-walk.
        await fetch(`${origin}/developer/sign-in`).catch(() => undefined);
        await server.environments.client.waitForRequestsIdle();
        const afterPrime = Math.round(performance.now() - started);
        console.info(`[warm] primed sign-in+idle in ${afterPrime - afterSeed}ms`);
        await warmViteDevServerThroughHttp(origin);
        const afterCrawl = Math.round(performance.now() - started);
        await server.environments.client.waitForRequestsIdle();
        const total = Math.round(performance.now() - started);
        console.info(`[warm] final idle in ${total - afterCrawl}ms; total ${total}ms`);
    })();
    // The plugin's listen hook and verification/server.ts both call this for the same
    // server; share one warmup instead of crawling twice concurrently. Forget a failed
    // attempt so a retry can start over.
    warmupByServer.set(server, warmup);
    warmup.catch(() => warmupByServer.delete(server));
    await warmup;
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
