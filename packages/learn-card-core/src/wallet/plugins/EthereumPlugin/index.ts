// import { Plugin } from 'types/wallet';
import { Plugin, UnlockedWallet } from 'types/wallet';
// import ethers from 'ethers';

import { EthereumPluginMethods } from './types';

export const getEthereumPlugin = (
    initWallet: UnlockedWallet<string, { getSubjectDid: () => string }>,
    _myAddress: string
): Plugin<'Ethereum', EthereumPluginMethods> => {
    let myAddress = _myAddress;

    return {
        pluginMethods: {
            checkMyEth: () => {
                console.log('🎆🎆🎆🎆🎆🎆🎆🎆🎆🎆🎆🎆🎆🎆🎆🎆🎆🎆🎆');
                // console.log('ethers.getDefaultProvider():', ethers.getDefaultProvider());

                return parseInt(myAddress);
            },
            /* changeMyAddress: (_wallet: any, addressToUse: string) => {
                myAddress = addressToUse;
            }, */

            // ...initWallet.pluginMethods,
        },
    };
};
