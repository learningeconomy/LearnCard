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
    '/src/Routes.tsx',
    '/src/pages/developer/DeveloperSignInPage.tsx',
] as const;

export const warmViteDevServer = async (server: ViteDevServer): Promise<void> => {
    for (const url of DEV_SERVER_WARMUP_URLS) await server.warmupRequest(url);
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
