import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { expect, test } from 'vitest';
import type { BuildContext } from '@trigger.dev/build';
import type { Plugin } from 'esbuild';

import triggerConfig from '../trigger.config';

// Exercise the same esbuild dependency that the installed Trigger CLI uses.
const require = createRequire(import.meta.url);
const triggerRequire = createRequire(require.resolve('trigger.dev/package.json'));
const { build } = triggerRequire('esbuild') as typeof import('esbuild');

test('bundles workspace source while Node loads compiled external packages', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'trigger-export-conditions-'));
    try {
        const workspace = join(directory, 'node_modules/workspace-fixture');
        const external = join(directory, 'node_modules/@learncard/didkit-plugin-node');
        await mkdir(workspace, { recursive: true });
        await mkdir(external, { recursive: true });
        await writeFile(
            join(workspace, 'package.json'),
            JSON.stringify({
                name: 'workspace-fixture',
                exports: { development: './source.js', default: './unbuilt.js' },
            })
        );
        await writeFile(join(workspace, 'source.js'), 'export default "workspace-source";');
        await writeFile(
            join(external, 'package.json'),
            JSON.stringify({
                name: '@learncard/didkit-plugin-node',
                exports: { development: './source.js', default: './index.cjs' },
            })
        );
        await writeFile(
            join(external, 'source.js'),
            'throw new Error("Published source must not run in the worker");'
        );
        await writeFile(join(external, 'index.cjs'), 'module.exports = "compiled-native";');
        const entry = join(directory, 'task.js');
        await writeFile(
            entry,
            'import workspace from "workspace-fixture"; ' +
                'import native from "@learncard/didkit-plugin-node"; ' +
                'console.log(JSON.stringify({ workspace, native }));'
        );

        const plugins: Plugin[] = [];
        const context = {
            registerPlugin: (plugin: Plugin) => plugins.push(plugin),
        } as unknown as BuildContext;
        for (const extension of triggerConfig.build?.extensions ?? []) {
            await extension.onBuildStart?.(context);
        }
        const output = join(directory, 'task.mjs');
        await build({
            entryPoints: [entry],
            outfile: output,
            bundle: true,
            platform: 'node',
            format: 'esm',
            conditions: triggerConfig.build?.conditions ?? [],
            external: triggerConfig.build?.external ?? [],
            plugins,
        });

        // Trigger propagates build.conditions to its Node worker as --conditions flags.
        const worker = spawnSync(
            process.execPath,
            [
                ...(triggerConfig.build?.conditions ?? []).map(value => `--conditions=${value}`),
                output,
            ],
            { encoding: 'utf8', env: { PATH: process.env.PATH }, timeout: 10_000 }
        );
        expect(worker.status, worker.stderr).toBe(0);
        expect(JSON.parse(worker.stdout)).toEqual({
            workspace: 'workspace-source',
            native: 'compiled-native',
        });
    } finally {
        await rm(directory, { recursive: true, force: true });
    }
});
