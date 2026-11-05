import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    latest: undefined as
        | { status: 'requested'; requestId: string; requestedAt: string; receivedAt?: string }
        | undefined,
    request: vi.fn(),
    arrival: vi.fn(),
    newModal: vi.fn(),
    arrived: false,
}));
vi.mock('react-router-dom', () => ({ useHistory: () => ({ push: vi.fn() }) }));
vi.mock('@tanstack/react-query', () => ({ useQuery: () => ({ data: undefined }) }));
vi.mock('@ionic/react', () => ({ IonIcon: () => null }));
vi.mock('learn-card-base', () => ({
    useTranscriptStatus: () => ({
        data: {
            eligible: true,
            issuerDid: 'did:issuer',
            stateDisplayName: 'Example',
            latest: mocks.latest,
        },
        isFetched: true,
    }),
    useRequestTranscript: () => ({ mutateAsync: mocks.request }),
    useFeatureConfig: () => ({ classlinkTranscriptOptIn: true }),
    useGetCredentials: () => ({ data: mocks.arrived ? [{ vc: { type: ['ClrCredential'] } }] : [] }),
    useWallet: () => ({ initWallet: vi.fn() }),
    useModal: () => ({ newModal: mocks.newModal }),
    getIssuerDid: () => 'did:issuer',
    Checkbox: ({ onChange }: { onChange: (value: boolean) => void }) => (
        <input type="checkbox" onChange={event => onChange(event.target.checked)} />
    ),
}));
vi.mock('learn-card-base/react-query/mutations/firebase', () => ({
    useClassLinkAuthorizeUrl: () => ({ mutateAsync: vi.fn() }),
}));
vi.mock('../../hooks/useTranscriptArrival', () => ({ useTranscriptArrival: mocks.arrival }));
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
vi.mock('../../auth/classlink/startClassLinkLogin', () => ({ startClassLinkLogin: vi.fn() }));

import { TranscriptOptInCard } from './TranscriptOptInCard';

beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mocks.latest = undefined;
    mocks.arrived = false;
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
        expect(mocks.arrival).toHaveBeenLastCalledWith(expect.objectContaining(result))
    );
    mocks.latest = { ...result, receivedAt: new Date().toISOString() };
    mocks.arrived = true;
    rerender(<TranscriptOptInCard source="wallet" />);
    expect(mocks.arrival).toHaveBeenLastCalledWith(
        expect.objectContaining({ receivedAt: mocks.latest.receivedAt })
    );
    expect(screen.getByText('Added to your account')).toBeTruthy();
});
