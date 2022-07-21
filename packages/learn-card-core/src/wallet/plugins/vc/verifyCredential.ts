import { VC } from '@learncard/types';

import { DependentMethods, VCPluginMethods } from './types';
import { UnlockedWallet } from 'types/wallet';

export const verifyCredential = (initWallet: UnlockedWallet<string, DependentMethods>) => {
    return async (_wallet: UnlockedWallet<string, VCPluginMethods>, credential: VC) => {
        return initWallet.pluginMethods.verifyCredential(credential);
    };
};
