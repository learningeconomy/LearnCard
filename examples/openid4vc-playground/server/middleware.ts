/**
 * Vite plugin that mounts the playground's launch + status endpoints
 * directly on the dev server. Keeps the developer's terminal tally
 * to a single command (`pnpm dev`) without a second Express process.
 */
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Plugin } from 'vite';

import { ApiError, handleLaunch, handleStatus } from './api';
import { handleEudiProxy } from './eudi-proxy';

export const playgroundApiPlugin = (): Plugin => ({
    name: 'openid4vc-playground-api',
    configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
            const url = req.url ?? '';

            try {
                // EUDI reverse proxy intercepts before any other route \u2014
                // its handler returns true once it has written the
                // response, false if the URL didn't match its prefix.
                if (await handleEudiProxy(req, res)) return;

                if (req.method === 'POST' && url.startsWith('/api/launch')) {
                    const body = await readJson(req);
                    const result = await handleLaunch(body);
                    return sendJson(res, 200, result);
                }

                if (req.method === 'GET' && url.startsWith('/api/status')) {
                    const parsed = new URL(url, 'http://localhost');
                    const providerId = parsed.searchParams.get('providerId') ?? '';
                    const kind = (parsed.searchParams.get('kind') ?? 'vp') as 'vci' | 'vp';
                    const state = parsed.searchParams.get('state') ?? undefined;
                    const result = await handleStatus({ providerId, kind, state });
                    return sendJson(res, 200, result);
                }

                next();
            } catch (err) {
                if (err instanceof ApiError) {
                    return sendJson(res, err.statusCode, { error: err.message });
                }

                // Unknown error \u2014 log to the dev's terminal and return
                // a generic 500. The browser shows a friendly message.
                // eslint-disable-next-line no-console
                console.error('[playground-api] unhandled error', err);
                return sendJson(res, 500, {
                    error: err instanceof Error ? err.message : 'Internal server error',
                });
            }
        });
    },
});

const readJson = (req: IncomingMessage): Promise<any> =>
    new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        req.on('data', (c: Buffer) => chunks.push(c));
        req.on('end', () => {
            const raw = Buffer.concat(chunks).toString('utf8');
            if (raw.length === 0) return resolve({});
            try {
                resolve(JSON.parse(raw));
            } catch (e) {
                reject(new ApiError(400, 'Request body was not valid JSON'));
            }
        });
        req.on('error', reject);
    });

const sendJson = (res: ServerResponse, status: number, body: unknown): void => {
    res.statusCode = status;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify(body));
};
