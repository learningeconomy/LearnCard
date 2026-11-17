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
import ERC20ABI from './erc20.abi.json';
import hardcodedTokens from './hardcodedTokens';

export * from './types';

// The Uniswap token list is ~175 KB of JSON that only token lookups need; load it on first use so it
// stays out of wallet start-up. A failed import (stale chunk after a deploy, flaky fetch) is retried
// once in place; if that fails too, the lookup rejects with the first import error and the next
// lookup imports again instead of replaying the cached rejection.
let defaultTokenListPromise: Promise<TokenList> | undefined;
const importTokenList = () =>
    import('@uniswap/default-token-list/build/uniswap-default.tokenlist.json');
const getDefaultTokenList = (): Promise<TokenList> => {
    if (defaultTokenListPromise) return defaultTokenListPromise;
    const pending = importTokenList()
        .catch(firstError =>
            importTokenList().catch(() => {
                throw firstError;
            })
        )
        .then(module => {
            const list = ((module as { default?: unknown }).default ?? module) as {
                tokens: TokenList;
            };
            return list.tokens.concat(hardcodedTokens);
        });
    defaultTokenListPromise = pending;
    pending.catch(() => {
        if (defaultTokenListPromise === pending) defaultTokenListPromise = undefined;
    });
    return pending;
};

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
    // Constructing an ethers Wallet precomputes secp256k1 tables (~35 ms on a desktop CPU, several
    // times that on phones), and every wallet start would pay it. Build it on first use instead.
    let wallet: ethers.Wallet | undefined;
    const getWallet = (): ethers.Wallet => (wallet ??= new ethers.Wallet(privateKey));
    let address: string | undefined;
    const getAddress = (): string => (address ??= getWallet().address);

    // Provider
    const getProvider = () => {
        let provider: ethers.providers.Provider;
        if (infuraProjectId) {
            provider = new ethers.providers.InfuraProvider(network, infuraProjectId);
        } else {
            provider = ethers.getDefaultProvider(network);
        }

        wallet = getWallet().connect(provider);
        return provider;
    };
    let provider: ethers.providers.Provider;

    const getTokenAddress = async (tokenSymbolOrAddress: string) => {
        if (!provider) provider = getProvider();

        return (
            await getTokenFromSymbolOrAddress(
                tokenSymbolOrAddress,
                await getDefaultTokenList(),
                await getChainIdFromProvider(provider)
            )
        )?.address;
    };

    const getErc20TokenBalance = async (
        tokenContractAddress: string,
        walletPublicAddress = getAddress()
    ) => {
        if (!provider) provider = getProvider();

        const contract = new ethers.Contract(tokenContractAddress, ERC20ABI, provider);

        const balance = await contract.balanceOf(walletPublicAddress);
        const formattedBalance = formatUnits(
            balance,
            tokenContractAddress,
            await getDefaultTokenList(),
            await getChainIdFromProvider(provider)
        );

        return formattedBalance;
    };

    // Core Methods
    const getBalance = async (walletAddress = getAddress(), tokenSymbolOrAddress = 'ETH') => {
        if (!provider) provider = getProvider();

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
            getEthereumAddress: () => getAddress(),

            getBalance: async (_learnCard, symbolOrAddress = 'ETH') =>
                getBalance(getAddress(), symbolOrAddress),
            getBalanceForAddress: async (_learnCard, walletAddress, symbolOrAddress) =>
                getBalance(walletAddress, symbolOrAddress),

            transferTokens: async (_learnCard, tokenSymbolOrAddress, amount, toAddress) => {
                if (!provider) provider = getProvider();

                if (tokenSymbolOrAddress === 'ETH') {
                    const transaction = {
                        to: toAddress,

                        // Convert ETH to wei
                        value: ethers.utils.parseEther(amount.toString()),
                    };

                    return (await getWallet().sendTransaction(transaction)).hash;
                }

                const tokenAddress = await getTokenAddress(tokenSymbolOrAddress);
                if (!tokenAddress) {
                    throw new Error(
                        `Unable to determine token address for \"${tokenSymbolOrAddress}\"`
                    );
                }

                const tokenContract = new ethers.Contract(tokenAddress, ERC20ABI, getWallet());

                return (
                    await tokenContract.transfer(
                        toAddress,
                        await parseUnits(
                            amount.toString(),
                            tokenContract.address,
                            await getDefaultTokenList(),
                            await getChainIdFromProvider(provider)
                        )
                    )
                ).hash;
            },

            getGasPrice: async () => {
                if (!provider) provider = getProvider();

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
