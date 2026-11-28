import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join, normalize, relative, sep } from 'node:path';
import type { Plugin } from 'vite';

/**
 * Playwright mock specs load these as plain Vite pages. React Router's dev middleware owns
 * every HTML request and would otherwise send the app shell (`src/root.tsx`) instead.
 */
export const STATIC_DEV_HTML_PAGES = [
    'recovery-prompt-harness.html',
    'school-connect-harness.html',
    'transcript-arrival-harness.html',
    'transcript-flow-harness.html',
] as const;

/** Resolves a request path to an allowlisted file under `root`, or `undefined`. */
export const staticDevHtmlFile = (root: string, pathname: string): string | undefined => {
    const decoded = decodeURIComponent(pathname);
    if (!decoded.startsWith('/') || decoded.includes('\\') || decoded.includes('\0'))
        return undefined;
    const relativePath = decoded.slice(1);
    if (!(STATIC_DEV_HTML_PAGES as readonly string[]).includes(relativePath)) return undefined;
    const file = normalize(join(root, relativePath));
    const fromRoot = relative(root, file);
    if (!fromRoot || fromRoot.startsWith('..') || fromRoot.split(sep).includes('..'))
        return undefined;
    return existsSync(file) ? file : undefined;
};

/** Serves the allowlisted HTML files through Vite's HTML transform before React Router. */
export const serveStaticDevHtml = (root: string): Plugin => ({
    name: 'learncard-serve-static-dev-html',
    apply: 'serve',
    configureServer(server) {
        server.middlewares.use(async (request, response, next) => {
            if (request.method !== 'GET' && request.method !== 'HEAD') {
                next();
                return;
            }
            const pathname = new URL(request.url ?? '/', 'http://localhost').pathname;
            const file = staticDevHtmlFile(root, pathname);
            if (!file) {
                next();
                return;
            }
            try {
                const html = await server.transformIndexHtml(
                    pathname,
                    await readFile(file, 'utf8'),
                    request.originalUrl
                );
                response.setHeader('Content-Type', 'text/html; charset=utf-8');
                response.setHeader('Cache-Control', 'no-store');
                response.end(request.method === 'HEAD' ? undefined : html);
            } catch (error) {
                next(error);
            }
        });
    },
});
