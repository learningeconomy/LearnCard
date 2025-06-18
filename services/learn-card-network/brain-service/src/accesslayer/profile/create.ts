import { flattenObject, inflateObject } from '@helpers/objects.helpers';
import { transformProfileId } from '@helpers/profile.helpers';
import type { LCNProfile } from '@learncard/types';

import { Profile } from '@models';
import { BindParam, QueryBuilder } from 'neogma';
import type { ProfileType } from 'types/profile';

export const createProfile = async (input: LCNProfile): Promise<ProfileType> => {
    const result = await new QueryBuilder(
        new BindParam({
            params: flattenObject({ ...input, profileId: transformProfileId(input.profileId) }),
        })
    )
        .create({ model: Profile, identifier: 'profile' })
        .set('profile += $params')
        .return('profile')
        .limit(1)
        .run();

    const profile = result.records[0]?.get('profile').properties!;

    return inflateObject<ProfileType>(profile as any);
};
