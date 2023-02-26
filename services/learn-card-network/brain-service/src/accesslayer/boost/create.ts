import { UnsignedVC, VC } from '@learncard/types';
import { v4 as uuid } from 'uuid';

import { Boost, BoostInstance, ProfileInstance } from '@models';
import { BoostType } from 'types/boost';

export const createBoost = async (
    credential: UnsignedVC | VC,
    creator: ProfileInstance,
    metadata: Omit<BoostType, 'id' | 'boost'> = {}
): Promise<BoostInstance> => {
    const id = uuid();

    const template = { ...credential };

    delete template.proof;
    template.issuer = 'did:example:123';

    if (Array.isArray(template.credentialSubject)) {
        template.credentialSubject = template.credentialSubject.map(subject => {
            subject.id = 'did:example:123';

            return subject;
        });
    } else {
        template.credentialSubject.id = 'did:example:123';
    }

    return Boost.createOne({
        id,
        boost: JSON.stringify(template),
        ...metadata,
        createdBy: {
            where: {
                params: { profileId: creator.profileId },
                relationshipProperties: { date: new Date().toISOString() },
            },
        },
    });
};
