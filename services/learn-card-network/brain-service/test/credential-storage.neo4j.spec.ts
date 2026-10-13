import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { VCValidator, type BitstringStatusListEntry } from '@learncard/types';
import { Credential, Profile, StatusList } from '@models';
import { storeCredential } from '../src/accesslayer/credential/create';
import { getCredentialById } from '../src/accesslayer/credential/read';
import { setCredentialBitstringStatus, decodeBitstring } from '../src/helpers/status-list.helpers';
import { getUser } from './helpers/getClient';
import { app as statusListsApp } from '../src/status-lists';

let issuer: Awaited<ReturnType<typeof getUser>>;
const credentialIds: string[] = [];

const isStatusBitSet = async (entry: BitstringStatusListEntry): Promise<boolean> => {
    const id = entry.statusListCredential.split('/').pop();
    if (!id) throw new Error('Missing status list id');
    const response = await statusListsApp.inject({ method: 'GET', url: `/status-lists/${id}` });
    expect(response.statusCode).toBe(200);
    const list = JSON.parse(response.body);
    const bytes = decodeBitstring(list.credentialSubject.encodedList, 131_072);
    const index = Number(entry.statusListIndex);
    return ((bytes[Math.floor(index / 8)] ?? 0) & (1 << (index % 8))) !== 0;
};

describe('credential status storage in Neo4j', () => {
    beforeAll(async () => {
        issuer = await getUser();
        await issuer.clients.fullAuth.profile.createProfile({ profileId: 'storage-issuer' });
        await statusListsApp.ready();
    });
    afterAll(async () => {
        for (const id of credentialIds) await Credential.delete({ where: { id } });
        await Profile.delete({ detach: true, where: { profileId: 'storage-issuer' } });
        await StatusList.delete({ detach: true, where: { ownerProfileId: 'storage-issuer' } });
    });

    it('persists trusted public status descriptors for revocation consumers without decrypting the payload', async () => {
        const [entry] = await issuer.clients.fullAuth.boost.allocateCredentialStatus({
            statusPurposes: ['revocation'],
        });
        if (!entry) throw new Error('Expected allocated revocation entry');
        const signed = await issuer.learnCard.invoke.issueCredential({
            ...(await issuer.learnCard.invoke.getTestVc()),
            credentialStatus: entry,
        });
        const jwe = await issuer.learnCard.invoke.createDagJwe(signed, [issuer.learnCard.id.did()]);
        const stored = await storeCredential({
            kind: 'issued-credential',
            credential: jwe,
            statusEntries: [entry],
        });
        credentialIds.push(stored.id);

        const row = await getCredentialById(stored.id);
        expect(row?.credential).toBe(JSON.stringify(jwe));
        expect(JSON.parse(row?.statusEntries ?? 'null')).toEqual([entry]);
        expect(await isStatusBitSet(entry)).toBe(false);
        expect(await setCredentialBitstringStatus(stored.id, 'revocation', true)).toBe(true);
        expect(await isStatusBitSet(entry)).toBe(true);
    });

    it.each(['embedded', 'absent'] as const)(
        'preserves a valid signed wire VC and proof with %s status',
        async statusCase => {
            const unsigned = await issuer.learnCard.invoke.getTestVc();
            if (statusCase === 'embedded') {
                const [entry] = await issuer.clients.fullAuth.boost.allocateCredentialStatus({
                    statusPurposes: ['revocation'],
                });
                unsigned.credentialStatus = entry;
            }
            const signed = await issuer.learnCard.invoke.issueCredential(unsigned);
            const stored = await storeCredential(signed);
            credentialIds.push(stored.id);
            const row = await getCredentialById(stored.id);
            const recovered = VCValidator.parse(JSON.parse(row?.credential ?? 'null'));
            expect(recovered).toEqual(signed);
            expect(
                await issuer.learnCard.invoke.verifyCredential(recovered, { checks: ['proof'] })
            ).toMatchObject({
                checks: expect.arrayContaining(['proof']),
                warnings: [],
                errors: [],
            });
        }
    );

    it('does not promote wire JWE metadata to trusted status descriptors', async () => {
        const [entry] = await issuer.clients.fullAuth.boost.allocateCredentialStatus({
            statusPurposes: ['revocation'],
        });
        if (!entry) throw new Error('Expected allocated revocation entry');
        const signed = await issuer.learnCard.invoke.issueCredential({
            ...(await issuer.learnCard.invoke.getTestVc()),
            credentialStatus: entry,
        });
        const jwe = await issuer.learnCard.invoke.createDagJwe(signed, [issuer.learnCard.id.did()]);
        const wire = { ...jwe, kind: 'issued-credential', statusEntries: [entry] };
        const stored = await storeCredential(wire);
        credentialIds.push(stored.id);
        const row = await getCredentialById(stored.id);
        expect(row?.credential).toBe(JSON.stringify(wire));
        expect(row?.statusEntries).toBeUndefined();
        expect(await setCredentialBitstringStatus(stored.id, 'revocation', true)).toBe(false);
        expect(await isStatusBitSet(entry)).toBe(false);
    });

    it('does not persist or apply an empty trusted status descriptor set', async () => {
        const signed = await issuer.learnCard.invoke.issueCredential(
            await issuer.learnCard.invoke.getTestVc()
        );
        const jwe = await issuer.learnCard.invoke.createDagJwe(signed, [issuer.learnCard.id.did()]);
        const stored = await storeCredential({
            kind: 'issued-credential',
            credential: jwe,
            statusEntries: [],
        });
        credentialIds.push(stored.id);
        const row = await getCredentialById(stored.id);
        expect(row?.statusEntries).toBeUndefined();
        expect(await setCredentialBitstringStatus(stored.id, 'revocation', true)).toBe(false);
    });
});
