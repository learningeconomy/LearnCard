import { VP } from '@learncard/types';

import { DependentMethods, VCPluginMethods } from './types';
import { Wallet } from 'types/wallet';

export const verifyPresentation = (initWallet: Wallet<any, DependentMethods>) => {
    return async (_wallet: Wallet<any, VCPluginMethods>, presentation: VP) => {
        return initWallet.pluginMethods.verifyPresentation(presentation);
    };
};
