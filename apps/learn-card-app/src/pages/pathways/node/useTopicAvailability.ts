/**
 * useTopicAvailability — enrichment signals for an AI-topic pathway node.
 *
 * **Not a gate.** Launching a tutor session on a `topicUri` does
 * *not* require the Topic VC to already be in the learner's wallet:
 * `startTopicWithUri` / `startLearningPathway` in the chat store
 * send the URI straight to the AI service over websocket, which
 * resolves-or-creates server-side (the same contract the GrowSkills
 * AI Learning Pathway carousel relies on). Blocking launch on a
 * pre-flight wallet check would put pathway nodes on a stricter
 * footing than every other surface that starts a session.
 *
 * What this hook *is* for: rendering nicer copy when we happen to
 * know the learner has already engaged with this topic. Specifically:
 *
 *   - `hasExistingTopic`: the Topic VC is in the wallet → the CTA
 *     can read **"Continue session"** instead of **"Start session"**.
 *   - `hasPriorSessions`: the learner has at least one session
 *     artifact on that topic → parity with `ExistingAiTopicItem`'s
 *     click-to-resume behavior on `/ai-sessions`.
 *   - `topic`: the enriched record, so callers can surface richer
 *     context (session count, unfinished flag) without a refetch.
 *
 * All fields default to "no, we don't know anything" when `topicUri`
 * is null or the queries haven't resolved — the caller is expected
 * to render the same happy-path CTA in that case and let the chat
 * service be the source of truth on launch.
 *
 * Gated by `enabled: !!topicUri` — calling this on a node without a
 * topicUri is cheap; no network hits at all.
 */

import { useMemo } from 'react';

import { useGetCredentialList, useGetEnrichedTopicsList } from 'learn-card-base';

/**
 * Minimal structural shape of an enriched topic entry. Declared
 * locally (not imported from learn-card-base) to keep this module
 * free of wallet-type imports — the project's workspace-level module
 * resolution for `learn-card-base/types/*` is fragile and we'd
 * rather not propagate that fragility into the pathways module.
 *
 * `sessions` is typed as `unknown[]` because we only care about the
 * cardinality (is the list non-empty?), not the element shape.
 */
interface EnrichedTopic {
    topicRecord?: { uri?: string } | null;
    topicBoost?: { uri?: string } | null;
    topicVc?: unknown;
    sessions?: unknown[];
    hasUnfinishedSessions?: boolean;
}

export interface TopicAvailability {
    /** The topicUri the caller asked about (pass-through for debugging). */
    topicUri: string | null;
    /**
     * `true` once a Topic VC matching `topicUri` is found in the
     * learner's wallet. Advisory only — callers should NOT block
     * launch on this. Used to flip CTA copy from
     * "Start session" → "Continue session".
     */
    hasExistingTopic: boolean;
    /**
     * `true` when the learner has at least one prior session on this
     * topic. Subset of `hasExistingTopic`: you can't have sessions
     * on a topic you don't own. Useful for distinguishing "claimed
     * but never sat down" from "resumable work in progress".
     */
    hasPriorSessions: boolean;
    /**
     * The enriched topic record when matched. Carries session count
     * and unfinished flag for callers that want richer copy.
     */
    topic: EnrichedTopic | null;
    /**
     * True while the underlying wallet queries are in flight. Callers
     * typically do NOT need to render a loading state — the CTA is
     * safe to click either way — but the signal is available for
     * subtle UI choices (e.g. briefly hiding the "Continue" flip
     * while it might still resolve).
     */
    isLoading: boolean;
}

/**
 * Look up enrichment signals for a topic URI. Safe to call with a
 * null / unknown URI — all fields collapse to the happy-path
 * defaults (no existing topic, no prior sessions, not loading).
 */
export const useTopicAvailability = (topicUri: string | null): TopicAvailability => {
    const { data: records, isLoading: credentialsLoading } = useGetCredentialList('AI Topic');

    const topicRecords = useMemo(() => {
        return records?.pages?.flatMap((page: any) => page?.records) || [];
    }, [records?.pages]);

    // Only fire the enrichment query when we actually have a topicUri
    // to check against; otherwise topicRecords could still resolve
    // (cheap) but the enrichment does extra per-record wallet calls
    // we don't want to pay for a no-op.
    const { data: topics, isLoading: topicsLoading } = useGetEnrichedTopicsList(
        topicRecords,
        !!topicUri,
    );

    const match = useMemo<EnrichedTopic | null>(() => {
        if (!topicUri) return null;
        if (!topics) return null;

        const found = (topics as EnrichedTopic[]).find(
            t => t?.topicBoost?.uri === topicUri,
        );

        return found ?? null;
    }, [topicUri, topics]);

    const hasExistingTopic = match !== null;
    const hasPriorSessions = hasExistingTopic && (match?.sessions?.length ?? 0) > 0;

    return {
        topicUri,
        hasExistingTopic,
        hasPriorSessions,
        topic: match,
        isLoading: !!topicUri && (credentialsLoading || topicsLoading),
    };
};
