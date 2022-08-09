import { providers } from 'ethers';

export type EthereumPluginMethods = {
    getEthereumAddress: () => string; // TODO is there a way for this to just be a property?
    checkMyEth: () => Promise<string>;
    checkMyDai: () => Promise<string>;
    checkMyUsdc: () => Promise<string>;
    checkEthForAddress: (address: string) => Promise<string>;
    transferEth: (amountInEther: number, toAddress: string) => Promise<string>;
    getCurrentEthereumNetwork: () => providers.Networkish;
    changeEthereumNetwork: (network: providers.Networkish) => void;
    addInfuraProjectId: (infuraProjectIdToAdd: string) => void;
    test: () => void;
};

export type EthereumConfig = {
    infuraProjectId?: string;
    network?: providers.Networkish;
};
