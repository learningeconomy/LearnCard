import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import { createFixture } from './fixtures/proof-run/create.mjs';

const repo = fileURLToPath(new URL('..', import.meta.url));
const probe = code => {
    const result = spawnSync(
        'bun',
        [
            '-e',
            `
        import assert from 'node:assert/strict';
        import * as proof from './scripts/proof.ts';
        ${code}
    `,
        ],
        { cwd: repo, encoding: 'utf8', timeout: 30_000 }
    );
    assert.equal(result.status, 0, result.stderr + result.stdout);
};

test('media selection takes the last after, all failures, and WebM only', () => {
    probe(`
        assert.deepEqual(proof.selectFeatureMedia([
            '001-before.png', '002-after.png', '010-after.png', '011-failure.png',
            '012-failure-state-page.png', '013-interrupted-page.png', '0-user-video/a.webm',
            'actions.json', 'trace.zip', 'session.json', '.env', 'service.log',
            'sessions/999-after.png', 'sessions/video.webm', 'random.mp4'
        ]), ['010-after.png', '011-failure.png', '012-failure-state-page.png',
            '013-interrupted-page.png', '0-user-video/a.webm']);
        assert.deepEqual(proof.selectFeatureMedia(['001-ready.png']), ['001-ready.png']);
        for (const path of ['sessions/a.png', 'SESSIONS/a.PNG', 'x\\\\sessions\\\\a.jpg',
            '.env.png', 'report.json', 'trace.zip', 'file.svg', 'file.log']) {
            assert.equal(proof.allowedMedia(path), false, path);
        }
        for (const extension of ['png', 'jpg', 'jpeg', 'gif', 'webp', 'webm', 'mp4']) {
            assert.equal(proof.allowedMedia('image.' + extension), true);
        }
    `);
});

test('fixture collection excludes private files, symlinks and oversized media, deduplicates', async () => {
    const root = await createFixture();
    try {
        probe(`
            import { symlink, open } from 'node:fs/promises';
            const root = ${JSON.stringify(root)};
            await symlink(root + '/sessions/private.png', root + '/leak.png');
            await symlink(root + '/sessions', root + '/alias');
            await symlink(root + '/account', root + '/media-alias');
            await symlink(root + '/missing.png', root + '/broken.png');
            await symlink(root, root + '/run-alias');
            await assert.rejects(proof.collectMedia([], root + '/run-alias'), /symlink/);
            const big = await open(root + '/large.mp4', 'w');
            await big.truncate(50 * 1024 * 1024 + 1);
            await big.close();
            const result = await proof.collectMedia([
                root + '/account/003-wallet-after.png', root + '/sessions/private.png',
                root + '/leak.png', root + '/alias/private.png', root + '/large.mp4',
                root + '/report.json', root + '/account/0-learner-trace.zip', root + '/.env',
                root + '/service.log', root + '/account/0-learner-session.json',
                root + '/media-alias/003-wallet-after.png', root + '/broken.png'
            ], root);
            assert.equal(result.media.length, 4);
            assert.equal(result.warnings.length, 11);
            assert.ok(result.media.every(item => proof.allowedMedia(item.path)));
            assert.ok(result.media.some(item => item.type === 'video/webm'));
            assert.equal(result.report.results[1].entries, undefined);
        `);
    } finally {
        await rm(root, { recursive: true, force: true });
    }
});

test('keys preserve filenames, reject traversal and invalid identifiers', () => {
    probe(`
        assert.equal(proof.buildKey('1741', 'abc123', 'account', 'after image.png'),
            'pr-1741/abc123/account/after image.png');
        assert.equal(proof.buildKey('1', 'abcd', 'files', 'video.webm'), 'pr-1/abcd/files/video.webm');
        for (const args of [['0', 'abc', 'files', 'a.png'], ['1', 'HEAD', 'files', 'a.png'],
            ['1', 'abc', '../sessions', 'a.png'], ['1', 'abc', 'files', '../a.png']]) {
            assert.throws(() => proof.buildKey(...args));
        }
    `);
});

test('markdown is honest about failures, missing entries, coverage, and local errors', () => {
    probe(`
        const report = proof.parseReport(await Bun.file('scripts/fixtures/proof-run/report.json').json());
        const block = proof.renderProof({ sha: 'abc123', timestamp: '2026-10-19T12:00:00Z', report,
            uploads: [{feature:'account',path:'after.png',type:'image/png',url:'https://proof.test/a.png'},
                {feature:'sharing',path:'a.webm',type:'video/webm',url:'https://proof.test/a.webm'}],
            note: '<!-- proof:end --> | injected', notVerified: 'Native devices' });
        for (const expected of ['head abc123', '2026-10-19T12:00:00Z',
            '| account | passed | 1/1 | 2.0s |', '| sharing | failed | unknown/2 | 3.5s |',
            '![account](<https://proof.test/a.png>)', 'sharing video', 'Not run: sdk',
            'Not selected: language', 'Not verified: Native devices', 'Error recorded locally']) {
            assert.ok(block.includes(expected), expected);
        }
        assert.ok(!block.includes('PRIVATE_SENTINEL'));
        assert.equal(block.split('<!-- proof:end -->').length, 2);
        assert.ok(proof.renderProof({ sha:'abc',timestamp:'now',uploads:[],notVerified:'' }).includes('Describe remaining gaps'));
    `);
});

test('report parsing supports ad-hoc scripts and rejects malformed or unsafe feature names', () => {
    probe(`
        const report = proof.parseReport({ script:'custom.ts',status:'passed',startedAt:'2026-10-19T00:00:00Z',finishedAt:'2026-10-19T00:00:01Z' });
        assert.equal(report.script, true);
        assert.equal(report.results[0].feature, 'script');
        for (const value of [null, {}, {status:'totally-invalid',results:[]}, {status:'passed',results:[{feature:'../sessions',status:'passed',requiredEntries:[]}]},
            {status:'passed',results:[{feature:'sdk',status:'passed',requiredEntries:'wrong'}]}]) {
            assert.throws(() => proof.parseReport(value));
        }
    `);
});

test('replace/append preserves unrelated body and is idempotent on new heads', () => {
    probe(`
        const block = '<!-- proof:start -->\\nnew head\\n<!-- proof:end -->';
        const original = '# What & why\\nTwo sentences.\\n\\n## Proof\\n<!-- proof:start -->\\nold head\\n<!-- proof:end -->\\n\\n## How to try\\nTry it.\\n';
        const updated = proof.replaceProof(original, block);
        assert.equal(updated, original.replace('old head', 'new head'));
        assert.equal(proof.replaceProof(updated, block), updated);
        assert.equal(proof.replaceProof('Description', block), 'Description\\n\\n' + block + '\\n');
        assert.equal(proof.replaceProof('', block), block + '\\n');
        for (const body of ['<!-- proof:start -->', '<!-- proof:end -->',
            '<!-- proof:end --><!-- proof:start -->', block + block]) {
            assert.throws(() => proof.replaceProof(body, block));
        }
    `);
});

test('dry-run JSON makes no S3 or gh calls even with --update-pr', async () => {
    const root = await createFixture();
    try {
        probe(`
            import { S3Client } from 'bun';
            S3Client.prototype.write = () => { throw new Error('Network upload forbidden'); };
            const spawn = Bun.spawnSync;
            Bun.spawnSync = (args, options) => {
                assert.equal(args[0], 'git', 'No gh or network commands allowed');
                return spawn(args, options);
            };
            delete process.env.PROOF_S3_BUCKET;
            delete process.env.PROOF_S3_REGION;
            delete process.env.PROOF_PUBLIC_BASE_URL;
            const output = [];
            console.log = value => output.push(value);
            await proof.main(['publish','--pr','1741','--from-run',${JSON.stringify(root)},'--dry-run','--update-pr','--json']);
            assert.equal(output.length, 1);
            const result = JSON.parse(output[0]);
            assert.equal(result.updatedPr, false);
            assert.equal(result.uploads.length, 4);
            assert.ok(result.markdown.includes('proof-bucket-placeholder'));
            assert.ok(!result.markdown.includes('PRIVATE_SENTINEL'));
        `);
    } finally {
        await rm(root, { recursive: true, force: true });
    }
});

test('mocked publishing merges the latest PR body and never edits after upload or marker failures', async () => {
    const root = await createFixture();
    try {
        probe(`
            import { S3Client } from 'bun';
            import { readFileSync, existsSync } from 'node:fs';
            process.env.PROOF_S3_BUCKET = 'proof-test';
            process.env.PROOF_S3_REGION = 'us-east-1';
            process.env.AWS_ACCESS_KEY_ID = 'synthetic';
            process.env.AWS_SECRET_ACCESS_KEY = 'synthetic';
            delete process.env.PROOF_PUBLIC_BASE_URL;
            const spawn = Bun.spawnSync;
            const calls = [];
            let mode = 'success';
            let views = 0;
            let bodyFile;
            let editedBody;
            console.log = () => {};
            globalThis.fetch = () => { throw new Error('Network forbidden in test'); };
            S3Client.prototype.write = async () => {
                calls.push('upload');
                if (mode === 'upload-failure') throw new Error('Synthetic failure');
                return 1;
            };
            Bun.spawnSync = (args, options) => {
                if (args[0] === 'git') return spawn(args, options);
                assert.equal(args[0], 'gh');
                if (args[2] === 'view') {
                    calls.push('view');
                    views++;
                    const body = mode === 'bad-markers' && views === 2 ? '<!-- proof:start -->' :
                        '  ' + (views === 1 ? 'Original' : 'Concurrent edit') + '\\n\\n';
                    return {exitCode:0,stdout:Buffer.from(JSON.stringify({body}))};
                }
                assert.equal(args[2], 'edit');
                calls.push('edit');
                assert.equal(args[4], '--body-file');
                bodyFile = args[5];
                editedBody = readFileSync(bodyFile, 'utf8');
                return {exitCode:0,stdout:Buffer.from('')};
            };
            const args = ['publish','--pr','1741',${JSON.stringify(root + '/account/003-wallet-after.png')},'--update-pr','--json'];
            await proof.main(args);
            assert.deepEqual(calls, ['view','upload','view','edit']);
            assert.ok(editedBody.startsWith('  Concurrent edit\\n\\n'));
            assert.equal(existsSync(bodyFile), false);
            calls.length = 0; views = 0; mode = 'upload-failure';
            await assert.rejects(proof.main(args), /PR was not updated/);
            assert.deepEqual(calls, ['view','upload']);
            calls.length = 0; views = 0; mode = 'bad-markers';
            await assert.rejects(proof.main(args), /Uploads retained/);
            assert.deepEqual(calls, ['view','upload','view']);
        `);
    } finally {
        await rm(root, { recursive: true, force: true });
    }
});
