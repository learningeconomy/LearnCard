import { providers } from 'ethers';
import { Plugin } from 'types/wallet';

export type EthereumPluginMethods = {
    getEthereumAddress: () => string; // TODO is there a way for this to just be a property?
    getBalance: (symbolOrAddress?: string) => Promise<string>;
    getBalanceForAddress: (walletAddress: string, symbolOrAddress?: string) => Promise<string>;
    transferTokens: (
        tokenSymbolOrAddress: string,
        amount: number,
        toAddress: string
    ) => Promise<string>;
    getCurrentNetwork: () => providers.Networkish;
    changeNetwork: (network: providers.Networkish) => void;
    addInfuraProjectId: (infuraProjectIdToAdd: string) => void;
};

export type EthereumConfig = {
    infuraProjectId?: string;
    network?: providers.Networkish;
};

export type Token = {
    chainId: number;
    address: string;
    name: string;
    symbol: string;
    decimals: number;
    logoURI: string;
    extensions: any;
};

export type TokenList = Token[];

export type EthereumPlugin = Plugin<'Ethereum', EthereumPluginMethods>;
