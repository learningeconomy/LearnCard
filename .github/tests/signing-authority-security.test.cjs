const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const vm = require('node:vm');
const yaml = require('js-yaml');

const root = path.resolve(__dirname, '../..');
const workflow = yaml.load(
    readFileSync(path.join(root, '.github/workflows/migrate-signing-authority-seeds.yml'), 'utf8')
);
const preflight = workflow.jobs.preflight;
const script = preflight.steps.find(step => step.uses?.startsWith('actions/github-script@')).with
    .script;

const runPreflight = ({
    ref = 'refs/heads/main',
    protectedBranch = true,
    policy = { protected_branches: true, custom_branch_policies: false },
    reviewers = [],
    phase = 'dry-run',
    environment = 'scout-app-api-production',
    apiError = false,
} = {}) => {
    const calls = [];
    const request = data => async args => {
        calls.push(args);
        if (apiError) throw new Error('API unavailable');
        return { data };
    };
    const promise = vm.runInNewContext(`(async () => { ${script} })()`, {
        context: { ref, repo: { owner: 'learningeconomy', repo: 'LearnCard' } },
        process: { env: { TARGET_ENVIRONMENT: environment, MIGRATION_PHASE: phase } },
        github: {
            rest: {
                repos: {
                    getBranch: request({ protected: protectedBranch }),
                    getEnvironment: request({
                        deployment_branch_policy: policy,
                        protection_rules: [{ type: 'required_reviewers', reviewers }],
                    }),
                },
            },
        },
    });
    return { promise, calls };
};

async function main() {
    // A preflight must not itself request the environment or receive deployment credentials.
    assert.equal(preflight.environment, undefined);
    assert(!JSON.stringify(preflight).includes('secrets.'));
    assert.equal(preflight.permissions.actions, 'read');
    assert.equal(workflow.jobs.migrate.needs, 'preflight');
    assert.equal(workflow.jobs.migrate.environment, '${{ inputs.target-environment }}');
    const wrongBranch = runPreflight({ ref: 'refs/heads/feature' });
    await assert.rejects(wrongBranch.promise, /main branch/);
    assert.equal(wrongBranch.calls.length, 0);
    for (const options of [
        { policy: null },
        { policy: { protected_branches: false, custom_branch_policies: true } },
        { protectedBranch: false },
        { apiError: true },
        { phase: 'purge' },
    ]) {
        await assert.rejects(runPreflight(options).promise);
    }
    await runPreflight().promise;
    await runPreflight({ phase: 'purge', reviewers: [{ type: 'Team', reviewer: { id: 1 } }] })
        .promise;
    await runPreflight({ phase: 'purge', environment: 'scout-app-api-staging' }).promise;

    const { countLegacySigningAuthorityKeys, getAuditRedisOptions } = await import(
        pathToFileURL(
            path.join(
                root,
                'services/learn-card-network/lca-api/scripts/check-signing-authority-redis.mjs'
            )
        )
    );
    const calls = [];
    const pages = [
        ['7', []],
        ['12', ['sa|synthetic-owner|main']],
        ['0', []],
    ];
    const count = await countLegacySigningAuthorityKeys({
        scan: async (...args) => {
            calls.push(args);
            return pages.shift();
        },
    });
    assert.equal(count, 1);
    assert.deepEqual(
        calls,
        ['0', '7', '12'].map(cursor => [cursor, 'MATCH', 'sa|*', 'COUNT', 500])
    );
    assert.equal(await countLegacySigningAuthorityKeys({ scan: async () => ['0', []] }), 0);
    await assert.rejects(
        countLegacySigningAuthorityKeys({
            scan: async () => {
                throw new Error('connection failed');
            },
        })
    );
    for (const env of [
        {},
        { REDIS_HOST: 'localhost' },
        { REDIS_HOST: 'localhost', REDIS_PORT: '0' },
        { REDIS_HOST: 'localhost', REDIS_PORT: '6379', REDIS_DB: '-1' },
    ]) {
        assert.throws(() => getAuditRedisOptions(env));
    }
    const options = getAuditRedisOptions({ REDIS_HOST: 'localhost', REDIS_PORT: '6379' });
    assert.equal(options.db, 0);
    assert.equal(options.retryStrategy(), null);
    assert.equal(options.maxRetriesPerRequest, 0);
    console.log('Signing-authority environment guards and read-only Redis audit checks passed.');
}

main().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
