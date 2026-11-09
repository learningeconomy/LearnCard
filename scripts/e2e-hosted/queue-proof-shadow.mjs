import { execFileSync } from 'node:child_process';

const SHA = /^[a-f0-9]{40}$/i;
const validSha = value => typeof value === 'string' && SHA.test(value);
const validPath = path =>
    typeof path === 'string' &&
    path.length > 0 &&
    !path.startsWith('/') &&
    !path.includes('\0') &&
    path.split('/').every(part => part && part !== '.' && part !== '..');

// Matching tracked files does not attest to the builds, environment, mutable
// images, or any previous test outcome. These caveats are present for all results.
const caveats = [
    'source_tree_only_not_e2e_proof',
    'runtime_and_external_inputs_not_bound',
    'container_image_digests_not_bound',
    'test_selection_and_producer_not_verified',
];

const unknown = reason => ({
    classification: 'unknown',
    reason,
    advisoryOnly: true,
    notProof: true,
    caveats: [...caveats],
});

/**
 * Compare verified Git evidence only. Never authorizes reuse or skips a check.
 * The caller must obtain previousSha from the intended queue revision; this
 * function does not discover or authenticate an earlier queue run or verdict.
 */
export const compareQueueProofInputs = evidence => {
    const {
        headSha,
        previousSha,
        resolvedHeadSha,
        resolvedPreviousSha,
        headTreeSha,
        previousTreeSha,
        isAncestor,
        diffComplete,
        changedPaths,
    } = evidence ?? {};
    if (!validSha(headSha) || !validSha(previousSha)) return unknown('invalid_commit_sha');
    if (!validSha(resolvedHeadSha) || !validSha(resolvedPreviousSha))
        return unknown('missing_resolved_commit');
    if (
        headSha.toLowerCase() !== resolvedHeadSha.toLowerCase() ||
        previousSha.toLowerCase() !== resolvedPreviousSha.toLowerCase()
    )
        return unknown('resolved_commit_mismatch');
    if (!validSha(headTreeSha) || !validSha(previousTreeSha)) return unknown('missing_tree_sha');
    if (isAncestor !== true) return unknown('ancestry_unverified');
    if (diffComplete !== true || !Array.isArray(changedPaths) || !changedPaths.every(validPath))
        return unknown('diff_unverified');
    if (new Set(changedPaths).size !== changedPaths.length) return unknown('duplicate_diff_path');

    const sameTree = headTreeSha.toLowerCase() === previousTreeSha.toLowerCase();
    if (sameTree !== (changedPaths.length === 0)) return unknown('tree_diff_inconsistent');

    // These counts are descriptive only. In particular docs/snippets and all
    // other paths remain inputs; no category is excluded or declared safe.
    const categories = {};
    for (const path of changedPaths) {
        const prefix = path.split('/')[0];
        const category = [
            '.github',
            'apps',
            'docs',
            'packages',
            'scripts',
            'services',
            'tests',
        ].includes(prefix)
            ? prefix
            : 'other';
        categories[category] = (categories[category] ?? 0) + 1;
    }
    const resultCaveats = [...caveats];
    if (headSha.toLowerCase() !== previousSha.toLowerCase()) {
        resultCaveats.push('different_commit_sha_can_change_browser_build');
    }
    return {
        classification: sameTree ? 'candidate_only' : 'different_source_tree',
        reason: sameTree ? 'identical_tracked_tree' : 'tracked_tree_changed',
        advisoryOnly: true,
        notProof: true,
        changedPathCount: changedPaths.length,
        changedPathCategories: categories,
        caveats: resultCaveats,
    };
};

/**
 * Collect commit, tree, ancestry and complete name-only diff from a checkout.
 * No network, repository mutations, environment capture, or test result access.
 * The checkout must be the exact head being observed; failures remain unknown.
 */
export const observeGitComparison = ({ cwd, headSha, previousSha } = {}) => {
    if (!validSha(headSha) || !validSha(previousSha)) return unknown('invalid_commit_sha');
    if (typeof cwd !== 'string' || !cwd) return unknown('missing_checkout');
    const git = (...args) =>
        execFileSync('git', args, {
            cwd,
            encoding: 'utf8',
            timeout: 10000,
            stdio: ['ignore', 'pipe', 'pipe'],
            maxBuffer: 10 * 1024 * 1024,
        });
    try {
        const resolvedHeadSha = git('rev-parse', '--verify', 'HEAD^{commit}').trim();
        const suppliedHeadSha = git('rev-parse', '--verify', `${headSha}^{commit}`).trim();
        const resolvedPreviousSha = git('rev-parse', '--verify', `${previousSha}^{commit}`).trim();
        if (resolvedHeadSha !== suppliedHeadSha) return unknown('checkout_mismatch');
        if (git('status', '--porcelain=v1', '--untracked-files=all'))
            return unknown('checkout_dirty');
        try {
            git('merge-base', '--is-ancestor', resolvedPreviousSha, resolvedHeadSha);
        } catch {
            return unknown('ancestry_unverified');
        }
        const headTreeSha = git('rev-parse', '--verify', `${resolvedHeadSha}^{tree}`).trim();
        const previousTreeSha = git(
            'rev-parse',
            '--verify',
            `${resolvedPreviousSha}^{tree}`
        ).trim();
        const diff = git(
            'diff',
            '--name-only',
            '--no-renames',
            '-z',
            resolvedPreviousSha,
            resolvedHeadSha,
            '--'
        );
        if (diff && !diff.endsWith('\0')) return unknown('diff_unverified');
        const changedPaths = diff ? diff.slice(0, -1).split('\0') : [];
        return compareQueueProofInputs({
            headSha,
            previousSha,
            resolvedHeadSha,
            resolvedPreviousSha,
            headTreeSha,
            previousTreeSha,
            isAncestor: true,
            diffComplete: true,
            changedPaths,
        });
    } catch {
        return unknown('git_evidence_unavailable');
    }
};
