import { describe, expect, it } from 'vitest';

import {
    CAPABILITY_BUDGETS,
    LEARNER_MONTHLY_CAP_CENTS,
    TENANT_MONTHLY_CAP_CENTS,
    decideBudget,
    type BudgetState,
} from './budgets';

const base: BudgetState = {
    capability: 'interpretation',
    projectedCostCents: 1,
    dailyInvocations: 0,
    learnerMonthToDateCents: 0,
    tenantMonthToDateCents: 0,
};

describe('decideBudget', () => {
    it('allows a cheap invocation well inside every cap', () => {
        expect(decideBudget(base)).toEqual({ allowed: true });
    });

    it('refuses a single call whose estimate exceeds the per-invocation ceiling', () => {
        const decision = decideBudget({
            ...base,
            projectedCostCents: CAPABILITY_BUDGETS.interpretation.perInvocationCents + 1,
        });

        expect(decision).toMatchObject({ allowed: false, cappedAt: 'per-invocation' });
    });

    it('refuses once the daily invocation count is exhausted', () => {
        const decision = decideBudget({
            ...base,
            dailyInvocations: CAPABILITY_BUDGETS.interpretation.maxDailyInvocations,
        });

        expect(decision).toMatchObject({ allowed: false, cappedAt: 'per-learner-daily' });
    });

    it('refuses when this invocation would push the learner over the monthly cap', () => {
        const decision = decideBudget({
            ...base,
            projectedCostCents: 2,
            learnerMonthToDateCents: LEARNER_MONTHLY_CAP_CENTS - 1,
        });

        expect(decision).toMatchObject({ allowed: false, cappedAt: 'per-learner-monthly' });
    });

    it('refuses when this invocation would push the tenant over the monthly cap', () => {
        const decision = decideBudget({
            ...base,
            projectedCostCents: 2,
            tenantMonthToDateCents: TENANT_MONTHLY_CAP_CENTS - 1,
        });

        expect(decision).toMatchObject({ allowed: false, cappedAt: 'per-tenant-monthly' });
    });

    it('prefers the cheapest-to-evaluate cap when multiple would block', () => {
        // Both per-invocation AND per-learner-monthly would block.
        // per-invocation is checked first → wins.
        const decision = decideBudget({
            ...base,
            projectedCostCents: CAPABILITY_BUDGETS.interpretation.perInvocationCents + 100,
            learnerMonthToDateCents: LEARNER_MONTHLY_CAP_CENTS,
        });

        expect(decision).toMatchObject({ allowed: false, cappedAt: 'per-invocation' });
    });

    it('covers every capability with a budget entry', () => {
        const expected: Array<keyof typeof CAPABILITY_BUDGETS> = [
            'planning',
            'interpretation',
            'nudging',
            'routing',
            'matching',
        ];

        for (const capability of expected) {
            expect(CAPABILITY_BUDGETS[capability].perInvocationCents).toBeGreaterThan(0);
            expect(CAPABILITY_BUDGETS[capability].maxDailyInvocations).toBeGreaterThan(0);
        }
    });
});
