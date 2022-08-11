import { providers } from 'ethers';

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
    test: () => void;
};

export type EthereumConfig = {
    infuraProjectId?: string;
    network?: providers.Networkish;
};
