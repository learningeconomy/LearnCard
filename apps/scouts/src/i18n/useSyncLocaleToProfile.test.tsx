// @vitest-environment jsdom

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
    locale: 'en' as 'en' | 'es' | 'fr' | 'ar',
    manualLocaleChoice: undefined as string | undefined,
    profileLocale: 'es' as string | undefined,
    supportedLanguages: ['en', 'es', 'fr', 'ar'] as Array<'en' | 'es' | 'fr' | 'ar'>,
    changeLocale: vi.fn(),
    updateProfile: vi.fn().mockResolvedValue(undefined),
    initWallet: vi.fn(),
    warn: vi.fn(),
}));

vi.mock('learn-card-base', () => ({
    getLogger: () => ({ warn: state.warn }),
    useGetProfile: () => ({
        data: { profileId: 'profile-123', locale: state.profileLocale },
        isFetched: true,
    }),
    useIsLoggedIn: () => true,
    useWallet: () => ({ initWallet: state.initWallet }),
}));

vi.mock('./index', () => ({
    SUPPORTED_LANGUAGES: ['en', 'es', 'fr', 'ar'],
    useLocale: () => state.locale,
    useChangeLocale: () => state.changeLocale,
}));

vi.mock('./detectLocale', () => ({
    getEffectiveSupportedLanguages: () => state.supportedLanguages,
}));

vi.mock('./localeStorage', () => ({
    readManualLocaleChoice: () => state.manualLocaleChoice,
}));

import { LocaleProfileSync } from './useSyncLocaleToProfile';

const renderSync = (queryClient: QueryClient): void => {
    render(
        <QueryClientProvider client={queryClient}>
            <LocaleProfileSync />
        </QueryClientProvider>
    );
};

describe('LocaleProfileSync', () => {
    beforeEach(() => {
        state.locale = 'en';
        state.manualLocaleChoice = undefined;
        state.profileLocale = 'es';
        state.supportedLanguages = ['en', 'es', 'fr', 'ar'];
        state.changeLocale.mockReset();
        state.updateProfile.mockReset().mockResolvedValue(undefined);
        state.initWallet.mockReset().mockResolvedValue({
            invoke: { updateProfile: state.updateProfile },
        });
        state.warn.mockReset();
    });

    afterEach(() => cleanup());

    it('restores a saved profile locale when there is no explicit local choice', async () => {
        const queryClient = new QueryClient();

        renderSync(queryClient);

        await waitFor(() =>
            expect(state.changeLocale).toHaveBeenCalledWith('es', { manual: false })
        );
        expect(state.updateProfile).not.toHaveBeenCalled();
    });

    it('does not treat a locale preserved from the previous account as a manual choice', async () => {
        state.locale = 'fr';
        state.profileLocale = 'es';
        state.manualLocaleChoice = undefined;
        const queryClient = new QueryClient();

        renderSync(queryClient);

        await waitFor(() =>
            expect(state.changeLocale).toHaveBeenCalledWith('es', { manual: false })
        );
        expect(state.updateProfile).not.toHaveBeenCalled();
    });

    it('persists an explicit local locale and invalidates the profile query', async () => {
        state.locale = 'fr';
        state.manualLocaleChoice = 'fr';
        const queryClient = new QueryClient();
        const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries');

        renderSync(queryClient);

        await waitFor(() => expect(state.updateProfile).toHaveBeenCalledWith({ locale: 'fr' }));
        await waitFor(() =>
            expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['getProfile'] })
        );
    });

    it('does not overwrite a saved locale that ScoutPass does not support', () => {
        state.profileLocale = 'de';
        state.manualLocaleChoice = undefined;
        const queryClient = new QueryClient();

        renderSync(queryClient);

        expect(state.changeLocale).not.toHaveBeenCalled();
        expect(state.updateProfile).not.toHaveBeenCalled();
    });

    it('does not restore or overwrite a locale hidden by the current tenant', () => {
        state.profileLocale = 'fr';
        state.supportedLanguages = ['en', 'es'];
        const queryClient = new QueryClient();

        renderSync(queryClient);

        expect(state.changeLocale).not.toHaveBeenCalled();
        expect(state.updateProfile).not.toHaveBeenCalled();
    });

    it('persists an explicit choice over a locale hidden by the current tenant', async () => {
        state.locale = 'es';
        state.profileLocale = 'fr';
        state.manualLocaleChoice = 'es';
        state.supportedLanguages = ['en', 'es'];
        const queryClient = new QueryClient();

        renderSync(queryClient);

        await waitFor(() => expect(state.updateProfile).toHaveBeenCalledWith({ locale: 'es' }));
    });

    it('does not seed an empty profile from an autodetected locale', async () => {
        state.locale = 'ar';
        state.profileLocale = undefined;
        state.manualLocaleChoice = undefined;
        const queryClient = new QueryClient();

        renderSync(queryClient);

        await waitFor(() => expect(state.initWallet).not.toHaveBeenCalled());
        expect(state.updateProfile).not.toHaveBeenCalled();
    });

    it('seeds an empty profile after an explicit locale choice', async () => {
        state.locale = 'ar';
        state.profileLocale = undefined;
        state.manualLocaleChoice = 'ar';
        const queryClient = new QueryClient();

        renderSync(queryClient);

        await waitFor(() => expect(state.updateProfile).toHaveBeenCalledWith({ locale: 'ar' }));
    });

    it('queues the latest locale when another profile write is already running', async () => {
        let rejectFirstWrite: (error: Error) => void = () => undefined;
        const firstWrite = new Promise<void>((_resolve, reject) => {
            rejectFirstWrite = reject;
        });
        state.locale = 'fr';
        state.manualLocaleChoice = 'fr';
        state.updateProfile
            .mockReset()
            .mockImplementationOnce(() => firstWrite)
            .mockResolvedValue(undefined);
        const queryClient = new QueryClient();
        const view = render(
            <QueryClientProvider client={queryClient}>
                <LocaleProfileSync />
            </QueryClientProvider>
        );

        await waitFor(() => expect(state.updateProfile).toHaveBeenCalledWith({ locale: 'fr' }));

        state.locale = 'ar';
        state.manualLocaleChoice = 'ar';
        view.rerender(
            <QueryClientProvider client={queryClient}>
                <LocaleProfileSync />
            </QueryClientProvider>
        );
        rejectFirstWrite(new Error('offline'));

        await waitFor(() => expect(state.updateProfile).toHaveBeenCalledWith({ locale: 'ar' }));
        expect(state.updateProfile).toHaveBeenCalledTimes(2);
    });

    it('discards a queued locale when the latest choice already matches the profile', async () => {
        let rejectFirstWrite: (error: Error) => void = () => undefined;
        const firstWrite = new Promise<void>((_resolve, reject) => {
            rejectFirstWrite = reject;
        });
        state.locale = 'fr';
        state.manualLocaleChoice = 'fr';
        state.updateProfile.mockReset().mockImplementationOnce(() => firstWrite);
        const queryClient = new QueryClient();
        const view = render(
            <QueryClientProvider client={queryClient}>
                <LocaleProfileSync />
            </QueryClientProvider>
        );

        await waitFor(() => expect(state.updateProfile).toHaveBeenCalledWith({ locale: 'fr' }));

        state.locale = 'ar';
        state.manualLocaleChoice = 'ar';
        view.rerender(
            <QueryClientProvider client={queryClient}>
                <LocaleProfileSync />
            </QueryClientProvider>
        );

        state.locale = 'es';
        state.manualLocaleChoice = 'es';
        view.rerender(
            <QueryClientProvider client={queryClient}>
                <LocaleProfileSync />
            </QueryClientProvider>
        );
        rejectFirstWrite(new Error('offline'));

        await waitFor(() => expect(state.warn).toHaveBeenCalled());
        expect(state.updateProfile).toHaveBeenCalledTimes(1);
        expect(state.updateProfile).not.toHaveBeenCalledWith({ locale: 'ar' });
    });

    it('does not write the profile after the sync component unmounts', async () => {
        let resolveWallet: (wallet: {
            invoke: { updateProfile: typeof state.updateProfile };
        }) => void = () => undefined;
        state.locale = 'fr';
        state.manualLocaleChoice = 'fr';
        state.initWallet.mockReset().mockReturnValue(
            new Promise(resolve => {
                resolveWallet = resolve;
            })
        );
        const queryClient = new QueryClient();
        const view = render(
            <QueryClientProvider client={queryClient}>
                <LocaleProfileSync />
            </QueryClientProvider>
        );

        await waitFor(() => expect(state.initWallet).toHaveBeenCalled());
        view.unmount();
        resolveWallet({ invoke: { updateProfile: state.updateProfile } });
        await Promise.resolve();
        await Promise.resolve();

        expect(state.updateProfile).not.toHaveBeenCalled();
    });
});
