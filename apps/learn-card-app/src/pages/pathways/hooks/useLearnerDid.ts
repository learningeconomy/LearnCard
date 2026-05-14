/**
 * Resolve the current learner's DID for pathway ownership and credential
 * projection.
 *
 * Phase 1 uses a stable placeholder — Pathways doesn't yet issue
 * anything, so real DID plumbing is only needed when Phase 3b
 * (Interpretation / RecorderAgent) lands and Phase 5 turns on real
 * projection-to-issuance.
 *
 * The placeholder is deterministic per device so pathways created in
 * dev don't collide across learners.
 */

import { useMemo } from 'react';

const PLACEHOLDER_DID_KEY = 'pathways.placeholderLearnerDid';

const makePlaceholderDid = (): string => {
    if (typeof window === 'undefined') return 'did:learner:ssr';

    const existing = window.localStorage?.getItem(PLACEHOLDER_DID_KEY);

    if (existing) return existing;

    const fresh = `did:learner:placeholder-${Math.random().toString(36).slice(2, 10)}`;

    try {
        window.localStorage?.setItem(PLACEHOLDER_DID_KEY, fresh);
    } catch {
        // localStorage unavailable; fine for this phase.
    }

    return fresh;
};

export const useLearnerDid = (): string => useMemo(() => makePlaceholderDid(), []);
