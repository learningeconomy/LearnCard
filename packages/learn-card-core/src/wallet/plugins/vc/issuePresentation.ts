import { UnsignedVP } from '@learncard/types';

import { DependentMethods, VCPluginMethods } from './types';
import { Wallet } from 'types/wallet';

export const issuePresentation = (initWallet: Wallet<any, DependentMethods>) => {
    return async (wallet: Wallet<any, VCPluginMethods>, presentation: UnsignedVP) => {
        const kp = wallet.pluginMethods.getSubjectKeypair();

        if (!kp) throw new Error('Cannot issue credential: Could not get subject keypair');

        const options = {
            verificationMethod: await initWallet.pluginMethods.keyToVerificationMethod('key', kp),
            proofPurpose: 'assertionMethod',
        };

        return initWallet.pluginMethods.issuePresentation(presentation, options, kp);
    };
};
