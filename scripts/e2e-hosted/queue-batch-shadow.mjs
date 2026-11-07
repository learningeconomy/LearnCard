/**
 * Observe the exact current candidate and its immediate predecessor without
 * requiring the administrator-only queue configuration. This does not infer
 * queue policy, merge-group membership, the buildable tail, or eligibility to
 * reuse a result. A snapshot can change immediately after this observation.
 */
export const observeQueueChain = (snapshot, eventHeadSha) => {
    const unknown = reason => ({
        classification: 'unknown',
        reason,
        advisoryOnly: true,
        queuePolicy: 'unknown',
    });
    const isSha = value => typeof value === 'string' && /^[a-f0-9]{40}$/i.test(value);

    if (!isSha(eventHeadSha)) return unknown('invalid_event_sha');
    const connection = snapshot?.entries;
    if (!Array.isArray(connection?.nodes) || connection?.pageInfo?.hasNextPage !== false) {
        return unknown('incomplete_entries');
    }
    if (!connection.nodes.length) return unknown('empty_queue');

    const heads = new Set();
    const pullRequests = new Set();
    const candidates = [];
    let sawQueuedEntry = false;
    for (let index = 0; index < connection.nodes.length; index++) {
        const entry = connection.nodes[index];
        const number = entry?.pullRequest?.number;
        if (entry?.position !== index + 1 || !Number.isInteger(number) || number <= 0) {
            return unknown('invalid_entry_order');
        }
        if (pullRequests.has(number)) return unknown('duplicate_pull_request');
        pullRequests.add(number);
        if (typeof entry.solo !== 'boolean') return unknown('missing_group_membership');
        if (entry.solo) return unknown('solo_entry');

        // Entries waiting for a build can appear after the cumulative candidate
        // chain. They are still counted, but cannot identify a tested revision.
        if (entry.state === 'QUEUED' && entry.headCommit == null && entry.baseCommit == null) {
            sawQueuedEntry = true;
            continue;
        }
        if (sawQueuedEntry) return unknown('built_after_queued');
        if (!['AWAITING_CHECKS', 'MERGEABLE'].includes(entry.state)) {
            return unknown('unstable_entry');
        }
        const head = entry.headCommit?.oid;
        const base = entry.baseCommit?.oid;
        if (!isSha(head) || !isSha(base)) return unknown('missing_candidate_sha');
        const normalizedHead = head.toLowerCase();
        if (heads.has(normalizedHead)) return unknown('duplicate_candidate_sha');
        heads.add(normalizedHead);
        if (index > 0 && base.toLowerCase() !== candidates[index - 1].head) {
            return unknown('inconsistent_candidate_chain');
        }
        candidates.push({ head: normalizedHead, position: entry.position });
    }

    const current = candidates.find(candidate => candidate.head === eventHeadSha.toLowerCase());
    if (!current) return unknown('event_sha_not_current');
    return {
        classification: 'observed_candidate',
        reason: 'complete_queue_chain',
        advisoryOnly: true,
        queuePolicy: 'unknown',
        eventSha: current.head,
        eventPosition: current.position,
        entryCount: connection.nodes.length,
        builtCandidateCount: candidates.length,
        eventIsLastListed: current.position === connection.nodes.length,
        previousCandidateSha: candidates[current.position - 2]?.head ?? null,
    };
};
