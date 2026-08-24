import React, { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { getLogger, useGetProfile, useIsLoggedIn, useWallet } from 'learn-card-base';

import { getEffectiveSupportedLanguages } from './detectLocale';
import { SUPPORTED_LANGUAGES, useChangeLocale, useLocale } from './index';
import type { SupportedLanguage } from './index';
import { applyLocaleSyncAction, decideLocaleSync } from './localeSync';
import type { LocaleSyncEffects } from './localeSync';
import { readManualLocaleChoice } from './localeStorage';

const log = getLogger('i18n.sync-locale-to-profile');

/**
 * Best-effort reconciliation between ScoutPass's UI locale and the locale used
 * by the backend for server-generated notifications, email, and SMS.
 */
export const useSyncLocaleToProfile = (): void => {
    const locale = useLocale();
    const changeLocale = useChangeLocale();
    const { data: profile, isFetched } = useGetProfile();
    const { initWallet } = useWallet();
    const isLoggedIn = useIsLoggedIn();
    const queryClient = useQueryClient();
    const writingRef = useRef(false);
    const pendingLocaleRef = useRef<SupportedLanguage | null>(null);
    const mountedRef = useRef(true);

    const rawProfileLocale = profile && 'locale' in profile ? profile.locale : undefined;
    const hasSavedProfileLocale = !!rawProfileLocale?.trim();
    const profileLocale = ((): SupportedLanguage | undefined => {
        const base = rawProfileLocale?.toLowerCase().split('-')[0];

        return base && (SUPPORTED_LANGUAGES as readonly string[]).includes(base)
            ? (base as SupportedLanguage)
            : undefined;
    })();
    const tenantSupportsProfileLocale =
        !profileLocale ||
        (getEffectiveSupportedLanguages(SUPPORTED_LANGUAGES) as readonly string[]).includes(
            profileLocale
        );

    useEffect(() => {
        mountedRef.current = true;

        return () => {
            mountedRef.current = false;
            pendingLocaleRef.current = null;
        };
    }, []);

    useEffect(() => {
        if (!isFetched || !profile?.profileId) return;

        const manualLocaleChoice = readManualLocaleChoice();

        const action = decideLocaleSync(
            locale,
            profileLocale,
            manualLocaleChoice === locale,
            tenantSupportsProfileLocale,
            hasSavedProfileLocale
        );

        if (action.action === 'none') {
            pendingLocaleRef.current = null;
            return;
        }

        const effects: LocaleSyncEffects = {
            changeLocale: nextLocale => {
                if (mountedRef.current) changeLocale(nextLocale, { manual: false });
            },
            updateProfile: async nextLocale => {
                const wallet = await initWallet();
                if (!mountedRef.current || !wallet) return;
                await wallet.invoke.updateProfile({ locale: nextLocale });
            },
            invalidateProfile: () =>
                mountedRef.current
                    ? queryClient.invalidateQueries({ queryKey: ['getProfile'] })
                    : Promise.resolve(),
            onError: error => log.warn('Failed to sync locale to profile', error),
        };

        if (action.action === 'restore') {
            pendingLocaleRef.current = null;
            void applyLocaleSyncAction(action, locale, effects);
            return;
        }

        if (!isLoggedIn) return;

        pendingLocaleRef.current = locale;
        if (writingRef.current) return;
        writingRef.current = true;

        void (async () => {
            try {
                while (mountedRef.current && pendingLocaleRef.current) {
                    const nextLocale = pendingLocaleRef.current;
                    pendingLocaleRef.current = null;
                    await applyLocaleSyncAction({ action: 'sync' }, nextLocale, effects);
                }
            } finally {
                // Release the writer in the same continuation that observes the
                // empty queue, leaving no gap where a newly queued locale is lost.
                writingRef.current = false;
            }
        })();
    }, [
        locale,
        profileLocale,
        profile?.profileId,
        isFetched,
        isLoggedIn,
        initWallet,
        queryClient,
        changeLocale,
        tenantSupportsProfileLocale,
        hasSavedProfileLocale,
    ]);
};

/** Render-less mount point for the authenticated ScoutPass provider tree. */
export const LocaleProfileSync: React.FC = () => {
    useSyncLocaleToProfile();
    return null;
};
