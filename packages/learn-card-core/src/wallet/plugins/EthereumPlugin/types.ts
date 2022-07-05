export type EthereumPluginMethods = {
    checkMyEth: () => Promise<string>;
    checkMyDai: () => Promise<string>;
    checkMyUsdc: () => Promise<string>;
};

export enum EthereumNetworks {
    mainnet = 'mainnet',
    ropstein = 'ropstein',
    kovan = 'kovan',
    rinkeby = 'rinkeby',
    goerli = 'goerli',
    palmMainnet = 'palm-mainnet',
    palmTestnet = 'palm-testnet',
    auroraMainnet = 'aurora-mainnet',
    auroraTestnet = 'aurora-testnet',
    nearMainnet = 'near-mainnet',
    nearTestnet = 'near-testnet',
}

export type EthereumConfig = {
    address: string;
    infuraProjectId?: string;
    network?: EthereumNetworks;
};
