const { execFileSync, spawnSync } = require('node:child_process');

const SHA = /^[a-f0-9]{40}$/;
const PAGE_SIZE = 100;
const MAX_PAGES = 10;

/** Match deploy.yml's existing automatic production-release classification. */
const isReleaseCommit = message => message.includes('chore(release):');

/**
 * Select a successful automatic Deploy ancestor in the same deployment mode.
 * Manual runs deploy only selected components/environments; release pushes deploy
 * production rather than staging. Neither can acknowledge the other mode's work.
 * Missing/unavailable history compares the entire tree, never just the last commit.
 */
const resolveDeployRange = async ({
    github,
    repo,
    head,
    runId,
    release,
    cwd = process.cwd(),
    warn = console.warn,
}) => {
    const git = (args, input) =>
        execFileSync('git', args, {
            cwd,
            input,
            encoding: 'utf8',
            stdio: ['pipe', 'pipe', 'pipe'],
        }).trim();

    if (!SHA.test(head ?? '') || git(['rev-parse', '--verify', 'HEAD']) !== head) {
        throw new Error('Deployment head must be the full SHA of the checked-out commit.');
    }
    if (
        typeof release !== 'boolean' ||
        isReleaseCommit(git(['show', '-s', '--format=%B', head])) !== release
    ) {
        throw new Error('Deployment mode does not match the checked-out commit.');
    }

    const mode = release ? 'production-release' : 'staging';
    const fullTree = reason => {
        // Persist the empty tree locally so both git diff and Nx can resolve it.
        const base = git(['hash-object', '-t', 'tree', '-w', '--stdin'], '');
        warn(`No trusted ${mode} Deploy baseline (${reason}); comparing the full tree.`);
        return { base, head, mode, source: 'full-tree', reason, successfulRunId: '' };
    };

    for (let page = 1; page <= MAX_PAGES; page += 1) {
        let runs;
        try {
            const response = await github.rest.actions.listWorkflowRuns({
                ...repo,
                workflow_id: 'deploy.yml',
                branch: 'main',
                event: 'push',
                status: 'success',
                per_page: PAGE_SIZE,
                page,
            });
            runs = response.data.workflow_runs;
            if (!Array.isArray(runs)) throw new Error('Invalid workflow history response.');
        } catch {
            // An API/permission failure must not silently drop undeployed changes.
            return fullTree('history-unavailable');
        }

        for (const run of runs) {
            if (
                run.id === runId ||
                run.event !== 'push' ||
                run.head_branch !== 'main' ||
                run.conclusion !== 'success' ||
                !SHA.test(run.head_sha ?? '')
            ) {
                continue;
            }
            const ancestor = spawnSync('git', ['merge-base', '--is-ancestor', run.head_sha, head], {
                cwd,
                stdio: 'ignore',
            });
            // Also excludes newer commits during an old-run rerun, rewritten
            // history, and expired/missing Git objects. Full-tree fallback is safe.
            if (ancestor.status !== 0) continue;
            const message = git(['show', '-s', '--format=%B', run.head_sha]);
            if (isReleaseCommit(message) !== release) continue;

            return {
                base: run.head_sha,
                head,
                mode,
                source: 'successful-deploy',
                reason: 'matching-mode-ancestor',
                successfulRunId: String(run.id),
            };
        }
        if (runs.length < PAGE_SIZE) return fullTree('no-successful-ancestor');
    }
    return fullTree('history-limit');
};

module.exports = { resolveDeployRange };
