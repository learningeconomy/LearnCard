import { generateOpenApiDocument } from 'trpc-to-openapi';
import express from 'express';
import type { Express } from 'express';

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

// Keep this path/status aligned with inboxBatchResponseMeta in helpers/inbox-batch-http.helpers.ts.
// The adapter's responseMeta returns 202 for durable batch acceptance.
const batchResponses = openApiDocument.paths?.['/inbox/issue-batch']?.post?.responses;
if (batchResponses?.['200']) {
    batchResponses['202'] = batchResponses['200'];
    delete batchResponses['200'];
}

// trpc-to-openapi requires a top-level ZodObject and cannot render the validator's
// cross-field refinement. Preserve the runtime-safe object parser while documenting
// the two mutually exclusive publication shapes for generated OpenAPI clients.
const publishRequestBody =
    openApiDocument.paths?.['/credential-refresh/publish']?.post?.requestBody;

if (publishRequestBody && !('$ref' in publishRequestBody)) {
    const publishSchema = publishRequestBody.content?.['application/json']?.schema;

    if (publishSchema && !('$ref' in publishSchema)) {
        const properties = publishSchema.properties;
        const signedCredential = properties?.signedCredential;
        const credential = properties?.credential;
        const signingAuthority = properties?.signingAuthority;

        if (!properties?.refreshId || !signedCredential || !credential || !signingAuthority) {
            throw new Error('Managed refresh publication schema is missing required properties');
        }

        const commonProperties = {
            refreshId: properties.refreshId,
            notifyHolder: properties.notifyHolder!,
            updateSummary: properties.updateSummary!,
            idempotencyKey: properties.idempotencyKey!,
        };
        // Generator 7.25.0 loses the OpenAPI 3.1 closed-object flag. Keep the
        // template workaround scoped to these mutually exclusive request branches.
        const closedPublicationBranch = {
            additionalProperties: false,
            'x-python-forbid-extra': true,
        } as const;

        // Each branch must own its complete shape. Generators do not inherit the
        // parent's properties into oneOf branches; enum also works in the pinned generator.
        publishSchema.oneOf = [
            {
                type: 'object',
                properties: {
                    ...commonProperties,
                    mode: { type: 'string', enum: ['issuer-signed'] },
                    signedCredential,
                },
                required: ['refreshId', 'mode', 'signedCredential'],
                ...closedPublicationBranch,
            },
            {
                type: 'object',
                properties: {
                    ...commonProperties,
                    mode: { type: 'string', enum: ['signing-authority'] },
                    credential,
                    signingAuthority,
                },
                required: ['refreshId', 'mode', 'credential', 'signingAuthority'],
                ...closedPublicationBranch,
            },
        ];
        delete publishSchema.properties;
        delete publishSchema.required;
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
