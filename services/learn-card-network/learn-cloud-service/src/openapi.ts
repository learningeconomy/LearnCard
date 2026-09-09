import { generateOpenApiDocument } from 'trpc-to-openapi';
import express, { type Express } from 'express';
import path from 'path';

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
// Serve custom config files (index.html, swagger-initializer.js) from local dir first
app.use('/', express.static('src/swagger-ui'));
// Serve swagger-ui assets (JS bundles, CSS) from npm package
app.use('/', express.static(path.dirname(require.resolve('swagger-ui-dist/package.json'))));
app.get('/openapi.json', (_req, res) => res.json(openApiDocument));

export default app;
