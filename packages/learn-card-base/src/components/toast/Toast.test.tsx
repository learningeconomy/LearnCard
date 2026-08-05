// @vitest-environment jsdom

import React from 'react';

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { toastStore, ToastTypeEnum } from '../../stores/toastStore';
import { Toast } from './Toast';

describe('Toast', () => {
    afterEach(() => {
        cleanup();
        toastStore.set.dismissToast();
    });

    it('shows one status icon and wraps long content inside the toast', () => {
        const longTitle =
            'Resume "Katie_Kempton_Resume_GPA_4.0_with_an_uninterrupted_filename.pdf" saved';
        const longMessage =
            'No credentials could be extracted from this file because its contents were not recognized.';

        // Bypass the public actions to verify the render-level guard against malformed shared state.
        toastStore.set.state(state => {
            state.message = longMessage;
            state.options = {
                ...state.options,
                title: longTitle,
                type: ToastTypeEnum.Error,
                hasCheckmark: true,
                hasX: true,
                autoDismiss: false,
            };
        });

        render(<Toast />);

        const title = screen.getByText(longTitle);
        const message = screen.getByText(longMessage);

        expect(screen.getByTestId('toast-error-icon')).toBeTruthy();
        expect(screen.queryByTestId('toast-success-icon')).toBeNull();

        // jsdom cannot measure overflow; these classes are proxies for the required layout behavior.
        expect(title.className).toContain('[overflow-wrap:anywhere]');
        expect(message.className).toContain('[overflow-wrap:anywhere]');
        expect(message.parentElement?.className).toContain('min-w-0');
    });
});
