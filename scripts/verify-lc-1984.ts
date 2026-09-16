import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import ts from 'typescript';
import { z } from 'zod';

import { environmentContracts, validateEnvironmentExamples } from './env-contracts';

const failures: string[] = [];

const expect = (condition: boolean, message: string): void => {
    if (!condition) failures.push(message);
};

const readJson = <Schema extends z.ZodType>(path: string, schema: Schema): z.output<Schema> => {
    const raw: unknown = JSON.parse(readFileSync(path, 'utf8'));
    const result = schema.safeParse(raw);

    if (!result.success) {
        throw new Error(`${path}: ${result.error.message}`);
    }

    return result.data;
};

const walkFiles = (root: string): string[] => {
    if (!existsSync(root)) return [];

    const files: string[] = [];

    for (const entry of readdirSync(root)) {
        const path = join(root, entry);
        const stats = statSync(path);

        if (stats.isDirectory()) {
            if (['node_modules', 'dist', 'build', '.git', '.nx', 'coverage'].includes(entry)) {
                continue;
            }
            files.push(...walkFiles(path));
        } else {
            files.push(path);
        }
    }

    return files;
};

const packageSchema = z
    .object({
        engines: z.object({ node: z.string().optional() }).optional(),
        packageManager: z.string().optional(),
        scripts: z.record(z.string(), z.string()).optional(),
        devDependencies: z.record(z.string(), z.string()).optional(),
        overrides: z.record(z.string(), z.string()).optional(),
    })
    .passthrough();

const rootPackage = readJson('package.json', packageSchema);
const runtimePackagePaths = [
    'apps/learn-card-app/package.json',
    'apps/scouts/package.json',
    'services/learn-card-network/brain-service/package.json',
    'services/learn-card-network/lca-api/package.json',
    'services/learn-card-network/learn-cloud-service/package.json',
] as const;

expect(rootPackage.devDependencies?.typescript === '5.9.3', 'TypeScript must be pinned to 5.9.3');
expect(rootPackage.overrides?.typescript === '5.9.3', 'TypeScript override must be 5.9.3');
expect(ts.version === '5.9.3', 'Installed TypeScript must be 5.9.3');

expect(readFileSync('.nvmrc', 'utf8').trim() === 'v24.12.0', '.nvmrc must pin Node 24.12.0');
expect(rootPackage.packageManager === 'bun@1.3.14', 'root packageManager must be bun@1.3.14');
expect(rootPackage.engines?.node === '>=24.12 <25', 'root Node engine must be >=24.12 <25');

for (const path of runtimePackagePaths) {
    const packageJson = readJson(path, packageSchema);
    expect(packageJson.packageManager === 'bun@1.3.14', `${path} must declare bun@1.3.14`);
    expect(packageJson.engines?.node === '>=24.12 <25', `${path} must declare Node >=24.12 <25`);
}

const workflowPathPattern = /(?:^|\/)\.github\/workflows\/[^/]+\.(?:yml|yaml)$/;
const runtimePinFiles = walkFiles('.').filter(path => {
    const name = basename(path);

    return (
        name === '.nvmrc' ||
        name === '.node-version' ||
        name === 'netlify.toml' ||
        name.startsWith('Dockerfile') ||
        workflowPathPattern.test(path) ||
        path === 'preview/docker-compose.preview.yaml'
    );
});

const staleNodePattern =
    /node:\s*\[[^\]]*\b(?:10|12|14|16|18|20|22)\.x\b|node:(?:10|12|14|16|18|20|22)(?:\.|-|\b)|NODE_VERSION\s*=\s*["']?(?:10|12|14|16|18|20|22)(?:\.|["']|\b)|node-version:\s*(?:10|12|14|16|18|20|22)(?:\.|\b)|^v?(?:10|12|14|16|18|20|22)(?:\.|$)/im;

for (const path of runtimePinFiles) {
    const contents = readFileSync(path, 'utf8');

    expect(!staleNodePattern.test(contents), `${path} contains a stale Node pin`);
    expect(
        !/bun\.sh\/install(?!\s*\|\s*bash\s+-s\s+--\s+["']?bun-v(?:1\.3\.14|\$\{BUN_VERSION\})["']?)|npm install -g bun(?:\s|\\|$)/.test(
            contents
        ),
        `${path} contains an unpinned Bun installer`
    );

    for (const match of contents.matchAll(/npm install -g bun@([^\s\\]+)/g)) {
        expect(match[1] === '1.3.14', `${path} must install Bun 1.3.14`);
    }

    for (const match of contents.matchAll(/FROM\s+oven\/bun:([^\s]+)/gi)) {
        expect(match[1] === '1.3.14', `${path} must use oven/bun:1.3.14`);
    }
}

for (const path of runtimePinFiles) {
    if (!workflowPathPattern.test(path)) continue;

    const contents = readFileSync(path, 'utf8');
    const setupMatches = contents.matchAll(/uses:\s*oven-sh\/setup-bun@v2/g);

    for (const match of setupMatches) {
        const setupBlock = contents.slice(match.index, match.index + 180);
        expect(
            /bun-version:\s*1\.3\.14/.test(setupBlock),
            `${path} has setup-bun without bun-version 1.3.14`
        );
    }
}

const eslintDependencies = rootPackage.devDependencies ?? {};
expect(eslintDependencies.eslint?.startsWith('^10.'), 'ESLint 10 must be the root baseline');
expect(
    readFileSync('eslint.config.mjs', 'utf8').includes('export default'),
    'Flat ESLint config must export a config array'
);
expect(
    !readFileSync('package.json', 'utf8').includes('eslint-config-airbnb-typescript'),
    'Legacy Airbnb ESLint config must be removed'
);

const learnCardAppPackage = readJson('apps/learn-card-app/package.json', packageSchema);
const scoutsPackage = readJson('apps/scouts/package.json', packageSchema);
const scoutsMemoScript = scoutsPackage.scripts?.['i18n:check-memos'] ?? '';

expect(
    learnCardAppPackage.devDependencies?.['@inlang/paraglide-js'] === '2.20.2',
    'LearnCard App must pin Paraglide to 2.20.2'
);
expect(
    scoutsPackage.devDependencies?.['@inlang/paraglide-js'] === '2.20.2',
    'ScoutPass must pin Paraglide to 2.20.2'
);

expect(
    scoutsMemoScript === 'eslint --no-inline-config --config eslint-i18n-memo.config.mjs src',
    'ScoutPass memo lint must use its flat ESLint config'
);

for (const path of [
    'apps/scouts/eslint-i18n.config.mjs',
    'apps/scouts/eslint-i18n-memo.config.mjs',
]) {
    const contents = readFileSync(path, 'utf8');
    expect(contents.includes('plugins:'), `${path} must register local rules as a flat plugin`);
    expect(contents.includes('local:'), `${path} must define the local rule namespace`);
}

for (const path of ['apps/scouts/package.json', 'apps/scouts/scripts/check-i18n-ast.mjs']) {
    const contents = readFileSync(path, 'utf8');

    for (const removedOption of [
        '--no-eslintrc',
        '--rulesdir',
        '--resolve-plugins-relative-to',
        'useEslintrc',
        'rulePaths',
    ]) {
        expect(!contents.includes(removedOption), `${path} still uses removed ${removedOption}`);
    }
}

for (const path of ['apps/scouts/.eslintrc-i18n.cjs', 'apps/scouts/.eslintrc-i18n-memo.cjs']) {
    expect(!existsSync(path), `${path} must be removed after the flat-config migration`);
}

for (const path of [
    'tsconfig.base.json',
    'tsconfig.browser.json',
    'tsconfig.library.json',
    'tsconfig.node.json',
    'tsconfig.test.json',
]) {
    expect(
        readFileSync(path, 'utf8').includes('compilerOptions'),
        `${path} must be a TypeScript preset`
    );
}

const packageTsconfigs = walkFiles('packages').filter(path => basename(path) === 'tsconfig.json');

for (const path of packageTsconfigs) {
    const contents = readFileSync(path, 'utf8');
    expect(
        contents.includes('tsconfig.library.json') ||
            path === 'packages/learn-card-base/tsconfig.json',
        `${path} must inherit a shared TypeScript preset`
    );
}

expect(
    readFileSync('apps/learn-card-app/tsconfig.json', 'utf8').includes(
        '../../tsconfig.browser.json'
    ),
    'LearnCard App must use the browser preset'
);
expect(
    readFileSync('apps/scouts/tsconfig.json', 'utf8').includes('../../tsconfig.browser.json'),
    'Scouts must use the browser preset'
);

for (const path of [
    'services/learn-card-network/brain-service/tsconfig.json',
    'services/learn-card-network/lca-api/tsconfig.json',
    'services/learn-card-network/learn-cloud-service/tsconfig.json',
]) {
    expect(
        path.includes('tsconfig') && readFileSync(path, 'utf8').includes('tsconfig.node.json'),
        `${path} must use the Node preset`
    );
}
for (const path of [
    'tests/e2e/tsconfig.json',
    'tests/federation-e2e/tsconfig.json',
    'tests/openid4vc-e2e/tsconfig.json',
    'tests/openid4vc-interop-e2e/tsconfig.json',
    'tests/smoketests/tsconfig.json',
]) {
    expect(
        readFileSync(path, 'utf8').includes('tsconfig.test.json'),
        `${path} must use the shared test preset`
    );
}

const projectSchema = z.object({
    name: z.string().optional(),
    targets: z
        .record(
            z.string(),
            z.object({
                executor: z.string(),
                options: z.object({ script: z.string().optional() }).passthrough().optional(),
            })
        )
        .default({}),
});

for (const path of walkFiles('.').filter(file => basename(file) === 'project.json')) {
    const project = readJson(path, projectSchema);

    for (const [target, config] of Object.entries(project.targets)) {
        if (project.name === 'e2e' && target === 'build' && config.executor === 'nx:noop') continue;

        expect(config.executor === 'nx:run-script', `${path} ${target} must use nx:run-script`);
        expect(
            config.options?.script === target,
            `${path} ${target} must invoke package script ${target}`
        );

        if (config.executor !== 'nx:run-script') continue;

        const projectPackagePath = join(dirname(path), 'package.json');
        expect(existsSync(projectPackagePath), `${path} must have a package.json`);

        if (!existsSync(projectPackagePath)) continue;

        const projectPackage = readJson(projectPackagePath, packageSchema);
        expect(
            Boolean(projectPackage.scripts?.[target]),
            `${path} ${target} must have package script ${target}`
        );
    }
}

for (const error of validateEnvironmentExamples()) failures.push(error);
expect(
    environmentContracts.length === 5,
    'All five deployable environment contracts must be registered'
);

if (failures.length) {
    console.error(failures.map(failure => `- ${failure}`).join('\n'));
    process.exit(1);
}

const run = (
    command: string,
    args: string[],
    label: string,
    environment: Record<string, string> = {}
): void => {
    console.log(`\n▶ ${label}`);

    const result = spawnSync(command, args, {
        env: { ...process.env, ...environment },
        stdio: 'inherit',
    });

    if (result.error) {
        console.error(`${label} failed to start:`, result.error);
        process.exit(1);
    }

    if (result.status !== 0) {
        console.error(`${label} failed with exit code ${result.status ?? 1}.`);
        process.exit(result.status ?? 1);
    }
};

run('bun', ['run', 'lint'], 'Canonical lint');
run('bun', ['run', 'typecheck'], 'Canonical typecheck');
run(
    'bunx',
    ['nx', 'build', 'learn-card-app', '--skip-nx-cache'],
    'LearnCard App dependency-aware build'
);
run('bunx', ['nx', 'build', 'scouts', '--skip-nx-cache'], 'Scouts dependency-aware build', {
    VITE_NODE_ENV: 'development',
    VITE_WEB3AUTH_CLIENT_ID: 'lc-1984-verification-client',
    GOOGLE_MAPS_API_KEY: 'lc-1984-verification-maps-key',
});
run(
    'bunx',
    ['nx', 'build', 'react', '--skip-nx-cache'],
    'React component library dependency-aware build'
);

console.log('LC-1984 tooling verification passed.');
