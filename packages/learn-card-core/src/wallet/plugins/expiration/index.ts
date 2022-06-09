import { VerifyExtension } from '../vc/types';
import { Plugin, UnlockedWallet } from 'types/wallet';

export const ExpirationPlugin = (
    wallet: UnlockedWallet<any, VerifyExtension>
): Plugin<'Expiration', VerifyExtension> => ({
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
