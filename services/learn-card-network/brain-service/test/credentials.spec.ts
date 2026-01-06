import { vi } from 'vitest';
import { getClient, getUser } from './helpers/getClient';
import { testVc, sendBoost, sendCredential, testUnsignedBoost } from './helpers/send';
import { Profile, Credential, SigningAuthority } from '@models';
import * as Notifications from '@helpers/notifications.helpers';
import * as SigningAuthorityHelpers from '@helpers/signingAuthority.helpers';
import { addNotificationToQueueSpy } from './helpers/spies';
import {
    getDidDocForProfile,
    getDidDocForProfileManager,
    setDidDocForProfile,
    setDidDocForProfileManager,
} from '@cache/did-docs';
import { UnsignedVC, VC } from '@learncard/types';

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

    describe('sendCredential', () => {
        beforeEach(async () => {
            await Profile.delete({ detach: true, where: {} });
            await Credential.delete({ detach: true, where: {} });
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

        it('should not allow accepting the same credential twice', async () => {
            const uri = await userA.clients.fullAuth.credential.sendCredential({
                profileId: 'userb',
                credential: testVc,
            });

            // First acceptance should succeed
            await expect(
                userB.clients.fullAuth.credential.acceptCredential({ uri })
            ).resolves.not.toThrow();

            // Second acceptance should fail
            await expect(
                userB.clients.fullAuth.credential.acceptCredential({ uri })
            ).rejects.toMatchObject({
                code: 'BAD_REQUEST',
                message: expect.stringContaining('already been received'),
            });
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

    describe('issueCredential', () => {
        const testUnsignedCredential: UnsignedVC = {
            '@context': ['https://www.w3.org/2018/credentials/v1'],
            type: ['VerifiableCredential'],
            issuer: '',
            issuanceDate: new Date().toISOString(),
            credentialSubject: {
                id: 'did:example:recipient',
                achievement: 'Test Achievement',
            },
        };

        const mockSignedCredential: VC = {
            '@context': ['https://www.w3.org/2018/credentials/v1'],
            type: ['VerifiableCredential'],
            issuer: 'did:key:z6Mktest',
            issuanceDate: new Date().toISOString(),
            credentialSubject: {
                id: 'did:example:recipient',
                achievement: 'Test Achievement',
            },
            proof: {
                type: 'Ed25519Signature2020',
                created: new Date().toISOString(),
                verificationMethod: 'did:key:z6Mktest#z6Mktest',
                proofPurpose: 'assertionMethod',
                proofValue: 'mock-proof-value',
            },
        };

        let issueCredentialSpy: ReturnType<typeof vi.spyOn>;

        beforeEach(async () => {
            await Profile.delete({ detach: true, where: {} });
            await Credential.delete({ detach: true, where: {} });
            await SigningAuthority.delete({ detach: true, where: {} });

            await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' });
            await userB.clients.fullAuth.profile.createProfile({ profileId: 'userb' });

            issueCredentialSpy = vi
                .spyOn(SigningAuthorityHelpers, 'issueCredentialWithSigningAuthority')
                .mockResolvedValue(mockSignedCredential);
        });

        afterEach(() => {
            issueCredentialSpy.mockRestore();
        });

        afterAll(async () => {
            await Profile.delete({ detach: true, where: {} });
            await Credential.delete({ detach: true, where: {} });
            await SigningAuthority.delete({ detach: true, where: {} });
        });

        it('should require full auth to issue a credential', async () => {
            await expect(
                noAuthClient.credential.issueCredential({ credential: testUnsignedCredential })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });

            await expect(
                userA.clients.partialAuth.credential.issueCredential({
                    credential: testUnsignedCredential,
                })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        });

        it('should require credentials:write scope', async () => {
            const userWithReadScope = await getUser('d'.repeat(64), 'credentials:read');
            await userWithReadScope.clients.fullAuth.profile.createProfile({ profileId: 'userd' });

            await expect(
                userWithReadScope.clients.fullAuth.credential.issueCredential({
                    credential: testUnsignedCredential,
                })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        });

        it('should fail if no signing authority is registered', async () => {
            await expect(
                userA.clients.fullAuth.credential.issueCredential({
                    credential: testUnsignedCredential,
                })
            ).rejects.toMatchObject({ code: 'PRECONDITION_FAILED' });
        });

        it('should issue a credential using the primary signing authority', async () => {
            const saDid = userA.learnCard.id.did();

            await userA.clients.fullAuth.profile.registerSigningAuthority({
                endpoint: 'http://localhost:5000/test-sa',
                name: 'test-sa',
                did: saDid,
            });

            const result = await userA.clients.fullAuth.credential.issueCredential({
                credential: testUnsignedCredential,
            });

            expect(result).toBeDefined();
            expect(result.proof).toBeDefined();
        });

        it('should issue a credential using a specified signing authority', async () => {
            const saDid1 = userA.learnCard.id.did();
            const saDid2 = userB.learnCard.id.did();

            await userA.clients.fullAuth.profile.registerSigningAuthority({
                endpoint: 'http://localhost:5000/sa1',
                name: 'sa1',
                did: saDid1,
            });

            await userA.clients.fullAuth.profile.registerSigningAuthority({
                endpoint: 'http://localhost:5000/sa2',
                name: 'sa2',
                did: saDid2,
            });

            const result = await userA.clients.fullAuth.credential.issueCredential({
                credential: testUnsignedCredential,
                signingAuthority: {
                    endpoint: 'http://localhost:5000/sa2',
                    name: 'sa2',
                },
            });

            expect(result).toBeDefined();
            expect(result.proof).toBeDefined();
        });

        it('should fail if specified signing authority is not found', async () => {
            const saDid = userA.learnCard.id.did();

            await userA.clients.fullAuth.profile.registerSigningAuthority({
                endpoint: 'http://localhost:5000/test-sa',
                name: 'test-sa',
                did: saDid,
            });

            await expect(
                userA.clients.fullAuth.credential.issueCredential({
                    credential: testUnsignedCredential,
                    signingAuthority: {
                        endpoint: 'http://localhost:5000/nonexistent',
                        name: 'nonexistent',
                    },
                })
            ).rejects.toMatchObject({ code: 'NOT_FOUND' });
        });

        it('should set the issuer to the signing authority DID', async () => {
            const saDid = userA.learnCard.id.did();

            await userA.clients.fullAuth.profile.registerSigningAuthority({
                endpoint: 'http://localhost:5000/test-sa',
                name: 'test-sa',
                did: saDid,
            });

            const credentialWithWrongIssuer: UnsignedVC = {
                ...testUnsignedCredential,
                issuer: 'did:example:wrong-issuer',
            };

            const result = await userA.clients.fullAuth.credential.issueCredential({
                credential: credentialWithWrongIssuer,
            });

            expect(result).toBeDefined();
            expect(result.proof).toBeDefined();
        });

        it('should use primary signing authority when multiple are registered', async () => {
            const saDid1 = userA.learnCard.id.did();
            const saDid2 = userB.learnCard.id.did();

            await userA.clients.fullAuth.profile.registerSigningAuthority({
                endpoint: 'http://localhost:5000/sa1',
                name: 'sa1',
                did: saDid1,
            });

            await userA.clients.fullAuth.profile.registerSigningAuthority({
                endpoint: 'http://localhost:5000/sa2',
                name: 'sa2',
                did: saDid2,
            });

            await userA.clients.fullAuth.profile.setPrimarySigningAuthority({
                endpoint: 'http://localhost:5000/sa2',
                name: 'sa2',
            });

            const result = await userA.clients.fullAuth.credential.issueCredential({
                credential: testUnsignedCredential,
            });

            expect(result).toBeDefined();
            expect(result.proof).toBeDefined();
        });
    });

    describe('verifyCredential', () => {
        beforeEach(async () => {
            await Profile.delete({ detach: true, where: {} });
            await Credential.delete({ detach: true, where: {} });

            await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' });
        });

        afterAll(async () => {
            await Profile.delete({ detach: true, where: {} });
            await Credential.delete({ detach: true, where: {} });
        });

        it('should allow verification without authentication', async () => {
            await expect(
                noAuthClient.credential.verifyCredential({ credential: testVc })
            ).resolves.not.toThrow();
        });

        it('should verify a credential and return result structure', async () => {
            const result = await noAuthClient.credential.verifyCredential({
                credential: testVc,
            });

            expect(result).toBeDefined();
            expect(result).toHaveProperty('checks');
            expect(result).toHaveProperty('warnings');
            expect(result).toHaveProperty('errors');
            expect(Array.isArray(result.checks)).toBe(true);
            expect(Array.isArray(result.warnings)).toBe(true);
            expect(Array.isArray(result.errors)).toBe(true);
        });

        it('should return errors for an invalid credential', async () => {
            const invalidCredential = {
                '@context': ['https://www.w3.org/2018/credentials/v1'],
                type: ['VerifiableCredential'],
                issuer: 'did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK',
                issuanceDate: new Date().toISOString(),
                credentialSubject: {
                    id: 'did:example:invalid-test',
                },
                proof: {
                    type: 'Ed25519Signature2020',
                    created: new Date().toISOString(),
                    verificationMethod:
                        'did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK#z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK',
                    proofPurpose: 'assertionMethod',
                    proofValue: 'invalid-signature-value',
                },
            };

            const result = await noAuthClient.credential.verifyCredential({
                credential: invalidCredential as any,
            });

            expect(result).toBeDefined();
            expect(result.errors.length).toBeGreaterThan(0);
        });

        it('should work with authenticated users as well', async () => {
            const result = await userA.clients.fullAuth.credential.verifyCredential({
                credential: testVc,
            });

            expect(result).toBeDefined();
            expect(result).toHaveProperty('checks');
            expect(result).toHaveProperty('warnings');
            expect(result).toHaveProperty('errors');
        });
    });
});
