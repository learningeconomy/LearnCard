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

        expect(everythingElse).toMatchObject({ ...credential, issuer: signingAuthority.did });
        expect(proof).toBeDefined();
    });
});
