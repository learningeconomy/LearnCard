/**
 * TodayMode — one node, one action, zero distraction (docs § 5).
 *
 * Computes a `RankingContext` from the active pathway + locally-computable
 * signals, calls `getNextAction`, and renders either the hero
 * `NextActionCard` or a calm empty state.
 *
 * Agent-origin signals (Router / Matcher) are `null` in Phase 1 —
 * `getNextAction` handles that via the graceful-degradation contract.
 */

import React, { useEffect, useMemo } from 'react';

import { useHistory } from 'react-router-dom';

import { AnalyticsEvents, useAnalytics } from '../../../analytics';
import { pathwayStore } from '../../../stores/pathways';
import { availableNodes } from '../core/graphOps';
import { collectFsrsDue } from '../scheduler/fsrsScheduler';
import type { NodeRef, RankingContext } from '../types';

import CompletionMoment from './CompletionMoment';
import NextActionCard from './NextActionCard';
import StreakRibbon from './StreakRibbon';
import { getNextAction, rankCandidates } from './ranking';

const HOURS_12 = 12 * 60 * 60 * 1000;

const TodayMode: React.FC = () => {
    const activePathway = pathwayStore.use.activePathway();
    const analytics = useAnalytics();
    const history = useHistory();

    const now = useMemo(() => new Date().toISOString(), [activePathway?.updatedAt]);

    // -- Build the ranking context deterministically ----------------------

    const context = useMemo<RankingContext | null>(() => {
        if (!activePathway) return null;

        const lastActivityMs = activePathway.nodes
            .map(n => (n.progress.streak.lastActiveAt ? new Date(n.progress.streak.lastActiveAt).getTime() : 0))
            .reduce((a, b) => Math.max(a, b), 0);

        type StreakSnapshot = {
            current: number;
            longest: number;
            lastActiveAt?: string;
        };

        const initialStreak: StreakSnapshot = { current: 0, longest: 0 };

        const topStreak = activePathway.nodes.reduce<StreakSnapshot>(
            (best, n) =>
                n.progress.streak.current > best.current ? n.progress.streak : best,
            initialStreak,
        );

        const nowMs = new Date(now).getTime();
        const inGraceWindow = lastActivityMs > 0 && nowMs - lastActivityMs < HOURS_12;

        // Treat any node with `status === 'in-progress'` as stalled if its
        // streak hasn't updated in > 24h. Deliberately simple for v1.
        const stalls = activePathway.nodes
            .filter(n => n.progress.status === 'in-progress')
            .map(n => {
                const last = n.progress.streak.lastActiveAt
                    ? new Date(n.progress.streak.lastActiveAt).getTime()
                    : new Date(n.createdAt).getTime();

                const days = Math.max(0, Math.floor((nowMs - last) / (24 * 60 * 60 * 1000)));

                return { nodeId: n.id, stalledSinceDays: days };
            })
            .filter(s => s.stalledSinceDays >= 1);

        const recentEndorsements = activePathway.nodes.flatMap(n =>
            n.endorsements
                .filter(e => e.receivedAt)
                .map(e => ({ nodeId: n.id, receivedAt: e.receivedAt! })),
        );

        return {
            now,
            fsrsDue: collectFsrsDue(activePathway),
            stalls,
            streakState: {
                current: topStreak.current,
                longest: topStreak.longest,
                lastActiveAt: topStreak.lastActiveAt,
                inGraceWindow,
            },
            recentEndorsements,
            agentSignals: null, // Phase 3+ populates this
        };
    }, [activePathway, now]);

    const candidates: NodeRef[] = useMemo(() => {
        if (!activePathway) return [];

        return availableNodes(activePathway).map(n => ({
            pathwayId: activePathway.id,
            nodeId: n.id,
        }));
    }, [activePathway]);

    const scored = useMemo(() => {
        if (!context) return null;

        return getNextAction(candidates, context);
    }, [candidates, context]);

    // -- Telemetry: emit `nextActionShown` when the card renders ----------

    useEffect(() => {
        if (!scored || !context) return;

        const allScored = rankCandidates(candidates, context);

        analytics.track(AnalyticsEvents.PATHWAYS_TODAY_NEXT_ACTION_SHOWN, {
            nodeId: scored.node.nodeId,
            reasons: scored.reasons,
            topScore: scored.score,
            runnerUpScores: allScored.slice(1, 4).map(s => s.score),
        });
    }, [scored, context, candidates, analytics]);

    // -- Render ------------------------------------------------------------

    if (!activePathway) {
        return (
            <div className="max-w-md mx-auto px-4 py-12 font-poppins text-center">
                <h2 className="text-xl font-semibold text-grayscale-900 mb-2">
                    Nothing to do just yet
                </h2>

                <p className="text-sm text-grayscale-600 leading-relaxed mb-6">
                    Choose a pathway and Today will light up with your next step.
                </p>

                <button
                    type="button"
                    onClick={() => history.push('/pathways/onboard')}
                    className="inline-block py-3 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm
                               hover:opacity-90 transition-opacity"
                >
                    Start a pathway
                </button>
            </div>
        );
    }

    const nodeById = scored
        ? activePathway.nodes.find(n => n.id === scored.node.nodeId)
        : null;

    // -- Completion moment -------------------------------------------------
    //
    // Read from `pathwayStore.recentCompletion`, which `completeTermination`
    // sets inside the reducer. We keep this on the store (not in component
    // state) because NodeDetail navigates away on "Mark complete", unmounting
    // Today — a component-scoped ref would be lost on remount. The banner
    // auto-clears after 5s so re-opening Today later doesn't show a stale
    // signal.

    const recentCompletion = pathwayStore.use.recentCompletion();

    const justCompletedTitle =
        recentCompletion && activePathway && recentCompletion.pathwayId === activePathway.id
            ? recentCompletion.title
            : null;

    useEffect(() => {
        if (!recentCompletion) return;

        const handle = window.setTimeout(
            () => pathwayStore.set.clearRecentCompletion(),
            5000,
        );

        return () => window.clearTimeout(handle);
    }, [recentCompletion]);

    // -- Streak ribbon gating ---------------------------------------------
    //
    // On day 1–2 the "1-day streak · Grace window active" ribbon reads as
    // noise. Only surface the ribbon once the streak is actually
    // meaningful, or when there's a real longest streak to protect.

    const shouldShowStreak =
        context?.streakState &&
        (context.streakState.current >= 3 || context.streakState.longest >= 3);

    return (
        <div className="max-w-md mx-auto px-4 py-8 font-poppins space-y-5">
            {justCompletedTitle && (
                <CompletionMoment
                    title={justCompletedTitle}
                    onDismiss={() => pathwayStore.set.clearRecentCompletion()}
                />
            )}

            {nodeById && scored ? (
                <NextActionCard
                    node={nodeById}
                    scored={scored}
                    onOpen={() => {
                        pathwayStore.set.clearRecentCompletion();
                        history.push(
                            `/pathways/node/${scored.node.pathwayId}/${scored.node.nodeId}`,
                        );
                    }}
                />
            ) : (
                <div className="p-5 rounded-[24px] border border-grayscale-200 bg-white text-center">
                    <h3 className="text-base font-semibold text-grayscale-900 mb-1">
                        Nothing left to do here
                    </h3>

                    <p className="text-sm text-grayscale-600 leading-relaxed">
                        Every available node is either completed or waiting on prerequisites. The
                        Map view can help you see what's next.
                    </p>
                </div>
            )}

            {shouldShowStreak && context?.streakState && (
                <StreakRibbon
                    current={context.streakState.current}
                    longest={context.streakState.longest}
                    inGraceWindow={context.streakState.inGraceWindow}
                />
            )}
        </div>
    );
};

export default TodayMode;
