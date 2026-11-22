import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { randomBytes, randomUUID } from 'node:crypto';
import type { LCNNotification } from '@learncard/types';
import { getUser } from './helpers/getClient';
import { normalContract, normalFullTerms } from './helpers/contract';
import { neogma } from '@instance';
import * as contractRequests from '@accesslayer/consentflowcontract/read';
import * as requestCap from '@helpers/contract-request-cap.helpers';
import { createContractRequestInvite } from '@accesslayer/contract-request-invite/create';
import { getContractRequestInvite } from '@accesslayer/contract-request-invite/read';
import { attachContractRequestInvitesForProfile } from '@helpers/contract-request-invites.helpers';
import { dispatchContractEvents } from '@helpers/contract-events.helpers';
import * as notifications from '@helpers/notifications.helpers';

const DOMAIN = 'localhost%3A3000';

const actor = async (role: string) => {
    const user = await getUser(randomBytes(32).toString('hex'));
    const profileId = `invite-attach-${role}-${randomBytes(5).toString('hex')}`;
    await user.clients.fullAuth.profile.createProfile({ profileId });
    return { ...user, profileId };
};
type Actor = Awaited<ReturnType<typeof actor>>;
const id = (uri: string): string => uri.split(':').at(-1)!;
const randomEmail = (): string => `${randomBytes(6).toString('hex')}@example.com`;

const addEmail = (profileId: string, value: string) =>
    neogma.queryRunner.run(
        `MATCH (p:Profile {profileId: $profileId})
         CREATE (p)-[:HAS_CONTACT_METHOD]->(:ContactMethod {id: $id, type: 'email', value: $value,
             isVerified: true, verifiedAt: $now, isPrimary: false, createdAt: $now})`,
        { profileId, id: randomUUID(), value, now: new Date().toISOString() }
    );

describe('attachContractRequestInvitesForProfile', () => {
    let owner: Actor;
    let recipient: Actor;
    let learner: Actor;
    let contractUri: string;
    let delivered: LCNNotification[];

    beforeEach(async () => {
        [owner, recipient, learner] = await Promise.all([
            actor('owner'),
            actor('recipient'),
            actor('learner'),
        ]);
        contractUri = await owner.clients.fullAuth.contracts.createConsentFlowContract({
            name: 'Synthetic referral',
            contract: normalContract,
            recipients: [recipient.profileId],
        });
        delivered = [];
        vi.spyOn(notifications, 'addNotificationToQueue').mockImplementation(async notification => {
            delivered.push(structuredClone(notification));
            return undefined;
        });
    });
    afterEach(() => vi.restoreAllMocks());

    const invite = async (email: string, sender = recipient): Promise<string> =>
        (await createContractRequestInvite({
            contractId: id(contractUri),
            email,
            senderProfileId: sender.profileId,
            externalReferenceId: 'synthetic-ref-1',
            message: 'Synthetic invitation',
        }))!.invite.id;
    const flush = async (): Promise<void> => {
        const rows = await neogma.queryRunner.run(
            'MATCH (e:ConsentFlowEvent {contractId: $contractId}) RETURN e.id AS eventId',
            { contractId: id(contractUri) }
        );
        for (const row of rows.records)
            await dispatchContractEvents({ eventId: row.get('eventId') });
    };

    it('turns a pending invite into a request with the same ID and notifies the target', async () => {
        const email = randomEmail();
        const requestId = await invite(email);
        await addEmail(learner.profileId, email.toUpperCase());

        expect(await attachContractRequestInvitesForProfile(learner, DOMAIN)).toBe(1);
        expect(await attachContractRequestInvitesForProfile(learner, DOMAIN)).toBe(0);

        const stored = await learner.clients.fullAuth.contracts.getRequestStatusForProfile({
            contractUri,
            targetProfileId: learner.profileId,
        });
        expect(stored).toMatchObject({
            requestId,
            status: 'pending',
            requestedBy: recipient.profileId,
            externalReferenceId: 'synthetic-ref-1',
            message: 'Synthetic invitation',
        });
        expect(await getContractRequestInvite(id(contractUri), requestId)).toMatchObject({
            status: 'attached',
            attachedProfileId: learner.profileId,
        });

        await flush();
        const sent = delivered.filter(n => n.data?.metadata?.event === 'request_sent');
        expect(sent).toHaveLength(1);
        expect(sent[0]).toMatchObject({
            to: { profileId: learner.profileId },
            data: { metadata: { requestId } },
        });
    });

    it('keeps the profile hidden from the sender until the request is accepted', async () => {
        const email = randomEmail();
        const requestId = await invite(email);
        await addEmail(learner.profileId, email);
        await attachContractRequestInvitesForProfile(learner, DOMAIN);

        const pending = await recipient.clients.fullAuth.contracts.getContractRequest({
            contractUri,
            requestId,
        });
        expect(pending).toMatchObject({ requestId, status: 'pending', target: { email } });
        expect(JSON.stringify(pending)).not.toContain(learner.profileId);

        await learner.clients.fullAuth.contracts.consentToContract({
            contractUri,
            terms: normalFullTerms,
            expectedRequestId: requestId,
            audienceVersion: (
                await owner.clients.fullAuth.contracts.getConsentFlowContract({ uri: contractUri })
            ).audienceVersion,
        });
        expect(
            await recipient.clients.fullAuth.contracts.getContractRequest({
                contractUri,
                requestId,
            })
        ).toMatchObject({
            status: 'accepted',
            target: { profile: { profileId: learner.profileId } },
        });
    });

    it.each(['denied', 'cancelled', 'accepted'] as const)(
        'preserves sender and manager request views during email attachment after a %s request',
        async previousStatus => {
            const sender = recipient.clients.fullAuth.contracts;
            const manager = owner.clients.fullAuth.contracts;
            const target = learner.clients.fullAuth.contracts;
            const profileInput = { contractUri, targetProfileId: learner.profileId };
            const { requestId: previousId } = await sender.sendContractRequest({
                ...profileInput,
                externalReferenceId: 'previous-referral',
            });
            const previousInput = { contractUri, requestId: previousId };
            const consentInput = {
                contractUri,
                terms: normalFullTerms,
                audienceVersion: (await manager.getConsentFlowContract({ uri: contractUri }))
                    .audienceVersion,
            };
            if (previousStatus === 'cancelled') {
                await sender.cancelContractRequest(previousInput);
            } else if (previousStatus === 'denied') {
                await target.denyContractRequest(previousInput);
            } else {
                const { termsUri } = await target.consentToContract({
                    ...consentInput,
                    expectedRequestId: previousId,
                });
                await target.withdrawConsent({ uri: termsUri });
            }

            const email = randomEmail();
            const requestId = await invite(email);
            const newInput = { contractUri, requestId };
            const externalView = (viewer: typeof sender) =>
                Promise.all([
                    viewer.getRequestStatusForProfile(profileInput),
                    viewer.getContractRequest(previousInput),
                    viewer.getContractRequest(newInput),
                    viewer.getContractSentRequests({ contractUri }),
                ]);
            const initial = await Promise.all([externalView(sender), externalView(manager)]);
            expect(initial[0]?.[0]).toMatchObject({
                requestId: previousId,
                status: previousStatus,
            });
            expect(initial[0]?.[2]).toMatchObject({
                requestId,
                status: 'pending',
                target: { email },
            });

            await addEmail(learner.profileId, email);
            expect(await attachContractRequestInvitesForProfile(learner, DOMAIN)).toBe(1);
            await expect(target.getRequestStatusForProfile(profileInput)).resolves.toMatchObject({
                requestId,
                status: 'pending',
            });
            await target.markContractRequestAsSeen(profileInput);
            expect(await Promise.all([externalView(sender), externalView(manager)])).toEqual(
                initial
            );
            await expect(manager.markContractRequestAsSeen(profileInput)).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
            for (const cancelInput of [profileInput, previousInput]) {
                const result = manager.cancelContractRequest(cancelInput);
                if (previousStatus === 'cancelled') {
                    await expect(result).resolves.toBe(true);
                } else {
                    await expect(result).rejects.toMatchObject({ code: 'CONFLICT' });
                }
            }
            expect(await Promise.all([externalView(sender), externalView(manager)])).toEqual(
                initial
            );

            if (previousStatus === 'denied') {
                await target.denyContractRequest(newInput);
                for (const viewer of [sender, manager]) {
                    await expect(
                        viewer.getRequestStatusForProfile(profileInput)
                    ).resolves.toMatchObject({
                        requestId: previousId,
                        status: previousStatus,
                    });
                    await expect(viewer.getContractRequest(newInput)).resolves.toMatchObject({
                        status: 'denied',
                        target: { email },
                    });
                }
                return;
            }

            await target.consentToContract({ ...consentInput, expectedRequestId: requestId });
            for (const viewer of [sender, manager]) {
                await expect(
                    viewer.getRequestStatusForProfile(profileInput)
                ).resolves.toMatchObject({
                    requestId,
                    status: 'accepted',
                });
                await expect(viewer.getContractRequest(newInput)).resolves.toMatchObject({
                    status: 'accepted',
                    target: { profile: { profileId: learner.profileId } },
                });
                await expect(viewer.getContractRequest(previousInput)).rejects.toMatchObject({
                    code: 'NOT_FOUND',
                });
            }
        }
    );

    it('leaves the invite pending when the profile already has a request for the contract', async () => {
        await owner.clients.fullAuth.contracts.sendContractRequest({
            contractUri,
            targetProfileId: learner.profileId,
        });
        const email = randomEmail();
        const requestId = await invite(email);
        await addEmail(learner.profileId, email);

        expect(await attachContractRequestInvitesForProfile(learner, DOMAIN)).toBe(0);
        expect(await getContractRequestInvite(id(contractUri), requestId)).toMatchObject({
            status: 'pending',
        });
    });

    it('attaches a new invite after denial and keeps the old email decision redacted', async () => {
        const email = randomEmail();
        await addEmail(learner.profileId, email);
        const oldId = await invite(email);
        expect(await attachContractRequestInvitesForProfile(learner, DOMAIN)).toBe(1);
        await learner.clients.fullAuth.contracts.denyContractRequest({ contractUri });
        const requestId = await invite(email, owner);

        expect(await attachContractRequestInvitesForProfile(learner, DOMAIN)).toBe(1);
        await expect(
            learner.clients.fullAuth.contracts.getRequestStatusForProfile({
                contractUri,
                targetProfileId: learner.profileId,
            })
        ).resolves.toMatchObject({ requestId, requestedBy: owner.profileId, status: 'pending' });
        await expect(
            recipient.clients.fullAuth.contracts.getContractRequest({
                contractUri,
                requestId: oldId,
            })
        ).resolves.toMatchObject({ status: 'denied', target: { email } });
    });

    it('keeps separate rolling allowances for profile requests and email attachments', async () => {
        vi.spyOn(requestCap, 'getContractRequestCap').mockReturnValue(1);
        const sender = recipient.clients.fullAuth.contracts;
        const target = learner.clients.fullAuth.contracts;
        const profileInput = { contractUri, targetProfileId: learner.profileId };
        const email = randomEmail();
        await addEmail(learner.profileId, email);
        const firstInvite = await sender.sendContractRequest({ contractUri, targetEmail: email });
        expect(await attachContractRequestInvitesForProfile(learner, DOMAIN)).toBe(1);
        await target.denyContractRequest({ contractUri, requestId: firstInvite.requestId });

        const direct = await sender.sendContractRequest(profileInput);
        expect(direct.status).toBe('pending');
        await target.denyContractRequest({ contractUri, requestId: direct.requestId });
        await expect(sender.sendContractRequest(profileInput)).rejects.toMatchObject({
            code: 'TOO_MANY_REQUESTS',
        });

        const result = await sender.sendContractRequest({ contractUri, targetEmail: email });
        expect(result).toMatchObject({ status: 'pending' });
        expect(result.requestId).not.toBe(firstInvite.requestId);
        expect(await attachContractRequestInvitesForProfile(learner, DOMAIN)).toBe(0);
        expect(await getContractRequestInvite(id(contractUri), result.requestId)).toMatchObject({
            status: 'pending',
        });

        await neogma.queryRunner.run(
            'MATCH (:ConsentFlowContract {id: $id})-[r:REQUESTED_FOR]->() SET r.emailRequestTimes = [$oldest]',
            { id: id(contractUri), oldest: `2000-01-01T00:00:00.000Z|${recipient.profileId}` }
        );
        expect(await attachContractRequestInvitesForProfile(learner, DOMAIN)).toBe(1);
        expect(await getContractRequestInvite(id(contractUri), result.requestId)).toMatchObject({
            status: 'attached',
        });
    });

    it('does not deliver an old pending invite again after a profile send supersedes it', async () => {
        const email = randomEmail();
        const oldId = await invite(email);
        await addEmail(learner.profileId, email);
        expect(await attachContractRequestInvitesForProfile(learner, DOMAIN)).toBe(1);
        const replacement = await recipient.clients.fullAuth.contracts.sendContractRequest({
            contractUri,
            targetProfileId: learner.profileId,
        });
        await learner.clients.fullAuth.contracts.denyContractRequest({ contractUri });

        expect(await attachContractRequestInvitesForProfile(learner, DOMAIN)).toBe(0);
        expect(await getContractRequestInvite(id(contractUri), oldId)).toMatchObject({
            status: 'pending',
        });
        await expect(
            learner.clients.fullAuth.contracts.getRequestStatusForProfile({
                contractUri,
                targetProfileId: learner.profileId,
            })
        ).resolves.toMatchObject({ requestId: replacement.requestId, status: 'denied' });
    });

    it('keeps a profile-based cancellation from reaching an email request attached after the read', async () => {
        await owner.clients.fullAuth.contracts.sendContractRequest({
            contractUri,
            targetProfileId: learner.profileId,
        });
        await learner.clients.fullAuth.contracts.denyContractRequest({ contractUri });
        const email = randomEmail();
        const replacementId = await invite(email, owner);
        await addEmail(learner.profileId, email);

        const readRequest = contractRequests.getStoredContractRequest;
        vi.spyOn(contractRequests, 'getStoredContractRequest').mockImplementationOnce(
            async (...args) => {
                const snapshot = await readRequest(...args);
                expect(await attachContractRequestInvitesForProfile(learner, DOMAIN)).toBe(1);
                return snapshot;
            }
        );
        await expect(
            owner.clients.fullAuth.contracts.cancelContractRequest({
                contractUri,
                targetProfileId: learner.profileId,
            })
        ).rejects.toMatchObject({ code: 'CONFLICT' });
        await expect(
            learner.clients.fullAuth.contracts.getRequestStatusForProfile({
                contractUri,
                targetProfileId: learner.profileId,
            })
        ).resolves.toMatchObject({ requestId: replacementId, status: 'pending' });
    });

    it('does not attach an invite detached by LC-2372 before re-referral was introduced', async () => {
        const email = randomEmail();
        const oldId = await invite(email);
        await addEmail(learner.profileId, email);
        expect(await attachContractRequestInvitesForProfile(learner, DOMAIN)).toBe(1);

        // Recreate the state left by LC-2372 after a profile send superseded the invite.
        const replacementId = randomUUID();
        await neogma.queryRunner.run(
            `MATCH (contract:ConsentFlowContract {id: $contractId})-[r:REQUESTED_FOR]->()
             MATCH (contract)-[:HAS_REQUEST_INVITE]->(i:ContractRequestInvite {id: $oldId})
             SET i.status = 'pending', r.requestId = $replacementId, r.status = 'denied'
             REMOVE i.attachedProfileId, i.attachedAt, r.addressedByEmail, r.expiresAt, r.profileRequestTimes, r.emailRequestTimes`,
            { contractId: id(contractUri), oldId, replacementId }
        );

        expect(await attachContractRequestInvitesForProfile(learner, DOMAIN)).toBe(0);
        await expect(
            learner.clients.fullAuth.contracts.getRequestStatusForProfile({
                contractUri,
                targetProfileId: learner.profileId,
            })
        ).resolves.toMatchObject({ requestId: replacementId, status: 'denied' });
    });

    it('does not attach an invite to its own sender', async () => {
        const email = randomEmail();
        const requestId = await invite(email);
        await addEmail(recipient.profileId, email);

        expect(await attachContractRequestInvitesForProfile(recipient, DOMAIN)).toBe(0);
        expect(await getContractRequestInvite(id(contractUri), requestId)).toMatchObject({
            status: 'pending',
        });
    });

    it('never throws', async () => {
        await expect(
            attachContractRequestInvitesForProfile({ profileId: 'missing-profile' }, DOMAIN)
        ).resolves.toBe(0);
    });

    it('skips invites that can never attach, so they do not block newer ones', async () => {
        const email = randomEmail();
        const deadContractUri = await owner.clients.fullAuth.contracts.createConsentFlowContract({
            name: 'Synthetic short referral',
            contract: normalContract,
            recipients: [recipient.profileId],
        });
        await createContractRequestInvite({
            contractId: id(deadContractUri),
            email,
            senderProfileId: recipient.profileId,
        });
        await neogma.queryRunner.run(
            'MATCH (c:ConsentFlowContract {id: $contractId}) SET c.expiresAt = $past',
            { contractId: id(deadContractUri), past: '2000-01-01T00:00:00.000Z' }
        );
        const requestId = await invite(email);
        await addEmail(learner.profileId, email);

        expect(await attachContractRequestInvitesForProfile(learner, 'localhost%3A3000', 1)).toBe(
            1
        );
        expect(await getContractRequestInvite(id(contractUri), requestId)).toMatchObject({
            status: 'attached',
        });
    });
});
