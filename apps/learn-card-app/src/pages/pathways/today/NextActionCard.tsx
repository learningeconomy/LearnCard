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
import { arrowForwardOutline } from 'ionicons/icons';
import { motion } from 'motion/react';

import { mcpRegistryStore } from '../../../stores/pathways';
import type { PathwayNode, ScoredCandidate } from '../types';

import {
    type Journey,
    journeyLabel,
    policyLabel,
    resolvePolicyCallToAction,
} from './presentation';

interface NextActionCardProps {
    node: PathwayNode;
    scored: ScoredCandidate;
    journey: Journey;
    onOpen: () => void;
}

const NextActionCard: React.FC<NextActionCardProps> = ({
    node,
    scored,
    journey,
    onOpen,
}) => {
    const primaryReason = scored.reasons[0];
    const policy = node.stage.policy;
    const policyKind = policy.kind;

    // Look up the MCP server's human-readable label for `external`
    // policies so the CTA reads "Open in Figma" rather than "Open the
    // external tool." Subscribing via the store selector keeps the
    // label reactive if the learner connects the server mid-session.
    const mcpServers = mcpRegistryStore.use.servers();
    const mcpLabel =
        policy.kind === 'external'
            ? mcpServers[policy.mcp.serverId]?.label ?? null
            : null;

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
            {/* Header row: policy chip on the left, journey chip on the right. */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-1.5">
                    <span
                        aria-hidden
                        className="w-1.5 h-1.5 rounded-full bg-emerald-500"
                    />

                    <span className="text-[10px] font-semibold text-grayscale-500 uppercase tracking-[0.08em]">
                        {policyLabel(policyKind)}
                    </span>
                </div>

                <span className="text-[10px] font-medium text-grayscale-400 uppercase tracking-wider">
                    {journeyLabel(journey)}
                </span>
            </div>

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

            <motion.button
                type="button"
                onClick={onOpen}
                whileTap={{ scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                className="group w-full py-3.5 px-5 rounded-[20px] bg-grayscale-900 text-white
                           font-medium text-sm hover:bg-grayscale-800 transition-colors
                           flex items-center justify-center gap-2
                           shadow-md shadow-grayscale-900/20"
            >
                <span>{resolvePolicyCallToAction(policy, mcpLabel)}</span>

                <IonIcon
                    icon={arrowForwardOutline}
                    className="text-base transition-transform duration-200 group-hover:translate-x-0.5"
                />
            </motion.button>
        </motion.article>
    );
};

export default NextActionCard;
