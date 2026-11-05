const { writeFileSync } = require('node:fs');
const path = require('node:path');

const workflow = 'nx-artifact-producer.yml';
const artifactName = 'nx-main-build-payloads';

exports.eligible = (run, repository, baseSha, now = Date.now()) =>
    run.conclusion === 'success' &&
    run.event === 'workflow_dispatch' &&
    run.head_branch === 'main' &&
    run.path === `.github/workflows/${workflow}` &&
    run.head_repository?.full_name === repository &&
    /^[a-f0-9]{40}$/.test(run.head_sha) &&
    /^[a-f0-9]{40}$/.test(baseSha) &&
    now - Date.parse(run.created_at) >= 0 &&
    now - Date.parse(run.created_at) < 7 * 24 * 60 * 60 * 1000;

exports.selectProducer = async ({ github, context, core }) => {
    core.setOutput('active', 'true');
    const repo = context.repo;
    const baseSha = context.payload.merge_group.base_sha;
    const deadline = Date.now() + 20_000;
    const request = () => {
        if (Date.now() >= deadline) throw new Error('Lookup budget exhausted');
        return { timeout: Math.min(5_000, deadline - Date.now()) };
    };
    try {
        const { data } = await github.rest.actions.listWorkflowRuns({
            ...repo,
            workflow_id: workflow,
            branch: 'main',
            event: 'workflow_dispatch',
            status: 'success',
            per_page: 10,
            request: request(),
        });
        for (const run of data.workflow_runs) {
            if (!exports.eligible(run, `${repo.owner}/${repo.repo}`, baseSha)) continue;
            const { data: comparison } = await github.rest.repos.compareCommitsWithBasehead({
                ...repo,
                basehead: `${run.head_sha}...${baseSha}`,
                request: request(),
            });
            if (!['ahead', 'identical'].includes(comparison.status)) continue;
            const { data: artifacts } = await github.rest.actions.listWorkflowRunArtifacts({
                ...repo,
                run_id: run.id,
                per_page: 100,
                request: request(),
            });
            const matches = artifacts.artifacts.filter(a => a.name === artifactName && !a.expired);
            if (matches.length !== 1) continue;
            const producer = {
                runId: run.id,
                runAttempt: run.run_attempt,
                headSha: run.head_sha,
                artifactId: matches[0].id,
                artifactDigest: matches[0].digest,
            };
            writeFileSync(
                path.join(process.env.RUNNER_TEMP, 'nx-pilot-producer.json'),
                JSON.stringify(producer)
            );
            core.setOutput('run-id', String(run.id));
            core.setOutput('artifact-id', String(matches[0].id));
            core.info(`Selected main producer ${run.id} at ${run.head_sha}`);
            return;
        }
        core.notice('No eligible main producer; the pilot will execute without shared cache.');
    } catch {
        // Cache availability must never replace or prevent the required tests.
        core.notice('Producer lookup unavailable; the pilot will execute without shared cache.');
    }
};
