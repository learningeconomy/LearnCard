import { VC, UnsignedVP } from '@learncard/types';

import { DependentMethods, VCPluginMethods } from './types';
import { Wallet } from 'types/wallet';

export const issuePresentation = (initWallet: Wallet<string, DependentMethods>) => {
    return async (wallet: Wallet<string, VCPluginMethods>, credential: VC) => {
        const did = wallet.pluginMethods.getSubjectDid('key');

        if (!did) throw new Error('Cannot create presentation: No holder key found');

        const holder = did;

        const kp = wallet.pluginMethods.getSubjectKeypair();

        if (!kp) throw new Error('Cannot issue credential: Could not get subject keypair');

        const options = {
            verificationMethod: await initWallet.pluginMethods.keyToVerificationMethod('key', kp),
            proofPurpose: 'assertionMethod',
        };

        const presentation: UnsignedVP = {
            '@context': ['https://www.w3.org/2018/credentials/v1'],
            type: ['VerifiablePresentation'],
            holder,
            verifiableCredential: credential,
        };

        return initWallet.pluginMethods.issuePresentation(presentation, options, kp);
    };
};
