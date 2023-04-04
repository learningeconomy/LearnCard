import { UnsignedVC, VC } from '@learncard/types';
import { v4 as uuid } from 'uuid';

import { Boost, BoostInstance, ProfileInstance } from '@models';
import { BoostStatus, BoostType } from 'types/boost';
import { convertCredentialToBoostTemplateJSON } from '@helpers/boost.helpers';

export const createBoost = async (
    credential: UnsignedVC | VC,
    creator: ProfileInstance,
    metadata: Omit<BoostType, 'id' | 'boost'> = {}
): Promise<BoostInstance> => {
    const id = uuid();

    const { status = BoostStatus.enum.LIVE } = metadata;

    return Boost.createOne({
        id,
        boost: convertCredentialToBoostTemplateJSON(credential),
        status,
        ...metadata,
        createdBy: {
            where: {
                params: { profileId: creator.profileId },
                relationshipProperties: { date: new Date().toISOString() },
            },
        },
    });
};
