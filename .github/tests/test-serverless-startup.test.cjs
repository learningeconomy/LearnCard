const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createRequire } = require('node:module');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '../..');

const smoke = async () => {
    // Fail closed if startup unexpectedly tries to contact AWS, Dashboard, or telemetry.
    const forbidNetwork = () => {
        throw new Error('Serverless startup smoke test must not access the network');
    };
    for (const protocol of ['node:http', 'node:https']) {
        const client = require(protocol);
        client.request = forbidNetwork;
        client.get = forbidNetwork;
    }
    globalThis.fetch = forbidNetwork;

    // Resolve through the real service -> Serverless -> Dashboard dependency chain,
    // so this also covers nested installations rather than only a hoisted copy.
    const serviceRequire = createRequire(
        path.join(root, 'services/learn-card-network/brain-service/package.json')
    );
    const serverlessRequire = createRequire(serviceRequire.resolve('serverless'));
    const dashboardEntry = serverlessRequire.resolve('@serverless/dashboard-plugin');
    const dashboardRequire = createRequire(dashboardEntry);
    const parserPath = dashboardRequire.resolve('./lib/deployment/parse.js');
    const parserRequire = createRequire(parserPath);
    const simpleGitEntry = parserRequire.resolve('simple-git');
    const simpleGitPackage = JSON.parse(
        fs.readFileSync(path.resolve(path.dirname(simpleGitEntry), '../package.json'), 'utf8')
    );
    const manifest = require(path.join(root, 'package.json'));

    assert.equal(manifest.overrides['simple-git'], '4.0.2');
    assert.equal(simpleGitPackage.version, manifest.overrides['simple-git']);
    assert.equal(typeof parserRequire('simple-git').simpleGit, 'function');
    assert.equal(typeof dashboardRequire(parserPath), 'function');
    const DashboardPlugin = serverlessRequire('@serverless/dashboard-plugin');
    assert.equal(typeof DashboardPlugin, 'function');

    const Serverless = serviceRequire('serverless');
    const configuration = {
        service: 'simple-git-startup-smoke',
        frameworkVersion: '3',
        provider: { name: 'aws', runtime: 'nodejs24.x', region: 'us-east-1' },
        dashboard: { disableMonitoring: true },
        functions: {},
    };
    fs.writeFileSync('serverless.json', JSON.stringify(configuration));
    const serverless = new Serverless({
        serviceDir: process.cwd(),
        configurationFilename: 'serverless.json',
        configuration,
        commands: [],
        options: { help: true },
    });

    assert.equal(serverless.isDashboardEnabled, false);
    // init() loads the Dashboard plugin even when Dashboard is disabled.
    // Do not call run(), package(), or any deployment lifecycle hooks.
    await serverless.init();
    assert.ok(serverless.pluginManager.dashboardPlugin instanceof DashboardPlugin);
    console.log('Serverless parser, Dashboard plugin, and no-deployment startup passed');
};

if (process.argv[2] === '--smoke') {
    smoke().catch(error => {
        console.error(error);
        process.exitCode = 1;
    });
} else {
    const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'learncard-serverless-smoke-'));
    try {
        // Isolate user config and credentials. Only the fixture service is loaded.
        const result = spawnSync(process.execPath, [__filename, '--smoke'], {
            cwd: temporary,
            env: {
                PATH: process.env.PATH,
                HOME: temporary,
                USERPROFILE: temporary,
                CI: 'true',
                SLS_TELEMETRY_DISABLED: '1',
                SLS_DISABLE_AUTO_UPDATE: '1',
                AWS_EC2_METADATA_DISABLED: 'true',
            },
            encoding: 'utf8',
            timeout: 30_000,
        });
        assert.ifError(result.error);
        assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
        process.stdout.write(result.stdout);
    } finally {
        fs.rmSync(temporary, { recursive: true, force: true });
    }
}
