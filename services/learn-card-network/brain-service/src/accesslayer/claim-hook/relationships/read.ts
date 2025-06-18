import { ClaimHook, type BoostInstance } from '@models';
import type { ClaimHook as ClaimHookType } from 'types/claim-hook';

export const getClaimBoostForClaimHook = async (
    claimHook: ClaimHookType
): Promise<BoostInstance | undefined> => {
    const result = await ClaimHook.findRelationships({
        alias: 'hookFor',
        limit: 1,
        where: { source: { id: claimHook.id } },
    });

    return result[0]?.target;
};
