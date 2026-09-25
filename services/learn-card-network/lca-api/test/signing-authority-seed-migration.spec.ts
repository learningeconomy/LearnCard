import { ObjectId } from 'mongodb';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { client, mongodb } from '@mongo';
import { SIGNING_AUTHORITIES_COLLECTION } from '@models';
import {
    seedEncryption,
    getSeedIdentity,
    SeedEncryptionError,
} from '@helpers/seedEncryption.helpers';
import {
    countSeedMigrationDocuments,
    runSeedMigrationBatch,
    SEED_MIGRATION_STATE_COLLECTION,
    SEED_MIGRATION_RECEIPTS_COLLECTION,
} from '../src/migrations/signingAuthoritySeeds';
import type { MigrationSigningAuthority, SeedMigrationPhase } from '../src/types/seed-migration';

const authorities = mongodb.collection<MigrationSigningAuthority>(SIGNING_AUTHORITIES_COLLECTION);
const seed = 'a'.repeat(64);
const legacy = (id: string | ObjectId = 'legacy'): MigrationSigningAuthority => ({
    _id: id,
    ownerDid: 'did:example:owner',
    name: String(id),
    did: 'did:key:example',
    seed,
});
const batch = (phase: SeedMigrationPhase) =>
    runSeedMigrationBatch(
        mongodb,
        { phase, batchSize: 1 },
        {
            encryptedWritesEnabled: true,
        }
    );
const finish = async (phase: SeedMigrationPhase): Promise<void> => {
    for (let attempts = 0; attempts < 20; attempts += 1) {
        if ((await batch(phase)).done) return;
    }
    throw new Error('Migration did not finish');
};
const insertEncrypted = async (id: string): Promise<void> => {
    const { seed: original, ...identity } = legacy(id);
    await authorities.insertOne({
        ...identity,
        ...(await seedEncryption.encrypt(original!, getSeedIdentity(identity))),
    });
};

beforeAll(async () => {
    await client.connect();
});
afterAll(async () => {
    await client.close();
});
beforeEach(async () => {
    await authorities.deleteMany({});
    await mongodb.collection(SEED_MIGRATION_STATE_COLLECTION).deleteMany({});
    await mongodb.collection(SEED_MIGRATION_RECEIPTS_COLLECTION).deleteMany({});
    vi.spyOn(console, 'info').mockImplementation(() => undefined);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
});
afterEach(() => vi.restoreAllMocks());

describe('signing-authority seed migration', () => {
    it('dry-runs without writes and rejects migration while plaintext writers are enabled', async () => {
        await authorities.insertOne(legacy());
        expect(await batch('dry-run')).toMatchObject({
            done: true,
            counts: { total: 1, legacyOnly: 1 },
        });
        expect(await mongodb.collection(SEED_MIGRATION_STATE_COLLECTION).countDocuments()).toBe(0);
        await expect(
            runSeedMigrationBatch(mongodb, { phase: 'prepare' }, { encryptedWritesEnabled: false })
        ).rejects.toMatchObject({ category: 'encrypted_writes_required' });
        expect(await authorities.findOne({ _id: 'legacy' })).toEqual(legacy());
    });

    it('migrates mixed rows idempotently, preserves BSON IDs/metadata, and removes plaintext only after verification', async () => {
        const id = new ObjectId();
        const missingDid = legacy(id);
        delete missingDid.did;
        await authorities.insertMany([
            legacy(),
            { ...missingDid, endpoint: 'https://example.com' },
        ]);
        await insertEncrypted('new');
        await finish('prepare');
        const prepared = await authorities.find().toArray();
        expect(await countSeedMigrationDocuments(mongodb)).toEqual({
            total: 3,
            encrypted: 3,
            legacyOnly: 0,
            malformed: 0,
            plaintextRemaining: 2,
        });
        await finish('prepare');
        expect(await authorities.find().toArray()).toEqual(prepared);
        await expect(batch('purge')).rejects.toMatchObject({ category: 'verification_required' });
        expect(await authorities.countDocuments({ seed: { $exists: true } })).toBe(2);
        await finish('verify');
        const checkpoint = await mongodb.collection(SEED_MIGRATION_STATE_COLLECTION).findOne({});
        expect(checkpoint?.counts.encrypted).toBe(checkpoint?.counts.total);
        const receipts = await mongodb
            .collection(SEED_MIGRATION_RECEIPTS_COLLECTION)
            .find()
            .toArray();
        expect(JSON.stringify(receipts)).not.toContain(seed);
        expect((await batch('purge')).done).toBe(false);
        await finish('purge');
        await finish('purge');
        expect(await authorities.countDocuments({ seed: { $exists: true } })).toBe(0);
        expect(await authorities.findOne({ _id: id })).toMatchObject({
            _id: id,
            endpoint: 'https://example.com',
        });
        for (const row of await authorities.find().toArray()) {
            expect(Object.hasOwn(row, 'seed')).toBe(false);
            expect(row.keyVersion).toBe('local-v1');
            expect(
                await seedEncryption.decrypt(
                    {
                        encryptedSeed: row.encryptedSeed,
                        encryptedDek: row.encryptedDek,
                        keyVersion: row.keyVersion,
                    },
                    getSeedIdentity(row)
                )
            ).toBe(seed);
        }
        expect(JSON.stringify(vi.mocked(console.info).mock.calls)).not.toContain(seed);
    });

    it('recovers when a batch stops after persisting ciphertext but before readback verification', async () => {
        await authorities.insertOne(legacy());
        vi.spyOn(seedEncryption, 'decrypt').mockRejectedValueOnce(
            new SeedEncryptionError('kms_unavailable')
        );
        await expect(batch('prepare')).rejects.toMatchObject({ category: 'kms_unavailable' });
        expect(await authorities.findOne({ _id: 'legacy' })).toMatchObject({
            seed,
            keyVersion: 'local-v1',
        });
        await finish('prepare');
        await finish('verify');
        await finish('purge');
        expect(await authorities.countDocuments({ seed: { $exists: true } })).toBe(0);
    });

    it('blocks deletion when verification detects a seed mismatch or malformed envelope', async () => {
        await authorities.insertOne(legacy());
        await finish('prepare');
        await authorities.updateOne({ _id: 'legacy' }, { $set: { seed: 'b'.repeat(64) } });
        await expect(batch('verify')).rejects.toMatchObject({ category: 'seed_mismatch' });
        await expect(batch('purge')).rejects.toMatchObject({ category: 'verification_required' });
        await authorities.updateOne({ _id: 'legacy' }, { $set: { keyVersion: 'unknown' } });
        await expect(batch('verify')).rejects.toMatchObject({ category: 'malformed_records' });
        expect(await authorities.countDocuments({ seed: { $exists: true } })).toBe(1);
    });

    it('requires reverification after a verified envelope changes', async () => {
        const original = legacy();
        await authorities.insertOne(original);
        await finish('prepare');
        await finish('verify');
        const replacement = await seedEncryption.encrypt(seed, getSeedIdentity(original));
        await authorities.updateOne({ _id: original._id }, { $set: replacement });
        await expect(batch('purge')).rejects.toMatchObject({ category: 'reverification_required' });
        expect(await authorities.countDocuments({ seed: { $exists: true } })).toBe(1);
        await finish('verify');
        await finish('purge');
        expect(await authorities.countDocuments({ seed: { $exists: true } })).toBe(0);
    });

    it('verifies concurrent encrypted inserts and resumes verification without skipping records', async () => {
        await authorities.insertMany([legacy('one'), legacy('two')]);
        await finish('prepare');
        expect((await batch('verify')).done).toBe(false);
        await insertEncrypted('inserted-before-cursor');
        await finish('verify');
        expect(await mongodb.collection(SEED_MIGRATION_RECEIPTS_COLLECTION).countDocuments()).toBe(
            3
        );
        await insertEncrypted('created-after-verification');
        await finish('purge');
        expect(await countSeedMigrationDocuments(mongodb)).toMatchObject({
            total: 4,
            encrypted: 4,
            plaintextRemaining: 0,
        });
    });

    it('does not unset a seed when the row changes between decryption and the conditional write', async () => {
        await authorities.insertOne(legacy());
        await finish('prepare');
        await finish('verify');
        const decrypt = seedEncryption.decrypt;
        vi.spyOn(seedEncryption, 'decrypt').mockImplementationOnce(async (...args) => {
            const result = await decrypt(...args);
            await authorities.updateOne(
                { _id: 'legacy' },
                { $set: { name: 'changed-concurrently' } }
            );
            return result;
        });
        await expect(batch('purge')).rejects.toMatchObject({ category: 'document_changed' });
        expect(await authorities.countDocuments({ seed: { $exists: true } })).toBe(1);
        expect(
            await mongodb.collection(SEED_MIGRATION_STATE_COLLECTION).findOne({})
        ).not.toHaveProperty('verifiedEpoch');
    });

    it('excludes competing workers and recovers an expired lease', async () => {
        await authorities.insertOne(legacy());
        await batch('prepare');
        await mongodb.collection(SEED_MIGRATION_STATE_COLLECTION).updateMany(
            {},
            {
                $set: { leaseOwner: 'other-worker', leaseExpiresAt: new Date(Date.now() + 60_000) },
            }
        );
        await expect(batch('verify')).rejects.toMatchObject({ category: 'worker_busy' });
        await mongodb.collection(SEED_MIGRATION_STATE_COLLECTION).updateMany(
            {},
            {
                $set: { leaseExpiresAt: new Date(0) },
            }
        );
        await finish('verify');
        await finish('purge');
    });
});
