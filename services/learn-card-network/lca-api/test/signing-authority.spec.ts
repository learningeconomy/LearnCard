import { vi } from 'vitest';

import { getClient, getUser } from './helpers/getClient';
import { SigningAuthorities } from '@accesslayer/signing-authority';
import { createSigningAuthorityForDID } from '@accesslayer/signing-authority/create';

/**
 * More info on Signing Authorities:
 * https://docs.learncard.com/core-concepts/identities-and-keys/signing-authorities
 **/

import { client } from '@mongo';

const noAuthClient = getClient();
let userA: Awaited<ReturnType<typeof getUser>>;

beforeAll(async () => {
    try {
        await client.connect();
    } catch (error) {
        console.error(error);
    }
});

afterAll(async () => {
    try {
        await client.close();
    } catch (error) {
        console.error(error);
    }
});

describe('Signing Authority', () => {
    beforeAll(async () => {
        userA = await getUser();
    });

    beforeEach(async () => {
        await SigningAuthorities.deleteMany({});
    });

    it('should require full auth to create a signing authority', async () => {
        await expect(
            noAuthClient.signingAuthority.createSigningAuthority({
                name: 'mysa',
            })
        ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        await expect(
            userA.clients.partialAuth.signingAuthority.createSigningAuthority({
                name: 'mysa',
            })
        ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
    });

    it('should return a complete signing authority after creation', async () => {
        const signingAuthority =
            await userA.clients.fullAuth.signingAuthority.createSigningAuthority({
                name: 'mysa',
            });

        expect(signingAuthority).toMatchObject({
            name: 'mysa',
            ownerDid: userA.learnCard.id.did(),
            did: expect.stringMatching(/^did:/),
            endpoint: expect.stringContaining('/api'),
        });
        const stored = await SigningAuthorities.findOne({ _id: signingAuthority._id });
        expect(stored).not.toHaveProperty('seed');
        expect(stored).toMatchObject({
            encryptedSeed: expect.any(String),
            encryptedDek: expect.any(String),
            keyVersion: 'local-v1',
        });
        for (const field of ['seed', 'encryptedSeed', 'encryptedDek', 'keyVersion']) {
            expect(signingAuthority).not.toHaveProperty(field);
        }
    });

    it('should prevent creating a signing authority with the same name', async () => {
        await expect(
            userA.clients.fullAuth.signingAuthority.createSigningAuthority({ name: 'mysa' })
        ).resolves.not.toThrow();

        await expect(
            userA.clients.fullAuth.signingAuthority.createSigningAuthority({ name: 'mysa' })
        ).rejects.toThrow();
    });

    it('logs the Mongo code for a duplicate insert without exposing keys or duplicate values', async () => {
        await SigningAuthorities.createIndex({ ownerDid: 1, name: 1 }, { unique: true });
        const logger = vi.spyOn(console, 'error').mockImplementation(() => undefined);
        const name = 'private-duplicate-name';
        const owner = userA.learnCard.id.did();
        try {
            expect(await createSigningAuthorityForDID(owner, name)).toEqual(expect.any(String));
            expect(await createSigningAuthorityForDID(owner, name)).toBe(false);
            expect(logger).toHaveBeenCalledWith(
                expect.objectContaining({
                    operation: 'create',
                    errorName: 'MongoServerError',
                    mongoCode: 11000,
                })
            );
            const logs = JSON.stringify(logger.mock.calls);
            expect(logs).not.toContain('e'.repeat(64));
            expect(logs).not.toContain(name);
            expect(logs).not.toContain(owner);
        } finally {
            logger.mockRestore();
        }
    });

    it('should allow you to retrieve your signing authorities after creation', async () => {
        await userA.clients.fullAuth.signingAuthority.createSigningAuthority({ name: 'mysa' });
        const sas = await userA.clients.fullAuth.signingAuthority.signingAuthorities();
        for (const authority of sas) {
            for (const field of ['seed', 'encryptedSeed', 'encryptedDek', 'keyVersion']) {
                expect(authority).not.toHaveProperty(field);
            }
        }
        if (sas && sas[0]) {
            expect(sas[0].name).toBe('mysa');
            expect(sas[0].ownerDid).toBe(userA.learnCard.id.did());
        } else {
            expect(sas[0]).toBeDefined();
        }
    });

    it('should warn and ignore legacy signing authorities without a DID', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

        try {
            await SigningAuthorities.insertOne({
                ownerDid: userA.learnCard.id.did(),
                name: 'legacy',
                seed: 'legacy-seed',
            });

            await expect(
                userA.clients.fullAuth.signingAuthority.signingAuthorities()
            ).resolves.toEqual([]);
            expect(warn).toHaveBeenCalledWith(
                '[LCA signing-authority/get] Ignoring legacy records without a DID',
                {
                    ownerDid: userA.learnCard.id.did(),
                    count: 1,
                }
            );
        } finally {
            warn.mockRestore();
        }
    });

    it('should allow you to authorize your signing authority to issue a boost', async () => {
        await userA.clients.fullAuth.signingAuthority.createSigningAuthority({ name: 'mysa' });
        await expect(
            userA.clients.fullAuth.signingAuthority.authorizeSigningAuthority({
                name: 'mysa',
                authorization: { type: 'BOOST', boostUri: 'boost:uri' },
            })
        ).resolves.not.toThrow();
    });
});
