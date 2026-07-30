import { describe, expect, it } from 'vitest';

import type { NodeRef, RankingContext } from '../types';
import { DEFAULT_RANKING_WEIGHTS } from './rankingWeights';

import { getNextAction, rankCandidates, scoreCandidate } from './ranking';

const NOW = '2026-04-20T12:00:00.000Z';

const ref = (nodeId: string): NodeRef => ({ pathwayId: 'p1', nodeId });

const emptyContext = (overrides: Partial<RankingContext> = {}): RankingContext => ({
    now: NOW,
    fsrsDue: [],
    stalls: [],
    streakState: null,
    recentEndorsements: [],
    agentSignals: null,
    ...overrides,
});

describe('scoreCandidate', () => {
    it('returns a fallback score with a plain-language reason when no signals apply', () => {
        const result = scoreCandidate(ref('a'), emptyContext(), DEFAULT_RANKING_WEIGHTS);

        expect(result.score).toBe(DEFAULT_RANKING_WEIGHTS.fallback);
        expect(result.reasons).toEqual(['Pick up where you left off']);
    });

    it('weights FSRS-due-now highest for reviewable nodes', () => {
        const context = emptyContext({
            fsrsDue: [{ nodeId: 'a', dueAt: '2026-04-20T11:00:00.000Z' }], // 1h ago
        });

        const result = scoreCandidate(ref('a'), context, DEFAULT_RANKING_WEIGHTS);

        expect(result.score).toBe(DEFAULT_RANKING_WEIGHTS.fsrsDueNow);
        expect(result.reasons).toContain('A review is due now');
    });

    it('distinguishes FSRS-due-soon from due-now', () => {
        const context = emptyContext({
            fsrsDue: [{ nodeId: 'a', dueAt: '2026-04-20T20:00:00.000Z' }], // 8h out
        });

        const result = scoreCandidate(ref('a'), context, DEFAULT_RANKING_WEIGHTS);

        expect(result.score).toBe(DEFAULT_RANKING_WEIGHTS.fsrsDueSoon);
        expect(result.reasons).toContain('A review is coming up soon');
    });

    it('ignores FSRS entries more than 24h out', () => {
        const context = emptyContext({
            fsrsDue: [{ nodeId: 'a', dueAt: '2026-04-22T12:00:00.000Z' }], // 2 days out
        });

        const result = scoreCandidate(ref('a'), context, DEFAULT_RANKING_WEIGHTS);

        expect(result.score).toBe(DEFAULT_RANKING_WEIGHTS.fallback);
    });

    it('scales stall recovery by age up to the saturation window', () => {
        const oneDay = scoreCandidate(
            ref('a'),
            emptyContext({ stalls: [{ nodeId: 'a', stalledSinceDays: 1 }] }),
            DEFAULT_RANKING_WEIGHTS,
        );
        const saturated = scoreCandidate(
            ref('a'),
            emptyContext({ stalls: [{ nodeId: 'a', stalledSinceDays: 14 }] }),
            DEFAULT_RANKING_WEIGHTS,
        );

        expect(oneDay.score).toBeLessThan(saturated.score);
        expect(saturated.score).toBe(DEFAULT_RANKING_WEIGHTS.stallRecovery);
    });

    it('adds the streak-grace signal to any available candidate during the grace window', () => {
        const context = emptyContext({
            streakState: {
                current: 4,
                longest: 6,
                inGraceWindow: true,
            },
        });

        const result = scoreCandidate(ref('a'), context, DEFAULT_RANKING_WEIGHTS);

        expect(result.score).toBeGreaterThanOrEqual(DEFAULT_RANKING_WEIGHTS.streakGrace);
        expect(result.reasons.some(r => r.includes('4-day streak'))).toBe(true);
    });

    it('preserves the streak without a personalized number when current is 0', () => {
        const context = emptyContext({
            streakState: { current: 0, longest: 0, inGraceWindow: true },
        });

        const result = scoreCandidate(ref('a'), context, DEFAULT_RANKING_WEIGHTS);

        expect(result.reasons).toContain('A small step today keeps your streak going');
    });

    it('applies Router and Matcher signals when agent layer is available', () => {
        const context = emptyContext({
            agentSignals: {
                routerSuggestions: [{ nodeId: 'a', reason: 'You stalled here; try side route B' }],
                matcherSuggestions: [{ nodeId: 'a', reason: 'Fits a mentor your network recommended' }],
            },
        });

        const result = scoreCandidate(ref('a'), context, DEFAULT_RANKING_WEIGHTS);

        expect(result.score).toBe(
            DEFAULT_RANKING_WEIGHTS.routerSuggestion + DEFAULT_RANKING_WEIGHTS.matcherSuggestion,
        );
        expect(result.reasons).toContain('You stalled here; try side route B');
        expect(result.reasons).toContain('Fits a mentor your network recommended');
    });

    it('treats agentSignals === null as zero contribution, not an error', () => {
        const context = emptyContext({ agentSignals: null });

        const result = scoreCandidate(ref('a'), context, DEFAULT_RANKING_WEIGHTS);

        expect(result.score).toBe(DEFAULT_RANKING_WEIGHTS.fallback);
        expect(result.reasons).toEqual(['Pick up where you left off']);
    });

    it('combines multiple signals additively', () => {
        const context = emptyContext({
            fsrsDue: [{ nodeId: 'a', dueAt: '2026-04-20T11:00:00.000Z' }],
            recentEndorsements: [{ nodeId: 'a', receivedAt: '2026-04-20T11:30:00.000Z' }],
        });

        const result = scoreCandidate(ref('a'), context, DEFAULT_RANKING_WEIGHTS);

        expect(result.score).toBe(
            DEFAULT_RANKING_WEIGHTS.fsrsDueNow + DEFAULT_RANKING_WEIGHTS.recentEndorsement,
        );
        expect(result.reasons.length).toBeGreaterThanOrEqual(2);
    });
});

describe('rankCandidates', () => {
    it('returns candidates sorted by score descending', () => {
        const candidates = [ref('a'), ref('b'), ref('c')];
        const context = emptyContext({
            fsrsDue: [{ nodeId: 'b', dueAt: '2026-04-20T11:00:00.000Z' }],
            recentEndorsements: [{ nodeId: 'c', receivedAt: NOW }],
        });

        const ranked = rankCandidates(candidates, context, DEFAULT_RANKING_WEIGHTS);

        expect(ranked.map(r => r.node.nodeId)).toEqual(['b', 'c', 'a']);
    });

    it('is stable — ties keep input order', () => {
        const candidates = [ref('a'), ref('b'), ref('c')];
        const context = emptyContext();

        const ranked = rankCandidates(candidates, context, DEFAULT_RANKING_WEIGHTS);

        expect(ranked.map(r => r.node.nodeId)).toEqual(['a', 'b', 'c']);
    });
});

describe('getNextAction', () => {
    it('returns null when the candidate list is empty', () => {
        expect(getNextAction([], emptyContext(), DEFAULT_RANKING_WEIGHTS)).toBeNull();
    });

    it('still produces a next action when agentSignals is null (graceful degradation)', () => {
        const result = getNextAction(
            [ref('a'), ref('b')],
            emptyContext({ agentSignals: null }),
            DEFAULT_RANKING_WEIGHTS,
        );

        expect(result).not.toBeNull();
        expect(result!.reasons.length).toBeGreaterThan(0);
    });

    it('is deterministic — same input yields byte-identical output', () => {
        const context = emptyContext({
            fsrsDue: [{ nodeId: 'a', dueAt: NOW }],
            stalls: [{ nodeId: 'b', stalledSinceDays: 3 }],
        });

        const a = getNextAction([ref('a'), ref('b'), ref('c')], context, DEFAULT_RANKING_WEIGHTS);
        const b = getNextAction([ref('a'), ref('b'), ref('c')], context, DEFAULT_RANKING_WEIGHTS);

        expect(a).toEqual(b);
    });
});
