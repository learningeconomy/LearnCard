const assert = require('node:assert/strict');
const { execFile } = require('node:child_process');
const { once } = require('node:events');
const { mkdtemp, rm, writeFile } = require('node:fs/promises');
const { createServer } = require('node:http');
const { createRequire } = require('node:module');
const { tmpdir } = require('node:os');
const path = require('node:path');
const { promisify } = require('node:util');
const { test } = require('node:test');

const execute = promisify(execFile);
const root = path.resolve(__dirname, '../..');
const services = ['brain-service', 'learn-cloud-service', 'lca-api'];
const cliPaths = new Set();

// CLI 2.39.1 retries uploads but not `releases new`/`finalize`. The upstream
// fix shipped in 2.46.0: https://github.com/getsentry/sentry-cli/pull/2523.
// Resolve from each service's actual plugin dependency tree so a nested, older
// CLI cannot silently bypass the root override.
test('every deployed service resolves a retry-capable Sentry CLI', () => {
    for (const service of services) {
        const serviceRequire = createRequire(
            path.join(root, 'services/learn-card-network', service, 'package.json')
        );
        const pluginRequire = createRequire(serviceRequire.resolve('@sentry/esbuild-plugin'));
        const coreRequire = createRequire(pluginRequire.resolve('@sentry/bundler-plugin-core'));
        const { version } = coreRequire('@sentry/cli/package.json');
        cliPaths.add(coreRequire('@sentry/cli').getPath());
        const [major, minor] = version.split('.').map(Number);
        assert.ok(major === 2 && minor >= 46, `${service} resolves CLI ${version}`);
    }
    assert.equal(cliPaths.size, 1, 'all service plugins should share the pinned CLI');
});

const cases = [
    { command: 'new', statuses: [503, 201], succeeds: true, attempts: 2 },
    { command: 'finalize', statuses: [503, 200], succeeds: true, attempts: 2 },
    { command: 'new', statuses: [503], succeeds: false, attempts: 3 },
    { command: 'finalize', statuses: [503], succeeds: false, attempts: 3 },
    { command: 'new', statuses: [401], succeeds: false, attempts: 1 },
];

for (const scenario of cases) {
    test(
        `releases ${scenario.command}: HTTP ${scenario.statuses.join(' then ')} takes ${scenario.attempts} request(s)`,
        { timeout: 20_000 },
        async () => {
            const [binary] = cliPaths;
            assert.ok(binary, 'service CLI resolution must pass first');
            const directory = await mkdtemp(path.join(tmpdir(), 'sentry-release-retries-'));
            const configPath = path.join(directory, '.sentryclirc');
            await writeFile(configPath, '');
            const release = 'sentry-retry-contract';
            const requests = [];
            const server = createServer(async (request, response) => {
                const chunks = [];
                for await (const chunk of request) chunks.push(chunk);
                requests.push({
                    method: request.method,
                    url: request.url,
                    body: JSON.parse(Buffer.concat(chunks).toString()),
                });
                const status =
                    scenario.statuses[Math.min(requests.length - 1, scenario.statuses.length - 1)];
                response.writeHead(status, { 'Content-Type': 'application/json' });
                response.end(
                    JSON.stringify(
                        status >= 400
                            ? { detail: 'Synthetic Sentry API failure' }
                            : { version: release, dateCreated: '2026-10-14T00:00:00Z' }
                    )
                );
            });

            try {
                server.listen(0, '127.0.0.1');
                await once(server, 'listening');
                // Isolate CLI configuration and credentials from the developer/CI
                // environment. Every HTTP request stays on this loopback server.
                const result = await execute(binary, ['releases', scenario.command, release], {
                    cwd: directory,
                    timeout: 15_000,
                    env: {
                        PATH: process.env.PATH,
                        SENTRY_CONF: configPath,
                        SENTRY_URL: `http://127.0.0.1:${server.address().port}/`,
                        SENTRY_AUTH_TOKEN: 'synthetic-test-token',
                        SENTRY_ORG: 'test-org',
                        SENTRY_PROJECT: 'test-project',
                        // Successful recovery uses deployment defaults. Bound the
                        // persistent-error cases explicitly to verify exhaustion.
                        ...(scenario.succeeds ? {} : { SENTRY_HTTP_MAX_RETRIES: '2' }),
                        SENTRY_DISABLE_UPDATE_CHECK: '1',
                        SENTRY_LOAD_DOTENV: '0',
                    },
                }).then(
                    output => ({ ...output, code: 0 }),
                    error => error
                );

                assert.notEqual(result.killed, true, 'CLI must finish before the timeout');
                if (scenario.succeeds) assert.equal(result.code, 0, result.stderr);
                else assert.equal(result.code, 1, result.stderr);
                assert.equal(requests.length, scenario.attempts);
                const isNew = scenario.command === 'new';
                for (const request of requests) {
                    assert.equal(request.method, isNew ? 'POST' : 'PUT');
                    assert.equal(
                        request.url,
                        `/api/0/projects/test-org/test-project/releases/${isNew ? '' : `${release}/`}`
                    );
                    if (isNew) assert.equal(request.body.version, release);
                    else
                        assert.ok(
                            request.body.dateReleased,
                            'finalize must retain its release timestamp'
                        );
                    assert.deepEqual(
                        request.body,
                        requests[0].body,
                        'retries must preserve the payload'
                    );
                }
            } finally {
                await new Promise(resolve => server.close(resolve));
                await rm(directory, { recursive: true, force: true });
            }
        }
    );
}
