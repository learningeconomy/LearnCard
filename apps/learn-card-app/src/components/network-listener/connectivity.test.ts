import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const { isNativePlatform } = vi.hoisted(() => ({ isNativePlatform: vi.fn(() => false) }));

vi.mock('@capacitor/core', () => ({
    Capacitor: { isNativePlatform: () => isNativePlatform() },
}));

vi.mock('@capacitor/network', () => ({
    Network: {
        addListener: vi.fn(),
        getStatus: vi.fn(),
    },
}));

vi.mock('@capacitor/app', () => ({
    App: {
        addListener: vi.fn(),
        getState: vi.fn(),
    },
}));

// Keep singleton tests hermetic: the lazily-created app monitor falls back to
// the REAL probe; stub it so no test ever touches the network.
vi.mock('learn-card-base/connectivity/probeConnectivity', async importOriginal => {
    const actual = await importOriginal<
        typeof import('learn-card-base/connectivity/probeConnectivity')
    >();
    return {
        ...actual,
        probeConnectivity: vi.fn(async () => ({
            kind: 'unreachable' as const,
            reason: 'network-error' as const,
            durationMs: 1,
        })),
    };
});

vi.mock('../../config/bootstrapTenantConfig', () => ({
    getResolvedTenantConfig: vi.fn(() => ({ domain: 'learncard.app' })),
}));

import { Network } from '@capacitor/network';
import { App } from '@capacitor/app';
import { connectivityStore } from 'learn-card-base/stores/connectivityStore';
import {
    attachConnectivityMonitorToStore,
    createConnectivityMonitor,
} from 'learn-card-base/connectivity/connectivityMonitor';

import {
    resolveProbeTarget,
    createAppConnectivityAdapter,
    attachAppConnectivity,
    requestConnectivityCheck,
    getAppConnectivityMonitor,
    getAppProbeTarget,
    __resetAppConnectivityForTests,
    type AppConnectivityAdapterDeps,
    type MonitorFacade,
    type RemovableHandle,
} from './connectivity';

// jsdom's default origin — do not fight `window.location` redefinition.
const JSDOM_ORIGIN = 'http://localhost:3000';

// --- Fake monitor -----------------------------------------------------------

const makeFakeMonitor = (): MonitorFacade & {
    reports: boolean[];
    active: boolean[];
    checks: number;
    started: number;
    stopped: number;
} => {
    const fake = {
        reports: [] as boolean[],
        active: [] as boolean[],
        checks: 0,
        started: 0,
        stopped: 0,
        reportTransport: (connected: boolean) => fake.reports.push(connected),
        setActive: (active: boolean) => fake.active.push(active),
        check: () => {
            fake.checks += 1;
            return Promise.resolve('online' as const);
        },
        start: () => {
            fake.started += 1;
        },
        stop: () => {
            fake.stopped += 1;
        },
    };
    return fake;
};

// --- Deps factory -----------------------------------------------------------

const makeDeps = (
    overrides: Partial<AppConnectivityAdapterDeps> = {}
): AppConnectivityAdapterDeps => ({
    monitor: makeFakeMonitor(),
    isNative: () => false,
    addNetworkStatusListener: async () => ({ remove: vi.fn() }),
    getInitialTransportState: async () => true,
    addAppStateListener: null,
    ...overrides,
});

// Collected per-deps listener registrations, keyed off the deps object itself.
const listenerRegistry = new WeakMap<
    AppConnectivityAdapterDeps,
    { handler: (connected: boolean) => void; handle: RemovableHandle }[]
>();

const registeredListeners = (deps: AppConnectivityAdapterDeps) => {
    let list = listenerRegistry.get(deps);
    if (!list) {
        list = [];
        listenerRegistry.set(deps, list);
    }
    return list;
};

// Wraps `addNetworkStatusListener` so every registration is recorded against
// the TRACKED deps object — the object tests actually hold. Custom inner
// implementations (call-order probes, custom handles) are delegated to, never
// discarded.
const trackListenerDeps = (deps: AppConnectivityAdapterDeps): AppConnectivityAdapterDeps => {
    const tracked: AppConnectivityAdapterDeps = {
        ...deps,
        addNetworkStatusListener: async handler => {
            const handle = await deps.addNetworkStatusListener(handler);
            registeredListeners(tracked).push({ handler, handle });
            return handle;
        },
    };
    return tracked;
};

beforeEach(() => {
    vi.clearAllMocks();
    isNativePlatform.mockReturnValue(false);
    // Deterministic Capacitor defaults: without an implementation the adapter's
    // snapshot await resolves `getStatus()` to undefined and the resulting
    // TypeError (caught, but noisy) skips the initial report.
    (Network.getStatus as ReturnType<typeof vi.fn>).mockResolvedValue({ connected: true });
    (Network.addListener as ReturnType<typeof vi.fn>).mockResolvedValue({ remove: vi.fn() });
    (App.addListener as ReturnType<typeof vi.fn>).mockResolvedValue({ remove: vi.fn() });
    (App.getState as ReturnType<typeof vi.fn>).mockResolvedValue({ isActive: true });
});

afterEach(() => {
    __resetAppConnectivityForTests();
});

// ---------------------------------------------------------------------------

describe('resolveProbeTarget', () => {
    it('native always targets the remote HTTPS tenant domain — even in development', () => {
        const target = resolveProbeTarget({
            isNative: true,
            tenantDomain: 'learncard.app',
            appOrigin: 'http://localhost:3000',
        });
        expect(target).not.toBeNull();
        expect(target!.url).toBe('https://learncard.app/connectivity.txt');
    });

    it('native never probes the bundled origin (belt and braces)', () => {
        const target = resolveProbeTarget({
            isNative: true,
            tenantDomain: 'localhost',
            appOrigin: 'https://localhost',
        });
        expect(target).not.toBeNull();
        const parsed = new URL(target!.url);
        expect(['https://localhost', 'http://localhost', 'capacitor://localhost']).toContain(
            parsed.origin
        );
        expect(target!.disallowOrigins).toContain('https://localhost');
        expect(target!.disallowOrigins).toContain('capacitor://localhost');
        expect(target!.disallowOrigins).toContain('ionic://localhost');
    });

    it('native without a tenant domain yields no target (inconclusive, permissive)', () => {
        expect(
            resolveProbeTarget({ isNative: true, tenantDomain: null, appOrigin: null })
        ).toBeNull();
    });

    it('web targets the current origin', () => {
        const target = resolveProbeTarget({
            isNative: false,
            tenantDomain: 'learncard.app',
            appOrigin: 'https://learncard.app',
        });
        expect(target!.url).toBe('https://learncard.app/connectivity.txt');
    });

    it('web with no origin (SSR-ish) yields no target', () => {
        expect(
            resolveProbeTarget({ isNative: false, tenantDomain: null, appOrigin: null })
        ).toBeNull();
    });
});

describe('getAppProbeTarget (singleton wiring)', () => {
    it('web: probes the current (jsdom) origin over its own scheme', () => {
        const target = getAppProbeTarget();
        expect(target).not.toBeNull();
        expect(target!.url).toBe(`${JSDOM_ORIGIN}/connectivity.txt`);
    });

    it('native: probes the remote HTTPS tenant domain even though the dev origin is localhost', () => {
        isNativePlatform.mockReturnValue(true);
        expect(getAppProbeTarget()!.url).toBe('https://learncard.app/connectivity.txt');
    });

    it('native before tenant config is bootstrapped: no target, stays permissive', async () => {
        isNativePlatform.mockReturnValue(true);
        const { getResolvedTenantConfig } = await import('../../config/bootstrapTenantConfig');
        (getResolvedTenantConfig as ReturnType<typeof vi.fn>).mockImplementationOnce(() => {
            throw new Error('not bootstrapped yet');
        });
        expect(getAppProbeTarget()).toBeNull();
    });
});

describe('createAppConnectivityAdapter', () => {
    it('starts the monitor and registers the listener BEFORE the initial snapshot', async () => {
        const callOrder: string[] = [];
        const monitor = makeFakeMonitor();
        const deps = trackListenerDeps(
            makeDeps({
                monitor,
                addNetworkStatusListener: async () => {
                    callOrder.push('addListener');
                    return { remove: vi.fn() };
                },
                getInitialTransportState: async () => {
                    callOrder.push('getStatus');
                    return true;
                },
            })
        );

        createAppConnectivityAdapter(deps);
        await vi.waitFor(() => expect(monitor.reports).toEqual([true]));

        expect(monitor.started).toBe(1);
        expect(callOrder).toEqual(['addListener', 'getStatus']);
    });

    it('forwards transport hints from the listener to the monitor', async () => {
        const monitor = makeFakeMonitor();
        const deps = trackListenerDeps(makeDeps({ monitor }));

        createAppConnectivityAdapter(deps);
        // The initial snapshot resolves first; hints are forwarded verbatim
        // (the adapter callback contract is a plain boolean).
        await vi.waitFor(() => expect(monitor.reports).toEqual([true]));

        const handler = registeredListeners(deps)[0].handler;
        handler(false);
        handler(true);
        expect(monitor.reports).toEqual([true, false, true]);
    });

    it('dispose before the listener resolves removes the handle and reports nothing', async () => {
        const monitor = makeFakeMonitor();
        let resolveListener: (handle: RemovableHandle) => void = () => undefined;
        const deps = makeDeps({
            monitor,
            addNetworkStatusListener: () =>
                new Promise<RemovableHandle>(resolve => {
                    resolveListener = resolve;
                }),
        });

        const adapter = createAppConnectivityAdapter(deps);
        adapter.dispose();
        expect(monitor.stopped).toBe(1);

        const handle: RemovableHandle = { remove: vi.fn() };
        resolveListener(handle);
        await vi.waitFor(() => expect(handle.remove).toHaveBeenCalled());

        expect(monitor.reports).toEqual([]);
    });

    it('a late initial snapshot after dispose is ignored', async () => {
        const monitor = makeFakeMonitor();
        let resolveSnapshot: (connected: boolean) => void = () => undefined;
        const deps = trackListenerDeps(
            makeDeps({
                monitor,
                getInitialTransportState: () =>
                    new Promise<boolean>(resolve => {
                        resolveSnapshot = resolve;
                    }),
            })
        );

        const adapter = createAppConnectivityAdapter(deps);
        await vi.waitFor(() => expect(registeredListeners(deps)).toHaveLength(1));

        adapter.dispose();
        expect(monitor.stopped).toBe(1);

        resolveSnapshot(false); // stale snapshot arriving after dispose
        await new Promise(resolve => setTimeout(resolve, 10));
        expect(monitor.reports).toEqual([]); // nothing was ever reported
    });

    it('a listener hint newer than the in-flight initial snapshot wins — the stale snapshot is dropped', async () => {
        const monitor = makeFakeMonitor();
        let resolveSnapshot: (connected: boolean) => void = () => undefined;
        const deps = trackListenerDeps(
            makeDeps({
                monitor,
                getInitialTransportState: () =>
                    new Promise<boolean>(resolve => {
                        resolveSnapshot = resolve;
                    }),
            })
        );

        createAppConnectivityAdapter(deps);
        await vi.waitFor(() => expect(registeredListeners(deps)).toHaveLength(1));

        // A transport event arrives while the snapshot is still pending — it
        // is newer than the snapshot by definition (the listener was
        // registered first).
        registeredListeners(deps)[0].handler(false);
        expect(monitor.reports).toEqual([false]);

        // The older snapshot resolves; it must NOT override the newer event.
        resolveSnapshot(true);
        await new Promise(resolve => setTimeout(resolve, 10));
        expect(monitor.reports).toEqual([false]);
    });

    it('listener setup failure does not reject globally and the monitor still starts', async () => {
        const monitor = makeFakeMonitor();
        createAppConnectivityAdapter(
            makeDeps({
                monitor,
                addNetworkStatusListener: async () => {
                    throw new Error('listener registration exploded');
                },
            })
        );

        // Give the async registration a chance to run; no unhandled rejection.
        await new Promise(resolve => setTimeout(resolve, 10));
        expect(monitor.started).toBe(1);
        expect(monitor.reports).toEqual([]);
    });

    it('initializes activity from the current hidden state BEFORE starting the monitor', async () => {
        const monitor = makeFakeMonitor();
        const events: string[] = [];
        createAppConnectivityAdapter(
            makeDeps({
                monitor,
                getInitialActivity: async () => {
                    events.push('activity');
                    return false; // mounted while hidden/inactive
                },
            })
        );

        await vi.waitFor(() => expect(events).toContain('activity'));
        await vi.waitFor(() => expect(monitor.started).toBe(1));
        // The background mount gates automatic work BEFORE start: the shared
        // monitor suppresses its initial probe until a real resume.
        expect(monitor.active).toEqual([false]);
    });

    it('assumes foreground when the initial activity lookup fails', async () => {
        const monitor = makeFakeMonitor();
        createAppConnectivityAdapter(
            makeDeps({
                monitor,
                getInitialActivity: () => {
                    throw new Error('activity lookup exploded');
                },
            })
        );

        await vi.waitFor(() => expect(monitor.started).toBe(1));
        expect(monitor.active).toEqual([]); // never gated
    });

    it('native app state changes pause/resume via monitor.setActive', async () => {
        const monitor = makeFakeMonitor();
        // The adapter contract hands the listener a plain boolean (the real
        // Capacitor wiring unwraps `state.isActive` in buildAppConnectivityDeps).
        const appHandlers: ((active: boolean) => void)[] = [];
        createAppConnectivityAdapter(
            makeDeps({
                monitor,
                isNative: () => true,
                addAppStateListener: async handler => {
                    appHandlers.push(handler);
                    return { remove: vi.fn() };
                },
            })
        );
        await vi.waitFor(() => expect(appHandlers).toHaveLength(1));

        appHandlers[0](false);
        appHandlers[0](true);
        expect(monitor.active).toEqual([false, true]);
    });

    it('web focus triggers a coalesced check; visibility drives setActive', () => {
        const monitor = makeFakeMonitor();
        let hidden = false;
        const windowListeners = new Map<string, () => void>();
        createAppConnectivityAdapter(
            makeDeps({
                monitor,
                addWindowEventListener: (type, handler) => {
                    windowListeners.set(type, handler);
                    return () => windowListeners.delete(type);
                },
                isDocumentHidden: () => hidden,
            })
        );

        windowListeners.get('focus')!();
        expect(monitor.checks).toBe(1);

        windowListeners.get('visibilitychange')!(); // visible
        expect(monitor.active).toEqual([true]);

        hidden = true;
        windowListeners.get('visibilitychange')!(); // hidden
        expect(monitor.active).toEqual([true, false]);

        hidden = false;
        windowListeners.get('focus')!(); // still runs checks when visible
        expect(monitor.checks).toBe(2);
    });

    it('focus while the document is hidden does not check', () => {
        const monitor = makeFakeMonitor();
        const windowListeners = new Map<string, () => void>();
        createAppConnectivityAdapter(
            makeDeps({
                monitor,
                addWindowEventListener: (type, handler) => {
                    windowListeners.set(type, handler);
                    return () => undefined;
                },
                isDocumentHidden: () => true,
            })
        );

        windowListeners.get('focus')!();
        expect(monitor.checks).toBe(0);
    });

    it('dispose removes only owned handles, disposes window listeners, stops monitor once', async () => {
        const monitor = makeFakeMonitor();
        const removed: string[] = [];
        const adapter = createAppConnectivityAdapter(
            makeDeps({
                monitor,
                addNetworkStatusListener: async () => ({
                    remove: async () => {
                        removed.push('network');
                    },
                }),
                addAppStateListener: async () => ({
                    remove: async () => {
                        removed.push('app-state');
                    },
                }),
                addWindowEventListener: (type, handler) => {
                    void handler;
                    return () => {
                        removed.push(`window:${type}`);
                    };
                },
            })
        );

        adapter.dispose();
        await vi.waitFor(() =>
            expect(removed.sort()).toEqual([
                'app-state',
                'network',
                'window:focus',
                'window:visibilitychange',
            ])
        );
        expect(monitor.stopped).toBe(1);

        adapter.dispose(); // idempotent
        expect(monitor.stopped).toBe(1);
    });
});

describe('attachAppConnectivity (ref-counted singleton lifecycle)', () => {
    it('two attaches share one listener; the last dispose removes it', async () => {
        isNativePlatform.mockReturnValue(true);
        const networkHandleRemove = vi.fn();
        (Network.addListener as ReturnType<typeof vi.fn>).mockImplementation(
            async (_event: string, _handler: unknown) => ({ remove: networkHandleRemove })
        );

        const dispose1 = attachAppConnectivity();
        const dispose2 = attachAppConnectivity();

        await vi.waitFor(() => expect(Network.addListener).toHaveBeenCalledTimes(1));
        expect(App.addListener).toHaveBeenCalledTimes(1);

        dispose1();
        await new Promise(resolve => setTimeout(resolve, 10));
        expect(networkHandleRemove).not.toHaveBeenCalled(); // still attached

        dispose2();
        await vi.waitFor(() => expect(networkHandleRemove).toHaveBeenCalledTimes(1));
        await vi.waitFor(() => expect(App.addListener).toHaveBeenCalledTimes(1)); // single registration
    });

    it('double dispose of the same attach token is a no-op', async () => {
        isNativePlatform.mockReturnValue(true);
        (Network.addListener as ReturnType<typeof vi.fn>).mockResolvedValue({ remove: vi.fn() });

        const dispose = attachAppConnectivity();
        await vi.waitFor(() => expect(Network.addListener).toHaveBeenCalledTimes(1));

        dispose();
        dispose();
        await new Promise(resolve => setTimeout(resolve, 10));
        expect(Network.addListener).toHaveBeenCalledTimes(1); // no re-registration
    });

    it('requestConnectivityCheck funnels through the singleton monitor check', async () => {
        const monitor = getAppConnectivityMonitor();
        const checkSpy = vi.spyOn(monitor, 'check');

        const status = await requestConnectivityCheck();
        expect(status).toBe('unknown'); // not started → resolves current status
        expect(checkSpy).toHaveBeenCalledTimes(1);
    });

    it('native: attaching while inactive gates the initial probe until resume', async () => {
        isNativePlatform.mockReturnValue(true);
        (App.getState as ReturnType<typeof vi.fn>).mockResolvedValue({ isActive: false });

        const monitor = getAppConnectivityMonitor();
        const startSpy = vi.spyOn(monitor, 'start');
        const dispose = attachAppConnectivity();
        await vi.waitFor(() => expect(startSpy).toHaveBeenCalled());
        await new Promise(resolve => setTimeout(resolve, 10));

        // The initial verification was suppressed: no probe was launched
        // from the background. (App.getState() drove setActive(false)
        // before start — behavior verified against the REAL monitor.)
        const { probeConnectivity } = await import(
            'learn-card-base/connectivity/probeConnectivity'
        );
        expect(probeConnectivity).not.toHaveBeenCalled();

        // A resume (setActive(true)) then launches exactly one fresh probe.
        monitor.setActive(true);
        await new Promise(resolve => setTimeout(resolve, 10));
        expect(probeConnectivity).toHaveBeenCalledTimes(1);

        dispose();
    });
});

describe('store bridge', () => {
    it('monitor state (hints + verified probe outcomes) is mirrored into connectivityStore', async () => {
        connectivityStore.set.status('unknown');

        const monitor = createConnectivityMonitor({
            getProbeTarget: () => ({ url: 'https://learncard.app/connectivity.txt' }),
            probe: async () => ({ kind: 'unreachable', reason: 'network-error', durationMs: 1 }),
        });
        // The store bridge mirrors whatever the monitor publishes; attach it
        // BEFORE start (same order as the production singleton), then start —
        // hints are deliberately ignored until the monitor is running.
        const detach = attachConnectivityMonitorToStore(monitor);
        monitor.start();
        try {
            // Positive hint restores online optimistically.
            monitor.reportTransport(true);
            expect(connectivityStore.get.status()).toBe('online');

            // A verified-probe outcome (unreachable) then sets offline.
            const status = await monitor.check();
            expect(status).toBe('offline');
            expect(connectivityStore.get.status()).toBe('offline');
            expect(connectivityStore.get.lastDiagnosticReason()).toContain('unreachable');
        } finally {
            detach();
            monitor.stop();
            connectivityStore.set.status('unknown');
        }
    });
});
