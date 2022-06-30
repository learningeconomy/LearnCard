// import { Plugin } from 'types/wallet';
import { Plugin, UnlockedWallet } from 'types/wallet';
import { ethers } from 'ethers';

import { EthereumConfig, EthereumNetworks, EthereumPluginMethods } from './types';

export const getEthereumPlugin = (
    initWallet: UnlockedWallet<string, { getSubjectDid: () => string }>,
    config: EthereumConfig
): Plugin<'Ethereum', EthereumPluginMethods> => {
    const { address, infuraProjectId, network = EthereumNetworks.mainnet } = config;

    // let provider: ethers.providers.JsonRpcProvider;
    let provider: any; // TODO properly type this
    if (infuraProjectId) {
        const url = `https://${network}.infura.io/v3/${infuraProjectId}`;
        provider = new ethers.providers.JsonRpcProvider(url);
    } else {
        provider = ethers.getDefaultProvider();
    }

    const checkErc20TokenBalance = async (tokenContractAddress: string) => {
        // TODO find a better way than calling this in every method
        if (!address) {
            throw new Error("Can't check balance: No address provided.");
        }

        const erc20Abi = require('./erc20.abi.json');
        const contract = new ethers.Contract(tokenContractAddress, erc20Abi, provider);

        const balance = await contract.balanceOf(address);
        const formattedBalance = ethers.utils.formatUnits(balance);

        return formattedBalance;
    };

    return {
        pluginMethods: {
            checkMyEth: async () => {
                if (!address) {
                    throw new Error("Can't check ETH: No ethereum address provided.");
                }

                const balance = await provider.getBalance(address);
                const formattedBalance = ethers.utils.formatEther(balance);

                return formattedBalance;
            },
            checkMyDai: async () => {
                const daiAddress = '0x6B175474E89094C44Da98b954EedeAC495271d0F';
                const daiBalance = await checkErc20TokenBalance(daiAddress);
                return daiBalance;
            },
            checkMyUsdc: async () => {
                const usdcAddress = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
                const usdcBalance = await checkErc20TokenBalance(usdcAddress);
                return usdcBalance;
            },

            /* changeMyAddress: (_wallet: any, addressToUse: string) => {
                myAddress = addressToUse;
            }, */

            // ...initWallet.pluginMethods,
        },
    };
};
