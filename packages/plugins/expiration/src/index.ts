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
        verifyCredential: async (_learnCard, credential, _options) => {
            // Default the DIDKit checks here too, not only in the VC plugin: verify-only
            // LearnCards (`initLearnCard()` with no seed) have no VC plugin, and without
            // this a revoked credential's status list is never consulted.
            const options = { ..._options };
            if (!options.checks) {
                options.checks = ['proof'];
                if (credential.credentialStatus) options.checks.push('credentialStatus');
                if (credential.credentialSchema) options.checks.push('credentialSchema');
            }

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
