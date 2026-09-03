// @vitest-environment jsdom

import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

import type { LCR } from 'learn-card-base/types/credential-records';

/**
 * Foreground credential refresh listener tests (LC-2117/LC-2135/LC-2136 Task 11).
 *
 * Capacitor app state, LaunchDarkly flags, auth state, the wallet, and the refresh
 * mutation are stubbed. The real candidate-discovery, staleness, and bounded-
 * concurrency helpers from `learn-card-base/react-query/queries/credentialRefresh`
 * run against the fake wallet, so 24-hour staleness, lazy `refreshService`
 * discovery, and per-record isolation are genuinely exercised.
 */

const flags = vi.hoisted(() => ({ value: {} as Record<string, unknown> }));

const authState = vi.hoisted(() => ({ isLoggedIn: true }));

const appHost = vi.hoisted(() => ({
    addListener: vi.fn(),
    handles: [] as Array<{ remove: ReturnType<typeof vi.fn> }>,
}));

const walletHost = vi.hoisted(() => ({
    indexGet: vi.fn(),
    readGet: vi.fn(),
}));

const mutationHost = vi.hoisted(() => ({
    mutateAsync: vi.fn(),
}));

const loggerHost = vi.hoisted(() => ({
    warn: vi.fn(),
    error: vi.fn(),
}));

vi.mock('@capacitor/app', () => ({
    App: { addListener: appHost.addListener },
}));

vi.mock('launchdarkly-react-client-sdk', () => ({
    useFlags: () => flags.value,
}));

// The learn-card-base barrel pulls the web3auth stack and cannot load under jsdom;
// stub the exact surface the listener consumes. The candidate-discovery module is
// imported by the listener through its subpath and therefore stays real — as does
// its logging import, which is intercepted by resolved path below.
vi.mock('learn-card-base/logging/logger', () => ({
    getLogger: () => ({
        debug: vi.fn(),
        info: vi.fn(),
        warn: loggerHost.warn,
        error: loggerHost.error,
    }),
}));

vi.mock('learn-card-base', () => ({
    getLogger: () => ({
        debug: vi.fn(),
        info: vi.fn(),
        warn: loggerHost.warn,
        error: loggerHost.error,
    }),
    switchedProfileStore: { use: { switchedDid: () => null } },
    useIsLoggedIn: () => authState.isLoggedIn,
    useWallet: () => ({
        initWallet: async () => ({
            index: { LearnCloud: { get: walletHost.indexGet } },
            read: { get: walletHost.readGet },
        }),
    }),
    useRefreshLearnCloudCredentialMutation: () => ({ mutateAsync: mutationHost.mutateAsync }),
}));

import CredentialRefreshListener, {
    CREDENTIAL_REFRESH_FOREGROUND_FLAG,
    resetCredentialRefreshSessionForTests,
    useForceRefreshLearnCloudCredential,
} from './CredentialRefreshListener';

const HOUR_MS = 60 * 60 * 1000;

let appStateChangeCallback: ((state: { isActive: boolean }) => void) | undefined;

const makeRecord = (overrides: Record<string, unknown> = {}): LCR =>
    ({
        id: 'rec-1',
        uri: 'lc:cloud:cred-1',
        category: 'Achievement',
        ...overrides,
    } as unknown as LCR);

const staleMetadata = (overrides: Record<string, unknown> = {}) => ({
    serviceId: 'https://refresh.example.com/refresh/abc',
    serviceType: '1EdTechCredentialRefresh',
    credentialId: 'urn:uuid:cred-1',
    lastCheckedAt: new Date(Date.now() - 25 * HOUR_MS).toISOString(),
    history: [],
    ...overrides,
});

const makeRefreshableVc = (id = 'urn:uuid:cred-1') => ({
    '@context': ['https://www.w3.org/ns/credentials/v2'],
    type: ['VerifiableCredential'],
    id,
    issuer: 'did:example:issuer',
    validFrom: '2026-01-01T00:00:00.000Z',
    credentialSubject: { id: 'did:example:holder' },
    refreshService: {
        id: 'https://refresh.example.com/refresh/abc',
        type: '1EdTechCredentialRefresh',
    },
});

const makePlainVc = (id = 'urn:uuid:plain-1') => ({
    '@context': ['https://www.w3.org/ns/credentials/v2'],
    type: ['VerifiableCredential'],
    id,
    issuer: 'did:example:issuer',
    validFrom: '2026-01-01T00:00:00.000Z',
    credentialSubject: { id: 'did:example:holder' },
});

const setDocumentVisibility = (value: 'visible' | 'hidden') => {
    Object.defineProperty(document, 'visibilityState', { value, configurable: true });
};

const flushMicrotasks = async () => {
    await act(async () => {
        await Promise.resolve();
    });
};

describe('CredentialRefreshListener', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        resetCredentialRefreshSessionForTests();

        flags.value = { [CREDENTIAL_REFRESH_FOREGROUND_FLAG]: true };
        authState.isLoggedIn = true;
        appStateChangeCallback = undefined;
        appHost.handles.length = 0;

        appHost.addListener.mockImplementation((event: string, callback: any) => {
            if (event === 'appStateChange') appStateChangeCallback = callback;

            const handle = { remove: vi.fn(async () => undefined) };

            appHost.handles.push(handle);

            return Promise.resolve(handle);
        });

        walletHost.indexGet.mockResolvedValue([]);
        walletHost.readGet.mockResolvedValue(undefined);
        mutationHost.mutateAsync.mockResolvedValue({ status: 'unchanged' });

        setDocumentVisibility('visible');
    });

    afterEach(() => {
        cleanup();
        setDocumentVisibility('visible');
    });

    it('runs an initial foreground scan and refreshes stale records on mount', async () => {
        const staleRecord = makeRecord({ id: 'rec-stale', refresh: staleMetadata() });

        walletHost.indexGet.mockResolvedValue([staleRecord]);

        render(<CredentialRefreshListener />);

        await waitFor(() => expect(mutationHost.mutateAsync).toHaveBeenCalledTimes(1));

        const [variables] = mutationHost.mutateAsync.mock.calls[0];

        expect(variables.record).toEqual(expect.objectContaining({ id: 'rec-stale' }));
        // Ordinary scans never bypass the per-record staleness guard.
        expect(variables.force).toBeUndefined();
    });

    it('runs the ordinary scan only once per session, ignoring later foreground events', async () => {
        walletHost.indexGet.mockResolvedValue([makeRecord({ refresh: staleMetadata() })]);

        render(<CredentialRefreshListener />);

        await waitFor(() => expect(mutationHost.mutateAsync).toHaveBeenCalledTimes(1));

        await act(async () => {
            window.dispatchEvent(new Event('focus'));
            appStateChangeCallback?.({ isActive: true });
            document.dispatchEvent(new Event('visibilitychange'));
        });
        await flushMicrotasks();

        expect(walletHost.indexGet).toHaveBeenCalledTimes(1);
        expect(mutationHost.mutateAsync).toHaveBeenCalledTimes(1);
    });

    it('only refreshes records stale by 24 hours', async () => {
        const freshRecord = makeRecord({
            id: 'rec-fresh',
            refresh: staleMetadata({
                lastCheckedAt: new Date(Date.now() - 1 * HOUR_MS).toISOString(),
            }),
        });
        const staleRecord = makeRecord({ id: 'rec-stale', refresh: staleMetadata() });
        const neverCheckedRecord = makeRecord({
            id: 'rec-never-checked',
            refresh: staleMetadata({ lastCheckedAt: undefined }),
        });

        walletHost.indexGet.mockResolvedValue([freshRecord, staleRecord, neverCheckedRecord]);

        render(<CredentialRefreshListener />);

        await waitFor(() => expect(mutationHost.mutateAsync).toHaveBeenCalledTimes(2));

        const refreshedIds = mutationHost.mutateAsync.mock.calls.map(
            ([variables]) => variables.record.id
        );

        expect(refreshedIds).toEqual(expect.arrayContaining(['rec-stale', 'rec-never-checked']));
        expect(refreshedIds).not.toContain('rec-fresh');
    });

    it('discovers refreshable credentials lazily from records without refresh metadata', async () => {
        const refreshableRecord = makeRecord({ id: 'rec-lazy', uri: 'lc:cloud:lazy' });
        const plainRecord = makeRecord({ id: 'rec-plain', uri: 'lc:cloud:plain' });

        walletHost.indexGet.mockResolvedValue([refreshableRecord, plainRecord]);
        walletHost.readGet.mockImplementation(async (uri: string) =>
            uri === 'lc:cloud:lazy' ? makeRefreshableVc() : makePlainVc()
        );

        render(<CredentialRefreshListener />);

        await waitFor(() => expect(mutationHost.mutateAsync).toHaveBeenCalledTimes(1));

        const [variables] = mutationHost.mutateAsync.mock.calls[0];

        expect(variables.record).toEqual(expect.objectContaining({ id: 'rec-lazy' }));
    });

    it('isolates lazy-discovery read failures per record', async () => {
        const unreadableRecord = makeRecord({ id: 'rec-unreadable', uri: 'lc:cloud:broken' });
        const refreshableRecord = makeRecord({ id: 'rec-lazy', uri: 'lc:cloud:lazy' });

        walletHost.indexGet.mockResolvedValue([unreadableRecord, refreshableRecord]);
        walletHost.readGet.mockImplementation(async (uri: string) => {
            if (uri === 'lc:cloud:broken') throw new Error('decrypt failed');

            return makeRefreshableVc();
        });

        render(<CredentialRefreshListener />);

        await waitFor(() => expect(mutationHost.mutateAsync).toHaveBeenCalledTimes(1));

        const [variables] = mutationHost.mutateAsync.mock.calls[0];

        expect(variables.record).toEqual(expect.objectContaining({ id: 'rec-lazy' }));
        await waitFor(() =>
            expect(loggerHost.warn).toHaveBeenCalledWith(
                'refresh.discovery.read-failed',
                expect.any(Error)
            )
        );
    });

    it('ignores background events and retries on the next foreground event after a failed scan', async () => {
        walletHost.indexGet.mockRejectedValueOnce(new Error('offline'));

        render(<CredentialRefreshListener />);

        await waitFor(() => expect(walletHost.indexGet).toHaveBeenCalledTimes(1));
        await waitFor(() =>
            expect(loggerHost.error).toHaveBeenCalledWith('refresh.scan.failed', expect.any(Error))
        );

        // The failed scan did not consume the one ordinary scan for the session, so
        // background events must still be ignored while a foreground event retries.
        await act(async () => {
            appStateChangeCallback?.({ isActive: false });
        });
        await act(async () => {
            setDocumentVisibility('hidden');
            document.dispatchEvent(new Event('visibilitychange'));
        });
        await flushMicrotasks();

        expect(walletHost.indexGet).toHaveBeenCalledTimes(1);

        walletHost.indexGet.mockResolvedValue([makeRecord({ refresh: staleMetadata() })]);

        await act(async () => {
            appStateChangeCallback?.({ isActive: true });
        });

        await waitFor(() => expect(mutationHost.mutateAsync).toHaveBeenCalledTimes(1));
        expect(walletHost.indexGet).toHaveBeenCalledTimes(2);
    });

    it('processes records with bounded concurrency', async () => {
        const records = [1, 2, 3, 4, 5].map(index =>
            makeRecord({ id: `rec-${index}`, refresh: staleMetadata() })
        );

        walletHost.indexGet.mockResolvedValue(records);

        let inFlight = 0;
        let maxInFlight = 0;
        const resolvers: Array<() => void> = [];

        mutationHost.mutateAsync.mockImplementation(
            () =>
                new Promise(resolve => {
                    inFlight += 1;
                    maxInFlight = Math.max(maxInFlight, inFlight);
                    resolvers.push(() => {
                        inFlight -= 1;
                        resolve({ status: 'unchanged' });
                    });
                })
        );

        render(<CredentialRefreshListener />);

        await waitFor(() => expect(mutationHost.mutateAsync).toHaveBeenCalledTimes(3));
        expect(maxInFlight).toBe(3);

        await act(async () => {
            while (resolvers.length > 0) resolvers.shift()!();
        });

        await waitFor(() => expect(mutationHost.mutateAsync).toHaveBeenCalledTimes(5));

        await act(async () => {
            while (resolvers.length > 0) resolvers.shift()!();
        });

        await waitFor(() => expect(inFlight).toBe(0));
        expect(maxInFlight).toBe(3);
    });

    it('isolates per-record refresh failures without interrupting the scan', async () => {
        const failingRecord = makeRecord({ id: 'rec-fail', refresh: staleMetadata() });
        const healthyRecord = makeRecord({ id: 'rec-healthy', refresh: staleMetadata() });

        walletHost.indexGet.mockResolvedValue([failingRecord, healthyRecord]);
        mutationHost.mutateAsync.mockImplementation(({ record }: { record: LCR }) =>
            record.id === 'rec-fail'
                ? Promise.reject(new Error('upload exploded'))
                : Promise.resolve({ status: 'unchanged', record })
        );

        render(<CredentialRefreshListener />);

        await waitFor(() => expect(mutationHost.mutateAsync).toHaveBeenCalledTimes(2));

        const refreshedIds = mutationHost.mutateAsync.mock.calls.map(
            ([variables]) => variables.record.id
        );

        expect(refreshedIds).toEqual(expect.arrayContaining(['rec-fail', 'rec-healthy']));

        await waitFor(() =>
            expect(loggerHost.error).toHaveBeenCalledWith(
                'refresh.scan.record-failed',
                expect.any(Error)
            )
        );
    });

    it('removes listeners and stops scanning when unmounted', async () => {
        walletHost.indexGet.mockResolvedValue([makeRecord({ refresh: staleMetadata() })]);

        const { unmount } = render(<CredentialRefreshListener />);

        await waitFor(() => expect(mutationHost.mutateAsync).toHaveBeenCalledTimes(1));

        unmount();

        expect(appHost.handles.length).toBeGreaterThan(0);

        for (const handle of appHost.handles) {
            expect(handle.remove).toHaveBeenCalled();
        }

        await act(async () => {
            appStateChangeCallback?.({ isActive: true });
            window.dispatchEvent(new Event('focus'));
        });
        await flushMicrotasks();

        expect(walletHost.indexGet).toHaveBeenCalledTimes(1);
        expect(mutationHost.mutateAsync).toHaveBeenCalledTimes(1);
    });

    it('does nothing when the feature flag is disabled', async () => {
        flags.value = {};

        render(<CredentialRefreshListener />);
        await flushMicrotasks();

        expect(appHost.addListener).not.toHaveBeenCalled();
        expect(walletHost.indexGet).not.toHaveBeenCalled();
        expect(mutationHost.mutateAsync).not.toHaveBeenCalled();
    });

    it('does nothing when logged out', async () => {
        authState.isLoggedIn = false;

        render(<CredentialRefreshListener />);
        await flushMicrotasks();

        expect(appHost.addListener).not.toHaveBeenCalled();
        expect(walletHost.indexGet).not.toHaveBeenCalled();
        expect(mutationHost.mutateAsync).not.toHaveBeenCalled();
    });
});

describe('useForceRefreshLearnCloudCredential', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mutationHost.mutateAsync.mockResolvedValue({ status: 'unchanged' });
    });

    it('calls the refresh mutation with force: true for detail views and notification taps', async () => {
        const record = makeRecord({ id: 'rec-forced', refresh: staleMetadata() });

        const Probe: React.FC = () => {
            const { forceRefresh } = useForceRefreshLearnCloudCredential();

            return <button onClick={() => forceRefresh(record)}>force refresh</button>;
        };

        render(<Probe />);

        fireEvent.click(screen.getByText('force refresh'));

        await waitFor(() =>
            expect(mutationHost.mutateAsync).toHaveBeenCalledWith({ record, force: true })
        );
    });
});
