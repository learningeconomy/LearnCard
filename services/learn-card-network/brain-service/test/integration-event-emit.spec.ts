import { randomBytes } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { neogma } from '@instance';
import * as notifications from '@helpers/notifications.helpers';
import { toIntegrationEvent } from '@helpers/integration-events.helpers';

import { getUser } from './helpers/getClient';
import { normalContract, normalFullTerms } from './helpers/contract';

const actor = async (role: string) => {
    const user = await getUser(randomBytes(32).toString('hex'));
    const profileId = `emit-${role}-${randomBytes(5).toString('hex')}`;
    await user.clients.fullAuth.profile.createProfile({ profileId });

    return { ...user, profileId };
};

const recordsFor = async (integrationId: string) => {
    const result = await neogma.queryRunner.run(
        `MATCH (record:IntegrationEvent {integrationId: $integrationId})
         RETURN record ORDER BY record.sequence`,
        { integrationId }
    );

    return result.records.map(row => toIntegrationEvent(row.get('record').properties));
};

// The first hook also boots the wallet and the database connection, which can be slow.
vi.setConfig({ hookTimeout: 30_000 });

describe('contract events reach integrations', () => {
    let owner: Awaited<ReturnType<typeof actor>>;
    let writer: Awaited<ReturnType<typeof actor>>;
    let learner: Awaited<ReturnType<typeof actor>>;
    let ownerIntegrationId: string;
    let writerIntegrationId: string;
    let contractUri: string;

    beforeEach(async () => {
        vi.spyOn(notifications, 'addNotificationToQueue').mockResolvedValue(undefined);

        [owner, writer, learner] = await Promise.all([
            actor('owner'),
            actor('writer'),
            actor('learner'),
        ]);

        ownerIntegrationId = await owner.clients.fullAuth.integrations.addIntegration({
            name: 'Owner feed',
            whitelistedDomains: [],
        });
        writerIntegrationId = await writer.clients.fullAuth.integrations.addIntegration({
            name: 'Writer feed',
            whitelistedDomains: [],
        });
        await owner.clients.fullAuth.integrations.updateIntegration({
            id: ownerIntegrationId,
            updates: { contractEventsEnabled: true },
        });
        await writer.clients.fullAuth.integrations.updateIntegration({
            id: writerIntegrationId,
            updates: { contractEventsEnabled: true },
        });

        contractUri = await owner.clients.fullAuth.contracts.createConsentFlowContract({
            name: 'Integration emit contract',
            contract: normalContract,
            writers: [writer.profileId],
        });
    });

    afterEach(() => vi.restoreAllMocks());

    it('request_sent, then request_accepted and consent_created, in feed order', async () => {
        await writer.clients.fullAuth.contracts.sendContractRequest({
            contractUri,
            targetProfileId: learner.profileId,
            externalReferenceId: 'case-77',
        });

        const afterSend = await recordsFor(ownerIntegrationId);

        expect(afterSend).toHaveLength(1);
        expect(afterSend[0]).toMatchObject({
            sequence: 1,
            type: 'request_sent',
            contractUri,
            role: 'owner',
            externalReferenceId: 'case-77',
            subject: { profileId: learner.profileId, didKey: learner.learnCard.id.did() },
        });
        expect(afterSend[0]?.subject?.did.startsWith('did:web:')).toBe(true);
        expect(typeof afterSend[0]?.requestId).toBe('string');

        const consent = await learner.clients.fullAuth.contracts.consentToContract({
            contractUri,
            terms: normalFullTerms,
            audienceVersion: (
                await owner.clients.fullAuth.contracts.getConsentFlowContract({ uri: contractUri })
            ).audienceVersion,
        });

        const ownerRecords = await recordsFor(ownerIntegrationId);

        expect(ownerRecords.map(record => [record.sequence, record.type])).toEqual([
            [1, 'request_sent'],
            [2, 'request_accepted'],
            [3, 'consent_created'],
        ]);
        expect(ownerRecords[2]).toMatchObject({
            termsUri: consent.termsUri,
            role: 'owner',
            requestId: afterSend[0]?.requestId,
            externalReferenceId: 'case-77',
            subject: { profileId: learner.profileId },
        });
        expect(ownerRecords[1]?.eventId).toBe(ownerRecords[2]?.eventId);

        // The writer sent the request, so the writer's integration gets all three as well.
        const writerRecords = await recordsFor(writerIntegrationId);

        expect(writerRecords.map(record => [record.type, record.role])).toEqual([
            ['request_sent', 'writer'],
            ['request_accepted', 'writer'],
            ['consent_created', 'writer'],
        ]);

        // No event is left waiting for fan-out.
        const pending = await neogma.queryRunner.run(
            `MATCH (event:ConsentFlowEvent)
             WHERE event.integrationFanoutPending = true AND event.contractId = $contractId
             RETURN count(event) AS total`,
            { contractId: contractUri.split(':').at(-1) }
        );
        expect(Number(pending.records[0]?.get('total'))).toBe(0);
    });

    it('a consent with no request produces one consent_created record and no request_accepted', async () => {
        await learner.clients.fullAuth.contracts.consentToContract({
            contractUri,
            terms: normalFullTerms,
            audienceVersion: (
                await owner.clients.fullAuth.contracts.getConsentFlowContract({ uri: contractUri })
            ).audienceVersion,
        });

        const ownerRecords = await recordsFor(ownerIntegrationId);

        expect(ownerRecords.map(record => record.type)).toEqual(['consent_created']);
        expect(ownerRecords[0]).not.toHaveProperty('requestId');
        expect(ownerRecords[0]).not.toHaveProperty('externalReferenceId');
    });

    it('a denied request produces request_denied for the owner', async () => {
        await writer.clients.fullAuth.contracts.sendContractRequest({
            contractUri,
            targetProfileId: learner.profileId,
        });
        await learner.clients.fullAuth.contracts.denyContractRequest({ contractUri });

        const ownerRecords = await recordsFor(ownerIntegrationId);

        expect(ownerRecords.map(record => record.type)).toEqual(['request_sent', 'request_denied']);
        expect(ownerRecords[1]?.subject?.profileId).toBe(learner.profileId);
    });
});
