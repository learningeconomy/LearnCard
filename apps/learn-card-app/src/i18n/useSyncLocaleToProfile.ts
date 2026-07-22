/**
 * useSyncLocaleToProfile — best-effort mirror of the active UI locale to the
 * user's LCN profile, so the backend knows which language to use for
 * server-sent notifications/emails.
 *
 * The SPA's source of truth for the *displayed* locale stays
 * `localStorage('i18n.language')` (see `LocaleProvider`). This hook only
 * PROPAGATES that choice to the backend profile — it never reads from or
 * writes to localStorage itself, and never changes the displayed locale.
 *
 * Behavior:
 *   - Fires on mount (once the profile is loaded) and whenever the locale or
 *     the profile's persisted `locale` changes.
 *   - Only writes when the user is an LCN user AND `profile.locale !== currentLocale`
 *     (including when `profile.locale` is empty). This avoids redundant writes
 *     and the tight-loop that would otherwise occur (write → refetch → write…).
 *   - A ref guards against overlapping writes so a rapid locale toggle doesn't
 *     fire multiple concurrent mutations.
 *   - All failures are swallowed (best-effort): a transient network error or
 *     missing wallet must NEVER block the UI or throw into a render path.
 *
 * Why not live inside `LocaleProvider`? `LocaleProvider` is mounted at the app
 * root (`src/index.tsx`), above the auth/query providers, so
 * `useGetProfile()`/`useWallet()` aren't available there. This hook must be
 * mounted inside the authenticated subtree (e.g. `AppRouter`), where those
 * providers are present.
 */
import React, { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { getLogger, useGetProfile, useIsLoggedIn, useWallet } from 'learn-card-base';

import { useLocale, useChangeLocale, SUPPORTED_LANGUAGES } from './index';
import type { SupportedLanguage } from './index';
import { getEffectiveSupportedLanguages } from './detectLocale';
import { decideLocaleSync } from './localeSync';

const log = getLogger('i18n.sync-locale-to-profile');

export const useSyncLocaleToProfile = (): void => {
    const locale = useLocale();
    const changeLocale = useChangeLocale();
    const { data: profile, isFetched } = useGetProfile();
    const { initWallet } = useWallet();
    const isLoggedIn = useIsLoggedIn();
    const queryClient = useQueryClient();

    // Tracks the locale value currently being written to the backend, so a
    // rapid toggle (or a refetch landing mid-write) doesn't kick off duplicate
    // concurrent mutations. Reset to `null` when idle.
    const writingRef = useRef<string | null>(null);

    // `QueriedProfile` is a union; only the full `LCNProfile` variant carries
    // `locale`. useGetProfile() (no profileId) returns the current user's OWN
    // profile, which is always the full LCNProfile shape on the wire, but the
    // static type widens to the union. Read the optional field defensively.
    // Raw persisted profile locale, normalized to a supported base tag (or
    // undefined when absent/unsupported). `QueriedProfile` is a union; only the
    // full `LCNProfile` variant carries `locale`, so read it defensively.
    const rawProfileLocale = (profile as { locale?: string } | null | undefined)?.locale;
    const profileLocale = ((): SupportedLanguage | undefined => {
        const base = rawProfileLocale?.toLowerCase().split('-')[0];
        return base && (SUPPORTED_LANGUAGES as readonly string[]).includes(base)
            ? (base as SupportedLanguage)
            : undefined;
    })();

    // Tenant scoping (added to `LocaleProvider` after this branch was cut): a
    // tenant may offer a narrower language set than the compiled catalog. A
    // saved profile locale outside that set must be left alone — not restored
    // into a UI that hides it, and not overwritten (the profile locale is
    // global across tenants).
    const tenantSupportsProfileLocale =
        !profileLocale ||
        (getEffectiveSupportedLanguages(SUPPORTED_LANGUAGES) as readonly string[]).includes(
            profileLocale
        );

    useEffect(() => {
        if (!isFetched) return;
        if (!profile?.profileId) return; // not an LCN user (or not loaded)

        // An explicit in-session pick is recorded in localStorage by
        // `changeLocale`. Its presence means "the UI locale is a deliberate
        // choice"; its absence (e.g. just after logout cleared it, or a fresh
        // device) means "fall back to the saved profile language".
        const hasManualChoice =
            typeof localStorage !== 'undefined' && !!localStorage.getItem('i18n.language');

        const decision = decideLocaleSync(
            locale,
            profileLocale,
            hasManualChoice,
            tenantSupportsProfileLocale
        );

        if (decision.action === 'none') return;

        if (decision.action === 'restore') {
            // Adopt the user's saved language into the UI (fresh login, or a new
            // device). Crucially we do NOT write the default UI locale back —
            // that one-way write is what overwrote the saved profile locale on
            // re-login after logout cleared localStorage. `changeLocale` persists
            // the restored value, so the next render converges to `none`.
            changeLocale(decision.locale);
            return;
        }

        // decision.action === 'sync' → push the UI locale to the profile (an
        // explicit pick, or the profile has no saved locale yet to clobber).
        if (!isLoggedIn) return; // no private key yet — initWallet() would throw
        if (writingRef.current !== null) return; // a write is already in flight

        writingRef.current = locale;

        (async () => {
            try {
                // initWallet() resolves to a wallet or THROWS (commonly "no valid
                // private key" before login). The isLoggedIn gate filters that;
                // when login completes isLoggedIn flips and the effect re-runs.
                const wallet = await initWallet();
                if (!wallet) return;

                await wallet.invoke.updateProfile({ locale });

                // Reflect the persisted locale in the getProfile cache (5-min
                // staleTime) so the next render sees it and doesn't re-write.
                await queryClient.invalidateQueries({ queryKey: ['getProfile'] });
            } catch (error) {
                // Best-effort: never surface to the user.
                log.warn('Failed to sync locale to profile', error);
            } finally {
                writingRef.current = null;
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
    ]);
};

/**
 * Thin render-less wrapper around {@link useSyncLocaleToProfile}.
 *
 * `useLocale()` requires `LocaleProvider` (mounted at the app root in
 * `src/index.tsx`) and `useGetProfile()`/`useWallet()` require the auth/query
 * providers below it. This component is the intended mount point: drop it
 * anywhere inside the authenticated subtree (currently directly under
 * `SharedI18nProvider` in `AppRouter`).
 */
export const LocaleProfileSync: React.FC = () => {
    useSyncLocaleToProfile();
    return null;
};

export default useSyncLocaleToProfile;
