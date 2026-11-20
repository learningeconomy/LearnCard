#!/usr/bin/env node

/**
 * Type-checks a fixture consumer of the published SDK entry points the way an external project
 * would: only each package's *declared* dependencies are installed, and library checking is on
 * (`skipLibCheck: false`).
 *
 * It fails when the published types need a package that is not declared, most importantly the
 * backend services (`@learncard/network-brain-service`, `@learncard/learn-cloud-service`), which
 * must never be part of a client install.
 *
 * Run after building the packages:
 *   node scripts/check-consumer-types.mjs
 */

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { prepareClientExports } from './client-package-exports.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);

/** Entry points an external consumer imports. */
const ROOT_PACKAGES = [
    '@learncard/network-brain-client',
    '@learncard/learn-cloud-client',
    '@learncard/learn-cloud-plugin',
    '@learncard/init',
];

/** Server packages that must not be reachable from any of them. */
const FORBIDDEN_PACKAGES = ['@learncard/network-brain-service', '@learncard/learn-cloud-service'];

/**
 * Typing problems that already existed in other published packages when this check was added
 * (type-only imports of packages they do not declare). They are unrelated to the server
 * packages and tracked as follow-ups; listing them keeps the check strict for everything else.
 * Remove an entry when it is fixed: an entry that no longer matches fails the check.
 */
const KNOWN_ISSUES = [
    { file: '@learncard/core/dist/types/planes.d.ts', message: "Cannot find module 'sift'" },
    {
        file: '@learncard/didkit-plugin/dist/didkit/index.d.ts',
        message: "Cannot find module './pkg/didkit_wasm'",
    },
    {
        file: '@learncard/didkit-plugin/dist/plugin.d.ts',
        message: "has no exported member 'InitInput'",
    },
    { file: '@learncard/didkit-plugin/dist/types.d.ts', message: "Cannot find module 'dids'" },
    {
        file: '@learncard/sd-jwt-vc-plugin/dist/present.d.ts',
        message: "Cannot find module '@sd-jwt/types'",
    },
    {
        file: '@learncard/sd-jwt-vc-plugin/dist/signer.d.ts',
        message: "Cannot find module '@sd-jwt/types'",
    },
];

const INSTALLED_FIELDS = ['dependencies', 'optionalDependencies', 'peerDependencies'];

const CONSUMER = `
import { initLearnCard } from '@learncard/init';
import { getClient, type LCNClient } from '@learncard/network-brain-client';
import { getClient as getCloudClient, type Filter } from '@learncard/learn-cloud-client';
import type { LearnCloudPluginMethods } from '@learncard/learn-cloud-plugin';

type IsAny<T> = 0 extends 1 & T ? true : false;
type Output<T extends (...args: never[]) => unknown> = Awaited<ReturnType<T>>;

declare const client: LCNClient;

// Router inputs and outputs must survive as real types, not collapse to \`any\`.
export const profileOutputIsTyped: IsAny<Output<LCNClient['profile']['getProfile']['query']>> = false;
export const sendBoostInputIsTyped: IsAny<
    Parameters<LCNClient['boost']['sendBoost']['mutate']>[0]
> = false;
export const inboxIssueInputIsTyped: IsAny<
    Parameters<LCNClient['inbox']['issue']['mutate']>[0]
> = false;
export const cloudFilterIsTyped: IsAny<Filter<{ a: string }>> = false;
export const cloudReadIsTyped: IsAny<Parameters<LearnCloudPluginMethods['learnCloudRead']>[0]> =
    false;

export const run = async () => {
    const built = await getClient('https://example.com/trpc', async () => 'token');
    const profile = await built.profile.getProfile.query();
    const displayName: string | undefined = profile?.displayName;

    // @ts-expect-error -- a typed output has no such property
    profile?.definitelyNotAField;
    // @ts-expect-error -- a typed input rejects the wrong shape
    await client.boost.sendBoost.mutate({ nope: true });

    const cloud = await getCloudClient('https://example.com/trpc', async () => 'token');
    const learnCard = await initLearnCard({ seed: 'a'.repeat(64) });

    return { displayName, cloud, did: learnCard.id.did() };
};
`;

const workspacePackages = new Map();
const findWorkspacePackages = directory => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        if (!entry.isDirectory() || ['node_modules', 'dist', '.nx', '.git'].includes(entry.name))
            continue;

        const child = path.join(directory, entry.name);
        const manifestPath = path.join(child, 'package.json');

        if (fs.existsSync(manifestPath)) {
            const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
            if (manifest.name) workspacePackages.set(manifest.name, { directory: child, manifest });
        }

        findWorkspacePackages(child);
    }
};
for (const top of ['packages', 'services']) findWorkspacePackages(path.join(root, top));

/** The directory of an installed third-party package, resolved from `fromDirectory`. */
const thirdPartyDirectory = (name, fromDirectory) => {
    let directory = fromDirectory;

    while (true) {
        const candidate = path.join(directory, 'node_modules', name);
        if (fs.existsSync(path.join(candidate, 'package.json'))) return fs.realpathSync(candidate);

        const parent = path.dirname(directory);
        if (parent === directory) return undefined;
        directory = parent;
    }
};

const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'lc-consumer-types-'));
const installed = new Map();
const failures = [];

const install = (name, fromDirectory, requiredBy) => {
    if (installed.has(name)) return;

    if (FORBIDDEN_PACKAGES.includes(name)) {
        failures.push(`${requiredBy} installs ${name}: a server package in a client install.`);
        return;
    }

    const target = path.join(fixture, 'node_modules', name);
    fs.mkdirSync(path.dirname(target), { recursive: true });

    const workspace = workspacePackages.get(name);

    if (workspace) {
        installed.set(name, workspace.directory);

        if (!fs.existsSync(path.join(workspace.directory, 'dist'))) {
            failures.push(`${name} is not built (no dist). Build the packages first.`);
            return;
        }

        // Copy only what is published, so nothing resolves through the monorepo by accident.
        fs.mkdirSync(target, { recursive: true });
        fs.cpSync(path.join(workspace.directory, 'dist'), path.join(target, 'dist'), {
            recursive: true,
        });
        fs.copyFileSync(
            path.join(workspace.directory, 'package.json'),
            path.join(target, 'package.json')
        );

        const publishedManifest = structuredClone(workspace.manifest);
        prepareClientExports(publishedManifest, target);
        fs.writeFileSync(path.join(target, 'package.json'), JSON.stringify(publishedManifest));

        for (const field of INSTALLED_FIELDS) {
            for (const dependency of Object.keys(workspace.manifest[field] ?? {})) {
                install(dependency, workspace.directory, name);
            }
        }

        return;
    }

    // Third-party packages are linked as installed; their own dependencies resolve next to them.
    const directory = thirdPartyDirectory(name, fromDirectory);
    installed.set(name, directory);

    if (directory) fs.symlinkSync(directory, target, 'dir');
};

try {
    for (const name of ROOT_PACKAGES) install(name, root, 'the consumer');

    fs.writeFileSync(path.join(fixture, 'consumer.ts'), CONSUMER);
    fs.writeFileSync(
        path.join(fixture, 'tsconfig.json'),
        JSON.stringify({
            compilerOptions: {
                strict: true,
                noEmit: true,
                skipLibCheck: false,
                module: 'esnext',
                moduleResolution: 'bundler',
                target: 'es2022',
                lib: ['esnext', 'dom'],
                types: [],
            },
            include: ['consumer.ts'],
        })
    );

    const tsc = spawnSync(
        process.execPath,
        [require.resolve('typescript/bin/tsc'), '-p', fixture, '--pretty', 'false'],
        { encoding: 'utf8' }
    );
    const diagnostics = `${tsc.stdout}${tsc.stderr}`
        .split('\n')
        .map(line => line.trim())
        .filter(Boolean);
    const isKnown = issue => line =>
        line.split(path.sep).join('/').includes(issue.file) && line.includes(issue.message);
    const unexpected = diagnostics.filter(
        line => !KNOWN_ISSUES.some(issue => isKnown(issue)(line))
    );
    const stale = KNOWN_ISSUES.filter(issue => !diagnostics.some(isKnown(issue)));

    if (unexpected.length > 0) {
        failures.push(`the fixture consumer does not type-check:\n${unexpected.join('\n')}`);
    }
    for (const issue of stale) {
        failures.push(
            `known issue no longer occurs, remove it from KNOWN_ISSUES: ${issue.file} (${issue.message})`
        );
    }

    console.log(
        `Fixture consumer of ${ROOT_PACKAGES.join(', ')}: ${installed.size} packages installed.`
    );
} finally {
    fs.rmSync(fixture, { recursive: true, force: true });
}

if (failures.length > 0) {
    for (const failure of failures) console.error(`FAIL: ${failure}`);
    process.exit(1);
}

console.log(
    `OK: published types need no server package and type-check with skipLibCheck: false (${KNOWN_ISSUES.length} known pre-existing issues elsewhere).`
);
