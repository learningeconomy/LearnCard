import { QueryBuilder, BindParam, QueryRunner } from 'neogma';
import { Profile } from '@models';
import { ProfileType } from 'types/profile';

export const checkIfProfileExists = async ({
    did,
    handle,
    email,
}: {
    did?: string;
    handle?: string;
    email?: string;
}): Promise<boolean> => {
    if (!did && !handle && !email) return false;

    if (did && (await Profile.findOne({ where: { did } }))) return true;
    if (handle && (await Profile.findOne({ where: { handle } }))) return true;
    if (email && (await Profile.findOne({ where: { email } }))) return true;

    return false;
};

export const searchProfiles = async (
    searchInput: string,
    limit: number
): Promise<ProfileType[]> => {
    const result = await new QueryBuilder(new BindParam({ input: `(?i).*${searchInput}.*` }))
        .match({ identifier: 'profile', model: Profile })
        .where('profile.handle =~ $input OR profile.email =~ $input')
        .return('profile')
        .limit(limit)
        .run();

    return QueryRunner.getResultProperties<ProfileType>(result, 'profile');
};
