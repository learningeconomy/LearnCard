#!/usr/bin/env node
/**
 * Copies required swagger-ui-dist assets into src/swagger-ui/ at build time.
 * This ensures the assets are available in Lambda/Docker without runtime require.resolve.
 */
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const swaggerUiDistDir = path.dirname(require.resolve('swagger-ui-dist/package.json'));
const targetDir = path.join(__dirname, '../src/swagger-ui');

const assetsToCopy = [
    'swagger-ui-bundle.js',
    'swagger-ui-standalone-preset.js',
    'swagger-ui.css',
    'favicon-32x32.png',
    'favicon-16x16.png',
];

console.log('Copying swagger-ui-dist assets to src/swagger-ui/...');

for (const asset of assetsToCopy) {
    const src = path.join(swaggerUiDistDir, asset);
    const dest = path.join(targetDir, asset);
    
    if (fs.existsSync(src)) {
        fs.copyFileSync(src, dest);
        console.log(`  ✓ ${asset}`);
    } else {
        console.warn(`  ⚠ ${asset} not found in swagger-ui-dist`);
    }
}

console.log('Done.');
