import { OpenAPIV3 } from 'openapi-types';
import { generateOpenApiDocument } from 'better-trpc-openapi';
import express from 'express';

import { appRouter } from './app';

// Generate OpenAPI schema document
export const openApiDocument: OpenAPIV3.Document<{}> = generateOpenApiDocument(appRouter, {
    title: 'LearnCloud',
    description: 'This is the API for interacting with a LearnCloud Service',
    version: '1.0.0',
    baseUrl: '../api',
    docsUrl: 'https://docs.learncard.com',
    tags: ['Index', 'Utilities'],
});

export const app = express();
app.use('/', express.static('src/swagger-ui'));
app.get('/openapi.json', (_req, res) => res.json(openApiDocument));

export default app;
