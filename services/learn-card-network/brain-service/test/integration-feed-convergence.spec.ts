import { randomBytes } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { IntegrationEvent } from '@learncard/types';

import { neogma } from '@instance';
import * as notifications from '@helpers/notifications.helpers';
import {
    fanOutIntegrationEvents,
    purgeExpiredIntegrationEvents,
} from '@helpers/integration-events.helpers';
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
    const profileId = `sync-${role}-${randomBytes(5).toString('hex')}`;
    await user.clients.fullAuth.profile.createProfile({ profileId });

    return { ...user, profileId };
};

type Actor = Awaited<ReturnType<typeof actor>>;
type Connections = Record<string, string>;

/**
 * A partner system that keeps its own copy of a contract's connections. It only ever calls
 * getIntegrationEvents and getContractConnections, following the documented pattern: read
 * latestCursor, take the snapshot, follow the feed, and take a new snapshot on CURSOR_EXPIRED.
 */
const createFeedOnlyClient = (owner: Actor, integrationId: string, contractUri: string) => {
    const { integrations, contracts } = owner.clients.fullAuth;
    const connections = new Map<string, string>();
    let cursor: string | undefined;
    let snapshots = 0;
    let replayed = 0;

    const snapshot = async (): Promise<void> => {
        const { latestCursor } = await integrations.getIntegrationEvents({ id: integrationId });
        let page: string | undefined;

        connections.clear();

        do {
            // A small page size makes the snapshot use its cursor.
            const result = await contracts.getContractConnections({
                contractUri,
                limit: 2,
                cursor: page,
            });

            for (const record of result.records) connections.set(record.profileId, record.status);
            page = result.cursor;
        } while (page);

        cursor = latestCursor;
        snapshots++;
    };

    const apply = (record: IntegrationEvent): void => {
        if (record.contractUri !== contractUri) return;

        const profileId = record.subject?.profileId;

        if (record.type === 'contract_retired') connections.clear();
        if (!profileId) return;

        if (record.type === 'consent_created' || record.type === 'consent_updated') {
            connections.set(profileId, 'live');
        } else if (record.type === 'consent_withdrawn' || record.type === 'consent_expired') {
            connections.delete(profileId);
        } else if (record.type === 'consent_paused' && connections.has(profileId)) {
            connections.set(profileId, 'needs_reconsent');
        } else if (record.type === 'consent_suspended' && connections.has(profileId)) {
            connections.set(profileId, 'suspended');
        }
    };

    /** Catches up after an outage of any length. */
    const sync = async (): Promise<void> => {
        if (!cursor) return snapshot();

        try {
            for (;;) {
                const result = await integrations.getIntegrationEvents({
                    id: integrationId,
                    since: cursor,
                    limit: 3,
                });

                result.records.forEach(apply);
                replayed += result.records.length;
                cursor = result.cursor;

                if (!result.hasMore) return;
            }
        } catch (error) {
            if (!(error instanceof Error) || !error.message.startsWith('CURSOR_EXPIRED')) {
                throw error;
            }

            await snapshot();
        }
    };

    return {
        sync,
        state: (): Connections => Object.fromEntries([...connections].sort()),
        stats: () => ({ snapshots, replayed }),
    };
};

// The first hook also boots the wallet and the database connection, which can be slow.
vi.setConfig({ hookTimeout: 60_000, testTimeout: 120_000 });

describe('a client that uses only the feed and the snapshot', () => {
    let owner: Actor;
    let learners: Actor[];
    let integrationId: string;
    let contractUri: string;

    /** What the existing data-for-did read says about every learner, for this contract. */
    const reference = async (uri: string = contractUri): Promise<Connections> => {
        const state: Connections = {};

        for (const learner of learners) {
            const data = await owner.clients.fullAuth.contracts.getConsentedDataForDid({
                did: learner.learnCard.id.did(),
            });
            const record = data.records.find(entry => entry.contractUri === uri);

            if (record?.status) state[learner.profileId] = record.status;
        }

        return Object.fromEntries(Object.entries(state).sort());
    };

    const consent = async (learner: Actor, uri: string = contractUri): Promise<string> => {
        const { termsUri } = await learner.clients.fullAuth.contracts.consentToContract({
            contractUri: uri,
            terms: normalFullTerms,
        });

        return termsUri;
    };

    const setTerms = async (termsUri: string, props: Record<string, unknown>): Promise<void> => {
        await run('MATCH (terms:ConsentFlowTerms {id: $id}) SET terms += $props', {
            id: idOf(termsUri),
            props,
        });
    };

    /** Lets time pass for one version of a contract: its expiry date is now in the past. */
    const expireVersion = async (uri: string, version: number): Promise<void> => {
        const expiresAt = new Date(Date.now() - 1_000).toISOString();

        // The contract node mirrors the newest version, as a contract update would leave it.
        await run(
            `MATCH (contract:ConsentFlowContract {id: $id})-[:HAS_VERSION]->(version:ConsentFlowContractVersion {version: $version})
             SET version.expiresAt = $expiresAt
             FOREACH (_ IN CASE WHEN coalesce(contract.currentVersion, 1) = $version THEN [1] ELSE [] END |
                 SET contract.expiresAt = $expiresAt)`,
            { id: idOf(uri), version, expiresAt }
        );
    };

    /** What the scheduled jobs do every minute: deadlines, expiry, then integration fan-out. */
    const runJobs = async (): Promise<void> => {
        await suspendExpiredConsentFlowTerms();
        await emitExpiredConsentEvents();
        await fanOutIntegrationEvents({ limit: 500 });
    };

    beforeEach(async () => {
        vi.spyOn(notifications, 'addNotificationToQueue').mockResolvedValue(undefined);

        owner = await actor('owner');
        learners = await Promise.all(['l0', 'l1', 'l2', 'l3', 'l4', 'l5'].map(role => actor(role)));
        integrationId = await owner.clients.fullAuth.integrations.addIntegration({
            name: 'Feed-only partner',
            whitelistedDomains: [],
        });
        await owner.clients.fullAuth.integrations.updateIntegration({
            id: integrationId,
            updates: { contractEventsEnabled: true },
        });
        contractUri = await owner.clients.fullAuth.contracts.createConsentFlowContract({
            name: 'Convergence contract',
            contract: normalContract,
        });
    });

    afterEach(() => vi.restoreAllMocks());

    it('ends with the same connections as data-for-did after short and long outages', async () => {
        const [l0, l1, l2, l3, l4, l5] = learners as [Actor, Actor, Actor, Actor, Actor, Actor];
        const terms: string[] = [];

        for (const learner of [l0, l1, l2, l3, l4]) terms.push(await consent(learner));
        await runJobs();

        const client = createFeedOnlyClient(owner, integrationId, contractUri);

        await client.sync();
        expect(client.stats()).toEqual({ snapshots: 1, replayed: 0 });
        expect(client.state()).toEqual(await reference());
        expect(Object.keys(client.state())).toHaveLength(5);

        // ---- Outage shorter than retention: every kind of change happens while offline. ----

        // Withdrawal.
        await l0.clients.fullAuth.contracts.withdrawConsent({ uri: terms[0]! });
        // Expiry of the consent itself. The status stays live; only the date has passed.
        await setTerms(terms[1]!, { expiresAt: new Date(Date.now() - 1_000).toISOString() });
        await runJobs();
        // Re-consent pause for everyone still live (including the expired terms).
        await owner.clients.fullAuth.contracts.updateConsentFlowContract({
            uri: contractUri,
            changes: { name: 'Convergence contract, new identity' },
            reason: 'Review the new request identity.',
            reconsentDeadline: new Date(Date.now() + 60 * 60_000).toISOString(),
        });
        // One learner accepts the new version.
        await l2.clients.fullAuth.contracts.updateConsentedContractTerms({
            uri: terms[2]!,
            terms: normalFullTerms,
            acceptVersion: 2,
        });
        // One learner misses the deadline and is suspended.
        await setTerms(terms[3]!, {
            reconsentDeadline: new Date(Date.now() - 60_000).toISOString(),
        });
        await runJobs();

        await client.sync();

        expect(client.state()).toEqual({
            [l2.profileId]: 'live',
            [l3.profileId]: 'suspended',
            [l4.profileId]: 'needs_reconsent',
        });
        expect(client.state()).toEqual(await reference());
        // It caught up by replaying the feed, not by taking another snapshot.
        expect(client.stats().snapshots).toBe(1);
        expect(client.stats().replayed).toBeGreaterThanOrEqual(6);

        // ---- Outage longer than retention: the records it missed are gone. ----

        await consent(l5);
        await l4.clients.fullAuth.contracts.withdrawConsent({ uri: terms[4]! });
        await runJobs();

        await run(
            `MATCH (record:IntegrationEvent {integrationId: $integrationId})
             SET record.purgeAt = '2020-01-01T00:00:00.000Z'`,
            { integrationId }
        );
        expect((await purgeExpiredIntegrationEvents()).deleted).toBeGreaterThanOrEqual(2);

        await client.sync();

        // CURSOR_EXPIRED made it take a new snapshot.
        expect(client.stats().snapshots).toBe(2);
        expect(client.state()).toEqual({
            [l2.profileId]: 'live',
            [l3.profileId]: 'suspended',
            [l5.profileId]: 'live',
        });
        expect(client.state()).toEqual(await reference());

        // ---- Contract retirement, followed from the cursor of the new snapshot. ----

        await owner.clients.fullAuth.contracts.deleteConsentFlowContract({ uri: contractUri });
        await runJobs();

        const replayedBefore = client.stats().replayed;

        await client.sync();

        expect(client.stats().snapshots).toBe(2);
        // contract_retired, plus one consent_withdrawn per terms the retirement withdrew: the
        // three connections and the expired terms, whose status was still active.
        expect(client.stats().replayed - replayedBefore).toBe(5);
        expect(client.state()).toEqual({});
        expect(await reference()).toEqual({});

        // A client that starts after retirement sees the same thing from the snapshot alone.
        const late = createFeedOnlyClient(owner, integrationId, contractUri);

        await late.sync();
        expect(late.state()).toEqual({});
    });

    it('keeps an expired consent out when a breaking update and its deadline come after the expiry', async () => {
        const [l0, l1] = learners as [Actor, Actor, Actor, Actor, Actor, Actor];
        const termsL0 = await consent(l0);
        const termsL1 = await consent(l1);

        await runJobs();

        const client = createFeedOnlyClient(owner, integrationId, contractUri);
        const expectEveryoneAgrees = async (expected: Connections): Promise<void> => {
            const late = createFeedOnlyClient(owner, integrationId, contractUri);

            await client.sync();
            await late.sync();

            expect(await reference()).toEqual(expected);
            expect(client.state()).toEqual(expected);
            expect(late.state()).toEqual(expected);
        };

        await client.sync();
        await expectEveryoneAgrees({ [l0.profileId]: 'live', [l1.profileId]: 'live' });

        // l0's consent expires (consent_expired); the status stays live.
        await setTerms(termsL0, { expiresAt: new Date(Date.now() - 1_000).toISOString() });
        await runJobs();
        await expectEveryoneAgrees({ [l1.profileId]: 'live' });

        // A breaking update pauses every live terms, including the expired one: the feed carries
        // consent_paused for l0, which the client ignores because it holds no such connection.
        await owner.clients.fullAuth.contracts.updateConsentFlowContract({
            uri: contractUri,
            changes: { name: 'Convergence contract, new identity' },
            reason: 'Review the new request identity.',
            reconsentDeadline: new Date(Date.now() + 60 * 60_000).toISOString(),
        });
        await runJobs();

        const paused = await run(
            `MATCH (event:ConsentFlowEvent {kind: 'consent_paused', termsId: $id}) RETURN count(event) AS total`,
            { id: idOf(termsL0) }
        );

        expect(Number(paused.records[0]?.get('total'))).toBe(1);
        await expectEveryoneAgrees({ [l1.profileId]: 'needs_reconsent' });

        // The re-consent deadline passes for both: consent_suspended for l0 is ignored as well.
        const passed = new Date(Date.now() - 60_000).toISOString();

        await setTerms(termsL0, { reconsentDeadline: passed });
        await setTerms(termsL1, { reconsentDeadline: passed });
        await runJobs();

        const suspended = await run(
            `MATCH (event:ConsentFlowEvent {kind: 'consent_suspended', termsId: $id}) RETURN count(event) AS total`,
            { id: idOf(termsL0) }
        );

        expect(Number(suspended.records[0]?.get('total'))).toBe(1);
        await expectEveryoneAgrees({ [l1.profileId]: 'suspended' });
        expect(client.stats().snapshots).toBe(1);
    });

    it('follows the accepted version when a contract update changed the expiry', async () => {
        const [l0, l1, l2, l3] = learners as [Actor, Actor, Actor, Actor, Actor, Actor];
        const inOneHour = new Date(Date.now() + 60 * 60_000).toISOString();
        const inTwoHours = new Date(Date.now() + 2 * 60 * 60_000).toISOString();

        // ---- Contract A: version 1 expires, version 2 expires later. ----
        const contractA = await owner.clients.fullAuth.contracts.createConsentFlowContract({
            name: 'Expiry moved later',
            contract: normalContract,
            expiresAt: inOneHour,
        });
        const termsA: string[] = [];

        for (const learner of [l0, l1, l2]) termsA.push(await consent(learner, contractA));

        // ---- Contract B: version 1 never expires, version 2 does. ----
        const contractB = await owner.clients.fullAuth.contracts.createConsentFlowContract({
            name: 'Expiry added',
            contract: normalContract,
        });

        await consent(l3, contractB);
        await runJobs();

        const clientA = createFeedOnlyClient(owner, integrationId, contractA);
        const clientB = createFeedOnlyClient(owner, integrationId, contractB);

        await clientA.sync();
        await clientB.sync();
        expect(Object.keys(clientA.state())).toHaveLength(3);
        expect(clientA.state()).toEqual(await reference(contractA));
        expect(clientB.state()).toEqual({ [l3.profileId]: 'live' });
        expect(clientB.state()).toEqual(await reference(contractB));

        // Both contracts get a version 2 with a different expiry; everyone must re-consent.
        await owner.clients.fullAuth.contracts.updateConsentFlowContract({
            uri: contractA,
            changes: { name: 'Expiry moved later, new identity', expiresAt: inTwoHours },
            reason: 'Review the new request identity.',
            reconsentDeadline: inTwoHours,
        });
        await owner.clients.fullAuth.contracts.updateConsentFlowContract({
            uri: contractB,
            changes: { name: 'Expiry added, new identity', expiresAt: inOneHour },
            reason: 'Review the new request identity.',
            reconsentDeadline: inTwoHours,
        });
        // Only l0 accepts version 2 of contract A. l1, l2 and l3 keep awaiting re-consent.
        await l0.clients.fullAuth.contracts.updateConsentedContractTerms({
            uri: termsA[0]!,
            terms: normalFullTerms,
            acceptVersion: 2,
        });
        await runJobs();
        await clientA.sync();
        await clientB.sync();

        expect(clientA.state()).toEqual({
            [l0.profileId]: 'live',
            [l1.profileId]: 'needs_reconsent',
            [l2.profileId]: 'needs_reconsent',
        });
        expect(clientA.state()).toEqual(await reference(contractA));
        expect(clientB.state()).toEqual({ [l3.profileId]: 'needs_reconsent' });
        expect(clientB.state()).toEqual(await reference(contractB));

        // ---- Version 1 of contract A expires. The contract itself (version 2) has not. ----
        await expireVersion(contractA, 1);
        // ---- Version 2 of contract B expires. l3 accepted version 1, which never expires. ----
        await expireVersion(contractB, 2);
        await runJobs();
        await clientA.sync();
        await clientB.sync();

        // data-for-did judges each consenter by the version they accepted.
        expect(await reference(contractA)).toEqual({ [l0.profileId]: 'live' });
        expect(await reference(contractB)).toEqual({ [l3.profileId]: 'needs_reconsent' });
        // The feed says the same ...
        expect(clientA.state()).toEqual(await reference(contractA));
        expect(clientB.state()).toEqual(await reference(contractB));
        expect(clientA.stats().snapshots).toBe(1);
        expect(clientB.stats().snapshots).toBe(1);

        // ... and so does a snapshot taken now.
        const lateA = createFeedOnlyClient(owner, integrationId, contractA);
        const lateB = createFeedOnlyClient(owner, integrationId, contractB);

        await lateA.sync();
        await lateB.sync();
        expect(lateA.state()).toEqual(await reference(contractA));
        expect(lateB.state()).toEqual(await reference(contractB));

        // ---- l1, whose consent expired with version 1, renews it by accepting version 2. ----
        await l1.clients.fullAuth.contracts.updateConsentedContractTerms({
            uri: termsA[1]!,
            terms: normalFullTerms,
            acceptVersion: 2,
        });
        await runJobs();
        await clientA.sync();
        await lateA.sync();

        expect(await reference(contractA)).toEqual({
            [l0.profileId]: 'live',
            [l1.profileId]: 'live',
        });
        expect(clientA.state()).toEqual(await reference(contractA));
        expect(lateA.state()).toEqual(await reference(contractA));

        // ---- Version 2 of contract A expires too: nobody is left. l1 expires a second time,
        // so its terms must emit consent_expired again or the feed would keep it live. ----
        await expireVersion(contractA, 2);
        await runJobs();
        await clientA.sync();
        await lateA.sync();

        const l1Expiries = await run(
            `MATCH (event:ConsentFlowEvent {kind: 'consent_expired', termsId: $termsId})
             RETURN count(event) AS total`,
            { termsId: idOf(termsA[1]!) }
        );

        expect(Number(l1Expiries.records[0]?.get('total'))).toBe(2);
        expect(clientA.stats().snapshots).toBe(1);

        expect(await reference(contractA)).toEqual({});
        expect(clientA.state()).toEqual({});
        expect(lateA.state()).toEqual({});
    });

    it('brings a consent back when a non-breaking update removes the expiry it had passed', async () => {
        const [l0, l1] = learners as [Actor, Actor, Actor, Actor, Actor, Actor];
        const contract = await owner.clients.fullAuth.contracts.createConsentFlowContract({
            name: 'Expiry removed',
            contract: normalContract,
            expiresAt: new Date(Date.now() + 60 * 60_000).toISOString(),
        });

        await consent(l0, contract);
        await consent(l1, contract);
        await runJobs();

        const client = createFeedOnlyClient(owner, integrationId, contract);

        await client.sync();
        expect(client.state()).toEqual(await reference(contract));
        expect(Object.keys(client.state())).toHaveLength(2);

        // Version 1 expires: both consents are expired, their status stays live.
        await expireVersion(contract, 1);
        await runJobs();
        await client.sync();

        expect(await reference(contract)).toEqual({});
        expect(client.state()).toEqual({});

        // An optional addition does not need consent, so both move to version 2, which has no
        // expiry. The data read returns them again, and the feed must say so.
        const result = await owner.clients.fullAuth.contracts.updateConsentFlowContract({
            uri: contract,
            changes: {
                expiresAt: null,
                contract: { read: { credentials: { categories: { Gamma: { required: false } } } } },
            },
        });

        expect(result.kind).not.toBe('requires_consent');
        await runJobs();
        await client.sync();

        expect(await reference(contract)).toEqual({
            [l0.profileId]: 'live',
            [l1.profileId]: 'live',
        });
        expect(client.state()).toEqual(await reference(contract));
        expect(client.stats().snapshots).toBe(1);

        const late = createFeedOnlyClient(owner, integrationId, contract);

        await late.sync();
        expect(late.state()).toEqual(await reference(contract));
    });
});
