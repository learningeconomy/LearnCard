import { providers } from 'ethers';

export type EthereumPluginMethods = {
    checkMyEth: () => Promise<string>;
    checkMyDai: () => Promise<string>;
    checkMyUsdc: () => Promise<string>;
};

export type EthereumConfig = {
    address: string;
    infuraProjectId?: string;
    network?: providers.Networkish;
};
