import { resolve } from 'node:path';
import { configureOfflineSchemaEnvironment } from './offline-schema-environment';

const output = process.argv[2];
if (!output)
    throw new Error('Usage: bun --conditions=development scripts/export-openapi.ts OUTPUT');

// Schema export registers routes, but never calls them or loads local credentials.
configureOfflineSchemaEnvironment();

// Static imports would initialize the router before service credentials are removed.
const { openApiDocument } = await import('../src/openapi');

await Bun.write(
    resolve(output),
    `${JSON.stringify(openApiDocument, null, 2)}
`
);
console.log(`Exported ${Object.keys(openApiDocument.paths ?? {}).length} local OpenAPI paths`);
process.exit(0);
