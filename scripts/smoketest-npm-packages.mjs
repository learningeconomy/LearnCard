#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { setTimeout as sleep } from 'node:timers/promises';

export const CONSUMER_PACKAGES = [
    '@learncard/cli',
    '@learncard/init',
    '@learncard/partner-connect',
];

export const PLUGIN_PACKAGES = [
    '@learncard/ceramic-plugin',
    '@learncard/chapi-plugin',
    '@learncard/claimable-boosts-plugin',
    '@learncard/crypto-plugin',
    '@learncard/did-web-plugin',
    '@learncard/didkey-plugin',
    '@learncard/didkit-plugin',
    '@learncard/dynamic-loader-plugin',
    '@learncard/encryption-plugin',
    '@learncard/ethereum-plugin',
    '@learncard/expiration-plugin',
    '@learncard/helpers',
    '@learncard/idx-plugin',
    '@learncard/lca-api-plugin',
    '@learncard/learn-card-plugin',
    '@learncard/learn-cloud-plugin',
    '@learncard/ler-rs-plugin',
    '@learncard/linked-claims-plugin',
    '@learncard/network-plugin',
    '@learncard/open-badge-v2-plugin',
    '@learncard/openid4vc-plugin',
    '@learncard/render-method-plugin',
    '@learncard/sd-jwt-vc-plugin',
    '@learncard/types',
    '@learncard/vc-api-plugin',
    '@learncard/vc-plugin',
    '@learncard/vc-templates-plugin',
    '@learncard/vpqr-plugin',
];

const ALL_PACKAGES = [...CONSUMER_PACKAGES, ...PLUGIN_PACKAGES];
const EXACT_VERSION = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;
const REGISTRY = 'https://registry.npmjs.org/';
const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));

export const validateVersions = versions => {
    for (const name of ALL_PACKAGES) {
        if (!EXACT_VERSION.test(versions[name] ?? '')) {
            throw new Error('Missing exact smoketest version for ' + name);
        }
    }
    return versions;
};

export const workspaceVersions = root => {
    const versions = {};
    const wanted = new Set(ALL_PACKAGES);
    const walk = dir => {
        for (const entry of readdirSync(dir, { withFileTypes: true })) {
            if (entry.isDirectory()) {
                if (
                    ['.git', 'node_modules', 'dist', 'build', '.nx', 'coverage'].includes(
                        entry.name
                    )
                ) {
                    continue;
                }
                walk(join(dir, entry.name));
            } else if (entry.name === 'package.json') {
                const manifest = JSON.parse(readFileSync(join(dir, entry.name), 'utf8'));
                if (wanted.has(manifest.name) && !manifest.private) {
                    versions[manifest.name] = manifest.version;
                }
            }
        }
    };
    walk(root);
    return validateVersions(versions);
};

// Nightly/manual runs resolve tags once, then share the same exact versions with
// every manager. Post-publish runs use the publishing checkout's version map.
export const resolveVersions = async ({
    releaseVersions = {},
    overrides = {},
    fetchMetadata = fetch,
} = {}) => {
    if (Object.keys(releaseVersions).length > 0) return validateVersions(releaseVersions);
    const entries = await Promise.all(
        ALL_PACKAGES.map(async name => {
            const requested = overrides[name] || 'latest';
            if (EXACT_VERSION.test(requested)) return [name, requested];
            const response = await fetchMetadata(
                REGISTRY + encodeURIComponent(name) + '/' + encodeURIComponent(requested),
                { signal: AbortSignal.timeout(30_000) }
            );
            if (!response.ok)
                throw new Error(
                    'Cannot resolve ' + name + '@' + requested + ': HTTP ' + response.status
                );
            const manifest = await response.json();
            return [name, manifest.version];
        })
    );
    return validateVersions(Object.fromEntries(entries));
};

export const publicationPending = (manager, result) => {
    const output = (result.stdout ?? '') + '\n' + (result.stderr ?? '');
    if (manager === 'npm') {
        let code;
        try {
            code = JSON.parse(result.stdout).error?.code;
        } catch {
            /* npm may report only on stderr. */
        }
        code ??= result.stderr?.match(/^npm (?:ERR!|error) code (\S+)\s*$/m)?.[1];
        return code === 'E404' || code === 'ETARGET';
    }
    if (manager === 'pnpm') {
        return /(?:^|\s)ERR_PNPM_(?:NO_MATCHING_VERSION|FETCH_404)(?:\s|$)/m.test(output);
    }
    if (manager === 'yarn') {
        return output.split('\n').some(line => {
            try {
                const diagnostic = JSON.parse(line);
                return (
                    diagnostic.type === 'error' &&
                    (diagnostic.name === 82 ||
                        (diagnostic.name === 35 &&
                            /(?:404|Package not found)/.test(
                                diagnostic.displayName + ' ' + diagnostic.data
                            )))
                );
            } catch {
                return /YN0082:/.test(line) || /YN0035:.*(?:404|Package not found)/.test(line);
            }
        });
    }
    return /^error: (?:No version matching .* found for specifier|GET .* (?:404|Not Found))/m.test(
        output
    );
};

export const verifyInstalledVersions = (cwd, names, versions) => {
    for (const name of names) {
        const manifest = JSON.parse(
            readFileSync(join(cwd, 'node_modules', name, 'package.json'), 'utf8')
        );
        if (manifest.version !== versions[name]) {
            throw new Error(
                name + ': expected ' + versions[name] + ', installed ' + manifest.version
            );
        }
    }
};

export const installPackages = async ({
    manager,
    group,
    versions,
    cwd = process.cwd(),
    timeoutMs = 1_200_000,
    pollIntervalMs = 15_000,
    run = spawnSync,
    now = () => performance.now(),
    wait = sleep,
    verify = verifyInstalledVersions,
}) => {
    validateVersions(versions);
    const names =
        group === 'consumers'
            ? CONSUMER_PACKAGES
            : group === 'plugins'
              ? PLUGIN_PACKAGES
              : group === 'bundler'
                ? ['@learncard/init']
                : undefined;
    if (!names || !['npm', 'pnpm', 'yarn', 'bun'].includes(manager)) {
        throw new Error(
            'Expected an npm/pnpm/yarn/bun manager and consumers/plugins/bundler group'
        );
    }
    if (
        !Number.isSafeInteger(timeoutMs) ||
        timeoutMs < 1 ||
        !Number.isSafeInteger(pollIntervalMs) ||
        pollIntervalMs < 1
    ) {
        throw new Error('Registry timeout and poll interval must be positive integers');
    }
    const manifestPath = join(cwd, 'package.json');
    const originalManifest = readFileSync(manifestPath, 'utf8');
    if (!JSON.parse(originalManifest).private)
        throw new Error('Smoketest workspace must be private');
    const specifications = names.map(name => name + '@' + versions[name]);
    if (group === 'bundler') specifications.push('esbuild');
    const args = {
        npm: [
            'install',
            '--save-exact',
            '--no-fund',
            '--no-audit',
            '--prefer-online',
            '--fetch-retries=0',
            '--json',
        ],
        pnpm: ['add', '--save-exact', '--reporter=append-only', '--fetch-retries=0'],
        yarn: ['add', '--exact', '--json'],
        bun: ['add', '--exact', '--no-cache'],
    }[manager];
    const deadline = now() + timeoutMs;
    for (let attempt = 1; ; attempt += 1) {
        const remaining = Math.floor(deadline - now());
        if (remaining <= 0)
            throw new Error(
                'Timed out waiting for published packages: ' + specifications.join(' ')
            );
        console.log(
            'Installing exact published packages via ' + manager + ' (attempt ' + attempt + ')'
        );
        const result = run(manager, [...args, ...specifications], {
            cwd,
            encoding: 'utf8',
            timeout: Math.min(remaining, 120_000),
            killSignal: 'SIGKILL',
            maxBuffer: 8 * 1024 * 1024,
            env: {
                ...process.env,
                npm_config_registry: REGISTRY,
                npm_config_cache: join(cwd, '.registry-cache', String(attempt), 'npm'),
                XDG_CACHE_HOME: join(cwd, '.registry-cache', String(attempt)),
                YARN_GLOBAL_FOLDER: join(cwd, '.registry-cache', String(attempt), 'yarn'),
                YARN_NPM_REGISTRY_SERVER: REGISTRY,
                YARN_NODE_LINKER: 'node-modules',
            },
        });
        if (result.stdout) process.stdout.write(result.stdout);
        if (result.stderr) process.stderr.write(result.stderr);
        if (result.error || result.signal) {
            throw new Error(
                manager +
                    ' installation could not complete: ' +
                    (result.error?.message ?? result.signal)
            );
        }
        if (result.status === 0) {
            verify(cwd, names, versions);
            return;
        }
        if (!publicationPending(manager, result))
            throw new Error(manager + ' install failed; not a registry-readiness error');
        // Retry a fresh resolution; partially installed trees and lockfiles must
        // not preserve the metadata that said the newly published version was absent.
        writeFileSync(manifestPath, originalManifest);
        for (const name of [
            'node_modules',
            'package-lock.json',
            'pnpm-lock.yaml',
            'yarn.lock',
            'bun.lock',
            'bun.lockb',
            '.yarn/install-state.gz',
        ]) {
            rmSync(join(cwd, name), { recursive: true, force: true });
        }
        const delay = Math.min(pollIntervalMs, Math.max(0, deadline - now()));
        console.log('Publication is not ready; retrying in ' + Math.ceil(delay / 1000) + 's');
        await wait(delay);
    }
};

const main = async () => {
    const [command, manager, group] = process.argv.slice(2);
    if (command === 'versions') {
        const versions =
            manager === '--workspace'
                ? workspaceVersions(ROOT)
                : await resolveVersions({
                      releaseVersions: JSON.parse(process.env.SMOKE_PACKAGE_VERSIONS || '{}'),
                      overrides: {
                          '@learncard/cli': process.env.CLI_VER,
                          '@learncard/init': process.env.INIT_VER,
                          '@learncard/partner-connect': process.env.PC_VER,
                      },
                  });
        console.log('package-versions=' + JSON.stringify(versions));
    } else if (command === 'install') {
        await installPackages({
            manager,
            group,
            versions: JSON.parse(process.env.SMOKE_PACKAGE_VERSIONS || '{}'),
            timeoutMs: Number(process.env.REGISTRY_TIMEOUT_SECONDS || '1200') * 1000,
        });
    } else {
        throw new Error(
            'Usage: smoketest-npm-packages.mjs versions [--workspace] | install <manager> <group>'
        );
    }
};

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
    main().catch(error => {
        console.error('[published-packages-smoketest] ' + error.message);
        process.exitCode = 1;
    });
}
