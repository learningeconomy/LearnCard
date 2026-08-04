import { describe, it, expect, beforeEach } from 'vitest';

import {
    canPromptForFeedback,
    feedbackGovernorStore,
    resolveAdvocacyDecision,
} from './feedbackGovernor';

const DAY = 24 * 60 * 60 * 1000;
const daysAgo = (n: number) => Date.now() - n * DAY;

/** The minimum state that satisfies every advocacy gate. */
const makeEligible = () => {
    feedbackGovernorStore.set.sessionCount(3);
    feedbackGovernorStore.set.sentiment({ lastPositiveAt: daysAgo(8), positiveCount: 1 });
    feedbackGovernorStore.set.review({ requestLog: [] });
};

describe('resolveAdvocacyDecision', () => {
    beforeEach(() => {
        feedbackGovernorStore.set.surfaces({});
        feedbackGovernorStore.set.promptLog([]);
        feedbackGovernorStore.set.sessionCount(0);
        feedbackGovernorStore.set.sentiment({ positiveCount: 0 });
        feedbackGovernorStore.set.lastSessionAt(0);
        feedbackGovernorStore.set.review({ requestLog: [] });
    });

    it('is eligible once every gate is satisfied', () => {
        makeEligible();

        expect(resolveAdvocacyDecision()).toBe('eligible');
    });

    it('requires a minimum number of visits', () => {
        makeEligible();
        feedbackGovernorStore.set.sessionCount(2);

        expect(resolveAdvocacyDecision()).toBe('not_enough_sessions');
    });

    it('requires at least one positive sentiment', () => {
        makeEligible();
        feedbackGovernorStore.set.sentiment({ positiveCount: 0 });

        expect(resolveAdvocacyDecision()).toBe('no_positive_sentiment');
    });

    // Compliance-critical: the settle window is what stops the ask landing in
    // the same session as the sentiment tap, which would make it a pre-prompt.
    it('will not ask in the days immediately after the positive answer', () => {
        makeEligible();
        feedbackGovernorStore.set.sentiment({ lastPositiveAt: daysAgo(2), positiveCount: 1 });

        expect(resolveAdvocacyDecision()).toBe('sentiment_too_recent');
    });

    it('quarantines users who recently reported a bad experience', () => {
        makeEligible();
        feedbackGovernorStore.set.sentiment({
            lastPositiveAt: daysAgo(40),
            lastNegativeAt: daysAgo(3),
            positiveCount: 1,
        });

        expect(resolveAdvocacyDecision()).toBe('recent_negative');
    });

    it('lets a long-past negative stop blocking', () => {
        makeEligible();
        feedbackGovernorStore.set.sentiment({
            lastPositiveAt: daysAgo(8),
            lastNegativeAt: daysAgo(60),
            positiveCount: 1,
        });

        expect(resolveAdvocacyDecision()).toBe('eligible');
    });

    it('holds off during the cooldown after an ask', () => {
        makeEligible();
        feedbackGovernorStore.set.review({
            lastRequestedAt: daysAgo(10),
            requestLog: [daysAgo(10)],
        });

        expect(resolveAdvocacyDecision()).toBe('cooldown');
    });

    it('caps asks per year once the cooldown has passed', () => {
        makeEligible();
        feedbackGovernorStore.set.review({
            lastRequestedAt: daysAgo(100),
            requestLog: [daysAgo(300), daysAgo(100)],
        });

        expect(resolveAdvocacyDecision()).toBe('yearly_cap');
    });

    it('ignores asks that have aged out of the rolling year', () => {
        makeEligible();
        feedbackGovernorStore.set.review({
            lastRequestedAt: daysAgo(400),
            requestLog: [daysAgo(400), daysAgo(380)],
        });

        expect(resolveAdvocacyDecision()).toBe('eligible');
    });

    // Ordering matters: cooldown is checked before the yearly cap, so a user
    // inside both windows is reported as cooling down rather than capped.
    it('reports cooldown ahead of the yearly cap when both apply', () => {
        makeEligible();
        feedbackGovernorStore.set.review({
            lastRequestedAt: daysAgo(5),
            requestLog: [daysAgo(200), daysAgo(5)],
        });

        expect(resolveAdvocacyDecision()).toBe('cooldown');
    });

    it('survives a persisted review object from before requestLog existed', () => {
        makeEligible();
        feedbackGovernorStore.set.review({ requestCount: 0 } as never);

        expect(() => resolveAdvocacyDecision()).not.toThrow();
        expect(resolveAdvocacyDecision()).toBe('eligible');
    });
});

describe('recordSession', () => {
    beforeEach(() => {
        feedbackGovernorStore.set.sessionCount(0);
        feedbackGovernorStore.set.lastSessionAt(0);
    });

    it('counts the first visit', () => {
        feedbackGovernorStore.set.recordSession();

        expect(feedbackGovernorStore.get.sessionCount()).toBe(1);
    });

    it('collapses repeat calls inside the gap window', () => {
        feedbackGovernorStore.set.recordSession();
        feedbackGovernorStore.set.recordSession();
        feedbackGovernorStore.set.recordSession();

        expect(feedbackGovernorStore.get.sessionCount()).toBe(1);
    });

    it('counts again once the gap has elapsed', () => {
        feedbackGovernorStore.set.recordSession();
        feedbackGovernorStore.set.lastSessionAt(daysAgo(1));
        feedbackGovernorStore.set.recordSession();

        expect(feedbackGovernorStore.get.sessionCount()).toBe(2);
    });
});

// Both regressions found in review lived in this interaction rather than in the
// decision resolver: advocacy spends the session's single prompt when it arms,
// so an ask that never gets presented has to hand it back or the sentiment strip
// stays suppressed everywhere for the rest of the session.
describe('session prompt budget', () => {
    beforeEach(() => {
        feedbackGovernorStore.set.resetForDebug();
    });

    it('allows a prompt before anything is consumed', () => {
        expect(canPromptForFeedback('issue_success')).toBe(true);
    });

    it('blocks further prompts once the session budget is spent', () => {
        feedbackGovernorStore.set.consumeSessionPrompt();

        expect(canPromptForFeedback('issue_success')).toBe(false);
    });

    it('blocks every other surface too, not just the one that spent it', () => {
        feedbackGovernorStore.set.consumeSessionPrompt();

        expect(canPromptForFeedback('claim_oidc')).toBe(false);
        expect(canPromptForFeedback('claim_interaction')).toBe(false);
    });

    it('restores the prompt when an armed ask is released unused', () => {
        feedbackGovernorStore.set.consumeSessionPrompt();
        feedbackGovernorStore.set.releaseSessionPrompt();

        expect(canPromptForFeedback('issue_success')).toBe(true);
    });

    it('never drops below zero on an unmatched release', () => {
        feedbackGovernorStore.set.releaseSessionPrompt();
        feedbackGovernorStore.set.consumeSessionPrompt();

        expect(canPromptForFeedback('issue_success')).toBe(false);
    });

    it('is cleared by the debug reset, which localStorage alone cannot do', () => {
        feedbackGovernorStore.set.consumeSessionPrompt();
        feedbackGovernorStore.set.resetForDebug();

        expect(canPromptForFeedback('issue_success')).toBe(true);
    });
});

describe('recordAnswered', () => {
    beforeEach(() => {
        feedbackGovernorStore.set.surfaces({});
        feedbackGovernorStore.set.sentiment({ positiveCount: 0 });
    });

    it('tracks positive answers for advocacy eligibility', () => {
        feedbackGovernorStore.set.recordAnswered('issue_success', 'positive');

        expect(feedbackGovernorStore.get.sentiment().positiveCount).toBe(1);
        expect(feedbackGovernorStore.get.sentiment().lastPositiveAt).toBeDefined();
    });

    it('records neutral answers as negative signal, not positive', () => {
        feedbackGovernorStore.set.recordAnswered('issue_success', 'neutral');

        expect(feedbackGovernorStore.get.sentiment().positiveCount).toBe(0);
        expect(feedbackGovernorStore.get.sentiment().lastNegativeAt).toBeDefined();
    });
});
