import React, { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { getLogger, useGetProfile, useIsLoggedIn, useWallet } from 'learn-card-base';

import { getEffectiveSupportedLanguages } from './detectLocale';
import { SUPPORTED_LANGUAGES, useChangeLocale, useLocale } from './index';
import type { SupportedLanguage } from './index';
import { applyLocaleSyncAction, decideLocaleSync } from './localeSync';
import { readPersistedLocale } from './localeStorage';

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

    const rawProfileLocale = (profile as { locale?: string } | null | undefined)?.locale;
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
        if (!isFetched || !profile?.profileId) return;

        const action = decideLocaleSync(
            locale,
            profileLocale,
            !!readPersistedLocale(),
            tenantSupportsProfileLocale,
            hasSavedProfileLocale
        );

        if (action.action === 'none') {
            pendingLocaleRef.current = null;
            return;
        }

        const effects = {
            changeLocale,
            updateProfile: async nextLocale => {
                const wallet = await initWallet();
                if (!wallet) return;
                await wallet.invoke.updateProfile({ locale: nextLocale });
            },
            invalidateProfile: () => queryClient.invalidateQueries({ queryKey: ['getProfile'] }),
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
            while (pendingLocaleRef.current) {
                const nextLocale = pendingLocaleRef.current;
                pendingLocaleRef.current = null;
                await applyLocaleSyncAction({ action: 'sync' }, nextLocale, effects);
            }
        })().finally(() => {
            writingRef.current = false;
        });
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
