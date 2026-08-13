#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

cd "$REPO_ROOT"

bun - <<'BUN'
import { readFileSync } from 'node:fs';

const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));

if (packageJson.devDependencies?.['@balena/dockerignore'] !== '1.0.2') {
    throw new Error('@balena/dockerignore 1.0.2 must be a direct root devDependency');
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
