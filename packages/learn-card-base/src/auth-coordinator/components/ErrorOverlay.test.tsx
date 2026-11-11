// @vitest-environment jsdom
import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { ErrorOverlay } from './ErrorOverlay';

afterEach(cleanup);
describe('ErrorOverlay safe service error copy', () => {
    it.each([
        [
            'Error occurred while verifying params token is used: eyJ.private-account.secret',
            'Sign-in is already completing in another tab. Please wait a moment and try again.',
        ],
        [
            'Provider failed with eyJ.private-account.secret',
            'We couldn’t finish signing you in. Please try again.',
        ],
        [
            'network failure eyJ.private-account.secret',
            'Connection issue. Please check your internet and try again.',
        ],
    ])('does not render raw provider errors', (error, expected) => {
        const { container } = render(
            <ErrorOverlay
                error={error}
                canRetry
                onRetry={() => undefined}
                onLogout={() => undefined}
            />
        );
        expect(screen.getByText(expected)).toBeTruthy();
        expect(container.textContent).not.toContain('private-account');
        expect(screen.getByRole('button', { name: 'Try Again' })).toBeTruthy();
    });
});
