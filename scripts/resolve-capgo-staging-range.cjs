const { resolveDeployRange } = require('./resolve-deploy-range.cjs');

/**
 * A green Capgo workflow may have skipped uploading, including before this fix.
 * Only a completed upload AND channel assignment acknowledge staging delivery.
 */
const resolveCapgoStagingRange = async ({ github, repo, head, runId, cwd, warn }) => {
    const range = await resolveDeployRange({
        github,
        repo,
        head,
        runId,
        cwd,
        warn,
        release: false,
        workflowId: 'capgo-staging.yml',
        // At most 100 successful runs / job lookups. Exhaustion rebuilds one app,
        // rather than spending an unbounded API budget searching past no-op runs.
        maxPages: 1,
        acceptRun: async run => {
            const { data } = await github.rest.actions.listJobsForWorkflowRun({
                ...repo,
                run_id: run.id,
                filter: 'latest',
                per_page: 100,
            });
            // One bounded jobs page is deliberate. Incomplete metadata cannot
            // prove delivery; rebuild the app rather than expand the API budget.
            if (
                !Array.isArray(data.jobs) ||
                !Number.isInteger(data.total_count) ||
                data.total_count !== data.jobs.length
            ) {
                throw new Error('Incomplete Capgo delivery history.');
            }
            return data.jobs.some(
                job =>
                    job.name === 'Upload staging bundle / Upload CapGo Bundle' &&
                    job.head_sha === run.head_sha &&
                    job.conclusion === 'success' &&
                    ['Upload bundle (CapGo)', 'Set channel default (CapGo)'].every(name =>
                        job.steps?.some(step => step.name === name && step.conclusion === 'success')
                    )
            );
        },
    });
    return { ...range, workflow: 'capgo-staging.yml' };
};

module.exports = { resolveCapgoStagingRange };
