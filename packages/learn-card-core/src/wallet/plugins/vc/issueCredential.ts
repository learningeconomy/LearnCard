import { UnsignedVC } from '@learncard/types';

import { ProofOptions } from '@wallet/plugins/didkit/types';
import { VCDependentWallet, VCImplicitWallet } from './types';

export const issueCredential = (initWallet: VCDependentWallet) => {
    return async (
        wallet: VCImplicitWallet,
        credential: UnsignedVC,
        signingOptions: Partial<ProofOptions> = {}
    ) => {
        const kp = wallet.id.keypair();

        if (!kp) throw new Error('Cannot issue credential: Could not get subject keypair');

        const options = {
            verificationMethod: await initWallet.invoke.keyToVerificationMethod('key', kp),
            proofPurpose: 'assertionMethod',
            type: 'Ed25519Signature2020',
            ...signingOptions,
        };

        return initWallet.invoke.issueCredential(credential, options, kp);
    };
};
