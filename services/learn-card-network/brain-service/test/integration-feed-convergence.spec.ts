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
    const reference = async (): Promise<Connections> => {
        const state: Connections = {};

        for (const learner of learners) {
            const data = await owner.clients.fullAuth.contracts.getConsentedDataForDid({
                did: learner.learnCard.id.did(),
            });
            const record = data.records.find(entry => entry.contractUri === contractUri);

            if (record?.status) state[learner.profileId] = record.status;
        }

        return Object.fromEntries(Object.entries(state).sort());
    };

    const consent = async (learner: Actor): Promise<string> => {
        const { termsUri } = await learner.clients.fullAuth.contracts.consentToContract({
            contractUri,
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
});
