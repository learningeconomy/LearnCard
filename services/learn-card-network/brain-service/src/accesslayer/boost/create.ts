import { QueryBuilder, BindParam } from 'neogma';
import type { UnsignedVC, VC } from '@learncard/types';
import { v4 as uuid } from 'uuid';

import { Boost, type BoostInstance } from '@models';
import { BoostStatus, type BoostType } from 'types/boost';
import { convertCredentialToBoostTemplateJSON } from '@helpers/boost.helpers';
import { getDidWeb } from '@helpers/did.helpers';
import { getCreatorRole } from '@accesslayer/role/read';
import { flattenObject } from '@helpers/objects.helpers';
import { getBoostById } from './read';
import type { ProfileType } from 'types/profile';

export const createBoost = async (
    credential: UnsignedVC | VC,
    creator: ProfileType,
    metadata: Omit<BoostType, 'id' | 'boost'>,
    domain: string
): Promise<BoostInstance> => {
    const id = uuid();

    const role = await getCreatorRole(); // Ensure creator role exists

    const { status = BoostStatus.enum.LIVE } = metadata;

    const query = new QueryBuilder(
        new BindParam({
            params: {
                id,
                boost: convertCredentialToBoostTemplateJSON(
                    credential,
                    getDidWeb(domain, creator.profileId)
                ),
                status,
                ...((flattenObject as any)(metadata) as any),
            },
        })
    )
        .create({ model: Boost, identifier: 'boost' })
        .set('boost += $params');

    await query.run();

    const boost = (await getBoostById(id))!;

    await Promise.all([
        boost.relateTo({
            alias: 'createdBy',
            properties: { date: new Date().toISOString() },
            where: { profileId: creator.profileId },
        }),
        boost.relateTo({
            alias: 'hasRole',
            properties: { roleId: role.id },
            where: { profileId: creator.profileId },
        }),
    ]);

    return boost;
};
