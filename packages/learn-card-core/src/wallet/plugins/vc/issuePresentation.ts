import { UnsignedVP } from '@learncard/types';

import { ProofOptions } from '@wallet/plugins/didkit/types';
import { VCImplicitWallet, VCPluginDependentMethods } from './types';
import { Wallet } from 'types/wallet';

export const issuePresentation = (initWallet: Wallet<any, VCPluginDependentMethods>) => {
    return async (
        wallet: VCImplicitWallet,
        presentation: UnsignedVP,
        signingOptions: Partial<ProofOptions> = {}
    ) => {
        const kp = wallet.invoke.getSubjectKeypair();

        if (!kp) throw new Error('Cannot issue credential: Could not get subject keypair');

        const options = {
            verificationMethod: await initWallet.invoke.keyToVerificationMethod('key', kp),
            proofPurpose: 'assertionMethod',
            type: 'Ed25519Signature2020',
            ...signingOptions,
        };

        return initWallet.invoke.issuePresentation(presentation, options, kp);
    };
};
