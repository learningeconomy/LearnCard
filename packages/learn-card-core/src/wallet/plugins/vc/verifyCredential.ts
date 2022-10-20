import { VC } from '@learncard/types';

import { ProofOptions } from '@wallet/plugins/didkit/types';
import { VCImplicitWallet, VCPluginDependentMethods } from './types';
import { Wallet } from 'types/wallet';

export const verifyCredential = (initWallet: Wallet<any, VCPluginDependentMethods>) => {
    return async (
        _wallet: VCImplicitWallet,
        credential: VC,
        options: Partial<ProofOptions> = {}
    ) => {
        return initWallet.invoke.verifyCredential(credential, options);
    };
};
