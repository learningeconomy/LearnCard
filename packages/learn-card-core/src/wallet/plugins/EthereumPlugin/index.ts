// import { Plugin } from 'types/wallet';
import { Plugin, UnlockedWallet } from 'types/wallet';
import { ethers } from 'ethers';

import { EthereumPluginMethods } from './types';

export const getEthereumPlugin = (
    initWallet: UnlockedWallet<string, { getSubjectDid: () => string }>,
    _myAddress: string
): Plugin<'Ethereum', EthereumPluginMethods> => {
    let myAddress = _myAddress;

    return {
        pluginMethods: {
            checkMyEth: async () => {
                console.log('🎆🎆🎆🎆🎆🎆🎆🎆🎆🎆🎆🎆🎆🎆🎆🎆🎆🎆🎆');

                if (!myAddress) {
                    throw new Error("Can't check ETH: No ethereum address provided.");
                }

                const provider = ethers.getDefaultProvider();

                const balance = await provider.getBalance(myAddress);

                console.log('balance:', balance);

                const formattedBalance = ethers.utils.formatEther(balance);

                console.log('formattedBalance:', formattedBalance);

                return parseInt(myAddress);
            },
            /* changeMyAddress: (_wallet: any, addressToUse: string) => {
                myAddress = addressToUse;
            }, */

            // ...initWallet.pluginMethods,
        },
    };
};
