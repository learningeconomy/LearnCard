/**
 * pathwayProgressReactor — the seam between "something happened in
 * the wallet" and "the pathway just advanced".
 *
 * ## Responsibilities
 *
 * The reactor is the single consumer of the `walletEventBus`. It:
 *
 *   1. Subscribes to the bus.
 *   2. For each event, reads the learner's active pathways from the
 *      pathway store and invokes `nodeProgressBinder` + the pathway-
 *      level `credentialBinder` (for `credential-ingested` events).
 *   3. Writes resulting proposals into the proposal store.
 *   4. Auto-accepts proposals (v0.5 default; see "Trust policy"
 *      below for how that's gated).
 *   5. Publishes a lightweight `lastDispatch` record so UX surfaces
 *      (post-claim CTAs) can observe what happened without re-running
 *      the binder.
 *
 * ## Why a reactor and not inline dispatch
 *
 * The bus fans events out to any listener — analytics, dev tools,
 * cross-tab adapters, etc. The reactor is only one consumer, even
 * though today it's the most important. Keeping it as a standalone
 * listener means:
 *
 *   - Claim surfaces publish once and know nothing about pathways.
 *   - New consumers (future offline-queue, server mirror) register
 *     the same way without coupling into the reactor.
 *   - Tests can drive the reactor directly with `processEvent(event)`
 *     without hooking the bus at all.
 *
 * ## Trust policy
 *
 * `nodeProgressBinder` already enforces the trust-tier gate on
 * `requirement-satisfied` matches and the duration gate on
 * `session-completed` matches. Proposals emitted here have therefore
 * already cleared the data-level policy checks.
 *
 * For v0.5 the reactor auto-accepts each proposal it emits: there's
 * no "review pending completions" surface yet, and the binder's
 * gates are conservative enough that auto-accept is safe. When the
 * review surface lands, flip `autoAcceptCredential` to `false` (the
 * AI-session path should stay auto-accept — first-party events
 * don't need learner review).
 *
 * ## Reentrancy
 *
 * `acceptProposal` mutates `pathwayStore`, which might *also* emit
 * events if we later wire a store → bus bridge. The reactor captures
 * the incoming event and the pathway snapshot at the start of
 * `processEvent`, so a store mutation triggered by its own work
 * cannot feed back into the same pass.
 */

import { pathwayStore, proposalStore } from '../../../stores/pathways';
import {
    bindCredentialToOutcomes,
} from '../agents/credentialBinder';
import {
    bindEventToNodes,
    type NodeBindResult,
} from '../agents/nodeProgressBinder';
import type { IssuerTrustRegistry, VcLike } from '../core/outcomeMatcher';
import { applyProposal } from '../proposals/applyProposal';
import type {
    AiSessionCompletedEvent,
    CredentialIngestedEvent,
    Pathway,
    Proposal,
    WalletEvent,
} from '../types';

import type { WalletEventBus } from './walletEventBus';
import { walletEventBus as defaultBus } from './walletEventBus';

// ---------------------------------------------------------------------------
// Dispatch record
// ---------------------------------------------------------------------------

/**
 * Lightweight summary of what a single event caused. Consumed by UX
 * hooks (`usePathwayProgressForCredential`) to decide whether to
 * show a "this advanced your pathway" CTA without re-running
 * matching logic.
 *
 * Retained only in-memory — no persistence; a page reload clears the
 * log and surfaces that care about post-claim CTAs must read it
 * immediately after the publishing action.
 */
export interface ProgressDispatchRecord {
    /** The event id that produced this dispatch. */
    eventId: string;
    /** The `WalletEvent.kind` at the time of dispatch. */
    eventKind: WalletEvent['kind'];
    /** ISO timestamp of dispatch. */
    dispatchedAt: string;
    /**
     * For `credential-ingested` events, the canonical credential
     * URI that drove the dispatch. UX hooks key off this to
     * correlate a just-completed claim mutation with the reactor's
     * downstream work without needing to know the eventId.
     */
    credentialUri?: string;
    /**
     * For `ai-session-completed` events, the chat thread and (when
     * set) the topic URI the session ran against. Mirrors
     * `credentialUri` in purpose — a hook that wants to decide
     * "did this just-finished session advance anything?" reads
     * these rather than the full event body.
     */
    threadId?: string;
    topicUri?: string;
    /**
     * The proposal ids emitted by the node binder, paired with the
     * `(pathwayId, nodeId)` they targeted. Tags `accepted` so the UI
     * can distinguish "committed" from "waiting on learner" when the
     * review surface lands.
     */
    nodeCompletions: Array<{
        proposalId: string;
        pathwayId: string;
        nodeId: string;
        accepted: boolean;
    }>;
    /**
     * For `credential-ingested` events only — the outcome bindings
     * that the pathway-level binder also emitted. Carried separately
     * because the UX semantics differ (outcome bindings are
     * pathway-global; node completions are a step on a pathway).
     */
    outcomeBindings?: Array<{
        proposalId: string;
        pathwayId: string;
        outcomeId: string;
        accepted: boolean;
    }>;
}

/** Subscriber signature for `PathwayProgressReactor.subscribe`. */
export type DispatchListener = (record: ProgressDispatchRecord) => void;

// ---------------------------------------------------------------------------
// Reactor options
// ---------------------------------------------------------------------------

export interface PathwayProgressReactorOptions {
    /** Event bus to subscribe to. Defaults to the singleton. */
    bus?: WalletEventBus;
    /**
     * When true (default), the reactor auto-accepts each proposal
     * emitted by the node binder for credential events. Flip to
     * `false` once the review surface exists so the learner confirms.
     */
    autoAcceptCredential?: boolean;
    /**
     * When true (default), the reactor auto-accepts each proposal
     * emitted by the node binder for AI-session events. First-party
     * events stay auto-accept even after the credential review
     * surface lands.
     */
    autoAcceptSession?: boolean;
    /**
     * When true (default), auto-accept outcome-binding proposals
     * from the pathway-level credentialBinder too. Safe — binder
     * already enforces the tier gate.
     */
    autoAcceptOutcome?: boolean;
    /**
     * Issuer trust registry handed to both binders. Most deployments
     * leave it blank (classifyIssuerTrust defaults to `trusted`);
     * enterprise tenants wire a real registry in here.
     */
    trustRegistry?: IssuerTrustRegistry;
    /**
     * Observer hook. Called *after* the proposals have been written
     * (and possibly auto-accepted). Used by the UI hooks to learn
     * about dispatches without re-running the binder.
     */
    onDispatch?: (record: ProgressDispatchRecord) => void;
    /**
     * Max records to retain for late-mounting UI observers.
     * `lastDispatch()` returns the newest; `recentDispatches()`
     * returns the window in insertion order.
     */
    dispatchHistoryLimit?: number;
    /**
     * Injectable clock for tests. Defaults to
     * `() => new Date().toISOString()`.
     */
    now?: () => string;
}

// ---------------------------------------------------------------------------
// Core factory
// ---------------------------------------------------------------------------

export interface PathwayProgressReactor {
    /**
     * Subscribe to the bus; returns the unsubscribe function. Safe to
     * call multiple times; each call starts an independent listener.
     * The usual pattern is a single `mount()` at app shell init.
     *
     * `replay: true` makes the reactor pull the bus's recent-event
     * buffer on mount, so claims that fired during app boot (before
     * this listener registered) still flow through the pipeline.
     */
    mount: () => () => void;
    /** Drive the reactor directly (tests, cold-start replay, debug tools). */
    processEvent: (event: WalletEvent) => ProgressDispatchRecord | null;
    /**
     * Most recent dispatch record, or null. UX hooks tend to read
     * this synchronously in response to a known-just-published event.
     */
    lastDispatch: () => ProgressDispatchRecord | null;
    /** Snapshot of the recent dispatch window, oldest first. */
    recentDispatches: () => readonly ProgressDispatchRecord[];
    /**
     * Subscribe to every dispatch the reactor records. Returns the
     * unsubscribe function. React hooks use this to drive
     * `useSyncExternalStore` — we can't use the bus itself for that
     * because the bus fires *before* the reactor finishes processing,
     * and we want hooks to react to the post-processing record (which
     * knows which pathways actually advanced).
     */
    subscribe: (listener: DispatchListener) => () => void;
    /** Test helper — clear dispatch memory without touching the stores. */
    resetDispatchHistory: () => void;
}

export const createPathwayProgressReactor = (
    options: PathwayProgressReactorOptions = {},
): PathwayProgressReactor => {
    const bus = options.bus ?? defaultBus;
    const autoAcceptCredential = options.autoAcceptCredential ?? true;
    const autoAcceptSession = options.autoAcceptSession ?? true;
    const autoAcceptOutcome = options.autoAcceptOutcome ?? true;
    const onDispatch = options.onDispatch;
    const dispatchHistoryLimit = options.dispatchHistoryLimit ?? 32;
    const now = options.now ?? (() => new Date().toISOString());

    const history: ProgressDispatchRecord[] = [];
    const subscribers = new Set<DispatchListener>();

    const rememberDispatch = (record: ProgressDispatchRecord): void => {
        history.push(record);

        while (history.length > dispatchHistoryLimit) history.shift();

        // `onDispatch` option runs first (reactor-owned telemetry);
        // then fan out to external subscribers. Snapshot the subscriber
        // set so a listener that unsubscribes during its own callback
        // doesn't skip siblings — mirrors the walletEventBus pattern.
        try {
            onDispatch?.(record);
        } catch (err) {
            // eslint-disable-next-line no-console
            console.error('[pathwayProgressReactor] onDispatch threw:', err);
        }

        for (const listener of Array.from(subscribers)) {
            try {
                listener(record);
            } catch (err) {
                // eslint-disable-next-line no-console
                console.error(
                    '[pathwayProgressReactor] subscribe listener threw:',
                    err,
                );
            }
        }
    };

    const subscribe = (listener: DispatchListener): (() => void) => {
        subscribers.add(listener);

        return () => {
            subscribers.delete(listener);
        };
    };

    /**
     * Read the learner's pathways off the store. We don't try to
     * filter by owner here — the store already scopes to the signed-
     * in learner; any pathway present is eligible. The binder itself
     * enforces the ownerDid invariant on each emitted proposal.
     */
    const readPathways = (): Pathway[] => Object.values(pathwayStore.get.pathways());

    /**
     * Best-effort owner DID for the current session. We prefer the
     * ownerDid on the active pathway (all pathways are single-owner
     * today) and fall back to the first pathway; if there are no
     * pathways at all we return null which causes the reactor to
     * short-circuit this event.
     */
    const readOwnerDid = (): string | null => {
        const active = pathwayStore.get.activePathway();

        if (active) return active.ownerDid;

        const first = readPathways()[0];

        return first?.ownerDid ?? null;
    };

    // -----------------------------------------------------------------
    // Per-event processing
    // -----------------------------------------------------------------

    const processCredentialEvent = (
        event: CredentialIngestedEvent,
        pathways: Pathway[],
        ownerDid: string,
    ): ProgressDispatchRecord => {
        // Node-level matches: "this credential completes a node".
        const nodeResult: NodeBindResult = bindEventToNodes({
            event,
            pathways,
            ownerDid,
            trustRegistry: options.trustRegistry,
            now: now(),
        });

        for (const proposal of nodeResult.proposals) {
            proposalStore.set.addProposal(proposal);
        }

        // Pathway-level outcome bindings: "this credential binds an
        // OutcomeSignal on the pathway". Same VC can satisfy both a
        // node termination and a pathway outcome — we run both.
        const outcomeResult = bindCredentialToOutcomes({
            vc: event.vc as VcLike,
            credentialUri: event.credentialUri,
            pathways,
            ownerDid,
            trustRegistry: options.trustRegistry,
            now: now(),
        });

        for (const proposal of outcomeResult.proposals) {
            proposalStore.set.addProposal(proposal);
        }

        // Auto-accept. Each acceptance mutates pathwayStore + proposalStore.
        const nodeAccepts = tryAutoAccept(
            nodeResult.proposals,
            autoAcceptCredential,
            ownerDid,
        );
        const outcomeAccepts = tryAutoAccept(
            outcomeResult.proposals,
            autoAcceptOutcome,
            ownerDid,
        );

        const record: ProgressDispatchRecord = {
            eventId: event.eventId,
            eventKind: event.kind,
            dispatchedAt: now(),
            credentialUri: event.credentialUri,
            nodeCompletions: nodeResult.proposals.map(p => ({
                proposalId: p.id,
                // pathwayId is null only for cross-pathway matcher
                // proposals, which the node binder never emits.
                pathwayId: p.pathwayId!,
                // The single-node-completion guarantee: nodeProgressBinder
                // always emits exactly one entry per proposal.
                nodeId: p.diff.completeNodes?.[0]?.nodeId ?? '',
                accepted: nodeAccepts.has(p.id),
            })),
            outcomeBindings: outcomeResult.proposals.map(p => ({
                proposalId: p.id,
                pathwayId: p.pathwayId!,
                outcomeId: p.diff.setOutcomeBindings?.[0]?.outcomeId ?? '',
                accepted: outcomeAccepts.has(p.id),
            })),
        };

        rememberDispatch(record);

        return record;
    };

    const processSessionEvent = (
        event: AiSessionCompletedEvent,
        pathways: Pathway[],
        ownerDid: string,
    ): ProgressDispatchRecord => {
        const nodeResult = bindEventToNodes({
            event,
            pathways,
            ownerDid,
            trustRegistry: options.trustRegistry,
            now: now(),
        });

        for (const proposal of nodeResult.proposals) {
            proposalStore.set.addProposal(proposal);
        }

        const nodeAccepts = tryAutoAccept(
            nodeResult.proposals,
            autoAcceptSession,
            ownerDid,
        );

        const record: ProgressDispatchRecord = {
            eventId: event.eventId,
            eventKind: event.kind,
            dispatchedAt: now(),
            threadId: event.threadId,
            ...(event.topicUri ? { topicUri: event.topicUri } : {}),
            nodeCompletions: nodeResult.proposals.map(p => ({
                proposalId: p.id,
                pathwayId: p.pathwayId!,
                nodeId: p.diff.completeNodes?.[0]?.nodeId ?? '',
                accepted: nodeAccepts.has(p.id),
            })),
        };

        rememberDispatch(record);

        return record;
    };

    const processEvent = (event: WalletEvent): ProgressDispatchRecord | null => {
        const pathways = readPathways();

        // No pathways loaded — nothing to match against. This is a
        // legitimate state during first-session onboarding. Returning
        // null without logging keeps the bus quiet.
        if (pathways.length === 0) return null;

        const ownerDid = readOwnerDid();

        if (!ownerDid) return null;

        if (event.kind === 'credential-ingested') {
            return processCredentialEvent(event, pathways, ownerDid);
        }

        if (event.kind === 'ai-session-completed') {
            return processSessionEvent(event, pathways, ownerDid);
        }

        // Forward-compat: unsupported event kinds are silently
        // skipped. TypeScript will flag the exhaustive-switch
        // omission when a new WalletEvent member is added.
        return null;
    };

    const mount = (): (() => void) =>
        bus.subscribe(
            event => {
                processEvent(event);
            },
            { replay: true },
        );

    return {
        mount,
        processEvent,
        lastDispatch: () =>
            history.length > 0 ? history[history.length - 1] : null,
        recentDispatches: () => history.slice(),
        subscribe,
        resetDispatchHistory: () => {
            history.length = 0;
        },
    };
};

// ---------------------------------------------------------------------------
// Auto-accept helper
// ---------------------------------------------------------------------------

/**
 * Accept each proposal in turn, returning the set of successfully-
 * accepted ids. Wraps the commit in a try/catch so one bad proposal
 * (unknown pathway, composite invariant violation, ownership
 * mismatch) doesn't block the others.
 *
 * We intentionally don't call through `proposalActions.acceptProposal`
 * here. That helper does route re-seeding and analytics work that's
 * irrelevant for completion proposals (they never mutate structure
 * or touch `chosenRoute`) and, pragmatically, pulls the analytics
 * package into this module — which drags `learn-card-base`'s VPQR
 * transitive into environments (tests, cold-start workers) that
 * don't have a `TextDecoder` constructor. The commit we need is
 * narrow: apply the diff, upsert, flip status.
 */
const tryAutoAccept = (
    proposals: readonly Proposal[],
    enabled: boolean,
    ownerDid: string,
): Set<string> => {
    const accepted = new Set<string>();

    if (!enabled) return accepted;

    for (const proposal of proposals) {
        if (proposal.status !== 'open') continue;

        // Cross-pathway proposals (pathwayId === null) aren't emitted
        // by the node or outcome binders, so this defence is
        // precautionary — a misbehaving extension binder shouldn't
        // wedge the reactor.
        if (proposal.pathwayId === null) continue;

        const existing = pathwayStore.get.pathways()[proposal.pathwayId];

        if (!existing) {
            // eslint-disable-next-line no-console
            console.warn(
                '[pathwayProgressReactor] proposal targets unknown pathway',
                proposal.pathwayId,
            );

            continue;
        }

        // Pre-flight the owner check that applyProposal will throw
        // on — logging here keeps the reactor narrow. Without this
        // the caller sees a stack trace for what's really just a
        // routing bug.
        if (proposal.ownerDid !== ownerDid) {
            // eslint-disable-next-line no-console
            console.warn(
                '[pathwayProgressReactor] proposal owner does not match session owner',
                { proposalOwner: proposal.ownerDid, sessionOwner: ownerDid },
            );

            continue;
        }

        try {
            const applied = applyProposal(existing, proposal);

            pathwayStore.set.upsertPathway(applied);
            proposalStore.set.setStatus(proposal.id, 'accepted');

            accepted.add(proposal.id);
        } catch (err) {
            // Leave the proposal `open` in the store. The learner
            // can review/reject/retry through the standard proposal
            // surfaces if they exist; otherwise the proposal simply
            // ages out at its expiresAt. Don't crash the reactor.
            // eslint-disable-next-line no-console
            console.error(
                '[pathwayProgressReactor] auto-accept failed for',
                proposal.id,
                err,
            );
        }
    }

    return accepted;
};

// ---------------------------------------------------------------------------
// Module-level singleton
// ---------------------------------------------------------------------------

/**
 * The reactor wired to the default bus + default auto-accept policy.
 * App shell mounts this once at init; tests construct their own via
 * `createPathwayProgressReactor`.
 */
export const pathwayProgressReactor = createPathwayProgressReactor();
