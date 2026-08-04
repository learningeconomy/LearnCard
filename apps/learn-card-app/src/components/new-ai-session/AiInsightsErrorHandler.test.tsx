import React from 'react';
import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import AiInsightsErrorHandler from './AiInsightsErrorHandler';
import { AiSessionMode } from './newAiSession.helpers';

const mocks = vi.hoisted(() => ({
    aiError: null as { at: number; code?: string } | null,
    showErrorModal: vi.fn(),
}));

vi.mock('@nanostores/react', () => ({
    useStore: () => mocks.aiError,
}));

vi.mock('learn-card-base/stores/nanoStores/chatStore', () => ({
    lastAiError: {},
}));

vi.mock('learn-card-base/stores/nanoStores/ErrorModalStore', () => ({
    showErrorModal: mocks.showErrorModal,
}));

describe('AiInsightsErrorHandler', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.aiError = null;
        vi.spyOn(Date, 'now').mockReturnValue(1_000);
    });

    it('shows a friendly error for an active Insights request', () => {
        const { rerender } = render(
            <AiInsightsErrorHandler active mode={AiSessionMode.insights} />
        );

        mocks.aiError = { at: 1_001, code: 'insufficient_quota' };
        rerender(<AiInsightsErrorHandler active mode={AiSessionMode.insights} />);

        expect(mocks.showErrorModal).toHaveBeenCalledWith(
            'Something went wrong',
            'Please try your request again.'
        );
    });

    it('ignores errors from before the Insights chat became active', () => {
        mocks.aiError = { at: 999, code: 'server_error' };

        render(<AiInsightsErrorHandler active mode={AiSessionMode.insights} />);

        expect(mocks.showErrorModal).not.toHaveBeenCalled();
    });

    it('does not show the Insights error modal for tutor sessions', () => {
        const { rerender } = render(<AiInsightsErrorHandler active mode={AiSessionMode.tutor} />);

        mocks.aiError = { at: 1_001, code: 'server_error' };
        rerender(<AiInsightsErrorHandler active mode={AiSessionMode.tutor} />);

        expect(mocks.showErrorModal).not.toHaveBeenCalled();
    });
});
