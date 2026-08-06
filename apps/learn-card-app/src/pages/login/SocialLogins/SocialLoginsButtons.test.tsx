import React from 'react';
import { act, render, screen } from '@testing-library/react';
import { vi } from 'vitest';

import { SocialLoginTypes } from 'learn-card-base';
import { LoginTypesEnum } from 'learn-card-base/helpers/loginHelpers';
import { BrandingEnum } from 'learn-card-base/components/headerBranding/headerBrandingHelpers';

import SocialLoginsButtons from './SocialLoginsButtons';

vi.mock('@ionic/react', () => ({
    IonRow: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
        <div {...props}>{children}</div>
    ),
}));

vi.mock('learn-card-base/hooks/useSocialLogins', () => ({
    default: () => [],
}));

vi.mock('learn-card-base', () => ({
    SocialLoginTypes: {
        apple: 'apple',
        google: 'google',
    },
}));

vi.mock('learn-card-base/helpers/loginHelpers', () => ({
    LoginTypesEnum: {
        email: 'email',
        phone: 'phone',
    },
}));

vi.mock('learn-card-base/components/headerBranding/headerBrandingHelpers', () => ({
    BrandingEnum: {
        learncard: 'learncard',
    },
}));

vi.mock('learn-card-base/svgs/PhoneIcon', () => ({
    default: ({ className }: { className?: string }) => <svg className={className} />,
}));

vi.mock('learn-card-base/svgs/EmailIcon', () => ({
    default: ({ className }: { className?: string }) => <svg className={className} />,
}));

vi.mock('../../../theme/hooks/useTheme', () => ({
    default: () => ({
        colors: { defaults: { primaryColor: 'emerald-600' } },
        theme: {
            colors: {
                defaults: {
                    loginBgColor: '#059669',
                    loaders: ['#059669'],
                },
            },
        },
    }),
}));

vi.mock('../../../paraglide/messages.js', () => ({
    'login.social.or': () => 'or',
}));

describe('SocialLoginsButtons', () => {
    it('starts only one popup when social buttons are tapped rapidly', async () => {
        let resolveGoogleLogin: (() => void) | undefined;
        const googleLogin = vi.fn(
            () =>
                new Promise<void>(resolve => {
                    resolveGoogleLogin = resolve;
                })
        );
        const appleLogin = vi.fn(() => Promise.resolve());

        render(
            <SocialLoginsButtons
                branding={BrandingEnum.learncard}
                activeLoginType={LoginTypesEnum.email}
                setActiveLoginType={vi.fn()}
                extraSocialLogins={[
                    {
                        id: 1,
                        src: '/apple.svg',
                        alt: 'Apple',
                        onClick: appleLogin,
                        type: SocialLoginTypes.apple,
                    },
                    {
                        id: 2,
                        src: '/google.svg',
                        alt: 'Google',
                        onClick: googleLogin,
                        type: SocialLoginTypes.google,
                    },
                ]}
                showSocialLogins
            />
        );

        const appleButton = screen.getByRole('button', { name: /apple/i });
        const googleButton = screen.getByRole('button', { name: /google/i });

        act(() => {
            googleButton.click();
            googleButton.click();
            appleButton.click();
        });

        expect(googleLogin).toHaveBeenCalledOnce();
        expect(appleLogin).not.toHaveBeenCalled();
        expect(googleButton).toBeDisabled();
        expect(appleButton).toBeDisabled();
        expect(screen.getByRole('status', { name: /signing in with google/i })).toBeInTheDocument();

        await act(async () => {
            resolveGoogleLogin?.();
            await Promise.resolve();
        });

        expect(googleButton).not.toBeDisabled();
        expect(appleButton).not.toBeDisabled();
    });

    it('clears the loading state when the popup is closed', async () => {
        let rejectGoogleLogin: ((reason?: unknown) => void) | undefined;
        const googleLogin = vi.fn(
            () =>
                new Promise<void>((_resolve, reject) => {
                    rejectGoogleLogin = reject;
                })
        );

        render(
            <SocialLoginsButtons
                branding={BrandingEnum.learncard}
                activeLoginType={LoginTypesEnum.email}
                setActiveLoginType={vi.fn()}
                extraSocialLogins={[
                    {
                        id: 1,
                        src: '/apple.svg',
                        alt: 'Apple',
                        onClick: vi.fn(() => Promise.resolve()),
                        type: SocialLoginTypes.apple,
                    },
                    {
                        id: 2,
                        src: '/google.svg',
                        alt: 'Google',
                        onClick: googleLogin,
                        type: SocialLoginTypes.google,
                    },
                ]}
                showSocialLogins
            />
        );

        const appleButton = screen.getByRole('button', { name: /apple/i });
        const googleButton = screen.getByRole('button', { name: /google/i });

        act(() => {
            googleButton.click();
        });

        expect(googleButton).toBeDisabled();
        expect(appleButton).toBeDisabled();

        await act(async () => {
            rejectGoogleLogin?.({ code: 'auth/popup-closed-by-user' });
            await Promise.resolve();
        });

        expect(screen.queryByRole('status')).not.toBeInTheDocument();
        expect(googleButton).not.toBeDisabled();
        expect(appleButton).not.toBeDisabled();
    });
});
