import { describe, expect, it } from 'vitest';

import type { Capability } from '../types';

import {
    buildCostSnapshot,
    computeBudgetState,
    dailyInvocationsFor,
    monthToDateByCapability,
    monthToDateCents,
    recordInvocation,
    type InvocationEvent,
} from './costAccounting';

const event = (
    at: string,
    capability: Capability,
    costCents: number,
): InvocationEvent => ({ capability, costCents, at });

describe('monthToDateCents', () => {
    it('sums only events in the current UTC month', () => {
        const history = [
            event('2026-04-01T00:00:00.000Z', 'planning', 10),
            event('2026-04-15T12:00:00.000Z', 'interpretation', 2),
            event('2026-03-31T23:59:59.999Z', 'planning', 100), // previous month
            event('2026-05-01T00:00:00.000Z', 'planning', 50), // next month
        ];

        expect(monthToDateCents(history, '2026-04-20T00:00:00.000Z')).toBe(12);
    });

    it('returns 0 when the history is empty', () => {
        expect(monthToDateCents([], '2026-04-20T00:00:00.000Z')).toBe(0);
    });
});

describe('monthToDateByCapability', () => {
    it('breaks spend out by capability for the current month only', () => {
        const history = [
            event('2026-04-01T00:00:00.000Z', 'planning', 10),
            event('2026-04-10T00:00:00.000Z', 'interpretation', 2),
            event('2026-04-15T00:00:00.000Z', 'interpretation', 2),
            event('2026-03-01T00:00:00.000Z', 'planning', 999), // filtered
        ];

        const result = monthToDateByCapability(history, '2026-04-20T00:00:00.000Z');

        expect(result).toEqual({
            planning: 10,
            interpretation: 4,
            nudging: 0,
            routing: 0,
            matching: 0,
        });
    });
});

describe('dailyInvocationsFor', () => {
    it('counts invocations of the given capability in the last 24 hours', () => {
        const history = [
            event('2026-04-19T20:00:00.000Z', 'nudging', 1), // 16h ago — in window
            event('2026-04-18T11:00:00.000Z', 'nudging', 1), // 25h ago — out
            event('2026-04-20T08:00:00.000Z', 'planning', 1), // different capability
        ];

        expect(dailyInvocationsFor(history, 'nudging', '2026-04-20T12:00:00.000Z')).toBe(1);
    });
});

describe('recordInvocation', () => {
    it('appends the event and leaves recent history intact', () => {
        const prior: InvocationEvent[] = [
            event('2026-04-01T00:00:00.000Z', 'planning', 5),
        ];

        const next = recordInvocation(prior, event('2026-04-20T00:00:00.000Z', 'interpretation', 1));

        expect(next).toHaveLength(2);
        expect(next[1].capability).toBe('interpretation');
    });

    it('prunes events older than ~two months', () => {
        const prior: InvocationEvent[] = [
            event('2025-12-01T00:00:00.000Z', 'planning', 999), // way old
            event('2026-04-01T00:00:00.000Z', 'planning', 5),
        ];

        const next = recordInvocation(prior, event('2026-04-20T00:00:00.000Z', 'interpretation', 1));

        expect(next.map(e => e.capability)).toEqual(['planning', 'interpretation']);
    });
});

describe('computeBudgetState', () => {
    it('assembles the exact shape decideBudget needs', () => {
        const history: InvocationEvent[] = [
            event('2026-04-19T20:00:00.000Z', 'nudging', 1),
            event('2026-04-10T00:00:00.000Z', 'planning', 10),
        ];

        const state = computeBudgetState({
            history,
            capability: 'nudging',
            projectedCostCents: 1,
            tenantMonthToDateCents: 42,
            now: '2026-04-20T12:00:00.000Z',
        });

        expect(state).toEqual({
            capability: 'nudging',
            projectedCostCents: 1,
            dailyInvocations: 1,
            learnerMonthToDateCents: 11,
            tenantMonthToDateCents: 42,
        });
    });

    it('defaults tenant spend to 0 when not provided', () => {
        const state = computeBudgetState({
            history: [],
            capability: 'planning',
            projectedCostCents: 1,
            now: '2026-04-20T12:00:00.000Z',
        });

        expect(state.tenantMonthToDateCents).toBe(0);
    });
});

describe('buildCostSnapshot', () => {
    it('matches the payload shape consumed by pathways.learnerCost.snapshot', () => {
        const history: InvocationEvent[] = [
            event('2026-04-01T00:00:00.000Z', 'planning', 10),
            event('2026-04-15T00:00:00.000Z', 'interpretation', 2),
        ];

        const snapshot = buildCostSnapshot(
            history,
            'did:key:zlearner',
            '2026-04-20T12:00:00.000Z',
        );

        expect(snapshot).toEqual({
            learnerDid: 'did:key:zlearner',
            monthToDateCents: 12,
            byCapability: {
                planning: 10,
                interpretation: 2,
                nudging: 0,
                routing: 0,
                matching: 0,
            },
        });
    });
});
