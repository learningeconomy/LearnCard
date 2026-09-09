import { generateOpenApiDocument } from 'trpc-to-openapi';
import express, { type Express } from 'express';

import { appRouter } from './app';

// Generate OpenAPI schema document
export const openApiDocument = generateOpenApiDocument(appRouter, {
    title: 'LearnCloud Storage API',
    description: 'API for interacting with LearnCloud Storage',
    version: '1.0.0',
    baseUrl: '/api',
    docsUrl: 'https://docs.learncard.com',
    tags: ['Storage', 'Index', 'User', 'Custom Storage', 'Utilities'],
});

export const app: Express = express();
// Serve all swagger-ui assets from local dir (copied at build time from swagger-ui-dist)
// This ensures assets are available in Lambda/Docker without runtime require.resolve
app.use('/', express.static('src/swagger-ui'));
app.get('/openapi.json', (_req, res) => res.json(openApiDocument));

export default app;
