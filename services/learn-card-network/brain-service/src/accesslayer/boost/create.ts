import { UnsignedVC, VC } from '@learncard/types';
import { v4 as uuid } from 'uuid';

import { Boost, BoostInstance, ProfileInstance } from '@models';

export const createBoost = async (
    credential: UnsignedVC | VC,
    creator: ProfileInstance
): Promise<BoostInstance> => {
    const id = uuid();

    const template = { ...credential };

    delete template.proof;
    template.issuer = 'did:example:123';

    return Boost.createOne({
        id,
        boost: JSON.stringify(template),
        createdBy: {
            where: {
                params: { profileId: creator.profileId },
                relationshipProperties: { date: new Date().toISOString() },
            },
        },
    });
};
