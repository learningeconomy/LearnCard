import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { DeliveryRecord } from 'types/readable-delivery';

const mocks = vi.hoisted(() => ({ run: vi.fn(), write: vi.fn() }));
vi.mock('@instance', () => ({ neogma: { queryRunner: { run: mocks.run } } }));
vi.mock('@models', () => ({ ConsentFlowContract: {}, Profile: {} }));
import { createDeliveryRecipient } from './readable-delivery';

const record: DeliveryRecord = {
    profileId: 'organization',
    domain: 'network.example',
    ownerProfileId: 'owner',
    provisionId: 'provision',
    version: 1,
    agentProfileId: 'agent',
    agentDid: 'did:key:agent',
    displayName: 'Organization',
    enabled: true,
    disclosureVersion: '1',
    provider: 'local-v1',
    ciphertext: 'synthetic-envelope',
};
const deadlock = Object.assign(new Error('Rolled back'), {
    code: 'Neo.TransientError.Transaction.DeadlockDetected',
});
beforeEach(() => {
    vi.resetAllMocks();
    vi.useFakeTimers();
    mocks.run.mockImplementation(async (query, params) =>
        query.startsWith('CREATE CONSTRAINT') ? { records: [] } : mocks.write(query, params)
    );
});
afterEach(() => vi.useRealTimers());

describe('readable recipient write retries', () => {
    it('retries the atomic provisioning write after a deadlock with the same identities and key', async () => {
        let attempts = 0;
        mocks.write.mockImplementation(async () => {
            if (attempts++ === 0) throw deadlock;
            return { records: [{}] };
        });
        const pending = createDeliveryRecipient(record, 'did:key:recipient', true);
        await vi.runAllTimersAsync();
        await pending;
        const writes = mocks.write.mock.calls;
        expect(writes).toHaveLength(2);
        expect(writes[1]?.[0]).toBe(writes[0]?.[0]);
        for (const [, params] of writes) {
            expect(params).toMatchObject({ ...record, record, recipientDid: 'did:key:recipient' });
        }
    });
    it('bounds retries when contention persists', async () => {
        mocks.write.mockRejectedValue(deadlock);
        const rejection = expect(createDeliveryRecipient(record, 'unused', true)).rejects.toBe(
            deadlock
        );
        await vi.runAllTimersAsync();
        await rejection;
        expect(mocks.write).toHaveBeenCalledTimes(9);
    });
    it('does not retry errors that could have happened after commit', async () => {
        const error = new Error('Connection lost');
        mocks.write.mockRejectedValue(error);
        await expect(createDeliveryRecipient(record, 'unused', true)).rejects.toBe(error);
        expect(mocks.write).toHaveBeenCalledOnce();
    });
    it('does not retry an authorization or previous-consent conflict', async () => {
        mocks.write.mockResolvedValue({ records: [] });
        await expect(createDeliveryRecipient(record, 'unused', true)).rejects.toMatchObject({
            code: 'CONFLICT',
        });
        expect(mocks.write).toHaveBeenCalledOnce();
    });
});
