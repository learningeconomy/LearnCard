import { UnsignedVC } from '@learncard/types';

import { DependentMethods, VCPluginMethods } from './types';
import { Wallet } from 'types/wallet';

export const issueCredential = (initWallet: Wallet<string, DependentMethods>) => {
    return async (wallet: Wallet<string, VCPluginMethods>, credential: UnsignedVC) => {
        const kp = wallet.pluginMethods.getSubjectKeypair();

        if (!kp) throw new Error('Cannot issue credential: Could not get subject keypair');

        const options = {
            verificationMethod: await initWallet.pluginMethods.keyToVerificationMethod('key', kp),
            proofPurpose: 'assertionMethod',
        };

        return initWallet.pluginMethods.issueCredential(credential, options, kp);
    };
};
