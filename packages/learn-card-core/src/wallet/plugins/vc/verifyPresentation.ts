import { VP } from '@learncard/types';

import { DependentMethods, VCPluginMethods } from './types';
import { Wallet } from 'types/wallet';

export const verifyPresentation = (initWallet: Wallet<string, DependentMethods>) => {
    return async (_wallet: Wallet<string, VCPluginMethods>, presentation: VP) => {
        return initWallet.pluginMethods.verifyPresentation(presentation);
    };
};
