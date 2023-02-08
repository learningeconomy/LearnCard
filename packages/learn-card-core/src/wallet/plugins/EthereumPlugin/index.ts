import { Buffer } from 'buffer';

import { LearnCard } from 'types/wallet';
import { ethers } from 'ethers';

import { EthereumConfig, EthereumPlugin, SimpleHistory, TokenList } from './types';
import {
    formatUnits,
    parseUnits,
    getTokenFromSymbolOrAddress,
    getChainIdFromProvider,
    isAddress,
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
    let { infuraProjectId, alchemyApiKey, etherscanApiKey, network = 'mainnet' } = config;

    // Ethers wallet
    const secpKeypair = initLearnCard.id.keypair('secp256k1');

    if (!secpKeypair) {
        throw new Error('LearnCard must support secp256k1 JWK in order to add Ethereum Plugin');
    }

    const privateKey = Buffer.from(secpKeypair.d, 'base64').toString('hex');
    let ethersWallet = new ethers.Wallet(privateKey);
    const publicKey: string = ethersWallet.address;

    let etherscanProvider: ethers.providers.EtherscanProvider;

    // Provider
    const getProvider = () => {
        let provider: ethers.providers.Provider;
        if (infuraProjectId) {
            provider = new ethers.providers.InfuraProvider(network, infuraProjectId);
        } else if (alchemyApiKey) {
            provider = new ethers.providers.AlchemyProvider(network, alchemyApiKey);
        } else if (etherscanApiKey) {
            provider = new ethers.providers.EtherscanProvider(network, etherscanApiKey);
        } else {
            provider = ethers.getDefaultProvider(network);
        }

        // Always initialized becuase we use it for transaction history
        etherscanProvider = new ethers.providers.EtherscanProvider(network, etherscanApiKey);

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
        if (isAddress(tokenSymbolOrAddress)) return tokenSymbolOrAddress;

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

    const getTransferHistory = async (tokenSymbolOrAddress: string) => {
        const tokenContractAddress = await getTokenAddress(tokenSymbolOrAddress);
        if (!tokenContractAddress) {
            throw new Error(
                `Could't find token address for the given symbol (${tokenSymbolOrAddress})`
            );
        }

        const contract = new ethers.Contract(tokenContractAddress, ERC20ABI, provider);

        const sentFilter = contract.filters.Transfer(publicKey);
        const receivedFilter = contract.filters.Transfer(null, publicKey);

        const [sent, received] = await Promise.all([
            contract.queryFilter(sentFilter),
            contract.queryFilter(receivedFilter),
        ]);

        return [...sent, ...received];
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

            getTransactionHistory: async (): Promise<ethers.providers.TransactionResponse[]> => {
                return await etherscanProvider.getHistory(publicKey);
            },
            getTransactionHistoryForToken: async (_learnCard, tokenSymbolOrAddress: string) => {
                return await getTransferHistory(tokenSymbolOrAddress);
            },
            getSimpleTransactionHistoryForTokens: async (
                _learnCard,
                tokenSymbolOrAddresses: string[]
            ) => {
                console.log('🎆🎆🎆🎆🎆🎆🎆🎆🎆🎆🎆🎆🎆🎆🎆🎆🎆🎆🎆 simpleTranHistory');
                const chainId = await getChainIdFromProvider(provider);

                let simpleHistories: SimpleHistory[][] = await Promise.all(
                    tokenSymbolOrAddresses.map(async symbolOrAddress => {
                        // special handling for ETH since it's not an ERC20
                        if (symbolOrAddress === 'ETH') {
                            const history = await etherscanProvider.getHistory(publicKey);

                            const simpleHistory: SimpleHistory[] = [];
                            history.forEach(transaction => {
                                const { from, to, timestamp, value } = transaction;
                                simpleHistory.push({
                                    token: {
                                        chainId,
                                        name: 'Ethereum',
                                        address: '',
                                        symbol: 'ETH',
                                        decimals: 18,
                                        logoURI: '',
                                    },
                                    from,
                                    to: to ?? '',
                                    timestamp: timestamp ?? 0,
                                    amount: ethers.utils.formatEther(value),
                                });
                            });

                            return simpleHistory;
                        }

                        const token = await getTokenFromSymbolOrAddress(
                            symbolOrAddress,
                            defaultTokenList,
                            chainId
                        );
                        if (!token) throw new Error(`Couldn't find token for ${symbolOrAddress}`);

                        const transferEvents = await getTransferHistory(token?.address);
                        const simpleHistory: SimpleHistory[] = [];
                        await Promise.all(
                            transferEvents.map(async transferEvent => {
                                if (!transferEvent?.args) return;
                                const { from, to, value } = transferEvent.args;
                                const block = await transferEvent.getBlock();

                                simpleHistory.push({
                                    token,
                                    from,
                                    to,
                                    amount: await formatUnits(
                                        value,
                                        token.address,
                                        defaultTokenList,
                                        chainId
                                    ),
                                    timestamp: block.timestamp,
                                });
                            })
                        );

                        return simpleHistory;
                    })
                );

                // combine SimpleHistory arrays and sort (most recent first)
                return simpleHistories.flat(1).sort((a, b) => b.timestamp - a.timestamp);
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
            addInfuraProjectId: (_learnCard, _infuraProjectId) => {
                infuraProjectId = _infuraProjectId;
                provider = getProvider();
            },
            addAlchemyApiKey: (_learnCard, _alchemyApiKey) => {
                alchemyApiKey = _alchemyApiKey;
                provider = getProvider();
            },
            addEtherscanApiKey: (_wallet, _etherscanApiKey) => {
                etherscanApiKey = _etherscanApiKey;
                provider = getProvider();
            },
        },
    };
};
