import { environment } from '@environment';
import path from 'path';

import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import fastifyCors from '@fastify/cors';
import { fastifyTRPCPlugin, FastifyTRPCPluginOptions } from '@trpc/server/adapters/fastify';
import { fastifyTRPCOpenApiPlugin, CreateOpenApiFastifyPluginOptions } from 'trpc-to-openapi';
import { appRouter, type AppRouter, createContext } from './app';
import { openApiDocument } from './openapi';
import { didFastifyPlugin } from './dids';
import { xapiFastifyPlugin } from './xapi';
import { oidcFastifyPlugin } from './oidc';

const server = Fastify({ maxParamLength: 5000 });

server.register(fastifyCors);

server.register(fastifyTRPCPlugin, {
    prefix: '/trpc',
    trpcOptions: {
        allowMethodOverride: true,
        router: appRouter,
        createContext,
        onError({ path, error }) {
            // report to error monitoring
            console.error(`Error in tRPC handler on path '${path}':`, error);
        },
    } satisfies FastifyTRPCPluginOptions<AppRouter>['trpcOptions'],
});

server.register(fastifyTRPCOpenApiPlugin, {
    basePath: '/api',
    router: appRouter,
    createContext,
    onError({ path, error }) {
        // report to error monitoring
        console.error(`Error in API handler on path '${path}':`, error);
    },
} satisfies CreateOpenApiFastifyPluginOptions<AppRouter>);

server.get('/docs/openapi.json', () => openApiDocument);

// Serve swagger-ui assets (JS bundles, CSS) from npm package
server.register(fastifyStatic, {
    root: path.dirname(require.resolve('swagger-ui-dist/package.json')),
    prefix: '/docs/',
});

// Serve custom config files from local dir (override npm defaults)
const customSwaggerDir = path.join(__dirname, '../src/swagger-ui');
server.get('/docs/', async (_req, reply) => {
    return reply.sendFile('index.html', customSwaggerDir);
});
server.get('/docs/index.html', async (_req, reply) => {
    return reply.sendFile('index.html', customSwaggerDir);
});
server.get('/docs/swagger-initializer.js', async (_req, reply) => {
    return reply.sendFile('swagger-initializer.js', customSwaggerDir);
});
server.get('/docs/index.css', async (_req, reply) => {
    return reply.sendFile('index.css', customSwaggerDir);
});

server.register(didFastifyPlugin);
server.register(xapiFastifyPlugin);
server.register(oidcFastifyPlugin);

(async () => {
    try {
        console.log('Server starting on port ', environment.PORT || 3000);
        await server.listen({ host: '0.0.0.0', port: Number(environment.PORT || 3000) });
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
})();
