import type { MetaMaskInpageProvider } from '@metamask/providers';

import { LearnCardRPCAPI, type LearnCardRPCAPITypes } from './types/rpc';

declare global {
    const ethereum: MetaMaskInpageProvider;
}

export * from './types/rpc';

/**
 * Sends a request to the LearnCard MetaMask Snap with automatic validation, serialization, and
 * deserialization
 */
export const sendRequest = async <
    Method extends LearnCardRPCAPITypes[keyof Omit<
        LearnCardRPCAPITypes,
        'validator' | 'serializer' | 'deserializer'
    >]['method']
>(
    params: {
        method: Method;
    } & LearnCardRPCAPITypes[Method]['arguments']['validator'],
    snapId = 'npm:@learncard/meta-mask-snap'
): Promise<LearnCardRPCAPITypes[Method]['returnValue']['validator'] | undefined> => {
    const serializedParams = await LearnCardRPCAPI[params.method].arguments.serializer.spa(params);

    if (!serializedParams.success) {
        console.error('Serialization error!', serializedParams.error);

        return undefined;
    }

    const result = await LearnCardRPCAPI[params.method].returnValue.deserializer.spa(
        await ethereum.request({
            method: 'wallet_invokeSnap',
            params: [snapId, serializedParams.data],
        })
    );

    if (!result.success) {
        console.error('Deserialization error!', result.error);

        return undefined;
    }

    return result.data;
};
