#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import { pathToFileURL } from 'node:url';

const PACKAGE = '@learncard/didkit-plugin-node';
const REGISTRY = 'https://registry.npmjs.org/';
const PLATFORMS = {
    'x86_64-unknown-linux-gnu': 'linux-x64-gnu',
    'aarch64-unknown-linux-gnu': 'linux-arm64-gnu',
    'x86_64-apple-darwin': 'darwin-x64',
    'aarch64-apple-darwin': 'darwin-arm64',
};

export const registryPackages = manifest => {
    if (
        manifest.name !== PACKAGE ||
        !/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/.test(manifest.version ?? '')
    ) {
        throw new Error('The native workspace package must declare an exact package version.');
    }
    const triples = manifest.napi?.triples;
    if (triples?.defaults !== false || !triples.additional?.length) {
        throw new Error('The native workspace package must explicitly list supported platforms.');
    }
    const bindings = triples.additional.map(target => {
        if (!Object.hasOwn(PLATFORMS, target)) {
            throw new Error(
                `Unknown native platform: ${target}. Update the registry readiness gate.`
            );
        }
        return `${PACKAGE}-${PLATFORMS[target]}`;
    });
    return [PACKAGE, ...new Set(bindings)].map(name => ({ name, version: manifest.version }));
};

/** Check published artifacts without installing dependencies from the release we are gating. */
export const waitForDidkitRegistry = async ({
    manifest,
    timeoutMs = 45 * 60 * 1000,
    pollIntervalMs = 15_000,
    fetchRegistry = fetch,
    now = () => performance.now(),
    wait = sleep,
    log = console.log,
}) => {
    const packages = registryPackages(manifest);
    if (![timeoutMs, pollIntervalMs].every(value => Number.isSafeInteger(value) && value > 0)) {
        throw new Error('Registry timeout and poll interval must be positive integers.');
    }
    const deadline = now() + timeoutMs;
    const ready = new Set();
    const remaining = () => {
        const milliseconds = Math.floor(deadline - now());
        if (milliseconds <= 0) {
            throw new Error(
                'Timed out waiting for native registry publication: ' +
                    packages
                        .filter(pkg => !ready.has(pkg.name))
                        .map(pkg => `${pkg.name}@${pkg.version}`)
                        .join(', ')
            );
        }
        return milliseconds;
    };
    const request = async (url, consume) => {
        const response = await fetchRegistry(url, {
            cache: 'no-store',
            headers: { 'Cache-Control': 'no-cache' },
            signal: AbortSignal.timeout(Math.min(30_000, remaining())),
        });
        if (response.status === 404) {
            await response.body?.cancel();
            return undefined;
        }
        if (!response.ok) {
            await response.body?.cancel();
            throw new Error(`Registry request failed: HTTP ${response.status} for ${url}`);
        }
        const result = await consume(response);
        remaining();
        return result;
    };

    for (let attempt = 1; ; attempt += 1) {
        remaining();
        for (const { name, version } of packages) {
            if (ready.has(name)) continue;
            const specification = `${name}@${version}`;
            const published = await request(
                `${REGISTRY}${encodeURIComponent(name)}/${encodeURIComponent(version)}`,
                response => response.json()
            );
            if (!published) {
                log(`Waiting for ${specification} metadata (attempt ${attempt}).`);
                continue;
            }
            if (published.name !== name || published.version !== version) {
                throw new Error(`Registry metadata does not match ${specification}.`);
            }
            if (name === PACKAGE) {
                for (const binding of packages.slice(1)) {
                    if (published.optionalDependencies?.[binding.name] !== binding.version) {
                        throw new Error(
                            `${specification} must reference ${binding.name}@${binding.version}.`
                        );
                    }
                }
            }
            const tarball = new URL(published.dist?.tarball);
            if (tarball.origin !== new URL(REGISTRY).origin) {
                throw new Error(`Expected a public npm tarball for ${specification}.`);
            }
            const downloaded = await request(tarball.href, async response => {
                // Drain the complete GET to catch transfer failures without retaining
                // the archive in memory. HEAD/Content-Length alone cannot prove this.
                let hasBytes = false;
                for await (const chunk of response.body ?? []) {
                    if (chunk.byteLength > 0) hasBytes = true;
                }
                if (!hasBytes) {
                    throw new Error(`Empty tarball for ${specification}.`);
                }
                return true;
            });
            if (!downloaded) {
                log(`Waiting for ${specification} tarball (attempt ${attempt}).`);
                continue;
            }
            ready.add(name);
            log(`Ready: ${specification} metadata and tarball.`);
        }
        if (ready.size === packages.length) return;
        await wait(Math.min(pollIntervalMs, remaining()));
    }
};

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
    try {
        if (process.argv.length > 2)
            throw new Error('Usage: node scripts/wait-for-didkit-registry.mjs');
        await waitForDidkitRegistry({
            manifest: JSON.parse(
                readFileSync(
                    new URL('../packages/plugins/didkit-plugin-node/package.json', import.meta.url),
                    'utf8'
                )
            ),
        });
    } catch (error) {
        console.error(`[didkit-registry-readiness] ${error.message}`);
        process.exitCode = 1;
    }
}
