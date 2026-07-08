import { createStore } from '@udecode/zustood';

/**
 * Connectivity model — an orthogonal signal to the AuthCoordinator state.
 *
 * Auth/key progression (idle → ready) and network reachability are independent
 * concerns: a cached-key user can be fully `ready` while offline. Keeping this
 * separate from the coordinator lets gating/UX react to connectivity without
 * polluting the auth state machine.
 *
 * This store is intentionally pure JS (no `@capacitor/network` import) so it
 * stays usable in the shared package and in tests. The native apps own the
 * Capacitor `Network` listener and push updates in via `set.status(...)`.
 *
 *  - `unknown`  — not yet determined (initial boot, before first probe)
 *  - `online`   — transport reports connectivity
 *  - `offline`  — transport reports no connectivity
 */
export type ConnectivityStatus = 'unknown' | 'online' | 'offline';

export const connectivityStore = createStore('connectivityStore')<{
    status: ConnectivityStatus;
    lastOnlineAt: number | null;
}>({
    status: 'unknown',
    lastOnlineAt: null,
})
    .extendActions(set => ({
        report: (connected: boolean) => {
            set.status(connected ? 'online' : 'offline');
            if (connected) set.lastOnlineAt(Date.now());
        },
    }))
    .extendSelectors(state => ({
        isOffline: () => state.status === 'offline',
        isOnlineOrUnknown: () => state.status !== 'offline',
    }));
