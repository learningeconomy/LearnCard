import { VP } from '@learncard/types';

import { VCImplicitWallet, VCPluginDependentMethods } from './types';
import { Wallet } from 'types/wallet';

export const verifyPresentation = (initWallet: Wallet<string, VCPluginDependentMethods>) => {
    return async (_wallet: VCImplicitWallet, presentation: VP) => {
        return initWallet.pluginMethods.verifyPresentation(presentation);
    };
};
