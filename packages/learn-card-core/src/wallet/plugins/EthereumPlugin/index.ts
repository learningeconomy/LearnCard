import { Plugin, Wallet } from 'types/wallet';
import { ethers } from 'ethers';

import { EthereumConfig, EthereumPluginMethods } from './types';
import { isAddress } from './helpers';

import { DidMethod } from '@wallet/plugins/didkit/types';
import { Algorithm } from '@wallet/plugins/didkey/types'; // Have to include this in order for getSubjectKeypair to not throw a type error

export const getEthereumPlugin = (
    initWallet: Wallet<
        string,
        {
            getSubjectDid: (type: DidMethod) => string;
            getSubjectKeypair: (type?: Algorithm) => {
                kty: string;
                crv: string;
                x: string;
                y?: string;
                d: string;
            };
        }
    >,
    config: EthereumConfig
): Plugin<'Ethereum', EthereumPluginMethods> => {
    let { infuraProjectId, network = 'mainnet' } = config;

    // Ethers wallet
    const secpKeypair = initWallet.pluginMethods.getSubjectKeypair('secp256k1');
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

    let defaultTokenList: {
        chainId: number;
        address: string;
        name: string;
        symbol: string;
        decimals: number;
        logoURI: string;
        extensions: any;
    }[];

    // Methods
    const getBalance = async (walletAddress = publicKey, tokenSymbolOrAddress = 'ETH') => {
        if (!tokenSymbolOrAddress || tokenSymbolOrAddress === 'ETH') {
            // check ETH by default
            const balance = await provider.getBalance(walletAddress);
            const formattedBalance = ethers.utils.formatEther(balance);

            return formattedBalance;
        }

        let tokenAddress;
        if (isAddress(tokenSymbolOrAddress)) {
            tokenAddress = tokenSymbolOrAddress;
        } else {
            // Check known addresses for symbol
            tokenAddress = await getTokenAddressFromSymbol(tokenSymbolOrAddress);

            if (!tokenAddress) {
                throw new Error(
                    `Unable to determine token address for \"${tokenSymbolOrAddress}\"`
                );
            }
        }

        const balance = await checkErc20TokenBalance(tokenAddress, walletAddress);

        return balance;
    };

    const checkErc20TokenBalance = async (
        tokenContractAddress: string,
        walletPublicAddress = publicKey
    ) => {
        const erc20Abi = require('./erc20.abi.json');
        const contract = new ethers.Contract(tokenContractAddress, erc20Abi, provider);

        const balance = await contract.balanceOf(walletPublicAddress);
        const formattedBalance = ethers.utils.formatUnits(balance);

        return formattedBalance;
    };

    const getTokenAddressFromSymbol = async (symbol: string) => {
        if (!defaultTokenList) {
            defaultTokenList =
                require('@uniswap/default-token-list/build/uniswap-default.tokenlist.json').tokens;
        }

        const { chainId: currentChainId } = await provider.getNetwork();

        const token = defaultTokenList.find(
            token => token.chainId === currentChainId && token.symbol === symbol
        );

        if (token) {
            return token.address;
        } else {
            return undefined;
        }
    };

    return {
        pluginMethods: {
            getEthereumAddress: () => publicKey,

            getBalance: async (_wallet, symbolOrAddress = 'ETH') =>
                getBalance(publicKey, symbolOrAddress),
            getBalanceForAddress: async (_wallet, walletAddress, symbolOrAddress) =>
                getBalance(walletAddress, symbolOrAddress),

            checkMyEth: async () => {
                const balance = await provider.getBalance(publicKey);
                const formattedBalance = ethers.utils.formatEther(balance);

                return formattedBalance;
            },
            checkMyDai: async () => {
                const daiAddress = '0x6B175474E89094C44Da98b954EedeAC495271d0F';
                const daiBalance = await checkErc20TokenBalance(daiAddress);
                return daiBalance;
            },
            checkMyUsdc: async () => {
                let usdcAddress;
                switch (network) {
                    case 'mainnet':
                        usdcAddress = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
                        break;
                    case 'goerli':
                        usdcAddress = '0x07865c6e87b9f70255377e024ace6630c1eaa37f';
                        break;
                    default:
                        throw new Error(`USDC Contract address unkown for network: ${network}`);
                }

                const usdcBalance = await checkErc20TokenBalance(usdcAddress);
                return usdcBalance;
            },
            checkEthForAddress: async (_wallet, address) => {
                if (!address) {
                    throw new Error('No address provided');
                }

                const balance = await provider.getBalance(address);
                const formattedBalance = ethers.utils.formatEther(balance);

                return formattedBalance;
            },
            transferEth: async (_wallet, amountInEther, toAddress) => {
                const transaction = {
                    to: toAddress,

                    // Convert ETH to wei
                    value: ethers.utils.parseEther(amountInEther.toString()),
                };

                return await ethersWallet
                    .sendTransaction(transaction)
                    .then(transactionObject => transactionObject.hash);
            },

            /* Configuration-type methods */
            getCurrentEthereumNetwork: () => {
                return network;
            },
            changeEthereumNetwork: (_wallet, _network: ethers.providers.Networkish) => {
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
            addInfuraProjectId: (_wallet, infuraProjectIdToAdd) => {
                infuraProjectId = infuraProjectIdToAdd;
                provider = getProvider();
            },
            test: async () => {
                console.log(test);

                /* const eipDid = initWallet.pluginMethods.getSubjectDid('pkh:eip155');
                const secpKeypair = initWallet.pluginMethods.getSubjectKeypair('secp256k1');

                // attempt to construct public key from secp keypair
                const test = Buffer.from(`${secpKeypair.x}${secpKeypair.y}`, 'base64').toString(
                    'hex'
                );

                console.log('🎆🎆🎆🎆🎆🎆🎆🎆🎆🎆🎆🎆🎆🎆🎆🎆🎆🎆🎆');
                console.log('eipDid:', eipDid);
                console.log('test:', test); */

                /* console.log('🎆🎆🎆🎆🎆🎆🎆🎆🎆🎆🎆🎆🎆🎆🎆🎆🎆🎆🎆 test');

                console.log('🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥');
                const ethDid = initWallet.pluginMethods.getSubjectDid('ethr');
                const pkhEthDid = initWallet.pluginMethods.getSubjectDid('pkh:eth');
                const eipDid = initWallet.pluginMethods.getSubjectDid('pkh:eip155');

                const secpKeypair = initWallet.pluginMethods.getSubjectKeypair('secp256k1');

                console.log('ethDid:', ethDid);
                console.log('pkhEthDid:', pkhEthDid);
                console.log('eipDid:', eipDid);

                console.log('secpKeypair:', secpKeypair);

                const maybePrivateKey = Buffer.from(secpKeypair.d, 'base64').toString('hex');
                console.log('maybePrivateKey:', maybePrivateKey);

                const wallet = new ethers.Wallet(maybePrivateKey, provider);

                console.log('wallet.address :', wallet.address); */
                /* console.log('🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧');
                const gasPrice = await provider.getGasPrice();

                console.log('gasPrice:', gasPrice); */
                // const test = initWallet.pluginMethods.getSubjectDid('ethr');
                // const test2 = initWallet.pluginMethods.getSubjectDid('pkh:eth');
                // console.log('test:', test);
            },

            // ...initWallet.pluginMethods,
        },
    };
};
