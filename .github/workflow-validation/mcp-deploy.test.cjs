const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const { mkdtempSync, writeFileSync, readFileSync, rmSync } = require('node:fs');
const path = require('node:path');
const { tmpdir } = require('node:os');
const test = require('node:test');
const yaml = require('js-yaml');
const root = path.resolve(__dirname, '../..');
const workflow = yaml.load(readFileSync(path.join(root, '.github/workflows/deploy.yml'), 'utf8'));
const steps = workflow.jobs['deploy-ai-passport-mcp'].steps;
function fixture(t) {
    const dir = mkdtempSync(path.join(tmpdir(), 'mcp-deploy-'));
    t.after(() => rmSync(dir, { recursive: true, force: true }));
    const output = path.join(dir, 'output');
    writeFileSync(output, '');
    return { dir, output };
}
function run(script, env, dir) {
    return spawnSync('bash', ['-euo', 'pipefail', '-c', script], {
        cwd: root, encoding: 'utf8', env: { ...process.env, PATH: `${dir}:${process.env.PATH}`, ...env },
    });
}
const required = 'MONGO_URI SEED JWT_SECRET REDIS_HOST REDIS_PORT AI_PRIVACY_KEY AWS_WEB_IDENTITY_TOKEN_FILE';
for (const forbidden of ['DOMAIN', 'MCP_SERVER_URL', 'QDRANT_HOST', 'QDRANT_PORT', 'QDRANT_HTTPS', 'AWS_BEARER_TOKEN_BEDROCK', '']) {
    test(`preflight ${forbidden ? `blocks ${forbidden}` : 'accepts complete names'}`, t => {
        const { dir } = fixture(t);
        writeFileSync(path.join(dir, 'flyctl'), '#!/usr/bin/env bash\nprintf \'%s\\n\' "$FAKE_SECRETS"\n', { mode: 0o755 });
        const names = `${required} ${forbidden}`.trim().split(/\s+/);
        const result = run(steps.find(s => s.name === 'Check required Fly secrets').run, {
            FLY_APP: 'fixture', FAKE_SECRETS: JSON.stringify(names.map(Name => ({ Name }))),
        }, dir);
        assert.equal(result.status, forbidden ? 1 : 0, result.stdout + result.stderr);
    });
}
test('preflight refuses role ARN without credential source', t => {
    const { dir } = fixture(t);
    writeFileSync(path.join(dir, 'flyctl'), '#!/usr/bin/env bash\nprintf \'%s\\n\' "$FAKE_SECRETS"\n', { mode: 0o755 });
    const names = required.split(' ').filter(n => n !== 'AWS_WEB_IDENTITY_TOKEN_FILE');
    const result = run(steps.find(s => s.name === 'Check required Fly secrets').run, {
        FLY_APP: 'fixture', FAKE_SECRETS: JSON.stringify(names.map(Name => ({ Name }))),
    }, dir);
    assert.equal(result.status, 1);
    assert.match(result.stdout, /AWS_WEB_IDENTITY_TOKEN_FILE/);
});
for (const host of ['', 'localhost', '127.0.0.1', 'https://qdrant.example', 'qdrant.internal']) {
    test(`Qdrant host validation: ${host || 'missing'}`, t => {
        const { dir, output } = fixture(t);
        const result = run(steps.find(s => s.id === 'fly-target').run, {
            ENVIRONMENT: 'fixture', STAGE: 'staging', PINNED_APP: '', FLY_APP_NAME: 'fixture',
            FLY_API_TOKEN: 'synthetic', MCP_DOMAIN: 'https://issuer.example', MCP_SERVER_URL: 'https://resource.example',
            QDRANT_HOST: host, QDRANT_PORT: '6333', QDRANT_HTTPS: 'false',
            MCP_PEER_API_FLY_APP: 'ai-passport', MCP_REDIS_PREFIX: 'shared',
            MCP_EXPECTED_PRIVACY_KEY_FP: 'a'.repeat(64), MCP_EXPECTED_REDIS_STORE_FP: 'b'.repeat(64),
            MCP_EXPECTED_MONGO_FP: 'c'.repeat(64), MCP_EXPECTED_QDRANT_FP: 'd'.repeat(64),
            GITHUB_OUTPUT: output,
        }, dir);
        assert.equal(result.status, host === 'qdrant.internal' ? 0 : 1, result.stdout + result.stderr);
    });
}
for (const [event, enabled, release, manual, target, expected] of [
    ['push', '', 'false', '', '', ''],
    ['push', 'true', 'false', '', '', 'staging'],
    ['release', 'true', 'true', '', '', 'production'],
    ['release', '', 'true', '', '', ''],
    ['workflow_dispatch', '', 'false', 'true', 'production', 'production'],
    ['workflow_dispatch', 'true', 'false', 'false', 'production', ''],
]) {
    test(`selection ${event}/${enabled}/${manual} -> ${expected || 'off'}`, t => {
        const { dir, output } = fixture(t);
        const script = workflow.jobs['determine-affected'].steps.find(s => s.id === 'mcp-env').run;
        const result = run(script, { EVENT_NAME: event, MCP_DEPLOY_ENABLED: enabled, IS_RELEASE: release,
            DEPLOY_MCP: manual, TARGET_ENVIRONMENT: target, GITHUB_OUTPUT: output,
            AFFECTED: '', BACKEND_CHANGED: 'false' }, dir);
        assert.equal(result.status, 0, result.stderr);
        const matrix = JSON.parse(readFileSync(output, 'utf8').split('\n')[0].split('=').slice(1).join('='));
        assert.deepEqual(matrix.include.map(l => l.stage), expected ? [expected] : []);
    });
}
for (const brokenPublic of [false, true]) {
    test(`smoke both routes, public route ${brokenPublic ? 'broken' : 'healthy'}`, t => {
        const { dir } = fixture(t);
        writeFileSync(path.join(dir, 'curl'), `#!/usr/bin/env bash
url="\${!#}"
echo "$url" >> "$TRACE"
if [[ "$BROKEN_PUBLIC" == true && "$url" == https://public.example/* ]]; then exit 6; fi
case "$url" in
 */.well-known/oauth-protected-resource) echo '{"resource":"https://public.example/","authorization_servers":["https://issuer.example/"]}' ;;
 */.well-known/oauth-authorization-server) echo '{"issuer":"https://issuer.example/"}' ;;
 *) printf 401 ;;
esac
`, { mode: 0o755 });
        const trace = path.join(dir, 'trace');
        const result = run('services/ai-passport-backend/scripts/smoke-mcp.sh', {
            MCP_BASE_URL: 'https://fly.example', EXPECTED_RESOURCE: 'https://public.example/',
            EXPECTED_ISSUER: 'https://issuer.example/', MCP_SMOKE_TOKEN: '',
            TRACE: trace, BROKEN_PUBLIC: String(brokenPublic),
        }, dir);
        assert.equal(result.status, brokenPublic ? 6 : 0, result.stdout + result.stderr);
        const urls = readFileSync(trace, 'utf8');
        assert.match(urls, /https:\/\/fly.example\/\.well-known/);
        assert.match(urls, /https:\/\/public.example\/\.well-known/);
        if (!brokenPublic) assert.match(urls, /https:\/\/public.example\/\n/);
    });
}
test('secret-list failure fails closed', t => {
    const { dir } = fixture(t);
    writeFileSync(path.join(dir, 'flyctl'), '#!/usr/bin/env bash\nexit 23\n', { mode: 0o755 });
    const result = run(steps.find(s => s.name === 'Check required Fly secrets').run, { FLY_APP: 'fixture' }, dir);
    assert.notEqual(result.status, 0);
});

test('MCP staging allows skipped tests only when affected is empty', () => {
    const gate = workflow.jobs['deploy-ai-passport-mcp'].if;
    assert.match(gate, /test-affected\.result == 'skipped'/);
    assert.match(gate, /affected == ''/);
    assert.match(gate, /test-affected\.result == 'success'/);
});

for (const [peer, prefix, privacy, redis, expectOk] of [
    ['ai-passport', 'default', 'a'.repeat(64), 'b'.repeat(64), true],
    ['', 'default', 'a'.repeat(64), 'b'.repeat(64), false],
    ['ai-passport', '', 'a'.repeat(64), 'b'.repeat(64), false],
    ['ai-passport', 'default', 'nope', 'b'.repeat(64), false],
    ['ai-passport', 'default', 'a'.repeat(64), 'B'.repeat(64), false],
]) {
    test(`alignment config peer=${peer||'missing'} prefix=${prefix||'missing'} fps=${expectOk}`, t => {
        const { dir, output } = fixture(t);
        const result = run(steps.find(s => s.id === 'fly-target').run, {
            ENVIRONMENT: 'fixture', STAGE: 'staging', PINNED_APP: '', FLY_APP_NAME: 'fixture',
            FLY_API_TOKEN: 'synthetic', MCP_DOMAIN: 'https://issuer.example', MCP_SERVER_URL: 'https://resource.example',
            QDRANT_HOST: 'qdrant.internal', QDRANT_PORT: '6333', QDRANT_HTTPS: 'false',
            MCP_PEER_API_FLY_APP: peer, MCP_REDIS_PREFIX: prefix,
            MCP_EXPECTED_PRIVACY_KEY_FP: privacy, MCP_EXPECTED_REDIS_STORE_FP: redis,
            MCP_EXPECTED_MONGO_FP: 'c'.repeat(64), MCP_EXPECTED_QDRANT_FP: 'd'.repeat(64),
            GITHUB_OUTPUT: output,
        }, dir);
        assert.equal(result.status, expectOk ? 0 : 1, result.stdout + result.stderr);
    });
}

test('fingerprint script derives stable HMACs without printing the key', () => {
    const { createHmac } = require('node:crypto');
    const key = Buffer.alloc(32, 9);
    const b64 = key.toString('base64');
    const privacy = createHmac('sha256', key).update('ai-passport-mcp-alignment:privacy-key:v1').digest('hex');
    const redis = createHmac('sha256', key)
        .update('ai-passport-mcp-alignment:redis-store:v1\0')
        .update(['host', '6379', 'pw', 'shared'].join('\0'))
        .digest('hex');
    assert.equal(privacy.length, 64);
    assert.equal(redis.length, 64);
    assert.notEqual(privacy, redis);
    assert.ok(!privacy.includes(b64));
    assert.ok(!redis.includes('pw'));
});

test('rollback script refuses missing OAuth or Qdrant env', t => {
    const { dir } = fixture(t);
    const result = spawnSync('bash', ['services/ai-passport-backend/scripts/rollback-mcp.sh'], {
        cwd: root, encoding: 'utf8', env: { ...process.env, PATH: `${dir}:${process.env.PATH}`, FLY_APP: 'x', IMAGE: 'img' },
    });
    assert.notEqual(result.status, 0);
});

test('pre-traffic fingerprint step is before deploy and compares all stores', t => {
    const names = steps.map(s => s.name);
    const gate = names.indexOf('Verify shared store fingerprints before traffic');
    const deploy = names.indexOf('Deploy to Fly');
    assert.ok(gate >= 0 && deploy >= 0 && gate < deploy);
    const forbidden = steps.find(s => s.name === 'Check required Fly secrets').run;
    assert.match(forbidden, /REDIS_PREFIX/);
    const { dir } = fixture(t);
    writeFileSync(path.join(dir, 'mcp-alignment-fingerprint.sh'),
        '#!/usr/bin/env bash\necho privacy=$FAKE_PRIVACY\necho redis=$FAKE_REDIS\necho mongo=$FAKE_MONGO\necho qdrant=$FAKE_QDRANT\n', { mode: 0o755 });
    const step = steps.find(s => s.name === 'Verify shared store fingerprints before traffic');
    const script = step.run.replace(
        'services/ai-passport-backend/scripts/mcp-alignment-fingerprint.sh',
        'mcp-alignment-fingerprint.sh'
    );
    const ok = run(script, {
        FLY_APP: 'mcp', MCP_PEER_API_FLY_APP: 'api', MCP_REDIS_PREFIX: 'shared',
        QDRANT_HOST: 'q', QDRANT_PORT: '6333', QDRANT_HTTPS: 'true',
        MCP_EXPECTED_PRIVACY_KEY_FP: 'a'.repeat(64), MCP_EXPECTED_REDIS_STORE_FP: 'b'.repeat(64),
        MCP_EXPECTED_MONGO_FP: 'c'.repeat(64), MCP_EXPECTED_QDRANT_FP: 'd'.repeat(64),
        FAKE_PRIVACY: 'a'.repeat(64), FAKE_REDIS: 'b'.repeat(64),
        FAKE_MONGO: 'c'.repeat(64), FAKE_QDRANT: 'd'.repeat(64),
    }, dir);
    assert.equal(ok.status, 0, ok.stdout + ok.stderr);
    const bad = run(script, {
        FLY_APP: 'mcp', MCP_PEER_API_FLY_APP: 'api', MCP_REDIS_PREFIX: 'shared',
        QDRANT_HOST: 'q', QDRANT_PORT: '6333', QDRANT_HTTPS: 'true',
        MCP_EXPECTED_PRIVACY_KEY_FP: 'a'.repeat(64), MCP_EXPECTED_REDIS_STORE_FP: 'b'.repeat(64),
        MCP_EXPECTED_MONGO_FP: 'c'.repeat(64), MCP_EXPECTED_QDRANT_FP: 'd'.repeat(64),
        FAKE_PRIVACY: 'a'.repeat(64), FAKE_REDIS: 'b'.repeat(64),
        FAKE_MONGO: 'c'.repeat(64), FAKE_QDRANT: 'e'.repeat(64),
    }, dir);
    assert.equal(bad.status, 1);
    assert.match(bad.stdout + bad.stderr, /Qdrant/);
    assert.match(bad.stdout + bad.stderr, /before deploy/);
    assert.doesNotMatch(bad.stdout + bad.stderr, /AI_PRIVACY_KEY=|MONGO_URI=|REDIS_PASSWORD=/);
});

test('preflight blocks REDIS_PREFIX secret shadowing', t => {
    const { dir } = fixture(t);
    writeFileSync(path.join(dir, 'flyctl'), '#!/usr/bin/env bash\nprintf \'%s\\n\' "$FAKE_SECRETS"\n', { mode: 0o755 });
    const names = 'MONGO_URI SEED JWT_SECRET REDIS_HOST REDIS_PORT AI_PRIVACY_KEY AWS_WEB_IDENTITY_TOKEN_FILE REDIS_PREFIX'.split(' ');
    const result = run(steps.find(s => s.name === 'Check required Fly secrets').run, {
        FLY_APP: 'fixture', FAKE_SECRETS: JSON.stringify(names.map(Name => ({ Name }))),
    }, dir);
    assert.equal(result.status, 1);
    assert.match(result.stdout + result.stderr, /REDIS_PREFIX/);
});
