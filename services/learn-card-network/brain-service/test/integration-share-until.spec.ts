import { randomBytes } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ConsentFlowTerms } from '@learncard/types';

import { neogma } from '@instance';
import * as notifications from '@helpers/notifications.helpers';
import { fanOutIntegrationEvents, toIntegrationEvent } from '@helpers/integration-events.helpers';
import {
    backfillNextShareUntil,
    emitShareUntilPassedEvents,
    runConsentFlowDeadlinePass,
} from '@helpers/consentflow-deadline.helpers';

import { getUser } from './helpers/getClient';
import { normalContract, normalFullTerms } from './helpers/contract';

const run = (query: string, params: Record<string, unknown> = {}) =>
    neogma.queryRunner.run(query, params);

const idOf = (uri: string): string => uri.split(':').at(-1)!;

const actor = async (role: string) => {
    const user = await getUser(randomBytes(32).toString('hex'));
    const profileId = `until-${role}-${randomBytes(5).toString('hex')}`;
    await user.clients.fullAuth.profile.createProfile({ profileId });

    return { ...user, profileId };
};

type Actor = Awaited<ReturnType<typeof actor>>;

const hoursFromNow = (hours: number): string =>
    new Date(Date.now() + hours * 3_600_000).toISOString();

const termsWith = (dates: { Achievement?: string; ID?: string }): ConsentFlowTerms => {
    const terms = structuredClone(normalFullTerms);

    if (dates.Achievement)
        terms.read.credentials.categories.Achievement!.shareUntil = dates.Achievement;
    if (dates.ID) terms.read.credentials.categories.ID!.shareUntil = dates.ID;

    return terms;
};

const nextShareUntilOf = async (termsUri: string): Promise<string | null> => {
    const result = await run(
        'MATCH (terms:ConsentFlowTerms {id: $id}) RETURN terms.nextShareUntil AS next',
        { id: idOf(termsUri) }
    );

    return result.records[0]?.get('next') ?? null;
};

/** Moves one category's stored date (and the derived field) into the past, as if time had passed. */
const setStoredDate = async (
    termsUri: string,
    category: string,
    shareUntil: string,
    nextShareUntil: string | null
): Promise<void> => {
    await run(
        `MATCH (terms:ConsentFlowTerms {id: $id})
         SET terms.\`terms.read.credentials.categories.${category}.shareUntil\` = $shareUntil,
             terms.nextShareUntil = $nextShareUntil`,
        { id: idOf(termsUri), shareUntil, nextShareUntil }
    );
};

vi.setConfig({ hookTimeout: 30_000, testTimeout: 60_000 });

describe('share-until events', () => {
    let owner: Actor;
    let learner: Actor;
    let integrationId: string;
    let contractUri: string;

    const feed = async () => {
        const result = await run(
            `MATCH (record:IntegrationEvent {integrationId: $integrationId})
             RETURN record ORDER BY record.sequence`,
            { integrationId }
        );

        return result.records.map(row => toIntegrationEvent(row.get('record').properties));
    };

    const shareUntilEvents = async () =>
        (await feed()).filter(
            record => record.type === 'consent_updated' && record.reason === 'share_until_passed'
        );

    const consent = async (terms: ConsentFlowTerms): Promise<string> => {
        const { audienceVersion } = await owner.clients.fullAuth.contracts.getConsentFlowContract({
            uri: contractUri,
        });
        const { termsUri } = await learner.clients.fullAuth.contracts.consentToContract({
            contractUri,
            terms,
            audienceVersion,
        });

        return termsUri;
    };

    const process = async (now?: string): Promise<number> => {
        const { shareUntilPassed } = await emitShareUntilPassedEvents(now);
        await fanOutIntegrationEvents({ limit: 500 });

        return shareUntilPassed;
    };

    beforeEach(async () => {
        vi.spyOn(notifications, 'addNotificationToQueue').mockResolvedValue(undefined);

        [owner, learner] = await Promise.all([actor('owner'), actor('learner')]);

        integrationId = await owner.clients.fullAuth.integrations.addIntegration({
            name: 'Share until feed',
            whitelistedDomains: [],
        });
        await owner.clients.fullAuth.integrations.updateIntegration({
            id: integrationId,
            updates: { contractEventsEnabled: true },
        });
        contractUri = await owner.clients.fullAuth.contracts.createConsentFlowContract({
            name: 'Share until contract',
            contract: normalContract,
        });
    });

    afterEach(() => vi.restoreAllMocks());

    it('emits one consent_updated when a category date passes and keeps the connection live', async () => {
        const termsUri = await consent(termsWith({ Achievement: hoursFromNow(1) }));

        expect(await nextShareUntilOf(termsUri)).not.toBeNull();

        // Nothing has passed yet.
        expect(await process()).toBe(0);
        expect(await shareUntilEvents()).toEqual([]);

        const passed = new Date(Date.now() - 60_000).toISOString();
        await setStoredDate(termsUri, 'Achievement', passed, passed);

        expect(await process()).toBe(1);

        const events = await shareUntilEvents();

        expect(events).toHaveLength(1);
        expect(events[0]).toMatchObject({
            type: 'consent_updated',
            reason: 'share_until_passed',
            contractUri,
            termsUri,
            role: 'owner',
            subject: { profileId: learner.profileId },
        });

        const stored = await run('MATCH (event:ConsentFlowEvent {id: $id}) RETURN event', {
            id: `${idOf(termsUri)}:share_until:Achievement:${passed}`,
        });

        expect(stored.records[0]?.get('event').properties).toMatchObject({
            kind: 'consent_updated',
            reason: 'share_until_passed',
            contractId: idOf(contractUri),
            termsId: idOf(termsUri),
        });

        const deliveries = await run(
            `MATCH (:ConsentFlowEvent {contractId: $contractId, reason: 'share_until_passed'})-[:HAS_DELIVERY]->(d)
             RETURN count(d) AS total`,
            { contractId: idOf(contractUri) }
        );

        expect(Number(deliveries.records[0]?.get('total'))).toBe(0);
        expect(await nextShareUntilOf(termsUri)).toBeNull();

        // Running again emits nothing.
        expect(await process()).toBe(0);
        expect(await shareUntilEvents()).toHaveLength(1);

        // The connection is still live.
        const connections = await owner.clients.fullAuth.contracts.getContractConnections({
            contractUri,
        });

        expect(
            connections.records.find(record => record.profileId === learner.profileId)
        ).toMatchObject({ status: 'live' });

        // Only the passed category stops being returned.
        const data = await owner.clients.fullAuth.contracts.getConsentedDataForContract({
            uri: contractUri,
            query: {},
        });

        expect(data.records).toHaveLength(1);
        expect(data.records[0]!.credentials.categories.Achievement).toEqual([]);
        expect(data.records[0]!.credentials.categories.ID).toEqual(['id1', 'id2']);
    });

    it('emits one event per category date and moves nextShareUntil forward', async () => {
        const first = hoursFromNow(1);
        const second = hoursFromNow(2);
        const termsUri = await consent(termsWith({ Achievement: first, ID: second }));

        expect(await nextShareUntilOf(termsUri)).toBe(first);

        const pastFirst = new Date(Date.now() - 120_000).toISOString();
        await setStoredDate(termsUri, 'Achievement', pastFirst, pastFirst);

        expect(await process()).toBe(1);
        expect(await nextShareUntilOf(termsUri)).toBe(second);
        expect((await shareUntilEvents()).map(record => record.termsUri)).toEqual([termsUri]);

        // Not due yet: nothing more.
        expect(await process()).toBe(0);

        const pastSecond = new Date(Date.now() - 60_000).toISOString();
        await setStoredDate(termsUri, 'ID', pastSecond, pastSecond);

        expect(await process()).toBe(1);
        expect(await nextShareUntilOf(termsUri)).toBeNull();
        expect(await shareUntilEvents()).toHaveLength(2);

        const ids = await run(
            `MATCH (event:ConsentFlowEvent {termsId: $id, reason: 'share_until_passed'})
             RETURN event.id AS id ORDER BY id`,
            { id: idOf(termsUri) }
        );

        expect(ids.records.map(row => row.get('id'))).toEqual(
            [
                `${idOf(termsUri)}:share_until:Achievement:${pastFirst}`,
                `${idOf(termsUri)}:share_until:ID:${pastSecond}`,
            ].sort()
        );
    });

    it('can be driven with an injected time and emits both dates passed at once', async () => {
        const termsUri = await consent(
            termsWith({ Achievement: hoursFromNow(1), ID: hoursFromNow(2) })
        );

        expect(await process(hoursFromNow(3))).toBe(2);
        expect(await nextShareUntilOf(termsUri)).toBeNull();
        expect(await process(hoursFromNow(3))).toBe(0);
    });

    it('emits nothing for withdrawn terms and clears the field', async () => {
        const termsUri = await consent(termsWith({ Achievement: hoursFromNow(1) }));

        await learner.clients.fullAuth.contracts.withdrawConsent({ uri: termsUri });
        expect(await nextShareUntilOf(termsUri)).toBeNull();

        // Even if the field were still present, a withdrawn consent must not emit.
        const passed = new Date(Date.now() - 60_000).toISOString();
        await setStoredDate(termsUri, 'Achievement', passed, passed);

        expect(await process()).toBe(0);
        expect(await nextShareUntilOf(termsUri)).toBeNull();
        expect(await shareUntilEvents()).toEqual([]);
    });

    it('emits nothing for an expired consent', async () => {
        const termsUri = await consent(termsWith({ Achievement: hoursFromNow(1) }));
        const passed = new Date(Date.now() - 60_000).toISOString();

        await setStoredDate(termsUri, 'Achievement', passed, passed);
        await run('MATCH (terms:ConsentFlowTerms {id: $id}) SET terms.expiresAt = $expiresAt', {
            id: idOf(termsUri),
            expiresAt: new Date(Date.now() - 1_000).toISOString(),
        });

        expect(await process()).toBe(0);
        expect(await nextShareUntilOf(termsUri)).toBeNull();
    });

    it('updating the terms recomputes nextShareUntil', async () => {
        const termsUri = await consent(termsWith({ Achievement: hoursFromNow(5) }));
        const sooner = hoursFromNow(1);

        await learner.clients.fullAuth.contracts.updateConsentedContractTerms({
            uri: termsUri,
            terms: termsWith({ Achievement: hoursFromNow(5), ID: sooner }),
        });
        expect(await nextShareUntilOf(termsUri)).toBe(sooner);

        await learner.clients.fullAuth.contracts.updateConsentedContractTerms({
            uri: termsUri,
            terms: termsWith({}),
        });
        expect(await nextShareUntilOf(termsUri)).toBeNull();

        const later = hoursFromNow(9);

        await learner.clients.fullAuth.contracts.updateConsentedContractTerms({
            uri: termsUri,
            terms: termsWith({ Achievement: later }),
        });
        expect(await nextShareUntilOf(termsUri)).toBe(later);
    });

    it('still reports a due date when the terms are updated before the job runs', async () => {
        const termsUri = await consent(
            termsWith({ Achievement: hoursFromNow(5), ID: hoursFromNow(9) })
        );
        const passed = new Date(Date.now() - 60_000).toISOString();

        // The Achievement date passes, and the learner edits the terms before the job has run.
        await setStoredDate(termsUri, 'Achievement', passed, passed);
        await learner.clients.fullAuth.contracts.updateConsentedContractTerms({
            uri: termsUri,
            terms: termsWith({ Achievement: passed, ID: hoursFromNow(9) }),
        });
        expect(await nextShareUntilOf(termsUri)).toBe(passed);

        expect(await process()).toBe(1);
        expect(await shareUntilEvents()).toHaveLength(1);
        expect(await nextShareUntilOf(termsUri)).not.toBe(passed);
        expect(await process()).toBe(0);
    });

    it('backfills existing terms in bounded batches and stops once done', async () => {
        const termsUri = await consent(termsWith({ Achievement: hoursFromNow(4) }));
        const expected = await nextShareUntilOf(termsUri);

        expect(expected).not.toBeNull();

        // Simulate a consent written before the field existed, and a fresh job state.
        await run('MATCH (terms:ConsentFlowTerms {id: $id}) REMOVE terms.nextShareUntil', {
            id: idOf(termsUri),
        });
        await run("MATCH (state:ConsentFlowJobState {id: 'share-until-backfill-v1'}) DELETE state");

        let done = false;

        for (let step = 0; step < 500 && !done; step++) {
            // budgetMs 0 stops after one batch of two terms.
            ({ done } = await backfillNextShareUntil(undefined, { limit: 2, budgetMs: 0 }));
        }

        expect(done).toBe(true);
        expect(await nextShareUntilOf(termsUri)).toBe(expected);

        const state = await run(
            "MATCH (state:ConsentFlowJobState {id: 'share-until-backfill-v1'}) RETURN state.completedAt AS completedAt"
        );

        expect(typeof state.records[0]?.get('completedAt')).toBe('string');

        // A finished backfill is not walked again.
        await run('MATCH (terms:ConsentFlowTerms {id: $id}) REMOVE terms.nextShareUntil', {
            id: idOf(termsUri),
        });

        expect(await backfillNextShareUntil()).toEqual({ backfilled: 0, done: true });
        expect(await nextShareUntilOf(termsUri)).toBeNull();
    });

    it('does not backfill dates that already passed, and the full pass reports the count', async () => {
        const termsUri = await consent(termsWith({ Achievement: hoursFromNow(4) }));
        const passed = new Date(Date.now() - 60_000).toISOString();

        await setStoredDate(termsUri, 'Achievement', passed, null);
        await run("MATCH (state:ConsentFlowJobState {id: 'share-until-backfill-v1'}) DELETE state");

        for (let step = 0; step < 500; step++) {
            if ((await backfillNextShareUntil(undefined, { limit: 2, budgetMs: 0 })).done) break;
        }

        expect(await nextShareUntilOf(termsUri)).toBeNull();

        const summary = await runConsentFlowDeadlinePass();

        expect(summary).toEqual(
            expect.objectContaining({ suspended: expect.any(Number), shareUntilPassed: 0 })
        );
        expect(await shareUntilEvents()).toEqual([]);
    });
});
