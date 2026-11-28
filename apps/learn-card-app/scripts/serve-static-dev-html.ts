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

/**
 * React Router wraps non-node_modules modules with a refresh runtime that throws unless
 * `window.__vite_plugin_react_preamble_installed__` is set. `transformIndexHtml` only
 * injects `/@vite/client` on these standalone pages, not `inject-hmr-runtime`.
 */
export const REACT_ROUTER_HMR_PREAMBLE_IMPORT = 'virtual:react-router/inject-hmr-runtime';
const PREAMBLE_SCRIPT = `<script type="module">import "${REACT_ROUTER_HMR_PREAMBLE_IMPORT}";</script>`;

export const ensureReactRouterHmrPreamble = (html: string): string => {
    if (
        html.includes(REACT_ROUTER_HMR_PREAMBLE_IMPORT) ||
        html.includes('__vite_plugin_react_preamble_installed__')
    ) {
        return html;
    }
    const withHead = html.match(/<head[^>]*>/i);
    if (withHead?.index === undefined) return `${PREAMBLE_SCRIPT}\n${html}`;
    const insertAt = withHead.index + withHead[0].length;
    return `${html.slice(0, insertAt)}\n    ${PREAMBLE_SCRIPT}${html.slice(insertAt)}`;
};

/** Serves the allowlisted HTML files through Vite's HTML transform before React Router. */
export const serveStaticDevHtml = (root: string): Plugin => ({
    name: 'learncard-serve-static-dev-html',
    apply: 'serve',
    enforce: 'pre',
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
                const html = ensureReactRouterHmrPreamble(
                    await server.transformIndexHtml(
                        pathname,
                        await readFile(file, 'utf8'),
                        request.originalUrl
                    )
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
