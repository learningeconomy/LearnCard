import { Buffer } from 'buffer';

import { LearnCard } from '@learncard/core';
import { ethers } from 'ethers';

import { EthereumConfig, EthereumPlugin, TokenList } from './types';
import {
    formatUnits,
    parseUnits,
    getTokenFromSymbolOrAddress,
    getChainIdFromProvider,
} from './helpers';
import hardcodedTokens from './hardcodedTokens';

export * from './types';

const ERC20ABI = require('./erc20.abi.json');

/**
 * @group Plugins
 */
export const getEthereumPlugin = (
    initLearnCard: LearnCard<any, 'id'>,
    config: EthereumConfig
): EthereumPlugin => {
    let { infuraProjectId, network = 'mainnet' } = config;

    // Ethers wallet
    const secpKeypair = initLearnCard.id.keypair('secp256k1');

    if (!secpKeypair) {
        throw new Error('LearnCard must support secp256k1 JWK in order to add Ethereum Plugin');
    }

    const privateKey = Buffer.from(secpKeypair.d, 'base64').toString('hex');
    let ethersWallet = new ethers.Wallet(privateKey);
    const publicKey: string = ethersWallet.address;

    // Provider
    const getProvider = () => {
        let provider: ethers.providers.Provider;
        if (infuraProjectId) {
            provider = new ethers.providers.InfuraProvider(network, infuraProjectId);
        } else {
            provider = ethers.getDefaultProvider(network);
        }

        ethersWallet = ethersWallet.connect(provider);
        return provider;
    };
    let provider = getProvider();

    const getDefaultTokenList = (): TokenList => {
        return require('@uniswap/default-token-list/build/uniswap-default.tokenlist.json').tokens.concat(
            hardcodedTokens
        );
    };
    const defaultTokenList: TokenList = getDefaultTokenList();

    const getTokenAddress = async (tokenSymbolOrAddress: string) => {
        return (
            await getTokenFromSymbolOrAddress(
                tokenSymbolOrAddress,
                defaultTokenList,
                await getChainIdFromProvider(provider)
            )
        )?.address;
    };

    const getErc20TokenBalance = async (
        tokenContractAddress: string,
        walletPublicAddress = publicKey
    ) => {
        const contract = new ethers.Contract(tokenContractAddress, ERC20ABI, provider);

        const balance = await contract.balanceOf(walletPublicAddress);
        const formattedBalance = formatUnits(
            balance,
            tokenContractAddress,
            defaultTokenList,
            await getChainIdFromProvider(provider)
        );

        return formattedBalance;
    };

    // Core Methods
    const getBalance = async (walletAddress = publicKey, tokenSymbolOrAddress = 'ETH') => {
        if (!tokenSymbolOrAddress || tokenSymbolOrAddress === 'ETH') {
            // check ETH by default
            const balance = await provider.getBalance(walletAddress);
            const formattedBalance = ethers.utils.formatEther(balance);

            return formattedBalance;
        }

        const tokenAddress = await getTokenAddress(tokenSymbolOrAddress);

        if (!tokenAddress) {
            throw new Error(`Unable to determine token address for \"${tokenSymbolOrAddress}\"`);
        }

        const balance = await getErc20TokenBalance(tokenAddress, walletAddress);

        return balance;
    };

    return {
        name: 'Ethereum',
        displayName: 'Ethereum',
        description: 'Provides access to currency',
        methods: {
            getEthereumAddress: () => publicKey,

            getBalance: async (_learnCard, symbolOrAddress = 'ETH') =>
                getBalance(publicKey, symbolOrAddress),
            getBalanceForAddress: async (_learnCard, walletAddress, symbolOrAddress) =>
                getBalance(walletAddress, symbolOrAddress),

            transferTokens: async (_learnCard, tokenSymbolOrAddress, amount, toAddress) => {
                if (tokenSymbolOrAddress === 'ETH') {
                    const transaction = {
                        to: toAddress,

                        // Convert ETH to wei
                        value: ethers.utils.parseEther(amount.toString()),
                    };

                    return (await ethersWallet.sendTransaction(transaction)).hash;
                }

                const tokenAddress = await getTokenAddress(tokenSymbolOrAddress);
                if (!tokenAddress) {
                    throw new Error(
                        `Unable to determine token address for \"${tokenSymbolOrAddress}\"`
                    );
                }

                const tokenContract = new ethers.Contract(tokenAddress, ERC20ABI, ethersWallet);

                return (
                    await tokenContract.transfer(
                        toAddress,
                        await parseUnits(
                            amount.toString(),
                            tokenContract.address,
                            defaultTokenList,
                            await getChainIdFromProvider(provider)
                        )
                    )
                ).hash;
            },

            getGasPrice: async () => {
                return ethers.utils.formatUnits(await provider.getGasPrice());
            },

            /* Configuration-type methods */
            getCurrentNetwork: () => {
                return network;
            },
            changeNetwork: (_learnCard, _network: ethers.providers.Networkish) => {
                const oldNetwork = network;
                try {
                    network = _network;
                    provider = getProvider();
                } catch (e) {
                    network = oldNetwork;
                    provider = getProvider();
                    throw e;
                }
            },
            addInfuraProjectId: (_learnCard, infuraProjectIdToAdd) => {
                infuraProjectId = infuraProjectIdToAdd;
                provider = getProvider();
            },
        },
    };
};
