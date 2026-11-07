import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

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
    arrived: false,
    useTranscriptStatus: vi.fn(),
    useGetCredentials: vi.fn(),
    refetchStatus: vi.fn(),
    push: vi.fn(),
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
vi.mock('@tanstack/react-query', () => ({ useQuery: () => ({ data: undefined }) }));
vi.mock('@ionic/react', () => ({ IonIcon: () => null }));
vi.mock('learn-card-base', () => ({
    useTranscriptStatus: (enabled: boolean) => {
        mocks.useTranscriptStatus(enabled);
        return {
            data: {
                eligible: !mocks.reason,
                reason: mocks.reason,
                issuerDid: 'did:issuer',
                issuerProfileId: 'issuer-profile',
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
    useWallet: () => ({ initWallet: vi.fn() }),
    useModal: () => ({ newModal: mocks.newModal }),
    getIssuerDid: () => 'did:issuer',
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
vi.mock('../clr-transcript/ClrTranscriptDetailModal', () => ({ default: () => null }));
vi.mock('learn-card-base/helpers/credentials/clr/renderer', () => ({
    ClrTranscriptSurface: { Full: 'full' },
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

beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mocks.latest = undefined;
    mocks.reason = undefined;
    mocks.arrived = false;
    mocks.flagOn = true;
    mocks.isPollingExhausted = false;
});

describe('TranscriptOptInCard', () => {
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

    it('shows a spinner-only waiting state for a fresh request', () => {
        mocks.latest = {
            status: 'requested',
            requestId: 'r1',
            requestedAt: new Date().toISOString(),
        };
        render(<TranscriptOptInCard source="wallet" />);
        expect(screen.getByText(/Requesting from Example/)).toBeTruthy();
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
                new Error('Please wait before requesting your transcript again.')
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

        it('still shows a received transcript instead of a reconnect prompt', () => {
            mocks.latest = {
                status: 'requested',
                requestId: 'r1',
                requestedAt: new Date().toISOString(),
                receivedAt: new Date().toISOString(),
            };
            mocks.arrived = true;
            render(<TranscriptOptInCard source="wallet" />);
            expect(screen.getByText('Added to your account')).toBeTruthy();
            expect(screen.getByText('View Transcript')).toBeTruthy();
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
