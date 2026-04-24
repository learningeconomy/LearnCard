/**
 * walletEventBus — the single publish/subscribe seam for every
 * completion-relevant event in the app.
 *
 * ## What this is
 *
 * A tiny synchronous pub-sub. `publishWalletEvent(event)` fans the
 * event out to every subscriber registered via
 * `subscribeWalletEvents(listener)`. The shape is deliberately small —
 * no channels, no ordering guarantees beyond "subscribers are called
 * in registration order", no async middleware pipeline. Every fancy
 * feature is a *consumer* responsibility (debounce, filter, replay).
 *
 * ## What this is NOT
 *
 * - Not a store — it holds a rolling window of recent events for
 *   late subscribers, nothing more. Pathway progress state lives in
 *   `pathwayStore`; proposal state in `proposalStore`. The bus is
 *   purely the edge between "something happened in the wallet" and
 *   "pathway machinery reacts".
 * - Not async. Publish is synchronous, subscriber callbacks run on
 *   the publish thread. The reactor's work is cheap enough (one
 *   matcher pass over the learner's pathways) to stay inline; any
 *   future expensive consumer should schedule its own work.
 * - Not cross-tab. Every tab has its own bus instance. Cross-tab
 *   replay happens through the proposal store (which persists) and
 *   the on-boot sweep, not through the bus itself.
 *
 * ## Idempotency
 *
 * Every `WalletEvent` carries a `eventId` (see
 * `types/walletEvent.ts`). The bus deduplicates on that id: the same
 * event published twice produces exactly one fanout. This is the
 * cheap belt-and-braces layer — the reactor still does its own
 * `(nodeId, credentialUri)` dedup at the node level, and
 * `applyProposal` no-ops on already-completed nodes, so three layers
 * of defence against double-completion.
 *
 * ## Replay window
 *
 * The bus keeps the last N events in memory and replays them to
 * late subscribers on demand (`subscribeWalletEvents(listener, { replay: true })`).
 * This matters for the reactor mount order: if a claim fires before
 * the reactor subscribes (rare but possible during app boot), the
 * reactor's first action on mount is to pull the window, bringing
 * pathway state up to date without user action.
 */

import {
    WalletEventSchema,
    type WalletEvent,
} from '../types/walletEvent';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Size of the rolling recent-events buffer. Tuned for the cold-start
 * scenario: the reactor mounts after a claim fired during login,
 * wants to catch up without re-reading the wallet. 32 is comfortably
 * more than a single session would produce in the boot window; we
 * truncate oldest-first.
 */
const DEFAULT_RECENT_BUFFER = 32;

/**
 * How many eventIds we remember for dedup. Separate from the recent
 * buffer because a very loud publisher (cross-device sync flushing a
 * backlog) might fire the same id twice while being too noisy for
 * the replay window to retain. 128 is defensive overkill.
 */
const DEFAULT_DEDUP_WINDOW = 128;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type WalletEventListener = (event: WalletEvent) => void;

export interface SubscribeOptions {
    /**
     * When true, immediately invoke the listener once per buffered
     * recent event (oldest first). Use this for late-mounting
     * reactors that want to catch up on claims that landed during
     * app boot.
     */
    replay?: boolean;
}

export interface WalletEventBus {
    publish: (event: WalletEvent) => void;
    subscribe: (listener: WalletEventListener, options?: SubscribeOptions) => () => void;
    /**
     * Read the rolling recent-events buffer. Callers that want a
     * snapshot for cold-start processing take this; subscribing with
     * `{ replay: true }` is the more common pattern but there are
     * places (tests, dev tools) that want the array without
     * subscribing.
     */
    recent: () => readonly WalletEvent[];
    /**
     * Drop the internal state. Exposed for tests that want a clean
     * slate between cases; not intended for production use.
     */
    reset: () => void;
}

// ---------------------------------------------------------------------------
// Core factory
// ---------------------------------------------------------------------------

/**
 * Build a fresh bus instance. The module-level `walletEventBus`
 * below is the singleton the app uses; tests and advanced callers
 * can instantiate their own.
 */
export const createWalletEventBus = (
    options: {
        recentBufferSize?: number;
        dedupWindow?: number;
        /**
         * When false, skip zod validation on publish. Defaults to
         * true. Validation is cheap and catches publisher bugs
         * before they can corrupt the reactor, but tests sometimes
         * want to bypass for negative cases.
         */
        validate?: boolean;
    } = {},
): WalletEventBus => {
    const recentBufferSize = options.recentBufferSize ?? DEFAULT_RECENT_BUFFER;
    const dedupWindow = options.dedupWindow ?? DEFAULT_DEDUP_WINDOW;
    const validate = options.validate ?? true;

    const listeners = new Set<WalletEventListener>();
    const recent: WalletEvent[] = [];
    const seenIds: string[] = [];
    const seenIdSet = new Set<string>();

    const recordId = (id: string): void => {
        if (seenIdSet.has(id)) return;

        seenIds.push(id);
        seenIdSet.add(id);

        while (seenIds.length > dedupWindow) {
            const dropped = seenIds.shift();

            if (dropped !== undefined) seenIdSet.delete(dropped);
        }
    };

    const publish = (event: WalletEvent): void => {
        // Validation: a corrupt event is a publisher bug; loudly
        // reject rather than silently drop. Wrapping in try/catch
        // and logging would swallow the signal; we want the
        // publisher stack to show up in dev tools.
        const parsed = validate ? WalletEventSchema.parse(event) : event;

        // Dedup by eventId. Publishers are responsible for
        // generating ids; the bus just remembers them.
        if (seenIdSet.has(parsed.eventId)) return;

        recordId(parsed.eventId);

        recent.push(parsed);
        while (recent.length > recentBufferSize) recent.shift();

        // Snapshot listeners before iterating — a subscriber
        // unsubscribing during its own callback should not skip
        // the subscriber that was next in the iteration order.
        for (const listener of Array.from(listeners)) {
            try {
                listener(parsed);
            } catch (err) {
                // One misbehaving listener should not block
                // fanout to the others. Logged for dev visibility;
                // in production this is rare enough that the
                // analytics pipeline is where it belongs rather
                // than a crash.
                // eslint-disable-next-line no-console
                console.error('[walletEventBus] listener threw:', err);
            }
        }
    };

    const subscribe = (
        listener: WalletEventListener,
        options: SubscribeOptions = {},
    ): (() => void) => {
        listeners.add(listener);

        if (options.replay) {
            // Defensive copy — replay iteration must not see a
            // listener that mutates `recent` via `publish` during
            // the replay. Snapshot-then-iterate.
            for (const event of Array.from(recent)) {
                try {
                    listener(event);
                } catch (err) {
                    // eslint-disable-next-line no-console
                    console.error('[walletEventBus] replay listener threw:', err);
                }
            }
        }

        return () => {
            listeners.delete(listener);
        };
    };

    const reset = (): void => {
        listeners.clear();
        recent.length = 0;
        seenIds.length = 0;
        seenIdSet.clear();
    };

    return {
        publish,
        subscribe,
        recent: () => recent.slice(),
        reset,
    };
};

// ---------------------------------------------------------------------------
// Module-level singleton
// ---------------------------------------------------------------------------

/**
 * The singleton bus that app surfaces publish to and the reactor
 * subscribes to. Declared at module level rather than as a store
 * because it has no persisted state — everything is ephemeral,
 * scoped to the tab lifetime. See module docstring for the rationale.
 */
export const walletEventBus = createWalletEventBus();

/**
 * Convenience shim for the most common call site: publishers that
 * don't need the full `publish` reference just call this.
 */
export const publishWalletEvent = (event: WalletEvent): void =>
    walletEventBus.publish(event);
