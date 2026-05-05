/**
 * pathwayStore — the active pathway graph.
 *
 * Phase 0: stubbed with mock data. Learner-initiated mutations are direct;
 * agent-initiated changes go through `proposalStore` → `applyProposal` (docs § 7).
 */

import { createStore } from '@udecode/zustood';

import {
    computePathwayProgress,
    findParentPathway,
    rollupCompositeProgress,
} from '../../pages/pathways/core/composition';
import type { Evidence, Pathway, PathwayNode } from '../../pages/pathways/types';

interface RecentCompletion {
    nodeId: string;
    pathwayId: string;
    title: string;
    /** ISO timestamp of when the node flipped to `completed`. */
    completedAt: string;
}

/**
 * Discriminated signal for "a pathway (or sub-pathway) just hit
 * its destination for the first time." Distinct from
 * `recentCompletion` (which is node-only) so the existing Today
 * banner keeps reading "a step just finished" while the
 * `CompletionRoot` shell component reads "a journey just
 * finished" off this field.
 *
 *   - `kind: 'pathway'` — a top-level (root) pathway. Triggers
 *     the Tier 2 fullscreen ceremony.
 *   - `kind: 'sub-pathway'` — a pathway embedded as a composite
 *     reference inside another pathway the learner is still
 *     subscribed to. Triggers the Tier 1 inline ceremony.
 *     `parentPathwayId` is the embedding parent so the ceremony
 *     can render the chain-effect ("Unlocked the next step in
 *     <Parent>").
 *
 * Coalescing rule: if a sub-pathway completion also completes
 * its parent (the sub-pathway *was* the parent's last step), we
 * emit only `kind: 'pathway'` for the root — the bigger ceremony
 * subsumes the smaller. The detection logic in `rollupInDraft`
 * implements this by preferring root-level entries when both
 * fired in the same rollup pass.
 */
export type PathwayCelebration =
    | {
          kind: 'pathway';
          pathwayId: string;
          /** ISO timestamp of when the pathway hit destinationCompleted. */
          completedAt: string;
      }
    | {
          kind: 'sub-pathway';
          pathwayId: string;
          parentPathwayId: string;
          completedAt: string;
      };

interface PathwayStoreState {
    pathways: Record<string, Pathway>;
    activePathwayId: string | null;
    /**
     * Fire-and-forget signal set by `completeTermination` and read by
     * Today's completion banner. Kept on the store (not component state)
     * because NodeDetail navigates away, unmounting Today — so we need a
     * survive-navigation record of "a node just completed".
     */
    recentCompletion: RecentCompletion | null;
    /**
     * Fire-and-forget signal for "a journey just finished." Mounted
     * at shell level by `CompletionRoot`. Set by the rollup detection
     * inside `rollupInDraft` whenever a pathway transitions into
     * `destinationCompleted` for the first time. Cleared by the
     * ceremony's dismiss action; rewatchable via `replayCelebration`
     * which clears `pathway.celebratedAt` and re-emits.
     */
    recentCelebration: PathwayCelebration | null;
}

const initialState: PathwayStoreState = {
    pathways: {},
    activePathwayId: null,
    recentCompletion: null,
    recentCelebration: null,
};

/**
 * Composite progress rollup — re-run after every mutation that can
 * affect node completion. The helper is idempotent and returns the
 * same identity when no composite flip is needed, so calling it
 * unconditionally is cheap in the common case (no composite nodes,
 * or no nested pathway just finished).
 *
 * It's wired into `upsertPathway`, `editNode`, and
 * `completeTermination` because those are the only actions that can
 * either (a) change a node's completion status or (b) introduce a
 * new composite node whose nested pathway is already complete.
 * `removePathway` / `setActivePathway` / `clearRecentCompletion`
 * can't affect rollup and are left untouched.
 *
 * Inlined into each action's `set.state` callback so observers see
 * the primary mutation and the rollup as a single committed state,
 * never an interstitial "parent not yet rolled up" flash.
 */
/**
 * Snapshot the set of pathways that have already hit their
 * destination *right now*. Callers use this **before** entering a
 * `set.state` callback so the resulting set captures the pre-
 * mutation state — `rollupInDraft` then uses it to detect "this
 * pathway just transitioned from incomplete to complete".
 *
 * Computing this *inside* `rollupInDraft` against the same draft
 * the action has already mutated would be incorrect: by the time
 * `completeTermination` calls into the rollup, the destination
 * node has already been flipped to `completed` in the draft, so
 * the "before" snapshot would already contain that pathway and
 * the transition would be invisible — no ceremony fires.
 */
export const snapshotCompletedPathways = (
    pathways: Record<string, Pathway>,
): ReadonlySet<string> => {
    const set = new Set<string>();

    for (const [id, pathway] of Object.entries(pathways)) {
        if (computePathwayProgress(pathway).destinationCompleted) {
            set.add(id);
        }
    }

    return set;
};

const rollupInDraft = (
    draft: PathwayStoreState,
    completedBefore: ReadonlySet<string>,
): void => {
    const rolled = rollupCompositeProgress(draft.pathways);

    // Identity-preserving fast path: when nothing flipped, skip the
    // assignment so Immer doesn't allocate a new pathways record.
    // (Pathway-level destination flips also happen via direct
    // `completeTermination` on the destination node — that path
    // doesn't change `pathways` identity through rollup, but the
    // `before` snapshot above captures the pre-mutation state from
    // the immer draft pre-action, which is what we want.)
    if (rolled !== draft.pathways) {
        draft.pathways = rolled;
    }

    // Detect newly-completed pathways. A pathway transitions into a
    // celebration when:
    //   1. its destination is now completed, AND
    //   2. it wasn't completed before this mutation, AND
    //   3. no `celebratedAt` is set (idempotency guard against
    //      re-firing on hot-reload, hydration, or chained mutations).
    const newlyCompleted: string[] = [];

    for (const [id, pathway] of Object.entries(draft.pathways)) {
        const isNowCompleted =
            computePathwayProgress(pathway).destinationCompleted;

        if (!isNowCompleted) continue;
        if (completedBefore.has(id)) continue;
        if (pathway.celebratedAt) continue;

        newlyCompleted.push(id);
    }

    if (newlyCompleted.length === 0) return;

    // Mark every newly-completed pathway as celebrated *now* so we
    // don't re-fire on the next rollup. This happens regardless of
    // which one we choose to render — the others still need their
    // `celebratedAt` stamped so a subsequent unrelated mutation
    // doesn't think they're brand new.
    const now = new Date().toISOString();

    for (const id of newlyCompleted) {
        draft.pathways[id].celebratedAt = now;
    }

    // Coalescing: if both a sub-pathway and its top-level ancestor
    // newly completed in this rollup pass, we want a single Tier 2
    // ceremony for the ancestor — not Tier 1 then Tier 2 back-to-
    // back. Pick a root (no parent) if any newly-completed entry is
    // root-level; else fall back to the first sub-pathway.
    //
    // `findParentPathway` reads the post-rollup map so it sees the
    // current parent-child topology. A pathway whose parent is also
    // in `newlyCompleted` is necessarily a sub-pathway under that
    // parent, and the parent will be picked first by this loop —
    // so the sub-pathway gets stamped (no re-fire) but no ceremony.
    let chosenId: string | null = null;

    for (const id of newlyCompleted) {
        if (!findParentPathway(draft.pathways, id)) {
            chosenId = id;
            break;
        }
    }

    if (!chosenId) {
        chosenId = newlyCompleted[0];
    }

    const parent = findParentPathway(draft.pathways, chosenId);

    draft.recentCelebration = parent
        ? {
              kind: 'sub-pathway',
              pathwayId: chosenId,
              parentPathwayId: parent.id,
              completedAt: now,
          }
        : {
              kind: 'pathway',
              pathwayId: chosenId,
              completedAt: now,
          };
};

export const pathwayStore = createStore('pathwayStore')<PathwayStoreState>(
    initialState,
    // Persistence enabled so pathway graph + progress survive navigation
    // away from the app (e.g. learner taps a claim link and bounces
    // through an external issuer page). Without this, every round-trip
    // wipes the in-memory pathway state, and the reactor's
    // `credential-ingested` dispatch on return fires against an empty
    // store — silent no-op, no CTA modal, no node completion.
    //
    // Storage is zustood's default (localStorage) keyed by the `name`.
    // That's fine: the shape is small, pathways are per-tenant, and
    // the sync helpers already tolerate stale cached entries via
    // `proposalStore.invalidateStale` on reconnect.
    { persist: { name: 'pathwayStore', enabled: true } },
).extendActions(set => ({
    setActivePathway: (pathwayId: string | null) => {
        set.activePathwayId(pathwayId);
    },

    upsertPathway: (pathway: Pathway) => {
        // Snapshot pre-mutation completion set BEFORE entering the
        // immer draft. See `snapshotCompletedPathways` for why.
        const completedBefore = snapshotCompletedPathways(
            pathwayStore.get.pathways(),
        );

        set.state(draft => {
            draft.pathways[pathway.id] = pathway;

            if (draft.activePathwayId === null) {
                draft.activePathwayId = pathway.id;
            }

            // Composite rollup: if this upsert introduces a composite
            // node whose nested pathway is already complete, flip the
            // parent to completed so dependents can unblock.
            rollupInDraft(draft, completedBefore);
        });
    },

    /**
     * Remove a subscribed pathway, **cascading to orphaned
     * sub-pathways**.
     *
     * "Sub-pathway" here means a pathway transitively reachable from
     * `pathwayId` via composite-policy node refs. When the learner
     * removes a parent journey, leaving its sub-pathways behind would
     * litter the switcher with dangling fragments the learner never
     * subscribed to directly (they only exist because the parent
     * embedded them).
     *
     * **Orphan-only cascade**: a sub-pathway that's *also* embedded
     * by a sibling parent the learner still subscribes to is **kept**.
     * The cascade only deletes pathways that have no remaining root
     * outside the removal subtree — anything else would silently rip
     * data out from under another active journey.
     *
     * No `rollupCompositeProgress` call: removing pathways can't
     * flip a composite node from `not-completed` → `completed`
     * (the rollup is monotonic upward), and any parent referencing
     * a now-deleted child correctly stays un-rolled-up. If we later
     * want to surface "this composite node points at a missing
     * pathway" UI, that's a render-time concern, not a store one.
     */
    removePathway: (pathwayId: string) => {
        set.state(draft => {
            // Walk the composite-ref graph from `pathwayId` outward
            // to gather the candidate-removal subtree. BFS keeps
            // each pathway's expansion shallow and the visited set
            // guards against accidental cycles in stale data
            // (author-time validation rejects cycles, but we don't
            // want a corrupt import to lock the store up).
            const subtree = new Set<string>([pathwayId]);
            const queue: string[] = [pathwayId];

            while (queue.length > 0) {
                const id = queue.shift() as string;
                const p = draft.pathways[id];

                if (!p) continue;

                for (const node of p.nodes) {
                    if (node.stage.policy.kind !== 'composite') continue;

                    const childId = node.stage.policy.pathwayRef;

                    if (subtree.has(childId)) continue;

                    subtree.add(childId);
                    queue.push(childId);
                }
            }

            // Filter the subtree down to actually-orphaned pathways.
            // The root itself is always removed (the learner asked
            // for it). Each descendant is removed only if no
            // pathway *outside* the subtree still references it.
            const toDelete = new Set<string>([pathwayId]);

            for (const descId of subtree) {
                if (descId === pathwayId) continue;

                let externallyReferenced = false;

                for (const [otherId, other] of Object.entries(draft.pathways)) {
                    if (subtree.has(otherId)) continue;

                    for (const node of other.nodes) {
                        if (
                            node.stage.policy.kind === 'composite'
                            && node.stage.policy.pathwayRef === descId
                        ) {
                            externallyReferenced = true;
                            break;
                        }
                    }

                    if (externallyReferenced) break;
                }

                if (!externallyReferenced) toDelete.add(descId);
            }

            for (const id of toDelete) {
                delete draft.pathways[id];
            }

            // Clear the active pointer if it pointed at anything we
            // just removed (root or cascaded child) — otherwise the
            // shell would keep trying to render a now-gone pathway.
            if (
                draft.activePathwayId !== null
                && toDelete.has(draft.activePathwayId)
            ) {
                draft.activePathwayId = null;
            }
        });
    },

    /**
     * Learner-initiated edit. Agent edits must go through `applyProposal`.
     *
     * Bumps `pathway.revision` and `pathway.updatedAt` together — every
     * mutation path must participate in the CAS hinge the future
     * server-side optimistic-concurrency write will key off of. `?? 0`
     * tolerates legacy shapes that pre-date the field.
     */
    editNode: (pathwayId: string, nodeId: string, patch: Partial<PathwayNode>) => {
        // Snapshot pre-mutation completion set so the rollup can
        // detect a transition if this edit happens to flip a
        // node's `progress.status` directly to `completed`.
        const completedBefore = snapshotCompletedPathways(
            pathwayStore.get.pathways(),
        );

        set.state(draft => {
            const pathway = draft.pathways[pathwayId];

            if (!pathway) return;

            const node = pathway.nodes.find(n => n.id === nodeId);

            if (!node) return;

            const now = new Date().toISOString();

            Object.assign(node, patch, { updatedAt: now });
            pathway.updatedAt = now;
            pathway.revision = (pathway.revision ?? 0) + 1;

            // Edits can flip progress.status directly; re-roll.
            rollupInDraft(draft, completedBefore);
        });
    },

    completeTermination: (pathwayId: string, nodeId: string, evidence: Evidence[]) => {
        // Capture the set of already-completed pathways from the
        // committed store BEFORE we mutate the draft. The rollup
        // detector compares against this snapshot to decide which
        // pathways newly transitioned to complete on this action —
        // and thus which (if any) earn a ceremony. Computing it
        // from the draft post-mutation would mask the transition.
        const completedBefore = snapshotCompletedPathways(
            pathwayStore.get.pathways(),
        );

        set.state(draft => {
            const pathway = draft.pathways[pathwayId];

            if (!pathway) return;

            const node = pathway.nodes.find(n => n.id === nodeId);

            if (!node) return;

            const wasAlreadyCompleted = node.progress.status === 'completed';
            const now = new Date().toISOString();

            node.progress.status = 'completed';
            node.progress.artifacts = [...node.progress.artifacts, ...evidence];
            node.progress.completedAt = now;
            node.updatedAt = now;
            pathway.updatedAt = now;
            // Completion is a mutation; bump revision so server-side
            // CAS writes see the change. Skipping the bump when the
            // node was already completed would be a nice purity win
            // but complicates the UX contract — the evidence array
            // still grew, so the revision should move.
            pathway.revision = (pathway.revision ?? 0) + 1;

            // Only emit the completion signal on the real transition —
            // re-calls on an already-completed node shouldn't retrigger
            // Today's banner.
            if (!wasAlreadyCompleted) {
                draft.recentCompletion = {
                    nodeId: node.id,
                    pathwayId: pathway.id,
                    title: node.title,
                    completedAt: now,
                };
            }

            // Completing a destination node can cascade up through one
            // or more composite references in other pathways.
            rollupInDraft(draft, completedBefore);
        });
    },

    clearRecentCompletion: () => {
        set.recentCompletion(null);
    },

    /**
     * Dismiss the ceremony banner without un-celebrating the
     * pathway. The `pathway.celebratedAt` stays set so we won't
     * re-fire the ceremony spontaneously — but the learner can
     * always replay it via `replayCelebration`.
     */
    dismissCelebration: () => {
        set.recentCelebration(null);
    },

    /**
     * Re-emit the ceremony for an already-celebrated pathway. Used
     * by the "View ceremony" affordance on completed pathways in
     * the switcher / Map. Clears `celebratedAt` so the rollup
     * detection treats the next destination check as a fresh
     * transition; without this clear, the idempotency guard would
     * suppress the replay.
     *
     * No-op if the pathway isn't loaded or isn't actually
     * completed (defensive — the UI should hide the affordance in
     * those cases, but a state desync shouldn't crash the store).
     */
    replayCelebration: (pathwayId: string) => {
        set.state(draft => {
            const pathway = draft.pathways[pathwayId];

            if (!pathway) return;
            if (!computePathwayProgress(pathway).destinationCompleted) return;

            // Clear the bookkeeping flag so the rollup-driven
            // detection doesn't see this as already-celebrated.
            // We *don't* re-run rollup here; instead we synthesize
            // the celebration directly because rollup's
            // `before/after` snapshot would correctly see the
            // pathway as already-completed in both states.
            pathway.celebratedAt = undefined;

            const parent = findParentPathway(draft.pathways, pathwayId);
            const now = new Date().toISOString();

            // Stamp celebratedAt back on so subsequent rollups
            // don't re-fire on top of the manual replay.
            pathway.celebratedAt = now;

            draft.recentCelebration = parent
                ? {
                      kind: 'sub-pathway',
                      pathwayId,
                      parentPathwayId: parent.id,
                      completedAt: now,
                  }
                : {
                      kind: 'pathway',
                      pathwayId,
                      completedAt: now,
                  };
        });
    },

    /**
     * **Demo / dev only.** Synthesize a celebration for a pathway
     * regardless of its completion state.
     *
     * Distinct from `replayCelebration` (which is the user-facing
     * "View ceremony" affordance and gates on
     * `destinationCompleted` so we never claim a journey is over
     * when it isn't). This bypasses the gate so the Debug Widget
     * can fire the Tier 1 / Tier 2 ceremony against a freshly-
     * seeded pathway for screenshots and screencasts without the
     * tester first having to grind through every node.
     *
     * No-op if the pathway isn't loaded. Marks `celebratedAt` so
     * the rollup detector won't *also* fire its own celebration if
     * the pathway later actually completes — the debug fire is
     * still the canonical "you celebrated this" record.
     */
    forceCelebration: (pathwayId: string) => {
        set.state(draft => {
            const pathway = draft.pathways[pathwayId];

            if (!pathway) return;

            const parent = findParentPathway(draft.pathways, pathwayId);
            const now = new Date().toISOString();

            pathway.celebratedAt = now;

            draft.recentCelebration = parent
                ? {
                      kind: 'sub-pathway',
                      pathwayId,
                      parentPathwayId: parent.id,
                      completedAt: now,
                  }
                : {
                      kind: 'pathway',
                      pathwayId,
                      completedAt: now,
                  };
        });
    },

    /**
     * Persist the learner's reflection answer ("In a sentence — what
     * did this become for you?") onto the pathway so completed-state
     * surfaces (Map banner, switcher quote) can render it.
     *
     * Empty / whitespace-only input clears any existing reflection
     * — treating that as an intent to undo, not as overwriting with
     * an empty string. The Tier 2 ceremony's submit button is
     * disabled on empty input anyway, but we tolerate it here as
     * the documented "remove" path.
     */
    recordReflection: (pathwayId: string, reflection: string) => {
        set.state(draft => {
            const pathway = draft.pathways[pathwayId];

            if (!pathway) return;

            const trimmed = reflection.trim();
            const now = new Date().toISOString();

            pathway.completionReflection = trimmed.length > 0 ? trimmed : undefined;
            pathway.updatedAt = now;
            pathway.revision = (pathway.revision ?? 0) + 1;
        });
    },
})).extendSelectors((state, get) => ({
    activePathway: (): Pathway | null => {
        const id = get.activePathwayId();

        return id ? get.pathways()[id] ?? null : null;
    },

    getNode: (pathwayId: string, nodeId: string): PathwayNode | null => {
        const pathway = get.pathways()[pathwayId];

        return pathway?.nodes.find(n => n.id === nodeId) ?? null;
    },
}));

export default pathwayStore;
