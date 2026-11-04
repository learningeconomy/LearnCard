import React, { type ReactNode, useEffect } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AiSession } from 'learn-card-base';

import AiAssessmentContainer from './AiAssessmentContainer';
import { AiServiceError } from 'learn-card-base/helpers/aiErrors';
import { aiLoadingStore } from 'learn-card-base/stores/aiLoadingStore';

const mocks = vi.hoisted(() => ({
    preload: vi.fn(),
    finish: vi.fn(),
    logError: vi.fn(),
    closeModal: vi.fn(),
    sync: vi.fn(),
    summary: vi.fn(),
    enriched: vi.fn(),
}));
vi.mock('@ionic/react', () => ({ IonIcon: () => null }));

vi.mock('learn-card-base', () => ({
    getLogger: () => ({ error: mocks.logError }),
    ModalTypes: {},
    useModal: () => ({ newModal: vi.fn(), closeModal: mocks.closeModal }),
    useDeviceTypeByWidth: () => ({ isDesktop: true, isMobile: false }),
    usePreloadAssessment: () => ({ mutateAsync: mocks.preload }),
    useFinishAssessmentMutation: () => ({ mutateAsync: mocks.finish }),
    useSyncConsentFlow: () => ({ refetch: mocks.sync }),
    usePathQuery: () => new URLSearchParams(),
    useGetEnrichedSession: () => ({ refetch: mocks.enriched }),
    useGetSummaryInfo: () => ({ refetch: mocks.summary }),
}));
vi.mock('learn-card-base/hooks/useWallet', () => ({
    useWallet: () => ({ initWallet: async () => ({ id: { did: () => 'did:example:learner' } }) }),
}));
vi.mock('../../../paraglide/messages.js', () => ({
    'error.generic': () => 'Something went wrong. Please try again.',
    'common.tryAgain': () => 'Try Again',
    'common.close': () => 'Close',
}));
vi.mock('../../../helpers/aiError.helpers', () => ({
    getAiErrorCopy: () => ({ body: 'LearnCard AI has reached its current usage limit.' }),
}));
vi.mock('../UnFinishedAiSessionAssessmentPreviewSimple', () => ({
    default: function AssessmentPreview({ preLoadAssessment }: { preLoadAssessment: () => void }) {
        useEffect(() => {
            preLoadAssessment();
        }, []);
        return <div>Session summary</div>;
    },
}));
vi.mock('./helpers/AiAssessmentLayout', () => ({
    default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
vi.mock('./helpers/StartAssessmentButton', () => ({
    default: ({ handleStartAssessment }: { handleStartAssessment: () => void }) => (
        <button onClick={handleStartAssessment}>Let's Go</button>
    ),
}));
vi.mock('./AiAssessmentIntro', () => ({ default: () => <h1>Final Assessment</h1> }));
vi.mock('./AiAssessmentQAItems', () => ({
    default: ({ assessmentQA }: { assessmentQA: { question: string }[] }) => (
        <div>
            {assessmentQA.map((q, i) => (
                <p key={i}>{q.question}</p>
            ))}
        </div>
    ),
}));
vi.mock('../../new-ai-session/AiSessionLoader', () => ({
    default: () => <div role="status">Generating...</div>,
}));
vi.mock('./AiAssessmentHeader', () => ({ default: () => null }));
vi.mock('./AiAssessmentFooter', () => ({ default: () => null }));
vi.mock('./helpers/ViewAssessmentBadgeButton', () => ({ default: () => null }));
vi.mock('../FinishedAiSessionAssessmentPreview', () => ({
    default: ({ isCompleted }: { isCompleted?: boolean }) =>
        isCompleted ? <h1>Assessment complete</h1> : null,
}));
vi.mock('./helpers/AssessmentAnswerInput', () => ({
    default: ({
        handleAnswer,
        index,
    }: {
        handleAnswer: (index: number, answer: string) => void;
        index: number;
    }) => <input aria-label="Answer" onChange={event => handleAnswer(index, event.target.value)} />,
}));
vi.mock('./helpers/AssessmentMultipleChoiceAnswers', () => ({ default: () => null }));
vi.mock('../../generic/GenericNetworkError', () => ({ default: () => null }));

const questions = [{ id: 1, title: 'Reflect', question: 'What did you learn?', type: 'text' }];
const signedSummary = {
    id: 'urn:summary',
    boostId: 'urn:boost:summary',
    type: ['VerifiableCredential', 'SessionSummaryCredential'],
    credentialSubject: { id: 'did:example:learner' },
    proof: { type: 'DataIntegrityProof', proofValue: 'test-signature' },
};

const showAssessment = async (vc: unknown = signedSummary, cached?: unknown) => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    if (cached !== undefined)
        queryClient.setQueryData(['assessment', signedSummary.boostId], cached);
    const session = {
        vc,
        boost: { uri: signedSummary.boostId },
        record: { uri: 'urn:credential:summary' },
    } as unknown as AiSession;
    render(
        <QueryClientProvider client={queryClient}>
            <AiAssessmentContainer app={undefined} session={session} />
        </QueryClientProvider>
    );
    fireEvent.click(screen.getByRole('button', { name: "Let's Go" }));
    await screen.findByRole('heading', { name: 'Final Assessment' });
    return queryClient;
};

describe('AI final assessment loading', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        aiLoadingStore.set.isFinishingAssessment(false);
        mocks.preload.mockResolvedValue({ assessment: questions });
        mocks.finish.mockResolvedValue({ success: true });
        mocks.summary.mockResolvedValue({ data: {} });
        mocks.sync.mockResolvedValue(undefined);
        mocks.enriched.mockResolvedValue(undefined);
        Element.prototype.scrollIntoView = vi.fn();
    });

    it('sends a directly signed summary with its proof intact', async () => {
        await showAssessment();
        await screen.findByText('What did you learn?');
        expect(mocks.preload).toHaveBeenCalledWith({
            did: 'did:example:learner',
            summaryCredential: signedSummary,
            summaryCredentialUri: 'urn:credential:summary',
        });
        expect(screen.getByRole('textbox', { name: 'Answer' })).toBeInTheDocument();
    });

    it('binds completion to the stored summary URI and preserves the final answer', async () => {
        await showAssessment({
            type: ['CertifiedBoostCredential'],
            boostCredential: signedSummary,
        });
        fireEvent.change(await screen.findByRole('textbox', { name: 'Answer' }), {
            target: { value: 'I learned about feedback loops.' },
        });
        await waitFor(() => expect(mocks.finish).toHaveBeenCalled());
        expect(mocks.finish.mock.calls[0][0]).toMatchObject({
            session: signedSummary,
            sessionUri: signedSummary.boostId,
            summaryCredentialUri: 'urn:credential:summary',
            assessmentQA: [{ ...questions[0], answer: 'I learned about feedback loops.' }],
        });
    });

    it('continues to support legacy wrapped summaries', async () => {
        await showAssessment({
            type: ['CertifiedBoostCredential'],
            boostCredential: signedSummary,
        });
        await screen.findByText('What did you learn?');
        expect(mocks.preload.mock.calls[0][0].summaryCredential).toEqual(signedSummary);
    });

    it('shows desktop saving feedback until completion, then opens the completed assessment', async () => {
        let complete!: (value: unknown) => void;
        mocks.finish.mockImplementationOnce(
            () =>
                new Promise(resolve => {
                    complete = resolve;
                })
        );
        await showAssessment();
        fireEvent.change(await screen.findByRole('textbox', { name: 'Answer' }), {
            target: { value: 'Negative feedback opposes change.' },
        });
        await waitFor(() => expect(mocks.finish).toHaveBeenCalledTimes(1));
        expect(screen.getByRole('status')).toBeInTheDocument();
        expect(
            screen.queryByRole('heading', { name: 'Assessment complete' })
        ).not.toBeInTheDocument();
        complete({ success: true });
        await screen.findByRole('heading', { name: 'Assessment complete' });
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
        expect(mocks.sync).toHaveBeenCalledTimes(1);
        expect(mocks.enriched).toHaveBeenCalledTimes(1);
    });

    it('shows an already saved assessment without submitting it again', async () => {
        mocks.summary.mockResolvedValue({ data: { assessmentVc: { id: 'saved-assessment' } } });
        await showAssessment();
        await screen.findByRole('heading', { name: 'Assessment complete' });
        expect(mocks.finish).not.toHaveBeenCalled();
    });

    it('keeps the saved result visible when the personal index refresh fails', async () => {
        mocks.sync.mockRejectedValueOnce(new Error('Index unavailable'));
        await showAssessment();
        fireEvent.change(await screen.findByRole('textbox', { name: 'Answer' }), {
            target: { value: 'Negative feedback.' },
        });
        await screen.findByRole('heading', { name: 'Assessment complete' });
        await waitFor(() =>
            expect(mocks.logError).toHaveBeenCalledWith(
                'Could not refresh the completed assessment'
            )
        );
        expect(mocks.finish).toHaveBeenCalledTimes(1);
    });

    it('shows an error and retries a failed request, with feedback while retrying', async () => {
        mocks.preload.mockRejectedValueOnce(new Error('private backend details'));
        await showAssessment();
        expect(await screen.findByRole('alert')).toHaveTextContent('Something went wrong');
        expect(screen.queryByText('private backend details')).not.toBeInTheDocument();

        let completeRetry!: (value: unknown) => void;
        mocks.preload.mockImplementationOnce(
            () =>
                new Promise(resolve => {
                    completeRetry = resolve;
                })
        );
        fireEvent.click(screen.getByRole('button', { name: 'Try Again' }));
        expect(await screen.findByRole('status')).toHaveTextContent('Generating...');
        await waitFor(() => expect(mocks.preload).toHaveBeenCalledTimes(2));
        completeRetry({ assessment: questions });
        await screen.findByText('What did you learn?');
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it.each([[], null, {}, [{ question: 'Unanswerable', type: 'unknown' }]])(
        'shows a retry state for an unusable response: %j',
        async assessment => {
            mocks.preload.mockResolvedValueOnce({ assessment });
            await showAssessment();
            expect(await screen.findByRole('alert')).toBeInTheDocument();
            expect(screen.getByRole('button', { name: 'Try Again' })).toBeInTheDocument();
            expect(mocks.finish).not.toHaveBeenCalled();
        }
    );

    it('regenerates an empty cached assessment rather than treating it as fully answered', async () => {
        await showAssessment(signedSummary, []);
        await screen.findByText('What did you learn?');
        expect(mocks.preload).toHaveBeenCalledTimes(1);
        expect(mocks.finish).not.toHaveBeenCalled();
    });

    it('uses the direct summary boost ID when looking up cached questions', async () => {
        await showAssessment(signedSummary, questions);
        await screen.findByText('What did you learn?');
        expect(mocks.preload).not.toHaveBeenCalled();
    });

    it.each(['response', 'cache'])(
        'defaults a missing question type to text from %s',
        async source => {
            const untypedQuestions = [{ id: 1, title: 'Reflect', question: 'What did you learn?' }];
            if (source === 'response')
                mocks.preload.mockResolvedValueOnce({ assessment: untypedQuestions });
            await showAssessment(signedSummary, source === 'cache' ? untypedQuestions : undefined);
            fireEvent.change(await screen.findByRole('textbox', { name: 'Answer' }), {
                target: { value: 'Feedback loops.' },
            });
            await waitFor(() => expect(mocks.finish).toHaveBeenCalled());
            expect(mocks.finish.mock.calls[0][0].assessmentQA).toEqual([
                { ...untypedQuestions[0], type: 'text', answer: 'Feedback loops.' },
            ]);
            expect(mocks.preload).toHaveBeenCalledTimes(source === 'cache' ? 0 : 1);
        }
    );

    it('shows quota guidance when the server explicitly reports quota exhaustion', async () => {
        mocks.preload.mockRejectedValueOnce(
            new AiServiceError({
                event: 'ai_error',
                code: 'ai_provider_quota_exhausted',
                message: 'Safe service message',
                retryable: false,
            })
        );
        await showAssessment();
        expect(await screen.findByRole('alert')).toHaveTextContent('usage limit');
    });

    it('lets the learner close a failed assessment without completing it', async () => {
        mocks.preload.mockRejectedValueOnce(new Error('Failed to preload assessment'));
        await showAssessment();
        await screen.findByRole('alert');
        fireEvent.click(screen.getByRole('button', { name: 'Close', exact: true }));
        expect(mocks.closeModal).toHaveBeenCalledTimes(1);
        expect(mocks.finish).not.toHaveBeenCalled();
    });
});
