import { VC } from '@learncard/types';

import { DependentMethods, VCPluginMethods } from './types';
import { Wallet } from 'types/wallet';

export const verifyCredential = (initWallet: Wallet<string, DependentMethods>) => {
    return async (_wallet: Wallet<string, VCPluginMethods>, credential: VC) => {
        return initWallet.pluginMethods.verifyCredential(credential);
    };
};
