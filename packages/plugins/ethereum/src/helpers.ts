import { ethers } from 'ethers';

import type { Token, TokenList } from './types';

export const isAddress = (maybeAddress: string) => {
    return maybeAddress.startsWith('0x') && maybeAddress.length === 42;
};

/* From Ethereum-compatible numbers to human-readable numbers  */
export const formatUnits = async (
    units: ethers.BigNumberish,
    symbolOrAddress: string,
    tokenList: TokenList,
    chainId: number
) => {
    const token = await getTokenFromSymbolOrAddress(symbolOrAddress, tokenList, chainId);

    return ethers.utils.formatUnits(units, token?.decimals);
};

/* From human-readable numbers to Ethereum-compatible numbers */
export const parseUnits = async (
    units: string,
    symbolOrAddress: string,
    tokenList: TokenList,
    chainId: number
) => {
    const token = await getTokenFromSymbolOrAddress(symbolOrAddress, tokenList, chainId);

    return ethers.utils.parseUnits(units, token?.decimals);
};

export const getTokenFromSymbolOrAddress = async (
    symbolOrAddress: string,
    tokenList: TokenList,
    chainId: number
): Promise<Token | undefined> => {
    let token;
    if (isAddress(symbolOrAddress)) {
        token = await getTokenFromAddress(symbolOrAddress, tokenList, chainId);
    } else {
        token = await getTokenFromSymbol(symbolOrAddress, tokenList, chainId);
    }
    return token;
};

const getTokenFromAddress = async (address: string, tokenList: TokenList, chainId: number) => {
    const token = tokenList.find(token => token.chainId === chainId && token.address === address);

    return token;
};

const getTokenFromSymbol = async (symbol: string, tokenList: TokenList, chainId: number) => {
    const token = tokenList.find(
        token => token.chainId === chainId && token.symbol.toUpperCase() === symbol.toUpperCase()
    );

    return token;
};

export const getChainIdFromProvider = async (provider: ethers.providers.Provider) => {
    return (await provider.getNetwork()).chainId;
};
