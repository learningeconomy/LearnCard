/**
 * CredentialClaimedPathwayCta — the post-claim pathway-progress
 * affordance. Picks copy, visual weight, and interaction behaviour
 * based on a `tier` classifier so the card matches the stakes of
 * what just happened:
 *
 *   • `terminal`       — "You did it." The credential finished a
 *                        whole pathway end-to-end. Emerald
 *                        celebration tint, medium-strength haptic,
 *                        no auto-dismiss (let them linger).
 *   • `cross-pathway`  — "This credential advanced 3 steps."
 *                        Neutral tint, light haptic, auto-dismiss.
 *   • `major`          — "Nice — one step closer." Neutral tint,
 *                        light haptic, auto-dismiss.
 *   • `minor`          — "Added to your progress." Neutral tint,
 *                        no haptic, auto-dismiss.
 *
 * ## Design-language compliance
 *
 * Follows `AGENTS.md` tokens strictly: `font-poppins`, `grayscale-*`
 * / `emerald-*` only, primary CTAs are `rounded-[20px]` pills, no
 * generic Tailwind colors anywhere. The card surface is a softly-
 * tinted emerald glass (`bg-emerald-50/90 backdrop-blur-xl`) with a
 * low-saturation emerald-tinted shadow — matches the "Airbnb /
 * Headspace" polish bar the app guidelines specify.
 *
 * ## Motion + haptics
 *
 * On mount, the card fades in + scales from 0.96 → 1.0 over 400ms
 * with ease-out cubic. Respects `prefers-reduced-motion` via
 * `motion-safe:` / `motion-reduce:` Tailwind utilities.
 *
 * A light (or medium, for terminal) haptic impact fires once on
 * mount via `@capacitor/haptics` — dynamic-imported and try/caught
 * so it's a silent no-op on web, matching the existing pattern in
 * `NodeDetail.tsx`.
 *
 * ## Auto-dismiss
 *
 * Non-terminal tiers auto-dismiss after 8 seconds unless the user
 * is hovering, focused inside, or has `prefers-reduced-motion`
 * (auto-motion is confusing without animation). Terminal tier
 * never auto-dismisses — learners should stay in the celebration
 * until they actively move on.
 *
 * ## Zero-render contract
 *
 * Returns `null` when the credential didn't advance anything. Claim
 * surfaces can safely render this component unconditionally — it
 * reveals itself only when there's something meaningful to say.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';

import { IonIcon } from '@ionic/react';
import { checkmarkCircleOutline } from 'ionicons/icons';

import { usePathwayProgressForCredential } from './usePathwayProgressForCredential';
import {
    resolveCtaCopy,
    type ProgressTier,
} from './progressCtaCopy';
import type { NodeDetailLocationState } from '../node/NodeDetail';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface CredentialClaimedPathwayCtaProps {
    /**
     * The wallet URI of the just-claimed credential. When null /
     * undefined the component renders nothing — useful for claim
     * surfaces that call this conditionally.
     */
    credentialUri: string | null | undefined;
    /**
     * Invoked when the learner clicks the primary CTA. The caller
     * uses this to close any hosting modal *before* navigation
     * fires so the destination doesn't render under a lingering
     * overlay. Also invoked on explicit "Later" dismiss and on
     * auto-dismiss.
     */
    onNavigate?: () => void;
    /**
     * Invoked only on dismissals (explicit "Later" link or auto-
     * dismiss). Callers that need to distinguish "user followed
     * the CTA" from "user backed away" use this + `onNavigate`
     * together; most callers can leave it undefined.
     */
    onDismiss?: () => void;
    /** Optional extra class on the outer card (e.g. `w-full`). */
    className?: string;
}

// ---------------------------------------------------------------------------
// Per-tier visual + behaviour config
// ---------------------------------------------------------------------------

/**
 * Everything about a given tier that the render switches on.
 * Keeping this table-driven instead of nested ternaries makes the
 * "what does tier X look like?" question scannable at a glance.
 */
interface TierConfig {
    /**
     * Outer card classes. The base shell is shared; tier-specific
     * tints and padding slot in here.
     */
    cardClasses: string;
    /** Primary CTA button classes. */
    ctaClasses: string;
    /** Headline text size + weight. */
    headlineClasses: string;
    /** Whether to auto-dismiss after the fixed timeout. */
    autoDismiss: boolean;
    /**
     * Haptic strength on mount. `null` skips haptics entirely
     * (no-op tiers like minor).
     */
    hapticStyle: 'Light' | 'Medium' | null;
}

const TIER_CONFIG: Record<ProgressTier, TierConfig> = {
    terminal: {
        // Terminal gets more padding and a slightly warmer fill
        // than the others — the celebration earns the extra visual
        // weight. Fully opaque: the card is presented over the
        // busy pathway canvas and a translucent fill made it read
        // as a ghost of itself.
        cardClasses: 'bg-emerald-50 border-emerald-100 p-6 gap-4',
        // Emerald CTA is the app's "positive action" token — fine
        // per AGENTS.md for a terminal celebration. Non-terminal
        // tiers use grayscale-900 (the default primary) so the
        // emerald here reads as "this is special".
        ctaClasses:
            'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white',
        headlineClasses: 'text-lg font-semibold',
        autoDismiss: false,
        hapticStyle: 'Medium',
    },
    // Non-terminal tiers also render solid now — the original
    // `/70` alpha plus `backdrop-blur-xl` looked washed-out over
    // the Map canvas's saturated pastel pins. The card was
    // competing with the backdrop instead of sitting on top of
    // it. Solid `bg-emerald-50` keeps the "soft glass" vibe via
    // shadow + rounded corners without the legibility cost.
    'cross-pathway': {
        cardClasses: 'bg-emerald-50 border-emerald-100 p-5 gap-3',
        ctaClasses:
            'bg-grayscale-900 hover:opacity-90 active:opacity-80 text-white',
        headlineClasses: 'text-base font-semibold',
        autoDismiss: true,
        hapticStyle: 'Light',
    },
    major: {
        cardClasses: 'bg-emerald-50 border-emerald-100 p-5 gap-3',
        ctaClasses:
            'bg-grayscale-900 hover:opacity-90 active:opacity-80 text-white',
        headlineClasses: 'text-base font-semibold',
        autoDismiss: true,
        hapticStyle: 'Light',
    },
    minor: {
        cardClasses: 'bg-grayscale-10 border-grayscale-200 p-5 gap-3',
        ctaClasses:
            'bg-grayscale-900 hover:opacity-90 active:opacity-80 text-white',
        headlineClasses: 'text-base font-semibold',
        autoDismiss: true,
        hapticStyle: null,
    },
    // `none` is a defensive default — the component early-returns
    // before rendering, but the config stays total so TypeScript's
    // exhaustiveness check stays happy.
    none: {
        cardClasses: '',
        ctaClasses: '',
        headlineClasses: '',
        autoDismiss: false,
        hapticStyle: null,
    },
};

const AUTO_DISMISS_MS = 8000;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Dynamically import `@capacitor/haptics` and fire a single impact
 * of the given style. Silent no-op on web or if haptics are
 * disabled — mirrors the pattern in `NodeDetail.tsx`.
 */
const fireHaptic = async (style: 'Light' | 'Medium'): Promise<void> => {
    try {
        const { Haptics, ImpactStyle } = await import('@capacitor/haptics');

        await Haptics.impact({
            style: style === 'Medium' ? ImpactStyle.Medium : ImpactStyle.Light,
        });
    } catch {
        // No haptics available — keep going silently.
    }
};

const prefersReducedMotion = (): boolean => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;

    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const CredentialClaimedPathwayCta: React.FC<CredentialClaimedPathwayCtaProps> = ({
    credentialUri,
    onNavigate,
    onDismiss,
    className = '',
}) => {
    const history = useHistory();
    const location = useLocation();
    const progress = usePathwayProgressForCredential(credentialUri ?? null);

    // Mount-transition state. Drives the fade-in + scale entry.
    // Flipping in a rAF tick guarantees the initial render with the
    // "pre-mount" styles actually commits before the "mounted"
    // styles take over — without that, React batches the two and
    // the transition fires against identical start/end values.
    const [mounted, setMounted] = useState(false);

    // Hover/focus state pauses the auto-dismiss timer. We track it
    // via a ref (not React state) because the timer callback reads
    // it at fire-time; using state would require a re-register on
    // every mouse-enter and is more bookkeeping than it's worth.
    const pausedRef = useRef(false);

    useEffect(() => {
        const raf = requestAnimationFrame(() => setMounted(true));

        return () => cancelAnimationFrame(raf);
    }, []);

    const tier = progress.tier;
    const tierConfig = TIER_CONFIG[tier];

    // Haptic on mount — only once per card appearance.
    useEffect(() => {
        if (!progress.isReady || !progress.hasProgress) return;
        if (!tierConfig.hapticStyle) return;

        fireHaptic(tierConfig.hapticStyle);
    }, [progress.isReady, progress.hasProgress, tierConfig.hapticStyle]);

    // Auto-dismiss timer. Runs for non-terminal tiers when the user
    // isn't actively engaging with the card and hasn't asked for
    // reduced motion (auto-motion feels abrupt without the fade).
    const handleDismiss = useCallback(() => {
        onDismiss?.();
    }, [onDismiss]);

    useEffect(() => {
        if (!progress.isReady || !progress.hasProgress) return;
        if (!tierConfig.autoDismiss) return;
        if (prefersReducedMotion()) return;

        // Self-rearming timer: when the timeout fires, if the user
        // is currently pausing (hover / focus), re-arm for another
        // full window instead of dismissing. This gives a simple
        // "stays as long as you're looking" behaviour without a
        // tick-based clock.
        let timer: number | null = null;

        const scheduleDismiss = (): void => {
            timer = window.setTimeout(() => {
                if (pausedRef.current) {
                    scheduleDismiss();

                    return;
                }

                handleDismiss();
            }, AUTO_DISMISS_MS);
        };

        scheduleDismiss();

        return () => {
            if (timer !== null) window.clearTimeout(timer);
        };
    }, [progress.isReady, progress.hasProgress, tierConfig.autoDismiss, handleDismiss]);

    // -----------------------------------------------------------------
    // Zero-render contract
    // -----------------------------------------------------------------

    if (!progress.isReady || !progress.hasProgress) return null;
    if (tier === 'none') return null;

    // -----------------------------------------------------------------
    // Copy + navigation target
    // -----------------------------------------------------------------

    const copy = resolveCtaCopy({
        tier,
        affectedNodes: progress.affectedNodes,
        affectedOutcomes: progress.affectedOutcomes,
    });

    const firstNode = progress.affectedNodes[0];

    // Navigation target depends on tier.
    //   - terminal: pathway overview (the pathway they just finished)
    //   - major: the specific node that just flipped
    //   - cross-pathway / minor: the /pathways/today hub
    const primaryTarget =
        tier === 'terminal' && firstNode
            ? `/pathways/today`
            : tier === 'major' && firstNode
              ? `/pathways/node/${firstNode.pathwayId}/${firstNode.nodeId}`
              : '/pathways/today';

    const handlePrimary = (): void => {
        onNavigate?.();

        // When the CTA opens a NodeDetail overlay, stamp a
        // `returnTo` in the router state so NodeDetail's X lands
        // the learner somewhere sensible. Two cases:
        //
        //   1. Already inside the pathway shell (`/pathways/*`) —
        //      snapshot the current pathname so Map ↔ Map and
        //      Today ↔ Today round-trips feel natural. Don't
        //      snapshot another node-detail route (avoid loops on
        //      chained progress events) — fall through to the
        //      next-pathway surface.
        //
        //   2. Anywhere else — claim pages (`/request`, `/claim/`),
        //      the wallet home (`/`), embeds, notification deep
        //      links. Snapshotting those as `returnTo` either
        //      re-runs a transient flow (the claim page would
        //      attempt to re-ingest) or yanks the learner back to
        //      an irrelevant surface. Default to
        //      `/pathways/map` — the CTA literally said "Open
        //      pathway", so the pathway visualization is the right
        //      landing surface on dismiss, not the claim form.
        //
        // `restoreFocusId` always carries the node we just opened
        // so Map re-focuses the correct pin on return.
        if (
            tier === 'major'
            && firstNode
            && primaryTarget.startsWith('/pathways/node/')
        ) {
            const currentPath = location.pathname;

            const isPathwayShellPath =
                currentPath.startsWith('/pathways/')
                && !currentPath.startsWith('/pathways/node/');

            const returnTo = isPathwayShellPath ? currentPath : '/pathways/map';

            const state: NodeDetailLocationState = {
                returnTo,
                restoreFocusId: firstNode.nodeId,
            };

            history.push(primaryTarget, state);

            return;
        }

        history.push(primaryTarget);
    };

    const handleLater = (): void => {
        handleDismiss();
    };

    // Motion-safe entry styles. `motion-safe:` applies the
    // scale+opacity transition; `motion-reduce:` users see the
    // card snap in without animation (no flicker from a 0-opacity
    // first render because we render `opacity-0` initially for
    // everyone and let the transition handle the fade).
    const entryClasses = mounted
        ? 'motion-safe:scale-100 motion-safe:opacity-100 motion-reduce:opacity-100'
        : 'motion-safe:scale-[0.96] motion-safe:opacity-0 motion-reduce:opacity-100';

    return (
        <div
            role="status"
            aria-live="polite"
            onMouseEnter={() => { pausedRef.current = true; }}
            onMouseLeave={() => { pausedRef.current = false; }}
            onFocus={() => { pausedRef.current = true; }}
            onBlur={() => { pausedRef.current = false; }}
            className={`
                font-poppins
                rounded-[24px]
                border
                flex flex-col
                backdrop-blur-xl
                shadow-[0_10px_40px_-8px_rgba(16,185,129,0.18),0_2px_8px_rgba(24,34,78,0.04)]
                transition-all duration-[400ms] ease-[cubic-bezier(0.22,1,0.36,1)]
                ${tierConfig.cardClasses}
                ${entryClasses}
                ${className}
            `}
        >
            <div className="flex items-start gap-3">
                <IonIcon
                    icon={checkmarkCircleOutline}
                    className={`
                        shrink-0
                        ${tier === 'terminal' ? 'text-emerald-600 text-2xl mt-0.5' : 'text-emerald-600 text-xl mt-0.5'}
                    `}
                    aria-hidden
                />

                <div className="min-w-0 flex-1">
                    <h2
                        className={`
                            text-grayscale-900 leading-snug
                            ${tierConfig.headlineClasses}
                        `}
                    >
                        {copy.headline}
                    </h2>

                    {copy.subhead && (
                        <p className="mt-1.5 text-sm text-grayscale-600 leading-relaxed">
                            {copy.subhead}
                        </p>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-3 mt-1">
                <button
                    type="button"
                    onClick={handlePrimary}
                    className={`
                        flex-1
                        py-3 px-5
                        rounded-[20px]
                        font-medium text-sm
                        flex items-center justify-center gap-1.5
                        transition-opacity
                        ${tierConfig.ctaClasses}
                    `}
                >
                    {copy.ctaLabel}
                    <span aria-hidden>→</span>
                </button>

                {/*
                 * Subtle dismiss for non-terminal tiers. Terminal
                 * stays modal-like — the celebration moment warrants
                 * an explicit forward action, not a "never mind".
                 * Auto-dismiss covers the "learner ignores the card"
                 * case for the other tiers without needing a visible
                 * dismiss affordance.
                 */}
                {tier !== 'terminal' && (
                    <button
                        type="button"
                        onClick={handleLater}
                        className="
                            text-sm text-grayscale-600 hover:text-grayscale-900
                            transition-colors
                            px-3 py-3
                        "
                    >
                        Later
                    </button>
                )}
            </div>
        </div>
    );
};

export default CredentialClaimedPathwayCta;
