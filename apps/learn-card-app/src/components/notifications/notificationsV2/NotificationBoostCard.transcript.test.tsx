import React from 'react';
import { act, cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { NotificationType } from '@learncard/lca-api-plugin';

/** The partner's own signing DID (TRANSCRIPT_ISSUERS[*].did). */
const ISSUER_DID = 'did:web:records.example.org';
/** The partner's LearnCard Network profile (TRANSCRIPT_ISSUERS[*].profileId). */
const ISSUER_PROFILE_ID = 'state-records';
const CRED_URI = 'lc:network:cred-1';

type StatusQuery = {
    data?: {
        issuerDid?: string;
        issuerProfileId?: string;
        latest?: {
            requestId: string;
            requestedAt: string;
            status: 'requested' | 'none_yet' | 'failed';
            receivedAt?: string;
        };
    };
    isFetched: boolean;
    isError: boolean;
};

const mocks = vi.hoisted(() => ({
    query: new URLSearchParams(),
    flagOn: true,
    statusQuery: { isFetched: false, isError: false } as StatusQuery,
    useTranscriptStatus: vi.fn(),
    resolved: { data: undefined as unknown, isLoading: false },
    newModal: vi.fn(),
    replace: vi.fn(),
    presentToast: vi.fn(),
    claimIncomingCredential: vi.fn(),
    isMatchingTranscript: vi.fn(),
    markReceived: vi.fn(),
    invalidateQueries: vi.fn(),
    wallet: undefined as unknown,
}));

mocks.wallet = {
    id: { did: () => 'did:user' },
    invoke: { transcriptsMarkReceived: mocks.markReceived },
};

vi.mock('react-router-dom', () => ({ useHistory: () => ({ replace: mocks.replace }) }));
vi.mock('@tanstack/react-query', () => ({
    useQueryClient: () => ({ invalidateQueries: mocks.invalidateQueries }),
}));
vi.mock('learn-card-base/hooks/useOnScreen', () => ({ default: () => false }));
vi.mock('learn-card-base/svgs/X', () => ({ default: () => null }));
vi.mock('learn-card-base/svgs/wallet/IDsIcon', () => ({ IDsIconSolid: () => null }));
vi.mock('learn-card-base/svgs/Checkmark', () => ({ default: () => null }));
vi.mock('learn-card-base/components/CredentialBadge/CredentialBadgeNew', () => ({
    default: () => null,
}));
vi.mock('../../boost/claim-boost-card/BoostClaimCard', () => ({
    default: () => <div data-testid="generic-claim-card" />,
}));
vi.mock('./NotificationSkeleton', () => ({ default: () => <div data-testid="skeleton" /> }));
vi.mock('learn-card-base/helpers/credentialHelpers', () => ({
    unwrapBoostCredential: (vc: unknown) => vc,
    getDefaultCategoryForCredential: () => 'Achievement',
    getImageUrlFromCredential: () => '',
    isEndorsementCredential: () => false,
}));
vi.mock('learn-card-base/helpers/didHelpers', () => ({ formatDid: (did: string) => did }));
vi.mock('./types', () => ({
    NotificationTypeStyles: new Proxy({}, { get: () => ({}) }),
    CATEGORY_TO_NOTIFICATION_ENUM: {},
    notificationCardStyles: {},
}));
vi.mock('./NotificationCardContainer', () => ({ NOTIFICATION_TYPES: {} }));
vi.mock('./notificationDuplicateLookup', () => ({
    getNotificationDuplicateLookup: () => undefined,
}));
vi.mock('../../../hooks/useTranscriptArrival', () => ({
    isMatchingTranscript: mocks.isMatchingTranscript,
    getTranscriptPendingReceivedKey: (did: string, id: string) => `pending:${did}:${id}`,
}));
vi.mock('learn-card-base', () => ({
    useGetClaimCredential: () => ({ isError: false, ...mocks.resolved }),
    useAcceptCredentialMutation: () => ({ mutate: vi.fn(), isLoading: false }),
    useUpdateNotification: () => ({ mutate: vi.fn() }),
    usePathQuery: () => mocks.query,
    useModal: () => ({ newModal: mocks.newModal }),
    ModalTypes: { FullScreen: 'full', Right: 'right' },
    CredentialCategoryEnum: { id: 'ID', family: 'Family' },
    BoostCategoryOptionsEnum: { socialBadge: 'Social Badge', meritBadge: 'Merit Badge' },
    getBoostMetadata: () => undefined,
    useGetCredentialWithEdits: () => ({ credentialWithEdits: undefined }),
    useGetBoost: () => ({ data: undefined }),
    useWallet: () => ({
        addVCtoWallet: vi.fn(),
        initWallet: async () => mocks.wallet,
    }),
    contractCategoryNameToCategoryMetadata: () => undefined,
    useGetVCInfo: () => ({ issuerProfileImageElement: null }),
    useTranscriptStatus: (enabled: boolean) => {
        mocks.useTranscriptStatus(enabled);
        return mocks.statusQuery;
    },
    claimIncomingCredential: mocks.claimIncomingCredential,
    useFeatureConfig: () => ({ classlinkTranscriptOptIn: mocks.flagOn }),
    useToast: () => ({ presentToast: mocks.presentToast }),
    ToastTypeEnum: { Error: 'error' },
    getLogger: () => ({ error: vi.fn(), warn: vi.fn(), info: vi.fn() }),
}));

import NotificationBoostCard from './NotificationBoostCard';
import { claimTranscriptOnce, resetTranscriptClaims } from '../../../hooks/transcriptClaim';

const TRANSCRIPT_VC = { type: ['VerifiableCredential', 'ClrCredential'], issuer: ISSUER_DID };

/**
 * Real notification shape: the network sets `from.profileId` from the authenticated
 * sender and rewrites `from.did` to its own did:web for that profile, so `from.did`
 * never equals the partner's signing DID.
 */
const notification = {
    _id: 'n1',
    type: 'CREDENTIAL_RECEIVED',
    from: {
        did: `did:web:network.learncard.com:users:${ISSUER_PROFILE_ID}`,
        profileId: ISSUER_PROFILE_ID,
    },
    to: { did: 'did:user' },
    data: { vcUris: [CRED_URI] },
    read: false,
    archived: false,
} as unknown as NotificationType;

const outstanding = {
    issuerDid: ISSUER_DID,
    issuerProfileId: ISSUER_PROFILE_ID,
    latest: {
        requestId: 'req-1',
        requestedAt: '2026-01-01T00:00:00.000Z',
        status: 'requested' as const,
    },
};

/** `cardLoading` renders the skeleton, so only the hooks and effects under test run. */
const renderCard = (): ReturnType<typeof render> =>
    render(<NotificationBoostCard notification={notification} cardLoading />);

beforeEach(() => {
    vi.clearAllMocks();
    resetTranscriptClaims();
    mocks.query = new URLSearchParams({ uri: CRED_URI, claim: 'true' });
    mocks.flagOn = true;
    mocks.statusQuery = { isFetched: false, isError: false };
    mocks.resolved = { data: TRANSCRIPT_VC, isLoading: false };
    mocks.claimIncomingCredential.mockResolvedValue({ added: true, accepted: true });
    mocks.isMatchingTranscript.mockResolvedValue(true);
    mocks.markReceived.mockResolvedValue({ success: true });
});

afterEach(() => {
    cleanup();
    vi.useRealTimers();
});

describe('NotificationBoostCard claim deep link', () => {
    it('flag off: opens the generic claim modal on mount and never fetches transcript status', () => {
        mocks.flagOn = false;
        renderCard();
        expect(mocks.newModal).toHaveBeenCalledTimes(1);
        expect(mocks.useTranscriptStatus).toHaveBeenCalledWith(false);
        expect(mocks.claimIncomingCredential).not.toHaveBeenCalled();
    });

    it('flag off: a re-render never reopens the modal (mount-only, as on main)', () => {
        mocks.flagOn = false;
        const view = renderCard();
        view.rerender(<NotificationBoostCard notification={notification} cardLoading />);
        expect(mocks.newModal).toHaveBeenCalledTimes(1);
    });

    it('no deep link: never fetches transcript status', () => {
        mocks.query = new URLSearchParams();
        renderCard();
        expect(mocks.useTranscriptStatus).toHaveBeenCalledWith(false);
        expect(mocks.newModal).not.toHaveBeenCalled();
    });

    it('cold start: waits for transcript status before choosing, then auto-claims a match', async () => {
        const view = renderCard();
        expect(mocks.newModal).not.toHaveBeenCalled();

        mocks.statusQuery = { data: outstanding, isFetched: true, isError: false };
        view.rerender(<NotificationBoostCard notification={notification} cardLoading />);

        await waitFor(() => expect(mocks.claimIncomingCredential).toHaveBeenCalledTimes(1));
        expect(mocks.isMatchingTranscript).toHaveBeenCalledWith({
            vc: TRANSCRIPT_VC,
            senderProfileId: ISSUER_PROFILE_ID,
            expectedSenderProfileId: ISSUER_PROFILE_ID,
            expectedIssuerDid: ISSUER_DID,
            userDid: 'did:user',
            requestedAt: outstanding.latest.requestedAt,
            expectedRequestId: 'req-1',
            wallet: mocks.wallet,
        });
        await waitFor(() =>
            expect(mocks.replace).toHaveBeenCalledWith('/school-connect?view=transcript')
        );
        expect(mocks.markReceived).toHaveBeenCalledWith({ requestId: 'req-1' });
        expect(mocks.newModal).not.toHaveBeenCalled();
    });

    it('claims at most once across concurrent re-renders', async () => {
        mocks.statusQuery = { data: outstanding, isFetched: true, isError: false };
        let release: () => void = () => undefined;
        mocks.claimIncomingCredential.mockReturnValue(
            new Promise(resolve => {
                release = () => resolve({ added: true, accepted: true });
            })
        );
        const view = renderCard();
        await waitFor(() => expect(mocks.claimIncomingCredential).toHaveBeenCalledTimes(1));
        view.rerender(<NotificationBoostCard notification={notification} cardLoading />);
        view.rerender(<NotificationBoostCard notification={notification} cardLoading />);
        await act(async () => release());
        expect(mocks.claimIncomingCredential).toHaveBeenCalledTimes(1);
    });

    it('never claims again when a mounted transcript card is already claiming it', async () => {
        mocks.statusQuery = { data: outstanding, isFetched: true, isError: false };
        let release: () => void = () => undefined;
        const otherClaim = claimTranscriptOnce(
            'req-1',
            () => new Promise<void>(resolve => (release = resolve))
        );
        renderCard();
        await waitFor(() => expect(mocks.isMatchingTranscript).toHaveBeenCalledTimes(1));
        await act(async () => {
            release();
            await otherClaim;
        });
        await waitFor(() =>
            expect(mocks.replace).toHaveBeenCalledWith('/school-connect?view=transcript')
        );
        expect(mocks.claimIncomingCredential).not.toHaveBeenCalled();
        // The card that claimed it owns the acknowledgement.
        expect(mocks.markReceived).not.toHaveBeenCalled();
    });

    it('opens the generic modal without an issuer profile ID configured', async () => {
        mocks.statusQuery = {
            data: { ...outstanding, issuerProfileId: undefined },
            isFetched: true,
            isError: false,
        };
        renderCard();
        await waitFor(() => expect(mocks.newModal).toHaveBeenCalledTimes(1));
        expect(mocks.isMatchingTranscript).not.toHaveBeenCalled();
    });

    it('never claims or opens a modal for a delivery that fails verification', async () => {
        mocks.statusQuery = { data: outstanding, isFetched: true, isError: false };
        mocks.resolved = { data: undefined, isLoading: false, isError: true } as never;
        renderCard();
        await new Promise(resolve => setTimeout(resolve, 20));
        expect(mocks.newModal).not.toHaveBeenCalled();
        expect(mocks.isMatchingTranscript).not.toHaveBeenCalled();
        expect(mocks.claimIncomingCredential).not.toHaveBeenCalled();
    });

    it('waits for the credential to resolve before deciding', async () => {
        mocks.statusQuery = { data: { issuerDid: ISSUER_DID }, isFetched: true, isError: false };
        mocks.resolved = { data: undefined, isLoading: true };
        const view = renderCard();
        await new Promise(resolve => setTimeout(resolve, 20));
        expect(mocks.newModal).not.toHaveBeenCalled();
        mocks.resolved = { data: TRANSCRIPT_VC, isLoading: false };
        view.rerender(<NotificationBoostCard notification={notification} cardLoading />);
        await waitFor(() => expect(mocks.newModal).toHaveBeenCalledTimes(1));
    });

    it('opens the generic modal when there is no outstanding request', async () => {
        mocks.statusQuery = { data: { issuerDid: ISSUER_DID }, isFetched: true, isError: false };
        renderCard();
        await waitFor(() => expect(mocks.newModal).toHaveBeenCalledTimes(1));
        expect(mocks.isMatchingTranscript).not.toHaveBeenCalled();
    });

    it('opens the generic modal for a different sender without evaluating the credential', async () => {
        mocks.statusQuery = { data: outstanding, isFetched: true, isError: false };
        render(
            <NotificationBoostCard
                notification={
                    {
                        ...notification,
                        // Even a sender whose DID equals the issuer DID is not the issuer
                        // unless it is the configured profile.
                        from: { did: ISSUER_DID, profileId: 'other' },
                    } as unknown as NotificationType
                }
                cardLoading
            />
        );
        await waitFor(() => expect(mocks.newModal).toHaveBeenCalledTimes(1));
        expect(mocks.isMatchingTranscript).not.toHaveBeenCalled();
    });

    it('opens the generic modal when the credential does not match', async () => {
        mocks.statusQuery = { data: outstanding, isFetched: true, isError: false };
        mocks.isMatchingTranscript.mockResolvedValue(false);
        renderCard();
        await waitFor(() => expect(mocks.newModal).toHaveBeenCalledTimes(1));
        expect(mocks.claimIncomingCredential).not.toHaveBeenCalled();
    });

    it('surfaces an auto-claim failure and falls back to manual claim', async () => {
        mocks.statusQuery = { data: outstanding, isFetched: true, isError: false };
        mocks.claimIncomingCredential.mockRejectedValue(new Error('offline'));
        renderCard();
        await waitFor(() => expect(mocks.presentToast).toHaveBeenCalledTimes(1));
        expect(mocks.newModal).toHaveBeenCalledTimes(1);
        expect(mocks.replace).not.toHaveBeenCalled();
    });

    it('defers a failed acknowledgement to the arrival hook instead of failing the claim', async () => {
        mocks.statusQuery = { data: outstanding, isFetched: true, isError: false };
        mocks.markReceived.mockRejectedValue(new Error('offline'));
        const setItem = vi.fn();
        vi.stubGlobal('localStorage', { setItem, getItem: () => null, removeItem: vi.fn() });
        renderCard();
        await waitFor(() =>
            expect(mocks.replace).toHaveBeenCalledWith('/school-connect?view=transcript')
        );
        expect(setItem).toHaveBeenCalledWith('pending:did:user:req-1', 'true');
        expect(mocks.presentToast).not.toHaveBeenCalled();
        expect(mocks.newModal).not.toHaveBeenCalled();
        vi.unstubAllGlobals();
    });

    it('cold start: falls back to the generic modal if status never settles', async () => {
        vi.useFakeTimers();
        renderCard();
        expect(mocks.newModal).not.toHaveBeenCalled();
        await act(async () => {
            await vi.advanceTimersByTimeAsync(5_000);
        });
        expect(mocks.newModal).toHaveBeenCalledTimes(1);
    });
});
