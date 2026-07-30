/**
 * buildAiSessionSnapshot — derive an `AiSessionSnapshot` from a
 * Topic VC (or equivalent) at bind time.
 *
 * Called at exactly two points:
 *
 *   1. **Author flow.** When an author binds a node to an AI topic in
 *      BuildMode (or a node-picker UI), the setter wraps the
 *      `AiSessionAction` in a snapshot so the persisted pathway
 *      carries enough context for agents to reason about — without a
 *      per-read topic fetch.
 *
 *   2. **Dev / agent flow.** `devSeed`, agent-authored proposals, and
 *      any programmatic authoring that has topic metadata on hand
 *      populate the snapshot inline so the Map/NodeDetail UI doesn't
 *      flash "Loading…" on first render.
 *
 * Keep this module thin. The snapshot shape lives in
 * `types/action.ts:AiSessionSnapshotSchema`; this helper is just the
 * one function that projects a topic into it. UI-driven refresh
 * (topic drift → refresh-proposal) will live in a separate module
 * alongside the agents.
 *
 * Mirrors `buildAppListingSnapshot` in style and contract — read that
 * file for the broader architectural rationale around snapshots.
 */

import type { AiSessionSnapshot } from '../types';

/**
 * Minimal shape we need from a topic to build a snapshot. Declared
 * structurally (not as the wallet's `VC` / `Boost` / `LCR` types) so
 * this module stays free of `@learncard/types` / wallet imports. The
 * shape mirrors the fields `AiSessionsPage` and `GrowSkillsContent`
 * pull out of `topicVc` / `topicBoost` at render time.
 *
 * Every field except `title` is optional. `title` is load-bearing
 * (it's the one field UI always renders), so refusing to snapshot
 * without it is honest: a snapshot with no displayable name would
 * just produce a phantom "Loading…" state.
 */
export interface TopicSnapshotInput {
    /**
     * Topic display title — required. Typically sourced from
     * `topicVc?.boostCredential?.topicInfo?.title`.
     */
    title: string;
    /**
     * Long-form description. Source typically
     * `topicVc?.boostCredential?.topicInfo?.description`.
     */
    description?: string;
    /**
     * Skills the topic asserts coverage over. Distinct from generic
     * semantic tags — these are the concrete capability names agents
     * can match against learner goals.
     */
    skills?: readonly string[];
    /**
     * Topic icon URL. Empty string and absent treated the same way
     * (omitted from the snapshot) so callers can pass through the
     * raw wallet field without defensive ternaries.
     */
    iconUrl?: string;
}

export interface BuildAiSessionSnapshotOptions {
    /**
     * ISO timestamp to stamp on `snapshottedAt`. Injectable for
     * deterministic tests and for seed scripts that author pathways
     * at a known "now".
     */
    now?: string;
}

/**
 * Project a topic into an `AiSessionSnapshot`.
 *
 * Returns `null` when the topic lacks a display title — we refuse to
 * produce a half-built snapshot. Callers upstream treat `null` as
 * "skip the snapshot; let the UI fall back to a live topic fetch".
 *
 * Normalization rules (matched to `buildAppListingSnapshot`):
 *   - Empty strings are treated as absent; they never make it into
 *     the snapshot.
 *   - `skills` is copied into a fresh array so the returned object
 *     is not aliased to the caller's topic.
 *   - `iconUrl` is only retained when non-empty after trimming.
 *     (Zod's `.url()` validator would reject empty strings anyway,
 *     but filtering here gives cleaner JSON.)
 */
export const buildAiSessionSnapshot = (
    topic: TopicSnapshotInput,
    opts: BuildAiSessionSnapshotOptions = {},
): AiSessionSnapshot | null => {
    const topicTitle = topic.title?.trim();

    if (!topicTitle) return null;

    const topicDescription = topic.description?.trim() || undefined;
    const iconUrl = topic.iconUrl?.trim() || undefined;

    const skills =
        topic.skills && topic.skills.length > 0
            ? [...topic.skills]
            : undefined;

    const snapshottedAt = opts.now ?? new Date().toISOString();

    return {
        topicTitle,
        ...(topicDescription ? { topicDescription } : {}),
        ...(skills ? { skills } : {}),
        ...(iconUrl ? { iconUrl } : {}),
        snapshottedAt,
    };
};
