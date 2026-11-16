// @vitest-environment jsdom
import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type Latest = {
    status: 'requested' | 'none_yet' | 'failed';
    requestId: string;
    requestedAt: string;
    receivedAt?: string;
};

type EarnedCardProps = {
    record: { uri: string; category?: string };
    credential: unknown;
    categoryType: string;
    renderPreviewTrigger?: (openPreview: () => void) => React.ReactNode;
};

const mocks = vi.hoisted(() => ({
    latest: undefined as Latest | undefined,
    request: vi.fn(),
    isPollingExhausted: false,
    transcript: null as null | { entry: { vc: object; uri: string }; model: object },
    earnedCard: vi.fn(),
    openPreview: vi.fn(),
    track: vi.fn(),
}));

vi.mock('@ionic/react', () => ({ IonIcon: () => null }));
vi.mock('learn-card-base', () => ({
    useTranscriptStatus: () => ({
        data: {
            eligible: true,
            issuerDid: 'did:issuer',
            issuerProfileId: 'issuer-profile',
            stateDisplayName: 'Example',
            latest: mocks.latest,
        },
    }),
    useRequestTranscript: () => ({ mutateAsync: mocks.request, isPending: false }),
    getLogger: () => ({ error: vi.fn(), warn: vi.fn() }),
}));
// The Passport's own card opens the viewer; the flow only supplies the trigger.
vi.mock('../boost/boost-earned-card/BoostEarnedCard', () => ({
    default: (props: EarnedCardProps) => {
        mocks.earnedCard(props);
        return <>{props.renderPreviewTrigger?.(mocks.openPreview)}</>;
    },
}));
vi.mock('@analytics', () => ({
    useAnalytics: () => ({ track: mocks.track }),
    AnalyticsEvents: {
        TRANSCRIPT_REQUESTED: 'requested',
        TRANSCRIPT_AUTO_ACCEPT_SKIPPED: 'skipped',
    },
}));
vi.mock('../../hooks/useTranscriptArrival', () => ({
    useTranscriptArrival: () => ({ isPollingExhausted: mocks.isPollingExhausted }),
}));
vi.mock('../../hooks/useReceivedTranscript', () => ({
    useReceivedTranscript: ({ enabled }: { enabled?: boolean }) =>
        enabled && mocks.transcript
            ? { entry: mocks.transcript.entry, model: mocks.transcript.model }
            : { entry: undefined, model: null },
}));

import {
    TranscriptRequestFlow,
    TRANSCRIPT_FLOW_ESTIMATE_GRACE_MS,
    TRANSCRIPT_FLOW_PATIENCE_MS,
} from './TranscriptRequestFlow';

const REQUEST = { status: 'requested' as const, requestId: 'req-1', requestedAt: '2026-01-01' };
const TRANSCRIPT_VC = {
    type: ['VerifiableCredential', 'ClrCredential'],
    credentialSubject: { verifiableCredential: [{}, {}] },
};
const MODEL = {
    header: { issuerName: { value: 'Example High School' }, awardedDate: { value: '2026-06-01' } },
    summary: { gpa: { value: '3.8' }, courseCount: 24 },
};

const renderFlow = (onDone = vi.fn()) => {
    const view = render(
        <TranscriptRequestFlow variant="onboarding" stateDisplayName="Example" onDone={onDone} />
    );
    return { onDone, ...view };
};

const ask = async () => {
    fireEvent.click(screen.getByRole('checkbox'));
    await act(async () => {
        fireEvent.click(screen.getByTestId('onboarding-transcript-get'));
    });
};

beforeEach(() => {
    mocks.latest = undefined;
    mocks.transcript = null;
    mocks.isPollingExhausted = false;
    mocks.request.mockReset().mockResolvedValue(REQUEST);
    mocks.track.mockReset();
    mocks.earnedCard.mockReset();
    mocks.openPreview.mockReset();
});
afterEach(() => {
    cleanup();
    vi.useRealTimers();
});

describe('TranscriptRequestFlow', () => {
    it('asks for consent before requesting', () => {
        renderFlow();
        expect(screen.getByTestId('transcript-flow-ask')).toBeTruthy();
        expect(screen.getByTestId('onboarding-transcript-get')).toHaveProperty('disabled', true);
    });

    it('stays on screen after requesting and shows live progress', async () => {
        const { onDone } = renderFlow();
        await ask();
        expect(mocks.request).toHaveBeenCalledTimes(1);
        expect(screen.getByTestId('transcript-flow-on-the-way')).toBeTruthy();
        expect(onDone).not.toHaveBeenCalled();
    });

    it('marks the school step done once the transcript is received', async () => {
        mocks.latest = { ...REQUEST, receivedAt: '2026-01-02' };
        renderFlow();
        await ask();
        const steps = screen.getAllByRole('listitem').map(item => item.textContent);
        expect(steps[1]).toMatch(/preparing your transcript \(done\)/);
        expect(steps[2]).toMatch(/Adding it to your account \(in progress\)/);
    });

    it('reveals the arrived transcript with a summary and continues', async () => {
        mocks.latest = { ...REQUEST, receivedAt: '2026-01-02' };
        mocks.transcript = { entry: { vc: TRANSCRIPT_VC, uri: 'lc:t' }, model: MODEL };
        const { onDone } = renderFlow();
        await ask();
        expect(screen.getByTestId('transcript-flow-arrived')).toBeTruthy();
        expect(screen.getByText('Example High School')).toBeTruthy();
        expect(screen.getByText('3.8')).toBeTruthy();
        expect(screen.getByText('24')).toBeTruthy();
        expect(mocks.earnedCard).toHaveBeenLastCalledWith(
            expect.objectContaining({
                credential: TRANSCRIPT_VC,
                record: { uri: 'lc:t', category: 'Learning History' },
                categoryType: 'Learning History',
            })
        );
        fireEvent.click(screen.getByTestId('transcript-flow-view'));
        expect(mocks.openPreview).toHaveBeenCalledTimes(1);
        await act(async () => {
            fireEvent.click(screen.getByTestId('transcript-flow-continue'));
        });
        expect(onDone).toHaveBeenCalledWith({ requested: true });
    });

    it('lets the student move on when it takes longer', async () => {
        vi.useFakeTimers({ shouldAdvanceTime: true });
        const { onDone } = renderFlow();
        await ask();
        act(() => {
            vi.advanceTimersByTime(TRANSCRIPT_FLOW_PATIENCE_MS);
        });
        expect(screen.getByTestId('transcript-flow-longer')).toBeTruthy();
        await act(async () => {
            fireEvent.click(screen.getByTestId('transcript-flow-continue'));
        });
        expect(onDone).toHaveBeenCalledWith({ requested: true });
    });

    describe('with a delivery estimate from the school', () => {
        const requestExpecting = (inMs: number) => {
            const now = Date.now();
            return {
                ...REQUEST,
                requestedAt: new Date(now).toISOString(),
                expectedBy: new Date(now + inMs).toISOString(),
            };
        };

        it('keeps the live steps for an estimate of 30 seconds or less', async () => {
            mocks.request.mockResolvedValue(requestExpecting(20_000));
            renderFlow();
            await ask();
            expect(screen.getByTestId('transcript-flow-on-the-way')).toBeTruthy();
        });

        it('shows a progress bar with time left for an estimate of a couple of minutes', async () => {
            vi.useFakeTimers({ shouldAdvanceTime: true });
            mocks.request.mockResolvedValue(requestExpecting(120_000));
            const { onDone } = renderFlow();
            await ask();
            expect(screen.getByTestId('transcript-flow-timed')).toBeTruthy();
            const bar = screen.getByRole('progressbar');
            expect(bar.getAttribute('aria-valuetext')).toBe('About 2 minutes left');
            const startValue = Number(bar.getAttribute('aria-valuenow'));

            // The usual 90-second patience doesn't cut a two-minute estimate short.
            act(() => {
                vi.advanceTimersByTime(TRANSCRIPT_FLOW_PATIENCE_MS);
            });
            expect(screen.getByTestId('transcript-flow-timed')).toBeTruthy();
            expect(
                Number(screen.getByRole('progressbar').getAttribute('aria-valuenow'))
            ).toBeGreaterThan(startValue);
            expect(onDone).not.toHaveBeenCalled();

            act(() => {
                vi.advanceTimersByTime(
                    120_000 - TRANSCRIPT_FLOW_PATIENCE_MS + TRANSCRIPT_FLOW_ESTIMATE_GRACE_MS
                );
            });
            expect(screen.getByTestId('transcript-flow-longer')).toBeTruthy();
        });

        it('confirms the request and when to expect it for a longer estimate', async () => {
            mocks.request.mockResolvedValue(requestExpecting(3 * 60 * 60_000));
            mocks.isPollingExhausted = true;
            const { onDone } = renderFlow();
            await ask();
            expect(screen.getByTestId('transcript-flow-later')).toBeTruthy();
            expect(screen.getByText('Transcript requested')).toBeTruthy();
            expect(screen.getByText('Your school expects to send it in 3 hours.')).toBeTruthy();
            expect(screen.queryByRole('progressbar')).toBeNull();
            await act(async () => {
                fireEvent.click(screen.getByTestId('transcript-flow-continue'));
            });
            expect(onDone).toHaveBeenCalledWith({ requested: true });
        });

        it('still reveals the transcript if it arrives early', async () => {
            const request = requestExpecting(3 * 60 * 60_000);
            mocks.request.mockResolvedValue(request);
            mocks.latest = { ...request, receivedAt: new Date().toISOString() };
            mocks.transcript = { entry: { vc: TRANSCRIPT_VC, uri: 'lc:t' }, model: MODEL };
            renderFlow();
            await ask();
            expect(screen.getByTestId('transcript-flow-arrived')).toBeTruthy();
        });
    });

    it('moves on when polling is exhausted', async () => {
        mocks.isPollingExhausted = true;
        renderFlow();
        await ask();
        expect(screen.getByTestId('transcript-flow-longer')).toBeTruthy();
    });

    it('shows a friendly error and lets the student try again', async () => {
        mocks.request.mockRejectedValueOnce(new Error('network'));
        renderFlow();
        await ask();
        expect(screen.getByTestId('transcript-flow-ask')).toBeTruthy();
        expect(screen.getByTestId('onboarding-transcript-get').textContent).toMatch(/Try Again/);
        await act(async () => {
            fireEvent.click(screen.getByTestId('onboarding-transcript-get'));
        });
        await waitFor(() => expect(screen.getByTestId('transcript-flow-on-the-way')).toBeTruthy());
    });

    it('treats a failed outcome as an error, not progress', async () => {
        mocks.request.mockResolvedValueOnce({ ...REQUEST, status: 'failed' });
        renderFlow();
        await ask();
        expect(screen.getByTestId('transcript-flow-ask')).toBeTruthy();
    });

    it('explains when there is no transcript yet', async () => {
        mocks.request.mockResolvedValueOnce({ ...REQUEST, status: 'none_yet' });
        const { onDone } = renderFlow();
        await ask();
        expect(screen.getByTestId('transcript-flow-none-yet')).toBeTruthy();
        await act(async () => {
            fireEvent.click(screen.getByTestId('transcript-flow-continue'));
        });
        expect(onDone).toHaveBeenCalledWith({ requested: true });
    });

    it('Not now finishes without requesting', async () => {
        const { onDone } = renderFlow();
        await act(async () => {
            fireEvent.click(screen.getByTestId('onboarding-transcript-skip'));
        });
        expect(mocks.request).not.toHaveBeenCalled();
        expect(onDone).toHaveBeenCalledWith({ requested: false });
    });
});
