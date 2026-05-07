/**
 * LC-1644 frontend perf telemetry — captures the user-perceived sendCredential→claim flow.
 *
 * The flow spans multiple components (the message handler that calls sendAppEvent,
 * then CredentialClaimModal that mounts and handles claim). To stitch their phase
 * timings into a single event, we use a module-level singleton holding the
 * "current flow" timestamps. At most one of these flows is in-flight from the user's
 * perspective at any moment, so a singleton is safe and avoids threading state
 * through multiple component layers.
 *
 * Lifecycle:
 *   startFlow()                      — sendAppEvent invocation
 *     → markResponseReceived()       — sendAppEvent promise resolves
 *       → markModalMounted()         — CredentialClaimModal useEffect first run
 *         → markCredentialResolved() — credential set in state (fast or slow path)
 *           → markClaimStarted()     — user clicks Accept
 *             → markClaimCompleted() — claimed=true rendered → emits event
 *
 * Any of these may instead trigger flushOnError() or flushOnDismiss(), which emit
 * the event with whatever phases were captured plus an outcome tag.
 *
 * The helper is import-only (no React hook) so non-component code paths
 * (the message handler) can use it without ceremony.
 */

import type { AnalyticsProvider } from '../analytics/types';
import { AnalyticsEvents } from '../analytics/events';
import type { AnalyticsEventPayloads } from '../analytics/events';

type Iter = AnalyticsEventPayloads[typeof AnalyticsEvents.FRONTEND_SENDCREDENTIAL_ITERATION];

/**
 * Snapshot of the in-flight flow. Only the first call to `startFlow` for a given
 * iteration takes effect; subsequent starts before flush silently no-op (defensive
 * against e.g. overlapping rerenders).
 */
interface CurrentFlow {
    runId: string;
    listingId?: string;
    eventType?: string;
    triggeredByBench: boolean;
    requestStartedAt: number;
    responseReceivedAt?: number;
    alreadyClaimed?: boolean;
    modalMountedAt?: number;
    credentialResolvedAt?: number;
    fastPath?: boolean;
    claimStartedAt?: number;
}

let currentFlow: CurrentFlow | null = null;
let analyticsProvider: AnalyticsProvider | null = null;

/**
 * Wire the helper to the analytics provider once at app boot. Called from a small
 * effect inside `AnalyticsContextProvider` consumers — see `useSendCredentialFlowWiring`.
 */
export function setAnalyticsProvider(provider: AnalyticsProvider | null): void {
    analyticsProvider = provider;
}

function generateRunId(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    // Fallback for old browsers / non-secure contexts. Not cryptographic, just unique-ish.
    return `flow-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Begin a new flow. If one is already in-flight, it is dropped without emitting —
 * this prevents stale flows from accumulating if the user navigates away mid-claim.
 *
 * `runId` may be passed by the bench panel to join with backend events; if omitted
 * a fresh UUID is generated.
 */
export function startFlow(input: {
    listingId?: string;
    eventType?: string;
    runId?: string;
    triggeredByBench?: boolean;
}): string {
    const runId = input.runId ?? generateRunId();
    currentFlow = {
        runId,
        listingId: input.listingId,
        eventType: input.eventType,
        triggeredByBench: !!input.triggeredByBench,
        requestStartedAt: performance.now(),
    };
    return runId;
}

export function markResponseReceived(input: { alreadyClaimed?: boolean } = {}): void {
    if (!currentFlow || currentFlow.responseReceivedAt !== undefined) return;
    currentFlow.responseReceivedAt = performance.now();
    currentFlow.alreadyClaimed = input.alreadyClaimed;
}

export function markModalMounted(): void {
    if (!currentFlow || currentFlow.modalMountedAt !== undefined) return;
    currentFlow.modalMountedAt = performance.now();
}

export function markCredentialResolved(input: { fastPath: boolean }): void {
    if (!currentFlow || currentFlow.credentialResolvedAt !== undefined) return;
    currentFlow.credentialResolvedAt = performance.now();
    currentFlow.fastPath = input.fastPath;
}

export function markClaimStarted(): void {
    if (!currentFlow || currentFlow.claimStartedAt !== undefined) return;
    currentFlow.claimStartedAt = performance.now();
}

/**
 * Compose the per-phase timings from the snapshot. Phases not reached emit as
 * `undefined` so PostHog's analysis surfaces the truncation cleanly.
 */
function buildPayload(
    flow: CurrentFlow,
    outcome: Iter['outcome'],
    extra: Partial<Pick<Iter, 'error_phase' | 'error_message'>> = {}
): Iter {
    const now = performance.now();
    const requestToResponse =
        flow.responseReceivedAt !== undefined
            ? Math.round(flow.responseReceivedAt - flow.requestStartedAt)
            : undefined;
    const responseToModalMount =
        flow.responseReceivedAt !== undefined && flow.modalMountedAt !== undefined
            ? Math.round(flow.modalMountedAt - flow.responseReceivedAt)
            : undefined;
    const modalMountToCredentialResolved =
        flow.modalMountedAt !== undefined && flow.credentialResolvedAt !== undefined
            ? Math.round(flow.credentialResolvedAt - flow.modalMountedAt)
            : undefined;
    const claimEndAt = outcome === 'claimed' || outcome === 'already_claimed' ? now : undefined;
    const claimPhase =
        flow.claimStartedAt !== undefined && claimEndAt !== undefined
            ? Math.round(claimEndAt - flow.claimStartedAt)
            : undefined;
    const totalE2e =
        outcome !== 'error' && outcome !== 'modal_dismissed'
            ? Math.round(now - flow.requestStartedAt)
            : undefined;

    return {
        run_id: flow.runId,
        listing_id: flow.listingId,
        event_type: flow.eventType,
        outcome,
        fast_path: flow.fastPath,
        already_claimed: flow.alreadyClaimed,
        request_to_response_ms: requestToResponse,
        response_to_modal_mount_ms: responseToModalMount,
        modal_mount_to_credential_resolved_ms: modalMountToCredentialResolved,
        claim_phase_ms: claimPhase,
        total_e2e_ms: totalE2e,
        triggered_by_bench: flow.triggeredByBench,
        ...extra,
    };
}

async function emit(payload: Iter): Promise<void> {
    if (!analyticsProvider) return;
    try {
        await analyticsProvider.track(AnalyticsEvents.FRONTEND_SENDCREDENTIAL_ITERATION, payload);
    } catch (err) {
        // Telemetry must never break the user flow.
        console.warn('[sendCredentialFlow] failed to emit iteration event', err);
    }
}

/** Successful claim — happy path terminator. */
export async function markClaimCompleted(): Promise<void> {
    if (!currentFlow) return;
    const payload = buildPayload(
        currentFlow,
        currentFlow.alreadyClaimed ? 'already_claimed' : 'claimed'
    );
    currentFlow = null;
    await emit(payload);
}

/** User closed the modal without accepting. */
export async function flushOnDismiss(): Promise<void> {
    if (!currentFlow) return;
    const payload = buildPayload(currentFlow, 'modal_dismissed');
    currentFlow = null;
    await emit(payload);
}

/** Any phase failed. */
export async function flushOnError(input: {
    phase: NonNullable<Iter['error_phase']>;
    message?: string;
}): Promise<void> {
    if (!currentFlow) return;
    const payload = buildPayload(currentFlow, 'error', {
        error_phase: input.phase,
        error_message: input.message,
    });
    currentFlow = null;
    await emit(payload);
}

/** Test/diagnostic accessor. Not part of the public production surface. */
export function _getCurrentFlowForDebug(): Readonly<CurrentFlow> | null {
    return currentFlow;
}
