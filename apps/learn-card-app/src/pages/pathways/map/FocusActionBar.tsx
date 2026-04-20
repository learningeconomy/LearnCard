/**
 * FocusActionBar — persistent bottom action sheet for the Map's focus
 * node.
 *
 * Why it exists:
 *
 *   The Map's focus affordance needs three things at once — tell the
 *   learner *what* is focused, *what kind of work* it asks of them, and
 *   *how to start it*. An absolutely-positioned button attached to the
 *   node card solved "how to start" but visually overlapped the edges
 *   that connect the focus node to its neighbors, and it couldn't fit
 *   the policy chip or enough of the title to be informative.
 *
 *   A docked bottom sheet — the pattern Google Maps / Apple Maps use
 *   when you select a place — solves all three without fighting the
 *   graph:
 *
 *     - Never overlaps edges (lives in the viewport chrome, not the
 *       graph canvas)
 *     - Pairs with the existing top "On your way to __" pill so the
 *       map viewport reads as bookended: *destination* at the top,
 *       *current action* at the bottom
 *     - Wide enough to show the policy chip, the full title, and a
 *       big primary CTA
 *
 * Styling deliberately mirrors the top pill (white/70 backdrop-blur,
 * rounded-[28px], shadow-lg) so the two frosted surfaces read as a
 * single design system.
 */

import React from 'react';

import { IonIcon } from '@ionic/react';
import { arrowForwardOutline } from 'ionicons/icons';
import { AnimatePresence, motion } from 'motion/react';

import { mcpRegistryStore } from '../../../stores/pathways';
import {
    policyLabel,
    resolvePolicyCallToAction,
} from '../today/presentation';
import type { PathwayNode } from '../types';

interface FocusActionBarProps {
    /**
     * The currently-focused node. `null` when nothing is focused (empty
     * map or mid-transition). The component animates out rather than
     * abruptly unmounts so focus switches feel continuous.
     */
    node: PathwayNode | null;
    onOpen: (nodeId: string) => void;
}

const FocusActionBar: React.FC<FocusActionBarProps> = ({ node, onOpen }) => {
    // Reactive lookup of the MCP server label so `external` policies
    // render "Open in Figma" / "Open in Notion" rather than the generic
    // fallback. Matches NextActionCard on Today for consistency.
    const mcpServers = mcpRegistryStore.use.servers();

    // The bar is not meaningful when the focused node is already done
    // or skipped — no action to take. Hiding it (rather than disabling
    // a button) keeps the UI honest and lets the learner's eye go back
    // to the graph itself.
    const status = node?.progress.status;
    const isActionable =
        !!node && status !== 'completed' && status !== 'skipped';

    return (
        <div
            className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 z-10
                       w-full max-w-md px-4 font-poppins"
        >
            <AnimatePresence mode="wait">
                {isActionable && node && (
                    <motion.div
                        key={node.id}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        transition={{ type: 'spring', stiffness: 260, damping: 26, mass: 0.7 }}
                        className="pointer-events-auto flex items-center gap-3 p-2.5 pl-4
                                   rounded-[28px] bg-white/80 backdrop-blur-xl
                                   border border-white shadow-xl shadow-grayscale-900/10"
                    >
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 mb-0.5">
                                <span
                                    aria-hidden
                                    className="w-1.5 h-1.5 rounded-full bg-emerald-500"
                                />

                                <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-grayscale-500">
                                    {policyLabel(node.stage.policy.kind)}
                                </span>

                                <span
                                    aria-hidden
                                    className="text-grayscale-300 text-[10px]"
                                >
                                    ·
                                </span>

                                <span className="text-[10px] font-medium uppercase tracking-wide text-emerald-700">
                                    {status === 'in-progress'
                                        ? 'In progress'
                                        : status === 'stalled'
                                            ? 'Needs attention'
                                            : 'Up next'}
                                </span>
                            </div>

                            <p className="text-sm font-semibold text-grayscale-900 truncate">
                                {node.title}
                            </p>
                        </div>

                        <motion.button
                            type="button"
                            onClick={() => onOpen(node.id)}
                            whileTap={{ scale: 0.96 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                            className="group shrink-0 py-2.5 px-4 rounded-full
                                       bg-emerald-600 text-white text-sm font-semibold
                                       shadow-md shadow-emerald-600/30
                                       hover:bg-emerald-700 transition-colors
                                       flex items-center gap-1.5 whitespace-nowrap"
                        >
                            <span>
                                {status === 'in-progress' || status === 'stalled'
                                    ? 'Keep going'
                                    : resolvePolicyCallToAction(
                                          node.stage.policy,
                                          node.stage.policy.kind === 'external'
                                              ? mcpServers[node.stage.policy.mcp.serverId]?.label ?? null
                                              : null,
                                      )}
                            </span>

                            <IonIcon
                                icon={arrowForwardOutline}
                                className="text-base transition-transform duration-200 group-hover:translate-x-0.5"
                                aria-hidden
                            />
                        </motion.button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default FocusActionBar;
