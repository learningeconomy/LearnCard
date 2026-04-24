/**
 * usePathwayProgressForCredential — the React hook every claim
 * surface uses to decide whether to show a "this advanced your
 * pathway" affordance after a successful claim.
 *
 * ## Contract
 *
 * Given a credential URI (usually the URI returned by the claim
 * mutation), the hook returns:
 *
 *   - `affected`: the list of `(pathway, node)` tuples whose
 *     terminations this credential satisfied. Each entry carries
 *     the human-readable title of both so the caller can render
 *     copy without another lookup.
 *   - `isReady`: true once the reactor has processed the matching
 *     event. Starts false; flips to true either synchronously (if
 *     the dispatch happened before the hook mounted) or reactively
 *     when a matching dispatch arrives.
 *
 * The hook is deliberately *per-credential*. A page that shows
 * "after this claim" UI has one credential in play; a page that
 * wants to show "across the last N claims" can compose several.
 * Scoping to a single credentialUri keeps dedup trivial (react to
 * the first matching dispatch and ignore later ones).
 *
 * ## Why not just read `lastDispatch()` once?
 *
 * Because the claim mutation's `onSuccess` is asynchronous, the
 * `useAddCredentialToWallet.onSuccess` handler publishes the event
 * after the mutation resolves — which typically happens one tick
 * *after* the component has re-rendered with the new credential
 * URI. The hook subscribes to dispatches to catch that window.
 *
 * We also read the reactor's history on mount so pre-mount
 * dispatches (hot-reload, route transitions) still surface.
 */

import { useEffect, useMemo, useState } from 'react';

import { pathwayStore } from '../../../stores/pathways';

import {
    pathwayProgressReactor,
    type PathwayProgressReactor,
    type ProgressDispatchRecord,
} from './pathwayProgressReactor';

// ---------------------------------------------------------------------------
// Result shape
// ---------------------------------------------------------------------------

export interface AffectedNode {
    pathwayId: string;
    pathwayTitle: string;
    nodeId: string;
    nodeTitle: string;
    /**
     * Whether the completion proposal was auto-accepted. When the
     * future review surface lands we may surface a "review" CTA for
     * un-accepted entries; today every dispatch is auto-accepted so
     * this is nearly always true.
     */
    accepted: boolean;
}

export interface AffectedOutcome {
    pathwayId: string;
    pathwayTitle: string;
    outcomeId: string;
    outcomeLabel: string;
    accepted: boolean;
}

export interface PathwayProgressForCredential {
    /**
     * True once the reactor has finished processing the event for
     * this credential URI (or if no matching event arrives within
     * the hook's lifetime). Use it to hold a loading state on the
     * CTA — a brief "Checking your pathways…" beat feels better
     * than a flicker from "claimed" → "claimed, and it advanced X".
     */
    isReady: boolean;
    /**
     * True when `isReady` flips and at least one node or outcome
     * was advanced. The render pipeline's common case is to
     * early-return when this is false.
     */
    hasProgress: boolean;
    affectedNodes: AffectedNode[];
    affectedOutcomes: AffectedOutcome[];
    /**
     * The raw dispatch record (for power users / analytics).
     * Prefer the named fields above for UX.
     */
    dispatch: ProgressDispatchRecord | null;
}

// ---------------------------------------------------------------------------
// Helpers — pure projection from a dispatch record into `AffectedNode`s.
// ---------------------------------------------------------------------------

const projectDispatch = (
    dispatch: ProgressDispatchRecord,
    pathways: Record<string, { title: string; nodes: Array<{ id: string; title: string }>; outcomes?: Array<{ id: string; label: string }> }>,
): {
    affectedNodes: AffectedNode[];
    affectedOutcomes: AffectedOutcome[];
} => {
    const affectedNodes: AffectedNode[] = [];
    const affectedOutcomes: AffectedOutcome[] = [];

    for (const entry of dispatch.nodeCompletions) {
        const pathway = pathways[entry.pathwayId];

        if (!pathway) continue;

        const node = pathway.nodes.find(n => n.id === entry.nodeId);

        if (!node) continue;

        affectedNodes.push({
            pathwayId: entry.pathwayId,
            pathwayTitle: pathway.title,
            nodeId: entry.nodeId,
            nodeTitle: node.title,
            accepted: entry.accepted,
        });
    }

    for (const entry of dispatch.outcomeBindings ?? []) {
        const pathway = pathways[entry.pathwayId];

        if (!pathway) continue;

        const outcome = pathway.outcomes?.find(o => o.id === entry.outcomeId);

        affectedOutcomes.push({
            pathwayId: entry.pathwayId,
            pathwayTitle: pathway.title,
            outcomeId: entry.outcomeId,
            outcomeLabel: outcome?.label ?? 'Outcome bound',
            accepted: entry.accepted,
        });
    }

    return { affectedNodes, affectedOutcomes };
};

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export interface UsePathwayProgressOptions {
    /** Reactor instance. Defaults to the app-level singleton. */
    reactor?: PathwayProgressReactor;
    /**
     * Timeout in ms after which `isReady` is forced to `true` even
     * if no dispatch has arrived. Prevents the CTA from sitting in
     * a "checking…" state forever if the credential happened to
     * match zero nodes. Defaults to 3 seconds.
     */
    waitMs?: number;
}

export const usePathwayProgressForCredential = (
    credentialUri: string | null | undefined,
    options: UsePathwayProgressOptions = {},
): PathwayProgressForCredential => {
    const reactor = options.reactor ?? pathwayProgressReactor;
    const waitMs = options.waitMs ?? 3000;

    const [dispatch, setDispatch] = useState<ProgressDispatchRecord | null>(
        () => {
            if (!credentialUri) return null;

            // Check for a pre-mount dispatch — a claim that published
            // before this hook mounted (mount-order rarely matters,
            // but the reactor's ingest race with the component's
            // render cycle makes it non-trivial; we catch both paths).
            const recent = reactor.recentDispatches();

            for (let i = recent.length - 1; i >= 0; i--) {
                const candidate = recent[i];

                if (candidate.credentialUri === credentialUri) {
                    return candidate;
                }
            }

            return null;
        },
    );

    const [timedOut, setTimedOut] = useState(false);

    useEffect(() => {
        if (!credentialUri) return;
        if (dispatch) return;

        const unsubscribe = reactor.subscribe(record => {
            if (record.credentialUri !== credentialUri) return;

            setDispatch(record);
        });

        const timer = setTimeout(() => setTimedOut(true), waitMs);

        return () => {
            unsubscribe();
            clearTimeout(timer);
        };
    }, [credentialUri, dispatch, reactor, waitMs]);

    // Pull pathway metadata snapshots (title, node titles) on every
    // render. Cheap — zustood selectors are reference-stable — and
    // avoids stale copy when a pathway renames mid-session.
    const pathways = pathwayStore.use.pathways();

    const projected = useMemo(() => {
        if (!dispatch) {
            return { affectedNodes: [], affectedOutcomes: [] };
        }

        return projectDispatch(dispatch, pathways);
    }, [dispatch, pathways]);

    const isReady = dispatch !== null || timedOut || !credentialUri;

    const hasProgress =
        projected.affectedNodes.length > 0
        || projected.affectedOutcomes.length > 0;

    return {
        isReady,
        hasProgress,
        affectedNodes: projected.affectedNodes,
        affectedOutcomes: projected.affectedOutcomes,
        dispatch,
    };
};
