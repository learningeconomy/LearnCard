// @vitest-environment jsdom
import React, { type ReactNode } from 'react';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { VC } from '@learncard/types';

import { usePreloadAssessment, useFinishAssessmentMutation } from './ai-passport';

const mocks = vi.hoisted(() => ({ fetch: vi.fn(), logError: vi.fn(), logInfo: vi.fn() }));
vi.mock('learn-card-base', () => ({ UploadTypesEnum: {} }));
vi.mock('../../hooks/useAiInsightCredential', () => ({ createAiInsightCredential: vi.fn() }));
vi.mock('../../stores/NetworkStore', () => ({
    networkStore: { get: { aiServiceUrl: () => 'https://ai.example.test' } },
}));
vi.mock('../../stores/aiInsightRefreshStore', () => ({
    clearAiInsightRefreshState: vi.fn(),
    setAiInsightRefreshError: vi.fn(),
    setAiInsightRefreshPending: vi.fn(),
}));
vi.mock('../../logging/logger', () => ({
    getLogger: () => ({ error: mocks.logError, info: mocks.logInfo }),
}));
vi.mock('../../i18n', () => ({ addActiveLocaleToUrl: (url: string) => url }));
vi.mock('../../helpers/aiPassportAuth', () => ({ aiPassportFetch: mocks.fetch }));
vi.mock('../../helpers/fileExtraction', () => ({ extractFileCredentials: vi.fn() }));

const setup = () => {
    const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    return { ...renderHook(() => usePreloadAssessment(), { wrapper }), queryClient };
};
const payload = {
    did: 'did:example:learner',
    summaryCredential: {
        '@context': ['https://www.w3.org/2018/credentials/v1'],
        type: ['VerifiableCredential'],
        issuer: 'did:example:issuer',
        issuanceDate: '2026-01-01T00:00:00Z',
        credentialSubject: { id: 'did:example:learner' },
        boostId: 'urn:boost:summary',
        proof: {
            type: 'Ed25519Signature2020',
            created: '2026-01-01T00:00:00Z',
            proofPurpose: 'assertionMethod',
            verificationMethod: 'did:example:issuer#key-1',
            proofValue: 'synthetic-test-proof',
        },
    } satisfies VC,
    summaryCredentialUri: 'urn:credential:summary',
};

describe('assessment request failures', () => {
    beforeEach(() => vi.clearAllMocks());
    afterEach(() => vi.unstubAllGlobals());

    it.each([
        ['missing crypto', undefined],
        ['missing randomUUID', {}],
        [
            'throwing randomUUID',
            {
                randomUUID: () => {
                    throw new Error('Private random source error');
                },
            },
        ],
    ])('still requests and caches questions with %s', async (_name, cryptoValue) => {
        vi.stubGlobal('crypto', cryptoValue);
        const assessment = [{ id: 1, question: 'What did you learn?', type: 'text' }];
        mocks.fetch.mockResolvedValueOnce(new Response(JSON.stringify(assessment)));
        const { result, queryClient } = setup();
        await result.current.mutateAsync(payload);
        const request = JSON.parse(mocks.fetch.mock.calls[0][1].body);
        expect(request).not.toHaveProperty('attemptId');
        expect(request.summaryCredential).toEqual(payload.summaryCredential);
        expect(queryClient.getQueryData(['assessment', payload.summaryCredential.boostId])).toEqual(
            assessment
        );
        expect(JSON.stringify(mocks.logError.mock.calls)).not.toContain(
            'Private random source error'
        );
    });

    it('preserves an explicit quota error for the UI and does not cache the failure', async () => {
        mocks.fetch.mockResolvedValueOnce(
            new Response(
                JSON.stringify({
                    event: 'ai_error',
                    code: 'ai_provider_quota_exhausted',
                    message: 'Temporarily unavailable',
                    retryable: false,
                }),
                { status: 503 }
            )
        );
        const { result, queryClient } = setup();
        await expect(result.current.mutateAsync(payload)).rejects.toMatchObject({
            name: 'AiServiceError',
            payload: { code: 'ai_provider_quota_exhausted' },
        });
        expect(
            queryClient.getQueryData(['assessment', payload.summaryCredential.boostId])
        ).toBeUndefined();
        expect(mocks.logError).toHaveBeenCalledWith('ai.assessment.preload.failed', {
            attemptId: expect.any(String),
            stage: 'http_response',
            httpStatus: 503,
            durationMs: expect.any(Number),
            code: 'ai_provider_quota_exhausted',
        });
    });

    it('includes the HTTP status when a response has no recognized AI error', async () => {
        mocks.fetch.mockResolvedValueOnce(new Response('Private server details', { status: 404 }));
        const { result } = setup();
        await expect(result.current.mutateAsync(payload)).rejects.toThrow(
            'Failed to preload assessment (HTTP 404)'
        );
    });

    it('caches a successful question list under the session boost ID', async () => {
        const assessment = [{ id: 1, question: 'What did you learn?', type: 'text' }];
        mocks.fetch.mockResolvedValueOnce(new Response(JSON.stringify(assessment)));
        const { result, queryClient } = setup();
        await result.current.mutateAsync(payload);
        const request = JSON.parse(mocks.fetch.mock.calls[0][1].body);
        expect(request.summaryCredential).toEqual(payload.summaryCredential);
        expect(request.summaryCredentialUri).toBe(payload.summaryCredentialUri);
        expect(request.attemptId).toMatch(
            /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
        );
        expect(mocks.logInfo).toHaveBeenCalledWith('ai.assessment.preload.started', {
            attemptId: request.attemptId,
        });
        expect(queryClient.getQueryData(['assessment', payload.summaryCredential.boostId])).toEqual(
            assessment
        );
    });

    it('records the response-parsing stage without logging the response content', async () => {
        mocks.fetch.mockResolvedValueOnce(new Response('Private response that is not JSON'));
        const { result } = setup();
        await expect(result.current.mutateAsync(payload)).rejects.toBeInstanceOf(Error);
        expect(mocks.logError).toHaveBeenCalledWith('ai.assessment.preload.failed', {
            attemptId: expect.any(String),
            stage: 'response_parse',
            httpStatus: 200,
            durationMs: expect.any(Number),
            code: 'request_failed',
        });
        expect(JSON.stringify(mocks.logError.mock.calls)).not.toContain('Private response');
    });

    it('records a transport failure separately from an HTTP failure', async () => {
        mocks.fetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));
        const { result } = setup();
        await expect(result.current.mutateAsync(payload)).rejects.toThrow('Failed to fetch');
        expect(mocks.logError).toHaveBeenCalledWith('ai.assessment.preload.failed', {
            attemptId: expect.any(String),
            stage: 'request',
            httpStatus: undefined,
            durationMs: expect.any(Number),
            code: 'request_failed',
        });
    });
});

it('keeps the summary credential URI separate from the parent boost when completing', async () => {
    const queryClient = new QueryClient();
    const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    mocks.fetch.mockResolvedValueOnce(new Response(JSON.stringify({ success: true })));
    const { result } = renderHook(() => useFinishAssessmentMutation(), { wrapper });
    const completion = {
        did: payload.did,
        session: payload.summaryCredential,
        sessionUri: payload.summaryCredential.boostId,
        summaryCredentialUri: payload.summaryCredentialUri,
        assessmentQA: [{ question: 'What did you learn?', answer: 'Feedback loops.' }],
    };
    await result.current.mutateAsync(completion);
    expect(JSON.parse(mocks.fetch.mock.calls.at(-1)![1].body)).toEqual({
        session: completion.session,
        sessionUri: completion.sessionUri,
        summaryCredentialUri: completion.summaryCredentialUri,
        assessmentQA: completion.assessmentQA,
    });
});
