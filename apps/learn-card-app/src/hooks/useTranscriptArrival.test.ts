import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
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
            getReceivedCredentials: vi.fn().mockResolvedValue([]),
            // Must never be needed: the sender is matched by profileId, not looked up.
            getProfile: vi.fn(),
        },
    },
    initWallet: vi.fn(),
    addVCtoWallet: vi.fn().mockResolvedValue(true),
    /** Real useWallet returns new function identities on every render. */
    unstableWalletFns: false,
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

/**
 * In-memory Storage: Node 25 ships an experimental global `localStorage` that
 * shadows jsdom's and lacks `clear()`, so the hook's persistence is exercised
 * against this deterministic stand-in instead.
 */
const createMemoryStorage = (): Storage => {
    const store = new Map<string, string>();
    return {
        get length() {
            return store.size;
        },
        clear: () => store.clear(),
        getItem: (key: string) => store.get(key) ?? null,
        key: (index: number) => [...store.keys()][index] ?? null,
        removeItem: (key: string) => void store.delete(key),
        setItem: (key: string, value: string) => void store.set(key, String(value)),
    };
};
vi.stubGlobal('localStorage', createMemoryStorage());

// `mocks.wallet` is a minimal, mutable mock surface; this typed view is what gets
// passed into production call sites that expect a real `BespokeLearnCard`.
const wallet = mocks.wallet as unknown as BespokeLearnCard;

vi.mock('learn-card-base', () => ({
    useWallet: () =>
        mocks.unstableWalletFns
            ? {
                  initWallet: (...args: unknown[]) => mocks.initWallet(...args),
                  addVCtoWallet: (...args: unknown[]) => mocks.addVCtoWallet(...args),
              }
            : { initWallet: mocks.initWallet, addVCtoWallet: mocks.addVCtoWallet },
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

// Like the real QueryClient, the same instance on every render.
const queryClient = { invalidateQueries: mocks.invalidateQueries };
vi.mock('@tanstack/react-query', () => ({
    useQueryClient: () => queryClient,
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

import {
    evaluateTranscriptCandidate,
    getEchoedRequestIds,
    isMatchingTranscript,
    resetTranscriptArrivalSessionState,
    useTranscriptArrival,
} from './useTranscriptArrival';
import type {
    EvaluateTranscriptCandidateParams,
    UseTranscriptArrivalParams,
} from './useTranscriptArrival';
import { claimTranscriptOnce } from './transcriptClaim';

/** The partner's own signing DID, as documented for TRANSCRIPT_ISSUERS[*].did. */
const ISSUER_DID = 'did:web:records.example.org';
const USER_DID = 'did:user';
const REQUESTED_AT = '2024-01-01T00:00:00.000Z';
/** Brain-service sets `from` to the sender's profileId, never a DID. */
const ISSUER_PROFILE_ID = 'state-records-issuer';
/**
 * What the network really reports as a profile's DID (getOtherProfile and notification
 * `from.did` both rewrite it): never equal to the partner's signing DID.
 */
const NETWORK_DID_FOR_ISSUER = `did:web:network.learncard.com:users:${ISSUER_PROFILE_ID}`;
const VALID_VC = {
    type: ['VerifiableCredential', 'ClrCredential'],
    issuer: { id: ISSUER_DID, name: 'Example State' },
    credentialSubject: { id: USER_DID },
    validFrom: '2024-01-02T00:00:00.000Z',
} as unknown as VC;

const match = (overrides: Partial<EvaluateTranscriptCandidateParams>): Promise<boolean> =>
    isMatchingTranscript({
        vc: VALID_VC,
        senderProfileId: ISSUER_PROFILE_ID,
        expectedSenderProfileId: ISSUER_PROFILE_ID,
        expectedIssuerDid: ISSUER_DID,
        userDid: USER_DID,
        requestedAt: REQUESTED_AT,
        wallet,
        ...overrides,
    });

describe('isMatchingTranscript', () => {
    beforeEach(() => {
        mocks.wallet.invoke.verifyCredential.mockReset();
        mocks.wallet.invoke.verifyCredential.mockResolvedValue({ warnings: [], errors: [] });
    });

    it('matches a credential satisfying every rule', async () => {
        await expect(match({ vc: VALID_VC })).resolves.toBe(true);
    });

    it('never authenticates the sender by the network-rewritten profile DID', async () => {
        // The network reports did:web:<network>:users:<profileId> for every profile, so a
        // DID passed where a profile ID belongs never matches.
        await expect(match({ senderProfileId: NETWORK_DID_FOR_ISSUER })).resolves.toBe(false);
        await expect(match({ senderProfileId: ISSUER_DID })).resolves.toBe(false);
        await expect(match({ expectedSenderProfileId: '', senderProfileId: '' })).resolves.toBe(
            false
        );
    });

    it('rejects a credential from the wrong sender', async () => {
        await expect(match({ vc: VALID_VC, senderProfileId: 'other-profile' })).resolves.toBe(
            false
        );
    });

    it('rejects a credential whose own issuer is not the expected issuer', async () => {
        const vc = { ...VALID_VC, issuer: 'did:web:other.example.com' } as unknown as VC;
        await expect(match({ vc })).resolves.toBe(false);
    });

    it('matches when the issuer is a plain string equal to the expected issuer', async () => {
        const vc = { ...VALID_VC, issuer: ISSUER_DID } as unknown as VC;
        await expect(match({ vc })).resolves.toBe(true);
    });

    it('never accepts on the credential issuer alone when the sender does not match', async () => {
        await expect(match({ vc: VALID_VC, senderProfileId: undefined })).resolves.toBe(false);
    });

    it('requires an echoed request ID to equal the active request', async () => {
        const echoed = {
            ...VALID_VC,
            credentialSubject: { id: USER_DID, requestId: 'req-1' },
        } as unknown as VC;
        await expect(match({ vc: echoed, expectedRequestId: 'req-1' })).resolves.toBe(true);
        await expect(match({ vc: echoed, expectedRequestId: 'req-2' })).resolves.toBe(false);
    });

    it('reads an echoed request ID from evidence too, and ignores its absence', async () => {
        const viaEvidence = {
            ...VALID_VC,
            evidence: [{ id: 'urn:x', request_id: 'req-9' }],
        } as unknown as VC;
        expect(getEchoedRequestIds(viaEvidence)).toEqual(['req-9']);
        await expect(match({ vc: viaEvidence, expectedRequestId: 'req-1' })).resolves.toBe(false);
        expect(getEchoedRequestIds(VALID_VC)).toEqual([]);

        // The documented partner contract: evidence id `urn:uuid:<request_id>`.
        const viaUrn = {
            ...VALID_VC,
            evidence: [{ id: 'urn:uuid:req-1', type: ['Evidence'] }],
        } as unknown as VC;
        expect(getEchoedRequestIds(viaUrn)).toEqual(['req-1']);
        await expect(match({ vc: viaUrn, expectedRequestId: 'req-1' })).resolves.toBe(true);
        await expect(match({ vc: viaUrn, expectedRequestId: 'req-2' })).resolves.toBe(false);
        await expect(match({ vc: VALID_VC, expectedRequestId: 'req-1' })).resolves.toBe(true);
    });

    it('rejects a credential missing the ClrCredential type', async () => {
        const vc = { ...VALID_VC, type: ['VerifiableCredential'] };
        await expect(match({ vc })).resolves.toBe(false);
    });

    it('rejects a credential for the wrong subject', async () => {
        const vc = { ...VALID_VC, credentialSubject: { id: 'did:someone-else' } };
        await expect(match({ vc })).resolves.toBe(false);
    });

    it('rejects a credential issued before the request', async () => {
        const vc = { ...VALID_VC, validFrom: '2023-12-31T00:00:00.000Z' };
        await expect(match({ vc })).resolves.toBe(false);
    });

    it('tolerates clock skew: a whole-second validFrom just before requestedAt matches', async () => {
        const vc = { ...VALID_VC, validFrom: '2024-01-01T10:00:00Z' } as unknown as VC;
        await expect(match({ vc, requestedAt: '2024-01-01T10:00:00.350Z' })).resolves.toBe(true);
        // A few minutes of issuer/server clock disagreement is still accepted.
        await expect(match({ vc, requestedAt: '2024-01-01T10:04:00.000Z' })).resolves.toBe(true);
    });

    it('still rejects a credential issued before the request beyond the skew allowance', async () => {
        const vc = { ...VALID_VC, validFrom: '2024-01-01T10:00:00Z' } as unknown as VC;
        await expect(match({ vc, requestedAt: '2024-01-01T10:05:01.000Z' })).resolves.toBe(false);
    });

    describe('when the device clock is behind the issuer', () => {
        const NOW = new Date('2024-01-02T00:00:00.000Z');
        const evaluate = (vc: VC) =>
            evaluateTranscriptCandidate({
                vc,
                senderProfileId: ISSUER_PROFILE_ID,
                expectedSenderProfileId: ISSUER_PROFILE_ID,
                expectedIssuerDid: ISSUER_DID,
                userDid: USER_DID,
                requestedAt: REQUESTED_AT,
                wallet,
            });

        beforeEach(() => {
            vi.useFakeTimers();
            vi.setSystemTime(NOW);
            mocks.wallet.invoke.verifyCredential.mockResolvedValue({
                warnings: [],
                errors: ['expiration error: Credential is not valid yet'],
            });
        });
        afterEach(() => {
            vi.useRealTimers();
        });

        it('retries (does not reject) a credential that becomes valid within the skew', async () => {
            const vc = { ...VALID_VC, validFrom: '2024-01-02T00:00:03.000Z' } as unknown as VC;
            await expect(evaluate(vc)).resolves.toBe('retry');
        });

        it('rejects a credential that is not valid until well in the future', async () => {
            const vc = { ...VALID_VC, validFrom: '2024-01-03T00:00:00.000Z' } as unknown as VC;
            await expect(evaluate(vc)).resolves.toBe('reject');
        });

        it('rejects when "not valid yet" comes with any other verification problem', async () => {
            mocks.wallet.invoke.verifyCredential.mockResolvedValue({
                warnings: [],
                errors: ['expiration error: Credential is not valid yet', 'bad proof'],
            });
            const vc = { ...VALID_VC, validFrom: '2024-01-02T00:00:03.000Z' } as unknown as VC;
            await expect(evaluate(vc)).resolves.toBe('reject');
        });
    });

    it('rejects a credential that fails verification (errors)', async () => {
        mocks.wallet.invoke.verifyCredential.mockResolvedValue({
            warnings: [],
            errors: ['bad proof'],
        });
        await expect(match({ vc: VALID_VC })).resolves.toBe(false);
    });

    it('rejects a credential that fails verification (warnings)', async () => {
        mocks.wallet.invoke.verifyCredential.mockResolvedValue({
            warnings: ['revoked'],
            errors: [],
        });
        await expect(match({ vc: VALID_VC })).resolves.toBe(false);
    });

    it('rejects a credential when verification throws', async () => {
        mocks.wallet.invoke.verifyCredential.mockRejectedValue(new Error('network error'));
        await expect(match({ vc: VALID_VC })).resolves.toBe(false);
    });
});

describe('useTranscriptArrival', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        localStorage.clear();
        resetTranscriptArrivalSessionState();
        mocks.unstableWalletFns = false;
        // The real API shape: getOtherProfile rewrites every DID to the network's did:web.
        mocks.wallet.invoke.getProfile
            .mockReset()
            .mockImplementation(async (profileId: string) => ({
                profileId,
                did: `did:web:network.learncard.com:users:${profileId}`,
            }));
        mocks.initWallet.mockReset().mockResolvedValue(wallet);
        mocks.wallet.read.get.mockReset();
        mocks.wallet.invoke.verifyCredential
            .mockReset()
            .mockResolvedValue({ warnings: [], errors: [] });
        mocks.wallet.invoke.transcriptsMarkReceived.mockClear();
        mocks.wallet.invoke.getReceivedCredentials.mockReset().mockResolvedValue([]);
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

    const activeParams: UseTranscriptArrivalParams = {
        status: 'requested',
        issuerDid: ISSUER_DID,
        issuerProfileId: ISSUER_PROFILE_ID,
        requestId: 'req-1',
        requestedAt: REQUESTED_AT,
        receivedAt: undefined,
    };

    it('does nothing when inactive (no status) — no listeners, no claim', async () => {
        mocks.incomingCredentials.data = [{ uri: 'u1', from: ISSUER_PROFILE_ID }];
        mocks.wallet.read.get.mockResolvedValue(VALID_VC);

        renderHook(() => useTranscriptArrival({ ...activeParams, status: undefined }));
        await vi.advanceTimersByTimeAsync(0);

        expect(mocks.claimIncomingCredential).not.toHaveBeenCalled();
        expect(mocks.appStateHandler).toBeUndefined();
        expect(mocks.pushHandler).toBeUndefined();
    });

    it('does nothing once a receivedAt is already set', async () => {
        mocks.incomingCredentials.data = [{ uri: 'u1', from: ISSUER_PROFILE_ID }];
        mocks.wallet.read.get.mockResolvedValue(VALID_VC);

        renderHook(() =>
            useTranscriptArrival({ ...activeParams, receivedAt: '2024-01-03T00:00:00.000Z' })
        );
        await vi.advanceTimersByTimeAsync(0);

        expect(mocks.claimIncomingCredential).not.toHaveBeenCalled();
    });

    it('does nothing without a configured issuer profile ID', async () => {
        mocks.incomingCredentials.data = [{ uri: 'u1', from: ISSUER_PROFILE_ID }];
        mocks.wallet.read.get.mockResolvedValue(VALID_VC);

        renderHook(() => useTranscriptArrival({ ...activeParams, issuerProfileId: undefined }));
        await vi.advanceTimersByTimeAsync(0);

        expect(mocks.wallet.read.get).not.toHaveBeenCalled();
        expect(mocks.claimIncomingCredential).not.toHaveBeenCalled();
    });

    it('auto-accepts with the documented config: partner-signed CLR sent from its network profile', async () => {
        // vc.issuer is the partner's own DID; the sending profile's network DID differs.
        mocks.incomingCredentials.data = [{ uri: 'u1', from: ISSUER_PROFILE_ID }];
        mocks.wallet.read.get.mockResolvedValue(VALID_VC);

        renderHook(() => useTranscriptArrival(activeParams));
        await vi.waitFor(() => expect(mocks.claimIncomingCredential).toHaveBeenCalledTimes(1));
        expect(mocks.wallet.invoke.getProfile).not.toHaveBeenCalled();
    });

    it('rejects a different sender profile without any lookup or credential read', async () => {
        mocks.incomingCredentials.data = [{ uri: 'u1', from: 'someone-else' }];
        mocks.wallet.read.get.mockResolvedValue(VALID_VC);

        renderHook(() => useTranscriptArrival(activeParams));
        await vi.advanceTimersByTimeAsync(0);

        expect(mocks.wallet.invoke.getProfile).not.toHaveBeenCalled();
        expect(mocks.wallet.read.get).not.toHaveBeenCalled();
        expect(mocks.claimIncomingCredential).not.toHaveBeenCalled();
        expect(mocks.wallet.invoke.transcriptsMarkReceived).not.toHaveBeenCalled();
    });

    it('rejects an app-listing sender once, with no lookups on later polls', async () => {
        // `from` can be an AppStoreListing listing_id, which has no profile.
        mocks.incomingCredentials.data = [{ uri: 'u1', from: 'listing-123' }];
        mocks.wallet.read.get.mockResolvedValue(VALID_VC);

        renderHook(() => useTranscriptArrival(activeParams));
        await vi.advanceTimersByTimeAsync(5_000 + 10_000 + 20_000);

        expect(mocks.wallet.invoke.getProfile).not.toHaveBeenCalled();
        expect(mocks.wallet.read.get).not.toHaveBeenCalled();
        expect(mocks.claimIncomingCredential).not.toHaveBeenCalled();
    });

    it('never treats a DID in `from` as the issuer, even the issuer DID itself', async () => {
        mocks.incomingCredentials.data = [
            { uri: 'u1', from: ISSUER_DID },
            { uri: 'u2', from: NETWORK_DID_FOR_ISSUER },
        ];
        mocks.wallet.read.get.mockResolvedValue(VALID_VC);

        renderHook(() => useTranscriptArrival(activeParams));
        await vi.advanceTimersByTimeAsync(0);

        expect(mocks.claimIncomingCredential).not.toHaveBeenCalled();
    });

    it('never re-reads an already rejected URI', async () => {
        const otherVc = { ...VALID_VC, type: ['VerifiableCredential'] } as unknown as VC;
        mocks.incomingCredentials.data = [{ uri: 'not-a-transcript', from: ISSUER_PROFILE_ID }];
        mocks.wallet.read.get.mockResolvedValue(otherVc);

        renderHook(() => useTranscriptArrival(activeParams));
        await vi.advanceTimersByTimeAsync(0);
        expect(mocks.wallet.read.get).toHaveBeenCalledTimes(1);

        await vi.advanceTimersByTimeAsync(5_000 + 10_000 + 20_000);
        expect(mocks.wallet.read.get).toHaveBeenCalledTimes(1);
        expect(mocks.wallet.invoke.getProfile).not.toHaveBeenCalled();
        expect(mocks.claimIncomingCredential).not.toHaveBeenCalled();
    });

    it('re-evaluates a candidate when verification failed transiently', async () => {
        mocks.incomingCredentials.data = [{ uri: 'u1', from: ISSUER_PROFILE_ID }];
        mocks.wallet.read.get.mockResolvedValue(VALID_VC);
        mocks.wallet.invoke.verifyCredential.mockRejectedValueOnce(new Error('offline'));

        renderHook(() => useTranscriptArrival(activeParams));
        await vi.advanceTimersByTimeAsync(0);
        expect(mocks.claimIncomingCredential).not.toHaveBeenCalled();

        await vi.advanceTimersByTimeAsync(5_000);
        expect(mocks.claimIncomingCredential).toHaveBeenCalledTimes(1);
    });

    it('claims a matching transcript exactly once: adds, marks received, invalidates, tracks arrival', async () => {
        mocks.incomingCredentials.data = [{ uri: 'u1', from: ISSUER_PROFILE_ID }];
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
        mocks.incomingCredentials.data = [{ uri: 'u1', from: ISSUER_PROFILE_ID }];
        rerender({ ...activeParams });
        await Promise.resolve();

        expect(mocks.claimIncomingCredential).toHaveBeenCalledTimes(1);
    });

    it('claims once across two mounted instances (e.g. WalletPage and SchoolConnect)', async () => {
        mocks.incomingCredentials.data = [{ uri: 'u1', from: ISSUER_PROFILE_ID }];
        mocks.wallet.read.get.mockResolvedValue(VALID_VC);
        let release: () => void = () => undefined;
        mocks.claimIncomingCredential.mockImplementationOnce(
            () =>
                new Promise(resolve => {
                    release = () => resolve({ added: true, accepted: true });
                })
        );

        renderHook(() => useTranscriptArrival(activeParams));
        renderHook(() => useTranscriptArrival(activeParams));
        await vi.waitFor(() => expect(mocks.claimIncomingCredential).toHaveBeenCalledTimes(1));
        await vi.advanceTimersByTimeAsync(5_000);
        await act(async () => release());
        await vi.advanceTimersByTimeAsync(10_000);

        expect(mocks.claimIncomingCredential).toHaveBeenCalledTimes(1);
        expect(mocks.wallet.invoke.transcriptsMarkReceived).toHaveBeenCalledTimes(1);
        expect(mocks.track).toHaveBeenCalledTimes(1);
    });

    it('never claims a transcript the notification deep link already claimed', async () => {
        await claimTranscriptOnce('req-1', async () => undefined);
        mocks.incomingCredentials.data = [{ uri: 'u1', from: ISSUER_PROFILE_ID }];
        mocks.wallet.read.get.mockResolvedValue(VALID_VC);

        renderHook(() => useTranscriptArrival(activeParams));
        await vi.advanceTimersByTimeAsync(5_000);

        expect(mocks.claimIncomingCredential).not.toHaveBeenCalled();
        expect(mocks.wallet.invoke.transcriptsMarkReceived).not.toHaveBeenCalled();
    });

    it('does not re-run the check on every render when useWallet returns new functions', async () => {
        mocks.unstableWalletFns = true;
        mocks.incomingCredentials.data = [{ uri: 'u1', from: ISSUER_PROFILE_ID }];
        // A candidate that resolves to `retry` would be re-verified by every extra check.
        mocks.wallet.read.get.mockResolvedValue(VALID_VC);
        mocks.wallet.invoke.verifyCredential.mockRejectedValue(new Error('offline'));

        const { rerender } = renderHook(props => useTranscriptArrival(props), {
            initialProps: activeParams,
        });
        await vi.advanceTimersByTimeAsync(0);
        const initialChecks = mocks.initWallet.mock.calls.length;
        expect(initialChecks).toBe(1);

        for (let i = 0; i < 5; i++) rerender({ ...activeParams });
        await vi.advanceTimersByTimeAsync(0);

        expect(mocks.initWallet).toHaveBeenCalledTimes(initialChecks);
        expect(mocks.wallet.invoke.verifyCredential).toHaveBeenCalledTimes(1);
    });

    it('resets the accept guard when a new request starts', async () => {
        mocks.incomingCredentials.data = [{ uri: 'u1', from: ISSUER_PROFILE_ID }];
        mocks.wallet.read.get.mockResolvedValue(VALID_VC);

        const { rerender } = renderHook(props => useTranscriptArrival(props), {
            initialProps: activeParams,
        });
        await vi.waitFor(() => expect(mocks.claimIncomingCredential).toHaveBeenCalledTimes(1));

        mocks.incomingCredentials.data = [{ uri: 'u2', from: ISSUER_PROFILE_ID }];
        rerender({ ...activeParams, requestId: 'req-2', receivedAt: undefined });

        await vi.waitFor(() => expect(mocks.claimIncomingCredential).toHaveBeenCalledTimes(2));
        expect(mocks.claimIncomingCredential).toHaveBeenLastCalledWith(
            expect.objectContaining({ uri: 'u2' })
        );
    });

    it.each([false, true])(
        'retries acknowledgement without claiming again (remount: %s)',
        async remount => {
            mocks.incomingCredentials.data = [{ uri: 'u1', from: ISSUER_PROFILE_ID }];
            mocks.wallet.read.get.mockResolvedValue(VALID_VC);
            mocks.wallet.invoke.transcriptsMarkReceived.mockRejectedValueOnce(new Error('offline'));
            const hook = renderHook(() => useTranscriptArrival(activeParams));
            await vi.advanceTimersByTimeAsync(0);
            expect(mocks.claimIncomingCredential).toHaveBeenCalledTimes(1);
            expect(mocks.wallet.invoke.transcriptsMarkReceived).toHaveBeenCalledTimes(1);
            mocks.incomingCredentials.data = [];
            if (remount) {
                hook.unmount();
                renderHook(() => useTranscriptArrival(activeParams));
            }
            await vi.advanceTimersByTimeAsync(5_000);
            expect(mocks.wallet.invoke.transcriptsMarkReceived).toHaveBeenCalledTimes(2);
            expect(mocks.claimIncomingCredential).toHaveBeenCalledTimes(1);
            expect(mocks.invalidateQueries).toHaveBeenCalledWith({
                queryKey: ['transcriptStatus'],
            });
            expect(localStorage.getItem('transcript_pending_received:did:user:req-1')).toBeNull();
        }
    );

    it('polls with exponential backoff capped at 60s and stops after 30 minutes', async () => {
        mocks.incomingCredentials.data = undefined;

        const { result } = renderHook(() => useTranscriptArrival(activeParams));
        const calls = (): number => mocks.incomingCredentials.refetch.mock.calls.length;

        await vi.advanceTimersByTimeAsync(5_000); // t=5s
        expect(calls()).toBe(1);
        await vi.advanceTimersByTimeAsync(9_999); // t=~15s: next tick is 10s later
        expect(calls()).toBe(1);
        await vi.advanceTimersByTimeAsync(1); // t=15s
        expect(calls()).toBe(2);
        await vi.advanceTimersByTimeAsync(20_000); // t=35s
        expect(calls()).toBe(3);
        await vi.advanceTimersByTimeAsync(40_000); // t=75s
        expect(calls()).toBe(4);
        await vi.advanceTimersByTimeAsync(60_000); // t=135s: capped at 60s
        expect(calls()).toBe(5);
        await vi.advanceTimersByTimeAsync(59_000);
        expect(calls()).toBe(5);

        expect(result.current.isPollingExhausted).toBe(false);
        await vi.advanceTimersByTimeAsync(30 * 60_000);
        const callsAtStop = calls();
        expect(result.current.isPollingExhausted).toBe(true);
        await vi.advanceTimersByTimeAsync(10 * 60_000);
        expect(calls()).toBe(callsAtStop);
    });

    it('keeps the polling window across remounts in the same session', async () => {
        const first = renderHook(() => useTranscriptArrival(activeParams));
        await vi.advanceTimersByTimeAsync(31 * 60_000);
        expect(first.result.current.isPollingExhausted).toBe(true);
        first.unmount();

        mocks.incomingCredentials.refetch.mockClear();
        const second = renderHook(() => useTranscriptArrival(activeParams));
        await vi.advanceTimersByTimeAsync(0);
        expect(second.result.current.isPollingExhausted).toBe(true);
        await vi.advanceTimersByTimeAsync(5 * 60_000);
        expect(mocks.incomingCredentials.refetch).not.toHaveBeenCalled();
    });

    it('checkAgain restarts polling and re-reads previously rejected credentials', async () => {
        const otherVc = { ...VALID_VC, type: ['VerifiableCredential'] } as unknown as VC;
        mocks.incomingCredentials.data = [{ uri: 'u1', from: ISSUER_PROFILE_ID }];
        mocks.wallet.read.get.mockResolvedValue(otherVc);

        const { result } = renderHook(() => useTranscriptArrival(activeParams));
        await vi.advanceTimersByTimeAsync(31 * 60_000);
        expect(result.current.isPollingExhausted).toBe(true);
        expect(mocks.wallet.read.get).toHaveBeenCalledTimes(1);

        mocks.wallet.read.get.mockResolvedValue(VALID_VC);
        mocks.incomingCredentials.refetch.mockClear();
        act(() => result.current.checkAgain());
        await vi.advanceTimersByTimeAsync(0);

        expect(result.current.isPollingExhausted).toBe(false);
        expect(mocks.incomingCredentials.refetch).toHaveBeenCalled();
        expect(mocks.claimIncomingCredential).toHaveBeenCalledTimes(1);
    });

    it('stops polling once the request is received', async () => {
        const { rerender } = renderHook(props => useTranscriptArrival(props), {
            initialProps: activeParams,
        });
        await vi.advanceTimersByTimeAsync(5_000);
        expect(mocks.incomingCredentials.refetch).toHaveBeenCalledTimes(1);

        rerender({ ...activeParams, receivedAt: '2024-01-03T00:00:00.000Z' });
        await vi.advanceTimersByTimeAsync(10 * 60_000);
        expect(mocks.incomingCredentials.refetch).toHaveBeenCalledTimes(1);
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
    it('re-reads a "not valid yet" candidate on a later tick instead of caching a rejection', async () => {
        mocks.incomingCredentials.data = [{ uri: 'u1', from: ISSUER_PROFILE_ID }];
        const soon = new Date(Date.now() + 3_000).toISOString();
        mocks.wallet.read.get.mockResolvedValue({ ...VALID_VC, validFrom: soon });
        mocks.wallet.invoke.verifyCredential.mockResolvedValueOnce({
            warnings: [],
            errors: ['expiration error: Credential is not valid yet'],
        });

        renderHook(() => useTranscriptArrival(activeParams));
        await vi.advanceTimersByTimeAsync(0);
        expect(mocks.claimIncomingCredential).not.toHaveBeenCalled();

        await vi.advanceTimersByTimeAsync(5_000);
        expect(mocks.claimIncomingCredential).toHaveBeenCalledTimes(1);
        expect(mocks.wallet.invoke.transcriptsMarkReceived).toHaveBeenCalledWith({
            requestId: 'req-1',
        });
    });

    describe('a transcript the student already accepted by hand', () => {
        const SENT_AFTER_REQUEST = '2024-01-02T00:00:00.000Z';

        it('is acknowledged (never claimed again) once it has left the incoming list', async () => {
            mocks.incomingCredentials.data = [];
            mocks.wallet.invoke.getReceivedCredentials.mockResolvedValue([
                { uri: 'u1', from: ISSUER_PROFILE_ID, to: 'me', sent: SENT_AFTER_REQUEST },
            ]);
            mocks.wallet.read.get.mockResolvedValue(VALID_VC);

            renderHook(() => useTranscriptArrival(activeParams));
            await vi.waitFor(() =>
                expect(mocks.wallet.invoke.transcriptsMarkReceived).toHaveBeenCalledWith({
                    requestId: 'req-1',
                })
            );

            expect(mocks.wallet.invoke.getReceivedCredentials).toHaveBeenCalledWith(
                ISSUER_PROFILE_ID
            );
            expect(mocks.claimIncomingCredential).not.toHaveBeenCalled();
            expect(mocks.addVCtoWallet).not.toHaveBeenCalled();
            expect(mocks.invalidateQueries).toHaveBeenCalledWith({
                queryKey: ['transcriptStatus'],
            });
            expect(mocks.track).toHaveBeenCalledWith('transcript_arrived', {});

            await vi.advanceTimersByTimeAsync(5_000 + 10_000);
            expect(mocks.wallet.invoke.transcriptsMarkReceived).toHaveBeenCalledTimes(1);
        });

        it('is found by checkAgain after polling ran out', async () => {
            mocks.incomingCredentials.data = [];
            mocks.wallet.read.get.mockResolvedValue(VALID_VC);

            const { result } = renderHook(() => useTranscriptArrival(activeParams));
            await vi.advanceTimersByTimeAsync(31 * 60_000);
            expect(result.current.isPollingExhausted).toBe(true);
            expect(mocks.wallet.invoke.transcriptsMarkReceived).not.toHaveBeenCalled();

            // Claimed from Notifications: accepted, so no longer incoming.
            mocks.wallet.invoke.getReceivedCredentials.mockResolvedValue([
                { uri: 'u1', from: ISSUER_PROFILE_ID, to: 'me', sent: SENT_AFTER_REQUEST },
            ]);
            act(() => result.current.checkAgain());
            await vi.advanceTimersByTimeAsync(0);

            expect(mocks.wallet.invoke.transcriptsMarkReceived).toHaveBeenCalledTimes(1);
            expect(mocks.claimIncomingCredential).not.toHaveBeenCalled();
        });

        it('retries a failed acknowledgement on the next tick', async () => {
            mocks.incomingCredentials.data = [];
            mocks.wallet.invoke.getReceivedCredentials.mockResolvedValue([
                { uri: 'u1', from: ISSUER_PROFILE_ID, to: 'me', sent: SENT_AFTER_REQUEST },
            ]);
            mocks.wallet.read.get.mockResolvedValue(VALID_VC);
            mocks.wallet.invoke.transcriptsMarkReceived.mockRejectedValueOnce(new Error('offline'));

            renderHook(() => useTranscriptArrival(activeParams));
            await vi.advanceTimersByTimeAsync(0);
            expect(mocks.wallet.invoke.transcriptsMarkReceived).toHaveBeenCalledTimes(1);
            expect(localStorage.getItem('transcript_pending_received:did:user:req-1')).toBe('true');

            await vi.advanceTimersByTimeAsync(5_000);
            expect(mocks.wallet.invoke.transcriptsMarkReceived).toHaveBeenCalledTimes(2);
            expect(localStorage.getItem('transcript_pending_received:did:user:req-1')).toBeNull();
        });

        it('ignores accepted credentials sent long before the request, without reading them', async () => {
            mocks.incomingCredentials.data = [];
            mocks.wallet.invoke.getReceivedCredentials.mockResolvedValue([
                { uri: 'old', from: ISSUER_PROFILE_ID, to: 'me', sent: '2023-06-01T00:00:00.000Z' },
            ]);
            mocks.wallet.read.get.mockResolvedValue(VALID_VC);

            renderHook(() => useTranscriptArrival(activeParams));
            await vi.advanceTimersByTimeAsync(5_000);

            expect(mocks.wallet.read.get).not.toHaveBeenCalled();
            expect(mocks.wallet.invoke.transcriptsMarkReceived).not.toHaveBeenCalled();
        });

        it('applies the full rule set (e.g. rejects a non-transcript)', async () => {
            mocks.incomingCredentials.data = [];
            mocks.wallet.invoke.getReceivedCredentials.mockResolvedValue([
                { uri: 'u1', from: ISSUER_PROFILE_ID, to: 'me', sent: SENT_AFTER_REQUEST },
            ]);
            mocks.wallet.read.get.mockResolvedValue({
                ...VALID_VC,
                type: ['VerifiableCredential'],
            });

            renderHook(() => useTranscriptArrival(activeParams));
            await vi.advanceTimersByTimeAsync(5_000 + 10_000);

            // Rejected once, then never re-read.
            expect(mocks.wallet.read.get).toHaveBeenCalledTimes(1);
            expect(mocks.wallet.invoke.transcriptsMarkReceived).not.toHaveBeenCalled();
        });

        it('leaves acknowledgement to a claim already made this session', async () => {
            await claimTranscriptOnce('req-1', async () => undefined);
            mocks.incomingCredentials.data = [];
            mocks.wallet.invoke.getReceivedCredentials.mockResolvedValue([
                { uri: 'u1', from: ISSUER_PROFILE_ID, to: 'me', sent: SENT_AFTER_REQUEST },
            ]);
            mocks.wallet.read.get.mockResolvedValue(VALID_VC);

            renderHook(() => useTranscriptArrival(activeParams));
            await vi.advanceTimersByTimeAsync(5_000);

            expect(mocks.wallet.invoke.getReceivedCredentials).not.toHaveBeenCalled();
            expect(mocks.wallet.invoke.transcriptsMarkReceived).not.toHaveBeenCalled();
        });

        it('re-checks on app foreground', async () => {
            mocks.incomingCredentials.data = [];
            renderHook(() => useTranscriptArrival(activeParams));
            await vi.waitFor(() => expect(mocks.appStateHandler).toBeDefined());
            await vi.advanceTimersByTimeAsync(0);

            mocks.wallet.invoke.getReceivedCredentials.mockResolvedValue([
                { uri: 'u1', from: ISSUER_PROFILE_ID, to: 'me', sent: SENT_AFTER_REQUEST },
            ]);
            mocks.wallet.read.get.mockResolvedValue(VALID_VC);
            mocks.appStateHandler?.({ isActive: true });
            await vi.advanceTimersByTimeAsync(0);

            expect(mocks.wallet.invoke.transcriptsMarkReceived).toHaveBeenCalledTimes(1);
        });

        it('still claims a transcript the foreground refetch delivers while the re-check runs', async () => {
            mocks.incomingCredentials.data = [];
            const { result, rerender } = renderHook(props => useTranscriptArrival(props), {
                initialProps: activeParams,
            });
            await vi.waitFor(() => expect(mocks.appStateHandler).toBeDefined());
            await vi.advanceTimersByTimeAsync(30 * 60_000);
            expect(result.current.isPollingExhausted).toBe(true);

            // The foreground re-check is stuck on the received-credentials lookup...
            let resolveReceived: (value: unknown[]) => void = () => undefined;
            mocks.wallet.invoke.getReceivedCredentials.mockImplementationOnce(
                () => new Promise(resolve => (resolveReceived = resolve))
            );
            mocks.appStateHandler?.({ isActive: true });
            await vi.advanceTimersByTimeAsync(0);
            expect(mocks.wallet.invoke.getReceivedCredentials).toHaveBeenCalled();

            // ...when the refetch lands with the transcript in the incoming list.
            mocks.wallet.read.get.mockResolvedValue(VALID_VC);
            mocks.incomingCredentials.data = [{ uri: 'u1', from: ISSUER_PROFILE_ID }];
            rerender({ ...activeParams });
            await vi.advanceTimersByTimeAsync(0);
            expect(mocks.claimIncomingCredential).not.toHaveBeenCalled();

            await act(async () => resolveReceived([]));
            await vi.advanceTimersByTimeAsync(0);

            expect(mocks.claimIncomingCredential).toHaveBeenCalledTimes(1);
            expect(mocks.wallet.invoke.transcriptsMarkReceived).toHaveBeenCalledTimes(1);
        });
    });
});
