#!/usr/bin/env node
/**
 * Assemble Swagger UI outside src so containers never write into bind-mounted source.
 * Generated assets ship in deployment artifacts, but are not committed to Git.
 */
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const swaggerUiDistDir = path.dirname(require.resolve('swagger-ui-dist/package.json'));
const targetDir = path.join(__dirname, '../generated/swagger-ui');
const sourceDir = path.join(__dirname, '../src/swagger-ui');

fs.mkdirSync(targetDir, { recursive: true });

const vendorAssets = [
    'swagger-ui-bundle.js',
    'swagger-ui-standalone-preset.js',
    'swagger-ui.css',
    'favicon-32x32.png',
    'favicon-16x16.png',
];
const customAssets = ['index.html', 'index.css', 'swagger-initializer.js'];

for (const [directory, assets] of [
    [swaggerUiDistDir, vendorAssets],
    [sourceDir, customAssets],
]) {
    for (const asset of assets) {
        // Fail the build if a required asset is missing instead of shipping broken docs.
        const destination = path.join(targetDir, asset);
        fs.copyFileSync(path.join(directory, asset), destination);
        // Source may be read-only; generated files must remain writable on the next build.
        fs.chmodSync(destination, 0o644);
    }
}

console.log('Swagger UI assets copied to generated/swagger-ui/');
