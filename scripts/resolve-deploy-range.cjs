const { execFileSync, spawnSync } = require('node:child_process');
const { appendFileSync } = require('node:fs');

const SHA = /^[a-f0-9]{40}$/;
const PAGE_SIZE = 100;
const MAX_PAGES = 10;

/** Match deploy.yml's existing automatic production-release classification. */
const isReleaseCommit = message => message.includes('chore(release):');

/**
 * Select a successful automatic Deploy ancestor in the same deployment mode.
 * Manual runs deploy only selected components/environments; release pushes deploy
 * production rather than staging. Neither can acknowledge the other mode's work.
 * Missing staging history compares the full tree; production requires a baseline.
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
        if (release) {
            // Selecting every app flag can publish an unchanged native/OTA
            // version. Require history or an explicit manual recovery instead.
            throw new Error(`No trusted production-release Deploy baseline (${reason}).`);
        }
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
        } catch (error) {
            // An API/permission failure must not silently drop undeployed changes.
            // Keep HTTP diagnostics in the summary/error without exposing raw
            // transport messages, request headers or other credential details.
            const status = error?.status;
            const reason =
                Number.isInteger(status) && status >= 400 && status <= 599
                    ? `history-unavailable-http-${status}`
                    : 'history-unavailable';
            return fullTree(reason);
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

/** Compare actual versions so unrelated package edits cannot publish the app. */
const getDeploymentChangeFlags = ({ base, head, cwd = process.cwd() }) => {
    if (![base, head].every(sha => SHA.test(sha ?? ''))) {
        throw new Error('Deployment comparison requires full base/head object IDs.');
    }
    const git = args => execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();
    const versionAt = (revision, file) => {
        if (!git(['ls-tree', revision, '--', file])) return undefined;
        const version = JSON.parse(git(['show', `${revision}:${file}`])).version;
        if (typeof version !== 'string' || !version) {
            throw new Error(`Missing package version in ${file}.`);
        }
        return version;
    };
    const packages = {
        brain_service_changed: 'services/learn-card-network/brain-service/package.json',
        learn_cloud_changed: 'services/learn-card-network/learn-cloud-service/package.json',
        lca_api_changed: 'services/learn-card-network/lca-api/package.json',
        ai_agent_changed: 'services/learn-card-network/ai-agent/package.json',
        lca_app_changed: 'apps/learn-card-app/package.json',
    };
    const flags = Object.fromEntries(
        Object.entries(packages).map(([flag, file]) => [
            flag,
            versionAt(base, file) !== versionAt(head, file),
        ])
    );
    flags.native_plugin_changed = git(['diff', '--name-only', base, head])
        .split('\n')
        .some(file => /^packages\/plugins\/didkit-plugin-node\/(native|src)\//.test(file));
    return flags;
};

if (require.main === module) {
    if (process.argv[2] !== 'changes' || process.argv.length !== 5 || !process.env.GITHUB_OUTPUT) {
        throw new Error(
            'Usage: resolve-deploy-range.cjs changes <base> <head> with GITHUB_OUTPUT.'
        );
    }
    const flags = getDeploymentChangeFlags({ base: process.argv[3], head: process.argv[4] });
    appendFileSync(
        process.env.GITHUB_OUTPUT,
        Object.entries(flags)
            .map(([key, value]) => `${key}=${value}\n`)
            .join('')
    );
}

module.exports = { resolveDeployRange, getDeploymentChangeFlags };
