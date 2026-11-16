import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, test } from 'node:test';
import { compareQueueProofInputs, observeGitComparison } from './queue-proof-shadow.mjs';

const a = 'a'.repeat(40);
const b = 'b'.repeat(40);
const c = 'c'.repeat(40);
const evidence = {
    headSha: b,
    previousSha: a,
    resolvedHeadSha: b,
    resolvedPreviousSha: a,
    headTreeSha: c,
    previousTreeSha: c,
    isAncestor: true,
    diffComplete: true,
    changedPaths: [],
};

test('matching tracked trees are candidates only, never proof or authorization', () => {
    const result = compareQueueProofInputs(evidence);
    assert.equal(result.classification, 'candidate_only');
    assert.equal(result.reason, 'identical_tracked_tree');
    assert.equal(result.advisoryOnly, true);
    assert.equal(result.notProof, true);
    assert.ok(result.caveats.includes('different_commit_sha_can_change_browser_build'));
    assert.ok(result.caveats.includes('container_image_digests_not_bound'));
    assert.ok(result.caveats.includes('test_selection_and_producer_not_verified'));
    assert.equal(result.changedPathCount, 0);
    assert.equal('skipE2E' in result, false);
});

test('any changed tree remains different, with counts only and no path exemptions', () => {
    const result = compareQueueProofInputs({
        ...evidence,
        headTreeSha: b,
        changedPaths: [
            'docs/snippets/quickstart/example.mjs',
            '.github/workflows/deploy.yml',
            'services/api/index.ts',
            'bun.lock',
        ],
    });
    assert.equal(result.classification, 'different_source_tree');
    assert.equal(result.notProof, true);
    assert.equal(result.changedPathCount, 4);
    assert.deepEqual(result.changedPathCategories, {
        docs: 1,
        '.github': 1,
        services: 1,
        other: 1,
    });
    assert.equal(JSON.stringify(result).includes('example.mjs'), false);
});

test('incomplete, inconsistent or unauditable evidence is unknown', () => {
    const cases = [
        [{ headSha: '' }, 'invalid_commit_sha'],
        [{ previousSha: '1234567' }, 'invalid_commit_sha'],
        [{ resolvedHeadSha: null }, 'missing_resolved_commit'],
        [{ resolvedHeadSha: a }, 'resolved_commit_mismatch'],
        [{ headTreeSha: null }, 'missing_tree_sha'],
        [{ isAncestor: false }, 'ancestry_unverified'],
        [{ isAncestor: null }, 'ancestry_unverified'],
        [{ diffComplete: false }, 'diff_unverified'],
        [{ changedPaths: ['../unsafe'] }, 'diff_unverified'],
        [{ changedPaths: ['a', 'a'] }, 'duplicate_diff_path'],
        [{ changedPaths: ['docs/snippets/a'] }, 'tree_diff_inconsistent'],
        [{ headTreeSha: a }, 'tree_diff_inconsistent'],
    ];
    for (const [override, reason] of cases) {
        const result = compareQueueProofInputs({ ...evidence, ...override });
        assert.equal(result.classification, 'unknown', reason);
        assert.equal(result.reason, reason);
        assert.equal(result.notProof, true);
    }
});

const repo = mkdtempSync(join(tmpdir(), 'queue-proof-shadow-'));
after(() => rmSync(repo, { recursive: true, force: true }));
const git = (...args) =>
    execFileSync('git', args, {
        cwd: repo,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
const commit = message => {
    git(
        '-c',
        'user.name=Test',
        '-c',
        'user.email=test@example.invalid',
        'commit',
        '--quiet',
        '-m',
        message
    );
    return git('rev-parse', 'HEAD');
};

test('Git observations require the actual clean checkout, resolved ancestry and complete diff', () => {
    git('init', '--quiet', '-b', 'main');
    writeFileSync(join(repo, 'one.txt'), 'one');
    git('add', 'one.txt');
    const first = commit('first');
    git(
        '-c',
        'user.name=Test',
        '-c',
        'user.email=test@example.invalid',
        'commit',
        '--quiet',
        '--allow-empty',
        '-m',
        'same tree'
    );
    const second = git('rev-parse', 'HEAD');
    assert.equal(
        observeGitComparison({ cwd: repo, previousSha: first, headSha: second }).classification,
        'candidate_only'
    );

    mkdirSync(join(repo, 'docs', 'snippets'), { recursive: true });
    writeFileSync(join(repo, 'docs', 'snippets', 'example.mjs'), 'example');
    assert.equal(
        observeGitComparison({ cwd: repo, previousSha: first, headSha: second }).reason,
        'checkout_dirty'
    );
    git('add', 'docs/snippets/example.mjs');
    const third = commit('changed snippet');
    const changed = observeGitComparison({ cwd: repo, previousSha: second, headSha: third });
    assert.equal(changed.classification, 'different_source_tree');
    assert.deepEqual(changed.changedPathCategories, { docs: 1 });
    assert.equal(
        observeGitComparison({ cwd: repo, previousSha: first, headSha: second }).reason,
        'checkout_mismatch'
    );
    assert.equal(
        observeGitComparison({ cwd: repo, previousSha: a, headSha: third }).reason,
        'git_evidence_unavailable'
    );
    assert.equal(
        observeGitComparison({ cwd: repo, previousSha: third, headSha: third }).classification,
        'candidate_only'
    );

    git('checkout', '--quiet', '-b', 'divergent', first);
    writeFileSync(join(repo, 'other.txt'), 'other');
    git('add', 'other.txt');
    const divergent = commit('divergent');
    assert.equal(
        observeGitComparison({ cwd: repo, previousSha: third, headSha: divergent }).reason,
        'ancestry_unverified'
    );
});
