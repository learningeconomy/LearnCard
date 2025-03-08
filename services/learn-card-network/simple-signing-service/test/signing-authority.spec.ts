import { getClient, getUser } from './helpers/getClient';
import { SigningAuthorities } from '@accesslayer/signing-authority';

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

    it('should allow you to create a signing authority', async () => {
        await expect(
            userA.clients.fullAuth.signingAuthority.createSigningAuthority({ name: 'mysa' })
        ).resolves.not.toThrow();
    });

    it('should prevent creating a signing authority with the same name', async () => {
        await expect(
            userA.clients.fullAuth.signingAuthority.createSigningAuthority({ name: 'mysa' })
        ).resolves.not.toThrow();

        await expect(
            userA.clients.fullAuth.signingAuthority.createSigningAuthority({ name: 'mysa' })
        ).rejects.toThrow();
    });

    it('should allow you to retrieve your signing authorities after creation', async () => {
        await userA.clients.fullAuth.signingAuthority.createSigningAuthority({ name: 'mysa' });
        const sas = await userA.clients.fullAuth.signingAuthority.signingAuthorities();
        if (sas && sas[0]) {
            expect(sas[0].name).toBe('mysa');
            expect(sas[0].ownerDid).toBe(userA.learnCard.id.did());
        } else {
            expect(sas[0]).toBeDefined();
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
