import { describe, expect, it } from 'bun:test';
import { normalizeAiProviderError, toAiErrorPayload } from './errors';

describe('AI provider error normalization', () => {
    it('normalizes OpenAI insufficient quota without exposing provider details', () => {
        const error = normalizeAiProviderError(
            {
                status: 429,
                error: {
                    code: 'insufficient_quota',
                    message: 'You exceeded your current quota. Billing account acct-secret.',
                    type: 'insufficient_quota',
                },
            },
            'openai'
        );

        expect(error).toMatchObject({
            code: 'ai_provider_quota_exhausted',
            provider: 'openai',
            retryable: false,
            httpStatus: 503,
        });

        const payload = toAiErrorPayload(error, {
            operation: 'session_start',
            requestId: 'request-1',
            threadId: 'thread-1',
        });

        expect(payload).toMatchObject({
            event: 'ai_error',
            code: 'ai_provider_quota_exhausted',
            retryable: false,
            operation: 'session_start',
            requestId: 'request-1',
            threadId: 'thread-1',
        });
        expect(JSON.stringify(payload)).not.toContain('acct-secret');
    });

    it.each([
        [{ status: 429, code: 'rate_limit_exceeded' }, 'ai_provider_rate_limited', true, 429],
        [{ status: 503, message: 'Service unavailable' }, 'ai_provider_unavailable', true, 503],
        [
            { name: 'APIConnectionTimeoutError', message: 'Request timed out' },
            'ai_request_timeout',
            true,
            504,
        ],
        [new Error('Malformed provider response'), 'ai_unknown_error', false, 500],
    ])(
        'maps provider failures to a stable client contract',
        (source, code, retryable, httpStatus) => {
            expect(normalizeAiProviderError(source, 'openai')).toMatchObject({
                code,
                retryable,
                httpStatus,
            });
        }
    );
});
