import { OpenAPIV3 } from 'openapi-types';
import { generateOpenApiDocument } from 'trpc-openapi';
import express, { Express } from 'express';

import { appRouter } from './app';

// Generate OpenAPI schema document
export const openApiDocument: OpenAPIV3.Document<{}> = generateOpenApiDocument(appRouter, {
    title: 'LearnCard App API',
    description: 'This is the API for interacting with a LearnCard App API',
    version: '1.0.0',
    baseUrl: '../api',
    docsUrl: 'https://docs.learncard.com',
    tags: ['Notifications', 'AI', 'Utilities', 'Signing Authority', 'Credentials'],
});

export const app: Express = express();
app.use('/', express.static('src/swagger-ui'));
app.get('/openapi.json', (_req, res) => res.json(openApiDocument));

export default app;
