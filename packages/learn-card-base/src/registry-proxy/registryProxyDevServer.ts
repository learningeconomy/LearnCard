import type { Plugin, ViteDevServer } from 'vite';
import handleRegistryProxyRequest, { REGISTRY_PROXY_PATH } from './registryProxy';

const installRegistryProxy = (server: Pick<ViteDevServer, 'middlewares'>): void => {
    server.middlewares.use(async (request, response, next) => {
        try {
            const url = new URL(request.url ?? '/', 'http://localhost');
            if (
                url.pathname !== REGISTRY_PROXY_PATH &&
                !url.pathname.startsWith(`${REGISTRY_PROXY_PATH}/`)
            ) {
                next();
                return;
            }

            // Reuse the deployed handler so local allowlist, methods, timeout,
            // validation, and CORS cannot drift from production.
            const proxyResponse = await handleRegistryProxyRequest(
                new Request(url, { method: request.method ?? 'GET' })
            );
            response.statusCode = proxyResponse.status;
            proxyResponse.headers.forEach((value, name) => response.setHeader(name, value));
            response.end(await proxyResponse.text());
        } catch (error) {
            next(error);
        }
    });
};

export const registryProxyDevServer = (): Plugin => ({
    name: 'registry-proxy-endpoint',
    apply: 'serve',
    configureServer: installRegistryProxy,
    configurePreviewServer: installRegistryProxy,
});
