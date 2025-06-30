import { vi } from 'vitest';
import { LCNProfileConnectionStatusEnum, VC, VP } from '@learncard/types';
import { getClient, getUser } from './helpers/getClient';
import { Profile, SigningAuthority, Credential, Boost, InboxCredential, ContactMethod } from '@models';
import cache from '@cache';
import { testVc, sendBoost, testVp, testUnsignedBoost } from './helpers/send';

import { QueryBuilder, BindParam, QueryRunner } from 'neogma';


const noAuthClient = getClient();
let userA: Awaited<ReturnType<typeof getUser>>;
let userB: Awaited<ReturnType<typeof getUser>>;
let userC: Awaited<ReturnType<typeof getUser>>;

describe('Universal Inbox', () => {
    beforeAll(async () => {
        userA = await getUser('a'.repeat(64));
        userB = await getUser('b'.repeat(64));
        userC = await getUser('c'.repeat(64));
    });

    describe('Issue credential to inbox', () => {
        beforeEach(async () => {
            await Profile.delete({ detach: true, where: {} });
            await InboxCredential.delete({ detach: true, where: {} });
            await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' });
            await userB.clients.fullAuth.profile.createProfile({ profileId: 'userb' });
        });

        afterAll(async () => {
            await Profile.delete({ detach: true, where: {} });
            await InboxCredential.delete({ detach: true, where: {} });
        });

        it('should not allow you to issue a credential to an inbox without full auth', async () => {
            await expect(
                noAuthClient.inbox.issue({ credential: {}, recipient: { type: 'email', value: 'userA@test.com' } })
            ).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
            await expect(
                userA.clients.partialAuth.inbox.issue({ credential: {}, recipient: { type: 'email', value: 'userA@test.com' } })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        });

        it('should allow you to send an already signed credential to an inbox', async () => {
            const vc = await userA.learnCard.invoke.issueCredential(await userA.learnCard.invoke.getTestVc());
            await expect(
                userA.clients.fullAuth.inbox.issue({ credential: vc, isSigned: true, recipient: { type: 'email', value: 'userA@test.com' } })
            ).resolves.not.toThrow();
        });

        it('should allow you to send an unsigned credential to an inbox with a signing authority', async () => {
            const vc = await userA.learnCard.invoke.getTestVc();
            await expect(
                userA.clients.fullAuth.inbox.issue({ credential: vc, isSigned: false, signingAuthority: { endpoint: 'https://example.com', name: 'Example' }, recipient: { type: 'email', value: 'userA@test.com' } })
            ).resolves.not.toThrow();
        });

        it('should not allow you to send an unsigned credential to an inbox without a signing authority', async () => {
            const vc = await userA.learnCard.invoke.getTestVc();
            await expect(
                userA.clients.fullAuth.inbox.issue({ credential: vc, isSigned: false, recipient: { type: 'email', value: 'userA@test.com' } })
            ).rejects.toMatchObject({
                code: 'BAD_REQUEST',
                message: 'Unsigned credentials require a signing authority',
            });
        });
    });


    describe('Get inbox credentials', () => {
        beforeEach(async () => {
            await Profile.delete({ detach: true, where: {} });
            await InboxCredential.delete({ detach: true, where: {} });
            await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' });
            await userB.clients.fullAuth.profile.createProfile({ profileId: 'userb' });
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
                userA.clients.fullAuth.inbox.issue({ credential: vc, isSigned: false, signingAuthority: { endpoint: 'https://example.com', name: 'Example' }, recipient: { type: 'email', value: 'userA@test.com' } })
            ).resolves.not.toThrow();
            await expect(
                userA.clients.fullAuth.inbox.getMyIssuedCredentials({})
            ).resolves.not.toThrow();

            await expect(
                userA.clients.fullAuth.inbox.issue({ credential: vc, isSigned: false, signingAuthority: { endpoint: 'https://example.com', name: 'Example' }, recipient: { type: 'email', value: 'userA@test.com' } })
            ).resolves.not.toThrow();

            const issuedCredentials = await userA.clients.fullAuth.inbox.getMyIssuedCredentials({});
            await expect(
                issuedCredentials.records
            ).toHaveLength(2);

            // User B should have no issued credentials
            const userBIssuedCredentials = await userB.clients.fullAuth.inbox.getMyIssuedCredentials({});
            await expect(
                userBIssuedCredentials.records
            ).toHaveLength(0);
        });

        it('should allow you to filter your inbox credentials by status', async () => {
            const vc = await userA.learnCard.invoke.getTestVc();
            await expect(
                userA.clients.fullAuth.inbox.issue({ credential: vc, isSigned: false, signingAuthority: { endpoint: 'https://example.com', name: 'Example' }, recipient: { type: 'email', value: 'userA@test.com' } })
            ).resolves.not.toThrow();
            const pendingCreds = await userA.clients.fullAuth.inbox.getMyIssuedCredentials({ query: { currentStatus: 'PENDING' } })
            await expect(
                pendingCreds.records
            ).toHaveLength(1);

            const claimedCreds = await userA.clients.fullAuth.inbox.getMyIssuedCredentials({ query: { currentStatus: 'CLAIMED' } })
            await expect(
                claimedCreds.records
            ).toHaveLength(0);
        });

        it('should allow you to filter your inbox credentials by recipient email', async () => {
            const vc = await userA.learnCard.invoke.getTestVc();
            await expect(
                userA.clients.fullAuth.inbox.issue({ credential: vc, isSigned: false, signingAuthority: { endpoint: 'https://example.com', name: 'Example' }, recipient: { type: 'email', value: 'userA@test.com' } })
            ).resolves.not.toThrow();
            const pendingCreds = await userA.clients.fullAuth.inbox.getMyIssuedCredentials({ query: { currentStatus: 'PENDING' }, recipient: { type: 'email', value: 'userA@test.com' } })
            await expect(
                pendingCreds.records
            ).toHaveLength(1);

            const pendingCredsB = await userA.clients.fullAuth.inbox.getMyIssuedCredentials({ query: { currentStatus: 'PENDING' }, recipient: { type: 'email', value: 'userB@test.com' } })
            await expect(
                pendingCredsB.records
            ).toHaveLength(0);

            // User B should not see credentials User A issued to user A
            const userBTriesToGetIssuedCredsForUserA = await userB.clients.fullAuth.inbox.getMyIssuedCredentials({ query: { currentStatus: 'PENDING' }, recipient: { type: 'email', value: 'userA@test.com' } })
            await expect(
                userBTriesToGetIssuedCredsForUserA.records
            ).toHaveLength(0);
        });

        it('should create an email address contact method if it doesn\'t exist for the recipient', async () => {
            await expect(
                userA.clients.fullAuth.inbox.issue({ credential: {}, isSigned: false, signingAuthority: { endpoint: 'https://example.com', name: 'Example' }, recipient: { type: 'email', value: 'userA@test.com' } })
            ).resolves.not.toThrow();

            const emailAddress = (await ContactMethod.findOne({ where: { value: 'userA@test.com' } })).dataValues.value;
            await expect(
                emailAddress
            ).toBe('userA@test.com');
        });

    });

    describe('Get individual inbox credential', () => {
        beforeEach(async () => {
            await Profile.delete({ detach: true, where: {} });
            await InboxCredential.delete({ detach: true, where: {} });
            await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' });
            await userB.clients.fullAuth.profile.createProfile({ profileId: 'userb' });
        });

        afterAll(async () => {
            await Profile.delete({ detach: true, where: {} });
            await InboxCredential.delete({ detach: true, where: {} });
        });

        it('should allow you to get an individual inbox credential', async () => {
            const inboxCredential = await userA.clients.fullAuth.inbox.issue({ credential: {}, isSigned: false, signingAuthority: { endpoint: 'https://example.com', name: 'Example' }, recipient: { type: 'email', value: 'userA@test.com' } });
            await expect(
                userA.clients.fullAuth.inbox.getInboxCredential({ credentialId: inboxCredential.issuanceId })
            ).resolves.not.toThrow();
        });
        it('should not allow you to get an individual inbox credential you do not own', async () => {
            const inboxCredential = await userA.clients.fullAuth.inbox.issue({ credential: {}, isSigned: false, signingAuthority: { endpoint: 'https://example.com', name: 'Example' }, recipient: { type: 'email', value: 'userA@test.com' } });
            await expect(
                userB.clients.fullAuth.inbox.getInboxCredential({ credentialId: inboxCredential.issuanceId })
            ).rejects.toThrow();
        });
    })

    describe('Claim inbox credential', () => {
        beforeEach(async () => {
            await Profile.delete({ detach: true, where: {} });
            await InboxCredential.delete({ detach: true, where: {} });
            await ContactMethod.delete({ detach: true, where: {} });
            await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' });
            await userB.clients.fullAuth.profile.createProfile({ profileId: 'userb' });
        });

        afterAll(async () => {
            await Profile.delete({ detach: true, where: {} });
            await InboxCredential.delete({ detach: true, where: {} });
            await ContactMethod.delete({ detach: true, where: {} });
        });


        it('should allow you to claim an inbox credential', async () => {
            const vc = await userA.learnCard.invoke.issueCredential(await userA.learnCard.invoke.getTestVc());
            const inboxCredential = await userA.clients.fullAuth.inbox.issue({ credential: vc, isSigned: true, recipient: { type: 'email', value: 'userA@test.com' } });

            const localExchangeId = inboxCredential.claimUrl?.split('/').pop();
            expect(localExchangeId).toBeDefined();

            if (!localExchangeId) {
                throw new Error('Local exchange ID is undefined');
            }

            const exchangeInitiationResponse = await userB.clients.fullAuth.workflows.participateInExchange({ localWorkflowId: 'inbox-claim', localExchangeId })
            expect(exchangeInitiationResponse).toBeDefined();
            expect(exchangeInitiationResponse?.verifiablePresentationRequest).toBeDefined();
            expect(exchangeInitiationResponse?.verifiablePresentationRequest?.query).toBeDefined();
            expect(exchangeInitiationResponse?.verifiablePresentationRequest?.challenge).toBeDefined();
            expect(exchangeInitiationResponse?.verifiablePresentationRequest?.domain).toBeDefined();

            const didAuthVp = await userB.learnCard.invoke.getDidAuthVp(
                {
                    challenge: exchangeInitiationResponse?.verifiablePresentationRequest?.challenge,
                    domain: exchangeInitiationResponse?.verifiablePresentationRequest?.domain,
                }
            ) as VP;

            const exchangePresentationResponse = await userB.clients.fullAuth.workflows.participateInExchange({ localWorkflowId: 'inbox-claim', localExchangeId, verifiablePresentation: didAuthVp })

            expect(exchangePresentationResponse).toBeDefined();
            expect(exchangePresentationResponse?.verifiablePresentation).toBeDefined();
            expect(exchangePresentationResponse?.verifiablePresentation?.verifiableCredential).toBeDefined();
            expect(exchangePresentationResponse?.verifiablePresentation?.verifiableCredential?.[0]).toMatchObject(vc);

            // Should fail because the exchange is already completed
            await expect(userB.clients.fullAuth.workflows.participateInExchange({ localWorkflowId: 'inbox-claim', localExchangeId, verifiablePresentation: didAuthVp })).rejects.toThrow();
        });


        it('should allow you to claim multiple inbox credentials from one claim link', async () => {
            const vc = await userA.learnCard.invoke.issueCredential(await userA.learnCard.invoke.newCredential({ type: 'achievement', name: 'Credential 1', achievementName: 'Credential 1' }));
            const vc2 = await userA.learnCard.invoke.issueCredential(await userA.learnCard.invoke.newCredential({ type: 'achievement', name: 'Credential 2', achievementName: 'Credential 2' }));
            const vc3 = await userA.learnCard.invoke.issueCredential(await userA.learnCard.invoke.newCredential({ type: 'achievement', name: 'Credential 3', achievementName: 'Credential 3' }));

            const inboxCredential = await userA.clients.fullAuth.inbox.issue({ credential: vc, isSigned: true, recipient: { type: 'email', value: 'userA@test.com' } });
            await userA.clients.fullAuth.inbox.issue({ credential: vc2, isSigned: true, recipient: { type: 'email', value: 'userA@test.com' } });
            await userA.clients.fullAuth.inbox.issue({ credential: vc3, isSigned: true, recipient: { type: 'email', value: 'userA@test.com' } });

            const localExchangeId = inboxCredential.claimUrl?.split('/').pop();
            expect(localExchangeId).toBeDefined();

            if (!localExchangeId) {
                throw new Error('Local exchange ID is undefined');
            }

            const exchangeInitiationResponse = await userB.clients.fullAuth.workflows.participateInExchange({ localWorkflowId: 'inbox-claim', localExchangeId })
            const didAuthVp = await userB.learnCard.invoke.getDidAuthVp(
                {
                    challenge: exchangeInitiationResponse?.verifiablePresentationRequest?.challenge,
                    domain: exchangeInitiationResponse?.verifiablePresentationRequest?.domain,
                }
            ) as VP;

            const exchangePresentationResponse = await userB.clients.fullAuth.workflows.participateInExchange({ localWorkflowId: 'inbox-claim', localExchangeId, verifiablePresentation: didAuthVp })

            const credentials = exchangePresentationResponse?.verifiablePresentation?.verifiableCredential as VC[];
            expect(credentials).toHaveLength(3);

            const vcIndex = credentials.findIndex((credential) => credential.name === vc.name);
            const vc2Index = credentials.findIndex((credential) => credential.name === vc2.name);
            const vc3Index = credentials.findIndex((credential) => credential.name === vc3.name);
            
            expect(credentials[vcIndex]).toMatchObject(vc);
            expect(credentials[vc2Index]).toMatchObject(vc2);
            expect(credentials[vc3Index]).toMatchObject(vc3);

        });

        it('should verify and associate your email address contact method with your profile', async () => {
            const vc = await userA.learnCard.invoke.issueCredential(await userA.learnCard.invoke.getTestVc());
            const inboxCredential = await userA.clients.fullAuth.inbox.issue({ credential: vc, isSigned: true, recipient: { type: 'email', value: 'userB@test.com' } });

            const localExchangeId = inboxCredential.claimUrl?.split('/').pop();
            expect(localExchangeId).toBeDefined();

            if (!localExchangeId) {
                throw new Error('Local exchange ID is undefined');
            }

            const exchangeInitiationResponse = await userB.clients.fullAuth.workflows.participateInExchange({ localWorkflowId: 'inbox-claim', localExchangeId })
            const didAuthVp = await userB.learnCard.invoke.getDidAuthVp(
                {
                    challenge: exchangeInitiationResponse?.verifiablePresentationRequest?.challenge,
                    domain: exchangeInitiationResponse?.verifiablePresentationRequest?.domain,
                }
            ) as VP;

            await userB.clients.fullAuth.workflows.participateInExchange({ localWorkflowId: 'inbox-claim', localExchangeId, verifiablePresentation: didAuthVp })

            const profile = await userB.clients.fullAuth.profile.getProfile();
            expect(profile).toBeDefined();
            const contactMethods = await userB.clients.fullAuth.contactMethods.getMyContactMethods();
            expect(contactMethods).toBeDefined();
            expect(contactMethods?.length).toBeGreaterThan(0);
            if (!contactMethods?.[0]) {
                throw new Error('Contact method is undefined');
            }
            expect(contactMethods?.[0].value).toBe('userB@test.com');
            expect(contactMethods?.[0].isVerified).toBe(true);
        });

        it('should route credentials to the correct profile if the recipient exists with a verified email contact method', async () => {
            const vc = await userA.learnCard.invoke.issueCredential(await userA.learnCard.invoke.getTestVc());
            const inboxCredential = await userA.clients.fullAuth.inbox.issue({ credential: vc, isSigned: true, recipient: { type: 'email', value: 'userB@test.com' } });
            const localExchangeId = inboxCredential.claimUrl?.split('/').pop();

            if (!localExchangeId) {
                throw new Error('Local exchange ID is undefined');
            }

            const exchangeInitiationResponse = await userB.clients.fullAuth.workflows.participateInExchange({ localWorkflowId: 'inbox-claim', localExchangeId })
            const didAuthVp = await userB.learnCard.invoke.getDidAuthVp(
                {
                    challenge: exchangeInitiationResponse?.verifiablePresentationRequest?.challenge,
                    domain: exchangeInitiationResponse?.verifiablePresentationRequest?.domain,
                }
            ) as VP;

            // Claims the credential and verifies the recipient's email
            await userB.clients.fullAuth.workflows.participateInExchange({ localWorkflowId: 'inbox-claim', localExchangeId, verifiablePresentation: didAuthVp })

            const vc2 = await userA.learnCard.invoke.issueCredential(await userA.learnCard.invoke.newCredential({ type: 'achievement', name: 'Delivered Straight to Wallet', achievementName: 'Delivered Straight to Wallet' }));
            const deliveredCredential = await userA.clients.fullAuth.inbox.issue({ credential: vc2, isSigned: true, recipient: { type: 'email', value: 'userB@test.com' } });
            expect(deliveredCredential.status).toBe('DELIVERED');

            // User B should see the credentials as incoming 
            const incomingCredentials = await userB.clients.fullAuth.credential.incomingCredentials();
            expect(incomingCredentials).toBeDefined();
            expect(incomingCredentials?.length).toBe(1);

            if (!incomingCredentials?.[0]?.uri) {
                throw new Error('Incoming credential URI is undefined');
            }
            const receivedCred = await userB.clients.fullAuth.storage.resolve({ uri: incomingCredentials?.[0].uri });
            if (!receivedCred) {
                throw new Error('Received credential is undefined');
            }
            expect(receivedCred?.name).toBe('Delivered Straight to Wallet');
        });

        
    });

    describe('Claim inbox credentials issued by signing authority', () => {
        beforeEach(async () => {
            await Profile.delete({ detach: true, where: {} });
            await InboxCredential.delete({ detach: true, where: {} });
            await ContactMethod.delete({ detach: true, where: {} });
            await SigningAuthority.delete({ detach: true, where: {} });

            await SigningAuthority.createOne({ endpoint: 'https://example.com' });

            await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' });
            await userB.clients.fullAuth.profile.createProfile({ profileId: 'userb' });

            await Profile.relateTo(
                {
                    alias: 'usesSigningAuthority',  
                    where: {
                        source:
                        {
                                profileId: 'usera',
                        },
                        target:
                        {
                            endpoint: 'https://example.com',
                        }
                    },
                    properties: {
                        name: 'Example',
                        did: await userA.learnCard.id.did('key')
                    }
                }
            )
        });

        afterAll(async () => {
            await Profile.delete({ detach: true, where: {} });
            await InboxCredential.delete({ detach: true, where: {} });
            await ContactMethod.delete({ detach: true, where: {} });
            await SigningAuthority.delete({ detach: true, where: {} });
        });

        it('should allow you to claim an inbox credential using a signing authority', async () => {
            const credential = await userA.learnCard.invoke.newCredential({ type: 'achievement', name: 'Signing Authority Credential', achievementName: 'Signing Authority Credential' });
            const inboxCredential = await userA.clients.fullAuth.inbox.issue({ credential, isSigned: false, recipient: { type: 'email', value: 'userA@test.com' }, signingAuthority: { endpoint: 'https://example.com', name: 'Example' } });

            const localExchangeId = inboxCredential.claimUrl?.split('/').pop();
            expect(localExchangeId).toBeDefined();

            if (!localExchangeId) {
                throw new Error('Local exchange ID is undefined');
            }

            const exchangeInitiationResponse = await userB.clients.fullAuth.workflows.participateInExchange({ localWorkflowId: 'inbox-claim', localExchangeId })
            const didAuthVp = await userB.learnCard.invoke.getDidAuthVp(
                {
                    challenge: exchangeInitiationResponse?.verifiablePresentationRequest?.challenge,
                    domain: exchangeInitiationResponse?.verifiablePresentationRequest?.domain,
                }
            ) as VP;

            const exchangePresentationResponse = await userB.clients.fullAuth.workflows.participateInExchange({ localWorkflowId: 'inbox-claim', localExchangeId, verifiablePresentation: didAuthVp })

            expect(exchangePresentationResponse).toBeDefined();
            expect(exchangePresentationResponse?.verifiablePresentation).toBeDefined();
            expect(exchangePresentationResponse?.verifiablePresentation?.verifiableCredential).toBeDefined();
            expect(exchangePresentationResponse?.verifiablePresentation?.verifiableCredential?.[0]?.name).toBe('Signing Authority Credential');
            expect(exchangePresentationResponse?.verifiablePresentation?.verifiableCredential?.[0]?.proof).toBeDefined();

            // Should fail because the exchange is already completed
            await expect(userB.clients.fullAuth.workflows.participateInExchange({ localWorkflowId: 'inbox-claim', localExchangeId, verifiablePresentation: didAuthVp })).rejects.toThrow();
        });        

    });
});
