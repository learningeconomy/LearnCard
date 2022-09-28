import { VC } from '@learncard/types';

import { VCImplicitWallet, VCPluginDependentMethods } from './types';
import { Wallet } from 'types/wallet';

export const verifyCredential = (initWallet: Wallet<string, VCPluginDependentMethods>) => {
    return async (_wallet: VCImplicitWallet, credential: VC) => {
        return initWallet.pluginMethods.verifyCredential(credential);
    };
};
