const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const vm = require('node:vm');

const root = path.resolve(__dirname, '../..');
const readWorkflow = file => {
    // Reuse the neighboring shell contracts' parser without adding a JS dependency.
    const result = spawnSync(
        'ruby',
        [
            '-rjson',
            '-ryaml',
            '-e',
            'puts JSON.generate(YAML.load_file(ARGV.fetch(0), aliases: true))',
            file,
        ],
        { encoding: 'utf8' }
    );
    assert.equal(result.status, 0, result.stderr);
    const workflow = JSON.parse(result.stdout);
    // Ruby's YAML 1.1 parser treats an unquoted "on" key as true.
    workflow.on ??= workflow.true;
    delete workflow.true;
    return workflow;
};
const main = readWorkflow(process.argv[2] || path.join(root, '.github/workflows/deploy.yml'));
const agent = readWorkflow(process.argv[3] || path.join(root, '.github/workflows/test.yml'));
const determine = main.jobs['determine-affected'];
const validate = main.jobs['validate-ai-agent'];
const deploy = main.jobs['deploy-ai-agent'];
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'learncard-ai-deploy-'));
let invocation = 0;
let base;
const git = (...args) => {
    const result = spawnSync(
        'git',
        ['-c', 'core.hooksPath=/dev/null', '-c', 'commit.gpgsign=false', ...args],
        {
            cwd: temporary,
            encoding: 'utf8',
        }
    );
    assert.equal(result.status, 0, result.stderr);
    return result.stdout.trim();
};

// These routing expressions use JavaScript-compatible comparisons/boolean operators.
// Bracket access preserves GitHub's hyphenated job/input names when evaluating them.
const evaluate = (expression, context) =>
    vm.runInNewContext(
        expression
            .trim()
            .replace(/^\$\{\{\s*|\s*\}\}$/g, '')
            .replace(/\.([\w-]+)/g, '["$1"]'),
        {
            always: () => true,
            cancelled: () => false,
            contains: (value, item) => value.includes(item),
            ...context,
        },
        { timeout: 1000 }
    );

const runStep = (id, values) => {
    const output = path.join(temporary, `output-${invocation++}`);
    const step = determine.steps.find(candidate => candidate.id === id);
    const result = spawnSync('bash', ['-e', '-o', 'pipefail', '-c', step.run], {
        cwd: temporary,
        encoding: 'utf8',
        env: {
            ...process.env,
            GITHUB_OUTPUT: output,
            ...values,
        },
    });
    assert.equal(result.status, 0, result.stderr);
    return Object.fromEntries(
        fs
            .readFileSync(output, 'utf8')
            .trim()
            .split('\n')
            .map(line => line.split('='))
    );
};

const route = ({
    message = 'feat: update AI Agent',
    bumpedPackages = [],
    affected = 'ai-agent-service',
    tests = 'success',
    manual = false,
    selected = false,
    environment = 'staging',
    cancelled = false,
    detection = 'success',
    validation = 'success',
    eventName = 'push',
} = {}) => {
    git('reset', '--hard', base);
    for (const filename of bumpedPackages) {
        fs.writeFileSync(path.join(temporary, filename), JSON.stringify({ version: '1.1.0' }));
    }
    git('add', '.');
    git('commit', '--allow-empty', '-m', message);
    const head = git('rev-parse', 'HEAD');
    const steps = {
        affected: { outputs: { affected } },
        check_manual: { outputs: { is_manual: String(manual) } },
        check_release: { outputs: manual ? {} : runStep('check_release', { COMMIT_MSG: message }) },
        check_versions: {
            outputs: manual ? {} : runStep('check_versions', { NX_BASE: base, NX_HEAD: head }),
        },
    };
    const outputs = Object.fromEntries(
        Object.entries(determine.outputs)
            .filter(([name]) =>
                ['affected', 'is_manual', 'is_release', 'ai_agent_changed'].includes(name)
            )
            .map(([name, expression]) => [
                name,
                evaluate(expression, { steps, job: { status: detection } }),
            ])
    );
    const results = {
        'determine-affected': { result: detection, outputs },
        'test-affected': { result: tests },
    };
    const context = {
        github: { event_name: manual ? 'workflow_dispatch' : eventName },
        inputs: { 'deploy-ai-agent': selected, 'target-environment': environment },
        cancelled: () => cancelled,
    };
    context.needs = Object.fromEntries(validate.needs.map(name => [name, results[name]]));
    const validationSelected = evaluate(validate.if, context);
    results['validate-ai-agent'] = {
        result: validationSelected ? validation : 'skipped',
        outputs: Object.fromEntries(
            Object.entries(validate.outputs).map(([name, expression]) => [
                name,
                evaluate(expression, context),
            ])
        ),
    };
    context.needs = Object.fromEntries(deploy.needs.map(name => [name, results[name]]));
    if (!evaluate(deploy.if, context)) return undefined;
    const target = evaluate(deploy.env.TARGET_ENVIRONMENT, context);
    const interpolate = value =>
        value.replace(/\$\{\{.*?\}\}/g, expression => evaluate(expression, context));
    assert.equal(interpolate(deploy.environment), `learn-card-ai-agent-${target}`);
    assert.equal(interpolate(deploy.concurrency.group), `deploy-ai-agent-${target}`);
    return target;
};

try {
    // Real versioned trees exercise the workflow command and its job-output gate.
    git('init', '-b', 'main');
    git('config', 'user.name', 'AI deployment routing fixture');
    git('config', 'user.email', 'routing@example.invalid');
    fs.writeFileSync(path.join(temporary, '.gitignore'), 'output-*\n');
    for (const filename of [
        'services/learn-card-network/brain-service/package.json',
        'services/learn-card-network/learn-cloud-service/package.json',
        'services/learn-card-network/lca-api/package.json',
        'services/learn-card-network/ai-agent/package.json',
        'apps/learn-card-app/package.json',
    ]) {
        fs.mkdirSync(path.dirname(path.join(temporary, filename)), { recursive: true });
        fs.writeFileSync(path.join(temporary, filename), JSON.stringify({ version: '1.0.0' }));
    }
    fs.mkdirSync(path.join(temporary, 'scripts'));
    fs.copyFileSync(
        path.join(root, 'scripts/resolve-deploy-range.cjs'),
        path.join(temporary, 'scripts/resolve-deploy-range.cjs')
    );
    git('add', '.');
    git('commit', '-m', 'routing baseline');
    base = git('rev-parse', 'HEAD');

    assert.equal(route(), 'staging', 'affected main pushes must deploy staging');
    assert.equal(
        route({ tests: 'failure' }),
        undefined,
        'failed staging tests must block deployment'
    );
    assert.equal(
        route({ eventName: 'pull_request' }),
        undefined,
        'pull requests must never deploy even if validation succeeds'
    );
    assert.equal(
        route({ affected: 'scouts' }),
        undefined,
        'unrelated main pushes must not deploy AI'
    );

    const release = { message: 'chore(release): version packages', tests: 'skipped' };
    const aiPackage = 'services/learn-card-network/ai-agent/package.json';
    assert.equal(
        route({ ...release, bumpedPackages: [aiPackage] }),
        'production',
        'AI version releases must deploy production'
    );
    assert.equal(
        route({ ...release, bumpedPackages: [aiPackage], validation: 'failure' }),
        undefined,
        'failed AI validation must block production before environment approval'
    );
    assert.equal(
        route({ tests: 'skipped' }),
        undefined,
        'ordinary staging deployments must not bypass skipped tests'
    );
    assert.equal(
        route({ ...release, bumpedPackages: ['apps/learn-card-app/package.json'] }),
        undefined,
        'other package releases must not deploy AI'
    );
    assert.equal(
        route({ ...release, bumpedPackages: [aiPackage], cancelled: true }),
        undefined,
        'cancelled releases must not deploy'
    );
    assert.equal(
        route({ detection: 'failure' }),
        undefined,
        'failed affected detection must not deploy'
    );
    assert.equal(
        route({ ...release, bumpedPackages: [aiPackage], detection: 'failure' }),
        undefined,
        'failed range determination must not enable production release routing'
    );

    const manual = { manual: true, selected: true, tests: 'skipped' };
    assert.equal(route({ ...manual, environment: 'production' }), 'production');
    assert.equal(route({ ...manual, environment: 'staging' }), 'staging');
    assert.equal(
        route({ ...manual, environment: 'scouts' }),
        undefined,
        'ScoutPass dispatch must not select AI'
    );
    assert.equal(
        route({ ...manual, selected: false }),
        undefined,
        'manual component selection must be honored'
    );

    assert.deepEqual(
        [main, agent].filter(workflow => Object.hasOwn(workflow.on, 'push')),
        [main],
        'main Deploy must be the only automatic deployment entrypoint'
    );
    const aiChecks = agent.jobs['ai-agent'];
    assert.equal(
        evaluate(aiChecks.if, { github: { event_name: 'pull_request' } }),
        true,
        'AI checks must run on pull requests'
    );
    assert.equal(
        evaluate(aiChecks.if, { github: { event_name: 'workflow_dispatch' } }),
        false,
        'manual test fallback must not run the PR-only AI job'
    );
    assert.equal(
        aiChecks.environment,
        undefined,
        'AI checks must not enter deployment environments'
    );
    assert.deepEqual(aiChecks.permissions, { contents: 'read' });
    assert.equal(agent.on.pull_request.paths, undefined, 'AI CI must also report on unrelated PRs');
    console.log(
        'AI Agent routing passed: affected staging, Changesets production, failure/cancellation gates, manual overrides, and PR isolation.'
    );
} finally {
    fs.rmSync(temporary, { recursive: true, force: true });
}
