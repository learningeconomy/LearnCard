/**
 * Classify one merge-group event against a complete, point-in-time queue snapshot.
 * This is an observation only: it must never authorize skipping or passing E2E.
 * A later queue event, removal, timeout, or out-of-order webhook can change the tail.
 *
 * `snapshot` is the GraphQL mergeQueue object, including configuration and a fully
 * paginated entries connection. Entries use the queue candidate `headCommit.oid`,
 * not the pull request's branch SHA.
 */
export const classifyQueueBatch = (snapshot, eventHeadSha) => {
    const unknown = reason => ({ classification: 'unknown', reason, advisoryOnly: true });
    const isSha = value => typeof value === 'string' && /^[a-f0-9]{40}$/i.test(value);
    const isCount = value => Number.isInteger(value) && value >= 1 && value <= 100;

    if (!isSha(eventHeadSha)) return unknown('invalid_event_sha');
    const config = snapshot?.configuration;
    const buildLimit = config?.maximumEntriesToBuild;
    const mergeLimit = config?.maximumEntriesToMerge;
    const minimum = config?.minimumEntriesToMerge;
    if (
        !isCount(buildLimit) ||
        !isCount(mergeLimit) ||
        !isCount(minimum) ||
        minimum > mergeLimit ||
        !Number.isInteger(config?.minimumEntriesToMergeWaitTime) ||
        config.minimumEntriesToMergeWaitTime < 0 ||
        !['ALLGREEN', 'HEADGREEN'].includes(config?.mergingStrategy)
    ) {
        return unknown('incomplete_configuration');
    }

    const connection = snapshot?.entries;
    if (!Array.isArray(connection?.nodes) || connection?.pageInfo?.hasNextPage !== false) {
        return unknown('incomplete_entries');
    }
    const nodes = connection.nodes;
    if (nodes.length === 0) return unknown('empty_queue');

    const seenHeads = new Set();
    const seenPullRequests = new Set();
    const candidates = [];
    for (let index = 0; index < nodes.length; index++) {
        const entry = nodes[index];
        const number = entry?.pullRequest?.number;
        if (entry?.position !== index + 1 || !Number.isInteger(number) || number <= 0) {
            return unknown('invalid_entry_order');
        }
        if (seenPullRequests.has(number)) return unknown('duplicate_pull_request');
        seenPullRequests.add(number);
        // A solo entry may split the window into groups regardless of mergeLimit.
        if (typeof entry.solo !== 'boolean') return unknown('missing_group_membership');
        if (entry.solo) return unknown('solo_entry');

        if (entry.position > buildLimit) {
            // A previously built or otherwise active entry beyond this window makes
            // the actual buildable tail uncertain; queued, unbuilt entries are fine.
            if (entry.state !== 'QUEUED' || entry.headCommit != null) {
                return unknown('ambiguous_build_window');
            }
            continue;
        }
        if (!['AWAITING_CHECKS', 'MERGEABLE'].includes(entry.state)) {
            return unknown('unstable_entry');
        }
        const head = entry.headCommit?.oid;
        const base = entry.baseCommit?.oid;
        if (!isSha(head) || !isSha(base)) return unknown('missing_candidate_sha');
        const normalizedHead = head.toLowerCase();
        if (seenHeads.has(normalizedHead)) return unknown('duplicate_candidate_sha');
        seenHeads.add(normalizedHead);
        if (index > 0 && base.toLowerCase() !== candidates[index - 1].head) {
            return unknown('inconsistent_candidate_chain');
        }
        candidates.push({ head: normalizedHead, position: entry.position, number });
    }

    if (candidates.length < minimum) return unknown('minimum_group_not_reached');
    // Separate merge groups can exist within a larger build window. Without group
    // membership, the global tail is not necessarily the head of this event's group.
    if (candidates.length > mergeLimit) return unknown('multiple_groups_possible');
    const current = candidates.find(candidate => candidate.head === eventHeadSha.toLowerCase());
    if (!current) return unknown('event_sha_not_current');
    const tail = candidates[candidates.length - 1];

    return {
        classification: current.head === tail.head ? 'observed_tail' : 'observed_prefix',
        reason: 'complete_snapshot',
        advisoryOnly: true,
        eventSha: current.head,
        eventPosition: current.position,
        previousCandidateSha: candidates[current.position - 2]?.head ?? null,
        observedTailSha: tail.head,
        observedTailPosition: tail.position,
        candidateCount: candidates.length,
        mergingStrategy: config.mergingStrategy,
    };
};
