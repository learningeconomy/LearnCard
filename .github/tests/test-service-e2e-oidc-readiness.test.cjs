const assert = require('node:assert/strict');
const { execFile } = require('node:child_process');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { promisify } = require('node:util');
const yaml = require('js-yaml');

const run = promisify(execFile);
const compose = yaml.load(
    fs.readFileSync(path.resolve(__dirname, '../../tests/e2e/compose.yaml'), 'utf8')
);
const cloud = compose.services.cloud;
assert.equal(compose.services.lrs.depends_on.cloud.condition, 'service_healthy');
assert.equal(cloud.healthcheck.test[0], 'CMD');
assert.equal(cloud.healthcheck.test[1], 'bun');
assert.equal(cloud.healthcheck.test[2], '-e');
const probe = cloud.healthcheck.test[3];

(async () => {
    let discoveryStatus = 503;
    let hang = false;
    const paths = [];
    const server = http.createServer((request, response) => {
        paths.push(request.url);
        if (request.url !== '/.well-known/openid-configuration') {
            response.writeHead(200).end('Other cloud routes are already ready');
        } else if (!hang) {
            response.writeHead(discoveryStatus).end('{}');
        }
    });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const port = server.address().port;
    const check = () =>
        run('bun', ['-e', probe], {
            env: { ...process.env, PORT: String(port) },
            timeout: 6000,
        });
    try {
        await assert.rejects(check(), error => error.code === 1);
        discoveryStatus = 404;
        await assert.rejects(check(), error => error.code === 1);
        discoveryStatus = 200;
        await check();
        assert.deepEqual(paths, Array(3).fill('/.well-known/openid-configuration'));
        hang = true;
        await assert.rejects(check(), error => error.code === 1 && !error.killed);
    } finally {
        server.closeAllConnections();
        await new Promise(resolve => server.close(resolve));
    }
    await assert.rejects(check(), error => error.code === 1);
    console.log(
        'Service E2E OIDC readiness passed (unavailable, missing, ready, timeout, connection refused)'
    );
})().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
