/**
 * useAppListingLaunch — launch-dispatch hook for the four happy-path
 * `AppStoreListing.launch_type` variants used inside pathway nodes.
 *
 * Why this is pathway-local (not a shared LaunchPad primitive):
 *   `AppStoreListItem` / `AppStoreDetailModal` each have their own
 *   launch dispatchers that bundle age-gating, guardian consent, and
 *   consent-flow redirect (DID + delegate VP). Refactoring those into
 *   a shared hook is a much larger change than this task merits —
 *   it'd widen blast radius to every LaunchPad surface.
 *
 *   Instead: this hook handles the four simple launch types inline so
 *   a pathway learner never has to leave the NodeDetail modal for the
 *   common demo flow. Apps that require *any* of the complex gates
 *   (consent-flow contract, age restriction, guardian approval) route
 *   to `/app/:listing_id` where the existing full-page surface enforces
 *   those gates correctly. One owner for the gates, one seam for the
 *   happy path.
 *
 * Inline launch paths:
 *   - `DIRECT_LINK` / `SECOND_SCREEN` → `window.open` in a new tab.
 *   - `EMBEDDED_IFRAME`               → `EmbedIframeModal` via `useModal`.
 *   - `AI_TUTOR`                      → `AiTutorConnectedView` via `useModal`.
 *
 * Fallback (route to `/app/:id`):
 *   - Listing has `launchConfig.contractUri` (consent flow required).
 *   - Listing has `min_age` or `age_rating` set (age gating needed).
 *   - Any unrecognized launch_type.
 */

import React, { useMemo, useCallback } from 'react';
import { useHistory } from 'react-router-dom';
import type { AppStoreListing, InstalledApp } from '@learncard/types';
import { useModal, ModalTypes } from 'learn-card-base';

import { EmbedIframeModal } from '../../launchPad/EmbedIframeModal';
import AiTutorConnectedView from '../../launchPad/AiTutorConnectedView';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AnyAppListing = AppStoreListing | InstalledApp;

export interface UseAppListingLaunchResult {
    /**
     * Invoke the launch. Safe to call for any listing — will either
     * dispatch inline or navigate to `/app/:id` based on `inlineKind`.
     */
    launch: () => void;

    /**
     * What the current hook would do on `launch()`:
     *   - `'direct'`    → open in a new browser tab
     *   - `'iframe'`    → open the EmbedIframeModal
     *   - `'ai-tutor'`  → open the AiTutorConnectedView modal
     *   - `'fallback'`  → navigate to `/app/:listing_id`
     *
     * Useful for tweaking the button label ("Open app" vs "View details")
     * or icon based on the dispatch target.
     */
    inlineKind: 'direct' | 'iframe' | 'ai-tutor' | 'fallback';

    /**
     * The parsed `launch_config_json` — exposed so the consumer can
     * peek at it without re-parsing. `{}` if parsing failed.
     */
    launchConfig: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const parseLaunchConfig = (raw: string | null | undefined): Record<string, unknown> => {
    if (!raw) return {};

    try {
        const parsed = JSON.parse(raw);

        return typeof parsed === 'object' && parsed !== null ? parsed : {};
    } catch {
        return {};
    }
};

/**
 * Does this listing require gating the full AppListingPage can't be
 * replaced by an inline dispatch? If yes, the hook routes to `/app/:id`
 * so the consent / guardian / age flows stay in one place.
 */
const requiresFullPageGate = (
    listing: AnyAppListing,
    launchConfig: Record<string, unknown>,
): boolean => {
    // Consent-flow contracts require a DID + delegate VP injection on
    // redirect — non-trivial code path, lives in AppStoreListItem today.
    // Don't try to mirror it inline.
    if (typeof launchConfig.contractUri === 'string' && launchConfig.contractUri.length > 0) {
        return true;
    }

    // Age gating (hard block + soft block with guardian approval). The
    // inline card in NodeDetail never shows these gates; kick to the
    // full page where the existing modal stack handles them.
    // `min_age` is canonical; `age_rating` is the softer signal.
    const asAny = listing as unknown as { min_age?: number; age_rating?: string };

    if (typeof asAny.min_age === 'number' && asAny.min_age > 0) return true;
    if (typeof asAny.age_rating === 'string' && asAny.age_rating.length > 0) return true;

    return false;
};

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export const useAppListingLaunch = (
    listing: AnyAppListing | null | undefined,
): UseAppListingLaunchResult => {
    const history = useHistory();
    const { newModal } = useModal();

    const launchConfig = useMemo(
        () => parseLaunchConfig(listing?.launch_config_json),
        [listing?.launch_config_json],
    );

    const inlineKind: UseAppListingLaunchResult['inlineKind'] = useMemo(() => {
        if (!listing) return 'fallback';

        if (requiresFullPageGate(listing, launchConfig)) return 'fallback';

        const type = listing.launch_type as string;

        if (type === 'AI_TUTOR' && typeof launchConfig.aiTutorUrl === 'string') {
            return 'ai-tutor';
        }

        if (type === 'EMBEDDED_IFRAME' && typeof launchConfig.url === 'string') {
            return 'iframe';
        }

        if ((type === 'DIRECT_LINK' || type === 'SECOND_SCREEN')
            && typeof launchConfig.url === 'string') {
            return 'direct';
        }

        return 'fallback';
    }, [listing, launchConfig]);

    const launch = useCallback(() => {
        if (!listing) return;

        switch (inlineKind) {
            case 'direct': {
                const url = launchConfig.url as string;

                window.open(url, '_blank', 'noopener,noreferrer');

                return;
            }

            case 'iframe': {
                const url = launchConfig.url as string;

                // Must open as a FullScreen modal. `EmbedIframeModal`'s
                // root is `<IonPage>` with `<IonContent fullscreen>`
                // wrapping an `<iframe style={{ width: '100%', height:
                // '100%' }}>` — rendering inside the default Center
                // container (600×75vh) collapses the IonPage to
                // `opacity: 0` via Ionic's default `.ion-page-invisible`
                // styling, which is what the user sees as "screen
                // blurs but no iframe appears." Same class of bug as
                // `AppStoreDetailModal`; same fix.
                //
                // `hideButton: true` because the iframe modal has its
                // own close X inside the IonHeader.
                newModal(
                    <EmbedIframeModal
                        embedUrl={url}
                        appId={
                            (listing as unknown as { slug?: string }).slug
                            ?? listing.listing_id
                        }
                        appName={listing.display_name}
                        launchConfig={launchConfig as Record<string, unknown>}
                        isInstalled
                    />,
                    { hideButton: true },
                    { desktop: ModalTypes.FullScreen, mobile: ModalTypes.FullScreen },
                );

                return;
            }

            case 'ai-tutor': {
                // Right slide on desktop (chat UI reads well in a
                // narrow column), FullScreen on mobile. Same IonPage
                // full-height-container requirement as above.
                newModal(
                    <AiTutorConnectedView
                        listing={listing}
                        launchConfig={{
                            aiTutorUrl: launchConfig.aiTutorUrl as string,
                            contractUri: launchConfig.contractUri as string | undefined,
                        }}
                    />,
                    { hideButton: true },
                    { desktop: ModalTypes.Right, mobile: ModalTypes.FullScreen },
                );

                return;
            }

            case 'fallback':
            default: {
                history.push(`/app/${encodeURIComponent(listing.listing_id)}`);

                return;
            }
        }
    }, [listing, launchConfig, inlineKind, newModal, history]);

    return { launch, inlineKind, launchConfig };
};
