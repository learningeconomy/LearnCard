import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { VC } from '@learncard/types';

import ClaimFromRequest from './ClaimFromRequest';
import type { InboxClaimOutcome } from './exchange.types';

const mocks = vi.hoisted(() => ({
    fetch: vi.fn(),
    push: vi.fn(),
    replace: vi.fn(),
    search: { value: '' },
}));

vi.mock('react-router-dom', () => ({
    useHistory: () => ({ push: mocks.push, replace: mocks.replace }),
    useLocation: () => ({ search: mocks.search.value }),
}));

vi.mock('@ionic/react', () => ({
    IonContent: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
    IonIcon: ({ icon }: { icon: string }) => <span data-testid={`ion-icon-${icon}`} />,
    IonPage: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
    useIonModal: () => [() => null, vi.fn()],
}));

vi.mock('ionicons/icons', () => ({
    alertCircleOutline: 'alert',
    closeCircleOutline: 'close',
    homeOutline: 'home',
    refreshOutline: 'refresh',
    timeOutline: 'time',
}));

vi.mock('learn-card-base', () => ({
    CredentialCategoryEnum: { achievement: 'Achievement' },
    ProfilePicture: () => null,
    UserProfilePicture: () => null,
    ToastTypeEnum: { Error: 'error', Success: 'success' },
    getLogger: () => ({ error: vi.fn(), warn: vi.fn(), info: vi.fn() }),
    redirectStore: { set: { lcnRedirect: vi.fn() } },
    useAuthStatus: () => ({ tag: 'ready', profile: { tag: 'present' } }),
    useCurrentUser: () => ({ name: 'Test User' }),
    useGetProfile: () => ({ data: undefined, isLoading: false }),
    useIsLoggedIn: () => true,
    useToast: () => ({ presentToast: vi.fn() }),
    useWallet: () => ({ initWallet: vi.fn(), storeAndAddVCToWallet: vi.fn() }),
}));

vi.mock('learn-card-base/auth-status/authStatus', () => ({
    hasNetworkProfile: () => true,
    shouldPromptProfileOnboarding: () => false,
}));

vi.mock('@tanstack/react-query', () => ({
    useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}));

vi.mock('learn-card-base/hooks/useRegistry', () => ({ default: () => ({}) }));

vi.mock('@analytics', () => ({
    AnalyticsEvents: {
        CLAIM_BOOST: 'claim_boost',
        CREDENTIAL_CLAIM_FAILED: 'credential_claim_failed',
        CREDENTIAL_CLAIM_PRESENTED: 'credential_claim_presented',
        CREDENTIAL_CLAIM_STARTED: 'credential_claim_started',
        CREDENTIAL_CLAIM_SUCCEEDED: 'credential_claim_succeeded',
    },
    createFlowLifecycle: () => ({ id: 'flow', durationMs: () => 1, terminate: () => true }),
    newFlowId: () => 'flow-id',
    useAnalytics: () => ({ track: vi.fn() }),
}));

vi.mock('../../feedback/useClaimSuccessToast', () => ({
    useClaimSuccessToast: () => vi.fn(),
}));

vi.mock('../../components/credentials/duplicate-credential/useDuplicateCredentialGuard', () => ({
    useDuplicateCredentialGuard: () => ({
        isCheckingDuplicate: false,
        requestDuplicateResolution: vi.fn(),
        duplicateCredentialPrompt: null,
    }),
}));

vi.mock('learn-card-base/helpers/credentialHelpers', () => ({
    getAchievementType: () => 'Achievement',
    getDefaultCategoryForCredential: () => 'Achievement',
    getIssuerImageNonBoost: () => undefined,
    getIssuerNameNonBoost: () => 'Issuer',
}));

vi.mock('learn-card-base/helpers/walletHelpers', () => ({
    getEmojiFromDidString: () => 'x',
    getUserHandleFromDid: () => undefined,
}));

vi.mock('uuid', () => ({ v4: () => 'event-id' }));

vi.mock('../pathways/events/walletEventBus', () => ({ publishWalletEvent: vi.fn() }));

vi.mock('../../helpers/categoryRoutes', () => ({
    CATEGORY_TO_ROUTE: { Achievement: '/achievements' },
}));

vi.mock('../../Routes', () => ({ ROUTE_PRELOAD: {} }));

vi.mock(
    'learn-card-base/components/boost/claimBoostLoggedOutPrompt/ClaimBoostLoggedOutPrompt',
    () => ({
        default: () => null,
    })
);

vi.mock('learn-card-base/components/CredentialBadge/CredentialVerificationDisplay', () => ({
    getInfoFromCredential: () => ({ createdAt: '2026-01-01T00:00:00.000Z' }),
}));

vi.mock('lucide-react', () => ({
    AlertCircle: () => null,
    CheckCircle: () => null,
    Home: () => null,
    RefreshCw: () => null,
}));

vi.mock('../../paraglide/messages.js', () => ({
    'claim.duplicate.skippedToast': () => 'Duplicate skipped',
    'toasts.alreadyClaimed': () => 'Already claimed',
    'toasts.claimOops': () => 'Oops',
}));

vi.mock('./ExchangeLoading', () => ({ default: () => <div>Exchange loading</div> }));
vi.mock('./ExchangePresentationRequest', () => ({
    default: () => <div>Presentation request</div>,
}));
vi.mock('./ExchangeRedirect', () => ({ default: () => <div>Redirect</div> }));
vi.mock('./ExchangeInitiate', () => ({ default: () => <div>Initiate</div> }));
vi.mock('./InboxClaimProfileGate', () => ({ default: () => <div>Profile gate</div> }));
vi.mock('./LoggedOutRequest', () => ({ default: () => <div>Logged out</div> }));

vi.mock('./ExchangeDidAuth', () => ({
    default: ({ onSubmit }: { onSubmit: (body: unknown) => void }) => (
        <button onClick={() => onSubmit({ verifiablePresentation: { holder: 'did:key:holder' } })}>
            did-auth
        </button>
    ),
}));

vi.mock('./ExchangeAcceptCredentials', () => ({
    default: ({
        inboxClaimOutcomes,
        onAccept,
        onCheckAgain,
        onGoHome,
    }: {
        inboxClaimOutcomes?: InboxClaimOutcome[];
        onAccept: (body: Record<string, unknown>, count: number) => void;
        onCheckAgain?: () => void;
        onGoHome?: () => void;
    }) => (
        <div>
            <span data-testid="outcomes">{JSON.stringify(inboxClaimOutcomes ?? [])}</span>
            <button onClick={() => onAccept({}, 1)}>accept</button>
            {onCheckAgain && <button onClick={onCheckAgain}>check-again</button>}
            <button onClick={onGoHome}>go-home</button>
        </div>
    ),
}));

const inboxUrl = 'http://localhost:4000/api/workflows/inbox-claim/exchanges/claim-token';
const secondInboxUrl = 'http://localhost:4000/api/workflows/inbox-claim/exchanges/claim-token-2';
const genericUrl = 'http://localhost:4000/api/workflows/claim/exchanges/exchange-id';

const credential = {
    id: 'urn:uuid:issued-instance',
    issuer: 'did:key:issuer',
    name: 'Safety Training',
    type: ['VerifiableCredential'],
} as VC;

const jsonResponse = (body: unknown) => ({
    ok: true,
    status: 200,
    text: async () => JSON.stringify(body),
});

const didAuthChallenge = (challenge: string) =>
    jsonResponse({
        verifiablePresentationRequest: {
            query: [{ type: 'DIDAuthentication' }],
            challenge,
            domain: 'localhost',
        },
    });

const setUrl = (url: string) => {
    mocks.search.value = `?vc_request_url=${encodeURIComponent(url)}`;
};

describe('ClaimFromRequest inbox claim outcomes', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        setUrl(inboxUrl);
        vi.stubGlobal('fetch', mocks.fetch);
    });

    const reachPendingAcceptScreen = async (outcomes: InboxClaimOutcome[]) => {
        mocks.fetch.mockResolvedValueOnce(didAuthChallenge('challenge-1')).mockResolvedValueOnce(
            jsonResponse({
                verifiablePresentation: {
                    type: ['VerifiablePresentation'],
                    verifiableCredential: [],
                },
                inboxClaimOutcomes: outcomes,
            })
        );

        render(<ClaimFromRequest />);

        fireEvent.click(await screen.findByRole('button', { name: 'did-auth' }));

        const outcomesNode = await screen.findByTestId('outcomes');
        await waitFor(() => expect(outcomesNode).toHaveTextContent(outcomes[0].status));
    };

    it('retains the pending summary instead of navigating on local acceptance', async () => {
        await reachPendingAcceptScreen([{ id: 'awaiting-1', status: 'AWAITING_GUARDIAN' }]);

        fireEvent.click(screen.getByRole('button', { name: 'accept' }));

        // No new initiation, no navigation away from the waiting state.
        expect(mocks.fetch).toHaveBeenCalledTimes(2);
        expect(mocks.replace).not.toHaveBeenCalled();
        expect(screen.getByTestId('outcomes')).toHaveTextContent('AWAITING_GUARDIAN');
    });

    it('starts a fresh challenge with an empty body (no stale signed VP) on Check Again', async () => {
        await reachPendingAcceptScreen([{ id: 'awaiting-1', status: 'AWAITING_GUARDIAN' }]);

        mocks.fetch.mockResolvedValueOnce(didAuthChallenge('challenge-2'));
        fireEvent.click(screen.getByRole('button', { name: 'check-again' }));

        await waitFor(() => expect(mocks.fetch).toHaveBeenCalledTimes(3));

        const [url, init] = mocks.fetch.mock.calls[2];
        expect(url).toBe(inboxUrl);
        expect(init).toMatchObject({ method: 'POST', body: '{}' });
        expect(JSON.parse(init.body)).not.toHaveProperty('verifiablePresentation');
        expect(JSON.parse(init.body)).not.toHaveProperty('@context');
    });

    it('clears stale outcomes when a later response carries none', async () => {
        await reachPendingAcceptScreen([{ id: 'awaiting-1', status: 'AWAITING_GUARDIAN' }]);

        mocks.fetch.mockResolvedValueOnce(didAuthChallenge('challenge-2')).mockResolvedValueOnce(
            jsonResponse({
                verifiablePresentation: {
                    type: ['VerifiablePresentation'],
                    verifiableCredential: [],
                },
            })
        );

        fireEvent.click(screen.getByRole('button', { name: 'check-again' }));
        fireEvent.click(await screen.findByRole('button', { name: 'did-auth' }));

        await waitFor(() => expect(screen.getByTestId('outcomes')).toHaveTextContent('[]'));
    });

    it('clears stale outcomes when the exchange URL changes', async () => {
        mocks.fetch.mockResolvedValueOnce(didAuthChallenge('challenge-1')).mockResolvedValueOnce(
            jsonResponse({
                verifiablePresentation: {
                    type: ['VerifiablePresentation'],
                    verifiableCredential: [],
                },
                inboxClaimOutcomes: [{ id: 'awaiting-1', status: 'AWAITING_GUARDIAN' }],
            })
        );

        const { rerender } = render(<ClaimFromRequest />);

        fireEvent.click(await screen.findByRole('button', { name: 'did-auth' }));
        await waitFor(() =>
            expect(screen.getByTestId('outcomes')).toHaveTextContent('AWAITING_GUARDIAN')
        );

        setUrl(secondInboxUrl);
        rerender(<ClaimFromRequest />);

        await waitFor(() => expect(screen.getByTestId('outcomes')).toHaveTextContent('[]'));
    });

    it('preserves generic VC-API post-claim navigation', async () => {
        setUrl(genericUrl);

        mocks.fetch
            .mockResolvedValueOnce(
                jsonResponse({
                    verifiablePresentation: {
                        type: ['VerifiablePresentation'],
                        verifiableCredential: [credential],
                    },
                })
            )
            .mockResolvedValueOnce(didAuthChallenge('challenge-generic'));

        render(<ClaimFromRequest />);

        await screen.findByTestId('outcomes');
        fireEvent.click(screen.getByRole('button', { name: 'accept' }));

        await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith('/achievements'));
    });

    it('never renders raw server error text that could contain names or emails', async () => {
        setUrl(inboxUrl);

        mocks.fetch.mockResolvedValueOnce(
            jsonResponse({ message: 'Failed to issue to Jane Doe <jane.doe@example.com>' })
        );

        render(<ClaimFromRequest />);

        await screen.findByText(/We couldn't complete your request/i);

        expect(screen.queryByText(/jane\.doe@example\.com/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Jane Doe/)).not.toBeInTheDocument();
    });
});
