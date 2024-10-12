import { UnsignedVC, VC } from '@learncard/types';
import { v4 as uuid } from 'uuid';

import { Boost, BoostInstance, ProfileInstance } from '@models';
import { BoostStatus, BoostType } from 'types/boost';
import { convertCredentialToBoostTemplateJSON } from '@helpers/boost.helpers';
import { getDidWeb } from '@helpers/did.helpers';

export const createBoost = async (
    credential: UnsignedVC | VC,
    creator: ProfileInstance,
    metadata: Omit<BoostType, 'id' | 'boost'> = {},
    domain: string
): Promise<BoostInstance> => {
    const id = uuid();

    const { status = BoostStatus.enum.LIVE } = metadata;

    return Boost.createOne({
        id,
        boost: convertCredentialToBoostTemplateJSON(
            credential,
            getDidWeb(domain, creator.profileId)
        ),
        status,
        ...metadata,
        createdBy: {
            where: {
                params: { profileId: creator.profileId },
                relationshipProperties: { date: new Date().toISOString() },
            },
        },
        hasPermissions: {
            where: {
                params: { profileId: creator.profileId },
                relationshipProperties: {
                    role: 'creator',
                    canEdit: true,
                    canIssue: true,
                    canRevoke: true,
                    canManagePermissions: true,
                    canIssueChildren: '*',
                    canCreateChildren: '*',
                    canEditChildren: '*',
                    canRevokeChildren: '*',
                    canManageChildrenPermissions: '*',
                    canViewAnalytics: true,
                },
            },
        },
    });
};
