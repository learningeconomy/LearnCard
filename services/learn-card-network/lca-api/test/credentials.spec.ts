import { getClient, getUser } from './helpers/getClient';
import { SigningAuthorities } from '@accesslayer/signing-authority';
import { MongoSigningAuthorityType } from '@models';

import { client } from '@mongo';

const noAuthClient = getClient();
let userA: Awaited<ReturnType<typeof getUser>>;
let signingAuthority: MongoSigningAuthorityType;

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

describe('Credentials', () => {
    beforeAll(async () => {
        userA = await getUser();
    });

    beforeEach(async () => {
        await SigningAuthorities.deleteMany({});
        signingAuthority = await userA.clients.fullAuth.signingAuthority.createSigningAuthority({
            name: 'mysa',
        });
    });

    it('should require an authorized service to issue a credential', async () => {
        await expect(
            noAuthClient.credentials.issueCredential({
                credential: userA.learnCard.invoke.newCredential(),
                signingAuthority: {
                    name: signingAuthority.name,
                    ownerDid: signingAuthority.ownerDid,
                    did: signingAuthority.did,
                },
            })
        ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });

        await expect(
            userA.clients.partialAuth.credentials.issueCredential({
                credential: userA.learnCard.invoke.newCredential(),
                signingAuthority: {
                    name: signingAuthority.name,
                    ownerDid: signingAuthority.ownerDid,
                    did: signingAuthority.did,
                },
            })
        ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
    });

    it('should allow can authorized service to issue a credential with a signing authority', async () => {
        await expect(
            userA.clients.authorizedDidAuth.credentials.issueCredential({
                credential: userA.learnCard.invoke.newCredential(),
                signingAuthority: {
                    name: signingAuthority.name,
                    ownerDid: signingAuthority.ownerDid,
                    did: signingAuthority.did,
                },
            })
        ).resolves.not.toThrow();
    });

    it('should return a valid, signed VC from the signing authority', async () => {
        const credential = userA.learnCard.invoke.newCredential();
        const signedVc = await userA.clients.authorizedDidAuth.credentials.issueCredential({
            credential,
            signingAuthority: {
                name: signingAuthority.name,
                ownerDid: signingAuthority.ownerDid,
                did: signingAuthority.did,
            },
        });

        const { proof, ...everythingElse } = signedVc;

        expect(everythingElse).toEqual(
            expect.objectContaining({
                issuer: signingAuthority.did,
                credentialSubject: credential.credentialSubject,
                type: credential.type,
                '@context': expect.arrayContaining(['https://www.w3.org/ns/credentials/v2']),
            })
        );
        expect(proof).toBeDefined();
    });

    it('rejects an unresolvable encryption recipient as BAD_REQUEST', async () => {
        await expect(
            userA.clients.authorizedDidAuth.credentials.issueCredential({
                credential: userA.learnCard.invoke.newCredential(),
                signingAuthority: {
                    name: signingAuthority.name,
                    ownerDid: signingAuthority.ownerDid,
                    did: signingAuthority.did,
                },
                encryption: { recipients: ['did:example:no-key-agreement'] },
            })
        ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    });

    it('encrypts for both subject and owner while excluding an unrelated server key', async () => {
        const student = await getUser('b'.repeat(64));
        const server = await getUser('c'.repeat(64));
        const credential = userA.learnCard.invoke.newCredential();
        credential.credentialSubject = { id: student.learnCard.id.did() };
        const stored = await userA.clients.authorizedDidAuth.credentials.issueCredential({
            credential,
            signingAuthority: {
                name: signingAuthority.name,
                ownerDid: signingAuthority.ownerDid,
                did: signingAuthority.did,
            },
            encryption: { recipients: [student.learnCard.id.did(), userA.learnCard.id.did()] },
        });
        expect(stored).toHaveProperty('ciphertext');
        const decrypted = await student.learnCard.invoke.decryptDagJwe(stored);
        expect(await userA.learnCard.invoke.decryptDagJwe(stored)).toEqual(decrypted);
        // WASM returns an empty value for an inaccessible JWE; native may throw.
        expect(
            await server.learnCard.invoke.decryptDagJwe(stored).catch(() => undefined)
        ).toBeFalsy();
        expect(decrypted).toMatchObject({ credentialSubject: credential.credentialSubject });
    });
});
