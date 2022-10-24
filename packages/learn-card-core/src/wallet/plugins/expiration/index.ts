import { VerifyExtension } from '../vc';
import { Wallet } from 'types/wallet';
import { ExpirationPlugin } from './types';

/**
 * @group Plugins
 */
export const expirationPlugin = (wallet: Wallet<any, any, VerifyExtension>): ExpirationPlugin => ({
    name: 'Expiration',
    methods: {
        verifyCredential: async (_wallet, credential) => {
            const verificationCheck = await wallet.invoke.verifyCredential(credential);

            if (credential.expirationDate && new Date() > new Date(credential.expirationDate)) {
                verificationCheck.errors.push('expiration error: Credential is expired');
            } else {
                verificationCheck.checks.push('expiration');
            }

            return verificationCheck;
        },
    },
});
