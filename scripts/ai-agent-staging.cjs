const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');

const SHA = /^[a-f0-9]{40}$/;
const WORKFLOW = '.github/workflows/ai-agent-staging.yml';
const CHECKPOINT = 'Record successful AI Agent rollout';
const request = { timeout: 10000 };
const positive = value => Number.isSafeInteger(value) && value > 0;
const gitAt = cwd => (args, input) =>
    execFileSync('git', args, {
        cwd,
        input,
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
const ancestor = (cwd, base, head) =>
    SHA.test(base ?? '') &&
    SHA.test(head ?? '') &&
    spawnSync('git', ['merge-base', '--is-ancestor', base, head], { cwd, stdio: 'ignore' })
        .status === 0;
const trusted = (run, workflow, repositoryId, event) =>
    positive(run?.id) &&
    positive(run.run_attempt) &&
    run.workflow_id === workflow.id &&
    run.path === workflow.path &&
    run.event === event &&
    run.head_branch === 'main' &&
    run.repository?.id === repositoryId &&
    run.head_repository?.id === repositoryId &&
    run.status === 'completed' &&
    run.conclusion === 'success' &&
    SHA.test(run.head_sha ?? '');

/**
 * Only successful automatic staging Deploys may hand off. Compare with newer
 * successful staging Deploys, not raw main: an untested push must not starve a
 * ready rollout. Repeat this check under the target lock immediately before
 * mutating Trigger/ECS. API failures fail closed at this privilege boundary.
 */
async function eligibleSource({
    github,
    repo,
    repositoryId,
    runId,
    attempt,
    head,
    cwd = process.cwd(),
}) {
    assert(
        positive(repositoryId) && positive(runId) && positive(attempt) && SHA.test(head ?? ''),
        'Invalid rollout source'
    );
    const api = github.rest.actions;
    const workflow = (await api.getWorkflow({ ...repo, workflow_id: 'deploy.yml', request })).data;
    assert.equal(workflow.path, '.github/workflows/deploy.yml', 'Unexpected source workflow');
    const source = (await api.getWorkflowRun({ ...repo, run_id: runId, request })).data;
    assert(
        trusted(source, workflow, repositoryId, 'push'),
        'Source must be a successful main Deploy push'
    );
    assert.equal(source.run_attempt, attempt, 'Source attempt changed');
    assert.equal(source.head_sha, head, 'Source revision changed');
    const git = gitAt(cwd);
    const main = (await github.rest.git.getRef({ ...repo, ref: 'heads/main', request })).data.object
        .sha;
    assert(SHA.test(main ?? ''), 'Invalid main revision');
    // Fetching main is left to checkout; if it advances, fetch that immutable object.
    if (!ancestor(cwd, head, main)) {
        git(['fetch', '--no-tags', 'origin', main]);
        assert(ancestor(cwd, head, main), 'Source is no longer on main');
    }
    const release = sha => git(['show', '-s', '--format=%B', sha]).includes('chore(release):');
    if (release(head)) return { current: false, reason: 'production-release' };
    // An in-flight Deploy created before this handoff existed already owns AI.
    if (
        spawnSync('git', ['cat-file', '-e', `${head}:${WORKFLOW}`], { cwd, stdio: 'ignore' })
            .status !== 0
    ) {
        return { current: false, reason: 'pre-separation-source' };
    }
    const history = (
        await api.listWorkflowRuns({
            ...repo,
            workflow_id: workflow.id,
            branch: 'main',
            event: 'push',
            status: 'success',
            per_page: 100,
            request,
        })
    ).data.workflow_runs;
    assert(Array.isArray(history), 'Missing source history');
    for (const run of history) {
        if (!trusted(run, workflow, repositoryId, 'push') || run.head_sha === head) continue;
        if (
            ancestor(cwd, head, run.head_sha) &&
            ancestor(cwd, run.head_sha, main) &&
            !release(run.head_sha)
        ) {
            return { current: false, reason: 'newer-successful-deploy' };
        }
    }
    // If the source is outside the bounded window, do not guess it is current.
    assert(
        history.some(run => run.id === runId && run.run_attempt === attempt),
        'Source outside bounded history'
    );
    return { current: true, reason: 'latest-successful-staging-deploy' };
}

/**
 * workflow_run's head_sha is the DEFAULT BRANCH checkout, not the deployed SHA.
 * Read the explicit revision in the reusable rollout job's name, and require its
 * successful terminal checkpoint. A green no-op workflow cannot acknowledge a
 * deployment. The job name/checkpoint form a versioned contract with that workflow.
 */
async function resolveRange({
    github,
    repo,
    repositoryId,
    head,
    runId,
    cwd = process.cwd(),
    warn = console.warn,
}) {
    assert(SHA.test(head ?? ''), 'Invalid staging revision');
    const git = gitAt(cwd);
    const fallback = reason => {
        warn(`AI Agent staging baseline unavailable (${reason}); compare the full tree.`);
        return {
            base: git(['hash-object', '-t', 'tree', '-w', '--stdin'], ''),
            head,
            source: 'full-tree',
            reason,
        };
    };
    try {
        const api = github.rest.actions;
        const workflow = (
            await api.getWorkflow({ ...repo, workflow_id: 'ai-agent-staging.yml', request })
        ).data;
        assert.equal(workflow.path, WORKFLOW);
        const history = (
            await api.listWorkflowRuns({
                ...repo,
                workflow_id: workflow.id,
                event: 'workflow_run',
                branch: 'main',
                status: 'success',
                per_page: 100,
                request,
            })
        ).data.workflow_runs;
        assert(Array.isArray(history));
        // Pick the newest deployed ancestor by Git ancestry, not run creation time:
        // retrying an old run does not make its revision the newest deployment.
        let selected;
        for (const run of history) {
            if (run.id === runId || !trusted(run, workflow, repositoryId, 'workflow_run')) continue;
            const response = (
                await api.listJobsForWorkflowRun({
                    ...repo,
                    run_id: run.id,
                    filter: 'latest',
                    per_page: 100,
                    request,
                })
            ).data;
            assert(
                Array.isArray(response.jobs) && response.total_count === response.jobs.length,
                'Incomplete jobs'
            );
            for (const job of response.jobs) {
                const match = /^Roll out AI Agent \/ Deploy AI Agent ([a-f0-9]{40})$/.exec(
                    job.name ?? ''
                );
                if (
                    !match ||
                    job.conclusion !== 'success' ||
                    !job.steps?.some(
                        step => step.name === CHECKPOINT && step.conclusion === 'success'
                    ) ||
                    !ancestor(cwd, match[1], head)
                )
                    continue;
                const latest = (await api.getWorkflowRun({ ...repo, run_id: run.id, request }))
                    .data;
                if (
                    !trusted(latest, workflow, repositoryId, 'workflow_run') ||
                    latest.run_attempt !== run.run_attempt
                )
                    continue;
                if (!selected || ancestor(cwd, selected.base, match[1])) {
                    selected = {
                        base: match[1],
                        head,
                        source: 'successful-ai-rollout',
                        successfulRunId: String(run.id),
                    };
                }
            }
        }
        return selected || fallback('no-confirmed-rollout');
    } catch {
        // Missing history may cause redundant deployment, never lost changes.
        return fallback('history-unavailable');
    }
}
module.exports = { eligibleSource, resolveRange };
