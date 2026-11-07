import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { neogma } from '@instance';
import { Boost } from '@models';
import { getUser } from './helpers/getClient';
import { sendSpy } from './helpers/spies';
import { getProfileByProfileId } from '@accesslayer/profile/read';
import { storeCredential } from '@accesslayer/credential/create';
import { releaseUnlinkedCredential } from '@accesslayer/credential/delete';
import * as boostRelationships from '@accesslayer/boost/relationships/create';
import * as relationships from '@accesslayer/credential/relationships/create';
import { sendBoost } from '@helpers/boost.helpers';

vi.mock('@services/delivery/delivery.factory', () => ({
    getDeliveryService: () => ({ send: sendSpy }),
}));

let issuer: Awaited<ReturnType<typeof getUser>>;
let holder: Awaited<ReturnType<typeof getUser>>;

const prepare = async () => {
    const entries = await issuer.clients.fullAuth.boost.allocateCredentialStatus({
        statusPurposes: ['revocation'],
    });
    const credential = await issuer.learnCard.invoke.issueCredential({
        '@context': ['https://www.w3.org/ns/credentials/v2'],
        type: ['VerifiableCredential'],
        issuer: issuer.learnCard.id.did(),
        credentialSubject: { id: holder.learnCard.id.did() },
        credentialStatus: entries,
    });
    const from = await getProfileByProfileId('cleanup-issuer');
    const to = await getProfileByProfileId('cleanup-holder');
    if (!from || !to) throw new Error('Missing test profiles');
    const boost = await Boost.createOne({ id: 'cleanup-boost', boost: JSON.stringify(credential) });
    return {
        from: { type: 'profile' as const, profile: from },
        to,
        boost,
        credential,
        domain: 'localhost:3000',
        skipNotification: true,
    };
};

const rows = async (label: 'Credential' | 'CredentialStatusBinding') =>
    (await neogma.queryRunner.run(`MATCH (n:${label}) RETURN n`)).records;

describe('Boost status reservation cleanup', () => {
    beforeAll(async () => {
        issuer = await getUser('d'.repeat(64));
        holder = await getUser('b'.repeat(64));
    });
    beforeEach(async () => {
        await neogma.queryRunner.run('MATCH (n) DETACH DELETE n');
        await issuer.clients.fullAuth.profile.createProfile({ profileId: 'cleanup-issuer' });
        await holder.clients.fullAuth.profile.createProfile({ profileId: 'cleanup-holder' });
    });

    it('rolls back after the instance write and retries the identical signed VC', async () => {
        const input = await prepare();
        const instanceSpy = vi.spyOn(boostRelationships, 'createBoostInstanceOfRelationship');
        const failure = vi
            .spyOn(relationships, 'createSentCredentialRelationship')
            .mockRejectedValueOnce(new Error('forced relationship failure'));
        try {
            await expect(sendBoost(input)).rejects.toThrow('forced relationship failure');
            expect(instanceSpy).toHaveBeenCalledOnce();
            expect(instanceSpy.mock.calls[0]?.[2]).toBeDefined();
            expect(await rows('Credential')).toHaveLength(0);
            expect(await rows('CredentialStatusBinding')).toHaveLength(0);
        } finally {
            instanceSpy.mockRestore();
            failure.mockRestore();
        }
        await expect(sendBoost(input)).resolves.toEqual(expect.any(String));
        expect(await rows('Credential')).toHaveLength(1);
        expect(await rows('CredentialStatusBinding')).toHaveLength(1);
        const sent = await neogma.queryRunner.run(
            'MATCH (:Profile)-[r:CREDENTIAL_SENT]->(:Credential)-[:INSTANCE_OF]->(:Boost) RETURN r'
        );
        expect(sent.records).toHaveLength(1);
    });

    it('releases instance-only credentials and their bindings', async () => {
        const { credential, boost } = await prepare();
        const stored = await storeCredential(credential, undefined, 'cleanup-issuer');
        await boostRelationships.createBoostInstanceOfRelationship(stored, boost);
        await releaseUnlinkedCredential(stored.id);
        expect(await rows('Credential')).toHaveLength(0);
        expect(await rows('CredentialStatusBinding')).toHaveLength(0);
        expect(await Boost.findOne({ where: { id: boost.id } })).toBeTruthy();
        await expect(
            storeCredential(credential, undefined, 'cleanup-issuer')
        ).resolves.toBeDefined();
    });

    it.each(['CREDENTIAL_SENT', 'OTHER_RELATIONSHIP'])(
        'preserves credentials and bindings with a %s edge',
        async relationship => {
            const { credential, boost } = await prepare();
            const stored = await storeCredential(credential, undefined, 'cleanup-issuer');
            await boostRelationships.createBoostInstanceOfRelationship(stored, boost);
            await neogma.queryRunner.run(
                `MATCH (p:Profile {profileId: $profile}), (c:Credential {id: $id})
                 CREATE (p)-[:${relationship} {to: $recipient}]->(c)`,
                { profile: 'cleanup-issuer', recipient: 'cleanup-holder', id: stored.id }
            );
            await releaseUnlinkedCredential(stored.id);
            expect(await rows('Credential')).toHaveLength(1);
            expect(await rows('CredentialStatusBinding')).toHaveLength(1);
            await expect(storeCredential(credential, undefined, 'cleanup-issuer')).rejects.toThrow(
                'already bound'
            );
            const edges = await neogma.queryRunner.run(
                'MATCH (:Credential {id: $id})-[r]-() RETURN type(r) AS type',
                { id: stored.id }
            );
            expect(edges.records.map(row => row.get('type')).sort()).toEqual(
                ['INSTANCE_OF', relationship].sort()
            );
        }
    );
});
