import { snapId } from '@constants/snapConstants';
import { LearnCardRPCAPI, LearnCardRPCAPITypes } from '@learncard/meta-mask-snap';

export const sendRequest = async <
    Method extends LearnCardRPCAPITypes[keyof LearnCardRPCAPITypes]['method']
>(
    params: { method: Method } & LearnCardRPCAPITypes['validator']
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
