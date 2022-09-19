import { VC } from '@learncard/types';

import { VCPluginDependentMethods, VCPluginMethods } from './types';
import { Wallet } from 'types/wallet';

export const verifyCredential = (initWallet: Wallet<string, VCPluginDependentMethods>) => {
    return async (_wallet: Wallet<string, VCPluginMethods>, credential: VC) => {
        return initWallet.pluginMethods.verifyCredential(credential);
    };
};
