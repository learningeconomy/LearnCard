import { UnsignedVC } from '@learncard/types';

import { ProofOptions } from '@wallet/plugins/didkit/types';
import { VCImplicitWallet, VCPluginDependentMethods } from './types';
import { Wallet } from 'types/wallet';

export const issueCredential = (initWallet: Wallet<any, VCPluginDependentMethods>) => {
    return async (
        wallet: VCImplicitWallet,
        credential: UnsignedVC,
        signingOptions: Partial<ProofOptions> = {}
    ) => {
        const kp = wallet.pluginMethods.getSubjectKeypair();

        if (!kp) throw new Error('Cannot issue credential: Could not get subject keypair');

        const options = {
            verificationMethod: await initWallet.pluginMethods.keyToVerificationMethod('key', kp),
            proofPurpose: 'assertionMethod',
            type: 'Ed25519Signature2020',
            ...signingOptions,
        };

        return initWallet.pluginMethods.issueCredential(credential, options, kp);
    };
};
