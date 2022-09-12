import { VerifyExtension } from '../vc';
import { Wallet } from 'types/wallet';
import { ExpirationPlugin } from './types';

export const expirationPlugin = (wallet: Wallet<any, VerifyExtension>): ExpirationPlugin => ({
    name: 'Expiration',
    pluginMethods: {
        verifyCredential: async (_wallet, credential) => {
            const verificationCheck = await wallet.pluginMethods.verifyCredential(credential);

            if (credential.expirationDate && new Date() > new Date(credential.expirationDate)) {
                verificationCheck.errors.push('expiration error: Credential is expired');
            } else {
                verificationCheck.checks.push('expiration');
            }

            return verificationCheck;
        },
    },
});
