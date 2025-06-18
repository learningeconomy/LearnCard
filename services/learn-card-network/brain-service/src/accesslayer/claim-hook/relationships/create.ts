import type { ClaimHook as ClaimHookType } from 'types/claim-hook';

import type { BoostType } from 'types/boost';
import type { Role as RoleType } from 'types/role';
import { ClaimHook } from '@models';

export const addClaimHookForBoost = async (
    boost: BoostType,
    claimHook: ClaimHookType
): Promise<void> => {
    await ClaimHook.relateTo({
        alias: 'hookFor',
        where: { source: { id: claimHook.id }, target: { id: boost.id } },
    });
};

export const addClaimHookTarget = async (
    boost: BoostType,
    claimHook: ClaimHookType
): Promise<void> => {
    await ClaimHook.relateTo({
        alias: 'target',
        where: { source: { id: claimHook.id }, target: { id: boost.id } },
    });
};

export const addRoleToGrantForClaimHook = async (
    claimHook: ClaimHookType,
    role: RoleType
): Promise<void> => {
    await ClaimHook.relateTo({
        alias: 'roleToGrant',
        where: { source: { id: claimHook.id }, target: { id: role.id } },
    });
};
