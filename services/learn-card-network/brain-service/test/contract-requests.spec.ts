import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createServer } from 'node:http';
import * as runtime from '@environment';
import * as learnCardHelpers from '@helpers/learnCard.helpers';
import { randomBytes } from 'node:crypto';
import { getClient, getUser } from './helpers/getClient';
import { testUnsignedBoost, testVc } from './helpers/send';
import { getHolderExportMetadataForProfile } from '@accesslayer/consentflowcontract/relationships/read';
import { getProfileByProfileId } from '@accesslayer/profile/read';
import { normalContract, normalFullTerms } from './helpers/contract';
import cache from '@cache';
import { neogma } from '@instance';
import { getContractTermsByUri } from '@accesslayer/consentflowcontract/relationships/read';
import { getStoredContractRequest } from '@accesslayer/consentflowcontract/read';
import * as contractRead from '@accesslayer/consentflowcontract/read';
import {
    authorizeContractNotification,
    dispatchContractEvents,
} from '@helpers/contract-events.helpers';
import * as notifications from '@helpers/notifications.helpers';
import { ensureContractEventMaintenance } from '@helpers/contract-event-maintenance.helpers';
import { deliverQueuedNotification } from '@helpers/notificationQueue.helpers';
import type { LCNNotification } from '@learncard/types';
import { openApiDocument } from '../src/openapi';

const actor = async (role: string) => {
    const user = await getUser(randomBytes(32).toString('hex'));
    const profileId = `requests-${role}-${randomBytes(5).toString('hex')}`;
    await user.clients.fullAuth.profile.createProfile({ profileId });
    return { ...user, profileId };
};
const id = (uri: string): string => uri.split(':').at(-1)!;

describe('generic contract requests and correlated events', () => {
    let owner: Awaited<ReturnType<typeof actor>>;
    let writer: Awaited<ReturnType<typeof actor>>;
    let recipient: Awaited<ReturnType<typeof actor>>;
    let otherRecipient: Awaited<ReturnType<typeof actor>>;
    let learner: Awaited<ReturnType<typeof actor>>;
    let outsider: Awaited<ReturnType<typeof actor>>;
    let delivered: LCNNotification[];
    let queue: ReturnType<typeof vi.spyOn<typeof notifications, 'addNotificationToQueue'>>;
    beforeEach(async () => {
        [owner, writer, recipient, otherRecipient, learner, outsider] = await Promise.all([
            actor('owner'),
            actor('writer'),
            actor('recipient'),
            actor('other-recipient'),
            actor('learner'),
            actor('outsider'),
        ]);
        delivered = [];
        queue = vi
            .spyOn(notifications, 'addNotificationToQueue')
            .mockImplementation(async notification => {
                delivered.push(structuredClone(notification));
                return undefined;
            });
    });
    afterEach(() => vi.restoreAllMocks());
    const create = (recipients = [recipient.profileId, otherRecipient.profileId]) =>
        owner.clients.fullAuth.contracts.createConsentFlowContract({
            name: 'Synthetic referral',
            contract: normalContract,
            writers: [writer.profileId],
            recipients,
        });
    const send = (uri: string, sender = writer, reference = 'synthetic-ref-123') =>
        sender.clients.fullAuth.contracts.sendContractRequest({
            contractUri: uri,
            targetProfileId: learner.profileId,
            externalReferenceId: reference,
            message: 'Synthetic invitation',
        });
    const status = (uri: string, viewer = owner) =>
        viewer.clients.fullAuth.contracts.getRequestStatusForProfile({
            contractUri: uri,
            targetProfileId: learner.profileId,
        });
    const accept = async (uri: string) =>
        learner.clients.fullAuth.contracts.consentToContract({
            contractUri: uri,
            terms: normalFullTerms,
            audienceVersion: (
                await owner.clients.fullAuth.contracts.getConsentFlowContract({ uri })
            ).audienceVersion,
        });
    const due = (eventId: string) =>
        neogma.queryRunner.run(
            'MATCH (:ConsentFlowEvent {id: $eventId})-[:HAS_DELIVERY]->(d) SET d.nextAttemptAt = $past',
            { eventId, past: '2000-01-01T00:00:00.000Z' }
        );
    const eventRows = async (uri: string) =>
        (
            await neogma.queryRunner.run(
                'MATCH (e:ConsentFlowEvent {contractId: $contractId}) OPTIONAL MATCH (e)-[:HAS_DELIVERY]->(d) RETURN e, collect(d) AS deliveries',
                { contractId: id(uri) }
            )
        ).records;

    const flush = async (uri: string): Promise<void> => {
        for (const row of await eventRows(uri))
            await dispatchContractEvents({ eventId: row.get('e').properties.id });
    };

    const useDirectWebhook = (webhookUrl?: string): void => {
        queue.mockRestore();
        vi.spyOn(runtime, 'getNotificationRuntimeEnvironment').mockReturnValue({
            ...runtime.getNotificationRuntimeEnvironment(),
            NODE_ENV: 'development',
            IS_OFFLINE: false,
            NOTIFICATIONS_QUEUE_URL: undefined,
            IS_E2E_TEST: false,
            NOTIFICATIONS_SERVICE_WEBHOOK_URL: webhookUrl,
        });
        vi.spyOn(learnCardHelpers, 'getDidWebLearnCard').mockResolvedValue({
            invoke: { getDidAuthVp: async () => 'synthetic.auth.jwt' },
        } as unknown as Awaited<ReturnType<typeof learnCardHelpers.getDidWebLearnCard>>);
    };

    it.each(['owner', 'writer', 'recipient'] as const)(
        'allows %s requests without granting writer data access',
        async role => {
            const uri = await create();
            const sender = { owner, writer, recipient }[role];
            await expect(send(uri, sender)).resolves.toBe(true);
            expect(await status(uri, sender)).toMatchObject({
                status: 'pending',
                requestedBy: sender.profileId,
                externalReferenceId: 'synthetic-ref-123',
            });
            await expect(
                writer.clients.fullAuth.contracts.getConsentedDataForContract({ uri })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
            const incoming =
                await learner.clients.fullAuth.contracts.getAllContractRequestsForProfile({
                    targetProfileId: learner.profileId,
                });
            expect(incoming[0]).toMatchObject({
                contract: { uri, name: 'Synthetic referral', read: normalContract.read },
                requestedBy: sender.profileId,
            });
            expect(delivered[0]?.data?.metadata).toMatchObject({
                type: 'contract-request',
                recipientRole: 'target',
                event: 'request_sent',
                requestedBy: sender.profileId,
            });
        }
    );

    it('requires verified authentication, scope, target existence and an authorized sender', async () => {
        const uri = await create();
        const input = { contractUri: uri, targetProfileId: learner.profileId };
        await expect(
            owner.clients.partialAuth.contracts.sendContractRequest(input)
        ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        await expect(
            getClient({
                did: owner.learnCard.id.did(),
                isChallengeValid: true,
                scope: 'contracts:read',
            }).contracts.sendContractRequest(input)
        ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        await expect(send(uri, outsider)).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        await expect(
            owner.clients.fullAuth.contracts.sendContractRequest({
                ...input,
                targetProfileId: 'missing-profile',
            })
        ).rejects.toMatchObject({ code: 'NOT_FOUND' });
        await expect(
            outsider.clients.fullAuth.contracts.getContractSentRequests({ contractUri: uri })
        ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        await expect(
            owner.clients.fullAuth.contracts.sendContractRequest({
                ...input,
                externalReferenceId: 'x'.repeat(257),
            })
        ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
        await expect(
            owner.clients.fullAuth.contracts.sendContractRequest({
                ...input,
                message: 'x'.repeat(501),
            })
        ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    });

    it('enforces the sender/contract request rate limit before mutating state', async () => {
        const uri = await create();
        await cache.set(`contract-request-rate:${id(uri)}:${writer.profileId}`, '500', 3600);
        await expect(send(uri)).rejects.toMatchObject({ code: 'TOO_MANY_REQUESTS' });
        expect(await status(uri)).toBeNull();
        expect(await eventRows(uri)).toEqual([]);
    });

    it('rejects sender-to-self requests by profile ID or DID without writing an invitation', async () => {
        const uri = await create();
        for (const targetProfileId of [writer.profileId, writer.learnCard.id.did()])
            await expect(
                writer.clients.fullAuth.contracts.sendContractRequest({
                    contractUri: uri,
                    targetProfileId,
                })
            ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
        expect(await getStoredContractRequest(id(uri), writer.profileId)).toBeNull();
        expect(await eventRows(uri)).toEqual([]);
        expect(queue).not.toHaveBeenCalled();
    });

    it('preserves an attributed-request conflict through the legacy AI send route', async () => {
        const uri = await create();
        await send(uri);
        await expect(
            writer.clients.fullAuth.contracts.sendAiInsightsContractRequest({
                contractUri: uri,
                targetProfileId: learner.profileId,
                shareLink: 'https://synthetic.example',
            })
        ).rejects.toMatchObject({
            code: 'CONFLICT',
            message: 'An attributed request already exists for this profile.',
        });
        expect(await status(uri)).toMatchObject({
            status: 'pending',
            requestedBy: writer.profileId,
        });
        expect(await eventRows(uri)).toHaveLength(1);
    });

    it('deduplicates exact concurrent retries and rejects conflicting sender/reference/message', async () => {
        const uri = await create();
        await Promise.all([send(uri), send(uri), send(uri)]);
        expect(await eventRows(uri)).toHaveLength(1);
        expect(delivered).toHaveLength(1);
        await expect(send(uri, writer, 'different-ref')).rejects.toMatchObject({
            code: 'CONFLICT',
        });
        await expect(send(uri, recipient)).rejects.toMatchObject({ code: 'CONFLICT' });
        await expect(
            writer.clients.fullAuth.contracts.sendContractRequest({
                contractUri: uri,
                targetProfileId: learner.profileId,
                externalReferenceId: 'synthetic-ref-123',
                message: 'changed',
            })
        ).rejects.toMatchObject({ code: 'CONFLICT' });
    });

    it('permits one winner for concurrent conflicting references', async () => {
        const uri = await create();
        const results = await Promise.allSettled([send(uri, writer, 'a'), send(uri, writer, 'b')]);
        expect(results.filter(result => result.status === 'fulfilled')).toHaveLength(1);
        expect(await eventRows(uri)).toHaveLength(1);
    });

    it('targets mark existing requests seen; writers cannot change generic read status or targets create phantom requests', async () => {
        const uri = await create();
        const input = { contractUri: uri, targetProfileId: learner.profileId };
        await expect(
            learner.clients.fullAuth.contracts.markContractRequestAsSeen(input)
        ).rejects.toMatchObject({ code: 'NOT_FOUND' });
        await send(uri);
        const readOnly = getClient({
            did: learner.learnCard.id.did(),
            isChallengeValid: true,
            scope: 'contracts:read',
        });
        await expect(readOnly.contracts.markContractRequestAsSeen(input)).rejects.toMatchObject({
            code: 'UNAUTHORIZED',
        });
        await expect(readOnly.contracts.cancelContractRequest(input)).rejects.toMatchObject({
            code: 'UNAUTHORIZED',
        });
        await expect(
            writer.clients.fullAuth.contracts.markContractRequestAsSeen(input)
        ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        await learner.clients.fullAuth.contracts.markContractRequestAsSeen(input);
        expect(await status(uri)).toMatchObject({ status: 'pending', readStatus: 'seen' });
    });

    it.each(['pending', 'denied', 'cancelled', 'accepted'] as const)(
        'hides another recipients %s referral while preserving sender, manager and learner access',
        async requestStatus => {
            const uri = await create();
            await send(uri, recipient);
            delivered.length = 0;
            if (requestStatus === 'denied')
                await learner.clients.fullAuth.contracts.denyContractRequest({ contractUri: uri });
            if (requestStatus === 'cancelled')
                await owner.clients.fullAuth.contracts.cancelContractRequest({
                    contractUri: uri,
                    targetProfileId: learner.profileId,
                });
            if (requestStatus === 'accepted') await accept(uri);
            await flush(uri);
            const expected = {
                requestedBy: recipient.profileId,
                externalReferenceId: 'synthetic-ref-123',
                message: 'Synthetic invitation',
                status: requestStatus,
            };
            for (const viewer of [owner, writer, recipient, learner])
                expect(await status(uri, viewer)).toMatchObject(expected);
            for (const viewer of [owner, writer, recipient]) {
                const list = await viewer.clients.fullAuth.contracts.getContractSentRequests({
                    contractUri: uri,
                });
                expect(list).toHaveLength(1);
                expect(list[0]).toMatchObject(expected);
            }
            expect(
                await otherRecipient.clients.fullAuth.contracts.getContractSentRequests({
                    contractUri: uri,
                })
            ).toEqual([]);
            expect(await status(uri, otherRecipient)).toBeNull();
            expect(
                await otherRecipient.clients.fullAuth.contracts.getRequestStatusForProfile({
                    contractId: id(uri),
                    targetProfileId: learner.learnCard.id.did(),
                })
            ).toBeNull();
            expect(
                await otherRecipient.clients.fullAuth.contracts.getRequestStatusForProfile({
                    contractUri: uri,
                    targetProfileId: outsider.profileId,
                })
            ).toBeNull();
            expect(
                await learner.clients.fullAuth.contracts.getAllContractRequestsForProfile({
                    targetProfileId: learner.profileId,
                })
            ).toEqual([expect.objectContaining(expected)]);
            if (requestStatus === 'denied' || requestStatus === 'cancelled')
                expect(delivered.every(n => n.to.profileId !== otherRecipient.profileId)).toBe(
                    true
                );
            if (requestStatus === 'accepted') {
                const shared = delivered.find(n => n.to.profileId === otherRecipient.profileId)!;
                expect(shared.data?.metadata?.event).toBe('consent_created');
                expect(JSON.stringify(shared)).not.toContain('synthetic-ref-123');
                expect(shared.data?.metadata).not.toHaveProperty('message');
                const referrer = delivered.find(n => n.to.profileId === recipient.profileId)!;
                expect(referrer.data?.metadata?.externalReferenceId).toBe('synthetic-ref-123');
                expect(referrer.data?.transaction?.referral?.externalReferenceId).toBe(
                    'synthetic-ref-123'
                );
                const data =
                    await otherRecipient.clients.fullAuth.contracts.getConsentedDataForContract({
                        uri,
                    });
                expect(data.records[0]?.personal).toEqual(normalFullTerms.read.personal);
                expect(JSON.stringify(data)).not.toContain('synthetic-ref-123');
            }
        }
    );

    it('enforces request visibility in the database even if an earlier role lookup is stale', async () => {
        const uri = await create();
        await send(uri, recipient);
        vi.spyOn(contractRead, 'getContractRequestAccess').mockResolvedValue({
            isOwner: false,
            isManager: true,
            isRecipient: true,
        });
        expect(
            await otherRecipient.clients.fullAuth.contracts.getContractSentRequests({
                contractUri: uri,
            })
        ).toEqual([]);
        expect(await status(uri, otherRecipient)).toBeNull();
        expect(await status(uri, recipient)).toMatchObject({
            externalReferenceId: 'synthetic-ref-123',
        });
    });

    it('filters a shared contracts request list to each recipients own referrals', async () => {
        const uri = await create();
        await send(uri, recipient, 'private-org-a-ref');
        await otherRecipient.clients.fullAuth.contracts.sendContractRequest({
            contractUri: uri,
            targetProfileId: outsider.profileId,
            externalReferenceId: 'private-org-b-ref',
            message: 'Private Org B invitation',
        });
        for (const [viewer, reference, target] of [
            [recipient, 'private-org-a-ref', learner],
            [otherRecipient, 'private-org-b-ref', outsider],
        ] as const) {
            const list = await viewer.clients.fullAuth.contracts.getContractSentRequests({
                contractUri: uri,
            });
            expect(list).toEqual([
                expect.objectContaining({
                    externalReferenceId: reference,
                    profile: expect.objectContaining({ profileId: target.profileId }),
                }),
            ]);
        }
        for (const manager of [owner, writer]) {
            const list = await manager.clients.fullAuth.contracts.getContractSentRequests({
                contractUri: uri,
            });
            expect(list.map(r => r.externalReferenceId).sort()).toEqual([
                'private-org-a-ref',
                'private-org-b-ref',
            ]);
        }
    });

    it.each(['denied', 'cancelled'] as const)(
        'suppresses old pending and queued %s notifications to an unrelated recipient',
        async decision => {
            const uri = await create();
            await send(uri, recipient);
            const request = (await status(uri))!;
            queue.mockRejectedValue(new Error('synthetic outage'));
            if (decision === 'denied')
                await learner.clients.fullAuth.contracts.denyContractRequest({ contractUri: uri });
            else
                await learner.clients.fullAuth.contracts.cancelContractRequest({
                    contractUri: uri,
                    targetProfileId: learner.profileId,
                });
            const eventId = `${request.requestId}:${decision}`;
            await neogma.queryRunner.run(
                `MATCH (e:ConsentFlowEvent {id:$eventId})
                 CREATE (e)-[:HAS_DELIVERY]->(:ConsentFlowEventDelivery {
                    id:$deliveryId, toId:$toId, role:'recipient', state:'pending', nextAttemptAt:$past
                 })`,
                {
                    eventId,
                    deliveryId: `${eventId}:${otherRecipient.profileId}`,
                    toId: otherRecipient.profileId,
                    past: '2000-01-01T00:00:00.000Z',
                }
            );
            delivered.length = 0;
            queue.mockImplementation(async n => {
                delivered.push(structuredClone(n));
                return undefined;
            });
            await due(eventId);
            await dispatchContractEvents({ eventId });
            expect(delivered.map(n => n.to.profileId).sort()).toEqual(
                [owner.profileId, recipient.profileId].sort()
            );
            const rows = (await eventRows(uri)).find(r => r.get('e').properties.id === eventId)!;
            const suppressed = rows
                .get('deliveries')
                .find(
                    (d: { properties: { toId: string } }) =>
                        d.properties.toId === otherRecipient.profileId
                );
            expect(suppressed.properties.state).toBe('skipped');
            const oldQueued = structuredClone(delivered[0]!);
            oldQueued.to = (await getProfileByProfileId(otherRecipient.profileId))!;
            oldQueued.data!.metadata!.recipientRole = 'recipient';
            oldQueued.data!.metadata!.deliveryKey = `${eventId}:${otherRecipient.profileId}`;
            const sendSpy = vi.spyOn(notifications, 'sendNotification');
            await expect(
                deliverQueuedNotification(JSON.stringify(oldQueued))
            ).resolves.toBeUndefined();
            expect(sendSpy).not.toHaveBeenCalled();
        }
    );

    it('removes private references from already queued consent data after a recipient loses writer access', async () => {
        const uri = await owner.clients.fullAuth.contracts.createConsentFlowContract({
            name: 'Synthetic referral',
            contract: normalContract,
            writers: [writer.profileId, otherRecipient.profileId],
            recipients: [recipient.profileId, otherRecipient.profileId],
        });
        await send(uri, recipient);
        delivered.length = 0;
        const { termsUri } = await accept(uri);
        await flush(uri);
        const queued = structuredClone(
            delivered.find(n => n.to.profileId === otherRecipient.profileId)!
        );
        expect(queued.data?.metadata?.externalReferenceId).toBe('synthetic-ref-123');
        queued.data!.transaction!.terms = structuredClone(normalFullTerms);
        queued.data!.metadata!.message = 'Private referral text';
        await neogma.queryRunner.run(
            `MATCH (:ConsentFlowContract {id:$contractId})-[w:CAN_WRITE]->(:Profile {profileId:$profileId}) DELETE w`,
            { contractId: id(uri), profileId: otherRecipient.profileId }
        );
        const sent: LCNNotification[] = [];
        vi.spyOn(notifications, 'sendNotification').mockImplementation(async n => {
            sent.push(structuredClone(n));
            return true;
        });
        await deliverQueuedNotification(JSON.stringify(queued));
        expect(sent).toHaveLength(1);
        expect(sent[0]?.data?.transaction?.terms?.read.personal).toEqual(
            normalFullTerms.read.personal
        );
        expect(sent[0]?.data?.metadata).not.toHaveProperty('externalReferenceId');
        expect(sent[0]?.data?.metadata).not.toHaveProperty('message');
        expect(sent[0]?.data?.transaction?.referral).not.toHaveProperty('externalReferenceId');
        expect(JSON.stringify(sent[0])).not.toContain('synthetic-ref-123');
        expect(await status(uri, otherRecipient)).toBeNull();
        await expect(
            otherRecipient.clients.fullAuth.contracts.getTermsTransactionHistory({ uri: termsUri })
        ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        const history = await learner.clients.fullAuth.contracts.getTermsTransactionHistory({
            uri: termsUri,
        });
        expect(history.records[0]?.referral?.externalReferenceId).toBe('synthetic-ref-123');
        const exported = await getHolderExportMetadataForProfile(
            (await getProfileByProfileId(learner.profileId))!,
            'localhost%3A3000'
        );
        expect(exported.consentRecords[0]?.referral?.externalReferenceId).toBe('synthetic-ref-123');
    });

    it('preserves legacy request management for writers without exposing it to recipients', async () => {
        const uri = await create();
        await writer.clients.fullAuth.contracts.sendAiInsightsContractRequest({
            contractUri: uri,
            targetProfileId: learner.profileId,
            shareLink: 'https://synthetic.example/legacy',
        });
        for (const viewer of [owner, writer, learner])
            expect(await status(uri, viewer)).toMatchObject({ status: 'pending' });
        expect(await status(uri, recipient)).toBeNull();
        expect(
            await recipient.clients.fullAuth.contracts.getContractSentRequests({ contractUri: uri })
        ).toEqual([]);
        expect(
            await writer.clients.fullAuth.contracts.getContractSentRequests({ contractUri: uri })
        ).toHaveLength(1);
    });

    it('retains denied history, emits one decision and rejects reopen/other terminal transitions', async () => {
        const uri = await create();
        await send(uri);
        delivered.length = 0;
        await expect(
            outsider.clients.fullAuth.contracts.denyContractRequest({ contractUri: uri })
        ).rejects.toMatchObject({ code: 'NOT_FOUND' });
        await learner.clients.fullAuth.contracts.denyContractRequest({ contractUri: uri });
        await learner.clients.fullAuth.contracts.denyContractRequest({ contractUri: uri });
        expect(await status(uri)).toMatchObject({
            status: 'denied',
            externalReferenceId: 'synthetic-ref-123',
        });
        await flush(uri);
        expect(delivered.map(n => n.to.profileId).sort()).toEqual(
            [owner.profileId, writer.profileId].sort()
        );
        expect(delivered.find(n => n.to.profileId === writer.profileId)?.data).not.toHaveProperty(
            'transaction'
        );
        expect(delivered.every(n => n.data?.metadata?.event === 'request_denied')).toBe(true);
        await expect(send(uri)).rejects.toMatchObject({ code: 'CONFLICT' });
        await expect(
            owner.clients.fullAuth.contracts.cancelContractRequest({
                contractUri: uri,
                targetProfileId: learner.profileId,
            })
        ).rejects.toMatchObject({ code: 'CONFLICT' });
    });

    it.each(['owner', 'writer', 'recipient', 'learner'] as const)(
        'permits cancellation by %s and retains terminal correlation',
        async role => {
            const uri = await create();
            await send(uri, recipient);
            await expect(
                otherRecipient.clients.fullAuth.contracts.cancelContractRequest({
                    contractUri: uri,
                    targetProfileId: learner.profileId,
                })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
            await { owner, writer, recipient, learner }[
                role
            ].clients.fullAuth.contracts.cancelContractRequest({
                contractUri: uri,
                targetProfileId: learner.profileId,
            });
            expect(await status(uri)).toMatchObject({
                status: 'cancelled',
                requestedBy: recipient.profileId,
            });
            await expect(send(uri, recipient)).rejects.toMatchObject({ code: 'CONFLICT' });
        }
    );

    it('stores referral on Terms and transaction history, fan-outs to the audience, and gives the writer only a decision', async () => {
        const uri = await create();
        await send(uri);
        const request = await status(uri);
        delivered.length = 0;
        const { termsUri } = await accept(uri);
        await flush(uri);
        const referral = {
            requestId: request!.requestId,
            requestedBy: writer.profileId,
            externalReferenceId: 'synthetic-ref-123',
        };
        expect((await getContractTermsByUri(termsUri))?.terms.referral).toEqual(referral);
        expect(
            (await learner.clients.fullAuth.contracts.getConsentedContracts()).records[0]?.referral
        ).toEqual(referral);
        const history = await learner.clients.fullAuth.contracts.getTermsTransactionHistory({
            uri: termsUri,
        });
        expect(history.records[0]?.referral).toEqual(referral);
        expect(await status(uri)).toMatchObject({ status: 'accepted' });
        expect(delivered.map(n => n.to.profileId).sort()).toEqual(
            [owner, recipient, otherRecipient, writer].map(a => a.profileId).sort()
        );
        const minimal = delivered.find(n => n.to.profileId === writer.profileId)!;
        expect(minimal.data).not.toHaveProperty('transaction');
        expect(minimal.data?.metadata).toMatchObject({
            event: 'request_accepted',
            recipientRole: 'requester',
            ...referral,
        });
        expect(minimal.data?.metadata).not.toHaveProperty('termsUri');
        expect(JSON.stringify(minimal)).not.toContain('Full Fullerson');
        expect(JSON.stringify(minimal)).not.toContain('achievement1');
        const audienceEvent = delivered.find(n => n.to.profileId === recipient.profileId)!;
        const publicReferral = { requestId: referral.requestId, requestedBy: referral.requestedBy };
        expect(audienceEvent.data?.transaction?.referral).toEqual(publicReferral);
        expect(audienceEvent.data?.metadata).toMatchObject({
            event: 'consent_created',
            termsUri,
            ...publicReferral,
        });
        expect(audienceEvent.data?.metadata).not.toHaveProperty('externalReferenceId');
        const ownerEvent = delivered.find(n => n.to.profileId === owner.profileId)!;
        expect(ownerEvent.data?.metadata?.externalReferenceId).toBe('synthetic-ref-123');
        expect(ownerEvent.data?.transaction?.referral).toEqual(referral);
        expect(new Set(delivered.map(n => n.data?.metadata?.deliveryKey)).size).toBe(4);
        delivered.length = 0;
        await learner.clients.fullAuth.contracts.syncCredentialsToContract({
            termsUri,
            categories: { Achievement: ['urn:synthetic:new'] },
            audienceVersion: 2,
        });
        await flush(uri);
        expect(delivered).toHaveLength(3);
        expect(
            delivered.every(
                n =>
                    n.to.profileId !== writer.profileId &&
                    n.data?.metadata?.event === 'credentials_synced'
            )
        ).toBe(true);
        delivered.length = 0;
        await learner.clients.fullAuth.contracts.withdrawConsent({ uri: termsUri });
        await flush(uri);
        expect(delivered).toHaveLength(3);
        expect(
            delivered.every(
                n =>
                    (n.to.profileId === owner.profileId
                        ? n.data?.metadata?.externalReferenceId === 'synthetic-ref-123'
                        : n.data?.metadata?.externalReferenceId === undefined) &&
                    n.data.metadata.event === 'consent_withdrawn'
            )
        ).toBe(true);
        expect(await getStoredContractRequest(id(uri), learner.profileId)).toMatchObject({
            status: 'accepted',
            ...referral,
        });
    });

    it('preserves referral attribution on issued outcomes, maintenance transactions and holder exports', async () => {
        const uri = await create();
        await send(uri);
        const { termsUri } = await accept(uri);
        const learnerDid = (await learner.clients.fullAuth.profile.getProfile())!.did;
        const boostUri = await writer.clients.fullAuth.boost.createBoost({
            credential: testUnsignedBoost,
        });
        await writer.clients.fullAuth.contracts.writeCredentialToContract({
            did: learnerDid,
            contractUri: uri,
            boostUri,
            credential: testVc,
        });
        await learner.clients.fullAuth.contracts.deleteCredentialFromAllContracts({
            deletedUris: ['achievement1'],
        });
        const history = await learner.clients.fullAuth.contracts.getTermsTransactionHistory({
            uri: termsUri,
        });
        expect(history.records.find(t => t.action === 'write')?.referral?.externalReferenceId).toBe(
            'synthetic-ref-123'
        );
        expect(
            history.records.every(t => t.referral?.externalReferenceId === 'synthetic-ref-123')
        ).toBe(true);
        const metadata = await getHolderExportMetadataForProfile(
            (await getProfileByProfileId(learner.profileId))!,
            'localhost%3A3000'
        );
        expect(metadata.consentRecords[0]?.referral?.externalReferenceId).toBe('synthetic-ref-123');
        expect(
            metadata.consentRecords[0]?.transactions.every(
                t => t.referral?.externalReferenceId === 'synthetic-ref-123'
            )
        ).toBe(true);
    });

    it('keeps the original accepted referral through withdrawal and re-consent without reopening it', async () => {
        const uri = await create();
        await send(uri);
        const original = (await status(uri))!;
        const { termsUri } = await accept(uri);
        await learner.clients.fullAuth.contracts.withdrawConsent({ uri: termsUri });
        await expect(send(uri, recipient, 'new-referral')).rejects.toMatchObject({
            code: 'CONFLICT',
        });
        delivered.length = 0;
        await accept(uri);
        await flush(uri);
        expect(await status(uri)).toMatchObject({
            status: 'accepted',
            requestId: original.requestId,
            requestedBy: writer.profileId,
            externalReferenceId: original.externalReferenceId,
        });
        const history = await learner.clients.fullAuth.contracts.getTermsTransactionHistory({
            uri: termsUri,
        });
        expect(history.records.filter(t => t.action === 'consent')).toHaveLength(2);
        expect(history.records.every(t => t.referral?.requestId === original.requestId)).toBe(true);
        expect(
            delivered.find(n => n.to.profileId === owner.profileId)?.data?.metadata
        ).toMatchObject({
            event: 'consent_created',
            requestId: original.requestId,
            externalReferenceId: original.externalReferenceId,
        });
        expect(delivered.some(n => n.to.profileId === writer.profileId)).toBe(false);
    });

    it('gives a removed original referrer only its minimal acceptance decision', async () => {
        const uri = await create();
        await send(uri, recipient);
        await owner.clients.fullAuth.contracts.removeContractRecipient({
            contractUri: uri,
            recipient: recipient.profileId,
        });
        delivered.length = 0;
        await accept(uri);
        await flush(uri);
        const decision = delivered.find(n => n.to.profileId === recipient.profileId)!;
        expect(decision.data?.metadata).toMatchObject({
            event: 'request_accepted',
            recipientRole: 'requester',
            externalReferenceId: 'synthetic-ref-123',
        });
        expect(decision.data).not.toHaveProperty('transaction');
        expect(decision.data?.metadata).not.toHaveProperty('termsUri');
        expect(await authorizeContractNotification(structuredClone(decision))).toBe(true);
        await expect(
            recipient.clients.fullAuth.contracts.getConsentedDataForContract({ uri })
        ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
    });

    it('serializes consent versus denial without recording a denied request as accepted', async () => {
        const uri = await create();
        await send(uri);
        const [consent, decision] = await Promise.allSettled([
            accept(uri),
            learner.clients.fullAuth.contracts.denyContractRequest({ contractUri: uri }),
        ]);
        expect(consent.status).toBe('fulfilled');
        if (consent.status !== 'fulfilled') throw new Error('Consent failed');
        const current = await status(uri);
        const terms = (await getContractTermsByUri(consent.value.termsUri))!.terms;
        if (current?.status === 'accepted') {
            expect(decision.status).toBe('rejected');
            expect(terms.referral?.requestId).toBe(current.requestId);
        } else {
            expect(current?.status).toBe('denied');
            expect(decision.status).toBe('fulfilled');
            expect(terms.referral).toBeUndefined();
        }
    });

    it('rejects expired contracts, and accepts a new request when legacy consent has expired without an existing request', async () => {
        const expired = await owner.clients.fullAuth.contracts.createConsentFlowContract({
            name: 'Expired',
            contract: normalContract,
            expiresAt: '2000-01-01T00:00:00Z',
        });
        await expect(send(expired, owner)).rejects.toMatchObject({ code: 'CONFLICT' });
        const uri = await create();
        const { termsUri } = await accept(uri);
        await neogma.queryRunner.run(
            'MATCH (:ConsentFlowContract {id:$id})-[r:REQUESTED_FOR]->() DELETE r',
            { id: id(uri) }
        );
        await expect(send(uri)).rejects.toMatchObject({ code: 'CONFLICT' });
        await neogma.queryRunner.run('MATCH (t:ConsentFlowTerms {id:$id}) SET t.expiresAt=$past', {
            id: id(termsUri),
            past: '2000-01-01T00:00:00Z',
        });
        await send(uri);
        await learner.clients.fullAuth.contracts.withdrawConsent({ uri: termsUri });
        expect((await getContractTermsByUri(termsUri))!.terms.referral).toBeUndefined();
        expect(await status(uri)).toMatchObject({ status: 'pending' });
        delivered.length = 0;
        await learner.clients.fullAuth.contracts.updateConsentedContractTerms({
            uri: termsUri,
            terms: normalFullTerms,
            expiresAt: '',
            audienceVersion: 2,
        });
        expect(await status(uri)).toMatchObject({ status: 'accepted' });
        await flush(uri);
        expect(
            delivered.find(n => n.to.profileId === writer.profileId)?.data?.metadata?.event
        ).toBe('request_accepted');
        expect(
            await learner.clients.fullAuth.contracts.getSharedInsightsRequestsForProfile({
                targetProfileId: learner.profileId,
            })
        ).toEqual([]);
    });

    it('refuses a new request for active consent and preserves legacy AI request payload/cancellation', async () => {
        const uri = await create();
        await accept(uri);
        await expect(send(uri)).rejects.toMatchObject({ code: 'CONFLICT' });
        const legacy = await create([]);
        delivered.length = 0;
        await writer.clients.fullAuth.contracts.sendAiInsightsContractRequest({
            contractUri: legacy,
            targetProfileId: learner.profileId,
            shareLink: 'https://synthetic.example/insights',
        });
        expect(delivered[0]?.data?.metadata).toMatchObject({
            type: 'AI Insight',
            contractUri: legacy,
        });
        expect(await status(legacy)).not.toHaveProperty('requestId');
        await learner.clients.fullAuth.contracts.cancelContractRequest({
            contractUri: legacy,
            targetProfileId: learner.profileId,
        });
        expect(await status(legacy)).toBeNull();
        await expect(
            recipient.clients.fullAuth.contracts.sendAiInsightsContractRequest({
                contractUri: uri,
                targetProfileId: learner.profileId,
                shareLink: 'https://synthetic.example/insights',
            })
        ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
    });

    it('commits state through a transport outage, retries with the same delivery key, and leases overlapping workers', async () => {
        const uri = await create();
        queue.mockRejectedValue(new Error('synthetic outage'));
        await expect(send(uri)).resolves.toBe(true);
        const request = await status(uri);
        const eventId = request!.requestId!;
        let rows = await eventRows(uri);
        expect(rows[0]!.get('deliveries')[0].properties.state).toBe('pending');
        await due(eventId);
        let calls = 0;
        queue.mockImplementation(async n => {
            calls++;
            delivered.push(structuredClone(n));
            await new Promise(resolve => setTimeout(resolve, 25));
            return undefined;
        });
        await Promise.all([
            dispatchContractEvents({ eventId }),
            dispatchContractEvents({ eventId }),
        ]);
        expect(calls).toBe(1);
        expect(delivered[0]?.data?.metadata).toMatchObject({
            eventId,
            deliveryKey: `${eventId}:${learner.profileId}`,
        });
        await due(eventId);
        await dispatchContractEvents({ eventId });
        expect(calls).toBe(1);
        rows = await eventRows(uri);
        expect(rows[0]!.get('deliveries')[0].properties.state).toBe('delivered');
    });

    it('recovers an abandoned lease, retains false acknowledgements and removes completed payloads', async () => {
        const uri = await create();
        queue.mockResolvedValue(false);
        await send(uri);
        const eventId = (await status(uri))!.requestId!;
        await due(eventId);
        await neogma.queryRunner.run(
            "MATCH (:ConsentFlowEvent {id:$eventId})-[:HAS_DELIVERY]->(d) SET d.lease='abandoned', d.leaseUntil=$future",
            { eventId, future: '2999-01-01T00:00:00Z' }
        );
        queue.mockClear();
        await dispatchContractEvents({ eventId });
        expect(queue).not.toHaveBeenCalled();
        await neogma.queryRunner.run(
            'MATCH (:ConsentFlowEvent {id:$eventId})-[:HAS_DELIVERY]->(d) SET d.leaseUntil=$past',
            { eventId, past: '2000-01-01T00:00:00Z' }
        );
        queue.mockResolvedValue(undefined);
        await dispatchContractEvents({ eventId });
        expect(queue).toHaveBeenCalledOnce();
        const rows = await eventRows(uri);
        expect(rows[0]!.get('deliveries')[0].properties.state).toBe('delivered');
        expect(rows[0]!.get('e').properties.message).toBeUndefined();
    });

    it.each([
        { name: 'HTTP 403', webhook: 'https://synthetic.example/events', httpStatus: 403 },
        { name: 'missing webhook', webhook: undefined, httpStatus: undefined },
        { name: 'disabled webhook', webhook: 'false', httpStatus: undefined },
    ])('stops retrying $name and clears the consent payload', async ({ webhook, httpStatus }) => {
        const uri = await create([]);
        useDirectWebhook(webhook);
        const fetchSpy = vi
            .spyOn(globalThis, 'fetch')
            .mockResolvedValue(new Response('{}', { status: httpStatus ?? 200 }));
        await expect(accept(uri)).resolves.toMatchObject({ termsUri: expect.any(String) });
        const row = (await eventRows(uri))[0]!;
        const eventId = row.get('e').properties.id;
        expect(row.get('deliveries')[0].properties).toMatchObject({
            state: 'rejected',
            attempts: expect.anything(),
        });
        expect(row.get('deliveries')[0].properties.nextAttemptAt).toBeUndefined();
        expect(row.get('e').properties.payload).toBeUndefined();
        expect(fetchSpy).toHaveBeenCalledTimes(httpStatus ? 1 : 0);
        await due(eventId);
        await dispatchContractEvents({ eventId });
        expect(fetchSpy).toHaveBeenCalledTimes(httpStatus ? 1 : 0);
    });

    it.each([408, 425, 429, 503, 200])(
        'retries HTTP %s with a negative acknowledgement and keeps its stable delivery key',
        async httpStatus => {
            const uri = await create([]);
            useDirectWebhook('https://synthetic.example/events');
            const fetchSpy = vi
                .spyOn(globalThis, 'fetch')
                .mockResolvedValue(new Response('{"success":false}', { status: httpStatus }));
            await accept(uri);
            const row = (await eventRows(uri))[0]!;
            const eventId = row.get('e').properties.id;
            expect(row.get('deliveries')[0].properties.state).toBe('pending');
            expect(JSON.parse(row.get('e').properties.payload)).toMatchObject({
                action: 'consent',
            });
            const firstMetadata = JSON.parse(String(fetchSpy.mock.calls[0]![1]?.body)).data
                .metadata;
            fetchSpy.mockResolvedValue(new Response('{"success":true}', { status: 200 }));
            await due(eventId);
            await dispatchContractEvents({ eventId });
            const completed = (await eventRows(uri))[0]!;
            expect(completed.get('deliveries')[0].properties.state).toBe('delivered');
            expect(completed.get('e').properties.payload).toBeUndefined();
            expect(JSON.parse(String(fetchSpy.mock.calls[1]![1]?.body)).data.metadata).toEqual(
                firstMetadata
            );
        }
    );

    it('keeps pre-request signing failures retryable', async () => {
        const uri = await create([]);
        useDirectWebhook('https://synthetic.example/events');
        vi.mocked(learnCardHelpers.getDidWebLearnCard).mockRejectedValue(
            new Error('synthetic signing outage')
        );
        const fetchSpy = vi.spyOn(globalThis, 'fetch');
        await accept(uri);
        const row = (await eventRows(uri))[0]!;
        expect(row.get('deliveries')[0].properties.state).toBe('pending');
        expect(row.get('e').properties.payload).toBeDefined();
        expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('backs off unsuccessful deliveries, stops after 12 claims and clears their payload', async () => {
        const uri = await create([]);
        queue.mockResolvedValue(false);
        await accept(uri);
        const initial = (await eventRows(uri))[0]!.get('e').properties;
        const eventId = initial.id;
        await neogma.queryRunner.run(
            'MATCH (e:ConsentFlowEvent {id:$eventId}) SET e.payload=$payload',
            {
                eventId,
                payload: JSON.stringify({ ...JSON.parse(initial.payload), terms: normalFullTerms }),
            }
        );
        for (let attempt = 1; attempt <= 12; attempt++) {
            const row = (await eventRows(uri))[0]!;
            const delivery = row.get('deliveries')[0].properties;
            expect(Number(delivery.attempts)).toBe(attempt);
            if (attempt === 12) {
                expect(delivery).toMatchObject({
                    state: 'failed',
                    failureReason: 'retry_exhausted',
                });
                expect(row.get('e').properties.payload).toBeUndefined();
                expect(delivery.nextAttemptAt).toBeUndefined();
            } else {
                expect(delivery.state).toBe('pending');
                expect(row.get('e').properties.payload).toBeDefined();
                const delay = Date.parse(delivery.nextAttemptAt) - Date.parse(delivery.updatedAt);
                const expectedDelay = Math.min(60_000 * 2 ** (attempt - 1), 3_600_000);
                expect(delay).toBeGreaterThanOrEqual(expectedDelay - 1_000);
                expect(delay).toBeLessThanOrEqual(expectedDelay + 1_000);
                await due(eventId);
                await dispatchContractEvents({ eventId });
            }
        }
        expect(queue).toHaveBeenCalledTimes(12);
        await due(eventId);
        await dispatchContractEvents({ eventId });
        expect(queue).toHaveBeenCalledTimes(12);
    });

    it.each(['expired', 'abandoned final attempt'])(
        'clears a pending payload after an %s without another external attempt',
        async scenario => {
            const uri = await create([]);
            queue.mockRejectedValue(new Error('synthetic outage'));
            await accept(uri);
            const eventId = (await eventRows(uri))[0]!.get('e').properties.id;
            await neogma.queryRunner.run(
                `MATCH (e:ConsentFlowEvent {id:$eventId})-[:HAS_DELIVERY]->(d)
                 SET e.createdAt = $createdAt, d.nextAttemptAt = $future,
                     d.attempts = $attempts, d.lease = 'abandoned', d.leaseUntil = $past`,
                {
                    eventId,
                    createdAt:
                        scenario === 'expired'
                            ? new Date(Date.now() - 25 * 3_600_000).toISOString()
                            : new Date().toISOString(),
                    future: '2999-01-01T00:00:00.000Z',
                    past: '2000-01-01T00:00:00.000Z',
                    attempts: scenario === 'expired' ? 1 : 12,
                }
            );
            queue.mockClear();
            expect(await dispatchContractEvents({ eventId })).toMatchObject({ failed: 1 });
            const row = (await eventRows(uri))[0]!;
            expect(row.get('deliveries')[0].properties).toMatchObject({
                state: 'failed',
                failureReason: scenario === 'expired' ? 'retry_expired' : 'retry_exhausted',
            });
            expect(row.get('e').properties.payload).toBeUndefined();
            expect(queue).not.toHaveBeenCalled();
        }
    );

    it('retains the fan-out payload until the last delivery finishes, including concurrent workers', async () => {
        const uri = await create();
        queue.mockRejectedValue(new Error('synthetic outage'));
        await accept(uri);
        const eventId = (await eventRows(uri))[0]!.get('e').properties.id;
        queue.mockImplementation(async notification => {
            if (notification.to.profileId === owner.profileId)
                throw new notifications.PermanentNotificationDeliveryError('webhook_rejected', 403);
            throw new Error('synthetic outage');
        });
        await due(eventId);
        await dispatchContractEvents({ eventId });
        const partial = (await eventRows(uri))[0]!;
        expect(
            partial
                .get('deliveries')
                .map((d: { properties: { state: string } }) => d.properties.state)
                .sort()
        ).toEqual(['pending', 'pending', 'rejected']);
        expect(partial.get('e').properties.payload).toBeDefined();
        queue.mockImplementation(async () => {
            await new Promise(resolve => setTimeout(resolve, 20));
            throw new notifications.PermanentNotificationDeliveryError('webhook_rejected', 403);
        });
        await due(eventId);
        await Promise.all([
            dispatchContractEvents({ eventId }),
            dispatchContractEvents({ eventId }),
        ]);
        const completed = (await eventRows(uri))[0]!;
        expect(
            completed
                .get('deliveries')
                .every((d: { properties: { state: string } }) => d.properties.state === 'rejected')
        ).toBe(true);
        expect(completed.get('e').properties.payload).toBeUndefined();
    });

    it('fences a worker whose lease was replaced while sending', async () => {
        const uri = await create([]);
        queue.mockRejectedValue(new Error('synthetic outage'));
        await accept(uri);
        const eventId = (await eventRows(uri))[0]!.get('e').properties.id;
        queue.mockImplementation(async () => {
            await neogma.queryRunner.run(
                `MATCH (:ConsentFlowEvent {id:$eventId})-[:HAS_DELIVERY]->(d)
                 SET d.lease='replacement', d.leaseUntil='2999-01-01T00:00:00.000Z'`,
                { eventId }
            );
            return undefined;
        });
        await due(eventId);
        await dispatchContractEvents({ eventId });
        const retained = (await eventRows(uri))[0]!;
        expect(retained.get('deliveries')[0].properties).toMatchObject({
            state: 'pending',
            lease: 'replacement',
        });
        expect(retained.get('e').properties.payload).toBeDefined();
        queue.mockResolvedValue(undefined);
        await neogma.queryRunner.run(
            `MATCH (:ConsentFlowEvent {id:$eventId})-[:HAS_DELIVERY]->(d)
             SET d.leaseUntil='2000-01-01T00:00:00.000Z'`,
            { eventId }
        );
        await dispatchContractEvents({ eventId });
        const completed = (await eventRows(uri))[0]!;
        expect(completed.get('deliveries')[0].properties.state).toBe('delivered');
        expect(completed.get('e').properties.payload).toBeUndefined();
    });

    it('recovers payload cleanup when all deliveries already finished or no recipients exist', async () => {
        const uri = await create([]);
        queue.mockRejectedValue(new Error('synthetic outage'));
        await accept(uri);
        const eventId = (await eventRows(uri))[0]!.get('e').properties.id;
        await neogma.queryRunner.run(
            `MATCH (:ConsentFlowEvent {id:$eventId})-[:HAS_DELIVERY]->(d) SET d.state='failed'`,
            { eventId }
        );
        queue.mockClear();
        await dispatchContractEvents({ eventId });
        expect((await eventRows(uri))[0]!.get('e').properties.payload).toBeUndefined();
        await neogma.queryRunner.run(
            `MATCH (e:ConsentFlowEvent {id:$eventId})-[:HAS_DELIVERY]->(d)
             DETACH DELETE d SET e.message='Synthetic retained message'`,
            { eventId }
        );
        await dispatchContractEvents({ eventId });
        expect((await eventRows(uri))[0]!.get('e').properties.message).toBeUndefined();
        expect(queue).not.toHaveBeenCalled();
    });

    it('backfills older retained payloads once and keeps pending payloads until recovery finishes', async () => {
        const uri = await create([]);
        queue.mockRejectedValue(new Error('synthetic outage'));
        await accept(uri);
        const eventId = (await eventRows(uri))[0]!.get('e').properties.id;
        const orphanId = `orphan-${eventId}`;
        await neogma.queryRunner.run(`
            MATCH (migration:ConsentFlowEventMigration {id:'indexed-outbox-v1'}) DELETE migration
        `);
        await neogma.queryRunner.run(
            `
            MATCH (event:ConsentFlowEvent {id:$eventId})-[:HAS_DELIVERY]->(delivery)
            REMOVE event.cleanupPending, delivery.eventCreatedAt
            SET delivery.nextAttemptAt = '2999-01-01T00:00:00Z'
            CREATE (:ConsentFlowEvent {id:$orphanId, createdAt:$now, payload:'{}', message:'Old retained body'})
        `,
            { eventId, orphanId, now: new Date().toISOString() }
        );
        await Promise.all([ensureContractEventMaintenance(), ensureContractEventMaintenance()]);
        const marker = await neogma.queryRunner.run(
            "MATCH (m:ConsentFlowEventMigration {id:'indexed-outbox-v1'}) RETURN m.completedAt AS completedAt"
        );
        await dispatchContractEvents({ budgetMs: 0 });
        const orphan = await neogma.queryRunner.run(
            'MATCH (e:ConsentFlowEvent {id:$id}) RETURN e',
            { id: orphanId }
        );
        expect(orphan.records[0]!.get('e').properties).not.toHaveProperty('payload');
        expect(orphan.records[0]!.get('e').properties).not.toHaveProperty('message');
        expect(orphan.records[0]!.get('e').properties).not.toHaveProperty('cleanupPending');
        const row = (await eventRows(uri))[0]!;
        expect(row.get('e').properties.cleanupPending).toBe(true);
        expect(row.get('e').properties.payload).toBeDefined();
        expect(row.get('deliveries')[0].properties.eventCreatedAt).toBe(
            row.get('e').properties.createdAt
        );
        await ensureContractEventMaintenance();
        const repeated = await neogma.queryRunner.run(
            "MATCH (m:ConsentFlowEventMigration {id:'indexed-outbox-v1'}) RETURN m.completedAt AS completedAt"
        );
        expect(repeated.records[0]!.get('completedAt')).toBe(marker.records[0]!.get('completedAt'));
        queue.mockResolvedValue(undefined);
        await due(eventId);
        await dispatchContractEvents();
        expect((await eventRows(uri))[0]!.get('e').properties).not.toHaveProperty('cleanupPending');
        await neogma.queryRunner.run('MATCH (e:ConsentFlowEvent {id:$id}) DELETE e', {
            id: orphanId,
        });
    });

    it.each(['expired', 'exhausted'] as const)(
        'globally recovers %s deliveries even when their next attempt is in the future',
        async scenario => {
            const uri = await create([]);
            queue.mockRejectedValue(new Error('synthetic outage'));
            await accept(uri);
            const eventId = (await eventRows(uri))[0]!.get('e').properties.id;
            const createdAt = new Date(
                Date.now() - (scenario === 'expired' ? 25 * 3_600_000 : 0)
            ).toISOString();
            await neogma.queryRunner.run(
                `
            MATCH (e:ConsentFlowEvent {id:$eventId})-[:HAS_DELIVERY]->(d)
            SET e.createdAt=$createdAt, d.eventCreatedAt=$createdAt,
                d.nextAttemptAt='2999-01-01T00:00:00Z', d.attempts=$attempts
        `,
                { eventId, createdAt, attempts: scenario === 'exhausted' ? 12 : 1 }
            );
            queue.mockClear();
            await dispatchContractEvents();
            const row = (await eventRows(uri))[0]!;
            expect(row.get('deliveries')[0].properties).toMatchObject({
                state: 'failed',
                failureReason: scenario === 'expired' ? 'retry_expired' : 'retry_exhausted',
            });
            expect(row.get('e').properties).not.toHaveProperty('payload');
            expect(row.get('e').properties).not.toHaveProperty('cleanupPending');
            expect(queue).not.toHaveBeenCalled();
        }
    );

    it('uses indexed cleanup and delivery lookups with a large finished history', async () => {
        const uri = await create([]);
        queue.mockRejectedValue(new Error('synthetic outage'));
        await accept(uri);
        const eventId = (await eventRows(uri))[0]!.get('e').properties.id;
        const prefix = `finished-${eventId}-`;
        await neogma.queryRunner.run(
            `
            UNWIND range(1,2000) AS n
            CREATE (e:ConsentFlowEvent {id:$prefix+toString(n), createdAt:$now})
            CREATE (e)-[:HAS_DELIVERY]->(:ConsentFlowEventDelivery {id:$prefix+toString(n), state:'delivered'})
        `,
            { prefix, now: new Date().toISOString() }
        );
        await ensureContractEventMaintenance();
        await neogma.queryRunner.run('CALL db.awaitIndexes()');
        const querySpy = vi.spyOn(neogma.queryRunner, 'run');
        await dispatchContractEvents({ eventId, budgetMs: 0 });
        await dispatchContractEvents({ budgetMs: 0 });
        const lookups = querySpy.mock.calls.filter(
            ([query]) =>
                String(query).includes('WITH event LIMIT $limit') ||
                String(query).includes('RETURN event, delivery ORDER BY')
        );
        querySpy.mockRestore();
        expect(lookups).toHaveLength(4);
        type Plan = { operatorType: string; children?: Plan[] };
        const operators = (plan: Plan): string[] => [
            plan.operatorType,
            ...(plan.children ?? []).flatMap(operators),
        ];
        for (const [query, params] of lookups) {
            const result = await neogma.queryRunner.run(`EXPLAIN ${query}`, params);
            const plan = operators(result.summary.plan!);
            expect(plan.some(operator => operator.startsWith('NodeByLabelScan'))).toBe(false);
            expect(plan.some(operator => operator.includes('Index'))).toBe(true);
        }
        await neogma.queryRunner.run(
            `MATCH (e:ConsentFlowEvent) WHERE e.id STARTS WITH $prefix
            OPTIONAL MATCH (e)-[:HAS_DELIVERY]->(d) DETACH DELETE e,d`,
            { prefix }
        );
    });

    it('acknowledges permanent queued contract rejection but retries negative storage acknowledgements', async () => {
        const uri = await create([]);
        await accept(uri);
        const queued = structuredClone(delivered[0]!);
        useDirectWebhook('https://synthetic.example/events');
        const fetchSpy = vi
            .spyOn(globalThis, 'fetch')
            .mockResolvedValue(new Response('{}', { status: 403 }));
        await expect(deliverQueuedNotification(JSON.stringify(queued))).resolves.toBeUndefined();
        await expect(notifications.sendNotification(structuredClone(queued))).resolves.toBe(false);
        fetchSpy.mockResolvedValue(new Response('{"success":false}', { status: 200 }));
        await expect(deliverQueuedNotification(JSON.stringify(queued))).rejects.toThrow(
            'Notification was not durably stored'
        );
    });

    it('does not widen a decision fan-out when an exact terminal retry follows a recipient addition', async () => {
        const uri = await create();
        await send(uri);
        await learner.clients.fullAuth.contracts.denyContractRequest({ contractUri: uri });
        await flush(uri);
        delivered.length = 0;
        await owner.clients.fullAuth.contracts.addContractRecipient({
            contractUri: uri,
            recipient: outsider.profileId,
        });
        await learner.clients.fullAuth.contracts.denyContractRequest({ contractUri: uri });
        await flush(uri);
        expect(delivered).toEqual([]);
        const decision = (await eventRows(uri)).find(
            row => row.get('e').properties.kind === 'request_denied'
        )!;
        expect(decision.get('deliveries')).toHaveLength(2);
    });

    it('suppresses pending and already queued data after recipient removal', async () => {
        const uri = await create();
        await send(uri);
        queue.mockRejectedValue(new Error('synthetic outage'));
        await accept(uri);
        const consentEvent = (await eventRows(uri))
            .find(row => row.get('e').properties.kind === 'consent_created')!
            .get('e').properties;
        const targetDelivery = (await eventRows(uri))
            .find(row => row.get('e').properties.id === consentEvent.id)!
            .get('deliveries')
            .find(
                (d: { properties: { toId: string } }) => d.properties.toId === recipient.profileId
            ).properties;
        const queued: LCNNotification = {
            type: 'CONSENT_FLOW_TRANSACTION',
            from: { profileId: learner.profileId, did: learner.learnCard.id.did() },
            to: { profileId: recipient.profileId, did: recipient.learnCard.id.did() },
            data: {
                metadata: {
                    eventId: consentEvent.id,
                    deliveryKey: targetDelivery.id,
                    event: 'consent_created',
                    contractUri: uri,
                    termsUri: `lc:network:localhost%3A3000:terms:${consentEvent.termsId}`,
                    recipientRole: 'recipient',
                },
            },
        };
        await owner.clients.fullAuth.contracts.removeContractRecipient({
            contractUri: uri,
            recipient: recipient.profileId,
        });
        expect(await authorizeContractNotification(queued)).toBe(false);
        const transport = vi.spyOn(notifications, 'sendNotification').mockResolvedValue(true);
        await deliverQueuedNotification(JSON.stringify(queued));
        expect(transport).not.toHaveBeenCalled();
        queue.mockImplementation(async n => {
            delivered.push(structuredClone(n));
            return undefined;
        });
        delivered.length = 0;
        await due(consentEvent.id);
        await dispatchContractEvents({ eventId: consentEvent.id });
        expect(delivered.every(n => n.to.profileId !== recipient.profileId)).toBe(true);
    });

    it('filters queued old personal/credential payloads after edits and blocks them after withdrawal', async () => {
        const uri = await create();
        await send(uri);
        delivered.length = 0;
        const { termsUri } = await accept(uri);
        delivered.length = 0;
        await learner.clients.fullAuth.contracts.updateConsentedContractTerms({
            uri: termsUri,
            terms: normalFullTerms,
            audienceVersion: 2,
        });
        await flush(uri);
        const queued = structuredClone(
            delivered.find(n => n.to.profileId === recipient.profileId)!
        );
        queued.data!.transaction!.terms = structuredClone(normalFullTerms);
        const terms = structuredClone(normalFullTerms);
        terms.read.personal = {};
        terms.read.credentials.categories.Achievement!.sharing = false;
        await learner.clients.fullAuth.contracts.updateConsentedContractTerms({
            uri: termsUri,
            terms,
            audienceVersion: 2,
        });
        expect(await authorizeContractNotification(queued)).toBe(true);
        expect(queued.data?.transaction?.terms?.read.personal).toEqual({});
        expect(
            queued.data?.transaction?.terms?.read.credentials.categories.Achievement?.shared
        ).toEqual([]);
        await learner.clients.fullAuth.contracts.withdrawConsent({ uri: termsUri });
        expect(await authorizeContractNotification(queued)).toBe(false);
    });

    it('retries a real loopback webhook after HTTP 503 with the same event and delivery key', async () => {
        const bodies: LCNNotification[] = [];
        const server = createServer((request, response) => {
            let body = '';
            request.on('data', chunk => {
                body += chunk;
            });
            request.on('end', () => {
                bodies.push(JSON.parse(body));
                response.writeHead(bodies.length === 1 ? 503 : 200, {
                    'Content-Type': 'application/json',
                });
                response.end(JSON.stringify({ success: bodies.length > 1 }));
            });
        });
        await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
        const address = server.address();
        if (!address || typeof address === 'string') throw new Error('Missing test server address');
        try {
            const uri = await create();
            queue.mockRestore();
            vi.spyOn(runtime, 'getNotificationRuntimeEnvironment').mockReturnValue({
                ...runtime.getNotificationRuntimeEnvironment(),
                NODE_ENV: 'development',
                IS_OFFLINE: false,
                NOTIFICATIONS_QUEUE_URL: undefined,
                IS_E2E_TEST: false,
                NOTIFICATIONS_SERVICE_WEBHOOK_URL: `http://127.0.0.1:${address.port}/events`,
            });
            // The synthetic JWT bypasses signing only; HTTP serialization, status handling,
            // acknowledgement and persisted retry all use the real notification transport.
            vi.spyOn(learnCardHelpers, 'getDidWebLearnCard').mockResolvedValue({
                invoke: { getDidAuthVp: async () => 'synthetic.auth.jwt' },
            } as unknown as Awaited<ReturnType<typeof learnCardHelpers.getDidWebLearnCard>>);
            await expect(send(uri)).resolves.toBe(true);
            expect(bodies).toHaveLength(1);
            const eventId = (await status(uri))!.requestId!;
            await due(eventId);
            await dispatchContractEvents({ eventId });
            expect(bodies).toHaveLength(2);
            expect(bodies[0]?.data?.metadata).toEqual(bodies[1]?.data?.metadata);
            expect(bodies[1]?.data?.metadata).toMatchObject({
                eventId,
                externalReferenceId: 'synthetic-ref-123',
            });
            await due(eventId);
            await dispatchContractEvents({ eventId });
            expect(bodies).toHaveLength(2);
        } finally {
            await new Promise<void>((resolve, reject) =>
                server.close(error => (error ? reject(error) : resolve()))
            );
        }
    });

    it('suppresses stale pending invitations after a decision and exposes generic APIs in OpenAPI', async () => {
        const uri = await create();
        await send(uri);
        const invitation = structuredClone(delivered[0]!);
        await learner.clients.fullAuth.contracts.denyContractRequest({ contractUri: uri });
        expect(await authorizeContractNotification(invitation)).toBe(false);
        expect(openApiDocument.paths?.['/consent-flow-contracts/request']?.post).toBeTruthy();
        expect(openApiDocument.paths?.['/consent-flow-contracts/deny-request']?.post).toBeTruthy();
        expect(JSON.stringify(openApiDocument)).toContain('externalReferenceId');
    });
});
