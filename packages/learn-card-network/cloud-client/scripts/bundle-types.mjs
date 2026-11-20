import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { rollup } from 'rollup';
import dts from 'rollup-plugin-dts';
import ts from 'typescript';

import { bundleClientTypes } from '../../scripts/bundleClientTypes.mjs';

const result = await bundleClientTypes({
    rollup,
    dts,
    ts,
    packageDir: path.join(path.dirname(fileURLToPath(import.meta.url)), '..'),
    // Types inlined into dist/index.d.ts so consumers do not need these packages.
    inline: ['@learncard/learn-cloud-service', 'mongodb', 'bson'],
    // The only packages the published declarations may import; all are `dependencies`.
    allowedExternals: ['@trpc/client', '@trpc/server'],
});

console.log(
    `Bundled client types: ${(result.bytes / 1024).toFixed(0)} KB, imports ${result.imports.join(', ')}`
);
