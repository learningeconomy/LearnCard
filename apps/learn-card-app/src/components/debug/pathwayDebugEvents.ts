/**
 * Pathway Progress Debug Event Logger
 *
 * Mirror of `authDebugEvents.ts` for the pathway-progress architecture.
 * Each `ProgressDispatchRecord` emitted by the reactor is materialised
 * into a `PathwayDebugEvent` that the `PathwaysDebugTab` timeline can
 * render via the shared `EventTimeline` component.
 *
 * ## Why a separate log rather than reading the reactor's history
 *
 * The reactor's `recentDispatches()` is purpose-built for the UX
 * hook (`usePathwayProgressForCredential`) — capped at 32 records
 * with no level classification, no user-friendly messages, and no
 * listener fanout. This module:
 *
 *   - **Classifies** each dispatch as `success` / `info` / `warning`
 *     (success when something advanced; info when nothing matched;
 *     warning is reserved for when we later surface skipped
 *     proposals).
 *   - **Stores a friendly message** per entry so the timeline reads
 *     at a glance.
 *   - **Retains a larger window** (100 vs the reactor's 32) for
 *     longer debug sessions.
 *   - **Fans out to listeners** so the tab re-renders reactively.
 *
 * ## Lifecycle
 *
 * The recorder auto-subscribes to the reactor on first import in a
 * browser context. Idempotent — calling `installPathwayDebugRecorder()`
 * twice registers exactly one listener. This mirrors the "install
 * once at panel mount" pattern used by `installPathwaysDevGlobals`.
 */

import {
    pathwayProgressReactor,
    type ProgressDispatchRecord,
} from '../../pages/pathways/events/pathwayProgressReactor';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Debug event types we classify today. Kept small on purpose — the
 * data payload carries the detail; the type is a tag for filtering
 * and color-coding in the timeline.
 */
export type PathwayDebugEventType =
    | 'pathway:credential-dispatched'
    | 'pathway:session-dispatched'
    | 'pathway:reactor-error'
    | 'pathway:simulator-fired'
    | 'pathway:manual-note';

export interface PathwayDebugEvent {
    id: string;
    type: PathwayDebugEventType;
    message: string;
    timestamp: Date;
    data?: Record<string, unknown>;
    level: 'info' | 'success' | 'warning' | 'error';
}

type EventListener = (event: PathwayDebugEvent) => void;

// ---------------------------------------------------------------------------
// Module state
// ---------------------------------------------------------------------------

const MAX_EVENTS = 100;

let events: PathwayDebugEvent[] = [];
const listeners: Set<EventListener> = new Set();
let eventIdCounter = 0;
let recorderInstalled = false;
let recorderUnsubscribe: (() => void) | null = null;

const isDebugEnabled = (): boolean => {
    if (typeof window === 'undefined') return false;

    try {
        return (
            import.meta.env.VITE_ENABLE_AUTH_DEBUG_WIDGET === 'true'
            || import.meta.env.DEV
        );
    } catch {
        return false;
    }
};

// ---------------------------------------------------------------------------
// Public emission API
// ---------------------------------------------------------------------------

/**
 * Emit a debug event. Callers include the reactor recorder (auto-
 * installed below), the simulator buttons (to tag manual fires
 * distinctly in the timeline), and anywhere else we want to
 * annotate the log during a debug session.
 */
export const emitPathwayDebugEvent = (
    type: PathwayDebugEventType,
    message: string,
    options?: {
        data?: Record<string, unknown>;
        level?: 'info' | 'success' | 'warning' | 'error';
    },
): void => {
    if (!isDebugEnabled()) return;

    const event: PathwayDebugEvent = {
        id: `pway_${++eventIdCounter}_${Date.now()}`,
        type,
        message,
        timestamp: new Date(),
        data: options?.data,
        level: options?.level ?? 'info',
    };

    // Prepend (newest first). The `EventTimeline` component renders
    // the array in order, so newest-at-top matches its layout.
    events = [event, ...events].slice(0, MAX_EVENTS);

    for (const listener of Array.from(listeners)) {
        try {
            listener(event);
        } catch (err) {
            // eslint-disable-next-line no-console
            console.error('[pathwayDebugEvents] listener error:', err);
        }
    }
};

export const subscribeToPathwayDebugEvents = (
    listener: EventListener,
): (() => void) => {
    listeners.add(listener);

    return () => {
        listeners.delete(listener);
    };
};

export const getPathwayDebugEvents = (): PathwayDebugEvent[] => events.slice();

export const clearPathwayDebugEvents = (): void => {
    events = [];

    for (const listener of Array.from(listeners)) {
        try {
            listener({
                id: 'clear',
                type: 'pathway:manual-note',
                message: 'Timeline cleared',
                timestamp: new Date(),
                level: 'info',
            });
        } catch {
            /* ignore */
        }
    }
};

// ---------------------------------------------------------------------------
// Dispatch → debug event projection
// ---------------------------------------------------------------------------

/**
 * Project a reactor dispatch record into a timeline-friendly
 * debug event. The projection is deterministic so the timeline
 * copy stays consistent across identical dispatches (useful when
 * debugging flakes).
 */
const projectDispatch = (record: ProgressDispatchRecord): PathwayDebugEvent => {
    const nodeCount = record.nodeCompletions.length;
    const outcomeCount = record.outcomeBindings?.length ?? 0;
    const totalMatches = nodeCount + outcomeCount;

    const isCredential = record.eventKind === 'credential-ingested';
    const type: PathwayDebugEventType = isCredential
        ? 'pathway:credential-dispatched'
        : 'pathway:session-dispatched';

    const level: PathwayDebugEvent['level'] =
        totalMatches > 0 ? 'success' : 'info';

    // Friendly one-liner. Shape varies slightly by event kind so the
    // timeline reads naturally.
    const kindLabel = isCredential ? 'Credential ingested' : 'AI session finished';
    const matchLabel = totalMatches === 0
        ? 'no matches'
        : [
              nodeCount > 0 ? `${nodeCount} node${nodeCount === 1 ? '' : 's'}` : null,
              outcomeCount > 0
                  ? `${outcomeCount} outcome${outcomeCount === 1 ? '' : 's'}`
                  : null,
          ]
              .filter(Boolean)
              .join(' + ');

    const message = `${kindLabel} → ${matchLabel}`;

    return {
        id: `pway_${++eventIdCounter}_${Date.now()}`,
        type,
        message,
        timestamp: new Date(record.dispatchedAt),
        level,
        data: {
            eventId: record.eventId,
            eventKind: record.eventKind,
            ...(record.credentialUri ? { credentialUri: record.credentialUri } : {}),
            ...(record.threadId ? { threadId: record.threadId } : {}),
            ...(record.topicUri ? { topicUri: record.topicUri } : {}),
            nodeCompletions: record.nodeCompletions,
            ...(record.outcomeBindings && record.outcomeBindings.length > 0
                ? { outcomeBindings: record.outcomeBindings }
                : {}),
        },
    };
};

// ---------------------------------------------------------------------------
// Auto-installed recorder
// ---------------------------------------------------------------------------

/**
 * Subscribe to the reactor once per process and pipe every dispatch
 * into the timeline. Safe to call multiple times; second and later
 * calls are no-ops. Returns a disposer so tests can tear down the
 * subscription; callers in production never need it.
 */
export const installPathwayDebugRecorder = (): (() => void) => {
    if (recorderInstalled) return recorderUnsubscribe ?? (() => {});
    if (!isDebugEnabled()) return () => {};

    recorderInstalled = true;

    recorderUnsubscribe = pathwayProgressReactor.subscribe(record => {
        const event = projectDispatch(record);

        // Insert the already-projected event directly into the log
        // rather than going through `emitPathwayDebugEvent` — the
        // projection already has the correct id / timestamp sourced
        // from the dispatch record.
        events = [event, ...events].slice(0, MAX_EVENTS);

        for (const listener of Array.from(listeners)) {
            try {
                listener(event);
            } catch (err) {
                // eslint-disable-next-line no-console
                console.error('[pathwayDebugEvents] listener error:', err);
            }
        }
    });

    return () => {
        recorderUnsubscribe?.();
        recorderUnsubscribe = null;
        recorderInstalled = false;
    };
};
