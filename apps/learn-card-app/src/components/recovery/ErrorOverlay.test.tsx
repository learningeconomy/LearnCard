// @vitest-environment jsdom
import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../paraglide/messages.js', () => ({
    m: {
        'error.generic': () => 'Something went wrong. Please try again.',
        'error.network': () => 'Connection issue. Please check your internet and try again.',
        'error.retry': () => 'Try Again',
        'error.updateRequired': () => 'Please update to the latest version of the app.',
        'error.updateRequiredTitle': () => 'Update required',
        'recovery.logOut': () => 'Log Out',
    },
}));

import { ACCOUNT_USES_NEWER_SIGN_IN_MESSAGE } from 'learn-card-base/key-derivation/accountSignInErrors';

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

    it('asks for an app update, without Retry, when the account already uses SSS', () => {
        render(
            <ErrorOverlay
                error={ACCOUNT_USES_NEWER_SIGN_IN_MESSAGE}
                canRetry
                onRetry={vi.fn()}
                onLogout={vi.fn()}
            />
        );
        expect(screen.getByRole('heading', { name: 'Update required' })).toBeTruthy();
        expect(screen.queryByText('Something went wrong. Please try again.')).toBeNull();
        expect(screen.getByText('Please update to the latest version of the app.')).toBeTruthy();
        expect(screen.queryByRole('button', { name: 'Try Again' })).toBeNull();
        expect(screen.getByRole('button', { name: 'Log Out' })).toBeTruthy();
    });
});
