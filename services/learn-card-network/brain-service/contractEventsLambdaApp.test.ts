import type { Context } from 'aws-lambda';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { dispatchContractEvents, runIntegrationEventPass, deliverContractRequestInvites } =
    vi.hoisted(() => ({
        dispatchContractEvents: vi.fn(),
        runIntegrationEventPass: vi.fn(),
        deliverContractRequestInvites: vi.fn(),
    }));

vi.mock('./src/helpers/contract-events.helpers', () => ({ dispatchContractEvents }));
vi.mock('./src/helpers/integration-events.helpers', () => ({ runIntegrationEventPass }));
vi.mock('./src/helpers/contract-request-invites.helpers', () => ({
    deliverContractRequestInvites,
}));

import { contractEventsHandler } from './contractEventsLambdaApp';

const summary = { delivered: 1, pending: 0, skipped: 0, rejected: 0, failed: 0 };
const contextWith = (remainingMs: number): Context =>
    ({ getRemainingTimeInMillis: () => remainingMs }) as Context;

describe('contractEventsHandler', () => {
    beforeEach(() => {
        dispatchContractEvents.mockReset().mockResolvedValue(summary);
        runIntegrationEventPass.mockReset().mockResolvedValue({ events: 0, records: 0 });
        deliverContractRequestInvites.mockReset().mockResolvedValue(0);
        vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    });

    afterEach(() => vi.restoreAllMocks());

    it('runs the integration pass first with a third of the budget, capped at 15 seconds', async () => {
        const order: string[] = [];
        runIntegrationEventPass.mockImplementation(async () => {
            order.push('integration');
            return { events: 0, records: 0 };
        });
        dispatchContractEvents.mockImplementation(async () => {
            order.push('profile');
            return summary;
        });

        // 58s remaining -> 45s budget (capped) -> integration pass gets min(15s, 15s).
        await expect(contractEventsHandler({}, contextWith(58_000))).resolves.toEqual(summary);

        expect(order).toEqual(['integration', 'profile']);
        expect(runIntegrationEventPass).toHaveBeenCalledExactlyOnceWith({
            limit: 100,
            budgetMs: 15_000,
        });

        const profileCall = dispatchContractEvents.mock.calls[0]?.[0];
        expect(profileCall.limit).toBe(100);
        expect(profileCall.budgetMs).toBeGreaterThan(44_000);
        expect(profileCall.budgetMs).toBeLessThanOrEqual(45_000);
    });

    it('scales the integration budget down on a short invocation', async () => {
        // 20s remaining -> 12s budget -> integration pass gets 4s.
        await contractEventsHandler({}, contextWith(20_000));

        expect(runIntegrationEventPass).toHaveBeenCalledExactlyOnceWith({
            limit: 100,
            budgetMs: 4_000,
        });
    });

    it('never passes a negative budget', async () => {
        await contractEventsHandler({}, contextWith(1_000));

        expect(runIntegrationEventPass).toHaveBeenCalledExactlyOnceWith({
            limit: 100,
            budgetMs: 0,
        });
        expect(dispatchContractEvents).toHaveBeenCalledExactlyOnceWith({ limit: 100, budgetMs: 0 });
    });

    it('still dispatches profile notifications when the integration pass fails', async () => {
        runIntegrationEventPass.mockRejectedValue(new Error('database unavailable'));

        await expect(contractEventsHandler({}, contextWith(58_000))).resolves.toEqual(summary);

        expect(dispatchContractEvents).toHaveBeenCalledOnce();
        expect(console.warn).toHaveBeenCalledWith('integration_events: pass_failed');
    });

    it('ignores scheduler input and works without a context', async () => {
        await expect(contractEventsHandler({ limit: 1, eventId: 'injected' })).resolves.toEqual(
            summary
        );

        // No context -> 50s assumed -> 42s budget -> integration pass gets 14s.
        expect(runIntegrationEventPass).toHaveBeenCalledExactlyOnceWith({
            limit: 100,
            budgetMs: 14_000,
        });
    });

    it('delivers email invites between the integration pass and dispatch, and survives a failure', async () => {
        const order: string[] = [];
        runIntegrationEventPass.mockImplementation(async () => {
            order.push('integration');
            return { events: 0, records: 0 };
        });
        deliverContractRequestInvites.mockImplementation(async () => {
            order.push('invites');
            throw new Error('synthetic');
        });
        dispatchContractEvents.mockImplementation(async () => {
            order.push('dispatch');
            return summary;
        });
        await contractEventsHandler({}, contextWith(60_000));
        expect(order).toEqual(['integration', 'invites', 'dispatch']);
        expect(deliverContractRequestInvites).toHaveBeenCalledWith({ limit: 50, budgetMs: 10_000 });
    });
});
