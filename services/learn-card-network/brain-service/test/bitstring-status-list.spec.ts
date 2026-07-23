import { Profile, Credential, Boost, StatusList } from '@models';
import { app as statusListsApp } from '../src/status-lists';
import { decodeBitstring } from '../src/helpers/status-list.helpers';
import { getUser } from './helpers/getClient';

let userA: Awaited<ReturnType<typeof getUser>>;
let userB: Awaited<ReturnType<typeof getUser>>;

const getStatusEntries = (credential: any): any[] => {
    if (!credential || typeof credential !== 'object') return [];

    const statuses = credential.credentialStatus;
    const entries = Array.isArray(statuses) ? statuses : statuses ? [statuses] : [];

    return [...entries, ...getStatusEntries(credential.boostCredential)];
};

const getEntryForPurpose = (credential: any, statusPurpose: 'revocation' | 'suspension') => {
    const entry = getStatusEntries(credential).find(
        (status: any) => status.statusPurpose === statusPurpose
    );
    if (!entry) throw new Error(`Missing ${statusPurpose} status entry`);
    return entry;
};

const getListId = (entry: any): string => {
    const id = entry.statusListCredential.split('/').pop();
    if (!id) throw new Error('Status list credential URL is missing an id');
    return id;
};

const isStatusBitSet = async (entry: any): Promise<boolean> => {
    const response = await statusListsApp.inject({
        method: 'GET',
        url: `/status-lists/${getListId(entry)}`,
    });
    expect(response.statusCode).toBe(200);

    const statusListCredential = JSON.parse(response.body);
    const encodedList = statusListCredential.credentialSubject.encodedList;
    const bitstring = decodeBitstring(encodedList, 131_072);
    const index = Number(entry.statusListIndex);
    const byte = bitstring[Math.floor(index / 8)] ?? 0;

    return (byte & (1 << index % 8)) !== 0;
};

const statusBoostTemplate = {
    '@context': [
        'https://www.w3.org/ns/credentials/v2',
        'https://ctx.learncard.com/boosts/1.0.1.json',
    ],
    type: ['VerifiableCredential', 'BoostCredential'],
    issuer: 'did:example:issuer',
    validFrom: '2024-01-01T00:00:00.000Z',
    name: 'Status List Test Boost',
    credentialSubject: {
        id: 'did:example:subject',
    },
};

const statusCredentialTemplate = {
    '@context': ['https://www.w3.org/ns/credentials/v2'],
    type: ['VerifiableCredential'],
    issuer: 'did:example:issuer',
    validFrom: '2024-01-01T00:00:00.000Z',
    name: 'Status List Test Credential',
    credentialSubject: {
        id: 'did:example:subject',
    },
};

const sendBoostWithStatus = async (
    statusPurpose: 'revocation' | 'suspension' = 'revocation'
): Promise<{ credentialUri: string; credential: any; boostUri: string }> => {
    const template =
        statusPurpose === 'suspension' ? statusCredentialTemplate : statusBoostTemplate;
    const boostUri = await userA.clients.fullAuth.boost.createBoost({
        credential: template,
    });
    const statusEntries =
        statusPurpose === 'suspension'
            ? await userA.clients.fullAuth.boost.allocateCredentialStatus({
                  statusPurposes: ['suspension'],
              })
            : [];

    const signedCredential = await userA.learnCard.invoke.issueCredential({
        ...template,
        issuer: userA.learnCard.id.did(),
        validFrom: new Date().toISOString(),
        ...(statusEntries[0] ? { credentialStatus: statusEntries[0] } : {}),
        credentialSubject: {
            id: userB.learnCard.id.did(),
        },
        ...(template.type.includes('BoostCredential') ? { boostId: boostUri } : {}),
    });

    const credentialUri = await userA.clients.fullAuth.boost.sendBoost({
        profileId: 'userb',
        uri: boostUri,
        credential: signedCredential,
    });

    await userB.clients.fullAuth.credential.acceptCredential({ uri: credentialUri });

    const credential = await userB.clients.fullAuth.storage.resolve({ uri: credentialUri });

    return { credentialUri, credential, boostUri };
};

describe('Bitstring Status List issuance', () => {
    beforeAll(async () => {
        userA = await getUser();
        userB = await getUser('b'.repeat(64));
        await statusListsApp.ready();
    });

    beforeEach(async () => {
        await Profile.delete({ detach: true, where: {} });
        await Credential.delete({ detach: true, where: {} });
        await Boost.delete({ detach: true, where: {} });
        await StatusList.delete({ detach: true, where: {} });

        await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' });
        await userB.clients.fullAuth.profile.createProfile({ profileId: 'userb' });
    });

    afterAll(async () => {
        await Profile.delete({ detach: true, where: {} });
        await Credential.delete({ detach: true, where: {} });
        await Boost.delete({ detach: true, where: {} });
        await StatusList.delete({ detach: true, where: {} });
    });

    it('adds a revocation entry to issued boost credentials', async () => {
        const { credential } = await sendBoostWithStatus();

        expect(getEntryForPurpose(credential, 'revocation').type).toBe('BitstringStatusListEntry');
        expect(await isStatusBitSet(getEntryForPurpose(credential, 'revocation'))).toBe(false);
    });

    it('allocates BOTH revocation and suspension entries by default (no statusPurposes passed)', async () => {
        const { credential } = await sendBoostWithStatus();
        expect(getEntryForPurpose(credential, 'revocation').type).toBe('BitstringStatusListEntry');
        expect(getEntryForPurpose(credential, 'suspension').type).toBe('BitstringStatusListEntry');
        expect(await isStatusBitSet(getEntryForPurpose(credential, 'revocation'))).toBe(false);
        expect(await isStatusBitSet(getEntryForPurpose(credential, 'suspension'))).toBe(false);
    });

    it('allocates suspension entries when requested', async () => {
        const { credential } = await sendBoostWithStatus('suspension');

        expect(getEntryForPurpose(credential, 'suspension').type).toBe('BitstringStatusListEntry');
        expect(await isStatusBitSet(getEntryForPurpose(credential, 'suspension'))).toBe(false);
    });

    it('flips the revocation bit when a boost recipient is revoked', async () => {
        const { credential, boostUri } = await sendBoostWithStatus();
        const revocationEntry = getEntryForPurpose(credential, 'revocation');

        await userA.clients.fullAuth.boost.revokeBoostRecipient({
            boostUri,
            recipientProfileId: 'userb',
        });

        expect(await isStatusBitSet(revocationEntry)).toBe(true);
    });

    it('can suspend and unsuspend a boost recipient', async () => {
        const { credential, boostUri } = await sendBoostWithStatus('suspension');
        const suspensionEntry = getEntryForPurpose(credential, 'suspension');

        await userA.clients.fullAuth.boost.suspendBoostRecipient({
            boostUri,
            recipientProfileId: 'userb',
        });
        expect(await isStatusBitSet(suspensionEntry)).toBe(true);

        await userA.clients.fullAuth.boost.unsuspendBoostRecipient({
            boostUri,
            recipientProfileId: 'userb',
        });
        expect(await isStatusBitSet(suspensionEntry)).toBe(false);
    });
});
