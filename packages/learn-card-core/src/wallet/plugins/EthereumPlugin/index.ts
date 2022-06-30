// import { Plugin } from 'types/wallet';
import { Plugin, UnlockedWallet } from 'types/wallet';
import { ethers } from 'ethers';

import { EthereumConfig, EthereumNetworks, EthereumPluginMethods } from './types';

export const getEthereumPlugin = (
    initWallet: UnlockedWallet<string, { getSubjectDid: () => string }>,
    config: EthereumConfig
): Plugin<'Ethereum', EthereumPluginMethods> => {
    const { address, infuraProjectId, network = EthereumNetworks.mainnet } = config;

    const getProvider = () => {
        if (infuraProjectId) {
            console.log('🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧');

            const url = `https://${network}.infura.io/v3/${infuraProjectId}`;
            const provider = new ethers.providers.JsonRpcProvider(url);
            return provider;
        }

        return ethers.getDefaultProvider();
    };

    return {
        pluginMethods: {
            checkMyEth: async () => {
                console.log('🎆🎆🎆🎆🎆🎆🎆🎆🎆🎆🎆🎆🎆🎆🎆🎆🎆🎆🎆');
                console.log('network:', network);

                if (!address) {
                    throw new Error("Can't check ETH: No ethereum address provided.");
                }

                const provider = getProvider();

                const balance = await provider.getBalance(address);

                console.log('balance:', balance);

                const formattedBalance = ethers.utils.formatEther(balance);

                console.log('formattedBalance:', formattedBalance);

                return parseInt(formattedBalance);
            },
            /* changeMyAddress: (_wallet: any, addressToUse: string) => {
                myAddress = addressToUse;
            }, */

            // ...initWallet.pluginMethods,
        },
    };
};
