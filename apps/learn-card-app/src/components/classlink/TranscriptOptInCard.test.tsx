// @vitest-environment jsdom
import React from 'react';
import {
    act,
    cleanup,
    fireEvent,
    render as renderWithContext,
    screen,
    waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

type Latest = {
    status: 'requested' | 'none_yet' | 'failed';
    requestId: string;
    requestedAt: string;
    receivedAt?: string;
};

const mocks = vi.hoisted(() => ({
    latest: undefined as Latest | undefined,
    reason: undefined as 'no_state_id' | 'reauth_required' | 'not_enabled' | undefined,
    flagOn: true,
    request: vi.fn(),
    arrival: vi.fn(),
    checkAgain: vi.fn(),
    isPollingExhausted: false,
    newModal: vi.fn(),
    passportCard: vi.fn(),
    arrived: false,
    useTranscriptStatus: vi.fn(),
    useGetCredentials: vi.fn(),
    refetchStatus: vi.fn(),
    push: vi.fn(),
    issuerDid: 'did:issuer' as string | undefined,
    issuerProfileId: 'issuer-profile' as string | undefined,
    indexGet: vi.fn(),
    read: vi.fn(),
    warn: vi.fn(),
}));

/**
 * In-memory Storage: Node 25 ships an experimental global `localStorage` that
 * shadows jsdom's and lacks `clear()`.
 */
const memoryStorage = (() => {
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
    } as Storage;
})();
vi.stubGlobal('localStorage', memoryStorage);

vi.mock('react-router-dom', () => ({ useHistory: () => ({ push: mocks.push }) }));
const wallet = {
    id: { did: () => 'did:user' },
    index: { LearnCloud: { get: mocks.indexGet } },
    read: { get: mocks.read },
};
const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
const render = (ui: React.ReactElement) =>
    renderWithContext(ui, {
        wrapper: ({ children }) => (
            <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        ),
    });
vi.mock('@ionic/react', () => ({ IonIcon: () => null }));
vi.mock('learn-card-base', () => ({
    useTranscriptStatus: (enabled: boolean) => {
        mocks.useTranscriptStatus(enabled);
        return {
            data: {
                eligible: !mocks.reason,
                reason: mocks.reason,
                issuerDid: mocks.issuerDid,
                issuerProfileId: mocks.issuerProfileId,
                stateDisplayName: 'Example',
                latest: mocks.latest,
            },
            isFetched: true,
            refetch: mocks.refetchStatus,
        };
    },
    useRequestTranscript: () => ({ mutateAsync: mocks.request }),
    useFeatureConfig: () => ({ classlinkTranscriptOptIn: mocks.flagOn }),
    useGetCredentials: (...args: unknown[]) => {
        mocks.useGetCredentials(...args);
        return {
            data: mocks.arrived ? [{ vc: { type: ['ClrCredential'] }, uri: 'lc:t' }] : [],
        };
    },
    useWallet: () => ({ initWallet: async () => wallet }),
    walletStore: { use: { wallet: () => wallet } },
    switchedProfileStore: { use: { switchedDid: () => undefined } },
    getLogger: () => ({ warn: mocks.warn }),
    useModal: () => ({ newModal: mocks.newModal }),
    getIssuerDid: (vc: { issuer: string | { id: string } }) =>
        typeof vc.issuer === 'string' ? vc.issuer : vc.issuer?.id,
    Checkbox: ({ onChange, label }: { onChange: (value: boolean) => void; label: string }) => (
        <input
            type="checkbox"
            aria-label={label}
            onChange={event => onChange(event.target.checked)}
        />
    ),
}));
vi.mock('learn-card-base/react-query/mutations/firebase', () => ({
    useClassLinkAuthorizeUrl: () => ({ mutateAsync: vi.fn() }),
}));
vi.mock('../../hooks/useTranscriptArrival', () => ({
    useTranscriptArrival: (params: unknown) => {
        mocks.arrival(params);
        return { isPollingExhausted: mocks.isPollingExhausted, checkAgain: mocks.checkAgain };
    },
}));
vi.mock('../../pages/wallet/activity-feed/PassportCredentialCard', () => ({
    default: (props: { record: { uri: string; category?: string } }) => {
        mocks.passportCard(props);
        return <div data-testid="passport-credential-card" />;
    },
}));
vi.mock('learn-card-base/helpers/credentials/clr/display', () => ({
    normalizeClrTranscriptDisplayModel: () => ({ header: {}, summary: {} }),
}));
vi.mock('@analytics', () => ({ useAnalytics: () => ({ track: vi.fn() }), AnalyticsEvents: {} }));
vi.mock('../../providers/AuthCoordinatorProvider', () => ({
    useAppAuth: () => ({ state: { status: 'ready' } }),
}));
vi.mock('../../auth/classlink/startClassLinkLogin', () => ({ runClassLinkLogin: vi.fn() }));

import { TranscriptOptInCard, TRANSCRIPT_STALE_AFTER_MS } from './TranscriptOptInCard';
import {
    getTranscriptReceiptKey,
    readTranscriptReceipt,
    storeTranscriptReceipt,
} from '../../hooks/transcriptReceipt';

afterEach(() => {
    cleanup();
    queryClient.clear();
    vi.useRealTimers();
});

beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mocks.latest = undefined;
    mocks.reason = undefined;
    mocks.arrived = false;
    mocks.flagOn = true;
    mocks.isPollingExhausted = false;
    mocks.issuerDid = 'did:issuer';
    mocks.issuerProfileId = 'issuer-profile';
    mocks.indexGet.mockReset().mockResolvedValue([]);
    mocks.passportCard.mockReset();
    mocks.read.mockReset().mockResolvedValue(undefined);
});

describe('TranscriptOptInCard', () => {
    const received = () => {
        mocks.latest = {
            status: 'requested',
            requestId: 'r1',
            requestedAt: new Date().toISOString(),
            receivedAt: new Date().toISOString(),
        };
    };

    it('resolves a stored receipt through the shared query even when the index is stale', async () => {
        received();
        const vc = { issuer: 'did:issuer', type: ['VerifiableCredential', 'ClrCredential'] };
        mocks.read.mockResolvedValue(vc);
        // Reproduce the core cache-first list, which never contains the new transcript.
        expect(await wallet.index.LearnCloud.get({})).toEqual([]);
        storeTranscriptReceipt('did:user', 'r1', 'lc:transcript');
        const key = getTranscriptReceiptKey('did:user', 'r1');
        expect(key).toMatch(/^transcript_receipt:[a-f0-9]{64}$/);
        expect(readTranscriptReceipt('did:other', 'r1')).toBeNull();
        render(<TranscriptOptInCard source="school_connect" />);
        await screen.findByTestId('passport-credential-card');
        expect(mocks.read).toHaveBeenCalledWith('lc:transcript');
        expect(
            queryClient.getQueryData(['useGetResolvedCredential', 'lc:transcript', 'did:user'])
        ).toEqual(vc);
        expect(mocks.indexGet.mock.calls.filter(([query]) => !query.uri)).toHaveLength(1);
    });

    it.each(['did:issuer', { id: 'did:issuer' }])(
        'discovers and stores a fresh all-category transcript with issuer %j',
        async issuer => {
            received();
            mocks.indexGet.mockImplementation((_query, options) =>
                Promise.resolve(
                    options?.cache === 'skip-cache'
                        ? [{ uri: 'lc:transcript', category: 'Achievement' }]
                        : []
                )
            );
            mocks.read.mockResolvedValue({
                issuer,
                type: ['VerifiableCredential', 'ClrCredential'],
            });
            expect(await wallet.index.LearnCloud.get({})).toEqual([]);
            render(<TranscriptOptInCard source="school_connect" />);
            await screen.findByTestId('passport-credential-card');
            // Shown as its Passport card, under the category the wallet index stored.
            await waitFor(() =>
                expect(mocks.passportCard).toHaveBeenLastCalledWith({
                    className: 'w-fit',
                    record: expect.objectContaining({
                        uri: 'lc:transcript',
                        category: 'Achievement',
                    }),
                })
            );
            expect(mocks.indexGet).toHaveBeenCalledWith({}, { cache: 'skip-cache' });
            expect(readTranscriptReceipt('did:user', 'r1')).toBe('lc:transcript');
        }
    );

    it('offers Passport after ten seconds, including a stalled lookup, with a fixed-code warning', async () => {
        vi.useFakeTimers();
        received();
        mocks.indexGet.mockImplementation(() => new Promise(() => {}));
        render(<TranscriptOptInCard source="school_connect" />);
        expect(screen.getByText('Finishing up…')).toBeTruthy();
        await act(async () => vi.advanceTimersByTimeAsync(9_999));
        expect(screen.queryByText("It's in your Passport.")).toBeNull();
        await act(async () => vi.advanceTimersByTimeAsync(1));
        expect(screen.getByText("It's in your Passport.")).toBeTruthy();
        expect(screen.queryByText('Finishing up…')).toBeNull();
        fireEvent.click(screen.getByRole('button', { name: 'View in Passport' }));
        expect(mocks.push).toHaveBeenCalledWith('/passport');
        expect(mocks.warn).toHaveBeenCalledExactlyOnceWith('transcript-display.resolution.timeout');
    });

    it.each(['received', 'ineligible', 'disabled'])('hides the Passport banner when %s', state => {
        if (state === 'received') received();
        if (state === 'ineligible') mocks.reason = 'no_state_id';
        if (state === 'disabled') mocks.flagOn = false;
        const { container } = render(<TranscriptOptInCard source="wallet" variant="banner" />);
        expect(container.innerHTML).toBe('');
    });

    it.each([
        [undefined, 'Get your official transcript', 'Get it'],
        ['requested', 'Your school is preparing your transcript.', undefined],
        ['failed', "We couldn't reach your school records", 'Try Again'],
        ['none_yet', "We couldn't reach your school records", 'Try Again'],
    ] as const)('shows a compact %s banner', (status, text, action) => {
        if (status)
            mocks.latest = { status, requestId: 'r1', requestedAt: new Date().toISOString() };
        render(<TranscriptOptInCard source="wallet" variant="banner" />);
        expect(screen.getByText(text)).toBeTruthy();
        expect(screen.queryByTestId('transcript-optin-card')).toBeNull();
        expect(screen.queryByRole('checkbox')).toBeNull();
        if (action) {
            fireEvent.click(screen.getByRole('button', { name: action }));
            expect(mocks.push).toHaveBeenCalledWith('/school-connect');
        } else expect(screen.queryByRole('button')).toBeNull();
    });

    it('uses the request ID immediately and then the server arrival after a same-session request', async () => {
        const result = {
            status: 'requested' as const,
            requestId: 'request-test',
            requestedAt: new Date().toISOString(),
        };
        mocks.request.mockResolvedValue(result);
        const { rerender } = render(<TranscriptOptInCard source="wallet" />);
        fireEvent.click(screen.getByRole('checkbox'));
        fireEvent.click(screen.getByTestId('transcript-optin-submit'));
        await waitFor(() =>
            expect(mocks.arrival).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    ...result,
                    issuerDid: 'did:issuer',
                    issuerProfileId: 'issuer-profile',
                })
            )
        );
        mocks.latest = { ...result, receivedAt: new Date().toISOString() };
        mocks.arrived = true;
        rerender(<TranscriptOptInCard source="wallet" />);
        expect(mocks.arrival).toHaveBeenLastCalledWith(
            expect.objectContaining({ receivedAt: mocks.latest.receivedAt })
        );
        expect(screen.getByText('Added to your account')).toBeTruthy();
    });

    it('fetches nothing and renders nothing when the tenant flag is off', () => {
        mocks.flagOn = false;
        const { container } = render(<TranscriptOptInCard source="wallet" />);
        expect(container.innerHTML).toBe('');
        expect(mocks.useTranscriptStatus).not.toHaveBeenCalled();
        expect(mocks.useGetCredentials).not.toHaveBeenCalled();
        expect(mocks.arrival).not.toHaveBeenCalled();
    });

    it('does not resolve wallet credentials before a transcript was received', () => {
        render(<TranscriptOptInCard source="wallet" />);
        expect(screen.getByTestId('transcript-optin-submit')).toBeTruthy();
        expect(mocks.useGetCredentials).not.toHaveBeenCalled();
    });

    it('shows the received state (not the opt-in form) while the credential is still resolving', () => {
        mocks.latest = {
            status: 'requested',
            requestId: 'r1',
            requestedAt: new Date().toISOString(),
            receivedAt: new Date().toISOString(),
        };
        mocks.arrived = false;
        render(<TranscriptOptInCard source="wallet" />);
        expect(screen.getByText('Added to your account')).toBeTruthy();
        expect(screen.getByTestId('transcript-optin-received-pending')).toBeTruthy();
        expect(screen.queryByTestId('transcript-optin-submit')).toBeNull();
    });

    it('shows a waiting state for a fresh request', () => {
        mocks.latest = {
            status: 'requested',
            requestId: 'r1',
            requestedAt: new Date().toISOString(),
        };
        render(<TranscriptOptInCard source="wallet" />);
        expect(screen.getByText(/Your school is preparing your transcript/)).toBeTruthy();
        expect(screen.queryByTestId('transcript-optin-stale')).toBeNull();
    });

    it('shows untrackable state when issuerDid or issuerProfileId is missing', () => {
        mocks.issuerDid = undefined;
        mocks.latest = {
            status: 'requested',
            requestId: 'r1',
            requestedAt: new Date().toISOString(),
        };
        render(<TranscriptOptInCard source="wallet" />);
        expect(screen.getByText(/Request Sent/)).toBeTruthy();
        expect(screen.getByText(/We'll notify you when it arrives/)).toBeTruthy();
        expect(screen.queryByTestId('transcript-optin-stale')).toBeNull();
    });

    it('offers a recoverable path when a request has been outstanding for over a day', () => {
        mocks.latest = {
            status: 'requested',
            requestId: 'r1',
            requestedAt: new Date(Date.now() - TRANSCRIPT_STALE_AFTER_MS - 1000).toISOString(),
        };
        render(<TranscriptOptInCard source="wallet" />);
        expect(screen.getByTestId('transcript-optin-stale')).toBeTruthy();

        fireEvent.click(screen.getByTestId('transcript-optin-check-again'));
        expect(mocks.checkAgain).toHaveBeenCalledTimes(1);
        expect(mocks.refetchStatus).toHaveBeenCalledTimes(1);

        fireEvent.click(screen.getByTestId('transcript-optin-open-notifications'));
        expect(mocks.push).toHaveBeenCalledWith('/notifications');
    });

    it('offers the recoverable path once polling for the session is exhausted', () => {
        mocks.isPollingExhausted = true;
        mocks.latest = {
            status: 'requested',
            requestId: 'r1',
            requestedAt: new Date().toISOString(),
        };
        render(<TranscriptOptInCard source="wallet" />);
        expect(screen.getByTestId('transcript-optin-stale')).toBeTruthy();
    });

    describe('after a none_yet response', () => {
        const noneYet = (): Latest => ({
            status: 'none_yet',
            requestId: 'r-none',
            requestedAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        });

        it('offers a consented retry through the same request path', async () => {
            mocks.latest = noneYet();
            mocks.request.mockResolvedValue({
                status: 'requested',
                requestId: 'r2',
                requestedAt: new Date().toISOString(),
            });
            render(<TranscriptOptInCard source="wallet" />);
            expect(screen.getByText(/no transcript for you yet/)).toBeTruthy();
            const retry = screen.getByTestId('transcript-optin-submit') as HTMLButtonElement;
            expect(retry.textContent).toBe('Try Again');
            expect(retry.disabled).toBe(true);
            fireEvent.click(retry);
            expect(mocks.request).not.toHaveBeenCalled();

            fireEvent.click(screen.getByRole('checkbox'));
            fireEvent.click(retry);
            await waitFor(() => expect(mocks.request).toHaveBeenCalledTimes(1));
        });

        it('surfaces the server budget error without losing the retry', async () => {
            mocks.latest = noneYet();
            mocks.request.mockRejectedValue(
                Object.assign(new Error('Please wait before requesting your transcript again.'), {
                    data: { code: 'TOO_MANY_REQUESTS' },
                })
            );
            render(<TranscriptOptInCard source="wallet" />);
            fireEvent.click(screen.getByRole('checkbox'));
            fireEvent.click(screen.getByTestId('transcript-optin-submit'));
            expect(await screen.findByRole('alert')).toBeTruthy();
            expect(screen.getByText(/Please wait before requesting/)).toBeTruthy();
            expect(screen.getByTestId('transcript-optin-submit')).toBeTruthy();
        });

        it('offers reconnect instead of a retry when ClassLink auth has aged out', () => {
            mocks.latest = noneYet();
            mocks.reason = 'reauth_required';
            render(<TranscriptOptInCard source="wallet" />);
            expect(screen.getByText(/no transcript for you yet/)).toBeTruthy();
            expect(screen.getByTestId('transcript-optin-reauth')).toBeTruthy();
            expect(screen.queryByTestId('transcript-optin-submit')).toBeNull();
        });
    });

    describe('when ClassLink auth has aged out (reauth_required)', () => {
        beforeEach(() => {
            mocks.reason = 'reauth_required';
        });

        it('still shows a received transcript instead of a reconnect prompt', async () => {
            mocks.latest = {
                status: 'requested',
                requestId: 'r1',
                requestedAt: new Date().toISOString(),
                receivedAt: new Date().toISOString(),
            };
            storeTranscriptReceipt('did:user', 'r1', 'lc:transcript');
            mocks.read.mockResolvedValue({ issuer: 'did:issuer', type: ['ClrCredential'] });
            render(<TranscriptOptInCard source="wallet" />);
            expect(screen.getByText('Added to your account')).toBeTruthy();
            expect(await screen.findByTestId('passport-credential-card')).toBeTruthy();
            expect(screen.queryByTestId('transcript-optin-reauth')).toBeNull();
        });

        it('still shows stale-request recovery controls', () => {
            mocks.latest = {
                status: 'requested',
                requestId: 'r1',
                requestedAt: new Date(Date.now() - TRANSCRIPT_STALE_AFTER_MS - 1000).toISOString(),
            };
            render(<TranscriptOptInCard source="wallet" />);
            expect(screen.getByTestId('transcript-optin-stale')).toBeTruthy();
            expect(screen.queryByTestId('transcript-optin-reauth')).toBeNull();
        });

        it('asks to reconnect before a first request', () => {
            render(<TranscriptOptInCard source="wallet" />);
            expect(screen.getByTestId('transcript-optin-reauth')).toBeTruthy();
            expect(screen.queryByTestId('transcript-optin-submit')).toBeNull();
        });
    });

    it('renders nothing when not enabled, even with a received transcript', () => {
        mocks.reason = 'not_enabled';
        mocks.latest = {
            status: 'requested',
            requestId: 'r1',
            requestedAt: new Date().toISOString(),
            receivedAt: new Date().toISOString(),
        };
        const { container } = render(<TranscriptOptInCard source="wallet" />);
        expect(container.innerHTML).toBe('');
    });
});
