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
import {
    createShareContentRuntimeFromEnvironment,
    registerShareContentRoutes,
    type ShareContentRuntime,
} from './share-content';

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

// Serve generated assets outside the bind-mounted source tree.
server.register(fastifyStatic, {
    root: path.join(__dirname, '../generated/swagger-ui'),
    prefix: '/docs/',
});

server.register(didFastifyPlugin);
server.register(xapiFastifyPlugin);
server.register(oidcFastifyPlugin);

(async () => {
    let shareContentRuntime: ShareContentRuntime | null = null;

    try {
        // Disabled by default: this performs no Mongo/Redis/index work unless an
        // operator explicitly enables the routes with a valid configuration.
        shareContentRuntime = await createShareContentRuntimeFromEnvironment();

        if (shareContentRuntime.enabled) {
            await registerShareContentRoutes(server, shareContentRuntime);
        }

        console.log('Server starting on port ', environment.PORT || 3000);
        await server.listen({ host: '0.0.0.0', port: Number(environment.PORT || 3000) });
    } catch (err) {
        if (shareContentRuntime?.enabled) {
            await shareContentRuntime.close().catch(() => {});
        }

        console.error(err);
        process.exit(1);
    }
})();
