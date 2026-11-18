'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

test('app reporter hashes case identities independently of execution order', t => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'lc-worker-reporter-test-'));
    t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
    const program = `
        import { BenchmarkReporter } from ${JSON.stringify(path.join(__dirname, 'reporter.ts'))};
        const first = { moduleId: '/repo/src/a.test.ts', children: { allTests: () => [
            { fullName: 'private case one', location: { line: 7 } },
            { fullName: 'private case two', location: { line: 8 } },
        ] } };
        const second = { moduleId: '/repo/src/b.test.ts', children: { allTests: () => [
            { fullName: 'another case', location: { line: 4 } },
        ] } };
        const reporter = new BenchmarkReporter(process.env.OUTPUT);
        reporter.onInit({ config: { root: '/repo', maxWorkers: 4 } });
        reporter.onTestRunEnd(process.env.REVERSE === '1' ? [second, first] : [first, second], [], 'passed');
    `;
    const execute = (name, reverse) => {
        const output = path.join(directory, `${name}.json`);
        const result = spawnSync('bun', ['-e', program], {
            env: { ...process.env, OUTPUT: output, REVERSE: reverse },
            encoding: 'utf8',
        });
        assert.equal(result.status, 0, result.stderr);
        const raw = fs.readFileSync(output, 'utf8');
        assert.doesNotMatch(raw, /private case/);
        return JSON.parse(raw);
    };
    const first = execute('first', '0');
    const second = execute('second', '1');
    assert.deepEqual(first.files, ['src/a.test.ts', 'src/b.test.ts']);
    assert.equal(first.caseCount, 3);
    assert.equal(first.maxWorkers, 4);
    assert.equal(first.caseIdentitySha256, second.caseIdentitySha256);
    assert.deepEqual(first, second);
});
