import { VerifyExtension } from '../vc';
import { LearnCard } from 'types/wallet';
import { ExpirationPlugin } from './types';

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
        verifyCredential: async (_learnCard, credential) => {
            const verificationCheck = await learnCard.invoke.verifyCredential(credential);

            if (credential.expirationDate && new Date() > new Date(credential.expirationDate)) {
                verificationCheck.errors.push('expiration error: Credential is expired');
            } else {
                verificationCheck.checks.push('expiration');
            }

            return verificationCheck;
        },
    },
});
