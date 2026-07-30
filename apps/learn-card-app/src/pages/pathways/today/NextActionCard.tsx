/**
 * NextActionCard — the hero of Today mode.
 *
 * One node. One primary action. The entire design language of this
 * card leans on "quietly inviting" (docs § 5):
 *
 *   - Frosted-glass surface so the card reads as an object floating on
 *     the ambient backdrop, not a panel stapled to the page.
 *   - A small header row — policy label + journey position — gives the
 *     learner situational awareness without asking them to read a
 *     progress bar.
 *   - One italic reason line (pulled from the ranking scorer) carries
 *     the *why* without cluttering the hero with a bulleted list.
 *   - A single big CTA with a trailing arrow that nudges on hover.
 *
 * Motion: spring-in on mount, subtle hover-lift, press-scale-down on
 * tap. `motion/react` does the heavy lifting; this component stays a
 * pure presentational concern.
 */

import React from 'react';

import { IonIcon } from '@ionic/react';
import { arrowForwardOutline, openOutline } from 'ionicons/icons';
import { motion } from 'motion/react';
import { useHistory } from 'react-router-dom';

import { AnalyticsEvents, useAnalytics } from '../../../analytics';
import { mcpRegistryStore } from '../../../stores/pathways';
import { buildInAppHref, resolveNodeAction } from '../core/action';
import type { PathwayNode, ScoredCandidate } from '../types';

import {
    type Journey,
    journeyLabel,
    policyLabel,
    resolveNodeCallToAction,
} from './presentation';

interface NextActionCardProps {
    node: PathwayNode;
    scored: ScoredCandidate;
    journey: Journey;
    onOpen: () => void;
    /**
     * When the learner's committed `chosenRoute` drove the pick,
     * `routeStep` carries the 1-indexed position and total length.
     * The card then renders a subtle "N of M" route pill in the
     * header, swapping the policy kind for route framing so the
     * learner reads "you're on step 3 of 7" rather than "this is
     * an artifact task." When absent, the card falls back to its
     * policy-kind chrome (ranking-sourced picks).
     */
    routeStep?: { position: number; total: number };
}

const NextActionCard: React.FC<NextActionCardProps> = ({
    node,
    scored,
    journey,
    onOpen,
    routeStep,
}) => {
    const primaryReason = scored.reasons[0];
    const policy = node.stage.policy;
    const policyKind = policy.kind;
    const history = useHistory();
    const analytics = useAnalytics();

    // Look up the MCP server's human-readable label for `external`
    // policies so the CTA reads "Open in Figma" rather than "Open the
    // external tool." Subscribing via the store selector keeps the
    // label reactive if the learner connects the server mid-session.
    const mcpServers = mcpRegistryStore.use.servers();
    const mcpLabel =
        policy.kind === 'external'
            ? mcpServers[policy.mcp.serverId]?.label ?? null
            : null;

    // Resolve the action once and dispatch on its kind. The resolver
    // falls back from an explicit `node.action` to the legacy
    // earn-url / policy-mcp signals, so pre-action pathways keep
    // working. See `core/action.ts` for the precedence rules.
    const resolved = resolveNodeAction(node);

    return (
        <motion.article
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 220, damping: 24, mass: 0.8 }}
            whileHover={{ y: -2 }}
            className="relative p-6 rounded-[28px] bg-white/90 backdrop-blur-xl
                       border border-white shadow-xl shadow-grayscale-900/5
                       transition-shadow duration-300 hover:shadow-2xl hover:shadow-grayscale-900/10"
        >
            {/* Header row: left chip (route or policy), right chip (journey).
                When we have a `routeStep`, the left chip becomes a subtle
                "STEP N OF M · ROUTE" pill + thin progress rail, replacing
                the policy-kind framing. The route framing wins because
                that's the learner's committed plan — the policy kind is
                a detail of *how* step N is done; the route tells them
                *where they are.*
                Uses emerald accents (same color family as the Map's
                chosenRoute ribbon) so the two surfaces feel connected
                without shouting. */}
            <div className="flex items-center justify-between mb-4">
                {routeStep ? (
                    <div className="flex items-center gap-2 min-w-0">
                        <span
                            aria-hidden
                            className="w-1.5 h-1.5 rounded-full bg-emerald-500"
                        />

                        <span className="text-[10px] font-semibold text-emerald-700 uppercase tracking-[0.08em] whitespace-nowrap">
                            Step {routeStep.position} of {routeStep.total}
                        </span>

                        <span
                            aria-hidden
                            className="relative w-14 h-[3px] rounded-full bg-emerald-100 overflow-hidden"
                        >
                            <span
                                className="absolute inset-y-0 left-0 bg-emerald-500 rounded-full"
                                style={{
                                    width: `${Math.round(
                                        (routeStep.position / routeStep.total) * 100,
                                    )}%`,
                                }}
                            />
                        </span>
                    </div>
                ) : (
                    <div className="flex items-center gap-1.5">
                        <span
                            aria-hidden
                            className="w-1.5 h-1.5 rounded-full bg-emerald-500"
                        />

                        <span className="text-[10px] font-semibold text-grayscale-500 uppercase tracking-[0.08em]">
                            {policyLabel(policyKind)}
                        </span>
                    </div>
                )}

                <span className="text-[10px] font-medium text-grayscale-400 uppercase tracking-wider">
                    {journeyLabel(journey)}
                </span>
            </div>

            {/* Badge artwork (CTDL-imported nodes only). Shown above the
                title as a small rounded thumbnail — enough to identify
                the credential at a glance without dominating the card. */}
            {node.credentialProjection?.image && (
                <img
                    src={node.credentialProjection.image}
                    alt=""
                    className="mb-3 w-14 h-14 rounded-2xl
                               bg-grayscale-10 border border-grayscale-200
                               object-contain p-1"
                    loading="lazy"
                    onError={e => {
                        // Silently hide on error — a broken-image icon
                        // would break the card's quiet aesthetic.
                        e.currentTarget.style.display = 'none';
                    }}
                />
            )}

            {/* Title + description — the emotional center of the card. */}
            <h2 className="text-[22px] font-semibold text-grayscale-900 leading-[1.2] mb-2">
                {node.title}
            </h2>

            {node.description && (
                <p className="text-sm text-grayscale-600 leading-relaxed mb-5">
                    {node.description}
                </p>
            )}

            {/* Single italic reason — the "why now" whisper. */}
            {primaryReason && (
                <p className="text-xs text-grayscale-500 italic mb-5 leading-relaxed">
                    {primaryReason}
                </p>
            )}

            {(() => {
                // Dispatch on the resolved action kind. Kinds we treat
                // as "navigate out" render an `<a target="_blank">` and
                // also fire `onOpen` so the in-app NodeDetail is waiting
                // when the learner switches back. Kinds we treat as
                // "navigate in" (in-app-route, app-listing) use
                // `history.push`. Unsupported-at-the-CTA-layer kinds
                // (mcp-tool, none) fall back to the plain onOpen path —
                // NodeDetail is where the work actually happens.
                //
                // We suppress the earn-link redirect once the learner
                // is mid-flight (status !== 'not-started'). The
                // in-app detail is the honest destination from that
                // point on; a re-click should reopen the overlay, not
                // jump away.
                const label = resolveNodeCallToAction(node, mcpLabel);
                const active = node.progress.status === 'not-started';

                const ctaClass =
                    `group w-full py-3.5 px-5 rounded-[20px] bg-grayscale-900 text-white
                     font-medium text-sm hover:bg-grayscale-800 transition-colors
                     flex items-center justify-center gap-2
                     shadow-md shadow-grayscale-900/20`;

                // Swap the arrow icon for an "external" glyph only when
                // the click will actually leave the app. `app-listing`
                // and `in-app-route` stay internal — they navigate
                // inside LearnCard — so they keep the forward arrow.
                const leavesApp = active && resolved.kind === 'external-url';

                const icon = (
                    <IonIcon
                        icon={leavesApp ? openOutline : arrowForwardOutline}
                        className="text-base transition-transform duration-200 group-hover:translate-x-0.5"
                        aria-hidden
                    />
                );

                const track = (destination: string) =>
                    analytics.track(AnalyticsEvents.PATHWAYS_ACTION_DISPATCHED, {
                        nodeId: node.id,
                        kind: resolved.kind,
                        source: resolved.source,
                        destination,
                    });

                // `external-url` → anchor (real external target). Anchor
                // still fires `onOpen` so NodeDetail loads in the
                // background tab — same pattern the old earn-link CTA
                // used, just driven by the resolver now.
                if (active && resolved.kind === 'external-url') {
                    return (
                        <motion.a
                            href={resolved.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => {
                                track(resolved.url);
                                onOpen();
                            }}
                            whileTap={{ scale: 0.97 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                            className={ctaClass}
                            aria-label={`${label} (opens in a new tab)`}
                        >
                            <span>{label}</span>
                            {icon}
                        </motion.a>
                    );
                }

                // `in-app-route` → navigate inside the app.
                if (active && resolved.kind === 'in-app-route') {
                    const href = buildInAppHref(resolved);

                    return (
                        <motion.button
                            type="button"
                            onClick={() => {
                                track(href);
                                onOpen();
                                history.push(href);
                            }}
                            whileTap={{ scale: 0.97 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                            className={ctaClass}
                        >
                            <span>{label}</span>
                            {icon}
                        </motion.button>
                    );
                }

                // `app-listing` → learner-facing listing page.
                if (active && resolved.kind === 'app-listing') {
                    const href = `/app/${encodeURIComponent(resolved.listingId)}`;

                    return (
                        <motion.button
                            type="button"
                            onClick={() => {
                                track(href);
                                onOpen();
                                history.push(href);
                            }}
                            whileTap={{ scale: 0.97 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                            className={ctaClass}
                        >
                            <span>{label}</span>
                            {icon}
                        </motion.button>
                    );
                }

                // Everything else (mcp-tool, none, already in-progress)
                // — open the NodeDetail, where the work actually
                // happens. We still emit a dispatch event so telemetry
                // can distinguish "clicked in-app" from the external
                // paths above.
                return (
                    <motion.button
                        type="button"
                        onClick={() => {
                            track('in-app:node-detail');
                            onOpen();
                        }}
                        whileTap={{ scale: 0.97 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                        className={ctaClass}
                    >
                        <span>{label}</span>
                        {icon}
                    </motion.button>
                );
            })()}
        </motion.article>
    );
};

export default NextActionCard;
