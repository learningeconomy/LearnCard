const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const https = require('node:https');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const { createRequire } = require('node:module');
const { build } = require('esbuild');

const root = path.resolve(__dirname, '../..');
const services = ['learn-cloud-service', 'brain-service', 'lca-api'];
const optionsFor = (service, environment) => {
    let options;
    const filename = path.join(root, 'services/learn-card-network', service, 'esbuildPlugins.cjs');
    vm.runInNewContext(
        fs.readFileSync(filename, 'utf8'),
        {
            module: { exports: {} },
            process: { env: environment },
            require: name =>
                name === '@sentry/esbuild-plugin'
                    ? {
                          sentryEsbuildPlugin: value => {
                              options = value;
                              return {};
                          },
                      }
                    : require(name),
        },
        { filename }
    );
    return { filename, options };
};

(async () => {
    const workingDirectory = process.cwd();
    const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'e2e-telemetry-'));
    const request = https.request;
    let requests = 0;
    // A real refused connection exercises transport rejection without contacting
    // Sentry. The E2E configuration must never attempt the request.
    https.request = () => {
        requests++;
        return http.request({ hostname: 'localhost', port: 9, path: '/' });
    };
    try {
        process.chdir(temporary);
        for (const service of services) {
            assert.equal(optionsFor(service, {}).options.telemetry, true);
            const { filename, options } = optionsFor(service, { SENTRY_BUILD_TELEMETRY: 'false' });
            assert.equal(options.telemetry, false);
            const { sentryEsbuildPlugin } = createRequire(filename)('@sentry/esbuild-plugin');
            const result = await build({
                stdin: { contents: 'console.log("compiled")', sourcefile: 'index.js' },
                bundle: true,
                write: false,
                logLevel: 'silent',
                plugins: [
                    sentryEsbuildPlugin({
                        ...options,
                        authToken: '',
                        silent: true,
                        release: { name: 'e2e-telemetry-regression' },
                    }),
                ],
            });
            assert.ok(result.outputFiles[0].text.includes('compiled'));
        }
        assert.equal(requests, 0, 'E2E build telemetry must not attempt a network request');
        console.log(
            'Hosted E2E builds compile with Sentry telemetry unavailable; default builds retain telemetry'
        );
    } finally {
        https.request = request;
        process.chdir(workingDirectory);
        fs.rmSync(temporary, { recursive: true, force: true });
    }
})().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
