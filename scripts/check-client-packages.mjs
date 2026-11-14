#!/usr/bin/env node

/**
 * Exercise each published client alone, without init or monorepo hoisting supplying
 * undeclared dependencies. Run after building both clients and @learncard/types.
 * Uses actual npm tarballs (including published source), a fresh dependency install,
 * and default/development export conditions for runtime, bundler and type checks.
 */
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const clients = ['network-brain-client', 'learn-cloud-client'];
const workspaceDirectories = new Map([
    ['@learncard/network-brain-client', 'packages/learn-card-network/brain-client'],
    ['@learncard/learn-cloud-client', 'packages/learn-card-network/cloud-client'],
    ['@learncard/types', 'packages/learn-card-types'],
]);
const forbidden = ['@learncard/network-brain-service', '@learncard/learn-cloud-service'];

const run = (command, args, cwd, env = process.env) => {
    const result = spawnSync(command, args, {
        cwd,
        env: { ...env, NODE_PATH: '', NODE_OPTIONS: '' },
        encoding: 'utf8',
        timeout: 120_000,
        maxBuffer: 10 * 1024 * 1024,
    });
    assert.equal(
        result.status,
        0,
        `${command} ${args.join(' ')} failed:\n${result.error ?? ''}\n${result.stdout}${result.stderr}`
    );
    return result.stdout;
};

for (const client of clients) {
    const name = `@learncard/${client}`;
    const fixture = fs.mkdtempSync(path.join(os.tmpdir(), `lc-${client}-`));
    try {
        const packed = new Map();
        const dependencies = {};
        const collect = packageName => {
            assert(
                !forbidden.includes(packageName),
                `Client installs server package ${packageName}`
            );
            if (packed.has(packageName)) return;
            const relative = workspaceDirectories.get(packageName);
            assert(
                relative,
                `Unexpected workspace dependency ${packageName}; audit its client contract`
            );
            const directory = path.join(root, relative);
            assert(fs.existsSync(path.join(directory, 'dist')), `Build ${packageName} first`);
            const [pack] = JSON.parse(
                run(
                    'npm',
                    ['pack', '--ignore-scripts', '--json', '--pack-destination', fixture],
                    directory
                )
            );
            const unpacked = path.join(fixture, 'unpacked', packageName);
            fs.mkdirSync(unpacked, { recursive: true });
            run(
                'tar',
                ['-xzf', path.join(fixture, pack.filename), '-C', unpacked, '--strip-components=1'],
                fixture
            );
            packed.set(packageName, unpacked);
            const manifest = JSON.parse(
                fs.readFileSync(path.join(unpacked, 'package.json'), 'utf8')
            );
            for (const field of ['dependencies', 'optionalDependencies', 'peerDependencies']) {
                for (const [dependency, version] of Object.entries(manifest[field] ?? {})) {
                    assert(
                        !forbidden.includes(dependency),
                        `Client installs server package ${dependency}`
                    );
                    if (version.startsWith('workspace:')) collect(dependency);
                    else dependencies[dependency] = version;
                }
            }
        };
        collect(name);
        fs.writeFileSync(
            path.join(fixture, 'package.json'),
            JSON.stringify({ private: true, dependencies })
        );
        // Install third parties outside the workspace, then place the exact packed workspace
        // files alongside them. npm need not interpret the pre-release workspace:* ranges.
        run(
            'npm',
            ['install', '--ignore-scripts', '--no-audit', '--no-fund', '--package-lock=false'],
            fixture
        );
        for (const [packageName, unpacked] of packed) {
            const target = path.join(fixture, 'node_modules', packageName);
            fs.mkdirSync(path.dirname(target), { recursive: true });
            fs.cpSync(unpacked, target, { recursive: true });
        }
        for (const packageName of [...forbidden, '@learncard/helpers', '@learncard/init']) {
            assert(
                !fs.existsSync(path.join(fixture, 'node_modules', packageName)),
                `${packageName} masks isolation`
            );
        }

        const runtime = `
            const assert = require('node:assert/strict');
            (async () => {
                const { getClient, getApiTokenClient } = LOAD;
                assert.equal(typeof getClient, 'function');
                assert.equal(typeof getApiTokenClient, 'function');
                // Construct clients without making a network request.
                const client = await getClient('https://example.com/trpc', async () => 'token');
                const apiClient = await getApiTokenClient('https://example.com/trpc', 'token');
                assert.equal(typeof client.utilities.getChallenges.query, 'function');
                assert.equal(typeof apiClient.utilities.getChallenges.query, 'function');
            })().catch(error => { console.error(error); process.exitCode = 1; });
        `;
        const typeConsumer = `
            import { getClient } from '${name}';
            type IsAny<T> = 0 extends 1 & T ? true : false;
            type Client = Awaited<ReturnType<typeof getClient>>;
            type Challenges = Awaited<ReturnType<Client['utilities']['getChallenges']['query']>>;
            export const outputIsTyped: IsAny<Challenges> = false;
            export const inputIsTyped: IsAny<Parameters<Client['utilities']['getChallenges']['query']>[0]> = false;
            declare const client: Client;
            export async function check() {
                const challenges: string[] = await client.utilities.getChallenges.query({ amount: 2 });
                // @ts-expect-error -- the router must reject invalid inputs
                await client.utilities.getChallenges.query({ amount: 'two' });
                return challenges;
            }
        `;
        fs.writeFileSync(path.join(fixture, 'consumer.ts'), typeConsumer);
        for (const condition of ['default', 'development']) {
            const flags = condition === 'development' ? ['--conditions=development'] : [];
            for (const mode of ['development', 'production']) {
                for (const loader of [`require('${name}')`, `await import('${name}')`]) {
                    run(
                        process.execPath,
                        [...flags, '-e', runtime.replace('LOAD', loader)],
                        fixture,
                        {
                            ...process.env,
                            NODE_ENV: mode,
                        }
                    );
                }
            }
            fs.writeFileSync(
                path.join(fixture, 'tsconfig.json'),
                JSON.stringify({
                    compilerOptions: {
                        strict: true,
                        noEmit: true,
                        skipLibCheck: false,
                        types: [],
                        module: 'esnext',
                        moduleResolution: 'bundler',
                        target: 'es2022',
                        lib: ['esnext', 'dom'],
                        customConditions: condition === 'development' ? ['development'] : [],
                    },
                    include: ['consumer.ts'],
                })
            );
            run(
                process.execPath,
                [require.resolve('typescript/bin/tsc'), '-p', fixture, '--pretty', 'false'],
                fixture
            );
            await build({
                absWorkingDir: fixture,
                stdin: { contents: `export { getClient } from '${name}';`, resolveDir: fixture },
                bundle: true,
                platform: 'browser',
                format: 'esm',
                write: false,
                conditions: condition === 'development' ? ['development'] : [],
            });
        }
        console.log(
            `OK: ${name} alone: ESM/CJS, development/production, default/development conditions, strict types and browser bundle.`
        );
    } finally {
        fs.rmSync(fixture, { recursive: true, force: true });
    }
}
