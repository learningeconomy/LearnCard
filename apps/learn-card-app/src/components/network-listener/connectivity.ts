/**
 * App-side connectivity adapter — the bridge between the shared, pure
 * connectivity monitor (learn-card-base) and this app's native/web
 * environment.
 *
 * One singleton monitor per app. This module owns:
 *
 *  - Probe target selection: on NATIVE the probe ALWAYS targets the tenant's
 *    remote HTTPS domain (`https://<domain>/connectivity.txt`), even in
 *    development — the bundled native origin (`capacitor://localhost`,
 *    `http(s)://localhost`) proves nothing about internet reachability and is
 *    explicitly disallowed. On WEB the probe targets the current origin
 *    (same-origin static asset; plain http loopback is accepted by the shared
 *    validator for local development only).
 *  - Capacitor Network wiring: the listener is registered BEFORE the initial
 *    `getStatus` snapshot so no transition can fall between, and late
 *    resolutions are guarded (never override a newer event; only owned
 *    handles are removed — no `removeAllListeners`). Listener setup failures
 *    are logged, never thrown globally.
 *  - Lifecycle: native `appStateChange` (resume = immediate check, background
 *    pauses automatic retries) and web `visibilitychange` + `focus`.
 *  - Ref-counted start/stop so React StrictMode's double-mount (and any
 *    remount of NetworkListener) cannot double-register or strand listeners.
 *
 * The monitor itself (verification probe, backoff, generations, quality
 * policy) lives in learn-card-base and is UI/framework-free.
 */

import { Capacitor, type PluginListenerHandle } from '@capacitor/core';
import { Network } from '@capacitor/network';
import type { ConnectionStatus } from '@capacitor/network';
import { App } from '@capacitor/app';

import {
    CONNECTIVITY_PROBE_PATH,
    type ProbeTargetConfig,
} from 'learn-card-base/connectivity/probeConnectivity';
import {
    attachConnectivityMonitorToStore,
    createConnectivityMonitor,
    type ConnectivityMonitor,
} from 'learn-card-base/connectivity/connectivityMonitor';
import { getLogger } from 'learn-card-base/logging/logger';
import type { ConnectivityStatus } from 'learn-card-base/stores/connectivityStore';

import { getResolvedTenantConfig } from '../../config/bootstrapTenantConfig';

const log = getLogger('connectivity');

/** Origins a native bundle runs from — probing them proves nothing. */
export const NATIVE_BUNDLED_ORIGINS = [
    'https://localhost',
    'http://localhost',
    'capacitor://localhost',
    'ionic://localhost',
];

// ---------------------------------------------------------------------------
// Probe target selection
// ---------------------------------------------------------------------------

export interface ResolveProbeTargetInput {
    isNative: boolean;
    /** Tenant domain from the resolved TenantConfig (e.g. `learncard.app`). */
    tenantDomain: string | null;
    /** Current web origin (ignored on native). */
    appOrigin: string | null;
}

/**
 * Native → remote HTTPS tenant domain (DEVELOPMENT INCLUDED — the native dev
 * app must verify against the real deployed static asset, not a bundled
 * localhost file that would falsely "verify" a device with no internet).
 * Web → same-origin `/connectivity.txt`.
 *
 * Returns `null` when no safe target exists; the monitor then reports an
 * `inconclusive` result and stays permissive (unknown) instead of probing.
 */
export const resolveProbeTarget = (input: ResolveProbeTargetInput): ProbeTargetConfig | null => {
    if (input.isNative) {
        if (!input.tenantDomain) return null;
        return {
            url: `https://${input.tenantDomain}${CONNECTIVITY_PROBE_PATH}`,
            // Belt-and-braces: never probe the bundled origin, even if a bad
            // config ever made it look like the tenant domain.
            disallowOrigins: NATIVE_BUNDLED_ORIGINS,
        };
    }

    if (!input.appOrigin) return null;
    // Same-origin probe. Plain-http loopback development targets are accepted
    // by the shared validator; everything else must be https.
    return { url: `${input.appOrigin}${CONNECTIVITY_PROBE_PATH}` };
};

const getCurrentAppOrigin = (): string | null =>
    typeof window !== 'undefined' && window.location ? window.location.origin : null;

const getTenantDomain = (): string | null => {
    try {
        return getResolvedTenantConfig()?.domain ?? null;
    } catch {
        // Tenant config not bootstrapped yet (very early boot): probe target is
        // unknown → the monitor reports inconclusive and retries on backoff.
        return null;
    }
};

// ---------------------------------------------------------------------------
// Adapter factory (pure, fully injectable — unit-tested in connectivity.test.ts)
// ---------------------------------------------------------------------------

export interface MonitorFacade {
    reportTransport: (connected: boolean) => void;
    setActive: (active: boolean) => void;
    /** Coalesced manual-style check (focus, manual retry all funnel here). */
    check: () => Promise<ConnectivityStatus>;
    start: () => void;
    stop: () => void;
}

export interface RemovableHandle {
    remove: () => Promise<void> | void;
}

export interface AppConnectivityAdapterDeps {
    monitor: MonitorFacade;
    isNative: () => boolean;
    /** Register the transport hint listener. MUST be called before the snapshot. */
    addNetworkStatusListener: (handler: (connected: boolean) => void) => Promise<RemovableHandle>;
    /** The one-shot initial snapshot (`Network.getStatus`). */
    getInitialTransportState: () => Promise<boolean>;
    /** Native lifecycle; `null` on platforms without it. */
    addAppStateListener: ((handler: (active: boolean) => void) => Promise<RemovableHandle>) | null;
    addWindowEventListener?: (
        type: 'focus' | 'visibilitychange',
        handler: () => void
    ) => () => void;
    isDocumentHidden?: () => boolean;
    /**
     * Is the app foreground-active RIGHT NOW (at attach time)? Native resolves
     * `App.getState()`; web reads `document.hidden`. Checked BEFORE the monitor
     * starts so a hidden/inactive mount never launches the initial probe from
     * the background. When absent or throwing, foreground is assumed.
     */
    getInitialActivity?: () => boolean | Promise<boolean>;
}

export interface AppConnectivityAdapter {
    /** Idempotent. Stops the monitor and removes ONLY handles this adapter owns. */
    dispose: () => void;
}

export const createAppConnectivityAdapter = (
    deps: AppConnectivityAdapterDeps
): AppConnectivityAdapter => {
    let disposed = false;
    /** True once ANY transport hint arrived — an in-flight snapshot is then stale. */
    let receivedListenerHint = false;
    /** Handles successfully registered by THIS adapter (owned removals only). */
    const ownedHandles: RemovableHandle[] = [];
    const windowDisposers: (() => void)[] = [];

    const removeHandleQuietly = (handle: RemovableHandle): void => {
        try {
            void Promise.resolve(handle.remove()).catch(() => undefined);
        } catch {
            // Never let cleanup reject.
        }
    };

    // 0. Initialize activity from the CURRENT hidden/inactive state BEFORE the
    // monitor starts: a mount that happens in the background must not launch
    // the initial probe. If activity is unknowable, assume foreground.
    void (async () => {
        let active = true;
        if (deps.getInitialActivity) {
            try {
                active = await deps.getInitialActivity();
            } catch {
                active = true;
            }
        }
        if (disposed) return;
        if (!active) deps.monitor.setActive(false);
        deps.monitor.start();
    })();

    // 1. Transport hints. The listener is registered FIRST so no event can
    // fall between registration and the initial snapshot; the snapshot result
    // is guarded so a late `getStatus` can never override a newer event (the
    // monitor itself also supersedes stale hints by generation).
    void (async () => {
        try {
            const handle = await deps.addNetworkStatusListener(connected => {
                if (!disposed) {
                    receivedListenerHint = true;
                    deps.monitor.reportTransport(connected);
                }
            });

            if (disposed) {
                // Listener resolved after dispose (StrictMode double-mount or
                // unmount) — clean up our own handle, report nothing.
                removeHandleQuietly(handle);
                return;
            }
            ownedHandles.push(handle);

            const connected = await deps.getInitialTransportState();
            // The listener was registered BEFORE this snapshot was taken, so
            // any hint that arrived while it was in flight is newer by
            // definition — and a stale initial getStatus must never override
            // a newer event. Report only when the snapshot is still the
            // freshest signal we have.
            if (!disposed && !receivedListenerHint) deps.monitor.reportTransport(connected);
        } catch (error) {
            // Setup failure must never reject globally: connectivity simply
            // stays permissive until the next lifecycle event.
            log.warn('connectivity: transport listener setup failed', error);
        }
    })();

    // 2. Foreground/background. Background pauses automatic retries; resume
    // checks immediately (the monitor's setActive does the immediate check).
    void (async () => {
        if (!deps.addAppStateListener) return;
        try {
            const handle = await deps.addAppStateListener(active => {
                if (!disposed) deps.monitor.setActive(active);
            });
            if (disposed) {
                removeHandleQuietly(handle);
                return;
            }
            ownedHandles.push(handle);
        } catch (error) {
            log.warn('connectivity: app-state listener setup failed', error);
        }
    })();

    // 3. Web lifecycle: visibility pauses/resumes, focus coalesces a check.
    const hidden = deps.isDocumentHidden ?? (() => false);
    if (deps.addWindowEventListener) {
        windowDisposers.push(
            deps.addWindowEventListener('visibilitychange', () => {
                if (disposed) return;
                deps.monitor.setActive(!hidden());
            })
        );
        windowDisposers.push(
            deps.addWindowEventListener('focus', () => {
                if (disposed || hidden()) return;
                // Focus triggers a coalesced check through the same singleton
                // operation as every other check — never a bare
                // Network.getStatus call, never a probe storm.
                void deps.monitor.check().catch(() => undefined);
            })
        );
    }

    return {
        dispose: () => {
            if (disposed) return;
            disposed = true;
            windowDisposers.forEach(dispose => {
                try {
                    dispose();
                } catch {
                    // Ignore double-removal.
                }
            });
            windowDisposers.length = 0;
            [...ownedHandles].forEach(removeHandleQuietly);
            ownedHandles.length = 0;
            deps.monitor.stop();
        },
    };
};

// ---------------------------------------------------------------------------
// Singleton wiring (the only environment-touching layer)
// ---------------------------------------------------------------------------

/**
 * The probe target this app should use right now. Native → remote HTTPS tenant
 * domain (development included); web → current origin. Returns `null` when no
 * safe target exists; the monitor then reports an `inconclusive` result and
 * stays permissive (unknown) instead of probing.
 */
export const getAppProbeTarget = (): ProbeTargetConfig | null =>
    resolveProbeTarget({
        isNative: Capacitor.isNativePlatform(),
        tenantDomain: getTenantDomain(),
        appOrigin: getCurrentAppOrigin(),
    });

let singleton: ConnectivityMonitor | null = null;
let detachFromStore: (() => void) | null = null;

/**
 * The app's single connectivity monitor. Created lazily on first use; its
 * state is mirrored into the shared `connectivityStore` (which FullApp's
 * onlineManager bridge, the auth coordinator and the UI already read).
 */
export const getAppConnectivityMonitor = (): ConnectivityMonitor => {
    if (!singleton) {
        singleton = createConnectivityMonitor({ getProbeTarget: getAppProbeTarget });
        detachFromStore = attachConnectivityMonitorToStore(singleton);
    }
    return singleton;
};

const buildAppConnectivityDeps = (monitor: ConnectivityMonitor): AppConnectivityAdapterDeps => ({
    monitor,
    isNative: () => Capacitor.isNativePlatform(),
    addNetworkStatusListener: handler =>
        Network.addListener('networkStatusChange', (status: ConnectionStatus) => {
            handler(status.connected);
        }),
    getInitialTransportState: async () => (await Network.getStatus()).connected,
    // Attach-time activity: native asks the App plugin; web reads visibility.
    // Resolved BEFORE monitor start so a hidden mount never probes first.
    getInitialActivity: async () => {
        if (Capacitor.isNativePlatform()) {
            const state = await App.getState();
            return state.isActive;
        }
        return !document.hidden;
    },
    // Native lifecycle only — on web, visibilitychange below already covers it.
    addAppStateListener: Capacitor.isNativePlatform()
        ? handler =>
              App.addListener('appStateChange', state => {
                  handler(state.isActive);
              })
        : null,
    addWindowEventListener: (type, handler) => {
        window.addEventListener(type, handler);
        return () => window.removeEventListener(type, handler);
    },
    isDocumentHidden: () => document.hidden,
});

let refCount = 0;
let activeAdapter: AppConnectivityAdapter | null = null;

/**
 * Ref-counted attach — call once per consumer (e.g. in a `useEffect`), invoke
 * the returned disposer on cleanup. The first attach starts the monitor and
 * registers environment listeners; the last dispose removes them. Survives
 * React StrictMode double-mounting.
 */
export const attachAppConnectivity = (): (() => void) => {
    const monitor = getAppConnectivityMonitor();
    refCount += 1;
    if (refCount === 1) {
        activeAdapter = createAppConnectivityAdapter(buildAppConnectivityDeps(monitor));
    }

    let released = false;
    return () => {
        if (released) return;
        released = true;
        refCount = Math.max(0, refCount - 1);
        if (refCount === 0) {
            activeAdapter?.dispose();
            activeAdapter = null;
        }
    };
};

/**
 * Manual retry / focus / reconnect checks go through the SAME singleton
 * operation as automatic retries and hints. Callers must NOT call
 * `Network.getStatus` themselves.
 */
export const requestConnectivityCheck = (): Promise<ConnectivityStatus> =>
    getAppConnectivityMonitor().check();

/** Test-only: drop the singleton (tests re-create it with fresh state). */
export const __resetAppConnectivityForTests = (): void => {
    detachFromStore?.();
    detachFromStore = null;
    singleton = null;
    refCount = 0;
    activeAdapter?.dispose();
    activeAdapter = null;
};
