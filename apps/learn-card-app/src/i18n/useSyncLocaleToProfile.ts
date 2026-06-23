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
 * Why not live inside `LocaleProvider`? `LocaleProvider` sits above the
 * auth/query providers, so `useGetProfile()`/`useWallet()` aren't available
 * there. This hook must be mounted inside the authenticated subtree
 * (e.g. `AppRouter`), where those providers are present.
 */
import React, { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { getLogger, useGetProfile, useIsLoggedIn, useWallet } from 'learn-card-base';

import { useLocale } from './index';

const log = getLogger('i18n.sync-locale-to-profile');

export const useSyncLocaleToProfile = (): void => {
    const locale = useLocale();
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
    const profileLocale = (profile as { locale?: string } | null | undefined)?.locale;

    useEffect(() => {
        // Only sync once we actually have a profile to sync to. `isFetched`
        // guards the "loading" state; `profile` guards the "no LCN profile"
        // case (non-LCN users). `profileLocale !== locale` is the actual
        // divergence check — covers both unset and changed values.
        if (!isFetched) return;
        if (!isLoggedIn) return; // no private key yet — initWallet() would throw
        if (!profile?.profileId) return; // not an LCN user (or not loaded)
        if (profileLocale === locale) return; // already in sync
        if (writingRef.current !== null) return; // a write is already in flight

        let cancelled = false;
        writingRef.current = locale;

        (async () => {
            try {
                // initWallet() (getWallet) resolves to a wallet or THROWS — most
                // commonly "no valid private key found" before login completes. The
                // `isLoggedIn` gate above already filters that case; this guard is
                // purely defensive. When login completes, `isLoggedIn` flips and the
                // effect re-runs (it's a dep), so the sync is retried then.
                const wallet = await initWallet();
                if (!wallet) return;
                await wallet.invoke.updateProfile({ locale });
                if (cancelled) return;

                // wallet.invoke.updateProfile does NOT invalidate the getProfile
                // cache (5-min staleTime). Invalidate so the persisted locale is
                // reflected locally and we don't re-trigger this effect on the
                // next render with the stale `profile.locale`.
                await queryClient.invalidateQueries({ queryKey: ['getProfile'] });
            } catch (error) {
                // Best-effort: never surface to the user. The backend will simply
                // fall back to 'en' for this user until a future successful sync.
                log.warn('Failed to sync locale to profile', error);
            } finally {
                // Always release the write lock, even when this effect run was
                // cancelled mid-flight. The `writingRef.current !== null` guard
                // above prevents any overlapping write from starting while this
                // one owns the ref, so the async that set it is its sole owner —
                // unconditional reset is safe. Skipping the reset on cancel would
                // leave the ref permanently set, blocking every future sync for
                // this component's lifetime (rapid locale toggles, or a
                // post-invalidation profileLocale change firing cleanup).
                writingRef.current = null;
            }
        })();

        return () => {
            cancelled = true;
        };
        // locale: the active UI locale (dep).
        // profileLocale: the persisted backend value (dep) — when the
        //   invalidateQueries refetch lands, this changes to match `locale` and
        //   the effect short-circuits.
        // profile?.profileId: presence (dep) — fires when the profile loads.
        // isFetched: loading gate (dep).
        // isLoggedIn: wallet-readiness signal (dep) — flips true once the private
        //   key is available, re-running the effect to retry a sync that bailed
        //   before login.
    }, [locale, profileLocale, profile?.profileId, isFetched, isLoggedIn, initWallet, queryClient]);
};

/**
 * Thin render-less wrapper around {@link useSyncLocaleToProfile}.
 *
 * `useLocale()` requires `LocaleProvider`, which `AppRouter` mounts in its
 * returned JSX (NOT around itself). So the hook cannot be called in
 * `AppRouter`'s body — it must be mounted as a child inside `LocaleProvider`.
 * This component is the intended mount point: drop it anywhere inside the
 * authenticated + locale-provided subtree (e.g. directly under
 * `SharedI18nProvider` in `AppRouter`).
 */
export const LocaleProfileSync: React.FC = () => {
    useSyncLocaleToProfile();
    return null;
};

export default useSyncLocaleToProfile;
