#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

cd "$REPO_ROOT"

bun - <<'BUN'
import { readFileSync } from 'node:fs';

const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));

const EXACT_SEMVER =
    /^(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;

const isExactSemver = (version: unknown): version is string =>
    typeof version === 'string' && EXACT_SEMVER.test(version);

for (const version of ['1.0.2', '1.0.3', '2.0.0-beta.1', '2.0.0+build.5']) {
    if (!isExactSemver(version)) {
        throw new Error(`exact semantic version ${version} must satisfy the dependency policy`);
    }
}

for (const version of [
    '^1.0.2',
    '~1.0.2',
    '>=1.0.2',
    '1.x',
    '*',
    'latest',
    'workspace:*',
    'https://example.com/dockerignore.tgz',
]) {
    if (isExactSemver(version)) {
        throw new Error(`non-exact dependency version ${version} must be rejected`);
    }
}

if (!isExactSemver(packageJson.devDependencies?.['@balena/dockerignore'])) {
    throw new Error('@balena/dockerignore must be an exactly pinned direct root devDependency');
}

const { default: dockerignore } = await import('@balena/dockerignore');

const matcher = dockerignore({ ignorecase: false }).add(
    readFileSync('.dockerignore', 'utf8')
);

const assertIgnored = (path: string): void => {
    if (!matcher.ignores(path)) {
        throw new Error(`${path} must be excluded from the Docker context`);
    }
};

const assertIncluded = (path: string): void => {
    if (matcher.ignores(path)) {
        throw new Error(`${path} must remain in the Docker context`);
    }
};

// Break caught: the retained native Nx cache changed whole-repository COPY keys.
assertIgnored('.nx-cache/state.bin');
assertIgnored('.nx-cache/nested/output.json');

// Guard against an accidentally broad rule that strips build inputs.
assertIncluded('bun.lock');
assertIncluded('packages/learn-card-types/src/index.ts');
BUN

echo 'Docker ignore contract passed'
