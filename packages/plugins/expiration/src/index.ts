import { VerifyExtension } from '@learncard/vc-plugin';
import { LearnCard } from '@learncard/core';
import { ExpirationPlugin } from './types';

export * from './types';

/**
 * @group Plugins
 */
export const expirationPlugin = (
    learnCard: LearnCard<any, any, VerifyExtension>
): ExpirationPlugin => ({
    name: 'Expiration',
    displayName: 'Expiration Extension',
    description: "Adds a check to make sure credentials aren't expired when verifying them",
    methods: {
        verifyCredential: async (_learnCard, credential, options) => {
            const verificationCheck = await learnCard.invoke.verifyCredential(credential, options);

            if (credential.expirationDate && new Date() > new Date(credential.expirationDate)) {
                verificationCheck.errors.push('expiration error: Credential is expired');
            } else if (credential.validFrom && new Date() < new Date(credential.validFrom)) {
                verificationCheck.errors.push('expiration error: Credential is not valid yet');
            } else if (credential.validUntil && new Date() > new Date(credential.validUntil)) {
                verificationCheck.errors.push('expiration error: Credential is no longer valid');
            } else {
                verificationCheck.checks.push('expiration');
            }

            return verificationCheck;
        },
    },
});
