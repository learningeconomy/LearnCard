import { VP } from '@learncard/types';

import { DependentMethods, VCPluginMethods } from './types';
import { UnlockedWallet } from 'types/wallet';

export const verifyPresentation = (initWallet: UnlockedWallet<string, DependentMethods>) => {
    return async (_wallet: UnlockedWallet<string, VCPluginMethods>, presentation: VP) => {
        return initWallet.pluginMethods.verifyPresentation(presentation);
    };
};
