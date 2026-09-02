#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PACKAGE_DEPENDENCY_FIELDS = [
    'dependencies',
    'devDependencies',
    'peerDependencies',
    'optionalDependencies',
];

const IGNORED_DIRECTORIES = new Set([
    '.git',
    '.nx',
    '.turbo',
    'build',
    'coverage',
    'dist',
    'node_modules',
]);

const args = new Set(process.argv.slice(2));
const dryRun = args.has('--dry-run');
const rootArg = process.argv.find(arg => arg.startsWith('--root='));
const root = path.resolve(
    rootArg?.slice('--root='.length) ?? path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
);

const packageJsonPaths = [];

const walk = dir => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.isDirectory()) {
            if (IGNORED_DIRECTORIES.has(entry.name)) continue;

            walk(path.join(dir, entry.name));
            continue;
        }

        if (entry.isFile() && entry.name === 'package.json') {
            packageJsonPaths.push(path.join(dir, entry.name));
        }
    }
};

const readJson = file => JSON.parse(fs.readFileSync(file, 'utf8'));

const workspacePackages = new Map();
const packageJsonByPath = new Map();

walk(root);

for (const packageJsonPath of packageJsonPaths) {
    const packageJson = readJson(packageJsonPath);

    packageJsonByPath.set(packageJsonPath, packageJson);

    if (typeof packageJson.name === 'string' && typeof packageJson.version === 'string') {
        workspacePackages.set(packageJson.name, {
            version: packageJson.version,
            packageJsonPath,
        });
    }
}

const resolveWorkspaceSpec = (dependencyName, spec, packageJsonPath) => {
    if (!spec.startsWith('workspace:')) return spec;

    const dependency = workspacePackages.get(dependencyName);

    if (!dependency) {
        const relativePath = path.relative(root, packageJsonPath);
        throw new Error(`${relativePath} references unknown workspace dependency ${dependencyName}`);
    }

    const range = spec.slice('workspace:'.length);

    if (range === '*') return dependency.version;
    if (range === '^') return `^${dependency.version}`;
    if (range === '~') return `~${dependency.version}`;

    if (
        range.startsWith('^') ||
        range.startsWith('~') ||
        range.startsWith('>') ||
        range.startsWith('<') ||
        range.startsWith('=')
    ) {
        return range;
    }

    const relativePath = path.relative(root, packageJsonPath);
    throw new Error(`${relativePath} uses unsupported workspace range ${spec} for ${dependencyName}`);
};

const changes = [];

for (const [packageJsonPath, packageJson] of packageJsonByPath.entries()) {
    if (packageJson.private) continue;
    if (typeof packageJson.name !== 'string' || !packageJson.name.startsWith('@learncard/')) continue;

    let packageChanged = false;

    for (const field of PACKAGE_DEPENDENCY_FIELDS) {
        const dependencies = packageJson[field];

        if (!dependencies || typeof dependencies !== 'object' || Array.isArray(dependencies)) continue;

        for (const [dependencyName, spec] of Object.entries(dependencies)) {
            if (typeof spec !== 'string' || !spec.startsWith('workspace:')) continue;

            const resolvedSpec = resolveWorkspaceSpec(dependencyName, spec, packageJsonPath);

            dependencies[dependencyName] = resolvedSpec;
            packageChanged = true;

            changes.push({
                packageJsonPath,
                packageName: packageJson.name ?? path.relative(root, path.dirname(packageJsonPath)),
                field,
                dependencyName,
                from: spec,
                to: resolvedSpec,
            });
        }
    }

    if (packageChanged && !dryRun) {
        fs.writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 4)}\n`);
    }
}

if (changes.length === 0) {
    console.log('No workspace dependency versions found in package manifests.');
    process.exit(0);
}

const changedPackages = new Set(changes.map(change => change.packageJsonPath));

console.log(
    `${dryRun ? 'Would rewrite' : 'Rewrote'} ${changes.length} workspace dependency version${
        changes.length === 1 ? '' : 's'
    } across ${changedPackages.size} package${changedPackages.size === 1 ? '' : 's'}.`
);

for (const change of changes) {
    const relativePath = path.relative(root, change.packageJsonPath);
    console.log(
        `${relativePath} ${change.field}.${change.dependencyName}: ${change.from} -> ${change.to}`
    );
}
