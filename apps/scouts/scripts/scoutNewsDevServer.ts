import type { Plugin, ViteDevServer } from 'vite';
import scoutNews from '../netlify/edge-functions/scout-news';

const installNewsEndpoint = (server: Pick<ViteDevServer, 'middlewares'>): void => {
    server.middlewares.use(async (request, response, next) => {
        try {
            const url = new URL(request.url ?? '/', 'http://localhost');
            if (url.pathname !== '/api/scout-news' && url.pathname !== '/api/scout-news/') {
                next();
                return;
            }

            // Reuse the deployed handler so local methods, query rejection,
            // timeout, validation, and CORS cannot drift from production.
            const newsResponse = await scoutNews(
                new Request(url, { method: request.method ?? 'GET' })
            );
            response.statusCode = newsResponse.status;
            newsResponse.headers.forEach((value, name) => response.setHeader(name, value));
            response.end(await newsResponse.text());
        } catch (error) {
            next(error);
        }
    });
};

export const scoutNewsDevServer = (): Plugin => ({
    name: 'scouts-news-endpoint',
    apply: 'serve',
    configureServer: installNewsEndpoint,
    configurePreviewServer: installNewsEndpoint,
});
