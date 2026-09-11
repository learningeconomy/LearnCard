// @vitest-environment jsdom

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { EmailLinkOverlay } from './EmailLinkOverlay';

describe('EmailLinkOverlay keyboard behavior', () => {
    beforeEach(() => {
        vi.stubGlobal(
            'requestAnimationFrame',
            vi.fn(() => 1)
        );
        vi.stubGlobal('cancelAnimationFrame', vi.fn());
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('returns from code entry to email entry on Escape without logging out', async () => {
        const onLogout = vi.fn();

        render(
            <EmailLinkOverlay
                onSendCode={vi.fn().mockResolvedValue(undefined)}
                onVerifyCode={vi.fn().mockResolvedValue(undefined)}
                onComplete={vi.fn()}
                onLogout={onLogout}
            />
        );

        fireEvent.change(screen.getByLabelText('Email Address'), {
            target: { value: 'learner@example.com' },
        });
        fireEvent.click(screen.getByRole('button', { name: 'Send Verification Code' }));

        expect(await screen.findByRole('heading', { name: 'Check Your Email' })).toBeTruthy();

        fireEvent.keyDown(document, { key: 'Escape' });

        expect(screen.getByRole('heading', { name: 'Add an Email Address' })).toBeTruthy();
        expect(onLogout).not.toHaveBeenCalled();
    });
});
