import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { LCNNotificationTypeEnumValidator } from '@learncard/types';
import type { VC } from '@learncard/types';
import type { BespokeLearnCard } from 'learn-card-base/types/learn-card';

// `learn-card-base` cannot load under jsdom in this app's vitest config (it pulls
// the web3auth/ethereum stack), so every hook/helper it exports is stubbed —
// matching the established pattern in `useFeedbackBusyState.test.tsx`.
const mocks = vi.hoisted(() => ({
    wallet: {
        id: { did: () => 'did:user' },
        read: { get: vi.fn() },
        invoke: {
            verifyCredential: vi.fn(),
            transcriptsMarkReceived: vi.fn().mockResolvedValue(undefined),
        },
    },
    initWallet: vi.fn(),
    addVCtoWallet: vi.fn().mockResolvedValue(true),
    claimIncomingCredential: vi.fn().mockResolvedValue({ added: true, accepted: true }),
    incomingCredentials: {
        data: undefined as Array<{ uri: string; from: string }> | undefined,
        refetch: vi.fn(),
    },
    track: vi.fn(),
    invalidateQueries: vi.fn(),
    appStateHandler: undefined as ((state: { isActive: boolean }) => void) | undefined,
    pushHandler: undefined as ((payload: unknown) => void) | undefined,
}));

// `mocks.wallet` is a minimal, mutable mock surface; this typed view is what gets
// passed into production call sites that expect a real `BespokeLearnCard`.
const wallet = mocks.wallet as unknown as BespokeLearnCard;

vi.mock('learn-card-base', () => ({
    useWallet: () => ({ initWallet: mocks.initWallet, addVCtoWallet: mocks.addVCtoWallet }),
    useGetIncomingCredentials: () => mocks.incomingCredentials,
    claimIncomingCredential: mocks.claimIncomingCredential,
    parseForegroundPushNotification: (payload: { type?: string }) => payload ?? null,
    getLogger: () => ({
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        debug: vi.fn(),
    }),
}));

vi.mock('@analytics', () => ({
    useAnalytics: () => ({ track: mocks.track }),
    AnalyticsEvents: { TRANSCRIPT_ARRIVED: 'transcript_arrived' },
}));

vi.mock('@tanstack/react-query', () => ({
    useQueryClient: () => ({ invalidateQueries: mocks.invalidateQueries }),
}));

vi.mock('@capacitor/app', () => ({
    App: {
        addListener: vi.fn((_event: string, handler: (state: { isActive: boolean }) => void) => {
            mocks.appStateHandler = handler;
            return Promise.resolve({ remove: vi.fn() });
        }),
    },
}));

vi.mock('@capacitor/push-notifications', () => ({
    PushNotifications: {
        addListener: vi.fn((_event: string, handler: (payload: unknown) => void) => {
            mocks.pushHandler = handler;
            return Promise.resolve({ remove: vi.fn() });
        }),
    },
}));

import { isMatchingTranscript, useTranscriptArrival } from './useTranscriptArrival';

const ISSUER_DID = 'did:issuer';
const USER_DID = 'did:user';
const REQUESTED_AT = '2024-01-01T00:00:00.000Z';
const VALID_VC = {
    type: ['VerifiableCredential', 'ClrCredential'],
    credentialSubject: { id: USER_DID },
    validFrom: '2024-01-02T00:00:00.000Z',
} as unknown as VC;

describe('isMatchingTranscript', () => {
    beforeEach(() => {
        mocks.wallet.invoke.verifyCredential.mockReset();
        mocks.wallet.invoke.verifyCredential.mockResolvedValue({ warnings: [], errors: [] });
    });

    it('matches a credential satisfying every rule', async () => {
        await expect(
            isMatchingTranscript(VALID_VC, ISSUER_DID, ISSUER_DID, USER_DID, REQUESTED_AT, wallet)
        ).resolves.toBe(true);
    });

    it('rejects a credential from the wrong sender', async () => {
        await expect(
            isMatchingTranscript(VALID_VC, 'did:wrong', ISSUER_DID, USER_DID, REQUESTED_AT, wallet)
        ).resolves.toBe(false);
    });

    it('rejects a credential missing the ClrCredential type', async () => {
        const vc = { ...VALID_VC, type: ['VerifiableCredential'] };
        await expect(
            isMatchingTranscript(vc, ISSUER_DID, ISSUER_DID, USER_DID, REQUESTED_AT, wallet)
        ).resolves.toBe(false);
    });

    it('rejects a credential for the wrong subject', async () => {
        const vc = { ...VALID_VC, credentialSubject: { id: 'did:someone-else' } };
        await expect(
            isMatchingTranscript(vc, ISSUER_DID, ISSUER_DID, USER_DID, REQUESTED_AT, wallet)
        ).resolves.toBe(false);
    });

    it('rejects a credential issued before the request', async () => {
        const vc = { ...VALID_VC, validFrom: '2023-12-31T00:00:00.000Z' };
        await expect(
            isMatchingTranscript(vc, ISSUER_DID, ISSUER_DID, USER_DID, REQUESTED_AT, wallet)
        ).resolves.toBe(false);
    });

    it('rejects a credential that fails verification (errors)', async () => {
        mocks.wallet.invoke.verifyCredential.mockResolvedValue({
            warnings: [],
            errors: ['bad proof'],
        });
        await expect(
            isMatchingTranscript(VALID_VC, ISSUER_DID, ISSUER_DID, USER_DID, REQUESTED_AT, wallet)
        ).resolves.toBe(false);
    });

    it('rejects a credential that fails verification (warnings)', async () => {
        mocks.wallet.invoke.verifyCredential.mockResolvedValue({
            warnings: ['revoked'],
            errors: [],
        });
        await expect(
            isMatchingTranscript(VALID_VC, ISSUER_DID, ISSUER_DID, USER_DID, REQUESTED_AT, wallet)
        ).resolves.toBe(false);
    });

    it('rejects a credential when verification throws', async () => {
        mocks.wallet.invoke.verifyCredential.mockRejectedValue(new Error('network error'));
        await expect(
            isMatchingTranscript(VALID_VC, ISSUER_DID, ISSUER_DID, USER_DID, REQUESTED_AT, wallet)
        ).resolves.toBe(false);
    });
});

describe('useTranscriptArrival', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        mocks.initWallet.mockResolvedValue(wallet);
        mocks.wallet.read.get.mockReset();
        mocks.wallet.invoke.verifyCredential
            .mockReset()
            .mockResolvedValue({ warnings: [], errors: [] });
        mocks.wallet.invoke.transcriptsMarkReceived.mockClear();
        mocks.addVCtoWallet.mockClear();
        mocks.claimIncomingCredential.mockClear();
        mocks.track.mockClear();
        mocks.invalidateQueries.mockClear();
        mocks.incomingCredentials.data = undefined;
        mocks.incomingCredentials.refetch.mockClear();
        mocks.appStateHandler = undefined;
        mocks.pushHandler = undefined;
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    const activeParams = {
        status: 'requested' as const,
        issuerDid: ISSUER_DID,
        requestId: 'req-1',
        requestedAt: REQUESTED_AT,
        receivedAt: undefined,
    };

    it('does nothing when inactive (no status) — no listeners, no claim', async () => {
        mocks.incomingCredentials.data = [{ uri: 'u1', from: ISSUER_DID }];
        mocks.wallet.read.get.mockResolvedValue(VALID_VC);

        renderHook(() => useTranscriptArrival({ ...activeParams, status: undefined }));
        await vi.advanceTimersByTimeAsync(0);

        expect(mocks.claimIncomingCredential).not.toHaveBeenCalled();
        expect(mocks.appStateHandler).toBeUndefined();
        expect(mocks.pushHandler).toBeUndefined();
    });

    it('does nothing once a receivedAt is already set', async () => {
        mocks.incomingCredentials.data = [{ uri: 'u1', from: ISSUER_DID }];
        mocks.wallet.read.get.mockResolvedValue(VALID_VC);

        renderHook(() =>
            useTranscriptArrival({ ...activeParams, receivedAt: '2024-01-03T00:00:00.000Z' })
        );
        await vi.advanceTimersByTimeAsync(0);

        expect(mocks.claimIncomingCredential).not.toHaveBeenCalled();
    });

    it('ignores a non-matching credential (wrong sender) and leaves the request outstanding', async () => {
        mocks.incomingCredentials.data = [{ uri: 'u1', from: 'did:wrong' }];
        mocks.wallet.read.get.mockResolvedValue(VALID_VC);

        renderHook(() => useTranscriptArrival(activeParams));
        await vi.waitFor(() => expect(mocks.wallet.read.get).toHaveBeenCalled());

        expect(mocks.claimIncomingCredential).not.toHaveBeenCalled();
        expect(mocks.wallet.invoke.transcriptsMarkReceived).not.toHaveBeenCalled();
    });

    it('claims a matching transcript exactly once: adds, marks received, invalidates, tracks arrival', async () => {
        mocks.incomingCredentials.data = [{ uri: 'u1', from: ISSUER_DID }];
        mocks.wallet.read.get.mockResolvedValue(VALID_VC);

        const { rerender } = renderHook(props => useTranscriptArrival(props), {
            initialProps: activeParams,
        });

        await vi.waitFor(() => expect(mocks.claimIncomingCredential).toHaveBeenCalledTimes(1));

        expect(mocks.claimIncomingCredential).toHaveBeenCalledWith(
            expect.objectContaining({ uri: 'u1', wallet })
        );
        expect(mocks.wallet.invoke.transcriptsMarkReceived).toHaveBeenCalledWith({
            requestId: 'req-1',
        });
        expect(mocks.invalidateQueries).toHaveBeenCalled();
        expect(mocks.track).toHaveBeenCalledWith('transcript_arrived', {});

        // A later refetch that still includes the same matching credential (e.g. a
        // slow second poll tick) must never trigger a second claim for one request.
        rerender({ ...activeParams });
        mocks.incomingCredentials.data = [{ uri: 'u1', from: ISSUER_DID }];
        rerender({ ...activeParams });
        await Promise.resolve();

        expect(mocks.claimIncomingCredential).toHaveBeenCalledTimes(1);
    });

    it('resets the accept guard when a new request starts', async () => {
        mocks.incomingCredentials.data = [{ uri: 'u1', from: ISSUER_DID }];
        mocks.wallet.read.get.mockResolvedValue(VALID_VC);

        const { rerender } = renderHook(props => useTranscriptArrival(props), {
            initialProps: activeParams,
        });
        await vi.waitFor(() => expect(mocks.claimIncomingCredential).toHaveBeenCalledTimes(1));

        mocks.incomingCredentials.data = [{ uri: 'u2', from: ISSUER_DID }];
        rerender({ ...activeParams, requestId: 'req-2', receivedAt: undefined });

        await vi.waitFor(() => expect(mocks.claimIncomingCredential).toHaveBeenCalledTimes(2));
        expect(mocks.claimIncomingCredential).toHaveBeenLastCalledWith(
            expect.objectContaining({ uri: 'u2' })
        );
    });

    it('polls every 5s for the first minute, then backs off to 60s, and stops after 15 minutes', async () => {
        mocks.incomingCredentials.data = undefined;

        renderHook(() => useTranscriptArrival(activeParams));

        // First minute: 5s cadence.
        await vi.advanceTimersByTimeAsync(5_000);
        expect(mocks.incomingCredentials.refetch).toHaveBeenCalledTimes(1);
        await vi.advanceTimersByTimeAsync(5_000);
        expect(mocks.incomingCredentials.refetch).toHaveBeenCalledTimes(2);

        // Cross into the backoff window (60s total elapsed): subsequent ticks are 60s apart.
        await vi.advanceTimersByTimeAsync(50_000); // t=60s
        const callsAtOneMinute = mocks.incomingCredentials.refetch.mock.calls.length;
        await vi.advanceTimersByTimeAsync(30_000); // t=90s — too soon for another 60s tick
        expect(mocks.incomingCredentials.refetch.mock.calls.length).toBe(callsAtOneMinute);
        await vi.advanceTimersByTimeAsync(30_000); // t=120s
        expect(mocks.incomingCredentials.refetch.mock.calls.length).toBeGreaterThan(
            callsAtOneMinute
        );

        // Stop polling after 15 minutes total.
        await vi.advanceTimersByTimeAsync(15 * 60_000);
        const callsAtStop = mocks.incomingCredentials.refetch.mock.calls.length;
        await vi.advanceTimersByTimeAsync(5 * 60_000);
        expect(mocks.incomingCredentials.refetch.mock.calls.length).toBe(callsAtStop);
    });

    it('refetches on app foreground/resume', async () => {
        renderHook(() => useTranscriptArrival(activeParams));
        await vi.waitFor(() => expect(mocks.appStateHandler).toBeDefined());

        mocks.incomingCredentials.refetch.mockClear();
        mocks.appStateHandler?.({ isActive: true });
        expect(mocks.incomingCredentials.refetch).toHaveBeenCalledTimes(1);

        mocks.incomingCredentials.refetch.mockClear();
        mocks.appStateHandler?.({ isActive: false });
        expect(mocks.incomingCredentials.refetch).not.toHaveBeenCalled();
    });

    it('refetches on a foreground CREDENTIAL_RECEIVED push, ignoring other push types', async () => {
        renderHook(() => useTranscriptArrival(activeParams));
        await vi.waitFor(() => expect(mocks.pushHandler).toBeDefined());

        mocks.incomingCredentials.refetch.mockClear();
        mocks.pushHandler?.({ type: LCNNotificationTypeEnumValidator.enum.CONNECTION_REQUEST });
        expect(mocks.incomingCredentials.refetch).not.toHaveBeenCalled();

        mocks.pushHandler?.({ type: LCNNotificationTypeEnumValidator.enum.CREDENTIAL_RECEIVED });
        expect(mocks.incomingCredentials.refetch).toHaveBeenCalledTimes(1);
    });
});
