import { VP } from '@learncard/types';

import { ProofOptions } from '@wallet/plugins/didkit/types';
import { VCDependentWallet, VCImplicitWallet } from './types';

export const verifyPresentation = (initWallet: VCDependentWallet) => {
    return async (
        _wallet: VCImplicitWallet,
        presentation: VP,
        options: Partial<ProofOptions> = {}
    ) => {
        return initWallet.invoke.verifyPresentation(presentation, options);
    };
};
