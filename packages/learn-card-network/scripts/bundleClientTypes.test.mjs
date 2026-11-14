import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, writeFile, access } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import ts from 'typescript';

import { bundleClientTypes, getDeclarationImports } from './bundleClientTypes.mjs';

const forms = [
    ['named import', "import type { Router } from '@server/router';"],
    ['re-export', "export type { Router } from '@server/router';"],
    ['side-effect import', "import '@server/router';"],
    ['inline import type', "export type Client = import('@server/router').Router;"],
    ['typeof import', "export type Client = typeof import('@server/router');"],
    ['import equals', "import Router = require('@server/router');"],
    ['type reference directive', '/// <reference types="@server/router" />'],
    ['escaped module specifier', String.raw`import type { Router } from '@server\u002frouter';`],
];

for (const [name, source] of forms) {
    test(`rejects an undeclared package in a ${name}`, async () => {
        const packageDir = await mkdtemp(path.join(os.tmpdir(), 'lc-type-guard-'));
        const dist = path.join(packageDir, 'dist');
        const entry = path.join(dist, 'index.d.ts');
        const bundled = path.join(dist, 'index.bundled.d.ts');
        try {
            await mkdir(dist);
            await writeFile(entry, 'export type Original = string;');
            await assert.rejects(
                bundleClientTypes({
                    // Emulate emitted Rollup output so every legal declaration form reaches
                    // the guard, regardless of how today's rollup-plugin-dts formats it.
                    rollup: async () => ({
                        write: async ({ file }) => writeFile(file, source),
                        close: async () => {},
                    }),
                    dts: () => ({ name: 'fixture' }),
                    ts,
                    packageDir,
                    inline: [],
                    allowedExternals: ['@trpc/client'],
                }),
                /would import @server\/router\. Published client types may only import/
            );
            assert.equal(await readFile(entry, 'utf8'), 'export type Original = string;');
            await assert.rejects(access(bundled), { code: 'ENOENT' });
        } finally {
            await rm(packageDir, { recursive: true, force: true });
        }
    });
}

test('normalizes package subpaths and finds nested imports across comments and newlines', () => {
    const source = `
        import type { A } from '@trpc/server/observable';
        export { B } from '@trpc/server';
        export * from 'zod/v4';
        export interface Result {
            value: Promise<import /* formatting */ (
                '@learncard/types'
            ).VC>;
        }
    `;
    assert.deepEqual([...getDeclarationImports(source, ts)].sort(), [
        '@learncard/types',
        '@trpc/server',
        'zod',
    ]);
});

test('does not mistake comments or string literal types for imports', () => {
    const source = `
        // import '@server/comment';
        /* export { Router } from '@server/comment'; */
        export type Text = "import('@server/literal').Router";
    `;
    assert.deepEqual([...getDeclarationImports(source, ts)], []);
});

test('keeps relative imports visible to the self-containment guard', () => {
    assert.deepEqual([...getDeclarationImports("export * from './server';", ts)], ['./server']);
});
