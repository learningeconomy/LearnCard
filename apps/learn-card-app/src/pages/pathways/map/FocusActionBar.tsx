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
import { arrowForwardOutline, openOutline } from 'ionicons/icons';
import { AnimatePresence, motion } from 'motion/react';

import { mcpRegistryStore } from '../../../stores/pathways';
import {
    getNodeEarnLink,
    policyLabel,
    resolveNodeCallToAction,
} from '../today/presentation';
import type { PathwayNode } from '../types';

import { formatEta, nodeEffortMinutes } from './route';

interface FocusActionBarProps {
    /**
     * The currently-focused node. `null` when nothing is focused (empty
     * map or mid-transition). The component animates out rather than
     * abruptly unmounts so focus switches feel continuous.
     */
    node: PathwayNode | null;

    /**
     * The node immediately after the focus on the suggested route, if
     * any. Used to render a small "THEN: …" peek under the primary
     * CTA — the Waze "next turn in 0.5 mi" affordance applied to
     * pathways so learners never wonder what comes after this step.
     * `null` when no route exists or the focus is the route's last
     * uncompleted step.
     */
    nextOnRoute?: PathwayNode | null;

    onOpen: (nodeId: string) => void;
}

const FocusActionBar: React.FC<FocusActionBarProps> = ({ node, nextOnRoute, onOpen }) => {
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
        /*
            Docked bottom sheet positioning.
            ────────────────────────────────
            The bar sits absolutely inside the Map viewport, but on
            mobile the app renders an `IonTabBar` along the bottom
            edge of the window. `bottom-4` alone would slide the
            bar *behind* the tab bar on iPhone SE / Android narrow.
            We solve that with a responsive clearance:

              - `bottom-4` on desktop / tablet (no tab bar).
              - `bottom-24` below `sm` so the bar rides above the
                ~56 px tab bar + the home-indicator safe area.
              - `pb-[env(safe-area-inset-bottom)]` as an extra
                cushion on devices reporting a non-zero inset (iOS
                PWA, iPad split view) so the CTA is never clipped
                by the rounded-corner home indicator.

            The `px-4` inner gutter stays so the frosted card
            doesn't butt against the viewport edge on narrow phones.
        */
        <div
            className="pointer-events-none absolute left-1/2 -translate-x-1/2 z-10
                       w-full max-w-md px-4 font-poppins
                       bottom-24 sm:bottom-4
                       pb-[env(safe-area-inset-bottom,0px)]"
        >
            <AnimatePresence mode="wait">
                {isActionable && node && (
                    <motion.div
                        key={node.id}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        transition={{ type: 'spring', stiffness: 260, damping: 26, mass: 0.7 }}
                        className="pointer-events-auto flex flex-col gap-0 p-2.5 pl-4
                                   rounded-[28px] bg-white/80 backdrop-blur-xl
                                   border border-white shadow-xl shadow-grayscale-900/10"
                    >
                      <div className="flex items-center gap-3">
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

                        {(() => {
                            // Resolve the CTA once — label and external
                            // target are orthogonal concerns, so we
                            // render the same inner content whether the
                            // button is an `<a>` (earn-link present) or
                            // a plain `<button>`.
                            const ctaLabel =
                                status === 'in-progress' || status === 'stalled'
                                    ? 'Keep going'
                                    : resolveNodeCallToAction(
                                          node,
                                          node.stage.policy.kind === 'external'
                                              ? mcpServers[node.stage.policy.mcp.serverId]?.label ?? null
                                              : null,
                                      );

                            // `earnLink` is only surfaced when the node
                            // is a credential projection with a real
                            // http(s) URL (see `getNodeEarnLink`). For
                            // `in-progress` / `stalled` nodes we keep
                            // the in-app flow so the learner can record
                            // progress rather than being kicked out.
                            const earnLink =
                                status === 'not-started' ? getNodeEarnLink(node) : null;

                            const ctaClass =
                                `group shrink-0 py-2.5 px-4 rounded-full
                                 bg-emerald-600 text-white text-sm font-semibold
                                 shadow-md shadow-emerald-600/30
                                 hover:bg-emerald-700 transition-colors
                                 flex items-center gap-1.5 whitespace-nowrap`;

                            const icon = (
                                <IonIcon
                                    icon={earnLink ? openOutline : arrowForwardOutline}
                                    className="text-base transition-transform duration-200 group-hover:translate-x-0.5"
                                    aria-hidden
                                />
                            );

                            if (earnLink) {
                                return (
                                    <motion.a
                                        href={earnLink.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        // Fire the in-app open alongside so the
                                        // learner lands on the node detail when
                                        // they switch back from the new tab —
                                        // that's where they mark it complete.
                                        onClick={() => onOpen(node.id)}
                                        whileTap={{ scale: 0.96 }}
                                        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                                        className={ctaClass}
                                        aria-label={`${ctaLabel} (opens in a new tab)`}
                                    >
                                        <span>{ctaLabel}</span>
                                        {icon}
                                    </motion.a>
                                );
                            }

                            return (
                                <motion.button
                                    type="button"
                                    onClick={() => onOpen(node.id)}
                                    whileTap={{ scale: 0.96 }}
                                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                                    className={ctaClass}
                                >
                                    <span>{ctaLabel}</span>
                                    {icon}
                                </motion.button>
                            );
                        })()}
                      </div>

                      {/*
                          "Then" peek — the Waze next-turn preview.
                          Renders a second row beneath the main CTA
                          with the next uncompleted node on the
                          route plus a rough ETA, so the learner
                          always sees *what comes after this step*
                          before they commit to opening it. The row
                          animates in gently so it doesn't feel like
                          a new thing every focus switch — more like
                          the pill "expanding" to show the next
                          instruction.
                      */}
                      {nextOnRoute && (
                          <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.25, ease: 'easeOut' }}
                              className="mt-2 pt-2 pr-2 border-t border-grayscale-100 flex items-center gap-2 overflow-hidden"
                          >
                              <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-grayscale-400 shrink-0">
                                  Then
                              </span>

                              <span
                                  title={nextOnRoute.title}
                                  className="text-xs text-grayscale-700 truncate flex-1 min-w-0"
                              >
                                  {nextOnRoute.title}
                              </span>

                              <span
                                  aria-hidden
                                  className="text-grayscale-300 text-[10px] shrink-0"
                              >
                                  ·
                              </span>

                              <span className="text-[10px] font-medium text-grayscale-500 shrink-0">
                                  {formatEta(nodeEffortMinutes(nextOnRoute))}
                              </span>
                          </motion.div>
                      )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default FocusActionBar;
