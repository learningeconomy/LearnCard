/**
 * DiscoverStart — cold-start landing for `/pathways/onboard`.
 *
 * The empty-state problem: a new learner lands on Journeys with no
 * pathway loaded. Today/Map/Build all bottom out in fairly bare empty
 * states that don't really sell what the surface can do, and the
 * existing 3-step "what's on your mind?" goal-capture flow is a great
 * tool for somebody who has a goal but does almost nothing for a
 * reviewer / new user who just wants to *see something*.
 *
 * The Browse-pathways modal living under Build > Import already has a
 * superb hand-authored showcase rail (Senior Year, Smart Start,
 * Portfolio Sprint…) — it's just buried two clicks deep behind a
 * button labelled "Import from Credential Engine," which a first-time
 * learner has no reason to tap.
 *
 * `DiscoverStart` lifts that rail to the front door and presents it as
 * a *peer* of the open-ended onboarding flow:
 *
 *   1. **Try a curated journey** — every showcase from `SHOWCASES`,
 *      rendered via the shared `ShowcaseCard`. One click upserts the
 *      bundle (supporting pathways first, then primary), sets the
 *      primary as active, and replaces history to `/pathways/today`.
 *      Same upsert order as `BuildMode.handleImported`, kept
 *      consistent so composite refs resolve on the first Map render.
 *
 *   2. **Or describe your own goal** — the existing free-text
 *      textarea is inlined here rather than living on a separate
 *      step. "Continue" hands off to the existing `scan` step in
 *      `OnboardRoute`, which then routes through `CredentialScan` →
 *      `SuggestionGrid` exactly as before.
 *
 *   3. **Browse the registry** — tertiary link that punts to
 *      `/pathways/build`, where the existing `ImportCtdlModal`
 *      handles full registry browse + direct CTID paste. Kept as a
 *      footer-weight affordance so new learners aren't dropped into
 *      the deepest tool first.
 *
 * Single-flight on the showcase pick: while a bundle is being
 * upserted, the other cards dim and the textarea/button disable so
 * a fast double-click can't race two showcases into the store.
 */

import React, { useState } from 'react';

import { IonIcon } from '@ionic/react';
import { cloudDownloadOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';

import { AnalyticsEvents, useAnalytics } from '../../../analytics';
import { pathwayStore } from '../../../stores/pathways';
import { SHOWCASES } from '../import/showcase';
import type { ShowcaseDefinition } from '../import/showcase';
import { ShowcaseCard } from '../import/showcase/ShowcaseCard';
import { useLearnerDid } from '../hooks/useLearnerDid';

interface DiscoverStartProps {
    /** Pre-populated text when the user navigates back from a later step. */
    initialGoal?: string;
    /** Hand off to the existing `scan` step with the captured goal. */
    onContinueWithGoal: (text: string) => void;
    /** Skip the goal entirely and go straight to scan/suggestions. */
    onSkip: () => void;
}

/**
 * Single-example placeholder. Was originally a four-example string
 * spanning all altitude buckets, but users rarely read past the first
 * example in a textarea — the wall of text read as instruction copy,
 * not a hint. One strong, aspirational example does the hinting job
 * better. The full altitude set still lives on `GoalCapture` for the
 * dedicated goal-capture step.
 */
const PLACEHOLDER = 'e.g. become a product manager';

const DiscoverStart: React.FC<DiscoverStartProps> = ({
    initialGoal = '',
    onContinueWithGoal,
    onSkip,
}) => {
    const history = useHistory();
    const analytics = useAnalytics();
    const learnerDid = useLearnerDid();

    const [text, setText] = useState(initialGoal);
    const [pickingId, setPickingId] = useState<string | null>(null);

    const trimmed = text.trim();
    const isPicking = pickingId !== null;

    /**
     * Materialize a showcase bundle into the store, set the primary
     * as active, and route to Map. Map is the better landing for a
     * curated journey than Today: it shows the full graph of nodes
     * the learner just loaded, which is the whole point of picking
     * a showcase. Today only surfaces the next step, which feels
     * underwhelming as a first impression. Mirrors
     * `BuildMode.handleImported` + `ImportCtdlModal.handleShowcaseImport`
     * so the cold-start path can't drift from the in-app import path.
     *
     * `history.replace` (not `push`) so the back button doesn't
     * bounce the learner from Today straight back into onboarding —
     * once a pathway is loaded, onboarding is no longer a meaningful
     * destination.
     */
    const handlePickShowcase = (showcase: ShowcaseDefinition) => {
        if (isPicking) return;

        setPickingId(showcase.id);

        const { primary, supporting } = showcase.build({
            ownerDid: learnerDid,
            now: new Date().toISOString(),
        });

        for (const sub of supporting) {
            pathwayStore.set.upsertPathway(sub);
        }

        pathwayStore.set.upsertPathway(primary);
        pathwayStore.set.setActivePathway(primary.id);

        analytics.track(AnalyticsEvents.PATHWAYS_CTDL_IMPORTED, {
            ctid: `showcase:${showcase.id}`,
            nodeCount: primary.nodes.length,
            warningCount: 0,
            hasDestination: !!primary.destinationNodeId,
            importSource: 'onboard',
        });

        history.replace('/pathways/map');
    };

    return (
        <div className="max-w-2xl mx-auto px-4 py-6 sm:py-8 font-poppins space-y-7">
            {/*
                In-page welcome <header> intentionally omitted: the
                shell-level `JourneysSubHeader` now anchors the page
                with the brand mark + "Journeys · beta" title +
                helper text, so a second "Welcome to Journeys" copy
                here was redundant and competed with the chrome for
                the page's primary title slot.
            */}

            {/*
                Showcases — the marquee affordance. Lives above the
                textarea on purpose: a first-time learner who can pick
                one of three pre-built journeys is one click from a
                fully-populated Today/Map/Build view, which is a much
                better demo than an empty pathway with a textarea
                hanging off it.
            */}
            {SHOWCASES.length > 0 && (
                <section aria-labelledby="discover-showcases" className="space-y-3">
                    <SectionLabel id="discover-showcases">
                        Try a curated journey
                    </SectionLabel>

                    <div className="space-y-2.5">
                        {SHOWCASES.map(showcase => (
                            <ShowcaseCard
                                key={showcase.id}
                                preview={showcase.preview}
                                onPick={() => handlePickShowcase(showcase)}
                                loading={pickingId === showcase.id}
                                disabled={isPicking && pickingId !== showcase.id}
                            />
                        ))}
                    </div>
                </section>
            )}

            {/*
                Inline goal capture. Lives here rather than on its
                own step so the open-ended path reads as a peer of
                the showcases — the exact thing the user asked for.
                Continue / Skip both forward into the existing
                `scan` step (handled by the parent `OnboardRoute`),
                so the rest of the cold-start funnel
                (CredentialScan → SuggestionGrid → instantiate) is
                unchanged.
            */}
            <section aria-labelledby="discover-goal" className="space-y-3">
                <SectionLabel id="discover-goal">
                    Or describe your own goal
                </SectionLabel>

                <div className="space-y-1.5">
                    <label
                        htmlFor="pathways-discover-goal"
                        className="text-xs font-medium text-grayscale-700"
                    >
                        In your own words
                    </label>

                    <textarea
                        id="pathways-discover-goal"
                        value={text}
                        onChange={e => setText(e.target.value)}
                        placeholder={PLACEHOLDER}
                        rows={3}
                        maxLength={280}
                        disabled={isPicking}
                        className="w-full py-3 px-4 border border-grayscale-300 rounded-xl text-sm
                                   text-grayscale-900 placeholder:text-grayscale-400
                                   focus:outline-none focus:ring-2 focus:ring-emerald-500
                                   focus:border-transparent bg-white resize-none font-poppins
                                   disabled:opacity-60 disabled:cursor-not-allowed"
                    />

                    <p className="text-xs text-grayscale-400 text-right">
                        {text.length} / 280
                    </p>
                </div>

                <div className="space-y-3">
                    <button
                        type="button"
                        onClick={() => onContinueWithGoal(trimmed)}
                        disabled={trimmed.length === 0 || isPicking}
                        className="w-full py-3 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm
                                   hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        Continue
                    </button>

                    <button
                        type="button"
                        onClick={onSkip}
                        disabled={isPicking}
                        className="w-full text-sm text-grayscale-600 hover:text-grayscale-900 transition-colors
                                   disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        Skip for now
                    </button>
                </div>
            </section>

            {/*
                Tertiary affordance — the full Credential Engine
                browse experience for power users / reviewers who want
                to see the registry catalog. Routed (not modal-mounted)
                so we don't duplicate `ImportCtdlModal` mount points;
                Build's empty state already wires the modal correctly.
            */}
            <div className="text-center pt-1">
                <button
                    type="button"
                    onClick={() => history.push('/pathways/build')}
                    disabled={isPicking}
                    className="inline-flex items-center gap-1.5 text-xs font-medium
                               text-grayscale-500 hover:text-grayscale-900 transition-colors
                               disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    <IonIcon icon={cloudDownloadOutline} aria-hidden className="text-base" />
                    Or browse the Credential Engine Registry
                </button>
            </div>
        </div>
    );
};

/**
 * Eyebrow label rendered above each section. Short component to keep
 * the markup readable; the divider trick (label + flex hairline) is
 * the same one used by the in-app split sections (e.g. the
 * What-if comparison columns) so the cold-start visually rhymes
 * with the post-onboarding shell.
 */
const SectionLabel: React.FC<{ id?: string; children: React.ReactNode }> = ({
    id,
    children,
}) => (
    <div className="flex items-center gap-3">
        <h2
            id={id}
            className="text-xs font-semibold uppercase tracking-wide text-grayscale-500"
        >
            {children}
        </h2>
        <span className="flex-1 h-px bg-grayscale-200" />
    </div>
);

export default DiscoverStart;
