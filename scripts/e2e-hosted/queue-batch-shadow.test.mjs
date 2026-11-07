import assert from 'node:assert/strict';
import test from 'node:test';
import { observeQueueChain } from './queue-batch-shadow.mjs';

const sha = digit => digit.repeat(40);
const entry = (position, head, base, options = {}) => ({
    position,
    state: 'AWAITING_CHECKS',
    headCommit: { oid: head },
    baseCommit: { oid: base },
    pullRequest: { number: position },
    solo: false,
    ...options,
});
const snapshot = () => ({
    entries: {
        pageInfo: { hasNextPage: false },
        nodes: [entry(1, sha('1'), sha('a')), entry(2, sha('2'), sha('1'))],
    },
});

const unknown = reason => ({
    classification: 'unknown',
    reason,
    advisoryOnly: true,
    queuePolicy: 'unknown',
});

test('observes exact cumulative queue candidate and predecessor without admin-only configuration', () => {
    const s = snapshot();
    s.entries.nodes[0].pullRequest.headRefOid = sha('f');
    assert.deepEqual(observeQueueChain(s, sha('1')), {
        classification: 'observed_candidate',
        reason: 'complete_queue_chain',
        advisoryOnly: true,
        queuePolicy: 'unknown',
        eventSha: sha('1'),
        eventPosition: 1,
        entryCount: 2,
        eventIsLastListed: false,
        previousCandidateSha: null,
    });
    assert.deepEqual(observeQueueChain(s, sha('2')), {
        classification: 'observed_candidate',
        reason: 'complete_queue_chain',
        advisoryOnly: true,
        queuePolicy: 'unknown',
        eventSha: sha('2'),
        eventPosition: 2,
        entryCount: 2,
        eventIsLastListed: true,
        previousCandidateSha: sha('1'),
    });
    assert.deepEqual(observeQueueChain(s, sha('f')), unknown('event_sha_not_current'));
});

test('a different queue state makes the old candidate unknown, not an eligible result', () => {
    const before = snapshot();
    assert.equal(observeQueueChain(before, sha('2')).eventIsLastListed, true);
    const after = snapshot();
    after.entries.nodes.pop();
    after.entries.nodes.push(entry(2, sha('3'), sha('1'), { pullRequest: { number: 3 } }));
    assert.deepEqual(observeQueueChain(after, sha('2')), unknown('event_sha_not_current'));
    assert.equal(observeQueueChain(after, sha('3')).previousCandidateSha, sha('1'));
});

test('missing, empty, or paginated snapshots never infer a candidate', () => {
    assert.deepEqual(observeQueueChain(null, sha('1')), unknown('incomplete_entries'));
    assert.deepEqual(observeQueueChain(snapshot(), 'abc'), unknown('invalid_event_sha'));
    const empty = snapshot();
    empty.entries.nodes = [];
    assert.deepEqual(observeQueueChain(empty, sha('1')), unknown('empty_queue'));
    const paged = snapshot();
    paged.entries.pageInfo.hasNextPage = true;
    assert.deepEqual(observeQueueChain(paged, sha('1')), unknown('incomplete_entries'));
    delete paged.entries.pageInfo;
    assert.deepEqual(observeQueueChain(paged, sha('1')), unknown('incomplete_entries'));
});

test('duplicate PRs, missing or reordered entries fail closed', () => {
    const duplicate = snapshot();
    duplicate.entries.nodes[1].pullRequest.number = 1;
    assert.deepEqual(observeQueueChain(duplicate, sha('1')), unknown('duplicate_pull_request'));
    const missingFirst = snapshot();
    missingFirst.entries.nodes.shift();
    assert.deepEqual(observeQueueChain(missingFirst, sha('2')), unknown('invalid_entry_order'));
    const gap = snapshot();
    gap.entries.nodes[1].position = 3;
    assert.deepEqual(observeQueueChain(gap, sha('1')), unknown('invalid_entry_order'));
});

test('invalid, duplicate or non-cumulative candidate SHAs are unknown', () => {
    const missing = snapshot();
    missing.entries.nodes[1].headCommit = null;
    assert.deepEqual(observeQueueChain(missing, sha('1')), unknown('missing_candidate_sha'));
    const duplicate = snapshot();
    duplicate.entries.nodes[1].headCommit.oid = sha('1');
    assert.deepEqual(observeQueueChain(duplicate, sha('1')), unknown('duplicate_candidate_sha'));
    const changedBase = snapshot();
    changedBase.entries.nodes[1].baseCommit.oid = sha('b');
    assert.deepEqual(
        observeQueueChain(changedBase, sha('1')),
        unknown('inconsistent_candidate_chain')
    );
});

test('unknown, unbuilt and solo entries do not infer group membership or a tail', () => {
    for (const state of ['QUEUED', 'LOCKED', 'UNMERGEABLE', undefined]) {
        const s = snapshot();
        s.entries.nodes[1].state = state;
        assert.deepEqual(observeQueueChain(s, sha('1')), unknown('unstable_entry'));
    }
    const solo = snapshot();
    solo.entries.nodes[0].solo = true;
    assert.deepEqual(observeQueueChain(solo, sha('2')), unknown('solo_entry'));
    delete solo.entries.nodes[0].solo;
    assert.deepEqual(observeQueueChain(solo, sha('2')), unknown('missing_group_membership'));
});
