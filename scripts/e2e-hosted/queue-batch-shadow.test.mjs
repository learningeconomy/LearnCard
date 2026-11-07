import assert from 'node:assert/strict';
import test from 'node:test';
import { classifyQueueBatch } from './queue-batch-shadow.mjs';

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
    configuration: {
        maximumEntriesToBuild: 3,
        maximumEntriesToMerge: 3,
        minimumEntriesToMerge: 1,
        minimumEntriesToMergeWaitTime: 300,
        mergingStrategy: 'ALLGREEN',
    },
    entries: {
        pageInfo: { hasNextPage: false },
        nodes: [entry(1, sha('1'), sha('a')), entry(2, sha('2'), sha('1'))],
    },
});

test('classifies the current candidate and tail from queue commits, not PR branch heads', () => {
    const s = snapshot();
    s.entries.nodes[0].pullRequest.headRefOid = sha('f');
    assert.deepEqual(classifyQueueBatch(s, sha('1')), {
        classification: 'observed_prefix',
        reason: 'complete_snapshot',
        advisoryOnly: true,
        eventSha: sha('1'),
        eventPosition: 1,
        previousCandidateSha: null,
        observedTailSha: sha('2'),
        observedTailPosition: 2,
        candidateCount: 2,
        mergingStrategy: 'ALLGREEN',
    });
    assert.equal(classifyQueueBatch(s, sha('2')).classification, 'observed_tail');
    assert.equal(classifyQueueBatch(s, sha('2')).previousCandidateSha, sha('1'));
    assert.equal(classifyQueueBatch(s, sha('f')).reason, 'event_sha_not_current');
});

test('stale, missing, and malformed data are unknown rather than decisions', () => {
    const s = snapshot();
    assert.equal(classifyQueueBatch(s, sha('f')).reason, 'event_sha_not_current');
    assert.equal(classifyQueueBatch(s, 'not-a-sha').reason, 'invalid_event_sha');
    assert.equal(classifyQueueBatch(null, sha('1')).reason, 'incomplete_configuration');
    delete s.configuration.minimumEntriesToMergeWaitTime;
    assert.equal(classifyQueueBatch(s, sha('1')).reason, 'incomplete_configuration');
    assert.equal(classifyQueueBatch(snapshot(), sha('1')).advisoryOnly, true);
});

test('incomplete pagination and ambiguous queue order are unknown', () => {
    const partial = snapshot();
    partial.entries.pageInfo.hasNextPage = true;
    assert.equal(classifyQueueBatch(partial, sha('1')).reason, 'incomplete_entries');
    delete partial.entries.pageInfo;
    assert.equal(classifyQueueBatch(partial, sha('1')).reason, 'incomplete_entries');

    const missingFirst = snapshot();
    missingFirst.entries.nodes.shift();
    assert.equal(classifyQueueBatch(missingFirst, sha('2')).reason, 'invalid_entry_order');
    const duplicate = snapshot();
    duplicate.entries.nodes[1].pullRequest.number = 1;
    assert.equal(classifyQueueBatch(duplicate, sha('1')).reason, 'duplicate_pull_request');
});

test('invalid, duplicate or non-cumulative candidate SHAs are unknown', () => {
    const missing = snapshot();
    missing.entries.nodes[1].headCommit = null;
    assert.equal(classifyQueueBatch(missing, sha('1')).reason, 'missing_candidate_sha');
    const duplicate = snapshot();
    duplicate.entries.nodes[1].headCommit.oid = sha('1');
    assert.equal(classifyQueueBatch(duplicate, sha('1')).reason, 'duplicate_candidate_sha');
    const changedBase = snapshot();
    changedBase.entries.nodes[1].baseCommit.oid = sha('b');
    assert.equal(classifyQueueBatch(changedBase, sha('1')).reason, 'inconsistent_candidate_chain');
});

test('queued entries beyond the build window are not the observed buildable tail', () => {
    const s = snapshot();
    s.configuration.maximumEntriesToBuild = 2;
    s.entries.nodes.push(
        entry(3, null, null, { state: 'QUEUED', headCommit: null, baseCommit: null })
    );
    assert.equal(classifyQueueBatch(s, sha('2')).classification, 'observed_tail');
    assert.equal(classifyQueueBatch(s, sha('2')).previousCandidateSha, sha('1'));
    s.entries.nodes[2].state = 'AWAITING_CHECKS';
    assert.equal(classifyQueueBatch(s, sha('2')).reason, 'ambiguous_build_window');
});

test('minimum group timing, solo entries and multiple possible groups are unknown', () => {
    const tooSmall = snapshot();
    tooSmall.configuration.minimumEntriesToMerge = 3;
    assert.equal(classifyQueueBatch(tooSmall, sha('2')).reason, 'minimum_group_not_reached');
    const solo = snapshot();
    solo.entries.nodes[0].solo = true;
    assert.equal(classifyQueueBatch(solo, sha('2')).reason, 'solo_entry');
    delete solo.entries.nodes[0].solo;
    assert.equal(classifyQueueBatch(solo, sha('2')).reason, 'missing_group_membership');
    const multiple = snapshot();
    multiple.configuration.maximumEntriesToMerge = 1;
    assert.equal(classifyQueueBatch(multiple, sha('2')).reason, 'multiple_groups_possible');
});

test('a changed queue invalidates a previous event even if it was a tail', () => {
    const before = snapshot();
    assert.equal(classifyQueueBatch(before, sha('2')).classification, 'observed_tail');
    const after = snapshot();
    after.entries.nodes.pop();
    after.entries.nodes.push(entry(2, sha('3'), sha('1'), { pullRequest: { number: 3 } }));
    assert.equal(classifyQueueBatch(after, sha('2')).reason, 'event_sha_not_current');
    assert.equal(classifyQueueBatch(after, sha('3')).classification, 'observed_tail');
});

test('unknown entry states and malformed configuration are never interpreted as a tail', () => {
    for (const state of ['QUEUED', 'LOCKED', 'UNMERGEABLE', undefined]) {
        const s = snapshot();
        s.entries.nodes[1].state = state;
        assert.equal(classifyQueueBatch(s, sha('1')).reason, 'unstable_entry');
    }
    for (const limit of [0, -1, 101, null, '3']) {
        const s = snapshot();
        s.configuration.maximumEntriesToBuild = limit;
        assert.equal(classifyQueueBatch(s, sha('1')).reason, 'incomplete_configuration');
    }
});
