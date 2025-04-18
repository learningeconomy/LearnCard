import { ClaimHook } from '@models';
import { ClaimHook as ClaimHookType } from 'types/claim-hook';

export const deleteClaimHook = async (claimHook: ClaimHookType): Promise<void> => {
    await ClaimHook.delete({ where: { id: claimHook.id }, detach: true });
};
