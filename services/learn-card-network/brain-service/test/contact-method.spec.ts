import { vi, describe, it, expect, beforeEach, afterAll, beforeAll } from 'vitest';
import { getClient, getUser } from './helpers/getClient';
import { Profile, ContactMethod, Integration } from '@models';
import { getDidWebLearnCard } from '@helpers/learnCard.helpers';
import { LCNIntegration } from '@learncard/types';

const noAuthClient = getClient();
let userA: Awaited<ReturnType<typeof getUser>>;
let userB: Awaited<ReturnType<typeof getUser>>;
let serverLC: Awaited<ReturnType<typeof getUser>>;
let integration: LCNIntegration | undefined;

const sendSpy = vi.fn();
vi.mock('@services/delivery/delivery.factory', () => ({
    getDeliveryService: () => ({ send: sendSpy }),
}));

describe('Contact Methods', () => {
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
        // serverLC is the login provider specified in vite.config.ts LOGIN_PROVIDER_DID
        serverLC = await getUser('e'.repeat(64));
    });

    describe('Get my contact methods', () => {
        beforeEach(async () => {
            sendSpy.mockClear();
            await Profile.delete({ detach: true, where: {} });
            await ContactMethod.delete({ detach: true, where: {} });
            await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' });
            await userB.clients.fullAuth.profile.createProfile({ profileId: 'userb' });
        });

        describe('Verify With Credential (proof-of-login VP-JWT)', () => {

            beforeEach(async () => {
                sendSpy.mockClear();
                await Profile.delete({ detach: true, where: {} });
                await ContactMethod.delete({ detach: true, where: {} });
                await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' });
                await userB.clients.fullAuth.profile.createProfile({ profileId: 'userb' });
            });

            it('should verify an email contact method via VP-JWT and create it if missing', async () => {
                const vpJwt = (await serverLC.learnCard.invoke.getDidAuthVp({
                    proofFormat: 'jwt',
                    challenge: 'proof-of-login:email:userB@test.com',
                })) as unknown as string;

                const res = await userB.clients.fullAuth.contactMethods.verifyWithCredential({
                    proofOfLoginJwt: vpJwt,
                });

                expect(res).toBeDefined();
                expect(res.message).toBe('Contact method verified successfully.');
                expect(res.contactMethod.type).toBe('email');
                expect(res.contactMethod.value).toBe('userB@test.com');
                expect(res.contactMethod.isVerified).toBe(true);

                const methods = await userB.clients.fullAuth.contactMethods.getMyContactMethods();
                const cm = methods?.find(m => m.value === 'userB@test.com');
                expect(cm?.isVerified).toBe(true);
                expect(cm?.verifiedAt).toBeDefined(); 
            });

            it('should reject a VP-JWT whose holder is not a trusted login provider', async () => {
                const vpJwt = (await userB.learnCard.invoke.getDidAuthVp({
                    proofFormat: 'jwt',
                    challenge: 'proof-of-login:email:untrusted@test.com',
                })) as unknown as string;

                await expect(
                    userB.clients.fullAuth.contactMethods.verifyWithCredential({ proofOfLoginJwt: vpJwt })
                ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
            });

            it('should reject an invalid proof-of-login challenge prefix', async () => {
                const vpJwt = (await serverLC.learnCard.invoke.getDidAuthVp({
                    proofFormat: 'jwt',
                    challenge: 'invalid-prefix:email:userB@test.com',
                })) as unknown as string;

                await expect(
                    userB.clients.fullAuth.contactMethods.verifyWithCredential({ proofOfLoginJwt: vpJwt })
                ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
            });

            it('should reject an unsupported contact method type in the challenge', async () => {
                const vpJwt = (await serverLC.learnCard.invoke.getDidAuthVp({
                    proofFormat: 'jwt',
                    challenge: 'proof-of-login:fax:12345',
                })) as unknown as string;

                await expect(
                    userB.clients.fullAuth.contactMethods.verifyWithCredential({ proofOfLoginJwt: vpJwt })
                ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
            });
        });

        afterAll(async () => {
            sendSpy.mockClear();
            await Profile.delete({ detach: true, where: {} });
            await ContactMethod.delete({ detach: true, where: {} });
        });

        it('should not let a user get their contact methods without full auth', async () => {
            await expect(
                noAuthClient.contactMethods.getMyContactMethods()
            ).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
            await expect(
                userA.clients.partialAuth.contactMethods.getMyContactMethods()
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        });

        it('should let a user get their contact methods', async () => {
            const contactMethods = await userB.clients.fullAuth.contactMethods.getMyContactMethods();
            expect(contactMethods).toBeDefined();
            expect(contactMethods?.length).toBe(0);

        });

        it('should allow adding a contact method', async () => {
            const contactMethod = await userB.clients.fullAuth.contactMethods.addContactMethod({ type: 'email', value: 'userB@test.com' });
            expect(contactMethod).toBeDefined();
            expect(contactMethod?.verificationRequired).toBe(true);
            expect(contactMethod?.contactMethodId).toBeDefined();
          
            const contactMethods = await userB.clients.fullAuth.contactMethods.getMyContactMethods();
            expect(contactMethods).toBeDefined();
            expect(contactMethods?.length).toBe(1);
            if(!contactMethods?.[0]) {
                throw new Error('Contact method is undefined');
            }
            expect(contactMethods?.[0].value).toBe('userB@test.com');
            expect(contactMethods?.[0].isVerified).toBe(false);
            expect(contactMethods?.[0].verifiedAt).toBeUndefined();
            expect(contactMethods?.[0].createdAt).toBeDefined();
            if (!contactMethods?.[0].createdAt) {
                throw new Error('Created at is undefined');
            }
            expect(new Date(contactMethods?.[0].createdAt).getTime()).toBeLessThanOrEqual(new Date().getTime());
        });

        it('should allow verifying an email contact method', async () => {
            // Add a contact method. This will also trigger the verification email.
            await userB.clients.fullAuth.contactMethods.addContactMethod({ type: 'email', value: 'userB@test.com' });

            // Check that the delivery service was called
            expect(sendSpy).toHaveBeenCalledOnce();

            // Retrieve the verification token from the spy's call arguments
            const sendArgs = sendSpy.mock.calls[0][0];
            const verificationToken = sendArgs.templateModel.verificationToken;

            expect(sendArgs.templateId).toBe('contact-method-verification');
            expect(verificationToken).toBeDefined();

            // Use the retrieved token to complete the verification
            await userB.clients.fullAuth.contactMethods.verifyContactMethod({ token: verificationToken });

            // Assert that the contact method is now verified
            const contactMethods = await userB.clients.fullAuth.contactMethods.getMyContactMethods();
            const verifiedMethod = contactMethods?.find(cm => cm.value === 'userB@test.com');
            expect(verifiedMethod?.isVerified).toBe(true);
            if (!verifiedMethod?.verifiedAt) {
                throw new Error('Verified at is undefined');
            }
            expect(new Date(verifiedMethod?.verifiedAt).getTime()).toBeLessThanOrEqual(new Date().getTime());
        });

        it('should allow verifying a phone contact method', async () => {
            process.env.TRUSTED_ISSUERS_WHITELIST = userB.learnCard.id.did();
            // Add a contact method. This will also trigger the verification SMS.
            await userB.clients.fullAuth.contactMethods.addContactMethod({ type: 'phone', value: '+15555555' });

            // Check that the delivery service was called
            expect(sendSpy).toHaveBeenCalledOnce();

            // Retrieve the verification token from the spy's call arguments
            const sendArgs = sendSpy.mock.calls[0][0];
            const verificationToken = sendArgs.templateModel.verificationToken;

            expect(sendArgs.templateId).toBe('contact-method-verification');
            expect(verificationToken).toBeDefined();

            // Use the retrieved token to complete the verification
            await userB.clients.fullAuth.contactMethods.verifyContactMethod({ token: verificationToken });

            // Assert that the contact method is now verified
            const contactMethods = await userB.clients.fullAuth.contactMethods.getMyContactMethods();
            const verifiedMethod = contactMethods?.find(cm => cm.value === '+15555555');
            expect(verifiedMethod?.isVerified).toBe(true);
        });

        it('should not allow verifying a phone contact if the profiles DID is not in the trusted issuers whitelist', async () => {
            await expect(userB.clients.fullAuth.contactMethods.addContactMethod({ type: 'phone', value: '+15555555' })).rejects.toThrow();
        });

        it('should not allow verifying a contact method that does not exist', async () => {
            await expect(
                userB.clients.fullAuth.contactMethods.verifyContactMethod({ token: 'invalid-token' })
            ).rejects.toMatchObject({
                code: 'BAD_REQUEST',
                message: 'Invalid or expired verification token',
            });
        });

        it('should not allow verifying a contact method that does not belong to the profile', async () => {
            // Add a contact method to user A
            await userA.clients.fullAuth.contactMethods.addContactMethod({ type: 'email', value: 'userA@test.com' });

            // Get the verification token from the spy's call arguments
            const sendArgs = sendSpy.mock.calls[0][0];
            const verificationToken = sendArgs.templateModel.verificationToken;

            // Verify the contact method as user B
            await expect(
                userB.clients.fullAuth.contactMethods.verifyContactMethod({ token: verificationToken })
            ).rejects.toMatchObject({
                code: 'FORBIDDEN',
                message: 'You do not own this contact method',
            });

            // Assert that the contact method is not verified for user A
            const contactMethods = await userA.clients.fullAuth.contactMethods.getMyContactMethods();
            const verifiedMethod = contactMethods?.find(cm => cm.value === 'userA@test.com');
            expect(verifiedMethod?.isVerified).toBe(false);
        });

        it('if multiple profiles add the contact method, it should delete it from other profiles once verified', async () => {
            // Add a contact method to user A
            await userA.clients.fullAuth.contactMethods.addContactMethod({ type: 'email', value: 'userA@test.com' });

            // Get the verification token from the spy's call arguments
            const sendArgs = sendSpy.mock.calls[0][0];
            const verificationToken = sendArgs.templateModel.verificationToken;

            // Add a contact method to user A
            await userB.clients.fullAuth.contactMethods.addContactMethod({ type: 'email', value: 'userA@test.com' });

            // Get the verification token from the spy's call arguments
            const sendArgs2 = sendSpy.mock.calls[1][0];
            const verificationToken2 = sendArgs2.templateModel.verificationToken;

        
            // Verify the contact method as user B
            await expect(
                userB.clients.fullAuth.contactMethods.verifyContactMethod({ token: verificationToken2 })
            ).resolves.not.toThrow();

            // Assert that the contact method is verified for user B
            const contactMethods = await userB.clients.fullAuth.contactMethods.getMyContactMethods();
            const verifiedMethod = contactMethods?.find(cm => cm.value === 'userA@test.com');
            expect(verifiedMethod?.isVerified).toBe(true);

            // Assert that the contact method is deleted for user A
            const contactMethods2 = await userA.clients.fullAuth.contactMethods.getMyContactMethods();
            const verifiedMethod2 = contactMethods2?.find(cm => cm.value === 'userA@test.com');
            expect(verifiedMethod2).toBeUndefined(); 

        });

        it('should allow setting a contact method as primary', async () => {
            // Add a contact method to user B
            const { contactMethodId } = await userB.clients.fullAuth.contactMethods.addContactMethod({ type: 'email', value: 'userB@test.com' });

            // Set the contact method as primary
            await userB.clients.fullAuth.contactMethods.setPrimaryContactMethod({ contactMethodId });

            // Assert that the contact method is now primary
            const contactMethods = await userB.clients.fullAuth.contactMethods.getMyContactMethods();
            const primaryMethod = contactMethods?.find(cm => cm.value === 'userB@test.com');
            expect(primaryMethod?.isPrimary).toBe(true);
        });

        it('should unset previous primary contacts when setting a new primary contact', async () => {
            process.env.TRUSTED_ISSUERS_WHITELIST = userB.learnCard.id.did();
            // Add a contact method to user B
            const { contactMethodId } = await userB.clients.fullAuth.contactMethods.addContactMethod({ type: 'email', value: 'userB@test.com' });

            // Add another contact method to user B
            const { contactMethodId: contactMethodId2 } = await userB.clients.fullAuth.contactMethods.addContactMethod({ type: 'phone', value: '+15555555' });

            // Set the contact method as primary
            await userB.clients.fullAuth.contactMethods.setPrimaryContactMethod({ contactMethodId });

            // Assert that the contact method is now primary
            const contactMethods = await userB.clients.fullAuth.contactMethods.getMyContactMethods();
            const primaryMethod = contactMethods?.find(cm => cm.value === 'userB@test.com');
            expect(primaryMethod?.isPrimary).toBe(true);

            // Assert that the other contact method is no longer primary
            const primaryMethod2 = contactMethods?.find(cm => cm.value === '+15555555');
            expect(primaryMethod2?.isPrimary).toBe(false);

            // Set the other contact method as primary
            await userB.clients.fullAuth.contactMethods.setPrimaryContactMethod({ contactMethodId: contactMethodId2 });

            // Assert that the contact method is now primary
            const contactMethods3 = await userB.clients.fullAuth.contactMethods.getMyContactMethods();
            const primaryMethod3 = contactMethods3?.find(cm => cm.value === '+15555555');
            expect(primaryMethod3?.isPrimary).toBe(true);

            // Assert that the other contact method is no longer primary
            const primaryMethod4 = contactMethods3?.find(cm => cm.value === 'userB@test.com');
            expect(primaryMethod4?.isPrimary).toBe(false);
        });

        it('should not allow setting a contact method as primary that does not belong to the profile', async () => {
            // Add a contact method to user A
            const { contactMethodId } = await userA.clients.fullAuth.contactMethods.addContactMethod({ type: 'email', value: 'userA@test.com' });

            // Set the contact method as primary for user B
            await expect(
                userB.clients.fullAuth.contactMethods.setPrimaryContactMethod({ contactMethodId })
            ).rejects.toMatchObject({
                code: 'FORBIDDEN',
                message: 'You do not own this contact method',
            });
        });

        it('should allow removing a contact method', async () => {
            // Add a contact method to user B
            const { contactMethodId } = await userB.clients.fullAuth.contactMethods.addContactMethod({ type: 'email', value: 'userB@test.com' });

            // Remove the contact method
            await userB.clients.fullAuth.contactMethods.removeContactMethod({ id: contactMethodId });

            // Assert that the contact method is no longer associated with the profile
            const contactMethods = await userB.clients.fullAuth.contactMethods.getMyContactMethods();
            expect(contactMethods?.length).toBe(0);
        });

        it('should allow removing a verified contact method', async () => {
            // Add a contact method. This will also trigger the verification email.
            const { contactMethodId } =await userB.clients.fullAuth.contactMethods.addContactMethod({ type: 'email', value: 'userB@test.com' });

            // Check that the delivery service was called
            expect(sendSpy).toHaveBeenCalledOnce();

            // Retrieve the verification token from the spy's call arguments
            const sendArgs = sendSpy.mock.calls[0][0];
            const verificationToken = sendArgs.templateModel.verificationToken;

            expect(sendArgs.templateId).toBe('contact-method-verification');
            expect(verificationToken).toBeDefined();

            // Use the retrieved token to complete the verification
            await userB.clients.fullAuth.contactMethods.verifyContactMethod({ token: verificationToken });

            // Remove the contact method
            await userB.clients.fullAuth.contactMethods.removeContactMethod({ id: contactMethodId });

            // Assert that the contact method is no longer associated with the profile
            const contactMethods2 = await userB.clients.fullAuth.contactMethods.getMyContactMethods();
            expect(contactMethods2?.length).toBe(0);
        });

        it('should not allow removing a contact method that does not belong to the profile', async () => {
            // Add a contact method to user A
            const { contactMethodId } = await userA.clients.fullAuth.contactMethods.addContactMethod({ type: 'email', value: 'userA@test.com' });

            // Remove the contact method for user B
            await expect(
                userB.clients.fullAuth.contactMethods.removeContactMethod({ id: contactMethodId })
            ).rejects.toMatchObject({
                code: 'FORBIDDEN',
                message: 'You do not own this contact method',
            });
        });

    });

    describe('Create Inbox Claim Session', () => {

        beforeEach(async () => {
            sendSpy.mockClear();
            await Profile.delete({ detach: true, where: {} });
            await Integration.delete({ detach: true, where: {} });
            await ContactMethod.delete({ detach: true, where: {} });
            await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' });
            await userB.clients.fullAuth.profile.createProfile({ profileId: 'userb' });

    
            const integrationId = await userA.clients.fullAuth.integrations.addIntegration({
                name: 'test',
                whitelistedDomains: ['localhost:3000'],
                description: 'test',    
            }); 
            
            integration = await userA.clients.fullAuth.integrations.getIntegration({ id: integrationId });
        });

        afterAll(async () => {
            sendSpy.mockClear();
            await Profile.delete({ detach: true, where: {} });
            await Integration.delete({ detach: true, where: {} });
            await ContactMethod.delete({ detach: true, where: {} });
        });

        it('should return UNAUTHORIZED when creating a contact method session with an incorrect otp code', async () => {
            
            if (!integration) {
                throw new Error('Integration not found');
            }
            
            // Add a contact method to user A 
            await userA.clients.fullAuth.contactMethods.sendChallenge({ type: 'email', value: 'userA@test.com', configuration: { publishableKey: integration.publishableKey } });
 
            await expect(
                userB.clients.fullAuth.contactMethods.createContactMethodSession({ contactMethod: { type: 'email', value: 'userA@test.com' }, otpChallenge: '123456' })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED', message: 'Invalid OTP challenge' });
        });
    });
});
