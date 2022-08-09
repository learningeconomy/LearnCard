import { providers } from 'ethers';

export type EthereumPluginMethods = {
    ethereumAddress: () => string;
    checkMyEth: () => Promise<string>;
    checkMyDai: () => Promise<string>;
    checkMyUsdc: () => Promise<string>;
    test: () => void;
};

export type EthereumConfig = {
    infuraProjectId?: string;
    network?: providers.Networkish;
};
