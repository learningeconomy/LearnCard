import { VC } from '@learncard/types';

import { ProofOptions } from '@wallet/plugins/didkit/types';
import { VCDependentWallet, VCImplicitWallet } from './types';

export const verifyCredential = (initWallet: VCDependentWallet) => {
    return async (
        _wallet: VCImplicitWallet,
        credential: VC,
        options: Partial<ProofOptions> = {}
    ) => {
        return initWallet.invoke.verifyCredential(credential, options);
    };
};
