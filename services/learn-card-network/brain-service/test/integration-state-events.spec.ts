import { randomBytes } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { neogma } from '@instance';
import * as notifications from '@helpers/notifications.helpers';
import { fanOutIntegrationEvents, toIntegrationEvent } from '@helpers/integration-events.helpers';
import {
    emitExpiredConsentEvents,
    suspendExpiredConsentFlowTerms,
} from '@helpers/consentflow-deadline.helpers';

import { getUser } from './helpers/getClient';
import { normalContract, normalFullTerms } from './helpers/contract';

const run = (query: string, params: Record<string, unknown> = {}) =>
    neogma.queryRunner.run(query, params);

const idOf = (uri: string): string => uri.split(':').at(-1)!;

const actor = async (role: string) => {
    const user = await getUser(randomBytes(32).toString('hex'));
    const profileId = `state-${role}-${randomBytes(5).toString('hex')}`;
    await user.clients.fullAuth.profile.createProfile({ profileId });

    return { ...user, profileId };
};

type Actor = Awaited<ReturnType<typeof actor>>;

const enabledIntegration = async (user: Actor, name: string): Promise<string> => {
    const id = await user.clients.fullAuth.integrations.addIntegration({
        name,
        whitelistedDomains: [],
    });
    await user.clients.fullAuth.integrations.updateIntegration({
        id,
        updates: { contractEventsEnabled: true },
    });

    return id;
};

const recordsFor = async (integrationId: string) => {
    const result = await run(
        `MATCH (record:IntegrationEvent {integrationId: $integrationId})
         RETURN record ORDER BY record.sequence`,
        { integrationId }
    );

    return result.records.map(row => toIntegrationEvent(row.get('record').properties));
};

/** Profile deliveries attached to the events of one contract, by event kind. */
const profileDeliveriesFor = async (contractId: string, kinds: string[]): Promise<number> => {
    const result = await run(
        `MATCH (event:ConsentFlowEvent {contractId: $contractId})-[:HAS_DELIVERY]->(delivery)
         WHERE event.kind IN $kinds
         RETURN count(delivery) AS total`,
        { contractId, kinds }
    );

    return Number(result.records[0]?.get('total'));
};

// The first hook also boots the wallet and the database connection, which can be slow.
vi.setConfig({ hookTimeout: 30_000, testTimeout: 30_000 });

describe('integration-only state events', () => {
    let owner: Actor;
    let writer: Actor;
    let recipient: Actor;
    let learnerA: Actor;
    let learnerB: Actor;
    let ownerIntegrationId: string;
    let recipientIntegrationId: string;
    let contractUri: string;
    let termsA: string;
    let termsB: string;

    const consent = async (learner: Actor): Promise<string> => {
        const { audienceVersion } = await owner.clients.fullAuth.contracts.getConsentFlowContract({
            uri: contractUri,
        });
        const { termsUri } = await learner.clients.fullAuth.contracts.consentToContract({
            contractUri,
            terms: normalFullTerms,
            audienceVersion,
        });

        return termsUri;
    };

    const typesSince = async (integrationId: string, from: number) =>
        (await recordsFor(integrationId)).slice(from);

    beforeEach(async () => {
        vi.spyOn(notifications, 'addNotificationToQueue').mockResolvedValue(undefined);

        [owner, writer, recipient, learnerA, learnerB] = await Promise.all([
            actor('owner'),
            actor('writer'),
            actor('recipient'),
            actor('learner-a'),
            actor('learner-b'),
        ]);
        ownerIntegrationId = await enabledIntegration(owner, 'Owner feed');
        recipientIntegrationId = await enabledIntegration(recipient, 'Recipient feed');

        contractUri = await owner.clients.fullAuth.contracts.createConsentFlowContract({
            name: 'State events contract',
            contract: normalContract,
            writers: [writer.profileId],
            recipients: [recipient.profileId],
        });

        // Learner A arrives through a referral, so its events carry a request and a reference.
        await writer.clients.fullAuth.contracts.sendContractRequest({
            contractUri,
            targetProfileId: learnerA.profileId,
            externalReferenceId: 'case-501',
        });
        termsA = await consent(learnerA);
        termsB = await consent(learnerB);
    });

    afterEach(() => vi.restoreAllMocks());

    it('retire: contract_retired and one consent_withdrawn per terms are delivered after retirement', async () => {
        const before = (await recordsFor(ownerIntegrationId)).length;
        const recipientBefore = (await recordsFor(recipientIntegrationId)).length;

        await owner.clients.fullAuth.contracts.deleteConsentFlowContract({ uri: contractUri });

        // Retirement keeps the contract node and its audience relationships.
        const kept = await run(
            `MATCH (contract:ConsentFlowContract {id: $id})
             RETURN contract.status AS status,
                 EXISTS { MATCH (contract)-[:CREATED_BY]->(:Profile) } AS hasOwner,
                 EXISTS { MATCH (contract)-[:CAN_WRITE]->(:Profile) } AS hasWriter,
                 EXISTS { MATCH (contract)-[:SHARES_DATA_WITH]->(:Profile) } AS hasRecipient`,
            { id: idOf(contractUri) }
        );
        expect(kept.records[0]?.toObject()).toEqual({
            status: 'retired',
            hasOwner: true,
            hasWriter: true,
            hasRecipient: true,
        });

        // The worker runs after the contract is already retired.
        await fanOutIntegrationEvents({ limit: 500 });

        const ownerRecords = await typesSince(ownerIntegrationId, before);

        expect(ownerRecords.map(record => record.type).sort()).toEqual([
            'consent_withdrawn',
            'consent_withdrawn',
            'contract_retired',
        ]);

        const retired = ownerRecords.find(record => record.type === 'contract_retired')!;
        expect(retired).toMatchObject({ contractUri, role: 'owner' });
        expect(retired).not.toHaveProperty('subject');
        expect(retired).not.toHaveProperty('termsUri');

        const withdrawnA = ownerRecords.find(record => record.termsUri === termsA)!;
        expect(withdrawnA).toMatchObject({
            type: 'consent_withdrawn',
            reason: 'contract_retired',
            contractUri,
            subject: { profileId: learnerA.profileId, didKey: learnerA.learnCard.id.did() },
            externalReferenceId: 'case-501',
        });
        expect(typeof withdrawnA.requestId).toBe('string');
        expect(ownerRecords.find(record => record.termsUri === termsB)).toMatchObject({
            type: 'consent_withdrawn',
            reason: 'contract_retired',
            subject: { profileId: learnerB.profileId },
        });

        // A data recipient gets the same events, without another referrer's reference.
        const recipientRecords = await typesSince(recipientIntegrationId, recipientBefore);

        expect(recipientRecords.map(record => record.type).sort()).toEqual([
            'consent_withdrawn',
            'consent_withdrawn',
            'contract_retired',
        ]);
        for (const record of recipientRecords) {
            expect(record.role).toBe('recipient');
            expect(record).not.toHaveProperty('externalReferenceId');
        }

        // Integration-only: no profile notification is queued for the new events.
        expect(
            await profileDeliveriesFor(idOf(contractUri), ['contract_retired', 'consent_withdrawn'])
        ).toBe(0);

        const pending = await run(
            `MATCH (event:ConsentFlowEvent {contractId: $contractId})
             WHERE event.integrationFanoutPending = true RETURN count(event) AS total`,
            { contractId: idOf(contractUri) }
        );
        expect(Number(pending.records[0]?.get('total'))).toBe(0);
    });

    it('version update: consent_paused per terms moved to needs_reconsent, and only those', async () => {
        // Learner B withdraws first, so only learner A is live when the contract changes.
        await learnerB.clients.fullAuth.contracts.withdrawConsent({ uri: termsB });

        const before = (await recordsFor(ownerIntegrationId)).length;

        // An optional addition does not pause anyone.
        await owner.clients.fullAuth.contracts.updateConsentFlowContract({
            uri: contractUri,
            changes: {
                contract: {
                    read: { credentials: { categories: { Gamma: { required: false } } } },
                },
            },
        });
        await fanOutIntegrationEvents({ limit: 500 });
        expect(await typesSince(ownerIntegrationId, before)).toEqual([]);

        const result = await owner.clients.fullAuth.contracts.updateConsentFlowContract({
            uri: contractUri,
            changes: { name: 'New request identity' },
            reason: 'Review the new request identity.',
        });
        expect(result.kind).toBe('requires_consent');

        await fanOutIntegrationEvents({ limit: 500 });

        const records = await typesSince(ownerIntegrationId, before);

        expect(records).toHaveLength(1);
        expect(records[0]).toMatchObject({
            type: 'consent_paused',
            reason: 'needs_reconsent',
            contractUri,
            termsUri: termsA,
            subject: { profileId: learnerA.profileId },
            externalReferenceId: 'case-501',
            role: 'owner',
        });
        expect(await profileDeliveriesFor(idOf(contractUri), ['consent_paused'])).toBe(0);
    });

    describe('expiry extended by a non-breaking update', () => {
        const expireVersionOne = async (agoMs = 1_000): Promise<void> => {
            await run(
                `MATCH (contract:ConsentFlowContract {id: $id})-[:HAS_VERSION]->(version:ConsentFlowContractVersion {version: 1})
                 SET contract.expiresAt = $expiresAt, version.expiresAt = $expiresAt`,
                { id: idOf(contractUri), expiresAt: new Date(Date.now() - agoMs).toISOString() }
            );
            await emitExpiredConsentEvents();
            await fanOutIntegrationEvents({ limit: 500 });
        };

        const optionalAddition = {
            read: { credentials: { categories: { Gamma: { required: false } } } },
        };

        const connectionIds = async (): Promise<string[]> =>
            (await owner.clients.fullAuth.contracts.getContractConnections({ contractUri })).records
                .map(record => record.profileId)
                .sort();

        it('emits consent_updated with reason expiry_extended per revived consent, with no profile delivery', async () => {
            await expireVersionOne();
            expect(await connectionIds()).toEqual([]);

            const before = (await recordsFor(ownerIntegrationId)).length;
            const result = await owner.clients.fullAuth.contracts.updateConsentFlowContract({
                uri: contractUri,
                changes: { expiresAt: null, contract: optionalAddition },
            });
            expect(result.kind).not.toBe('requires_consent');
            await fanOutIntegrationEvents({ limit: 500 });

            const records = await typesSince(ownerIntegrationId, before);

            expect(records.map(record => record.type)).toEqual([
                'consent_updated',
                'consent_updated',
            ]);
            for (const record of records) expect(record.reason).toBe('expiry_extended');
            expect(records.map(record => record.termsUri).sort()).toEqual([termsA, termsB].sort());
            expect(records.find(record => record.termsUri === termsA)).toMatchObject({
                subject: { profileId: learnerA.profileId },
                externalReferenceId: 'case-501',
                role: 'owner',
            });
            expect(await profileDeliveriesFor(idOf(contractUri), ['consent_updated'])).toBe(0);
            expect(await connectionIds()).toEqual([learnerA.profileId, learnerB.profileId].sort());

            const pending = await run(
                `MATCH (event:ConsentFlowEvent {contractId: $contractId})
                 WHERE event.integrationFanoutPending = true RETURN count(event) AS total`,
                { contractId: idOf(contractUri) }
            );
            expect(Number(pending.records[0]?.get('total'))).toBe(0);
        });

        it('emits nothing for a consent that was not expired', async () => {
            await run(
                `MATCH (contract:ConsentFlowContract {id: $id})-[:HAS_VERSION]->(version:ConsentFlowContractVersion {version: 1})
                 SET contract.expiresAt = $expiresAt, version.expiresAt = $expiresAt`,
                {
                    id: idOf(contractUri),
                    expiresAt: new Date(Date.now() + 60 * 60_000).toISOString(),
                }
            );
            await fanOutIntegrationEvents({ limit: 500 });
            const before = (await recordsFor(ownerIntegrationId)).length;

            await owner.clients.fullAuth.contracts.updateConsentFlowContract({
                uri: contractUri,
                changes: { expiresAt: null, contract: optionalAddition },
            });
            await fanOutIntegrationEvents({ limit: 500 });

            expect(await typesSince(ownerIntegrationId, before)).toEqual([]);
        });

        it('emits nothing when the update still leaves the consent expired', async () => {
            await expireVersionOne(60_000);

            const before = (await recordsFor(ownerIntegrationId)).length;

            await owner.clients.fullAuth.contracts.updateConsentFlowContract({
                uri: contractUri,
                changes: {
                    expiresAt: new Date(Date.now() - 1_000).toISOString(),
                    contract: optionalAddition,
                },
            });
            await fanOutIntegrationEvents({ limit: 500 });

            expect(await typesSince(ownerIntegrationId, before)).toEqual([]);
            expect(await connectionIds()).toEqual([]);
        });
    });

    it('deadline: consent_suspended once per terms with the deadline in the event id', async () => {
        const deadline = new Date(Date.now() + 60 * 60_000).toISOString();
        await owner.clients.fullAuth.contracts.updateConsentFlowContract({
            uri: contractUri,
            changes: { name: 'New request identity' },
            reason: 'Review the new request identity.',
            reconsentDeadline: deadline,
        });
        await fanOutIntegrationEvents({ limit: 500 });

        const before = (await recordsFor(ownerIntegrationId)).length;
        const past = new Date(Date.now() - 60_000).toISOString();

        // Only learner A's deadline has passed.
        await run('MATCH (terms:ConsentFlowTerms {id: $id}) SET terms.reconsentDeadline = $past', {
            id: idOf(termsA),
            past,
        });

        // limit 1 forces the batch loop to run more than once.
        const first = await suspendExpiredConsentFlowTerms(undefined, { limit: 1 });
        expect(first.suspended).toBeGreaterThanOrEqual(1);

        const status = await run(
            'MATCH (terms:ConsentFlowTerms) WHERE terms.id IN $ids RETURN terms.id AS id, terms.status AS status',
            { ids: [idOf(termsA), idOf(termsB)] }
        );
        expect(
            Object.fromEntries(status.records.map(row => [row.get('id'), row.get('status')]))
        ).toEqual({ [idOf(termsA)]: 'suspended', [idOf(termsB)]: 'needs_reconsent' });

        const event = await run('MATCH (event:ConsentFlowEvent {id: $id}) RETURN event', {
            id: `${idOf(termsA)}:suspended:${past}`,
        });
        expect(event.records[0]?.get('event').properties).toMatchObject({
            kind: 'consent_suspended',
            contractId: idOf(contractUri),
            termsId: idOf(termsA),
        });

        await suspendExpiredConsentFlowTerms();
        await fanOutIntegrationEvents({ limit: 500 });

        const records = await typesSince(ownerIntegrationId, before);

        expect(records).toHaveLength(1);
        expect(records[0]).toMatchObject({
            type: 'consent_suspended',
            contractUri,
            termsUri: termsA,
            subject: { profileId: learnerA.profileId },
        });
        expect(records[0]).not.toHaveProperty('reason');
        expect(await profileDeliveriesFor(idOf(contractUri), ['consent_suspended'])).toBe(0);
    });

    it('expiry scan: consent_expired once for terms expiry, without changing the terms status', async () => {
        const before = (await recordsFor(ownerIntegrationId)).length;

        // Nothing has expired yet.
        await emitExpiredConsentEvents();
        await fanOutIntegrationEvents({ limit: 500 });
        expect(await typesSince(ownerIntegrationId, before)).toEqual([]);

        const expiredAt = new Date(Date.now() - 1_000).toISOString();

        await run('MATCH (terms:ConsentFlowTerms {id: $id}) SET terms.expiresAt = $expiresAt', {
            id: idOf(termsA),
            expiresAt: expiredAt,
        });
        // Learner B's terms have an expiry that has not passed yet, so they must not emit.
        await run('MATCH (terms:ConsentFlowTerms {id: $id}) SET terms.expiresAt = $expiresAt', {
            id: idOf(termsB),
            expiresAt: new Date(Date.now() + 60 * 60_000).toISOString(),
        });

        const first = await emitExpiredConsentEvents(undefined, { limit: 1 });
        expect(first.expired).toBeGreaterThanOrEqual(1);

        const terms = await run(
            'MATCH (terms:ConsentFlowTerms {id: $id}) RETURN terms.status AS status, terms.expiredEventFor AS emitted',
            { id: idOf(termsA) }
        );
        expect(terms.records[0]?.get('status')).toBe('live');
        expect(terms.records[0]?.get('emitted')).toEqual([expiredAt]);

        // A second pass finds nothing new for these terms.
        await emitExpiredConsentEvents();
        await fanOutIntegrationEvents({ limit: 500 });

        const records = await typesSince(ownerIntegrationId, before);

        expect(records).toHaveLength(1);
        expect(records[0]).toMatchObject({
            type: 'consent_expired',
            eventId: `${idOf(termsA)}:expired:${expiredAt}`,
            contractUri,
            termsUri: termsA,
            subject: { profileId: learnerA.profileId },
            externalReferenceId: 'case-501',
        });
        expect(await profileDeliveriesFor(idOf(contractUri), ['consent_expired'])).toBe(0);

        // The recipient is told too, without the referrer's reference.
        const recipientRecords = await recordsFor(recipientIntegrationId);
        const expired = recipientRecords.filter(record => record.type === 'consent_expired');

        expect(expired).toHaveLength(1);
        expect(expired[0]).not.toHaveProperty('externalReferenceId');

        // A later, different expiry of the same terms is a new event; repeating it is not.
        const expiredAgainAt = new Date(Date.now() - 500).toISOString();

        await run('MATCH (terms:ConsentFlowTerms {id: $id}) SET terms.expiresAt = $expiresAt', {
            id: idOf(termsA),
            expiresAt: expiredAgainAt,
        });
        await emitExpiredConsentEvents();
        await emitExpiredConsentEvents();
        await fanOutIntegrationEvents({ limit: 500 });

        const again = (await typesSince(ownerIntegrationId, before)).filter(
            record => record.type === 'consent_expired'
        );

        expect(again.map(record => record.eventId)).toEqual([
            `${idOf(termsA)}:expired:${expiredAt}`,
            `${idOf(termsA)}:expired:${expiredAgainAt}`,
        ]);
    });

    it('expiry scan: contract expiry emits consent_expired for every active terms, and skips withdrawn ones', async () => {
        const learnerC = await actor('learner-c');
        const termsC = await consent(learnerC);
        await learnerC.clients.fullAuth.contracts.withdrawConsent({ uri: termsC });
        await fanOutIntegrationEvents({ limit: 500 });

        const before = (await recordsFor(ownerIntegrationId)).length;

        await run(
            `MATCH (contract:ConsentFlowContract {id: $id})-[:HAS_VERSION]->(version:ConsentFlowContractVersion)
             SET contract.expiresAt = $expiresAt, version.expiresAt = $expiresAt`,
            { id: idOf(contractUri), expiresAt: new Date(Date.now() - 1_000).toISOString() }
        );

        // limit 1 forces one statement per terms.
        await emitExpiredConsentEvents(undefined, { limit: 1 });
        await emitExpiredConsentEvents();
        await fanOutIntegrationEvents({ limit: 500 });

        const records = await typesSince(ownerIntegrationId, before);

        expect(records.map(record => record.type)).toEqual(['consent_expired', 'consent_expired']);
        expect(records.map(record => record.termsUri).sort()).toEqual([termsA, termsB].sort());
    });

    describe('version expiry marker', () => {
        const VERSION_WALK = 'accepted.expiresAt = $expiresAt';

        const expireVersionOne = async (expiresAt: string): Promise<void> => {
            await run(
                `MATCH (contract:ConsentFlowContract {id: $id})-[:HAS_VERSION]->(version:ConsentFlowContractVersion {version: 1})
                 SET contract.expiresAt = $expiresAt, version.expiresAt = $expiresAt`,
                { id: idOf(contractUri), expiresAt }
            );
        };

        const markerOf = async (): Promise<unknown> =>
            (
                await run(
                    `MATCH (:ConsentFlowContract {id: $id})-[:HAS_VERSION]->(version:ConsentFlowContractVersion {version: 1})
                     RETURN version.expiryEventsEmittedFor AS marker`,
                    { id: idOf(contractUri) }
                )
            ).records[0]?.get('marker');

        const walks = (spy: ReturnType<typeof vi.spyOn>): number =>
            spy.mock.calls.filter(([query]) => String(query).includes(VERSION_WALK)).length;

        it('skips a version whose events were emitted, and walks it again when its expiry changes', async () => {
            const before = (await recordsFor(ownerIntegrationId)).length;
            const firstExpiry = new Date(Date.now() - 2_000).toISOString();

            await expireVersionOne(firstExpiry);

            const spy = vi.spyOn(neogma.queryRunner, 'run');

            await emitExpiredConsentEvents();
            expect(walks(spy)).toBeGreaterThan(0);
            expect(await markerOf()).toBe(firstExpiry);

            spy.mockClear();
            await emitExpiredConsentEvents();
            await emitExpiredConsentEvents();
            expect(walks(spy)).toBe(0);

            await fanOutIntegrationEvents({ limit: 500 });
            expect(
                (await typesSince(ownerIntegrationId, before)).filter(
                    record => record.type === 'consent_expired'
                )
            ).toHaveLength(2);

            // A different past expiry no longer matches the marker, so it is processed again.
            const secondExpiry = new Date(Date.now() - 1_000).toISOString();

            await expireVersionOne(secondExpiry);
            spy.mockClear();
            await emitExpiredConsentEvents();
            expect(walks(spy)).toBeGreaterThan(0);
            expect(await markerOf()).toBe(secondExpiry);

            await fanOutIntegrationEvents({ limit: 500 });
            expect(
                (await typesSince(ownerIntegrationId, before)).filter(
                    record => record.type === 'consent_expired'
                )
            ).toHaveLength(4);
        });

        it('does not mark a version whose terms walk was cut short, and finishes it on the next pass', async () => {
            const before = (await recordsFor(ownerIntegrationId)).length;
            const expiresAt = new Date(Date.now() - 2_000).toISOString();

            await expireVersionOne(expiresAt);

            // The budget runs out right after the first walk statement (one terms per statement).
            const realNow = Date.now.bind(Date);
            let skewMs = 0;
            let cutShort = true;

            vi.spyOn(Date, 'now').mockImplementation(() => realNow() + skewMs);

            const original = neogma.queryRunner.run.bind(neogma.queryRunner);

            vi.spyOn(neogma.queryRunner, 'run').mockImplementation(async (query, params) => {
                const result = await original(query, params);

                if (cutShort && String(query).includes(VERSION_WALK)) skewMs = 10 * 60_000;

                return result;
            });

            const first = await emitExpiredConsentEvents(undefined, { limit: 1 });

            expect(first.expired).toBe(1);
            expect(await markerOf()).toBeFalsy();

            skewMs = 0;
            cutShort = false;

            const second = await emitExpiredConsentEvents(undefined, { limit: 1 });

            expect(second.expired).toBe(1);
            expect(await markerOf()).toBe(expiresAt);

            await fanOutIntegrationEvents({ limit: 500 });
            expect(
                (await typesSince(ownerIntegrationId, before)).filter(
                    record => record.type === 'consent_expired'
                )
            ).toHaveLength(2);
        });
    });
});
