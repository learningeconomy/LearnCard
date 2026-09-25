import { KMSClient, GenerateDataKeyCommand } from '@aws-sdk/client-kms';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ read: vi.fn(), init: vi.fn(), keys: [] as string[] }));
vi.mock('@accesslayer/signing-authority/read', () => ({ getSigningAuthorityForDid: mocks.read }));
vi.mock('@learncard/init', () => ({ initLearnCard: mocks.init }));
vi.mock('@learncard/didkit-plugin-node', () => ({ getDidKitPlugin: async () => ({}) }));
vi.mock('@cache/in-memory-lru', async importOriginal => {
    const actual = await importOriginal<typeof import('@cache/in-memory-lru')>();
    return {
        getLRUCache: <T>() => {
            const cache = actual.getLRUCache<T>();
            return {
                ...cache,
                add: (key: string, value: T) => {
                    mocks.keys.push(key);
                    return cache.add(key, value);
                },
            };
        },
    };
});
vi.mock('@environment', async importOriginal => {
    const actual = await importOriginal<typeof import('@environment')>();
    return {
        environment: {
            ...actual.environment,
            SKIP_DIDKIT_NAPI: false,
            SA_SEED_KMS_KEY_ARN:
                'arn:aws:kms:us-east-1:123456789012:key/11111111-1111-1111-1111-111111111111',
        },
    };
});

import { environment } from '@environment';
import { seedEncryption } from './seedEncryption.helpers';
import { getEphemeralLearnCard, getSigningAuthorityLearnCard } from './learnCard.helpers';

const spyOnKms = () => vi.spyOn(KMSClient.prototype, 'send');
let send: ReturnType<typeof spyOnKms>;
beforeEach(() => {
    vi.restoreAllMocks();
    mocks.read.mockReset();
    mocks.init.mockReset().mockImplementation(async options => ({ options }));
    mocks.keys.length = 0;
    send = vi.spyOn(KMSClient.prototype, 'send').mockImplementation(async command => ({
        Plaintext: Buffer.alloc(32, 7),
        KeyId: environment.SA_SEED_KMS_KEY_ARN,
        ...(command instanceof GenerateDataKeyCommand
            ? { CiphertextBlob: Buffer.from('wrapped') }
            : {}),
        $metadata: {},
    }));
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

const authority = async (id: string, ownerDid = 'did:example:owner', seed = 'a'.repeat(64)) => {
    const identity = { _id: id, ownerDid, name: 'main', did: 'did:key:example' };
    return { ...identity, ...(await seedEncryption.encrypt(seed, identity)) };
};

describe('SA signing cache', () => {
    it('makes one KMS call when cold and zero when warm, retaining no seed in cache keys', async () => {
        const sa = await authority('warm');
        mocks.read.mockResolvedValue(sa);
        send.mockClear();
        const first = await getSigningAuthorityLearnCard(sa.ownerDid, sa.name);
        expect(send).toHaveBeenCalledTimes(1);
        expect(await getSigningAuthorityLearnCard(sa.ownerDid, sa.name)).toBe(first);
        expect(send).toHaveBeenCalledTimes(1);
        expect(mocks.read).toHaveBeenCalledTimes(2);
        expect(mocks.keys).toEqual([`${sa.ownerDid}|${sa.name}`]);
        await getEphemeralLearnCard('b'.repeat(64));
        expect(mocks.keys).toEqual([`${sa.ownerDid}|${sa.name}`]);
    });

    it('does not reuse a deleted/recreated authority under the same owner and name', async () => {
        const firstRecord = await authority('old');
        const replacement = await authority('replacement', firstRecord.ownerDid, 'b'.repeat(64));
        mocks.read
            .mockResolvedValueOnce(firstRecord)
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce(replacement);
        send.mockClear();
        const first = await getSigningAuthorityLearnCard(firstRecord.ownerDid, firstRecord.name);
        await expect(
            getSigningAuthorityLearnCard(firstRecord.ownerDid, firstRecord.name)
        ).rejects.toThrow();
        const second = await getSigningAuthorityLearnCard(replacement.ownerDid, replacement.name);
        expect(first).not.toBe(second);
        expect(send).toHaveBeenCalledTimes(2);
    });

    it('does not serve a warm wallet after its envelope is tampered with', async () => {
        const sa = await authority('tamper');
        mocks.read.mockResolvedValue(sa);
        await getSigningAuthorityLearnCard(sa.ownerDid, sa.name);
        const bytes = Buffer.from(sa.encryptedSeed, 'base64');
        bytes[15] = bytes[15]! ^ 1;
        mocks.read.mockResolvedValue({ ...sa, encryptedSeed: bytes.toString('base64') });
        await expect(getSigningAuthorityLearnCard(sa.ownerDid, sa.name)).rejects.toMatchObject({
            category: 'authentication_failed',
        });
    });

    it('keeps did:web initialization behavior and does not cache failed decrypts', async () => {
        const sa = await authority('did-web', 'did:web:issuer.example');
        mocks.read.mockResolvedValue(sa);
        send.mockRejectedValueOnce({ name: 'AccessDeniedException' });
        await expect(getSigningAuthorityLearnCard(sa.ownerDid, sa.name)).rejects.toThrow();
        expect(mocks.keys).toEqual([]);
        await getSigningAuthorityLearnCard(sa.ownerDid, sa.name);
        expect(mocks.init).toHaveBeenLastCalledWith(
            expect.objectContaining({ didWeb: sa.ownerDid })
        );
    });
});
