const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { workspaceCheckReason } = require('./workspace-checks.cjs');

test('only a verified unrelated PR or full queue diff skips workspace checks', t => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'retry-workspace-'));
    t.after(() => fs.rmSync(cwd, { recursive: true, force: true }));
    const git = (...args) =>
        execFileSync('git', args, { cwd, encoding: 'utf8', stdio: 'pipe' }).trim();
    const write = file => {
        fs.mkdirSync(path.dirname(path.join(cwd, file)), { recursive: true });
        fs.writeFileSync(path.join(cwd, file), 'fixture');
    };
    const commit = message => {
        git('add', '-A');
        git(
            '-c',
            'user.name=Fixture',
            '-c',
            'user.email=test@example.com',
            '-c',
            'core.hooksPath=/dev/null',
            'commit',
            '-qm',
            message
        );
        return git('rev-parse', 'HEAD');
    };
    git('init', '-q', '-b', 'main');
    write('apps/sample/vitest.config.ts');
    const base = commit('base');
    write('nx.json');
    const main = commit('main advanced');
    git('switch', '-qc', 'feature', base);
    write('apps/sample/src/case.test.ts');
    const head = commit('app test');
    const reason = (event, from = base, to = head) => workspaceCheckReason(event, from, to, cwd);
    assert.equal(reason('pull_request', main), false);
    assert.equal(reason('merge_group'), false);
    assert.ok(reason('merge_group', main));
    assert.ok(reason('merge_group', head)); // empty diff
    assert.ok(reason('workflow_dispatch'));
    assert.ok(reason('pull_request', '', head));
    assert.ok(reason('pull_request', base, main)); // mismatched checkout
    assert.ok(reason('pull_request', 'f'.repeat(40)));

    fs.renameSync(
        path.join(cwd, 'apps/sample/vitest.config.ts'),
        path.join(cwd, 'apps/sample/src/old.ts')
    );
    const renamed = commit('rename config into ordinary source');
    write('docs/example.md');
    const queue = commit('later unrelated PR in same group');
    assert.ok(reason('merge_group', base, queue));
    assert.equal(reason('merge_group', renamed, queue), false);

    for (const file of [
        'bun.lock',
        'packages/sample/package.json',
        'tools/executor.ts',
        'apps/learn-card-app/src/i18n/paraglideLazyLocales.ts',
        'scripts/ci-test-retries/reporter.ts',
        'new-tool/file.ts',
    ]) {
        const before = git('rev-parse', 'HEAD');
        write(file);
        assert.ok(reason('pull_request', before, commit(file)), file);
    }
});
