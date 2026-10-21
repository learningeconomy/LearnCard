#!/usr/bin/env node

import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
// Use the same workspace enumeration as `changeset publish`, without relying on
// its transitive dependency being hoisted to the workspace root.
const changesetsRequire = createRequire(require.resolve('@changesets/cli/package.json'));
const { getPackages } = changesetsRequire('@manypkg/get-packages');

process.chdir(ROOT);
process.env.NX_DAEMON = 'false';
const { createProjectGraphAsync } = await import('nx/src/devkit-exports');

const [{ packages }, graph] = await Promise.all([
    getPackages(ROOT),
    createProjectGraphAsync({ exitOnError: false }),
]);
const projectsByRoot = new Map(
    Object.entries(graph.nodes).map(([name, { data }]) => [
        path.resolve(ROOT, data.root),
        { name, targets: data.targets },
    ])
);
const projects = [];

for (const { dir, packageJson } of packages) {
    // The native addon is released separately with its platform artifacts.
    if (packageJson.private || packageJson.name === '@learncard/didkit-plugin-node') continue;
    if (!packageJson.name || !packageJson.version) continue;

    // Package names and Nx project names differ (e.g. @learncard/core -> core).
    const project = projectsByRoot.get(path.resolve(dir));
    if (!project) {
        throw new Error(`No Nx project found for publishable package ${packageJson.name} (${dir})`);
    }
    if (project.targets?.build) projects.push(project.name);
}

// An empty --projects value can make Nx run every project. Fail before the
// workflow invokes Nx rather than accidentally building apps and examples.
if (projects.length === 0) {
    throw new Error('No publishable workspace packages with Nx build targets found');
}

// Only select roots here: Nx's ^build traversal must still build their private
// dependencies. Do not pass --excludeTaskDependencies to the build command.
process.stdout.write(`${projects.sort().join(',')}\n`);
