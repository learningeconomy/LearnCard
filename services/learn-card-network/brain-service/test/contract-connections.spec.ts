import { randomBytes } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { neogma } from '@instance';
import * as notifications from '@helpers/notifications.helpers';
import { getClient, getUser } from './helpers/getClient';
import { normalContract, normalFullTerms } from './helpers/contract';

const run = (query: string, params: Record<string, unknown> = {}) =>
    neogma.queryRunner.run(query, params);

const idOf = (uri: string): string => uri.split(':').at(-1)!;

const actor = async (role: string) => {
    const user = await getUser(randomBytes(32).toString('hex'));
    const profileId = `conn-${role}-${randomBytes(5).toString('hex')}`;
    await user.clients.fullAuth.profile.createProfile({ profileId });

    return { ...user, profileId };
};

type Actor = Awaited<ReturnType<typeof actor>>;

// The first hook also boots the wallet and the database connection, which can be slow.
vi.setConfig({ hookTimeout: 30_000, testTimeout: 30_000 });

describe('getContractConnections', () => {
    let owner: Actor;
    let writer: Actor;
    let recipient: Actor;
    let requester: Actor;
    let stranger: Actor;
    let learners: Actor[];
    let contractUri: string;
    let termsUris: string[];

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

    const setTerms = async (termsUri: string, props: Record<string, unknown>): Promise<void> => {
        await run('MATCH (terms:ConsentFlowTerms {id: $id}) SET terms += $props', {
            id: idOf(termsUri),
            props,
        });
    };

    beforeEach(async () => {
        vi.spyOn(notifications, 'addNotificationToQueue').mockResolvedValue(undefined);

        [owner, writer, recipient, requester, stranger] = await Promise.all([
            actor('owner'),
            actor('writer'),
            actor('recipient'),
            actor('requester'),
            actor('stranger'),
        ]);
        learners = await Promise.all([actor('l0'), actor('l1'), actor('l2'), actor('l3')]);

        contractUri = await owner.clients.fullAuth.contracts.createConsentFlowContract({
            name: 'Connections contract',
            contract: normalContract,
            writers: [writer.profileId],
            recipients: [recipient.profileId, requester.profileId],
        });

        // Learner 0 is referred by a data recipient, learner 1 by the writer.
        await requester.clients.fullAuth.contracts.sendContractRequest({
            contractUri,
            targetProfileId: learners[0]!.profileId,
            externalReferenceId: 'crm-requester',
        });
        await writer.clients.fullAuth.contracts.sendContractRequest({
            contractUri,
            targetProfileId: learners[1]!.profileId,
            externalReferenceId: 'crm-writer',
        });

        termsUris = [];
        for (const learner of learners) termsUris.push(await consent(learner));
    });

    afterEach(() => vi.restoreAllMocks());

    it('requires authentication, the contracts-data:read scope and a data audience role', async () => {
        await expect(
            getClient().contracts.getContractConnections({ contractUri })
        ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        await expect(
            owner.clients.partialAuth.contracts.getContractConnections({ contractUri })
        ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        await expect(
            stranger.clients.fullAuth.contracts.getContractConnections({ contractUri })
        ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        // A writer manages referrals but is not in the data audience.
        await expect(
            writer.clients.fullAuth.contracts.getContractConnections({ contractUri })
        ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        // A consenter is not in the data audience either.
        await expect(
            learners[0]!.clients.fullAuth.contracts.getContractConnections({ contractUri })
        ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        await expect(
            owner.clients.fullAuth.contracts.getContractConnections({
                contractUri: contractUri.replace(idOf(contractUri), 'missing-contract'),
            })
        ).rejects.toMatchObject({ code: 'NOT_FOUND' });

        await expect(
            recipient.clients.fullAuth.contracts.getContractConnections({ contractUri })
        ).resolves.toMatchObject({ hasMore: false });
    });

    it('returns one identifier-only row per current connection, ordered by terms id', async () => {
        const page = await owner.clients.fullAuth.contracts.getContractConnections({
            contractUri,
        });

        expect(page.hasMore).toBe(false);
        expect(page.cursor).toBeUndefined();
        expect(page.records.map(record => record.termsUri)).toEqual(
            [...termsUris].sort((a, b) => (idOf(a) < idOf(b) ? -1 : 1))
        );

        const first = page.records.find(record => record.termsUri === termsUris[0])!;

        expect(first).toMatchObject({
            profileId: learners[0]!.profileId,
            didKey: learners[0]!.learnCard.id.did(),
            status: 'live',
            externalReferenceId: 'crm-requester',
        });
        expect(first.did.startsWith('did:web:')).toBe(true);
        expect(first.did.endsWith(learners[0]!.profileId)).toBe(true);
        expect(typeof first.requestId).toBe('string');
        expect(Number.isNaN(Date.parse(first.updatedAt))).toBe(false);
        expect(Object.keys(first).sort()).toEqual([
            'did',
            'didKey',
            'externalReferenceId',
            'profileId',
            'requestId',
            'status',
            'termsUri',
            'updatedAt',
        ]);

        const unreferred = page.records.find(record => record.termsUri === termsUris[2])!;
        expect(unreferred).not.toHaveProperty('requestId');
        expect(unreferred).not.toHaveProperty('externalReferenceId');
    });

    it('shows a reference only to the owner or to the profile that made the referral', async () => {
        const references = async (caller: Actor) => {
            const page = await caller.clients.fullAuth.contracts.getContractConnections({
                contractUri,
            });

            return Object.fromEntries(
                page.records.map(record => [
                    record.profileId,
                    [typeof record.requestId, record.externalReferenceId],
                ])
            );
        };

        expect(await references(owner)).toMatchObject({
            [learners[0]!.profileId]: ['string', 'crm-requester'],
            [learners[1]!.profileId]: ['string', 'crm-writer'],
        });
        // The requesting recipient sees its own reference and not the writer's.
        expect(await references(requester)).toMatchObject({
            [learners[0]!.profileId]: ['string', 'crm-requester'],
            [learners[1]!.profileId]: ['string', undefined],
        });
        // Another recipient sees no reference at all, only that a request existed.
        expect(await references(recipient)).toMatchObject({
            [learners[0]!.profileId]: ['string', undefined],
            [learners[1]!.profileId]: ['string', undefined],
        });
    });

    it('pages with an opaque cursor and rejects a cursor it did not produce', async () => {
        const seen: string[] = [];
        let cursor: string | undefined;
        let pages = 0;

        do {
            const page = await owner.clients.fullAuth.contracts.getContractConnections({
                contractUri,
                limit: 3,
                cursor,
            });

            seen.push(...page.records.map(record => record.termsUri));
            cursor = page.cursor;
            pages++;
            expect(page.hasMore).toBe(cursor !== undefined);
        } while (cursor);

        expect(pages).toBe(2);
        expect(seen).toEqual([...termsUris].sort((a, b) => (idOf(a) < idOf(b) ? -1 : 1)));

        await expect(
            owner.clients.fullAuth.contracts.getContractConnections({
                contractUri,
                cursor: 'not-a-cursor',
            })
        ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
        await expect(
            owner.clients.fullAuth.contracts.getContractConnections({ contractUri, limit: 201 })
        ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    });

    it('keeps paused and suspended connections, and drops withdrawn and expired ones', async () => {
        await learners[0]!.clients.fullAuth.contracts.withdrawConsent({ uri: termsUris[0]! });
        await setTerms(termsUris[1]!, { status: 'needs_reconsent' });
        await setTerms(termsUris[2]!, { status: 'suspended' });
        await setTerms(termsUris[3]!, { expiresAt: '2000-01-01T00:00:00Z' });

        const page = await owner.clients.fullAuth.contracts.getContractConnections({
            contractUri,
        });

        expect(
            Object.fromEntries(page.records.map(record => [record.profileId, record.status]))
        ).toEqual({
            [learners[1]!.profileId]: 'needs_reconsent',
            [learners[2]!.profileId]: 'suspended',
        });

        // Blank expiry means none; a date that cannot be parsed counts as expired and never fails.
        await setTerms(termsUris[3]!, { expiresAt: '   ' });
        await setTerms(termsUris[2]!, { expiresAt: 'not-a-date' });

        const again = await owner.clients.fullAuth.contracts.getContractConnections({
            contractUri,
            limit: 1,
        });
        const all = [...again.records];
        let cursor = again.cursor;

        while (cursor) {
            const next = await owner.clients.fullAuth.contracts.getContractConnections({
                contractUri,
                limit: 1,
                cursor,
            });
            all.push(...next.records);
            cursor = next.cursor;
        }

        expect(all.map(record => record.profileId).sort()).toEqual(
            [learners[1]!.profileId, learners[3]!.profileId].sort()
        );
    });

    it('has no connections once the contract has expired or is retired', async () => {
        await run('MATCH (contract:ConsentFlowContract {id: $id}) SET contract.expiresAt = $at', {
            id: idOf(contractUri),
            at: '2000-01-01T00:00:00.000Z',
        });
        await expect(
            owner.clients.fullAuth.contracts.getContractConnections({ contractUri })
        ).resolves.toEqual({ records: [], hasMore: false });

        await run('MATCH (contract:ConsentFlowContract {id: $id}) REMOVE contract.expiresAt', {
            id: idOf(contractUri),
        });
        await expect(
            owner.clients.fullAuth.contracts.getContractConnections({ contractUri })
        ).resolves.toMatchObject({ records: expect.arrayContaining([expect.anything()]) });

        await owner.clients.fullAuth.contracts.deleteConsentFlowContract({ uri: contractUri });
        await expect(
            recipient.clients.fullAuth.contracts.getContractConnections({ contractUri })
        ).resolves.toEqual({ records: [], hasMore: false });
    });
});
