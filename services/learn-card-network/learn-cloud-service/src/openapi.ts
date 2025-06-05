import { generateOpenApiDocument } from 'trpc-to-openapi';
import express from 'express';

import { appRouter } from './app';

// Generate OpenAPI schema document
export const openApiDocument = generateOpenApiDocument(appRouter, {
    title: 'LearnCloud Storage API',
    description: 'API for interacting with LearnCloud Storage',
    version: '1.0.0',
    baseUrl: '../api',
    docsUrl: 'https://docs.learncard.com',
    tags: ['Storage', 'Index', 'User', 'Custom Storage', 'Utilities'],
});

export const app = express();
app.use('/', express.static('src/swagger-ui'));
app.get('/openapi.json', (_req, res) => res.json(openApiDocument));

export default app;
