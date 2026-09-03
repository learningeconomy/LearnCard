import { generateOpenApiDocument } from 'trpc-to-openapi';
import express, { type Express } from 'express';

import { appRouter } from './app';

// Generate OpenAPI schema document
export const openApiDocument = generateOpenApiDocument(appRouter, {
    title: 'LearnCloud Network API',
    description: 'API for interacting with LearnCloud Network',
    version: '1.0.0',
    baseUrl: '/api',
    docsUrl: 'https://docs.learncard.com',
    tags: [
        'Profiles',
        'Profile Managers',
        'Credentials',
        'Boosts',
        'Presentations',
        'Storage',
        'Contracts',
        'DID Metadata',
        'Claim Hooks',
        'Auth Grants',
        'Utilities',
    ],
});

// trpc-to-openapi requires a top-level ZodObject and cannot render the validator's
// cross-field refinement. Preserve the runtime-safe object parser while documenting
// the two mutually exclusive publication shapes for generated OpenAPI clients.
const publishRequestBody =
    openApiDocument.paths?.['/credential-refresh/publish']?.post?.requestBody;

if (publishRequestBody && !('$ref' in publishRequestBody)) {
    const publishSchema = publishRequestBody.content?.['application/json']?.schema;

    if (publishSchema && !('$ref' in publishSchema)) {
        publishSchema.oneOf = [
            {
                properties: { mode: { const: 'issuer-signed' } },
                required: ['signedCredential'],
                not: {
                    anyOf: [{ required: ['credential'] }, { required: ['signingAuthority'] }],
                },
            },
            {
                properties: { mode: { const: 'signing-authority' } },
                required: ['credential', 'signingAuthority'],
                not: { required: ['signedCredential'] },
            },
        ];
    }
}

const SCALAR_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <title>LearnCloud Network API</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body>
    <script id="api-reference" data-url="./docs/openapi.json"></script>
    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
</body>
</html>`;

export const app: Express = express();

app.get('/openapi.json', (_req, res) => res.json(openApiDocument));

app.get('/', (_req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.send(SCALAR_HTML);
});

export default app;
