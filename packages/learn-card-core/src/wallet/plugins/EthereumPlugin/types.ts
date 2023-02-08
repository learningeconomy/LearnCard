import { ethers, providers } from 'ethers';
import { Plugin } from 'types/wallet';

/** @group Ethereum Plugin */
export type EthereumPluginMethods = {
    getEthereumAddress: () => string; // TODO is there a way for this to just be a property?
    getBalance: (symbolOrAddress?: string) => Promise<string>;
    getBalanceForAddress: (walletAddress: string, symbolOrAddress?: string) => Promise<string>;
    transferTokens: (
        tokenSymbolOrAddress: string,
        amount: number,
        toAddress: string
    ) => Promise<string>;
    getTransactionHistory: () => Promise<providers.TransactionResponse[]>;
    getTransactionHistoryForToken: (tokenSymbolOrAddress: string) => Promise<ethers.Event[]>;
    getSimpleTransactionHistoryForTokens: (
        tokenSymbolOrAddresses: string[]
    ) => Promise<SimpleHistory[]>;
    getGasPrice: () => Promise<string>;
    getCurrentNetwork: () => providers.Networkish;
    changeNetwork: (network: providers.Networkish) => void;
    addInfuraProjectId: (_infuraProjectId: string) => void;
    addAlchemyApiKey: (_alchemyApiKey: string) => void;
    addEtherscanApiKey: (_etherscanApiKey: string) => void;
};

/** @group Ethereum Plugin */
export type EthereumConfig = {
    infuraProjectId?: string;
    alchemyApiKey?: string;
    etherscanApiKey?: string;
    network?: providers.Networkish;
};

/** @group Ethereum Plugin */
export type Token = {
    chainId: number;
    address: string;
    name: string;
    symbol: string;
    decimals: number;
    logoURI: string;
    extensions?: any;
};

/** @group Ethereum Plugin */
export type SimpleHistory = {
    token: Token;
    from: string;
    to: string;
    amount: string;
    timestamp: number;
};

/** @group Ethereum Plugin */
export type TokenList = Token[];

/** @group Ethereum Plugin */
export type EthereumPlugin = Plugin<'Ethereum', any, EthereumPluginMethods, 'id'>;
