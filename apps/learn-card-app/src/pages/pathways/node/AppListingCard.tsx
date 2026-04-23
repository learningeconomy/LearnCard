/**
 * AppListingCard — the rich, inline "where to act" surface rendered
 * inside `NodeDetail` when the node's resolved action is
 * `app-listing`. Replaces the generic "Open app listing" row with a
 * first-class preview of the linked app: icon, name, tagline,
 * category chip, and the correct Install / Open CTA.
 *
 * Composition choice (why two external owners, not one refactor):
 *   - **Install** re-uses the existing `AppStoreDetailModal` from
 *     LaunchPad. That modal owns the permissions + consent + age-gate
 *     UX; forcing it into a smaller inline button would mean duplicating
 *     several modal stacks. Opening it from here keeps one owner for
 *     install side-effects.
 *   - **Open** uses the pathway-local `useAppListingLaunch` hook which
 *     handles the four happy-path `launch_type`s inline (DIRECT_LINK,
 *     SECOND_SCREEN, EMBEDDED_IFRAME, AI_TUTOR) and routes complex
 *     cases back to `/app/:listing_id` where the full-page surface
 *     has consent/age machinery.
 *
 * Visual language follows the LearnCard UI/UX guidelines:
 *   - `rounded-[20px]` pill buttons, `rounded-xl` for the card frame
 *   - `font-poppins`, `grayscale-*` / `emerald-*` tokens only
 *   - No `IonItem` (which leaks Ionic's theme layer into text color)
 */

import React from 'react';
import { motion } from 'motion/react';
import type { AppStoreListing, InstalledApp } from '@learncard/types';
import { useModal, ModalTypes } from 'learn-card-base';
import { IonIcon } from '@ionic/react';
import { openOutline, downloadOutline, playCircleOutline } from 'ionicons/icons';

import AppStoreDetailModal from '../../launchPad/AppStoreDetailModal';

import { useAppListingLaunch, type AnyAppListing } from './useAppListingLaunch';

// ---------------------------------------------------------------------------
// Fallback icon — used when `icon_url` is missing or fails to load.
// ---------------------------------------------------------------------------

const FALLBACK_ICON_URL = 'https://cdn.filestackcontent.com/Ja9TRvGVRsuncjqpxedb';

// Entrance animation for the card — mirrors the SECTION_MOTION pattern
// in NodeDetail so the surface feels like a peer of the other
// sections (header, artifact uploader, termination CTA).
const SECTION_MOTION = {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] as const },
} as const;

// ---------------------------------------------------------------------------
// Launch-type labels. Tiny surface — not worth a separate module. Keeps
// the UI-visible copy close to the component that renders it so
// renames / additions are single-file changes.
// ---------------------------------------------------------------------------

const launchTypeCopy = (launchType: string): { kicker: string; cta: string } => {
    switch (launchType) {
        case 'EMBEDDED_IFRAME':
            return { kicker: 'Embedded app', cta: 'Open' };
        case 'AI_TUTOR':
            return { kicker: 'AI tutor', cta: 'Launch tutor' };
        case 'DIRECT_LINK':
            return { kicker: 'External link', cta: 'Open' };
        case 'SECOND_SCREEN':
            return { kicker: 'Second screen', cta: 'Open' };
        default:
            return { kicker: 'Linked app', cta: 'Open app' };
    }
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export interface AppListingCardProps {
    listing: AnyAppListing;
    isInstalled: boolean;
    isInstalledLoading?: boolean;
    /** Invoked when the user installs via the launched detail modal. */
    onInstallSuccess?: () => void;
}

const AppListingCard: React.FC<AppListingCardProps> = ({
    listing,
    isInstalled,
    isInstalledLoading = false,
    onInstallSuccess,
}) => {
    const { newModal } = useModal({});

    const { launch, inlineKind } = useAppListingLaunch(listing);

    const copy = launchTypeCopy(listing.launch_type as string);

    // Button label adapts to state + launch type so the CTA reads
    // naturally: "Install Coursera — AWS Cloud Essentials" is long;
    // "Install" alone is honest because the header already names the
    // app.
    const installLabel = 'Install';
    const openLabel = copy.cta;

    // Clicking Install opens the full LaunchPad detail modal. That's
    // where the permissions + consent + age-gate UX lives; mirroring
    // it inline would be a pile of modal stacks.
    //
    // Must open as a Right-slide modal (desktop + mobile). The modal's
    // root is `<IonPage className="h-full w-full">`, which assumes a
    // full-height container; rendering it inside the default Center
    // modal (max-width 600 / max-height 75vh) clips it and the
    // IonPage renders at `opacity: 0` without a router context —
    // what the user sees as "background blurs but nothing appears."
    // `hideButton: true` because AppStoreDetailModal has its own
    // close affordance in the IonHeader — we don't want two X buttons.
    const handleInstall = () => {
        newModal(
            <AppStoreDetailModal
                listing={listing as AppStoreListing | InstalledApp}
                isInstalled={false}
                onInstallSuccess={onInstallSuccess}
            />,
            { hideButton: true },
            { desktop: ModalTypes.Right, mobile: ModalTypes.Right },
        );
    };

    const buttonIcon = isInstalled
        ? inlineKind === 'ai-tutor'
            ? playCircleOutline
            : openOutline
        : downloadOutline;

    return (
        <motion.section
            {...SECTION_MOTION}
            className="
                rounded-2xl overflow-hidden
                bg-white border border-grayscale-200
                shadow-[0_1px_0_0_rgba(0,0,0,0.02)]
            "
            aria-label={`App linked to this step: ${listing.display_name}`}
        >
            {/*
                Subtle "step action" kicker — sets this card apart from
                the artifact uploader below. One row, low-emphasis, but
                enough to tell the learner "this is the app-step
                portion, not a form field."
            */}
            <div
                className="
                    px-4 pt-3 pb-1
                    flex items-center gap-1.5
                    text-[10px] font-semibold uppercase tracking-[0.08em]
                    text-grayscale-500
                "
            >
                <span>{copy.kicker}</span>

                {isInstalled && (
                    <>
                        <span aria-hidden className="text-grayscale-300">·</span>
                        <span className="text-emerald-600">Installed</span>
                    </>
                )}
            </div>

            <div className="px-4 pt-1 pb-4">
                {/* Row 1: icon + identity */}
                <div className="flex items-start gap-3">
                    <span
                        aria-hidden
                        className="
                            shrink-0 w-14 h-14 rounded-xl overflow-hidden
                            bg-grayscale-10 border border-grayscale-200
                        "
                    >
                        <img
                            src={listing.icon_url || FALLBACK_ICON_URL}
                            alt=""
                            className="w-full h-full object-cover"
                            loading="lazy"
                            onError={e => {
                                // Broken CDN / 404 → swap to the
                                // shared fallback so the card never
                                // renders with a broken-image icon.
                                (e.currentTarget as HTMLImageElement).src =
                                    FALLBACK_ICON_URL;
                            }}
                        />
                    </span>

                    <div className="min-w-0 flex-1">
                        <h3
                            className="text-sm font-semibold text-grayscale-900 leading-snug line-clamp-2"
                            title={listing.display_name}
                        >
                            {listing.display_name}
                        </h3>

                        {listing.tagline && (
                            <p className="mt-0.5 text-xs text-grayscale-600 leading-relaxed line-clamp-2">
                                {listing.tagline}
                            </p>
                        )}

                        {/*
                            Meta chips — category only for now. We
                            intentionally don't surface age_rating here
                            because the full-page listing handles the
                            age UX, and showing an age chip on a single
                            pathway step reads as out-of-place.
                        */}
                        {listing.category && (
                            <div className="mt-1.5">
                                <span
                                    className="
                                        inline-block px-2 py-0.5
                                        rounded-full
                                        bg-grayscale-100 text-grayscale-700
                                        text-[10px] font-medium
                                        capitalize
                                    "
                                >
                                    {listing.category}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Row 2: CTA */}
                <div className="mt-3">
                    {isInstalledLoading ? (
                        // Neutral skeleton — short, same height as the
                        // button to avoid layout shift on resolve.
                        <div
                            className="h-11 w-full rounded-[20px] bg-grayscale-100 animate-pulse"
                            aria-hidden
                        />
                    ) : isInstalled ? (
                        <button
                            type="button"
                            onClick={launch}
                            className="
                                w-full py-3 px-4
                                rounded-[20px]
                                bg-emerald-600 hover:bg-emerald-700
                                text-white font-medium text-sm
                                flex items-center justify-center gap-2
                                transition-colors
                            "
                            aria-label={`${openLabel} ${listing.display_name}`}
                        >
                            <IonIcon icon={buttonIcon} className="text-base" aria-hidden />
                            <span>
                                {openLabel} {listing.display_name}
                            </span>
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={handleInstall}
                            className="
                                w-full py-3 px-4
                                rounded-[20px]
                                bg-grayscale-900 hover:opacity-90
                                text-white font-medium text-sm
                                flex items-center justify-center gap-2
                                transition-opacity
                            "
                            aria-label={`${installLabel} ${listing.display_name}`}
                        >
                            <IonIcon icon={buttonIcon} className="text-base" aria-hidden />
                            <span>
                                {installLabel} {listing.display_name}
                            </span>
                        </button>
                    )}
                </div>
            </div>
        </motion.section>
    );
};

export default AppListingCard;
