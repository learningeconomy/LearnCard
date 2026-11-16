#!/usr/bin/env node

/** Prove workspace clients use source even when a local dist happens to exist. */
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const clients = [
    ['@learncard/network-brain-client', 'brain-client'],
    ['@learncard/learn-cloud-client', 'cloud-client'],
];
for (const [name, directory] of clients) {
    const source = `export { getClient, getApiTokenClient } from '${name}';`;
    const { metafile } = await build({
        absWorkingDir: root,
        stdin: { contents: source, resolveDir: root },
        conditions: ['development'],
        platform: 'browser',
        format: 'esm',
        bundle: true,
        write: false,
        metafile: true,
    });
    const inputs = Object.keys(metafile.inputs);
    assert(
        inputs.some(file => file.endsWith(`packages/learn-card-network/${directory}/src/index.ts`)),
        `${name} must resolve source in workspace development`
    );
    assert(
        !inputs.some(file =>
            /packages\/learn-card-network\/(brain|cloud)-client\/dist\//.test(file)
        ),
        `${name} development unexpectedly requires a client build`
    );
    const probe = spawnSync(
        'bun',
        [
            '--conditions=development',
            '-e',
            `
        import { getClient, getApiTokenClient } from '${name}';
        const client = await getClient('https://example.com/trpc', async () => 'token');
        const apiClient = await getApiTokenClient('https://example.com/trpc', 'token');
        if (typeof client.utilities.getChallenges.query !== 'function' ||
            typeof apiClient.utilities.getChallenges.query !== 'function') throw new Error('Invalid client');
    `,
        ],
        { cwd: root, encoding: 'utf8', timeout: 30_000 }
    );
    assert.equal(
        probe.status,
        0,
        `${name} source import failed: ${probe.error ?? ''}\n${probe.stderr}`
    );
    console.log(`OK: ${name} workspace development uses source in browser bundles and Bun.`);
}
