#!/usr/bin/env node

/**
 * Makes sure a package that bundles its dependencies is re-released when any of them changes.
 *
 * `@learncard/cli` ships every workspace dependency inside one file. Changesets only bumps a
 * dependent when a dependency's new version leaves the declared range, so a patch to a package
 * reached through a `workspace:^` range (for example network-plugin, via init) would be
 * published on its own while the CLI kept shipping the old code.
 *
 * Run before `changeset version`. For each self-contained package that is not already in the
 * release plan, this writes a patch changeset when the plan releases anything in the package's
 * workspace dependency closure.
 *
 *   node scripts/release-bundled-dependents.mjs            # write changesets
 *   node scripts/release-bundled-dependents.mjs --dry-run  # report only
 *   node scripts/release-bundled-dependents.mjs --root=<dir>
 */

import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Keep in sync with `selfContainedPackages` in prepare-publish-workspace-deps.mjs.
export const SELF_CONTAINED_PACKAGES = ['@learncard/cli'];

const RUNTIME_DEPENDENCY_FIELDS = ['dependencies', 'optionalDependencies', 'peerDependencies'];

const require = createRequire(import.meta.url);
// Resolve Changesets' own helpers without relying on them being hoisted to the root.
const changesetsRequire = createRequire(require.resolve('@changesets/cli/package.json'));
const getReleasePlan = changesetsRequire('@changesets/get-release-plan').default;
const { getPackages } = changesetsRequire('@manypkg/get-packages');

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const rootArg = args.find(arg => arg.startsWith('--root='));
const root = path.resolve(
    rootArg?.slice('--root='.length) ??
        path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
);

/** Every workspace package reachable from `name` through runtime dependency fields. */
export const workspaceDependencyClosure = (name, manifestsByName) => {
    const closure = new Set();
    const queue = [name];

    while (queue.length > 0) {
        const manifest = manifestsByName.get(queue.pop());

        for (const field of RUNTIME_DEPENDENCY_FIELDS) {
            for (const dependencyName of Object.keys(manifest?.[field] ?? {})) {
                if (!manifestsByName.has(dependencyName) || closure.has(dependencyName)) continue;

                closure.add(dependencyName);
                queue.push(dependencyName);
            }
        }
    }

    return closure;
};

const changesetFileName = name =>
    `bundled-dependencies-${name.replace(/^@/, '').replace(/[^a-z0-9]+/gi, '-')}.md`;

const [{ packages }, releasePlan] = await Promise.all([getPackages(root), getReleasePlan(root)]);
const manifestsByName = new Map(packages.map(({ packageJson }) => [packageJson.name, packageJson]));
const released = new Map(
    releasePlan.releases
        .filter(release => release.type !== 'none')
        .map(release => [release.name, release.type])
);

for (const name of SELF_CONTAINED_PACKAGES) {
    if (!manifestsByName.has(name)) continue;

    if (released.has(name)) {
        console.log(`${name} is already in the release plan (${released.get(name)}).`);
        continue;
    }

    const changedDependencies = [...workspaceDependencyClosure(name, manifestsByName)]
        .filter(dependencyName => released.has(dependencyName))
        .sort();

    if (changedDependencies.length === 0) {
        console.log(`${name}: no bundled dependency is being released.`);
        continue;
    }

    const file = path.join(root, '.changeset', changesetFileName(name));
    const contents = [
        '---',
        `'${name}': patch`,
        '---',
        '',
        `Rebuild with updated bundled dependencies: ${changedDependencies.join(', ')}.`,
        '',
    ].join('\n');

    if (!dryRun) fs.writeFileSync(file, contents);

    console.log(
        `${dryRun ? 'Would add' : 'Added'} ${path.relative(root, file)}: ${name} bundles ` +
            changedDependencies.join(', ')
    );
}
