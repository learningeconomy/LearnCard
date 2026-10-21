import React from 'react';
import { act, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import GameLogin from './GameLogin';

const mocks = vi.hoisted(() => ({
    appleLogin: vi.fn<() => Promise<boolean>>(),
    googleLogin: vi.fn<() => Promise<boolean>>(),
}));

vi.mock('../../../hooks/useFirebase', () => ({
    default: () => ({
        appleLogin: mocks.appleLogin,
        googleLogin: mocks.googleLogin,
    }),
}));

vi.mock('learn-card-base', () => ({
    LoginTypesEnum: {
        email: 'email',
        phone: 'phone',
        scoutsSSO: 'scoutsSSO',
    },
    SocialLoginTypes: {
        apple: 'apple',
        google: 'google',
    },
}));

vi.mock('../../../pages/login/forms/EmailForm', () => ({
    default: () => <div>Email form</div>,
}));

vi.mock('../../../pages/login/forms/PhoneForm', () => ({
    default: () => <div>Phone form</div>,
}));

vi.mock('../../../config/brandingAssets', () => ({
    useTenantBrandingAssets: () => ({ appIcon: '/app.svg' }),
}));

vi.mock('learn-card-base/config/TenantConfigProvider', () => ({
    useBrandingConfig: () => ({ name: 'LearnCard' }),
}));

vi.mock('../../../paraglide/messages.js', () => ({
    'common.back': () => 'Back',
    'login.social.provider.apple': () => 'Apple',
    'login.social.provider.google': () => 'Google',
    'login.social.signingInWith': ({ provider }: { provider: string }) =>
        `Signing in with ${provider}`,
}));

describe('GameLogin', () => {
    it('disables its social controls and shows progress while a popup is pending', async () => {
        let resolveAppleLogin: (() => void) | undefined;

        mocks.appleLogin.mockReturnValue(
            new Promise(resolve => {
                resolveAppleLogin = () => resolve(false);
            })
        );
        mocks.googleLogin.mockResolvedValue(false);

        render(<GameLogin handleBackToGame={vi.fn()} />);

        const appleButton = screen.getByRole('button', { name: 'Apple' });
        const googleButton = screen.getByRole('button', { name: 'Google' });

        act(() => {
            appleButton.click();
            appleButton.click();
            googleButton.click();
        });

        expect(mocks.appleLogin).toHaveBeenCalledOnce();
        expect(mocks.googleLogin).not.toHaveBeenCalled();
        expect(appleButton).toBeDisabled();
        expect(googleButton).toBeDisabled();
        expect(screen.getByRole('status', { name: 'Signing in with Apple' })).toBeInTheDocument();

        await act(async () => {
            resolveAppleLogin?.();
            await Promise.resolve();
        });

        expect(appleButton).not.toBeDisabled();
        expect(googleButton).not.toBeDisabled();
    });
});
