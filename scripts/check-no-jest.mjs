import { readdirSync, readFileSync } from 'node:fs';
import { basename, extname, join, relative } from 'node:path';

const root = process.cwd();
const ignoredDirectories = new Set([
    '.git',
    '.nx',
    '.nx-cache',
    'build',
    'coverage',
    'dist',
    'node_modules',
    'playwright-report',
    'storybook-static',
    'test-results',
]);
const allowedJestDependencies = new Set(['@testing-library/jest-dom']);
const sourceExtensions = new Set(['.js', '.jsx', '.mjs', '.cjs', '.ts', '.tsx', '.mts', '.cts']);
const failures = [];

const addFailure = (file, reason) => failures.push(`${relative(root, file)}: ${reason}`);

const checkManifest = file => {
    const manifest = JSON.parse(readFileSync(file, 'utf8'));

    for (const section of ['dependencies', 'devDependencies', 'peerDependencies']) {
        for (const dependency of Object.keys(manifest[section] ?? {})) {
            if (/jest/i.test(dependency) && !allowedJestDependencies.has(dependency)) {
                addFailure(file, `${section} contains Jest-only dependency ${dependency}`);
            }
        }
    }

    for (const [name, command] of Object.entries(manifest.scripts ?? {})) {
        if (typeof command === 'string' && /(^|\s|\/)(jest|ts-jest)(\s|$)/i.test(command)) {
            addFailure(file, `script ${name} invokes Jest`);
        }
    }
};

const checkFile = file => {
    const name = basename(file);

    if (/^jest(?:[.-]|$)/i.test(name) || /(?:^|[.-])jest\.config\./i.test(name)) {
        addFailure(file, 'obsolete Jest configuration/setup filename');
    }

    if (name === 'package.json') checkManifest(file);

    const extension = extname(file);
    if (sourceExtensions.has(extension)) {
        const source = readFileSync(file, 'utf8');
        if (/from\s+['"]@jest\/globals['"]|require\(['"]@jest\/globals['"]\)/.test(source)) {
            addFailure(file, 'imports @jest/globals');
        }
        if (
            /\bjest\s*\.\s*(fn|mock|spyOn|resetModules|restoreAllMocks|clearAllMocks)\b/.test(
                source
            )
        ) {
            addFailure(file, 'uses the Jest runtime API');
        }
    }
};

const walk = directory => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
        if (entry.isDirectory()) {
            if (!ignoredDirectories.has(entry.name)) walk(join(directory, entry.name));
            continue;
        }

        if (entry.isFile()) checkFile(join(directory, entry.name));
    }
};

walk(root);

if (failures.length > 0) {
    console.error('Active Jest usage is not allowed:\n');
    console.error(failures.map(failure => `- ${failure}`).join('\n'));
    process.exit(1);
}

console.log('No active Jest usage found.');
