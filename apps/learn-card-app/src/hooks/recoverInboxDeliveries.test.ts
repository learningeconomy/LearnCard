import { beforeEach, describe, expect, it, vi } from 'vitest';
import { recoverInboxDeliveries, storeInboxDeliveries } from './recoverInboxDeliveries';

vi.mock('learn-card-base', () => ({ getCategoryForCredential: async () => 'Achievement' }));

const vc = { id: 'vc-1', type: ['VerifiableCredential'] };
const delivery = { id: 'inbox-1', credential: vc, expiresAt: '2099-01-01T00:00:00.000Z' };
const records: { id: string; inboxDeliveryId?: string }[] = [];
const wallet = {
    invoke: { recoverInboxCredentials: vi.fn() },
    store: { LearnCloud: { uploadEncrypted: vi.fn() } },
    index: { LearnCloud: { get: vi.fn(), add: vi.fn() } },
};
const recover = () =>
    recoverInboxDeliveries(wallet as unknown as Parameters<typeof recoverInboxDeliveries>[0]);

beforeEach(() => {
    vi.resetAllMocks();
    records.length = 0;
    wallet.invoke.recoverInboxCredentials.mockResolvedValue({
        records: [delivery],
        hasMore: false,
    });
    wallet.store.LearnCloud.uploadEncrypted.mockResolvedValue('encrypted-uri');
    wallet.index.LearnCloud.get.mockImplementation(async query =>
        records.filter(record =>
            Object.entries(query).every(
                ([key, value]) => record[key as keyof typeof record] === value
            )
        )
    );
    wallet.index.LearnCloud.add.mockImplementation(async record => {
        records.push(record);
        return true;
    });
});

describe('inbox delivery recovery', () => {
    it('persists a recovered credential and skips it on the next launch', async () => {
        expect(await recover()).toEqual({ stored: 1, failed: 0 });
        expect(records[0]).toMatchObject({ id: vc.id, inboxDeliveryId: delivery.id });
        expect(await recover()).toEqual({ stored: 0, failed: 0 });
        expect(wallet.store.LearnCloud.uploadEncrypted).toHaveBeenCalledTimes(1);
    });

    it('does not duplicate a claim already saved through the normal claim page', async () => {
        records.push({ id: vc.id });
        expect(await recover()).toEqual({ stored: 0, failed: 0 });
        expect(wallet.store.LearnCloud.uploadEncrypted).not.toHaveBeenCalled();
    });

    it('uses the stable inbox id when the credential has no id', async () => {
        wallet.invoke.recoverInboxCredentials.mockResolvedValue({
            records: [{ ...delivery, credential: { type: ['VerifiableCredential'] } }],
            hasMore: false,
        });
        await recover();
        await recover();
        expect(records).toHaveLength(1);
        expect(records[0].id).toBe('inbox:inbox-1');
    });

    it.each(['upload', 'index'])(
        'retries a failed %s without creating another indexed credential',
        async failure => {
            if (failure === 'upload')
                wallet.store.LearnCloud.uploadEncrypted.mockRejectedValueOnce(new Error('offline'));
            else wallet.index.LearnCloud.add.mockResolvedValueOnce(false);
            expect(await recover()).toEqual({ stored: 0, failed: 1 });
            expect(await recover()).toEqual({ stored: 1, failed: 0 });
            expect(await recover()).toEqual({ stored: 0, failed: 0 });
            expect(records).toHaveLength(1);
        }
    );

    it('continues across pages after an individual save fails', async () => {
        wallet.invoke.recoverInboxCredentials
            .mockResolvedValueOnce({ records: [delivery], hasMore: true, cursor: 'inbox-1' })
            .mockResolvedValueOnce({
                records: [{ ...delivery, id: 'inbox-2', credential: { ...vc, id: 'vc-2' } }],
                hasMore: false,
            });
        wallet.store.LearnCloud.uploadEncrypted.mockRejectedValueOnce(new Error('offline'));
        expect(await recover()).toEqual({ stored: 1, failed: 1 });
        expect(wallet.invoke.recoverInboxCredentials).toHaveBeenLastCalledWith({
            limit: 100,
            cursor: 'inbox-1',
        });
    });
});

it('saves a good delivery while counting an SDK decrypt failure on the same page', async () => {
    wallet.invoke.recoverInboxCredentials.mockResolvedValue({
        records: [delivery],
        failed: 1,
        hasMore: false,
    });
    expect(await recover()).toEqual({ stored: 1, failed: 1 });
    expect(records).toHaveLength(1);
});

it('does not duplicate an id-less credential saved by the claim page', async () => {
    records.push({ id: 'inbox:inbox-1', inboxDeliveryId: 'inbox-1' });
    wallet.invoke.recoverInboxCredentials.mockResolvedValue({
        records: [{ ...delivery, credential: { type: ['VerifiableCredential'] } }],
        failed: 0,
        hasMore: false,
    });
    expect(await recover()).toEqual({ stored: 0, failed: 0 });
    expect(wallet.store.LearnCloud.uploadEncrypted).not.toHaveBeenCalled();
});

it('continues to the next page when every delivery on the first page failed decryption', async () => {
    wallet.invoke.recoverInboxCredentials
        .mockResolvedValueOnce({ records: [], failed: 1, hasMore: true, cursor: 'bad-delivery' })
        .mockResolvedValueOnce({ records: [delivery], failed: 0, hasMore: false });
    expect(await recover()).toEqual({ stored: 1, failed: 1 });
    expect(wallet.invoke.recoverInboxCredentials).toHaveBeenLastCalledWith({
        limit: 100,
        cursor: 'bad-delivery',
    });
});

it('deduplicates an id-less finalize response against the recovery backstop', async () => {
    const finalized = {
        ...delivery,
        credential: {
            '@context': ['https://www.w3.org/ns/credentials/v2'],
            type: ['VerifiableCredential'],
            issuer: 'did:key:issuer',
            credentialSubject: {},
            proof: {
                type: 'Ed25519Signature2020',
                created: '2026-09-14T00:00:00.000Z',
                proofPurpose: 'assertionMethod',
                verificationMethod: 'did:key:issuer#key',
            },
        },
    };
    wallet.invoke.recoverInboxCredentials.mockResolvedValue({
        records: [finalized],
        hasMore: false,
    });
    const onStored = vi.fn();
    expect(
        await storeInboxDeliveries(
            wallet as unknown as Parameters<typeof storeInboxDeliveries>[0],
            [finalized],
            onStored
        )
    ).toEqual({ stored: 1, failed: 0 });
    expect(await recover()).toEqual({ stored: 0, failed: 0 });
    expect(records).toEqual([
        expect.objectContaining({ id: 'inbox:inbox-1', inboxDeliveryId: 'inbox-1' }),
    ]);
    expect(wallet.store.LearnCloud.uploadEncrypted).toHaveBeenCalledOnce();
    expect(onStored).toHaveBeenCalledOnce();
});
