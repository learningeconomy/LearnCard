import { randomBytes, randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { getUser } from './helpers/getClient';
import { normalContract, normalFullTerms } from './helpers/contract';
import { createDeliveryRecipient, getDeliveryRecord } from '@accesslayer/readable-delivery';
import { neogma } from '@instance';
import { addRecipientToContract } from '@accesslayer/consentflowcontract/relationships/recipients';
import { getUriParts } from '@helpers/uri.helpers';
import type { DeliveryRecord } from '../src/types/readable-delivery';

const domain = 'localhost%3A3000';
const setup = async () => {
    const suffix = randomBytes(5).toString('hex');
    const owner = await getUser(randomBytes(32).toString('hex'));
    const learner = await getUser(randomBytes(32).toString('hex'));
    const ownerProfileId = `rd-owner-${suffix}`;
    const learnerProfileId = `rd-learner-${suffix}`;
    const profileId = `rd-org-${suffix}`;
    await owner.clients.fullAuth.profile.createProfile({ profileId: ownerProfileId });
    await learner.clients.fullAuth.profile.createProfile({ profileId: learnerProfileId });
    await owner.clients.fullAuth.profile.createManagedServiceProfile({
        profileId,
        displayName: 'Example Organization',
        type: 'organization',
    });
    const contractUri = await owner.clients.fullAuth.contracts.createConsentFlowContract({
        name: 'Readable provisioning',
        contract: { ...normalContract, expectedIssuers: ['did:key:initial-issuer'] },
        recipients: [profileId],
    });
    const record: DeliveryRecord = {
        profileId,
        domain,
        ownerProfileId,
        provisionId: randomUUID(),
        version: 1,
        agentProfileId: `rd-agent-${suffix}`,
        agentDid: `did:key:synthetic-agent-${suffix}`,
        displayName: 'Example Organization',
        enabled: true,
        disclosureVersion: '1',
        provider: 'local-v1',
        ciphertext: 'synthetic-encrypted-envelope',
    };
    return { owner, learner, contractUri, record };
};

describe('existing readable recipient atomic boundary', () => {
    it.each([false, null, true])(
        'preserves the existing service-profile flag (%s) while adding a service agent',
        async isServiceProfile => {
            const { record } = await setup();
            await neogma.queryRunner.run(
                'MATCH (p:Profile {profileId:$profileId}) SET p.isServiceProfile = $isServiceProfile',
                { profileId: record.profileId, isServiceProfile }
            );
            await createDeliveryRecipient(record, 'unused', true);
            const result = await neogma.queryRunner.run(
                `MATCH (p:Profile {profileId:$profileId})-[:MANAGED_BY]->(agent:Profile {profileId:$agentProfileId})
                 RETURN p.isServiceProfile AS recipientFlag, agent.isServiceProfile AS agentFlag`,
                record
            );
            expect(result.records).toHaveLength(1);
            expect(result.records[0]?.get('recipientFlag')).toBe(isServiceProfile);
            expect(result.records[0]?.get('agentFlag')).toBe(true);
        }
    );
    it('completes provisioning raced with add-recipient before first consent exactly once', async () => {
        const { owner, contractUri, record } = await setup();
        const before = await owner.clients.fullAuth.contracts.getConsentFlowContract({
            uri: contractUri,
        });
        await Promise.all([
            createDeliveryRecipient(record, 'unused', true),
            ...Array.from({ length: 8 }, () =>
                addRecipientToContract(getUriParts(contractUri).id, record.profileId)
            ),
        ]);
        const after = await owner.clients.fullAuth.contracts.getConsentFlowContract({
            uri: contractUri,
        });
        expect(after.audienceVersion).toBe(before.audienceVersion! + 1);
        expect(after.recipients).toHaveLength(1);
        expect(await getDeliveryRecord(record.profileId, domain)).toMatchObject(record);
        const result = await neogma.queryRunner.run(
            `MATCH (recipient:Profile {profileId:$profileId})-[r:MANAGED_BY]->(agent:Profile {profileId:$agentProfileId})
             RETURN count(r) AS managers`,
            record
        );
        expect(Number(result.records[0]?.get('managers'))).toBe(1);
        const audit = await neogma.queryRunner.run(
            "MATCH (a:ReadableDeliveryAudit {recipient:$profileId, action:'provision'}) RETURN count(a) AS count",
            record
        );
        expect(Number(audit.records[0]?.get('count'))).toBe(1);
    });
    it('preserves the organization identity, adds a co-manager, and rejects stale consent screens', async () => {
        const { owner, learner, contractUri, record } = await setup();
        const before = await owner.clients.fullAuth.contracts.getConsentFlowContract({
            uri: contractUri,
        });
        await createDeliveryRecipient(record, 'did:key:must-not-replace', true);
        const after = await owner.clients.fullAuth.contracts.getConsentFlowContract({
            uri: contractUri,
        });
        expect(after.recipients?.[0]?.did).toBe(before.recipients?.[0]?.did);
        expect(after.audienceVersion).toBe(before.audienceVersion! + 1);
        await expect(
            learner.clients.fullAuth.contracts.consentToContract({
                contractUri,
                terms: normalFullTerms,
                audienceVersion: before.audienceVersion,
            })
        ).rejects.toThrow();
        await learner.clients.fullAuth.contracts.consentToContract({
            contractUri,
            terms: normalFullTerms,
            audienceVersion: after.audienceVersion,
        });
        expect(await getDeliveryRecord(record.profileId, domain)).toMatchObject({
            enabled: true,
            agentDid: record.agentDid,
        });
    });
    it('rejects already-consented organizations and unauthorized managers without creating an agent', async () => {
        const { owner, learner, contractUri, record } = await setup();
        await expect(
            createDeliveryRecipient({ ...record, ownerProfileId: 'someone-else' }, 'unused', true)
        ).rejects.toMatchObject({ code: 'CONFLICT' });
        const details = await owner.clients.fullAuth.contracts.getConsentFlowContract({
            uri: contractUri,
        });
        await learner.clients.fullAuth.contracts.consentToContract({
            contractUri,
            terms: normalFullTerms,
            audienceVersion: details.audienceVersion,
        });
        await expect(createDeliveryRecipient(record, 'unused', true)).rejects.toMatchObject({
            code: 'CONFLICT',
        });
        expect(await getDeliveryRecord(record.profileId, domain)).toBeUndefined();
        const result = await neogma.queryRunner.run(
            'MATCH (p:Profile {profileId:$id}) RETURN count(p) AS count',
            { id: record.agentProfileId }
        );
        expect(Number(result.records[0]?.get('count'))).toBe(0);
    });
    it('serializes enabling with first consent so the old disclosure can never authorize both', async () => {
        const { owner, learner, contractUri, record } = await setup();
        const details = await owner.clients.fullAuth.contracts.getConsentFlowContract({
            uri: contractUri,
        });
        const outcomes = await Promise.allSettled([
            createDeliveryRecipient(record, 'unused', true),
            learner.clients.fullAuth.contracts.consentToContract({
                contractUri,
                terms: normalFullTerms,
                audienceVersion: details.audienceVersion,
            }),
        ]);
        expect(outcomes.filter(result => result.status === 'fulfilled')).toHaveLength(1);
    });
    it('persists owner-configured issuer expectations through contract versions and rejects other editors', async () => {
        const { owner, learner, contractUri } = await setup();
        const read = () =>
            owner.clients.fullAuth.contracts.getConsentFlowContract({ uri: contractUri });
        expect((await read()).contract.expectedIssuers).toEqual(['did:key:initial-issuer']);
        await expect(
            learner.clients.fullAuth.contracts.updateConsentFlowContract({
                uri: contractUri,
                changes: { contract: { expectedIssuers: ['did:key:attacker'] } },
            })
        ).rejects.toThrow();
        await owner.clients.fullAuth.contracts.updateConsentFlowContract({
            uri: contractUri,
            changes: { contract: { expectedIssuers: ['did:key:partner-a', 'did:key:partner-b'] } },
        });
        expect((await read()).contract.expectedIssuers).toEqual([
            'did:key:partner-a',
            'did:key:partner-b',
        ]);
        await owner.clients.fullAuth.contracts.updateConsentFlowContract({
            uri: contractUri,
            changes: { description: 'Description only' },
        });
        expect((await read()).contract.expectedIssuers).toEqual([
            'did:key:partner-a',
            'did:key:partner-b',
        ]);
        await owner.clients.fullAuth.contracts.updateConsentFlowContract({
            uri: contractUri,
            changes: { contract: { expectedIssuers: [] } },
        });
        expect((await read()).contract.expectedIssuers).toEqual([]);
    });
});
