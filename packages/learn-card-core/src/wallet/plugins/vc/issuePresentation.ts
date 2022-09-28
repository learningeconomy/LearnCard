import { UnsignedVP } from '@learncard/types';

import { ProofOptions } from '@wallet/plugins/didkit/types';
import { VCImplicitWallet, VCPluginDependentMethods } from './types';
import { Wallet } from 'types/wallet';

export const issuePresentation = (initWallet: Wallet<string, VCPluginDependentMethods>) => {
    return async (
        wallet: VCImplicitWallet,
        presentation: UnsignedVP,
        signingOptions: Partial<ProofOptions> = {}
    ) => {
        const kp = wallet.pluginMethods.getSubjectKeypair();

        if (!kp) throw new Error('Cannot issue credential: Could not get subject keypair');

        const options = {
            verificationMethod: await initWallet.pluginMethods.keyToVerificationMethod('key', kp),
            proofPurpose: 'assertionMethod',
            ...signingOptions,
        };

        return initWallet.pluginMethods.issuePresentation(presentation, options, kp);
    };
};
