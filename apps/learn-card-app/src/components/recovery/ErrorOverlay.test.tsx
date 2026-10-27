// @vitest-environment jsdom
import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../paraglide/messages.js', () => ({
    m: {
        'error.generic': () => 'Something went wrong. Please try again.',
        'error.network': () => 'Connection issue. Please check your internet and try again.',
        'error.retry': () => 'Try Again',
        'recovery.logOut': () => 'Log Out',
    },
}));

import { ErrorOverlay } from './ErrorOverlay';

afterEach(cleanup);
describe('LearnCard ErrorOverlay safe localized copy', () => {
    it.each([
        ['token is used: synthetic.oauth.credential', 'Something went wrong. Please try again.'],
        ['Unrecognized service error: private-account', 'Something went wrong. Please try again.'],
        [
            'network failure: private-account',
            'Connection issue. Please check your internet and try again.',
        ],
    ])('does not expose raw service text', (error, expected) => {
        const { container } = render(
            <ErrorOverlay error={error} canRetry onRetry={vi.fn()} onLogout={vi.fn()} />
        );
        expect(screen.getAllByText(expected).length).toBeGreaterThan(0);
        expect(container.textContent).not.toContain('private-account');
        expect(container.textContent).not.toContain('synthetic.oauth.credential');
        expect(screen.getByRole('button', { name: 'Try Again' })).toBeTruthy();
    });
});
