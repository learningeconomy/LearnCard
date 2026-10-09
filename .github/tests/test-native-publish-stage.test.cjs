const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const vm = require('node:vm');
const yaml = require('js-yaml');

const root = path.resolve(__dirname, '../..');
const workflow = yaml.load(
    fs.readFileSync(path.join(root, '.github/workflows/fastlane-deploy-native-apps.yml'), 'utf8')
);
const evaluate = (expression, context) =>
    vm.runInNewContext(
        expression
            .replace(/^\$\{\{\s*|\s*\}\}$/g, '')
            .replaceAll('steps.scouts-stage-env', "steps['scouts-stage-env']"),
        { ...context, startsWith: (value, prefix) => value.startsWith(prefix) }
    );
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'native-publish-stage-'));

try {
    for (const job of Object.values(workflow.jobs)) {
        const resolver = job.steps.find(step => step.id === 'scouts-stage-env');
        const build = job.steps.find(step => step.name === 'Build App Files');
        assert(resolver, `${job.name} must resolve ScoutPass's stage`);
        assert.equal(resolver.shell, 'bash', 'stage resolution must fail even when piped to tee');
        assert(job.steps.indexOf(resolver) < job.steps.indexOf(build));

        for (const [environment, expected, scouts] of [
            ['scout-app-production', 'production', true],
            ['scout-app-staging', 'staging', true],
            ['learn-card-app-production', 'production-learncardapp', false],
            ['learn-card-app-staging', 'staging-learncardapp', false],
        ]) {
            const context = {
                inputs: { environment },
                vars: { VITE_NODE_ENV: scouts ? 'production-learncardapp' : expected },
                steps: { 'scouts-stage-env': { outputs: {} } },
            };
            assert.equal(evaluate(resolver.if, context), scouts);

            if (scouts) {
                const outputFile = path.join(temporary, 'output');
                fs.writeFileSync(outputFile, '');
                const command = resolver.run.replace(/\$\{\{(.*?)\}\}/g, (_, expression) =>
                    evaluate(expression, context)
                );
                const result = spawnSync('bash', ['-eo', 'pipefail', '-c', command], {
                    cwd: path.join(root, resolver['working-directory']),
                    env: {
                        ...process.env,
                        VITE_NODE_ENV: context.vars.VITE_NODE_ENV,
                        GITHUB_OUTPUT: outputFile,
                    },
                    encoding: 'utf8',
                });
                assert.equal(result.status, 0, result.stderr);
                const output = fs.readFileSync(outputFile, 'utf8').trim();
                assert.equal(output, `VITE_NODE_ENV=${expected}`);
                context.steps['scouts-stage-env'].outputs.VITE_NODE_ENV = expected;
            }

            assert.equal(evaluate(build.env.VITE_NODE_ENV, context), expected);
            for (const name of ['Prepare tenant config', 'Re-patch tenant config (post-sync)']) {
                const step = job.steps.find(candidate => candidate.name === name);
                assert.equal(evaluate(step.if, context), !scouts, `${environment}: ${name}`);
            }
        }
    }
    console.log(
        'Both native publish jobs resolve ScoutPass stages, override stale settings, and skip LearnCard tenant scripts.'
    );
} finally {
    fs.rmSync(temporary, { recursive: true, force: true });
}
