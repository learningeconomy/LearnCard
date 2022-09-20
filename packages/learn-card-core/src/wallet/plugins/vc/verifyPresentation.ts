import { VP } from '@learncard/types';

import { VCPluginDependentMethods, VCPluginMethods } from './types';
import { Wallet } from 'types/wallet';

export const verifyPresentation = (initWallet: Wallet<string, VCPluginDependentMethods>) => {
    return async (_wallet: Wallet<string, VCPluginMethods>, presentation: VP) => {
        return initWallet.pluginMethods.verifyPresentation(presentation);
    };
};
