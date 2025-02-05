import { v4 as uuid } from 'uuid';

import { ClaimHook as ClaimHookType } from 'types/claim-hook';

import { ClaimHook } from '@models';

export const createClaimHook = async (
    claimHook: Omit<ClaimHookType, 'id' | 'createdAt' | 'updatedAt'>
): Promise<ClaimHookType> => {
    const id = uuid();

    return (
        await ClaimHook.createOne({
            id,
            ...claimHook,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        })
    ).dataValues;
};
