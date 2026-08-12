import React from 'react';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import AiInsightsErrorHandler from './AiInsightsErrorHandler';
import { AiSessionMode } from './newAiSession.helpers';

const mocks = vi.hoisted(() => ({
    aiError: null as
        | {
              at: number;
              event: 'ai_error';
              code: 'ai_provider_quota_exhausted';
              message: string;
              retryable: boolean;
          }
        | { at: number; code?: string; presented?: boolean }
        | null,
}));

vi.mock('@nanostores/react', () => ({
    useStore: () => mocks.aiError,
}));

vi.mock('learn-card-base/stores/nanoStores/chatStore', () => ({
    lastAiError: {},
}));

vi.mock('../../helpers/aiError.helpers', () => ({
    getAiErrorCopy: (code: string) =>
        code === 'ai_provider_quota_exhausted'
            ? {
                  title: 'LearnCard AI usage limit reached',
                  body: 'LearnCard AI has reached its current usage limit. Please try again later.',
              }
            : {
                  title: 'LearnCard AI could not complete this request',
                  body: 'Please try again later.',
              },
}));

describe('AiInsightsErrorHandler', () => {
    beforeEach(() => {
        mocks.aiError = null;
        vi.spyOn(Date, 'now').mockReturnValue(1_000);
    });

    it('shows quota-specific guidance for an active Insights request', () => {
        const { rerender } = render(
            <AiInsightsErrorHandler active mode={AiSessionMode.insights} />
        );

        mocks.aiError = {
            at: 1_001,
            event: 'ai_error',
            code: 'ai_provider_quota_exhausted',
            message: 'Safe public message',
            retryable: false,
        };
        rerender(<AiInsightsErrorHandler active mode={AiSessionMode.insights} />);

        expect(screen.getByRole('alert')).toHaveTextContent('LearnCard AI usage limit reached');
        expect(screen.getByRole('alert')).toHaveTextContent(
            'LearnCard AI has reached its current usage limit. Please try again later.'
        );
    });

    it('dismisses the banner when an explicit retry clears the error', () => {
        const { rerender } = render(
            <AiInsightsErrorHandler active mode={AiSessionMode.insights} />
        );

        mocks.aiError = {
            at: 1_001,
            event: 'ai_error',
            code: 'ai_provider_quota_exhausted',
            message: 'Safe public message',
            retryable: false,
        };
        rerender(<AiInsightsErrorHandler active mode={AiSessionMode.insights} />);

        expect(screen.getByRole('alert')).toBeInTheDocument();

        mocks.aiError = null;
        rerender(<AiInsightsErrorHandler active mode={AiSessionMode.insights} />);

        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('does not duplicate a legacy error already presented by the store', () => {
        mocks.aiError = { at: 1_001, code: 'server_error', presented: true };

        render(<AiInsightsErrorHandler active mode={AiSessionMode.insights} />);

        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('ignores errors from before the Insights chat became active', () => {
        mocks.aiError = { at: 999, code: 'server_error' };

        render(<AiInsightsErrorHandler active mode={AiSessionMode.insights} />);

        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('does not show the Insights error modal for tutor sessions', () => {
        const { rerender } = render(<AiInsightsErrorHandler active mode={AiSessionMode.tutor} />);

        mocks.aiError = { at: 1_001, code: 'server_error' };
        rerender(<AiInsightsErrorHandler active mode={AiSessionMode.tutor} />);

        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
});
