const { execFileSync } = require('node:child_process');

// These paths cannot change the workspace Vitest configurations or Nx test target
// definitions exercised by the two sweeps. Keep config imports out of this set.
const unrelated = file => {
    if (/(^|\/)(?:vite\.|vitest\.|tsconfig|project\.json$|package\.json$)/.test(file)) return false;
    if (
        file.startsWith('apps/learn-card-app/src/i18n/paraglideLazyLocales') ||
        file.startsWith('apps/learn-card-app/src/config/buildEnvironment')
    )
        return false;

    return (
        /^(?:docs|\.changeset)\/.+\.md$/.test(file) ||
        /^(?:apps|packages|services)\/.+\/(?:src|test|tests)\/.+\.(?:[cm]?[jt]sx?|css|scss|wasm)$/.test(
            file
        )
    );
};

const workspaceCheckReason = (event, base, head, cwd) => {
    const sha = /^[0-9a-f]{40}$/;
    if (!['pull_request', 'merge_group'].includes(event) || !sha.test(base) || !sha.test(head))
        return 'full checks (no trusted event range)';

    const git = (...args) =>
        execFileSync('git', args, {
            cwd,
            encoding: 'utf8',
            stdio: ['ignore', 'pipe', 'pipe'],
            timeout: 10000,
        });
    try {
        if (git('rev-parse', 'HEAD').trim() !== head) return 'full checks (checkout mismatch)';
        const ancestor = git('merge-base', '--all', base, head).trim();
        if (!sha.test(ancestor) || (event === 'merge_group' && ancestor !== base))
            return 'full checks (uncertain comparison base)';
        const paths = git('diff', '--no-renames', '--name-only', '-z', ancestor, head, '--')
            .split('\0')
            .filter(Boolean);
        if (!paths.length || !paths.every(unrelated))
            return 'full checks (workspace input or unknown path)';
        return false;
    } catch {
        return 'full checks (Git comparison unavailable)';
    }
};

module.exports = { workspaceCheckReason };
