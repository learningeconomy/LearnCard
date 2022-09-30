import { VP } from '@learncard/types';

import { ProofOptions } from '@wallet/plugins/didkit/types';
import { VCImplicitWallet, VCPluginDependentMethods } from './types';
import { Wallet } from 'types/wallet';

export const verifyPresentation = (initWallet: Wallet<string, VCPluginDependentMethods>) => {
    return async (
        _wallet: VCImplicitWallet,
        presentation: VP,
        options: Partial<ProofOptions> = {}
    ) => {
        return initWallet.pluginMethods.verifyPresentation(presentation, options);
    };
};
