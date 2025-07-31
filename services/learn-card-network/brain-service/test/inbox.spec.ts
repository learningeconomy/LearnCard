import { vi, describe, it, expect, beforeEach, afterAll, beforeAll } from 'vitest';
import { getClient, getUser } from './helpers/getClient';
import { Profile, SigningAuthority, InboxCredential, ContactMethod } from '@models';
import {
    LCNInboxStatusEnumValidator,
    LCNNotificationTypeEnumValidator,
    VC,
    VP,
} from '@learncard/types';
import { sendSpy, addNotificationToQueueSpy } from './helpers/spies';
import * as notifications from '@helpers/notifications.helpers';

const noAuthClient = getClient();
let userA: Awaited<ReturnType<typeof getUser>>;
let userB: Awaited<ReturnType<typeof getUser>>;
let userC: Awaited<ReturnType<typeof getUser>>;

vi.mock('@services/delivery/delivery.factory', () => ({
    getDeliveryService: () => ({ send: sendSpy }),
}));

const getExchangeIdFromClaimUrl = (claimUrl: string | undefined) => {
    if (!claimUrl) return undefined;
    const url = new URL(claimUrl);
    return url.pathname.split('/').pop()?.replace('?iuv=1', '');
};

describe('Universal Inbox', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        process.env = { ...originalEnv };
    });

    afterAll(() => {
        process.env = originalEnv;
    });

    beforeAll(async () => {
        userA = await getUser('a'.repeat(64));
        userB = await getUser('b'.repeat(64));
        userC = await getUser('c'.repeat(64));
    });

    describe('Issue credential to inbox', () => {
        beforeEach(async () => {
            sendSpy.mockClear();
            vi.spyOn(notifications, 'addNotificationToQueue').mockImplementation(
                addNotificationToQueueSpy
            );
            addNotificationToQueueSpy.mockClear();
            await Profile.delete({ detach: true, where: {} });
            await InboxCredential.delete({ detach: true, where: {} });
            await userA.clients.fullAuth.profile.createProfile({
                profileId: 'usera',
                displayName: 'User A',
            });
            await userB.clients.fullAuth.profile.createProfile({ profileId: 'userb' });
            await userC.clients.fullAuth.profile.createProfile({ profileId: 'userc' });
        });

        afterAll(async () => {
            sendSpy.mockClear();
            await Profile.delete({ detach: true, where: {} });
            await InboxCredential.delete({ detach: true, where: {} });
        });

        it('should not allow you to issue a credential to an inbox without full auth', async () => {
            const vc = await userA.learnCard.invoke.getTestVc();
            await expect(
                noAuthClient.inbox.issue({
                    credential: vc,
                    recipient: { type: 'email', value: 'userA@test.com' },
                })
            ).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
            await expect(
                userA.clients.partialAuth.inbox.issue({
                    credential: vc,
                    recipient: { type: 'email', value: 'userA@test.com' },
                })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        });

        it('should allow you to send an already signed credential to an inbox', async () => {
            const vc = await userA.learnCard.invoke.issueCredential(
                await userA.learnCard.invoke.getTestVc()
            );
            await expect(
                userA.clients.fullAuth.inbox.issue({
                    credential: vc,
                    recipient: { type: 'email', value: 'userA@test.com' },
                })
            ).resolves.not.toThrow();
        });

        it('should allow you to send an unsigned credential to an inbox with a signing authority', async () => {
            const vc = await userA.learnCard.invoke.getTestVc();
            await expect(
                userA.clients.fullAuth.inbox.issue({
                    credential: vc,
                    recipient: { type: 'email', value: 'userA@test.com' },
                    configuration: {
                        signingAuthority: { endpoint: 'https://example.com', name: 'Example' },
                    },
                })
            ).resolves.not.toThrow();
        });

        it('should not allow you to send an unsigned credential to an inbox without a signing authority', async () => {
            const vc = await userA.learnCard.invoke.getTestVc();
            await expect(
                userA.clients.fullAuth.inbox.issue({
                    credential: vc,
                    recipient: { type: 'email', value: 'userA@test.com' },
                })
            ).rejects.toMatchObject({
                code: 'BAD_REQUEST',
                message: 'Unsigned credentials require a signing authority',
            });
        });

        it('should allow you to send an unsigned credential if your profile has a primary signing authority set up', async () => {
            await expect(
                userA.clients.fullAuth.profile.registerSigningAuthority({
                    endpoint: 'http://localhost:4000',
                    name: 'mysa',
                    did: 'did:key:z6MkitsQTk2GDNYXAFckVcQHtC68S9j9ruVFYWrixM6RG5Mw',
                })
            ).resolves.not.toThrow();

            const vc = await userA.learnCard.invoke.getTestVc();
            await expect(
                userA.clients.fullAuth.inbox.issue({
                    credential: vc,
                    recipient: { type: 'email', value: 'userA@test.com' },
                })
            ).resolves.not.toThrow();
        });

        it('should throw an error if the credential is unsigned, and is relying on a primary signing authority that cannot sign the credential', async () => {
            await expect(
                userA.clients.fullAuth.profile.registerSigningAuthority({
                    endpoint: 'http://localhost:4000',
                    name: 'mysa',
                    did: 'did:key:z6MkitsQTk2GDNYXAFckVcQHtC68S9j9ruVFYWrixM6RG5Mw',
                })
            ).resolves.not.toThrow();

            const vc = await userA.learnCard.invoke.getTestVc();

            // mess with context to simulate ill-formed credential
            vc.context = 'banana';

            await expect(
                userA.clients.fullAuth.inbox.issue({
                    credential: vc,
                    recipient: { type: 'email', value: 'userA@test.com' },
                })
            ).rejects.toMatchObject({
                code: 'BAD_REQUEST',
                message:
                    'Credential failed to pass a pre-flight issuance test. Please verify that the credential is well-formed and can be issued.',
            });
        });

        it('should create an interoperable vc-api interaction claimUrl', async () => {
            const vc = await userA.learnCard.invoke.issueCredential(
                await userA.learnCard.invoke.getTestVc()
            );
            const inboxCredential = await userA.clients.fullAuth.inbox.issue({
                credential: vc,
                recipient: { type: 'email', value: 'userA@test.com' },
            });
            expect(inboxCredential.claimUrl).not.toBeNull();
            expect(inboxCredential.claimUrl).toContain('/interactions/inbox-claim');
            expect(inboxCredential.claimUrl).toContain('?iuv=1');
        });

        it('should call the delivery service with the default template', async () => {
            const vc = await userA.learnCard.invoke.issueCredential(
                await userA.learnCard.invoke.getTestVc()
            );
            await userA.clients.fullAuth.inbox.issue({
                credential: vc,
                recipient: { type: 'email', value: 'newuser@test.com' },
            });

            expect(sendSpy).toHaveBeenCalledOnce();
            expect(sendSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    templateId: 'universal-inbox-claim',
                    templateModel: expect.objectContaining({
                        issuer: { name: 'User A' },
                    }),
                })
            );
        });

        it('should call the delivery service with a custom template model', async () => {
            const vc = await userA.learnCard.invoke.issueCredential(
                await userA.learnCard.invoke.getTestVc()
            );
            await userA.clients.fullAuth.inbox.issue({
                credential: vc,
                recipient: { type: 'email', value: 'customuser@test.com' },
                configuration: {
                    delivery: {
                        template: {
                            id: 'universal-inbox-claim',
                            model: {
                                issuer: {
                                    name: 'Montana Tech',
                                    logoUrl: 'https://picsum.photos/200',
                                },
                                credential: { name: 'Banana!', type: 'transcript' },
                                recipient: { name: 'Custom User' },
                            },
                        },
                    },
                },
            });

            expect(sendSpy).toHaveBeenCalledOnce();
            expect(sendSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    templateId: 'universal-inbox-claim',
                    templateModel: expect.objectContaining({
                        claimUrl: expect.any(String),
                        issuer: { name: 'Montana Tech', logoUrl: 'https://picsum.photos/200' },
                        credential: { name: 'Banana!', type: 'transcript' },
                        recipient: { name: 'Custom User', email: 'customuser@test.com' },
                    }),
                })
            );
        });

        it('should call the delivery service for a phone recipient', async () => {
            process.env.TRUSTED_ISSUERS_WHITELIST = userA.learnCard.id.did();
            const vc = await userA.learnCard.invoke.issueCredential(
                await userA.learnCard.invoke.getTestVc()
            );
            await userA.clients.fullAuth.inbox.issue({
                credential: vc,
                recipient: { type: 'phone', value: '+15551234567' },
            });

            expect(sendSpy).toHaveBeenCalledOnce();
            expect(sendSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    contactMethod: { type: 'phone', value: '+15551234567' },
                    templateId: 'universal-inbox-claim',
                })
            );
        });

        it('should not call the delivery service for a phone recipient if the issuer is not trusted', async () => {
            const vc = await userA.learnCard.invoke.issueCredential(
                await userA.learnCard.invoke.getTestVc()
            );
            await expect(
                userA.clients.fullAuth.inbox.issue({
                    credential: vc,
                    recipient: { type: 'phone', value: '+15551234567' },
                })
            ).rejects.toThrow();
        });

        it('should not call the delivery service if suppressDelivery is true', async () => {
            const vc = await userA.learnCard.invoke.issueCredential(
                await userA.learnCard.invoke.getTestVc()
            );
            await userA.clients.fullAuth.inbox.issue({
                credential: vc,
                recipient: { type: 'email', value: 'newuser@test.com' },
                configuration: {
                    delivery: {
                        suppress: true,
                    },
                },
            });

            expect(sendSpy).not.toHaveBeenCalled();
        });

        it('should trigger a webhook if provided when a credential is delivered', async () => {
            const vc = await userA.learnCard.invoke.issueCredential(
                await userA.learnCard.invoke.getTestVc()
            );
            const inboxCredential = await userA.clients.fullAuth.inbox.issue({
                credential: vc,
                recipient: { type: 'email', value: 'userB@test.com' },
                configuration: {
                    webhookUrl: 'https://example.com/webhook',
                },
            });

            expect(addNotificationToQueueSpy).toHaveBeenCalledOnce();
            expect(addNotificationToQueueSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    webhookUrl: 'https://example.com/webhook',
                    data: {
                        inbox: {
                            issuanceId: inboxCredential.issuanceId,
                            recipient: {
                                contactMethod: { type: 'email', value: 'userB@test.com' },
                            },
                            status: LCNInboxStatusEnumValidator.enum.DELIVERED,
                            timestamp: expect.any(String),
                        },
                    },
                    type: LCNNotificationTypeEnumValidator.enum.ISSUANCE_DELIVERED,
                })
            );
        });
    });

    describe('Get inbox credentials', () => {
        beforeEach(async () => {
            sendSpy.mockClear();
            await Profile.delete({ detach: true, where: {} });
            await InboxCredential.delete({ detach: true, where: {} });
            await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' });
            await userB.clients.fullAuth.profile.createProfile({ profileId: 'userb' });
            await userC.clients.fullAuth.profile.createProfile({ profileId: 'userc' });
        });

        afterAll(async () => {
            await Profile.delete({ detach: true, where: {} });
            await InboxCredential.delete({ detach: true, where: {} });
        });

        it('should allow you to get your inbox credentials', async () => {
            await expect(
                userA.clients.fullAuth.inbox.getMyIssuedCredentials({})
            ).resolves.not.toThrow();
        });

        it('should allow you to retrieve your issued inbox credentials', async () => {
            const vc = await userA.learnCard.invoke.getTestVc();
            await expect(
                userA.clients.fullAuth.inbox.issue({
                    credential: vc,
                    configuration: {
                        signingAuthority: { endpoint: 'https://example.com', name: 'Example' },
                    },
                    recipient: { type: 'email', value: 'userA@test.com' },
                })
            ).resolves.not.toThrow();
            await expect(
                userA.clients.fullAuth.inbox.getMyIssuedCredentials({})
            ).resolves.not.toThrow();

            await expect(
                userA.clients.fullAuth.inbox.issue({
                    credential: vc,
                    configuration: {
                        signingAuthority: { endpoint: 'https://example.com', name: 'Example' },
                    },
                    recipient: { type: 'email', value: 'userA@test.com' },
                })
            ).resolves.not.toThrow();

            const issuedCredentials = await userA.clients.fullAuth.inbox.getMyIssuedCredentials({});
            await expect(issuedCredentials.records).toHaveLength(2);

            // User B should have no issued credentials
            const userBIssuedCredentials =
                await userB.clients.fullAuth.inbox.getMyIssuedCredentials({});
            await expect(userBIssuedCredentials.records).toHaveLength(0);
        });

        it('should return paginated results', async () => {
            const vc = await userA.learnCard.invoke.getTestVc();
            for (let i = 0; i < 26; i++) {
                await expect(
                    userA.clients.fullAuth.inbox.issue({
                        credential: vc,
                        configuration: {
                            signingAuthority: { endpoint: 'https://example.com', name: 'Example' },
                        },
                        recipient: { type: 'email', value: 'userA@test.com' },
                    })
                ).resolves.not.toThrow();
            }
            await expect(
                userA.clients.fullAuth.inbox.getMyIssuedCredentials({})
            ).resolves.not.toThrow();

            const issuedCredentials = await userA.clients.fullAuth.inbox.getMyIssuedCredentials({
                limit: 5,
            });
            await expect(issuedCredentials.records).toHaveLength(5);
            expect(issuedCredentials.hasMore).toBe(true);
            expect(issuedCredentials.cursor).toBeDefined();

            const issuedCredentials2 = await userA.clients.fullAuth.inbox.getMyIssuedCredentials({
                limit: 5,
                cursor: issuedCredentials.cursor,
            });
            await expect(issuedCredentials2.records).toHaveLength(5);
            expect(issuedCredentials2.hasMore).toBe(true);
            expect(issuedCredentials2.cursor).toBeDefined();

            const issuedCredentials3 = await userA.clients.fullAuth.inbox.getMyIssuedCredentials({
                limit: 5,
                cursor: issuedCredentials2.cursor,
            });
            await expect(issuedCredentials3.records).toHaveLength(5);
            expect(issuedCredentials3.hasMore).toBe(true);
            expect(issuedCredentials3.cursor).toBeDefined();

            const issuedCredentials4 = await userA.clients.fullAuth.inbox.getMyIssuedCredentials({
                limit: 5,
                cursor: issuedCredentials3.cursor,
            });
            await expect(issuedCredentials4.records).toHaveLength(5);
            expect(issuedCredentials4.hasMore).toBe(true);
            expect(issuedCredentials4.cursor).toBeDefined();

            const issuedCredentials5 = await userA.clients.fullAuth.inbox.getMyIssuedCredentials({
                limit: 5,
                cursor: issuedCredentials4.cursor,
            });
            await expect(issuedCredentials5.records).toHaveLength(5);
            expect(issuedCredentials5.hasMore).toBe(true);
            expect(issuedCredentials5.cursor).toBeDefined();

            const issuedCredentials6 = await userA.clients.fullAuth.inbox.getMyIssuedCredentials({
                limit: 5,
                cursor: issuedCredentials5.cursor,
            });
            await expect(issuedCredentials6.records).toHaveLength(1);
            expect(issuedCredentials6.hasMore).toBe(false);
            expect(issuedCredentials6.cursor).toBeDefined();

            const issuedCredentials7 = await userA.clients.fullAuth.inbox.getMyIssuedCredentials({
                limit: 5,
                cursor: issuedCredentials6.cursor,
            });
            await expect(issuedCredentials7.records).toHaveLength(0);
            expect(issuedCredentials7.hasMore).toBe(false);
            expect(issuedCredentials7.cursor).toBeUndefined();
        });

        it('should allow you to filter your inbox credentials by status', async () => {
            const vc = await userA.learnCard.invoke.getTestVc();
            await expect(
                userA.clients.fullAuth.inbox.issue({
                    credential: vc,
                    configuration: {
                        signingAuthority: { endpoint: 'https://example.com', name: 'Example' },
                    },
                    recipient: { type: 'email', value: 'userA@test.com' },
                })
            ).resolves.not.toThrow();
            const pendingCreds = await userA.clients.fullAuth.inbox.getMyIssuedCredentials({
                query: { currentStatus: 'PENDING' },
            });
            await expect(pendingCreds.records).toHaveLength(1);

            const claimedCreds = await userA.clients.fullAuth.inbox.getMyIssuedCredentials({
                query: { currentStatus: 'CLAIMED' },
            });
            await expect(claimedCreds.records).toHaveLength(0);
        });

        it('should allow you to filter your inbox credentials by recipient email', async () => {
            const vc = await userA.learnCard.invoke.getTestVc();
            await expect(
                userA.clients.fullAuth.inbox.issue({
                    credential: vc,
                    configuration: {
                        signingAuthority: { endpoint: 'https://example.com', name: 'Example' },
                    },
                    recipient: { type: 'email', value: 'userA@test.com' },
                })
            ).resolves.not.toThrow();
            const pendingCreds = await userA.clients.fullAuth.inbox.getMyIssuedCredentials({
                query: { currentStatus: 'PENDING' },
                recipient: { type: 'email', value: 'userA@test.com' },
            });
            await expect(pendingCreds.records).toHaveLength(1);

            const pendingCredsB = await userA.clients.fullAuth.inbox.getMyIssuedCredentials({
                query: { currentStatus: 'PENDING' },
                recipient: { type: 'email', value: 'userB@test.com' },
            });
            await expect(pendingCredsB.records).toHaveLength(0);

            // User B should not see credentials User A issued to user A
            const userBTriesToGetIssuedCredsForUserA =
                await userB.clients.fullAuth.inbox.getMyIssuedCredentials({
                    query: { currentStatus: 'PENDING' },
                    recipient: { type: 'email', value: 'userA@test.com' },
                });
            await expect(userBTriesToGetIssuedCredsForUserA.records).toHaveLength(0);
        });

        it('should paginate compound filters', async () => {
            process.env.TRUSTED_ISSUERS_WHITELIST = userA.learnCard.id.did();
            const vc = await userA.learnCard.invoke.getTestVc();
            const signedCredential = await userA.learnCard.invoke.issueCredential(vc);
            await userA.clients.fullAuth.inbox.issue({
                credential: vc,
                configuration: {
                    signingAuthority: { endpoint: 'https://example.com', name: 'Example' },
                },
                recipient: { type: 'email', value: 'userA@test.com' },
            });

            await userA.clients.fullAuth.inbox.issue({
                credential: signedCredential,
                recipient: { type: 'email', value: 'userB@test.com' },
            });
            await userA.clients.fullAuth.inbox.issue({
                credential: signedCredential,
                recipient: { type: 'email', value: 'userB@test.com' },
            });
            await userA.clients.fullAuth.inbox.issue({
                credential: signedCredential,
                recipient: { type: 'email', value: 'userB@test.com' },
            });

            await userA.clients.fullAuth.inbox.issue({
                credential: signedCredential,
                recipient: { type: 'email', value: 'userC@test.com' },
            });
            await userA.clients.fullAuth.inbox.issue({
                credential: signedCredential,
                recipient: { type: 'email', value: 'userC@test.com' },
            });

            await userA.clients.fullAuth.inbox.issue({
                credential: signedCredential,
                recipient: { type: 'phone', value: '+15555555' },
            });
            await userA.clients.fullAuth.inbox.issue({
                credential: signedCredential,
                recipient: { type: 'phone', value: '+15555555' },
            });

            // Have User B claim the inbox credentials for this user issued by User A
            const inboxCredential = await userA.clients.fullAuth.inbox.issue({
                credential: signedCredential,
                recipient: { type: 'phone', value: '+15555555' },
            });

            const localExchangeId = getExchangeIdFromClaimUrl(inboxCredential?.claimUrl);
            if (!localExchangeId) {
                throw new Error('Local exchange ID is undefined');
            }
            const exchangeInitiationResponse =
                await userB.clients.fullAuth.workflows.participateInExchange({
                    localWorkflowId: 'inbox-claim',
                    localExchangeId,
                });
            const didAuthVp = (await userB.learnCard.invoke.getDidAuthVp({
                challenge: exchangeInitiationResponse?.verifiablePresentationRequest?.challenge,
                domain: exchangeInitiationResponse?.verifiablePresentationRequest?.domain,
            })) as VP;
            await userB.clients.fullAuth.workflows.participateInExchange({
                localWorkflowId: 'inbox-claim',
                localExchangeId,
                verifiablePresentation: didAuthVp,
            });
            await userA.clients.fullAuth.inbox.issue({
                credential: signedCredential,
                recipient: { type: 'phone', value: '+15555555' },
            });
            const deliveredInboxCredential = await userA.clients.fullAuth.inbox.issue({
                credential: signedCredential,
                recipient: { type: 'phone', value: '+15555555' },
            });

            // Now have User A query and filter paginated records
            expect(
                (
                    await userA.clients.fullAuth.inbox.getMyIssuedCredentials({
                        query: { currentStatus: LCNInboxStatusEnumValidator.enum.CLAIMED },
                    })
                ).records
            ).toHaveLength(3);
            const claimed = await userA.clients.fullAuth.inbox.getMyIssuedCredentials({
                query: { currentStatus: LCNInboxStatusEnumValidator.enum.CLAIMED },
                limit: 1,
            });
            await expect(claimed.records).toHaveLength(1);
            expect(
                (
                    await userA.clients.fullAuth.inbox.getMyIssuedCredentials({
                        query: { currentStatus: LCNInboxStatusEnumValidator.enum.CLAIMED },
                        limit: 3,
                        cursor: claimed.cursor,
                    })
                ).records
            ).toHaveLength(2);
            expect(
                (
                    await userA.clients.fullAuth.inbox.getMyIssuedCredentials({
                        query: { currentStatus: LCNInboxStatusEnumValidator.enum.CLAIMED },
                        limit: 1,
                        cursor: claimed.cursor,
                    })
                ).records
            ).toHaveLength(1);

            expect(
                (
                    await userA.clients.fullAuth.inbox.getMyIssuedCredentials({
                        query: { currentStatus: LCNInboxStatusEnumValidator.enum.PENDING },
                    })
                ).records
            ).toHaveLength(6);
            expect(
                (
                    await userA.clients.fullAuth.inbox.getMyIssuedCredentials({
                        query: {
                            currentStatus: LCNInboxStatusEnumValidator.enum.PENDING,
                            isSigned: true,
                        },
                    })
                ).records
            ).toHaveLength(5);
            expect(
                (
                    await userA.clients.fullAuth.inbox.getMyIssuedCredentials({
                        query: {
                            currentStatus: LCNInboxStatusEnumValidator.enum.PENDING,
                            isSigned: false,
                        },
                    })
                ).records
            ).toHaveLength(1);

            expect(
                (
                    await userA.clients.fullAuth.inbox.getMyIssuedCredentials({
                        recipient: { type: 'email', value: 'userA@test.com' },
                        query: { currentStatus: LCNInboxStatusEnumValidator.enum.PENDING },
                    })
                ).records
            ).toHaveLength(1);
            expect(
                (
                    await userA.clients.fullAuth.inbox.getMyIssuedCredentials({
                        recipient: { type: 'email', value: 'userB@test.com' },
                        query: { currentStatus: LCNInboxStatusEnumValidator.enum.PENDING },
                    })
                ).records
            ).toHaveLength(3);
            expect(
                (
                    await userA.clients.fullAuth.inbox.getMyIssuedCredentials({
                        recipient: { type: 'email', value: 'userC@test.com' },
                        query: { currentStatus: LCNInboxStatusEnumValidator.enum.PENDING },
                    })
                ).records
            ).toHaveLength(2);
            expect(
                (
                    await userA.clients.fullAuth.inbox.getMyIssuedCredentials({
                        recipient: { type: 'phone', value: '+15555555' },
                        query: { currentStatus: LCNInboxStatusEnumValidator.enum.CLAIMED },
                    })
                ).records
            ).toHaveLength(3);
            expect(
                (
                    await userA.clients.fullAuth.inbox.getMyIssuedCredentials({
                        recipient: { type: 'phone', value: '+15555555' },
                        query: { currentStatus: LCNInboxStatusEnumValidator.enum.PENDING },
                    })
                ).records
            ).toHaveLength(0);
            expect(
                (
                    await userA.clients.fullAuth.inbox.getMyIssuedCredentials({
                        recipient: { type: 'phone', value: '+15555555' },
                        query: { currentStatus: LCNInboxStatusEnumValidator.enum.DELIVERED },
                    })
                ).records
            ).toHaveLength(2);
            expect(
                (
                    await userA.clients.fullAuth.inbox.getMyIssuedCredentials({
                        recipient: { type: 'phone', value: '+15555555' },
                        query: {
                            currentStatus: LCNInboxStatusEnumValidator.enum.CLAIMED,
                            isSigned: true,
                        },
                    })
                ).records
            ).toHaveLength(3);
            expect(
                (
                    await userA.clients.fullAuth.inbox.getMyIssuedCredentials({
                        recipient: { type: 'phone', value: '+15555555' },
                        query: {
                            currentStatus: LCNInboxStatusEnumValidator.enum.CLAIMED,
                            isSigned: false,
                        },
                    })
                ).records
            ).toHaveLength(0);
            expect(
                (
                    await userA.clients.fullAuth.inbox.getMyIssuedCredentials({
                        recipient: { type: 'phone', value: '+15555555' },
                        query: {
                            currentStatus: LCNInboxStatusEnumValidator.enum.DELIVERED,
                            id: deliveredInboxCredential.issuanceId,
                            issuerDid: userA.learnCard.id.did(),
                        },
                    })
                ).records
            ).toHaveLength(1);
        });

        it("should create an email address contact method if it doesn't exist for the recipient", async () => {
            const vc = await userA.learnCard.invoke.getTestVc();
            await expect(
                userA.clients.fullAuth.inbox.issue({
                    credential: vc,
                    configuration: {
                        signingAuthority: { endpoint: 'https://example.com', name: 'Example' },
                    },
                    recipient: { type: 'email', value: 'userA@test.com' },
                })
            ).resolves.not.toThrow();

            const emailAddress = (
                await ContactMethod.findOne({ where: { value: 'userA@test.com' } })
            ).dataValues.value;
            await expect(emailAddress).toBe('userA@test.com');
        });

        it("should create a phone contact method if it doesn't exist for the recipient", async () => {
            process.env.TRUSTED_ISSUERS_WHITELIST = userA.learnCard.id.did();
            const vc = await userA.learnCard.invoke.getTestVc();
            await expect(
                userA.clients.fullAuth.inbox.issue({
                    credential: vc,
                    configuration: {
                        signingAuthority: { endpoint: 'https://example.com', name: 'Example' },
                    },
                    recipient: { type: 'phone', value: '+15555555' },
                })
            ).resolves.not.toThrow();

            const phone = (await ContactMethod.findOne({ where: { value: '+15555555' } }))
                .dataValues.value;
            await expect(phone).toBe('+15555555');
        });
    });

    describe('Get individual inbox credential', () => {
        beforeEach(async () => {
            sendSpy.mockClear();
            await Profile.delete({ detach: true, where: {} });
            await InboxCredential.delete({ detach: true, where: {} });
            await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' });
            await userB.clients.fullAuth.profile.createProfile({ profileId: 'userb' });
            await userC.clients.fullAuth.profile.createProfile({ profileId: 'userc' });
        });

        afterAll(async () => {
            await Profile.delete({ detach: true, where: {} });
            await InboxCredential.delete({ detach: true, where: {} });
        });

        it('should allow you to get an individual inbox credential', async () => {
            const vc = await userA.learnCard.invoke.getTestVc();
            const inboxCredential = await userA.clients.fullAuth.inbox.issue({
                credential: vc,
                configuration: {
                    signingAuthority: { endpoint: 'https://example.com', name: 'Example' },
                },
                recipient: { type: 'email', value: 'userA@test.com' },
            });
            await expect(
                userA.clients.fullAuth.inbox.getInboxCredential({
                    credentialId: inboxCredential.issuanceId,
                })
            ).resolves.not.toThrow();
        });
        it('should not allow you to get an individual inbox credential you do not own', async () => {
            const vc = await userA.learnCard.invoke.getTestVc();
            const inboxCredential = await userA.clients.fullAuth.inbox.issue({
                credential: vc,
                configuration: {
                    signingAuthority: { endpoint: 'https://example.com', name: 'Example' },
                },
                recipient: { type: 'email', value: 'userA@test.com' },
            });
            await expect(
                userB.clients.fullAuth.inbox.getInboxCredential({
                    credentialId: inboxCredential.issuanceId,
                })
            ).rejects.toThrow();
        });
    });

    describe('Claim inbox credential', () => {
        beforeEach(async () => {
            sendSpy.mockClear();
            vi.spyOn(notifications, 'addNotificationToQueue').mockImplementation(
                addNotificationToQueueSpy
            );
            addNotificationToQueueSpy.mockClear();
            await Profile.delete({ detach: true, where: {} });
            await InboxCredential.delete({ detach: true, where: {} });
            await ContactMethod.delete({ detach: true, where: {} });
            await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' });
            await userB.clients.fullAuth.profile.createProfile({ profileId: 'userb' });
            await userC.clients.fullAuth.profile.createProfile({ profileId: 'userc' });
        });

        afterAll(async () => {
            await Profile.delete({ detach: true, where: {} });
            await InboxCredential.delete({ detach: true, where: {} });
            await ContactMethod.delete({ detach: true, where: {} });
        });

        it('should allow you to claim an inbox credential', async () => {
            const vc = await userA.learnCard.invoke.issueCredential(
                await userA.learnCard.invoke.getTestVc()
            );
            const inboxCredential = await userA.clients.fullAuth.inbox.issue({
                credential: vc,
                recipient: { type: 'email', value: 'userA@test.com' },
            });

            const localExchangeId = getExchangeIdFromClaimUrl(inboxCredential.claimUrl);
            expect(localExchangeId).toBeDefined();

            if (!localExchangeId) {
                throw new Error('Local exchange ID is undefined');
            }

            const exchangeInitiationResponse =
                await userB.clients.fullAuth.workflows.participateInExchange({
                    localWorkflowId: 'inbox-claim',
                    localExchangeId,
                });
            expect(exchangeInitiationResponse).toBeDefined();
            expect(exchangeInitiationResponse?.verifiablePresentationRequest).toBeDefined();
            expect(exchangeInitiationResponse?.verifiablePresentationRequest?.query).toBeDefined();
            expect(
                exchangeInitiationResponse?.verifiablePresentationRequest?.challenge
            ).toBeDefined();
            expect(exchangeInitiationResponse?.verifiablePresentationRequest?.domain).toBeDefined();

            const didAuthVp = (await userB.learnCard.invoke.getDidAuthVp({
                challenge: exchangeInitiationResponse?.verifiablePresentationRequest?.challenge,
                domain: exchangeInitiationResponse?.verifiablePresentationRequest?.domain,
            })) as VP;

            const exchangePresentationResponse =
                await userB.clients.fullAuth.workflows.participateInExchange({
                    localWorkflowId: 'inbox-claim',
                    localExchangeId,
                    verifiablePresentation: didAuthVp,
                });

            expect(exchangePresentationResponse).toBeDefined();
            expect(exchangePresentationResponse?.verifiablePresentation).toBeDefined();
            expect(
                exchangePresentationResponse?.verifiablePresentation?.verifiableCredential
            ).toBeDefined();
            expect(
                exchangePresentationResponse?.verifiablePresentation?.verifiableCredential?.[0]
            ).toMatchObject(vc);

            // Should fail because the exchange is already completed
            await expect(
                userB.clients.fullAuth.workflows.participateInExchange({
                    localWorkflowId: 'inbox-claim',
                    localExchangeId,
                    verifiablePresentation: didAuthVp,
                })
            ).rejects.toThrow();
        });

        it('should allow you to claim multiple inbox credentials from one claim link', async () => {
            const vc = await userA.learnCard.invoke.issueCredential(
                await userA.learnCard.invoke.newCredential({
                    type: 'achievement',
                    name: 'Credential 1',
                    achievementName: 'Credential 1',
                })
            );
            const vc2 = await userA.learnCard.invoke.issueCredential(
                await userA.learnCard.invoke.newCredential({
                    type: 'achievement',
                    name: 'Credential 2',
                    achievementName: 'Credential 2',
                })
            );
            const vc3 = await userA.learnCard.invoke.issueCredential(
                await userA.learnCard.invoke.newCredential({
                    type: 'achievement',
                    name: 'Credential 3',
                    achievementName: 'Credential 3',
                })
            );

            const inboxCredential = await userA.clients.fullAuth.inbox.issue({
                credential: vc,
                recipient: { type: 'email', value: 'userA@test.com' },
            });
            await userA.clients.fullAuth.inbox.issue({
                credential: vc2,
                recipient: { type: 'email', value: 'userA@test.com' },
            });
            await userA.clients.fullAuth.inbox.issue({
                credential: vc3,
                recipient: { type: 'email', value: 'userA@test.com' },
            });

            const localExchangeId = getExchangeIdFromClaimUrl(inboxCredential?.claimUrl);
            expect(localExchangeId).toBeDefined();

            if (!localExchangeId) {
                throw new Error('Local exchange ID is undefined');
            }

            const exchangeInitiationResponse =
                await userB.clients.fullAuth.workflows.participateInExchange({
                    localWorkflowId: 'inbox-claim',
                    localExchangeId,
                });
            const didAuthVp = (await userB.learnCard.invoke.getDidAuthVp({
                challenge: exchangeInitiationResponse?.verifiablePresentationRequest?.challenge,
                domain: exchangeInitiationResponse?.verifiablePresentationRequest?.domain,
            })) as VP;

            const exchangePresentationResponse =
                await userB.clients.fullAuth.workflows.participateInExchange({
                    localWorkflowId: 'inbox-claim',
                    localExchangeId,
                    verifiablePresentation: didAuthVp,
                });

            const credentials = exchangePresentationResponse?.verifiablePresentation
                ?.verifiableCredential as VC[];
            expect(credentials).toHaveLength(3);

            const vcIndex = credentials.findIndex(credential => credential.name === vc.name);
            const vc2Index = credentials.findIndex(credential => credential.name === vc2.name);
            const vc3Index = credentials.findIndex(credential => credential.name === vc3.name);

            expect(credentials[vcIndex]).toMatchObject(vc);
            expect(credentials[vc2Index]).toMatchObject(vc2);
            expect(credentials[vc3Index]).toMatchObject(vc3);
        });

        it('should trigger a webhook if provided when a credential is claimed', async () => {
            process.env.TRUSTED_ISSUERS_WHITELIST = userA.learnCard.id.did();
            const vc = await userA.learnCard.invoke.issueCredential(
                await userA.learnCard.invoke.getTestVc()
            );
            const inboxCredential = await userA.clients.fullAuth.inbox.issue({
                credential: vc,
                recipient: { type: 'phone', value: '+15555555555' },
                configuration: { webhookUrl: 'https://example.com/webhook' },
            });

            expect(addNotificationToQueueSpy).toHaveBeenCalledOnce();
            expect(addNotificationToQueueSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    webhookUrl: 'https://example.com/webhook',
                    data: {
                        inbox: {
                            issuanceId: inboxCredential.issuanceId,
                            recipient: { contactMethod: { type: 'phone', value: '+15555555555' } },
                            status: LCNInboxStatusEnumValidator.enum.DELIVERED,
                            timestamp: expect.any(String),
                        },
                    },
                    type: LCNNotificationTypeEnumValidator.enum.ISSUANCE_DELIVERED,
                })
            );

            addNotificationToQueueSpy.mockClear();

            const localExchangeId = getExchangeIdFromClaimUrl(inboxCredential?.claimUrl);
            if (!localExchangeId) {
                throw new Error('Local exchange ID is undefined');
            }

            const exchangeInitiationResponse =
                await userB.clients.fullAuth.workflows.participateInExchange({
                    localWorkflowId: 'inbox-claim',
                    localExchangeId,
                });
            const didAuthVp = (await userB.learnCard.invoke.getDidAuthVp({
                challenge: exchangeInitiationResponse?.verifiablePresentationRequest?.challenge,
                domain: exchangeInitiationResponse?.verifiablePresentationRequest?.domain,
            })) as VP;

            await userB.clients.fullAuth.workflows.participateInExchange({
                localWorkflowId: 'inbox-claim',
                localExchangeId,
                verifiablePresentation: didAuthVp,
            });

            expect(addNotificationToQueueSpy).toHaveBeenCalledOnce();
            expect(addNotificationToQueueSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    webhookUrl: 'https://example.com/webhook',
                    data: {
                        inbox: {
                            issuanceId: inboxCredential.issuanceId,
                            recipient: {
                                contactMethod: { type: 'phone', value: '+15555555555' },
                                learnCardId: userB.learnCard.id.did(),
                            },
                            status: LCNInboxStatusEnumValidator.enum.CLAIMED,
                            timestamp: expect.any(String),
                        },
                    },
                    type: LCNNotificationTypeEnumValidator.enum.ISSUANCE_CLAIMED,
                })
            );
        });

        it('should verify and associate your email address contact method with your profile', async () => {
            const vc = await userA.learnCard.invoke.issueCredential(
                await userA.learnCard.invoke.getTestVc()
            );
            const inboxCredential = await userA.clients.fullAuth.inbox.issue({
                credential: vc,
                recipient: { type: 'email', value: 'userB@test.com' },
            });

            const localExchangeId = getExchangeIdFromClaimUrl(inboxCredential?.claimUrl);
            expect(localExchangeId).toBeDefined();

            if (!localExchangeId) {
                throw new Error('Local exchange ID is undefined');
            }

            const exchangeInitiationResponse =
                await userB.clients.fullAuth.workflows.participateInExchange({
                    localWorkflowId: 'inbox-claim',
                    localExchangeId,
                });
            const didAuthVp = (await userB.learnCard.invoke.getDidAuthVp({
                challenge: exchangeInitiationResponse?.verifiablePresentationRequest?.challenge,
                domain: exchangeInitiationResponse?.verifiablePresentationRequest?.domain,
            })) as VP;

            await userB.clients.fullAuth.workflows.participateInExchange({
                localWorkflowId: 'inbox-claim',
                localExchangeId,
                verifiablePresentation: didAuthVp,
            });

            const profile = await userB.clients.fullAuth.profile.getProfile();
            expect(profile).toBeDefined();
            const contactMethods =
                await userB.clients.fullAuth.contactMethods.getMyContactMethods();
            expect(contactMethods).toBeDefined();
            expect(contactMethods?.length).toBeGreaterThan(0);
            if (!contactMethods?.[0]) {
                throw new Error('Contact method is undefined');
            }
            expect(contactMethods?.[0].value).toBe('userB@test.com');
            expect(contactMethods?.[0].isVerified).toBe(true);
        });

        it('should verify and associate your phone contact method with your profile', async () => {
            process.env.TRUSTED_ISSUERS_WHITELIST = userA.learnCard.id.did();
            const vc = await userA.learnCard.invoke.issueCredential(
                await userA.learnCard.invoke.getTestVc()
            );
            const inboxCredential = await userA.clients.fullAuth.inbox.issue({
                credential: vc,
                recipient: { type: 'phone', value: '+15555555' },
            });

            const localExchangeId = getExchangeIdFromClaimUrl(inboxCredential?.claimUrl);
            expect(localExchangeId).toBeDefined();

            if (!localExchangeId) {
                throw new Error('Local exchange ID is undefined');
            }

            const exchangeInitiationResponse =
                await userB.clients.fullAuth.workflows.participateInExchange({
                    localWorkflowId: 'inbox-claim',
                    localExchangeId,
                });
            const didAuthVp = (await userB.learnCard.invoke.getDidAuthVp({
                challenge: exchangeInitiationResponse?.verifiablePresentationRequest?.challenge,
                domain: exchangeInitiationResponse?.verifiablePresentationRequest?.domain,
            })) as VP;

            await userB.clients.fullAuth.workflows.participateInExchange({
                localWorkflowId: 'inbox-claim',
                localExchangeId,
                verifiablePresentation: didAuthVp,
            });

            const profile = await userB.clients.fullAuth.profile.getProfile();
            expect(profile).toBeDefined();
            const contactMethods =
                await userB.clients.fullAuth.contactMethods.getMyContactMethods();
            expect(contactMethods).toBeDefined();
            expect(contactMethods?.length).toBeGreaterThan(0);
            if (!contactMethods?.[0]) {
                throw new Error('Contact method is undefined');
            }
            expect(contactMethods?.[0].value).toBe('+15555555');
            expect(contactMethods?.[0].isVerified).toBe(true);
        });

        it('should reject a second profile claiming an inbox credential if the first profile already claimed it', async () => {
            // Issue first credential to anyone@test.com
            const vc = await userA.learnCard.invoke.issueCredential(
                await userA.learnCard.invoke.getTestVc()
            );
            const inboxCredential = await userA.clients.fullAuth.inbox.issue({
                credential: vc,
                recipient: { type: 'email', value: 'anyone@test.com' },
            });

            const localExchangeId = getExchangeIdFromClaimUrl(inboxCredential?.claimUrl);

            if (!localExchangeId) {
                throw new Error('Local exchange ID is undefined');
            }

            // Issue second credential to anyone@test.com
            const vc2 = await userA.learnCard.invoke.issueCredential(
                await userA.learnCard.invoke.getTestVc()
            );
            const inboxCredential2 = await userA.clients.fullAuth.inbox.issue({
                credential: vc2,
                recipient: { type: 'email', value: 'anyone@test.com' },
            });

            const localExchangeId2 = getExchangeIdFromClaimUrl(inboxCredential2?.claimUrl);

            if (!localExchangeId2) {
                throw new Error('Local exchange ID is undefined');
            }

            // Claim first credential
            const exchangeInitiationResponse =
                await userB.clients.fullAuth.workflows.participateInExchange({
                    localWorkflowId: 'inbox-claim',
                    localExchangeId,
                });
            const didAuthVp = (await userB.learnCard.invoke.getDidAuthVp({
                challenge: exchangeInitiationResponse?.verifiablePresentationRequest?.challenge,
                domain: exchangeInitiationResponse?.verifiablePresentationRequest?.domain,
            })) as VP;

            await userB.clients.fullAuth.workflows.participateInExchange({
                localWorkflowId: 'inbox-claim',
                localExchangeId,
                verifiablePresentation: didAuthVp,
            });

            await userB.clients.fullAuth.profile.getProfile();
            const contactMethods =
                await userB.clients.fullAuth.contactMethods.getMyContactMethods();
            if (!contactMethods?.[0]) {
                throw new Error('Contact method is undefined');
            }
            expect(contactMethods?.[0].value).toBe('anyone@test.com');
            expect(contactMethods?.[0].isVerified).toBe(true);

            // Issue a third credential to anyone@test.com
            await userA.clients.fullAuth.inbox.issue({
                credential: vc2,
                recipient: { type: 'email', value: 'anyone@test.com' },
            });

            // User C attempts to claim second credential
            expect(
                userC.clients.fullAuth.workflows.participateInExchange({
                    localWorkflowId: 'inbox-claim',
                    localExchangeId: localExchangeId2,
                })
            ).rejects.toThrow();
        });

        it('should route credentials to the correct profile if the recipient exists with a verified email contact method', async () => {
            const vc = await userA.learnCard.invoke.issueCredential(
                await userA.learnCard.invoke.getTestVc()
            );
            const inboxCredential = await userA.clients.fullAuth.inbox.issue({
                credential: vc,
                recipient: { type: 'email', value: 'userB@test.com' },
            });
            const localExchangeId = getExchangeIdFromClaimUrl(inboxCredential?.claimUrl);

            if (!localExchangeId) {
                throw new Error('Local exchange ID is undefined');
            }

            const exchangeInitiationResponse =
                await userB.clients.fullAuth.workflows.participateInExchange({
                    localWorkflowId: 'inbox-claim',
                    localExchangeId,
                });
            const didAuthVp = (await userB.learnCard.invoke.getDidAuthVp({
                challenge: exchangeInitiationResponse?.verifiablePresentationRequest?.challenge,
                domain: exchangeInitiationResponse?.verifiablePresentationRequest?.domain,
            })) as VP;

            // Claims the credential and verifies the recipient's email
            await userB.clients.fullAuth.workflows.participateInExchange({
                localWorkflowId: 'inbox-claim',
                localExchangeId,
                verifiablePresentation: didAuthVp,
            });

            const vc2 = await userA.learnCard.invoke.issueCredential(
                await userA.learnCard.invoke.newCredential({
                    type: 'achievement',
                    name: 'Delivered Straight to Wallet',
                    achievementName: 'Delivered Straight to Wallet',
                })
            );
            const deliveredCredential = await userA.clients.fullAuth.inbox.issue({
                credential: vc2,
                recipient: { type: 'email', value: 'userB@test.com' },
            });
            expect(deliveredCredential.status).toBe('DELIVERED');

            // User B should see the credentials as incoming
            const incomingCredentials =
                await userB.clients.fullAuth.credential.incomingCredentials();
            expect(incomingCredentials).toBeDefined();
            expect(incomingCredentials?.length).toBe(1);

            if (!incomingCredentials?.[0]?.uri) {
                throw new Error('Incoming credential URI is undefined');
            }
            const receivedCred = (await userB.clients.fullAuth.storage.resolve({
                uri: incomingCredentials?.[0].uri,
            })) as VC;
            if (!receivedCred) {
                throw new Error('Received credential is undefined');
            }
            expect(receivedCred?.name).toBe('Delivered Straight to Wallet');
        });

        it('should not route credentials to the profile if the recipient exists with a unverified email contact method', async () => {
            const vc = await userA.learnCard.invoke.issueCredential(
                await userA.learnCard.invoke.getTestVc()
            );
            // First sendSpy
            const inboxCredential = await userA.clients.fullAuth.inbox.issue({
                credential: vc,
                recipient: { type: 'email', value: 'userB@test.com' },
            });

            // Second sendSpy
            await userB.clients.fullAuth.contactMethods.addContactMethod({
                type: 'email',
                value: 'userB@test.com',
            });

            const vc2 = await userA.learnCard.invoke.issueCredential(
                await userA.learnCard.invoke.newCredential({
                    type: 'achievement',
                    name: 'Delivered to Inbox',
                    achievementName: 'Delivered to Inbox',
                })
            );
            // Third sendSpy
            const deliveredCredential = await userA.clients.fullAuth.inbox.issue({
                credential: vc2,
                recipient: { type: 'email', value: 'userB@test.com' },
            });
            expect(deliveredCredential.status).toBe('DELIVERED');

            // User B should see the credentials as incoming
            const incomingCredentials =
                await userB.clients.fullAuth.credential.incomingCredentials();
            expect(incomingCredentials?.length).toBe(0);

            // Retrieve the verification token from the second spy's call arguments
            const sendArgs = sendSpy.mock.calls[1][0];
            const verificationToken = sendArgs.templateModel.verificationToken;

            expect(sendArgs.templateId).toBe('contact-method-verification');
            expect(verificationToken).toBeDefined();

            // Use the retrieved token to complete the verification
            await userB.clients.fullAuth.contactMethods.verifyContactMethod({
                token: verificationToken,
            });

            // The next credential sent should be delivered straight to wallet
            const vc3 = await userA.learnCard.invoke.issueCredential(
                await userA.learnCard.invoke.newCredential({
                    type: 'achievement',
                    name: 'Delivered Straight to Wallet',
                    achievementName: 'Delivered Straight to Wallet',
                })
            );
            const deliveredCredential2 = await userA.clients.fullAuth.inbox.issue({
                credential: vc3,
                recipient: { type: 'email', value: 'userB@test.com' },
            });
            expect(deliveredCredential2.status).toBe('DELIVERED');

            // User B should see the credentials as incoming
            const incomingCredentials2 =
                await userB.clients.fullAuth.credential.incomingCredentials();
            expect(incomingCredentials2).toBeDefined();
            expect(incomingCredentials2?.length).toBe(1);

            if (!incomingCredentials2?.[0]?.uri) {
                throw new Error('Incoming credential URI is undefined');
            }
            const receivedCred2 = (await userB.clients.fullAuth.storage.resolve({
                uri: incomingCredentials2?.[0].uri,
            })) as VC;
            if (!receivedCred2) {
                throw new Error('Received credential is undefined');
            }
            expect(receivedCred2?.name).toBe('Delivered Straight to Wallet');
        });
    });

    describe('Claim inbox credentials issued by signing authority', () => {
        beforeEach(async () => {
            sendSpy.mockClear();
            await Profile.delete({ detach: true, where: {} });
            await InboxCredential.delete({ detach: true, where: {} });
            await ContactMethod.delete({ detach: true, where: {} });
            await SigningAuthority.delete({ detach: true, where: {} });

            await SigningAuthority.createOne({ endpoint: 'https://example.com' });

            await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' });
            await userB.clients.fullAuth.profile.createProfile({ profileId: 'userb' });

            await Profile.relateTo({
                alias: 'usesSigningAuthority',
                where: {
                    source: {
                        profileId: 'usera',
                    },
                    target: {
                        endpoint: 'https://example.com',
                    },
                },
                properties: {
                    name: 'Example',
                    did: await userA.learnCard.id.did('key'),
                },
            });
        });

        afterAll(async () => {
            await Profile.delete({ detach: true, where: {} });
            await InboxCredential.delete({ detach: true, where: {} });
            await ContactMethod.delete({ detach: true, where: {} });
            await SigningAuthority.delete({ detach: true, where: {} });
        });

        it('should allow you to claim an inbox credential using a signing authority', async () => {
            const credential = await userA.learnCard.invoke.newCredential({
                type: 'achievement',
                name: 'Signing Authority Credential',
                achievementName: 'Signing Authority Credential',
            });
            const inboxCredential = await userA.clients.fullAuth.inbox.issue({
                credential,
                recipient: { type: 'email', value: 'userA@test.com' },
                configuration: {
                    signingAuthority: { endpoint: 'https://example.com', name: 'Example' },
                },
            });

            const localExchangeId = getExchangeIdFromClaimUrl(inboxCredential?.claimUrl);
            expect(localExchangeId).toBeDefined();

            if (!localExchangeId) {
                throw new Error('Local exchange ID is undefined');
            }

            const exchangeInitiationResponse =
                await userB.clients.fullAuth.workflows.participateInExchange({
                    localWorkflowId: 'inbox-claim',
                    localExchangeId,
                });
            const didAuthVp = (await userB.learnCard.invoke.getDidAuthVp({
                challenge: exchangeInitiationResponse?.verifiablePresentationRequest?.challenge,
                domain: exchangeInitiationResponse?.verifiablePresentationRequest?.domain,
            })) as VP;

            const exchangePresentationResponse =
                await userB.clients.fullAuth.workflows.participateInExchange({
                    localWorkflowId: 'inbox-claim',
                    localExchangeId,
                    verifiablePresentation: didAuthVp,
                });

            expect(exchangePresentationResponse).toBeDefined();
            expect(exchangePresentationResponse?.verifiablePresentation).toBeDefined();
            expect(
                exchangePresentationResponse?.verifiablePresentation?.verifiableCredential
            ).toBeDefined();
            expect(
                exchangePresentationResponse?.verifiablePresentation?.verifiableCredential?.[0]
                    ?.name
            ).toBe('Signing Authority Credential');
            expect(
                exchangePresentationResponse?.verifiablePresentation?.verifiableCredential?.[0]
                    ?.proof
            ).toBeDefined();

            // Should fail because the exchange is already completed
            await expect(
                userB.clients.fullAuth.workflows.participateInExchange({
                    localWorkflowId: 'inbox-claim',
                    localExchangeId,
                    verifiablePresentation: didAuthVp,
                })
            ).rejects.toThrow();
        });
    });
});
