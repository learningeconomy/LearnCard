import React from 'react';

import { Gauge, RotateCcw, Sparkles, ThumbsDown, Clock, Star } from 'lucide-react';
import { Capacitor } from '@capacitor/core';

import {
    feedbackGovernorStore,
    readRequestLog,
    resolveAdvocacyDecision,
    canPromptForFeedback,
    type AdvocacyDecision,
} from '../../feedback/feedbackGovernor';
import { resetAdvocacyLatchForDebug } from '../../feedback/useAdvocacyPrompt';
import type { FeedbackSurface } from '@analytics';

import { KVRow, Section, useCopyToClipboard } from './debugComponents';

const DAY_MS = 24 * 60 * 60 * 1000;

const SURFACES: FeedbackSurface[] = ['issue_success', 'claim_interaction', 'claim_oidc'];

const DECISION_COLOR: Record<AdvocacyDecision, string> = {
    eligible: 'text-emerald-400',
    not_enough_sessions: 'text-amber-400',
    no_positive_sentiment: 'text-amber-400',
    sentiment_too_recent: 'text-amber-400',
    recent_negative: 'text-red-400',
    cooldown: 'text-sky-400',
    yearly_cap: 'text-red-400',
};

const ago = (t?: number): string => {
    if (!t) return '—';

    const days = (Date.now() - t) / DAY_MS;

    return days < 1 ? `${Math.round(days * 24)}h ago` : `${days.toFixed(1)}d ago`;
};

/**
 * QA surface for the feedback / advocacy system, which is otherwise close to
 * untestable: the eligibility windows are measured in days, the per-session cap
 * lives in memory, and on native the OS decides whether a review dialog appears
 * and never reports back. Reads live state and offers the state transitions that
 * would otherwise require hand-editing localStorage.
 */
export const FeedbackDebugTab: React.FC = () => {
    const [copied, copyToClipboard] = useCopyToClipboard();

    const surfaces = feedbackGovernorStore.use.surfaces();
    const promptLog = feedbackGovernorStore.use.promptLog();
    const sentiment = feedbackGovernorStore.use.sentiment();
    const sessionCount = feedbackGovernorStore.use.sessionCount();
    const lastSessionAt = feedbackGovernorStore.use.lastSessionAt();
    const review = feedbackGovernorStore.use.review();

    const decision = resolveAdvocacyDecision();
    const asksThisYear = readRequestLog(review).length;

    const makeAdvocacyEligible = () => {
        feedbackGovernorStore.set.sessionCount(3);
        feedbackGovernorStore.set.lastSessionAt(Date.now() - DAY_MS);
        feedbackGovernorStore.set.sentiment({
            lastPositiveAt: Date.now() - 8 * DAY_MS,
            positiveCount: 1,
        });
        feedbackGovernorStore.set.review({ requestLog: [] });
    };

    const simulateRecentNegative = () => {
        feedbackGovernorStore.set.sentiment({
            ...sentiment,
            lastNegativeAt: Date.now() - 3 * DAY_MS,
        });
    };

    const expireCooldowns = () => {
        const stale = Date.now() - 200 * DAY_MS;

        feedbackGovernorStore.set.sentiment({
            ...sentiment,
            lastNegativeAt: sentiment.lastNegativeAt ? stale : undefined,
        });
        // Backdate the existing asks rather than replacing them: dropping the
        // count from 2 to 1 would turn a yearly_cap decision back into eligible.
        feedbackGovernorStore.set.review({
            lastRequestedAt: stale,
            requestLog: readRequestLog(review).map(() => stale),
        });
        feedbackGovernorStore.set.surfaces({});
    };

    const fillYearlyCap = () => {
        const old = Date.now() - 150 * DAY_MS;

        feedbackGovernorStore.set.review({
            lastRequestedAt: old,
            requestLog: [Date.now() - 300 * DAY_MS, old],
        });
    };

    return (
        <div className="space-y-2">
            <Section
                title="Advocacy decision"
                icon={<Gauge className="w-3 h-3" />}
                defaultOpen
                badge={
                    <span className={`text-[10px] font-semibold ${DECISION_COLOR[decision]}`}>
                        {decision}
                    </span>
                }
            >
                <div className="space-y-0.5">
                    <KVRow
                        label="platform"
                        value={Capacitor.isNativePlatform() ? Capacitor.getPlatform() : 'web'}
                        copied={copied}
                        onCopy={copyToClipboard}
                    />
                    <KVRow
                        label="ask on native"
                        value={Capacitor.isNativePlatform() ? 'OS review prompt' : 'GitHub card'}
                        copied={copied}
                        onCopy={copyToClipboard}
                    />
                    <KVRow
                        label="asks this year"
                        value={`${asksThisYear} / 2`}
                        copied={copied}
                        onCopy={copyToClipboard}
                    />
                    <KVRow
                        label="last ask"
                        value={ago(review.lastRequestedAt)}
                        copied={copied}
                        onCopy={copyToClipboard}
                    />
                </div>

                <p className="mt-2 text-[10px] leading-relaxed text-gray-500">
                    Native resolves to an OS dialog that reports nothing back, so a green
                    <span className="text-emerald-400"> eligible </span>
                    here is the only confirmation available before production.
                </p>
            </Section>

            <Section title="Sentiment ledger" icon={<Sparkles className="w-3 h-3" />} defaultOpen>
                <div className="space-y-0.5">
                    <KVRow
                        label="positive count"
                        value={sentiment.positiveCount}
                        copied={copied}
                        onCopy={copyToClipboard}
                    />
                    <KVRow
                        label="last positive"
                        value={ago(sentiment.lastPositiveAt)}
                        copied={copied}
                        onCopy={copyToClipboard}
                    />
                    <KVRow
                        label="last negative"
                        value={ago(sentiment.lastNegativeAt)}
                        copied={copied}
                        onCopy={copyToClipboard}
                    />
                    <KVRow
                        label="visits"
                        value={`${sessionCount} (need 3)`}
                        copied={copied}
                        onCopy={copyToClipboard}
                    />
                    <KVRow
                        label="last visit"
                        value={ago(lastSessionAt)}
                        copied={copied}
                        onCopy={copyToClipboard}
                    />
                    <KVRow
                        label="prompts this week"
                        value={`${promptLog.length} / 3`}
                        copied={copied}
                        onCopy={copyToClipboard}
                    />
                </div>
            </Section>

            <Section title="Per-surface state" icon={<Clock className="w-3 h-3" />}>
                <div className="space-y-0.5">
                    {SURFACES.map(surface => {
                        const state = surfaces[surface];

                        return (
                            <KVRow
                                key={surface}
                                label={surface}
                                value={
                                    canPromptForFeedback(surface)
                                        ? 'can prompt'
                                        : `blocked${
                                              state?.mutedUntil && state.mutedUntil > Date.now()
                                                  ? ' (muted)'
                                                  : state?.lastAnsweredAt
                                                  ? ' (answered)'
                                                  : ' (session/week cap)'
                                          }`
                                }
                                copied={copied}
                                onCopy={copyToClipboard}
                            />
                        );
                    })}
                </div>

                <p className="mt-2 text-[10px] leading-relaxed text-gray-500">
                    The per-session cap is held in memory, so clearing localStorage by hand will not
                    release it. Use Reset below.
                </p>
            </Section>

            <Section title="Actions" icon={<RotateCcw className="w-3 h-3" />} defaultOpen>
                <div className="space-y-1.5">
                    <button
                        type="button"
                        onClick={() => {
                            feedbackGovernorStore.set.resetForDebug();
                            resetAdvocacyLatchForDebug();
                        }}
                        className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[10px] font-semibold bg-gray-800 text-gray-200 hover:bg-gray-700 transition-colors"
                    >
                        <RotateCcw className="w-3 h-3" />
                        Reset all feedback state
                    </button>

                    <button
                        type="button"
                        onClick={makeAdvocacyEligible}
                        className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[10px] font-semibold bg-emerald-950/40 text-emerald-300 ring-1 ring-emerald-800 hover:bg-emerald-900/40 transition-colors"
                    >
                        <Star className="w-3 h-3" />
                        Make advocacy-eligible
                    </button>

                    <div className="flex gap-1.5">
                        <button
                            type="button"
                            onClick={simulateRecentNegative}
                            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[10px] font-semibold bg-red-950/40 text-red-300 ring-1 ring-red-800 hover:bg-red-900/40 transition-colors"
                        >
                            <ThumbsDown className="w-3 h-3" />
                            Recent negative
                        </button>

                        <button
                            type="button"
                            onClick={fillYearlyCap}
                            className="flex-1 py-1.5 rounded-md text-[10px] font-semibold bg-amber-950/40 text-amber-300 ring-1 ring-amber-800 hover:bg-amber-900/40 transition-colors"
                        >
                            Fill yearly cap
                        </button>
                    </div>

                    <button
                        type="button"
                        onClick={expireCooldowns}
                        className="w-full py-1.5 rounded-md text-[10px] font-semibold bg-sky-950/40 text-sky-300 ring-1 ring-sky-800 hover:bg-sky-900/40 transition-colors"
                    >
                        Expire all cooldowns
                    </button>

                    <p className="text-[10px] leading-relaxed text-gray-500">
                        Set state here, then trigger a credential issue or claim. No reload needed —
                        the prompt reads the governor when the success screen mounts.
                    </p>
                </div>
            </Section>
        </div>
    );
};

export default FeedbackDebugTab;
