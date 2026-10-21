import { vi } from 'vitest';
import { getClient, getUser } from './helpers/getClient';
import { testVc, sendBoost, sendCredential, testUnsignedBoost } from './helpers/send';
import { minimalContract, minimalTerms } from './helpers/contract';
import {
    Profile,
    Credential,
    ConsentFlowContract,
    ConsentFlowTerms,
    ConsentFlowTransaction,
    CredentialActivity,
} from '@models';
import * as Notifications from '@helpers/notifications.helpers';
import * as LearnCardHelpers from '@helpers/learnCard.helpers';
import { addNotificationToQueueSpy } from './helpers/spies';
import { getNotificationMessage } from '@helpers/notificationMessages';
import { LCNNotificationTypeEnumValidator } from '@learncard/types';
import { areProfilesConnected, connectProfiles } from '@helpers/connection.helpers';
import { neogma } from '@instance';
import {
    getDidDocForProfile,
    getDidDocForProfileManager,
    setDidDocForProfile,
    setDidDocForProfileManager,
} from '@cache/did-docs';

const noAuthClient = getClient();
let userA: Awaited<ReturnType<typeof getUser>>;
let userB: Awaited<ReturnType<typeof getUser>>;
let userC: Awaited<ReturnType<typeof getUser>>;

describe('Credentials', () => {
    beforeAll(async () => {
        userA = await getUser();
        userB = await getUser('b'.repeat(64));
        userC = await getUser('c'.repeat(64));

        vi.spyOn(Notifications, 'addNotificationToQueue').mockImplementation(
            addNotificationToQueueSpy
        );
    });

    describe('getHolderExportMetadata', () => {
        beforeEach(async () => {
            await Profile.delete({ detach: true, where: {} });
            await Credential.delete({ detach: true, where: {} });
            await CredentialActivity.delete({ detach: true, where: {} });
            await ConsentFlowContract.delete({ detach: true, where: {} });
            await ConsentFlowTerms.delete({ detach: true, where: {} });
            await ConsentFlowTransaction.delete({ detach: true, where: {} });
            await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' });
            await userB.clients.fullAuth.profile.createProfile({ profileId: 'userb' });
        });

        it('should require full auth to export holder metadata', async () => {
            await expect(noAuthClient.credential.getHolderExportMetadata()).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
            await expect(
                userA.clients.partialAuth.credential.getHolderExportMetadata()
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        });

        it('should return holder-owned consent records and transactions only', async () => {
            const contractUri = await userA.clients.fullAuth.contracts.createConsentFlowContract({
                contract: minimalContract,
                name: 'Continuity Contract',
            });
            const { termsUri } = await userB.clients.fullAuth.contracts.consentToContract({
                contractUri,
                terms: minimalTerms,
            });

            const userAMetadata = await userA.clients.fullAuth.credential.getHolderExportMetadata();
            const userBMetadata = await userB.clients.fullAuth.credential.getHolderExportMetadata();

            expect(userAMetadata.consentRecords).toHaveLength(0);
            expect(userBMetadata.consentRecords).toHaveLength(1);
            expect(userBMetadata.consentRecords[0]).toMatchObject({
                termsUri,
                status: 'live',
                contract: { uri: contractUri, name: 'Continuity Contract' },
                terms: minimalTerms,
            });
            expect(userBMetadata.consentRecords[0]!.transactions).toEqual(
                expect.arrayContaining([expect.objectContaining({ action: 'consent' })])
            );
        });
    });

    describe('sendCredential', () => {
        beforeEach(async () => {
            await Profile.delete({ detach: true, where: {} });
            await Credential.delete({ detach: true, where: {} });
            await CredentialActivity.delete({ detach: true, where: {} });
            await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' });
            await userB.clients.fullAuth.profile.createProfile({ profileId: 'userb' });

            addNotificationToQueueSpy.mockReset();
        });

        afterAll(async () => {
            await Profile.delete({ detach: true, where: {} });
            await Credential.delete({ detach: true, where: {} });
        });

        it('should require full auth to send a credential', async () => {
            await expect(
                noAuthClient.credential.sendCredential({ profileId: 'userb', credential: testVc })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
            await expect(
                userA.clients.partialAuth.credential.sendCredential({
                    profileId: 'userb',
                    credential: testVc,
                })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        });

        it('should allow sending a credential', async () => {
            await expect(
                userA.clients.fullAuth.credential.sendCredential({
                    profileId: 'userb',
                    credential: testVc,
                })
            ).resolves.not.toThrow();
        });

        it('should allow sending a credential to did:web', async () => {
            const userBProfile = await userB.clients.fullAuth.profile.getProfile();

            await expect(
                userA.clients.fullAuth.credential.sendCredential({
                    profileId: userBProfile!.did,
                    credential: testVc,
                })
            ).resolves.not.toThrow();
        });

        it('should allow sending a credential to did:key', async () => {
            await expect(
                userA.clients.fullAuth.credential.sendCredential({
                    profileId: userB.learnCard.id.did(),
                    credential: testVc,
                })
            ).resolves.not.toThrow();
        });

        it('should return NOT_FOUND for unsupported did format', async () => {
            await expect(
                userA.clients.fullAuth.credential.sendCredential({
                    profileId: 'did:example:userb',
                    credential: testVc,
                })
            ).rejects.toMatchObject({ code: 'NOT_FOUND' });
        });

        it('should allow sending an encrypted credential', async () => {
            const encryptedVc = await userA.learnCard.invoke.createDagJwe(testVc, [
                userA.learnCard.id.did(),
                userB.learnCard.id.did(),
            ]);

            await expect(
                userA.clients.fullAuth.credential.sendCredential({
                    profileId: 'userb',
                    credential: encryptedVc,
                })
            ).resolves.not.toThrow();
        });

        it('should persist metadata on credential relationships', async () => {
            const metadata = { some: 'value', nested: { answer: 42 } };

            const uri = await userA.clients.fullAuth.credential.sendCredential({
                profileId: 'userb',
                credential: testVc,
                metadata,
            });

            await userB.clients.fullAuth.credential.acceptCredential({ uri });

            const received = await userB.clients.fullAuth.credential.receivedCredentials();

            expect(received).toHaveLength(1);
            expect(received[0]?.metadata).toEqual(metadata);

            const sent = await userA.clients.fullAuth.credential.sentCredentials();

            expect(sent).toHaveLength(1);
            expect(sent[0]?.metadata).toEqual(metadata);

            const incoming = await userB.clients.fullAuth.credential.incomingCredentials();
            expect(incoming).toHaveLength(0);
        });

        it('should include metadata in credential notifications', async () => {
            addNotificationToQueueSpy.mockResolvedValueOnce(undefined);

            const metadata = { reason: 'test', values: { score: 99 } };

            await userA.clients.fullAuth.credential.sendCredential({
                profileId: 'userb',
                credential: testVc,
                metadata,
            });

            expect(addNotificationToQueueSpy).toHaveBeenCalled();

            const notificationCall = addNotificationToQueueSpy.mock.calls.pop();

            expect(notificationCall?.[0]?.data?.metadata).toEqual(metadata);
        });
    });

    describe('acceptCredential', () => {
        beforeEach(async () => {
            await Profile.delete({ detach: true, where: {} });
            await Credential.delete({ detach: true, where: {} });

            await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' });
            await userB.clients.fullAuth.profile.createProfile({ profileId: 'userb' });

            addNotificationToQueueSpy.mockClear();
        });

        afterAll(async () => {
            await Profile.delete({ detach: true, where: {} });
            await Credential.delete({ detach: true, where: {} });
        });

        it('should require full auth to accept a credential', async () => {
            const uri = await userA.clients.fullAuth.credential.sendCredential({
                profileId: 'userb',
                credential: testVc,
            });

            await expect(noAuthClient.credential.acceptCredential({ uri })).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
            await expect(
                userB.clients.partialAuth.credential.acceptCredential({ uri })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        });

        it('should allow sending a credential', async () => {
            const uri = await userA.clients.fullAuth.credential.sendCredential({
                profileId: 'userb',
                credential: testVc,
            });

            await expect(
                userB.clients.fullAuth.credential.acceptCredential({ uri })
            ).resolves.not.toThrow();
        });

        it('creates directed prompts and one actionable sender notification without connecting profiles', async () => {
            const uri = await userA.clients.fullAuth.credential.sendCredential({
                profileId: 'userb',
                credential: testVc,
            });
            vi.mocked(Notifications.addNotificationToQueue).mockRestore();
            const previousE2eTestValue = process.env.IS_E2E_TEST;
            process.env.IS_E2E_TEST = 'true';

            try {
                await userB.clients.fullAuth.credential.acceptCredential({
                    uri,
                    options: {
                        metadata: {
                            campaign: 'fall',
                            connectionPrompt: {
                                promptId: 'spoofed',
                                counterpartProfileId: 'spoofed',
                            },
                        },
                    },
                });

                const [claimerPrompts, senderPrompts, claimer, sender, notificationQueue] =
                    await Promise.all([
                        userB.clients.fullAuth.profile.pendingConnectionPrompts(),
                        userA.clients.fullAuth.profile.pendingConnectionPrompts(),
                        userB.clients.fullAuth.profile.getProfile(),
                        userA.clients.fullAuth.profile.getProfile(),
                        noAuthClient.test.notificationQueue(),
                    ]);

                expect(claimerPrompts).toHaveLength(1);
                expect(claimerPrompts[0]).toMatchObject({
                    surface: 'POST_CLAIM',
                    triggerId: `credential:${uri.split(':').at(-1)}`,
                    counterpart: { profileId: 'usera' },
                });
                expect(senderPrompts).toHaveLength(1);
                expect(senderPrompts[0]).toMatchObject({
                    surface: 'NOTIFICATION',
                    triggerId: `credential:${uri.split(':').at(-1)}`,
                    counterpart: { profileId: 'userb' },
                });
                expect(await areProfilesConnected(claimer!, sender!)).toBe(false);

                const acceptedNotifications = notificationQueue.filter(
                    notification =>
                        notification.type === LCNNotificationTypeEnumValidator.enum.BOOST_ACCEPTED
                );
                expect(acceptedNotifications).toHaveLength(1);
                expect(acceptedNotifications[0]?.data).toEqual({
                    vcUris: [uri],
                    metadata: {
                        campaign: 'fall',
                        connectionPrompt: {
                            promptId: senderPrompts[0]?.promptId,
                            counterpartProfileId: 'userb',
                        },
                    },
                });
            } finally {
                if (previousE2eTestValue === undefined) delete process.env.IS_E2E_TEST;
                else process.env.IS_E2E_TEST = previousE2eTestValue;
                vi.spyOn(Notifications, 'addNotificationToQueue').mockImplementation(
                    addNotificationToQueueSpy
                );
            }
        });

        it('sends the actionable notification even when ordinary claim notifications are skipped', async () => {
            const uri = await userA.clients.fullAuth.credential.sendCredential({
                profileId: 'userb',
                credential: testVc,
            });
            addNotificationToQueueSpy.mockClear();

            await userB.clients.fullAuth.credential.acceptCredential({
                uri,
                options: { skipNotification: true },
            });

            const acceptedCalls = addNotificationToQueueSpy.mock.calls.filter(
                call => call[0]?.type === LCNNotificationTypeEnumValidator.enum.BOOST_ACCEPTED
            );
            expect(acceptedCalls).toHaveLength(1);
            expect(acceptedCalls[0]?.[0]?.data?.metadata?.connectionPrompt).toEqual({
                promptId: expect.any(String),
                counterpartProfileId: 'userb',
            });
        });

        it('preserves the ordinary boost-accepted notification when no sender prompt is eligible', async () => {
            const sender = (await userA.clients.fullAuth.profile.getProfile())!;
            const claimer = (await userB.clients.fullAuth.profile.getProfile())!;
            await connectProfiles(sender, claimer, false);
            const uri = await userA.clients.fullAuth.credential.sendCredential({
                profileId: 'userb',
                credential: testVc,
            });
            addNotificationToQueueSpy.mockClear();

            await userB.clients.fullAuth.credential.acceptCredential({ uri });

            const acceptedCalls = addNotificationToQueueSpy.mock.calls.filter(
                call => call[0]?.type === LCNNotificationTypeEnumValidator.enum.BOOST_ACCEPTED
            );
            expect(acceptedCalls).toHaveLength(1);
            expect(acceptedCalls[0]?.[0]?.message.body).toBe(
                `${claimer.displayName} has accepted your boost!`
            );
            expect(acceptedCalls[0]?.[0]?.data?.metadata?.connectionPrompt).toBeUndefined();
        });

        it('does not create connection prompts for self-issued credential acceptance', async () => {
            const uri = await userA.clients.fullAuth.credential.sendCredential({
                profileId: 'usera',
                credential: testVc,
            });

            await userA.clients.fullAuth.credential.acceptCredential({ uri });

            expect(await userA.clients.fullAuth.profile.pendingConnectionPrompts()).toHaveLength(0);
        });

        it('keeps acceptance successful when prompt creation fails', async () => {
            const uri = await userA.clients.fullAuth.credential.sendCredential({
                profileId: 'userb',
                credential: testVc,
            });
            const originalRun = neogma.queryRunner.run.bind(neogma.queryRunner);
            const queryRunnerSpy = vi
                .spyOn(neogma.queryRunner, 'run')
                .mockImplementation(async (...args) => {
                    if (String(args[0]).includes('MERGE (viewer)-[prompt:CONNECTION_PROMPT]')) {
                        throw new Error('injected prompt write failure');
                    }

                    return originalRun(...args);
                });
            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

            try {
                await expect(
                    userB.clients.fullAuth.credential.acceptCredential({ uri })
                ).resolves.toBe(true);
            } finally {
                queryRunnerSpy.mockRestore();
                consoleErrorSpy.mockRestore();
            }

            expect(await userB.clients.fullAuth.credential.receivedCredentials()).toHaveLength(1);
        });

        it('falls back to one legacy notification when the actionable enqueue fails', async () => {
            const uri = await userA.clients.fullAuth.credential.sendCredential({
                profileId: 'userb',
                credential: testVc,
            });
            addNotificationToQueueSpy.mockClear();
            addNotificationToQueueSpy.mockResolvedValueOnce(false);
            addNotificationToQueueSpy.mockResolvedValueOnce(undefined);
            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

            try {
                await expect(
                    userB.clients.fullAuth.credential.acceptCredential({
                        uri,
                        options: {
                            metadata: {
                                campaign: 'fall',
                                connectionPrompt: {
                                    promptId: 'spoofed',
                                    counterpartProfileId: 'spoofed',
                                },
                            },
                        },
                    })
                ).resolves.toBe(true);
            } finally {
                consoleErrorSpy.mockRestore();
            }

            const acceptedCalls = addNotificationToQueueSpy.mock.calls.filter(
                call => call[0]?.type === LCNNotificationTypeEnumValidator.enum.BOOST_ACCEPTED
            );
            expect(acceptedCalls).toHaveLength(2);
            expect(acceptedCalls[0]?.[0]?.data?.metadata?.connectionPrompt).toEqual({
                promptId: expect.any(String),
                counterpartProfileId: 'userb',
            });
            expect(acceptedCalls[1]?.[0]).toMatchObject({
                message: getNotificationMessage('boostAccepted', 'en', { name: '' }),
                data: { vcUris: [uri], metadata: { campaign: 'fall' } },
            });
            expect(acceptedCalls[1]?.[0]?.data?.metadata?.connectionPrompt).toBeUndefined();
            expect(await userB.clients.fullAuth.credential.receivedCredentials()).toHaveLength(1);
        });

        it('does not send a legacy fallback when actionable delivery is uncertain', async () => {
            const uri = await userA.clients.fullAuth.credential.sendCredential({
                profileId: 'userb',
                credential: testVc,
            });
            addNotificationToQueueSpy.mockClear();
            addNotificationToQueueSpy.mockImplementationOnce(async () => {
                throw new Error('timeout after transport acceptance');
            });
            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

            try {
                await expect(
                    userB.clients.fullAuth.credential.acceptCredential({ uri })
                ).resolves.toBe(true);
            } finally {
                consoleErrorSpy.mockRestore();
            }

            const acceptedCalls = addNotificationToQueueSpy.mock.calls.filter(
                call => call[0]?.type === LCNNotificationTypeEnumValidator.enum.BOOST_ACCEPTED
            );
            expect(acceptedCalls).toHaveLength(1);
            expect(acceptedCalls[0]?.[0]?.data?.metadata?.connectionPrompt).toEqual({
                promptId: expect.any(String),
                counterpartProfileId: 'userb',
            });
            await expect(
                userA.clients.fullAuth.profile.pendingConnectionPrompts()
            ).resolves.toHaveLength(1);
        });

        it('keeps an aborted direct webhook uncertain through claim handling without a legacy fallback', async () => {
            const uri = await userA.clients.fullAuth.credential.sendCredential({
                profileId: 'userb',
                credential: testVc,
            });
            vi.mocked(Notifications.addNotificationToQueue).mockRestore();
            const previousNodeEnv = process.env.NODE_ENV;
            const previousIsOffline = process.env.IS_OFFLINE;
            process.env.NODE_ENV = 'development';
            process.env.IS_OFFLINE = 'true';
            const learnCardSpy = vi
                .spyOn(LearnCardHelpers, 'getDidWebLearnCard')
                .mockResolvedValue({
                    invoke: { getDidAuthVp: async () => 'test-did-auth-vp' },
                } as any);
            const fetchSpy = vi
                .spyOn(globalThis, 'fetch')
                .mockRejectedValue(new DOMException('request timed out', 'AbortError'));
            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

            try {
                await expect(
                    userB.clients.fullAuth.credential.acceptCredential({ uri })
                ).resolves.toBe(true);

                const state = await neogma.queryRunner.run(
                    `
                        MATCH (:Profile { profileId: 'usera' })
                              -[prompt:CONNECTION_PROMPT]->
                              (:Profile { profileId: 'userb' })
                        RETURN prompt.status AS status,
                               coalesce(prompt.notificationDelivered, false) AS delivered,
                               coalesce(prompt.notificationDeliveryMayHaveSucceeded, false)
                                   AS mayHaveSucceeded
                    `
                );
                expect(state.records[0]?.toObject()).toEqual({
                    status: 'PENDING',
                    delivered: false,
                    mayHaveSucceeded: true,
                });
                expect(
                    fetchSpy.mock.calls.map(([, init]) => {
                        const notification = JSON.parse(String(init?.body));

                        return notification.data?.metadata?.connectionPrompt ?? null;
                    })
                ).toEqual([
                    {
                        promptId: expect.any(String),
                        counterpartProfileId: 'userb',
                    },
                ]);
            } finally {
                consoleErrorSpy.mockRestore();
                fetchSpy.mockRestore();
                learnCardSpy.mockRestore();
                if (previousNodeEnv === undefined) delete process.env.NODE_ENV;
                else process.env.NODE_ENV = previousNodeEnv;
                if (previousIsOffline === undefined) delete process.env.IS_OFFLINE;
                else process.env.IS_OFFLINE = previousIsOffline;
                vi.spyOn(Notifications, 'addNotificationToQueue').mockImplementation(
                    addNotificationToQueueSpy
                );
            }
        });

        it('treats a structured not-stored response as definitive and uses one legacy fallback', async () => {
            const uri = await userA.clients.fullAuth.credential.sendCredential({
                profileId: 'userb',
                credential: testVc,
            });
            vi.mocked(Notifications.addNotificationToQueue).mockRestore();
            const previousNodeEnv = process.env.NODE_ENV;
            const previousIsOffline = process.env.IS_OFFLINE;
            process.env.NODE_ENV = 'development';
            process.env.IS_OFFLINE = 'true';
            const learnCardSpy = vi
                .spyOn(LearnCardHelpers, 'getDidWebLearnCard')
                .mockResolvedValue({
                    invoke: { getDidAuthVp: async () => 'test-did-auth-vp' },
                } as any);
            const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
                ok: true,
                status: 200,
                text: async () => JSON.stringify({ success: false }),
            } as Response);
            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

            try {
                await expect(
                    userB.clients.fullAuth.credential.acceptCredential({ uri })
                ).resolves.toBe(true);

                expect(fetchSpy).toHaveBeenCalledTimes(2);
                const state = await neogma.queryRunner.run(
                    `
                        MATCH (:Profile { profileId: 'usera' })
                              -[prompt:CONNECTION_PROMPT]->
                              (:Profile { profileId: 'userb' })
                        RETURN prompt.status AS status,
                               coalesce(prompt.notificationDelivered, false) AS delivered,
                               coalesce(prompt.notificationDeliveryMayHaveSucceeded, false)
                                   AS mayHaveSucceeded
                    `
                );
                expect(state.records[0]?.toObject()).toEqual({
                    status: 'SKIPPED',
                    delivered: false,
                    mayHaveSucceeded: false,
                });
            } finally {
                consoleErrorSpy.mockRestore();
                fetchSpy.mockRestore();
                learnCardSpy.mockRestore();
                if (previousNodeEnv === undefined) delete process.env.NODE_ENV;
                else process.env.NODE_ENV = previousNodeEnv;
                if (previousIsOffline === undefined) delete process.env.IS_OFFLINE;
                else process.env.IS_OFFLINE = previousIsOffline;
                vi.spyOn(Notifications, 'addNotificationToQueue').mockImplementation(
                    addNotificationToQueueSpy
                );
            }
        });

        it('keeps a direct 5xx response uncertain without sending a legacy fallback', async () => {
            const uri = await userA.clients.fullAuth.credential.sendCredential({
                profileId: 'userb',
                credential: testVc,
            });
            vi.mocked(Notifications.addNotificationToQueue).mockRestore();
            const previousNodeEnv = process.env.NODE_ENV;
            const previousIsOffline = process.env.IS_OFFLINE;
            process.env.NODE_ENV = 'development';
            process.env.IS_OFFLINE = 'true';
            const learnCardSpy = vi
                .spyOn(LearnCardHelpers, 'getDidWebLearnCard')
                .mockResolvedValue({
                    invoke: { getDidAuthVp: async () => 'test-did-auth-vp' },
                } as any);
            const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
                ok: false,
                status: 503,
                text: async () => JSON.stringify({ success: false }),
            } as Response);
            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

            try {
                await expect(
                    userB.clients.fullAuth.credential.acceptCredential({ uri })
                ).resolves.toBe(true);

                expect(fetchSpy).toHaveBeenCalledTimes(1);
                const state = await neogma.queryRunner.run(
                    `
                        MATCH (:Profile { profileId: 'usera' })
                              -[prompt:CONNECTION_PROMPT]->
                              (:Profile { profileId: 'userb' })
                        RETURN prompt.status AS status,
                               coalesce(prompt.notificationDelivered, false) AS delivered,
                               coalesce(prompt.notificationDeliveryMayHaveSucceeded, false)
                                   AS mayHaveSucceeded
                    `
                );
                expect(state.records[0]?.toObject()).toEqual({
                    status: 'PENDING',
                    delivered: false,
                    mayHaveSucceeded: true,
                });
            } finally {
                consoleErrorSpy.mockRestore();
                fetchSpy.mockRestore();
                learnCardSpy.mockRestore();
                if (previousNodeEnv === undefined) delete process.env.NODE_ENV;
                else process.env.NODE_ENV = previousNodeEnv;
                if (previousIsOffline === undefined) delete process.env.IS_OFFLINE;
                else process.env.IS_OFFLINE = previousIsOffline;
                vi.spyOn(Notifications, 'addNotificationToQueue').mockImplementation(
                    addNotificationToQueueSpy
                );
            }
        });

        it('keeps an ambiguous downstream Mongo timeout pending without a legacy fallback', async () => {
            const uri = await userA.clients.fullAuth.credential.sendCredential({
                profileId: 'userb',
                credential: testVc,
            });
            vi.mocked(Notifications.addNotificationToQueue).mockRestore();
            const previousNodeEnv = process.env.NODE_ENV;
            const previousIsOffline = process.env.IS_OFFLINE;
            process.env.NODE_ENV = 'development';
            process.env.IS_OFFLINE = 'true';
            const learnCardSpy = vi
                .spyOn(LearnCardHelpers, 'getDidWebLearnCard')
                .mockResolvedValue({
                    invoke: { getDidAuthVp: async () => 'test-did-auth-vp' },
                } as any);
            const fetchSpy = vi.spyOn(globalThis, 'fetch').mockRejectedValue(
                Object.assign(new Error('Mongo write response timed out'), {
                    name: 'MongoNetworkTimeoutError',
                })
            );
            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

            try {
                await expect(
                    userB.clients.fullAuth.credential.acceptCredential({ uri })
                ).resolves.toBe(true);

                expect(fetchSpy).toHaveBeenCalledTimes(1);
                const state = await neogma.queryRunner.run(
                    `
                        MATCH (:Profile { profileId: 'usera' })
                              -[prompt:CONNECTION_PROMPT]->
                              (:Profile { profileId: 'userb' })
                        RETURN prompt.status AS status,
                               coalesce(prompt.notificationDelivered, false) AS delivered,
                               coalesce(prompt.notificationDeliveryMayHaveSucceeded, false)
                                   AS mayHaveSucceeded
                    `
                );
                expect(state.records[0]?.toObject()).toEqual({
                    status: 'PENDING',
                    delivered: false,
                    mayHaveSucceeded: true,
                });
            } finally {
                consoleErrorSpy.mockRestore();
                fetchSpy.mockRestore();
                learnCardSpy.mockRestore();
                if (previousNodeEnv === undefined) delete process.env.NODE_ENV;
                else process.env.NODE_ENV = previousNodeEnv;
                if (previousIsOffline === undefined) delete process.env.IS_OFFLINE;
                else process.env.IS_OFFLINE = previousIsOffline;
                vi.spyOn(Notifications, 'addNotificationToQueue').mockImplementation(
                    addNotificationToQueueSpy
                );
            }
        });

        it('keeps an empty 2xx actionable acknowledgement uncertain without a legacy fallback', async () => {
            const uri = await userA.clients.fullAuth.credential.sendCredential({
                profileId: 'userb',
                credential: testVc,
            });
            vi.mocked(Notifications.addNotificationToQueue).mockRestore();
            const previousNodeEnv = process.env.NODE_ENV;
            const previousIsOffline = process.env.IS_OFFLINE;
            process.env.NODE_ENV = 'development';
            process.env.IS_OFFLINE = 'true';
            const learnCardSpy = vi
                .spyOn(LearnCardHelpers, 'getDidWebLearnCard')
                .mockResolvedValue({
                    invoke: { getDidAuthVp: async () => 'test-did-auth-vp' },
                } as any);
            const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
                ok: true,
                status: 200,
                text: async () => '',
            } as Response);
            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

            try {
                await expect(
                    userB.clients.fullAuth.credential.acceptCredential({ uri })
                ).resolves.toBe(true);

                expect(fetchSpy).toHaveBeenCalledTimes(1);
                const state = await neogma.queryRunner.run(
                    `
                        MATCH (:Profile { profileId: 'usera' })
                              -[prompt:CONNECTION_PROMPT]->
                              (:Profile { profileId: 'userb' })
                        RETURN prompt.status AS status,
                               coalesce(prompt.notificationDelivered, false) AS delivered,
                               coalesce(prompt.notificationDeliveryMayHaveSucceeded, false)
                                   AS mayHaveSucceeded
                    `
                );
                expect(state.records[0]?.toObject()).toEqual({
                    status: 'PENDING',
                    delivered: false,
                    mayHaveSucceeded: true,
                });
            } finally {
                consoleErrorSpy.mockRestore();
                fetchSpy.mockRestore();
                learnCardSpy.mockRestore();
                if (previousNodeEnv === undefined) delete process.env.NODE_ENV;
                else process.env.NODE_ENV = previousNodeEnv;
                if (previousIsOffline === undefined) delete process.env.IS_OFFLINE;
                else process.env.IS_OFFLINE = previousIsOffline;
                vi.spyOn(Notifications, 'addNotificationToQueue').mockImplementation(
                    addNotificationToQueueSpy
                );
            }
        });

        it('skips the undeliverable sender prompt for the same trigger and reopens it on a later claim', async () => {
            const firstUri = await userA.clients.fullAuth.credential.sendCredential({
                profileId: 'userb',
                credential: testVc,
            });
            addNotificationToQueueSpy.mockClear();
            addNotificationToQueueSpy.mockResolvedValueOnce(false);
            addNotificationToQueueSpy.mockResolvedValueOnce(undefined);
            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

            try {
                await expect(
                    userB.clients.fullAuth.credential.acceptCredential({ uri: firstUri })
                ).resolves.toBe(true);
            } finally {
                consoleErrorSpy.mockRestore();
            }

            const attemptedPromptId = addNotificationToQueueSpy.mock.calls[0]?.[0]?.data?.metadata
                ?.connectionPrompt?.promptId as string;
            expect(attemptedPromptId).toEqual(expect.any(String));
            await expect(
                userA.clients.fullAuth.profile.connectionPromptStatus({
                    promptId: attemptedPromptId,
                })
            ).resolves.toMatchObject({ status: 'SKIPPED' });
            await expect(
                userA.clients.fullAuth.profile.pendingConnectionPrompts()
            ).resolves.toHaveLength(0);
            await expect(
                userB.clients.fullAuth.profile.pendingConnectionPrompts()
            ).resolves.toHaveLength(1);

            addNotificationToQueueSpy.mockClear();
            await expect(
                userB.clients.fullAuth.credential.acceptCredential({ uri: firstUri })
            ).resolves.toBe(true);
            expect(addNotificationToQueueSpy).not.toHaveBeenCalled();
            await expect(
                userA.clients.fullAuth.profile.pendingConnectionPrompts()
            ).resolves.toHaveLength(0);

            const laterUri = await userA.clients.fullAuth.credential.sendCredential({
                profileId: 'userb',
                credential: testVc,
            });
            addNotificationToQueueSpy.mockClear();
            await expect(
                userB.clients.fullAuth.credential.acceptCredential({ uri: laterUri })
            ).resolves.toBe(true);

            const [laterSenderPrompt] =
                await userA.clients.fullAuth.profile.pendingConnectionPrompts();
            expect(laterSenderPrompt).toMatchObject({
                status: 'PENDING',
                triggerId: `credential:${laterUri.split(':').at(-1)}`,
            });
            expect(laterSenderPrompt?.promptId).not.toBe(attemptedPromptId);
            expect(
                addNotificationToQueueSpy.mock.calls.filter(
                    call =>
                        call[0]?.type === LCNNotificationTypeEnumValidator.enum.BOOST_ACCEPTED &&
                        call[0]?.data?.metadata?.connectionPrompt
                )
            ).toHaveLength(1);
        });

        it('keeps acceptance, activity, and recoverable prompts when actionable and legacy enqueues fail', async () => {
            const uri = await userA.clients.fullAuth.credential.sendCredential({
                profileId: 'userb',
                credential: testVc,
            });
            addNotificationToQueueSpy.mockClear();
            addNotificationToQueueSpy.mockResolvedValueOnce(false);
            addNotificationToQueueSpy.mockRejectedValueOnce(
                new Error('injected legacy enqueue failure')
            );
            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

            try {
                await expect(
                    userB.clients.fullAuth.credential.acceptCredential({ uri })
                ).resolves.toBe(true);
            } finally {
                consoleErrorSpy.mockRestore();
            }

            expect(await userB.clients.fullAuth.credential.receivedCredentials()).toHaveLength(1);
            const activities = await CredentialActivity.findMany({
                where: { eventType: 'CLAIMED', credentialUri: uri },
            });
            expect(activities).toHaveLength(1);

            const [claimerPrompt] = await userB.clients.fullAuth.profile.pendingConnectionPrompts();
            expect(claimerPrompt).toMatchObject({ status: 'PENDING', surface: 'POST_CLAIM' });
            const attemptedPromptId = addNotificationToQueueSpy.mock.calls[0]?.[0]?.data?.metadata
                ?.connectionPrompt?.promptId as string;
            await expect(
                userA.clients.fullAuth.profile.connectionPromptStatus({
                    promptId: attemptedPromptId,
                })
            ).resolves.toMatchObject({ status: 'SKIPPED' });
            await expect(
                userA.clients.fullAuth.profile.pendingConnectionPrompts()
            ).resolves.toHaveLength(0);
        });

        it('recovers a failed prompt write on retry without reopening skipped same-trigger prompts or duplicating notifications', async () => {
            const uri = await userA.clients.fullAuth.credential.sendCredential({
                profileId: 'userb',
                credential: testVc,
            });
            const originalRun = neogma.queryRunner.run.bind(neogma.queryRunner);
            const queryRunnerSpy = vi
                .spyOn(neogma.queryRunner, 'run')
                .mockImplementation(async (...args) => {
                    if (String(args[0]).includes('MERGE (viewer)-[prompt:CONNECTION_PROMPT]')) {
                        throw new Error('injected prompt write failure');
                    }

                    return originalRun(...args);
                });
            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

            addNotificationToQueueSpy.mockClear();
            try {
                await userB.clients.fullAuth.credential.acceptCredential({
                    uri,
                    options: { skipNotification: true },
                });
            } finally {
                queryRunnerSpy.mockRestore();
                consoleErrorSpy.mockRestore();
            }

            expect(await userB.clients.fullAuth.profile.pendingConnectionPrompts()).toHaveLength(0);
            expect(addNotificationToQueueSpy).not.toHaveBeenCalled();

            await userB.clients.fullAuth.credential.acceptCredential({
                uri,
                options: { skipNotification: true },
            });

            const claimerPrompts = await userB.clients.fullAuth.profile.pendingConnectionPrompts();
            const senderPrompts = await userA.clients.fullAuth.profile.pendingConnectionPrompts();
            expect(claimerPrompts).toHaveLength(1);
            expect(senderPrompts).toHaveLength(1);
            expect(
                addNotificationToQueueSpy.mock.calls.filter(
                    call => call[0]?.type === LCNNotificationTypeEnumValidator.enum.BOOST_ACCEPTED
                )
            ).toHaveLength(1);

            await Promise.all([
                userB.clients.fullAuth.profile.skipConnectionPrompt({
                    promptId: claimerPrompts[0]!.promptId,
                }),
                userA.clients.fullAuth.profile.skipConnectionPrompt({
                    promptId: senderPrompts[0]!.promptId,
                }),
            ]);
            addNotificationToQueueSpy.mockClear();

            await userB.clients.fullAuth.credential.acceptCredential({
                uri,
                options: { skipNotification: true },
            });

            expect(await userB.clients.fullAuth.profile.pendingConnectionPrompts()).toHaveLength(0);
            expect(await userA.clients.fullAuth.profile.pendingConnectionPrompts()).toHaveLength(0);
            expect(addNotificationToQueueSpy).not.toHaveBeenCalled();
        });

        it('localizes the boost-accepted notification to the recipient (sender) profile locale', async () => {
            // userA sends the credential, so userA is the recipient of the
            // BOOST_ACCEPTED notification ("X has accepted your boost"). Their
            // saved locale must drive the message language.
            await userA.clients.fullAuth.profile.updateProfile({ locale: 'fr' });

            const uri = await userA.clients.fullAuth.credential.sendCredential({
                profileId: 'userb',
                credential: testVc,
            });

            addNotificationToQueueSpy.mockClear();

            await userB.clients.fullAuth.credential.acceptCredential({ uri });

            const acceptedCall = addNotificationToQueueSpy.mock.calls.find(
                call => call[0]?.type === LCNNotificationTypeEnumValidator.enum.BOOST_ACCEPTED
            );
            expect(acceptedCall).toBeDefined();
            // Regression: sourceProfile is loaded via Profile.findRelationships,
            // whose dataValues only carry schema-declared fields. Before `locale`
            // was added to the Profile model schema this silently fell back to 'en'.
            expect(acceptedCall?.[0]?.message.title).toBe(
                getNotificationMessage('boostAccepted', 'fr', {}).title
            );
        });

        it('should allow accepting the same credential twice without duplicate side effects', async () => {
            const uri = await userA.clients.fullAuth.credential.sendCredential({
                profileId: 'userb',
                credential: testVc,
            });

            await expect(userB.clients.fullAuth.credential.acceptCredential({ uri })).resolves.toBe(
                true
            );

            addNotificationToQueueSpy.mockClear();

            await expect(userB.clients.fullAuth.credential.acceptCredential({ uri })).resolves.toBe(
                true
            );
            expect(addNotificationToQueueSpy).not.toHaveBeenCalled();
        });

        it('should clear did:web cache for managed profiles when accepting a boost that grants canManageChildrenProfiles', async () => {
            const boostUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
                claimPermissions: { canManageChildrenProfiles: true },
            });

            const managerDid =
                await userA.clients.fullAuth.profileManager.createChildProfileManager({
                    parentUri: boostUri,
                    profile: {},
                });

            const managerId = managerDid.split(':')[4]!;

            const managerClient = getClient({ did: managerDid, isChallengeValid: true });

            const managedProfileId = 'managed-profile';

            await managerClient.profileManager.createManagedProfile({
                profileId: managedProfileId,
            });

            await setDidDocForProfileManager(managerId, { id: managerDid } as any);
            await setDidDocForProfile(managedProfileId, { id: managedProfileId } as any);

            expect(await getDidDocForProfileManager(managerId)).toBeTruthy();
            expect(await getDidDocForProfile(managedProfileId)).toBeTruthy();

            const credentialUri = await sendBoost(
                { profileId: 'usera', user: userA },
                { profileId: 'userb', user: userB },
                boostUri,
                false
            );

            await userB.clients.fullAuth.credential.acceptCredential({ uri: credentialUri });

            expect(await getDidDocForProfileManager(managerId)).toBeFalsy();
            expect(await getDidDocForProfile(managedProfileId)).toBeFalsy();
        });
    });

    describe('receivedCredentials', () => {
        beforeEach(async () => {
            await Profile.delete({ detach: true, where: {} });
            await Credential.delete({ detach: true, where: {} });

            await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' });
            await userB.clients.fullAuth.profile.createProfile({ profileId: 'userb' });
        });

        it('should require full auth to get received credentials', async () => {
            await sendCredential(
                { profileId: 'usera', user: userA },
                { profileId: 'userb', user: userB }
            );

            await expect(
                userB.clients.partialAuth.credential.receivedCredentials()
            ).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
        });

        it('should show received credentials', async () => {
            await sendCredential(
                { profileId: 'usera', user: userA },
                { profileId: 'userb', user: userB }
            );

            const userACredentials = await userA.clients.fullAuth.credential.receivedCredentials();
            const userBCredentials = await userB.clients.fullAuth.credential.receivedCredentials();

            expect(userACredentials).toHaveLength(0);
            expect(userBCredentials).toHaveLength(1);
        });

        it('should only show accepted credentials', async () => {
            await userA.clients.fullAuth.credential.sendCredential({
                profileId: 'userb',
                credential: testVc,
            });

            const credentials = await userB.clients.fullAuth.credential.receivedCredentials();

            expect(credentials).toHaveLength(0);
        });

        it('should show when the credential was sent/received', async () => {
            vi.useFakeTimers().setSystemTime(new Date('02-06-2023'));
            const sent = new Date().toISOString();

            const uri = await userA.clients.fullAuth.credential.sendCredential({
                profileId: 'userb',
                credential: testVc,
            });

            vi.setSystemTime(new Date('02-07-2023'));
            const received = new Date().toISOString();

            await userB.clients.fullAuth.credential.acceptCredential({ uri });

            const credentials = await userB.clients.fullAuth.credential.receivedCredentials();

            expect(credentials[0]?.sent).toEqual(sent);
            expect(credentials[0]?.received).toEqual(received);

            vi.useRealTimers();
        });

        it('should allow filtering received credentials by who sent them', async () => {
            await userC.clients.fullAuth.profile.createProfile({ profileId: 'userc' });

            await sendCredential(
                { profileId: 'usera', user: userA },
                { profileId: 'userb', user: userB }
            );
            await sendCredential(
                { profileId: 'userc', user: userC },
                { profileId: 'userb', user: userB }
            );

            const allCredentials = await userB.clients.fullAuth.credential.receivedCredentials();
            const filteredCredentials = await userB.clients.fullAuth.credential.receivedCredentials(
                {
                    from: 'usera',
                }
            );

            expect(allCredentials).toHaveLength(2);
            expect(filteredCredentials).toHaveLength(1);
            expect(filteredCredentials[0]?.from).toEqual('usera');
        });
    });

    describe('sentCredentials', () => {
        beforeEach(async () => {
            await Profile.delete({ detach: true, where: {} });
            await Credential.delete({ detach: true, where: {} });

            await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' });
            await userB.clients.fullAuth.profile.createProfile({ profileId: 'userb' });
        });

        it('should require full auth to get sent credentials', async () => {
            await sendCredential(
                { profileId: 'usera', user: userA },
                { profileId: 'userb', user: userB }
            );

            await expect(
                userA.clients.partialAuth.credential.sentCredentials()
            ).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
        });

        it('should show sent credentials', async () => {
            await sendCredential(
                { profileId: 'usera', user: userA },
                { profileId: 'userb', user: userB }
            );

            const userACredentials = await userA.clients.fullAuth.credential.sentCredentials();
            const userBCredentials = await userB.clients.fullAuth.credential.sentCredentials();

            expect(userACredentials).toHaveLength(1);
            expect(userBCredentials).toHaveLength(0);
        });

        it('should show all sent credentials, accepted or not', async () => {
            await userA.clients.fullAuth.credential.sendCredential({
                profileId: 'userb',
                credential: testVc,
            });

            const credentials = await userA.clients.fullAuth.credential.sentCredentials();

            expect(credentials).toHaveLength(1);
        });

        it('should show when the credential was sent/received', async () => {
            vi.useFakeTimers().setSystemTime(new Date('02-06-2023'));
            const sent = new Date().toISOString();

            const uri = await userA.clients.fullAuth.credential.sendCredential({
                profileId: 'userb',
                credential: testVc,
            });

            vi.setSystemTime(new Date('02-07-2023'));
            const received = new Date().toISOString();

            await userB.clients.fullAuth.credential.acceptCredential({ uri });

            const credentials = await userA.clients.fullAuth.credential.sentCredentials();

            expect(credentials[0]?.sent).toEqual(sent);
            expect(credentials[0]?.received).toEqual(received);

            vi.useRealTimers();
        });

        it('should allow filtering sent credentials by who they were sent to', async () => {
            await userC.clients.fullAuth.profile.createProfile({ profileId: 'userc' });

            await sendCredential(
                { profileId: 'usera', user: userA },
                { profileId: 'userb', user: userB }
            );
            await sendCredential(
                { profileId: 'usera', user: userA },
                { profileId: 'userc', user: userC }
            );

            const allCredentials = await userA.clients.fullAuth.credential.sentCredentials();
            const filteredCredentials = await userA.clients.fullAuth.credential.sentCredentials({
                to: 'userb',
            });

            expect(allCredentials).toHaveLength(2);
            expect(filteredCredentials).toHaveLength(1);
            expect(filteredCredentials[0]?.to).toEqual('userb');
        });
    });

    describe('incomingCredentials', () => {
        beforeEach(async () => {
            await Profile.delete({ detach: true, where: {} });
            await Credential.delete({ detach: true, where: {} });

            await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' });
            await userB.clients.fullAuth.profile.createProfile({ profileId: 'userb' });
        });

        it('should require full auth to get incoming credentials', async () => {
            await userA.clients.fullAuth.credential.sendCredential({
                profileId: 'userb',
                credential: testVc,
            });

            await expect(
                userB.clients.partialAuth.credential.incomingCredentials()
            ).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
        });

        it('should show incoming credentials', async () => {
            await userA.clients.fullAuth.credential.sendCredential({
                profileId: 'userb',
                credential: testVc,
            });

            const userACredentials = await userA.clients.fullAuth.credential.incomingCredentials();
            const userBCredentials = await userB.clients.fullAuth.credential.incomingCredentials();

            expect(userACredentials).toHaveLength(0);
            expect(userBCredentials).toHaveLength(1);
        });

        it('should not show accepted credentials', async () => {
            const uri = await userA.clients.fullAuth.credential.sendCredential({
                profileId: 'userb',
                credential: testVc,
            });

            const beforeAcceptance = await userB.clients.fullAuth.credential.incomingCredentials();

            expect(beforeAcceptance).toHaveLength(1);

            await userB.clients.fullAuth.credential.acceptCredential({ uri });

            const afterAcceptance = await userB.clients.fullAuth.credential.incomingCredentials();

            expect(afterAcceptance).toHaveLength(0);
        });

        it('should show when the credential was sent', async () => {
            vi.useFakeTimers().setSystemTime(new Date('02-06-2023'));
            const sent = new Date().toISOString();

            await userA.clients.fullAuth.credential.sendCredential({
                profileId: 'userb',
                credential: testVc,
            });

            const credentials = await userB.clients.fullAuth.credential.incomingCredentials();

            expect(credentials[0]?.sent).toEqual(sent);

            vi.useRealTimers();
        });

        it('should allow filtering incoming credentials by who sent them', async () => {
            await userC.clients.fullAuth.profile.createProfile({ profileId: 'userc' });

            await userA.clients.fullAuth.credential.sendCredential({
                profileId: 'userb',
                credential: testVc,
            });
            await userC.clients.fullAuth.credential.sendCredential({
                profileId: 'userb',
                credential: testVc,
            });

            const allCredentials = await userB.clients.fullAuth.credential.incomingCredentials();
            const filteredCredentials = await userB.clients.fullAuth.credential.incomingCredentials(
                {
                    from: 'usera',
                }
            );

            expect(allCredentials).toHaveLength(2);
            expect(filteredCredentials).toHaveLength(1);
            expect(filteredCredentials[0]?.from).toEqual('usera');
        });
    });

    describe('deleteCredential', () => {
        beforeEach(async () => {
            await Profile.delete({ detach: true, where: {} });
            await Credential.delete({ detach: true, where: {} });
            await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' });
            await userB.clients.fullAuth.profile.createProfile({ profileId: 'userb' });
        });

        afterAll(async () => {
            await Profile.delete({ detach: true, where: {} });
            await Credential.delete({ detach: true, where: {} });
        });

        it('should require full auth to delete a credential', async () => {
            const uri = await sendCredential(
                { profileId: 'usera', user: userA },
                { profileId: 'userb', user: userB }
            );

            await expect(noAuthClient.credential.deleteCredential({ uri })).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
            await expect(
                userA.clients.partialAuth.credential.deleteCredential({ uri })
            ).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
        });

        it('should allow you to delete a credential', async () => {
            const uri = await sendCredential(
                { profileId: 'usera', user: userA },
                { profileId: 'userb', user: userB }
            );

            await expect(userA.clients.fullAuth.storage.resolve({ uri })).resolves.not.toThrow();

            await expect(
                userA.clients.fullAuth.credential.deleteCredential({ uri })
            ).resolves.not.toThrow();

            await expect(userA.clients.fullAuth.storage.resolve({ uri })).rejects.toMatchObject({
                code: 'NOT_FOUND',
            });
        });

        it('should remove deleted credentials from sent/received lists', async () => {
            const uri = await sendCredential(
                { profileId: 'usera', user: userA },
                { profileId: 'userb', user: userB }
            );

            let userASent = await userA.clients.fullAuth.credential.sentCredentials();
            let userBReceived = await userB.clients.fullAuth.credential.receivedCredentials();

            expect(userASent).toHaveLength(1);
            expect(userBReceived).toHaveLength(1);

            await userA.clients.fullAuth.credential.deleteCredential({ uri });

            userASent = await userA.clients.fullAuth.credential.sentCredentials();
            userBReceived = await userB.clients.fullAuth.credential.receivedCredentials();

            expect(userASent).toHaveLength(0);
            expect(userBReceived).toHaveLength(0);
        });

        it("should not allow profiles to delete credentials they don't own", async () => {
            const uri = await userA.clients.fullAuth.credential.sendCredential({
                profileId: 'userb',
                credential: testVc,
            });

            await expect(userA.clients.fullAuth.storage.resolve({ uri })).resolves.not.toThrow();

            await expect(
                userB.clients.fullAuth.credential.deleteCredential({ uri })
            ).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
        });
    });
});
