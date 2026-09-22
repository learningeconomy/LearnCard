import { createStore } from '@udecode/zustood';

import type {
    ConnectionQuality,
    ConnectionQualityReason,
} from '../connectivity/connectionQuality';

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
 *  - `online`   — transport reports connectivity (or probe verified it)
 *  - `offline`  — transport reports no connectivity / probe failed
 *
 * Quality fields (`quality`/`qualityReason`) are ADVISORY ONLY — a
 * slow/unstable warning for the UI. They must never participate in gating
 * decisions (auth, React Query onlineManager, boot gates); see
 * `src/connectivity/connectionQuality.ts` for the policy.
 */
export type ConnectivityStatus = 'unknown' | 'online' | 'offline';

export const connectivityStore = createStore('connectivityStore')<{
    status: ConnectivityStatus;
    lastOnlineAt: number | null;
    quality: ConnectionQuality;
    qualityReason: ConnectionQualityReason | null;
    /** Diagnostics from the last connectivity check (never user-facing). */
    lastDiagnosticReason: string | null;
    lastCheckAt: number | null;
}>({
    status: 'unknown',
    lastOnlineAt: null,
    quality: 'unknown',
    qualityReason: null,
    lastDiagnosticReason: null,
    lastCheckAt: null,
})
    .extendActions(set => ({
        /** Legacy hint-style update, kept for debug/test callers. */
        report: (connected: boolean) => {
            set.status(connected ? 'online' : 'offline');
            if (connected) set.lastOnlineAt(Date.now());
        },
    }))
    .extendSelectors(state => ({
        isOffline: () => state.status === 'offline',
        isOnlineOrUnknown: () => state.status !== 'offline',
        /** Advisory only — must not be used for gating. */
        isPoorQuality: () => state.quality === 'poor',
    }));
