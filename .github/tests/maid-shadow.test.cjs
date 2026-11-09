const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const {
    chmodSync,
    mkdtempSync,
    readFileSync,
    rmSync,
    symlinkSync,
    unlinkSync,
    writeFileSync,
} = require('node:fs');
const { tmpdir } = require('node:os');
const path = require('node:path');
const test = require('node:test');

const { snapshot, compare, render } = require('../../scripts/maid-shadow.cjs');

const fixture = t => {
    const root = mkdtempSync(path.join(tmpdir(), 'maid-shadow-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
    git('init', '-q');
    git('config', 'user.name', 'Maid test');
    git('config', 'user.email', 'maid-test@example.invalid');
    writeFileSync(path.join(root, 'modified.txt'), 'before\n');
    writeFileSync(path.join(root, 'deleted.txt'), 'delete me\n');
    writeFileSync(path.join(root, 'executable.sh'), '#!/bin/sh\n');
    git('add', '.');
    git('commit', '-qm', 'baseline');
    return { root, sha: git('rev-parse', 'HEAD') };
};

const empty = { match: [], actualOnly: [], shadowOnly: [], different: [] };

test('snapshot records tracked content, deletion, mode changes and untracked files', t => {
    const { root, sha } = fixture(t);
    const executable = path.join(root, 'executable.sh');
    writeFileSync(path.join(root, 'modified.txt'), 'after\n');
    unlinkSync(path.join(root, 'deleted.txt'));
    chmodSync(executable, 0o755);
    writeFileSync(path.join(root, 'new.txt'), 'untracked\n');

    const result = snapshot(root, sha, 'full');
    assert.equal(result.version, 1);
    assert.equal(result.sha, sha);
    assert.equal(result.label, 'full');
    assert.deepEqual(Object.keys(result.entries).sort(), [
        'deleted.txt',
        'executable.sh',
        'modified.txt',
        'new.txt',
    ]);
    for (const name of ['modified.txt', 'executable.sh', 'deleted.txt']) {
        assert.equal(result.entries[name].tracked, true);
        assert.equal(typeof result.entries[name].status, 'string');
    }
    assert.equal(result.entries['modified.txt'].kind, 'file');
    assert.equal(typeof result.entries['modified.txt'].hash, 'string');
    assert.equal(result.entries['deleted.txt'].kind, 'missing');
    assert.equal(result.entries['deleted.txt'].hash, null);
    assert.equal(result.entries['new.txt'].tracked, false);
    assert.equal(result.entries['new.txt'].kind, 'file');
    assert.equal(typeof result.entries['new.txt'].hash, 'string');
    assert.equal(typeof result.entries['executable.sh'].mode, 'string');
    assert.notEqual(result.entries['executable.sh'].mode, result.entries['modified.txt'].mode);
});

test('identical changes match in both categories without mutating either snapshot', t => {
    const { root, sha } = fixture(t);
    writeFileSync(path.join(root, 'modified.txt'), 'same\n');
    writeFileSync(path.join(root, 'new.txt'), 'same untracked\n');
    const actual = snapshot(root, sha, 'full');
    const shadow = snapshot(root, sha, 'shadow');
    const before = JSON.stringify({ actual, shadow });
    assert.deepEqual(compare(actual, shadow), {
        tracked: { ...empty, match: ['modified.txt'] },
        untracked: { ...empty, match: ['new.txt'] },
    });
    assert.equal(JSON.stringify({ actual, shadow }), before);
});

test('comparison distinguishes content mismatches and one-sided tracked and untracked changes', t => {
    const { root, sha } = fixture(t);
    const modified = path.join(root, 'modified.txt');
    const actualOnly = path.join(root, 'deleted.txt');
    const shadowOnly = path.join(root, 'executable.sh');
    writeFileSync(modified, 'actual content\n');
    unlinkSync(actualOnly);
    writeFileSync(path.join(root, 'actual-only.txt'), 'a\n');
    writeFileSync(path.join(root, 'both-new.txt'), 'actual\n');
    const actual = snapshot(root, sha, 'full');

    writeFileSync(modified, 'shadow content\n');
    writeFileSync(actualOnly, 'delete me\n');
    writeFileSync(shadowOnly, `${readFileSync(shadowOnly, 'utf8')}# shadow\n`);
    unlinkSync(path.join(root, 'actual-only.txt'));
    writeFileSync(path.join(root, 'shadow-only.txt'), 'b\n');
    writeFileSync(path.join(root, 'both-new.txt'), 'shadow\n');
    const shadow = snapshot(root, sha, 'shadow');

    assert.deepEqual(compare(actual, shadow), {
        tracked: {
            match: [],
            actualOnly: ['deleted.txt'],
            shadowOnly: ['executable.sh'],
            different: ['modified.txt'],
        },
        untracked: {
            match: [],
            actualOnly: ['actual-only.txt'],
            shadowOnly: ['shadow-only.txt'],
            different: ['both-new.txt'],
        },
    });
});

test('mode-only differences are detected for otherwise identical tracked files', t => {
    const { root, sha } = fixture(t);
    const file = path.join(root, 'executable.sh');
    writeFileSync(file, '#!/bin/sh\n# same\n');
    const actual = snapshot(root, sha, 'full');
    chmodSync(file, 0o755);
    const shadow = snapshot(root, sha, 'shadow');
    const result = compare(actual, shadow);
    assert.deepEqual(result.tracked.different, ['executable.sh']);
    assert.deepEqual(result.tracked.match, []);
    assert.deepEqual(result.untracked, empty);
});

test('snapshot preserves unusual paths and compares symlink targets without following them', t => {
    const { root, sha } = fixture(t);
    const unusual = 'new\nname.txt';
    writeFileSync(path.join(root, unusual), 'contents');
    symlinkSync('first-target', path.join(root, 'new-link'));
    const actual = snapshot(root, sha, 'full');
    assert.equal(actual.entries[unusual].kind, 'file');
    assert.equal(actual.entries['new-link'].kind, 'symlink');
    assert.equal(actual.entries['new-link'].mode, '120000');
    unlinkSync(path.join(root, 'new-link'));
    symlinkSync('second-target', path.join(root, 'new-link'));
    const shadow = snapshot(root, sha, 'shadow');
    assert.deepEqual(compare(actual, shadow).untracked, {
        match: [unusual],
        actualOnly: [],
        shadowOnly: [],
        different: ['new-link'],
    });
});

test('comparison rejects missing, malformed, or mismatched commit identities', t => {
    const { root, sha } = fixture(t);
    const actual = snapshot(root, sha, 'full');
    const shadow = snapshot(root, sha, 'shadow');
    for (const badSha of [undefined, '', 'not-a-commit', 'f'.repeat(41), 'f'.repeat(40)]) {
        assert.throws(() => compare(actual, { ...shadow, sha: badSha }));
    }
});

test('comparison rejects malformed entries and inconsistent file metadata', t => {
    const { root, sha } = fixture(t);
    writeFileSync(path.join(root, 'modified.txt'), 'changed\n');
    const actual = snapshot(root, sha, 'full');
    const shadow = snapshot(root, sha, 'shadow');
    const valid = shadow.entries['modified.txt'];
    assert.throws(() => compare(actual, { ...shadow, entries: [] }));
    for (const invalid of [
        { ...valid, status: '?' },
        { ...valid, tracked: false, status: ' M' },
        { ...valid, kind: 'file', mode: '120000' },
        { ...valid, kind: 'symlink', mode: '100644' },
        { ...valid, kind: 'missing', mode: '100644', hash: null },
        { ...valid, kind: 'missing', mode: 'missing', hash: 'a'.repeat(64) },
        { ...valid, kind: 'file', mode: '100644', hash: null },
        { ...valid, kind: 'file', mode: '100644', hash: 'bad-hash' },
    ]) {
        assert.throws(() => compare(actual, { ...shadow, entries: { 'modified.txt': invalid } }));
    }
});

test('report limits displayed paths and describes one-run parity limits', () => {
    const paths = Array.from({ length: 101 }, (_, i) => `path-${String(i).padStart(3, '0')}`);
    const output = render({ tracked: { ...empty, match: paths }, untracked: empty });
    assert.match(output, /Same path and state: \*\*101\*\*/);
    assert.match(output, /path-099/);
    assert.doesNotMatch(output, /path-100/);
    assert.match(output, /Additional paths omitted/);
    assert.match(output, /not proof that all affected selections are covered/);
});

test('truncated paths retain valid escaped JSON and do not split Unicode or HTML entities', () => {
    const paths = [
        `${'a'.repeat(496)}<${'b'.repeat(100)}`,
        `${'a'.repeat(496)}>${'b'.repeat(100)}`,
        `${'a'.repeat(496)}\\${'b'.repeat(100)}`,
        `${'a'.repeat(496)}\n${'b'.repeat(100)}`,
        `${'a'.repeat(496)}😀${'b'.repeat(100)}`,
        '<\\\n😀'.repeat(300),
    ];
    for (const name of paths) {
        const output = render({ tracked: { ...empty, match: [name] }, untracked: empty });
        const line = output.split('\n').find(value => value.startsWith('  - '));
        assert.ok(line);
        const encoded = line.slice(4);
        assert.ok(encoded.length <= 500, `encoded path length was ${encoded.length}`);
        assert.match(encoded, /…"$/);
        const json = encoded
            .replace(/\\([\\`*_{}\[\]()!|#])/g, '$1')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>');
        const decoded = JSON.parse(json);
        assert.match(decoded, /…$/);
        assert.doesNotMatch(
            decoded,
            /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/u
        );
    }
});

test('CLI reports inconclusive for failed tests, missing artifacts, and mismatched commits', t => {
    const { root, sha } = fixture(t);
    const actualFile = path.join(root, 'actual.json');
    const shadowFile = path.join(root, 'shadow.json');
    const summary = path.join(root, 'summary.md');
    const actual = snapshot(root, sha, 'full');
    const shadow = snapshot(root, sha, 'shadow');
    const successes = {
        MAID_FULL_JOB_OUTCOME: 'success',
        MAID_FULL_TEST_OUTCOME: 'success',
        MAID_FULL_SNAPSHOT_OUTCOME: 'success',
        MAID_SHADOW_GENERATOR_OUTCOME: 'success',
        MAID_SHADOW_SNAPSHOT_OUTCOME: 'success',
        MAID_FULL_DOWNLOAD_OUTCOME: 'success',
        MAID_SHADOW_DOWNLOAD_OUTCOME: 'success',
    };
    const run = (env = {}) => {
        writeFileSync(summary, '');
        const result = spawnSync(
            process.execPath,
            [
                path.join(__dirname, '../../scripts/maid-shadow.cjs'),
                'compare',
                actualFile,
                shadowFile,
            ],
            {
                cwd: root,
                encoding: 'utf8',
                env: {
                    ...process.env,
                    ...successes,
                    GITHUB_SHA: sha,
                    GITHUB_STEP_SUMMARY: summary,
                    ...env,
                },
            }
        );
        assert.equal(result.status, 0, result.stderr);
        const output = readFileSync(summary, 'utf8');
        assert.match(output, /inconclusive/i);
        assert.match(output, /no equivalence conclusion/i);
        return output;
    };
    writeFileSync(actualFile, JSON.stringify(actual));
    writeFileSync(shadowFile, JSON.stringify(shadow));
    run({ MAID_FULL_TEST_OUTCOME: 'failure' });
    run({ MAID_FULL_JOB_OUTCOME: 'failure' });
    const statuses = run({
        MAID_FULL_DOWNLOAD_OUTCOME: 'failure',
        MAID_SHADOW_DOWNLOAD_OUTCOME: 'skipped',
    });
    assert.match(statuses, /Full download: failure/);
    assert.match(statuses, /Shadow download: skipped/);
    const unknown = run({ MAID_FULL_DOWNLOAD_OUTCOME: '<script>\nmalicious' });
    assert.match(unknown, /Full download: unknown/);
    assert.doesNotMatch(unknown, /script|malicious/i);
    unlinkSync(shadowFile);
    run();
    writeFileSync(shadowFile, JSON.stringify({ ...shadow, sha: 'f'.repeat(40) }));
    run();
});

test('CLI emits a bounded successful comparison and explains its limits', t => {
    const { root, sha } = fixture(t);
    writeFileSync(path.join(root, 'modified.txt'), 'changed\n');
    const actual = snapshot(root, sha, 'full');
    const shadow = snapshot(root, sha, 'shadow');
    const actualFile = path.join(root, 'actual.json');
    const shadowFile = path.join(root, 'shadow.json');
    const summary = path.join(root, 'summary.md');
    writeFileSync(actualFile, JSON.stringify(actual));
    writeFileSync(shadowFile, JSON.stringify(shadow));
    const result = spawnSync(
        process.execPath,
        [path.join(__dirname, '../../scripts/maid-shadow.cjs'), 'compare', actualFile, shadowFile],
        {
            cwd: root,
            encoding: 'utf8',
            env: {
                ...process.env,
                GITHUB_SHA: sha,
                GITHUB_STEP_SUMMARY: summary,
                MAID_FULL_JOB_OUTCOME: 'success',
                MAID_FULL_TEST_OUTCOME: 'success',
                MAID_FULL_SNAPSHOT_OUTCOME: 'success',
                MAID_SHADOW_GENERATOR_OUTCOME: 'success',
                MAID_SHADOW_SNAPSHOT_OUTCOME: 'success',
                MAID_FULL_DOWNLOAD_OUTCOME: 'success',
                MAID_SHADOW_DOWNLOAD_OUTCOME: 'success',
            },
        }
    );
    assert.equal(result.status, 0, result.stderr);
    const output = readFileSync(summary, 'utf8');
    assert.doesNotMatch(output, /inconclusive/i);
    assert.match(output, /modified\.txt/);
    assert.match(output, /Same path and state: \*\*1\*\*/);
    assert.match(output, /not proof that all affected selections are covered/);
});
