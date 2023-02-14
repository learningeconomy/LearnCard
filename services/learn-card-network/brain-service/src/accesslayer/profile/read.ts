import { QueryBuilder, BindParam, QueryRunner } from 'neogma';
import { Profile, ProfileInstance } from '@models';
import { ProfileType } from 'types/profile';

export const getProfileByHandle = async (handle: string): Promise<ProfileInstance | null> => {
    return Profile.findOne({ where: { handle: handle.toLowerCase() } });
};

export const getProfilesByHandle = async (handle: string): Promise<ProfileInstance[]> => {
    return Profile.findMany({ where: { handle: handle.toLowerCase() } });
};

export const getProfileByDid = async (did: string): Promise<ProfileInstance | null> => {
    return Profile.findOne({ where: { did } });
};

export const getProfilesByDid = async (did: string): Promise<ProfileInstance[]> => {
    return Profile.findMany({ where: { did } });
};

export const getProfileByEmail = async (email: string): Promise<ProfileInstance | null> => {
    return Profile.findOne({ where: { email } });
};

export const getProfilesByEmail = async (email: string): Promise<ProfileInstance[]> => {
    return Profile.findMany({ where: { email } });
};

export const checkIfProfileExists = async ({
    did,
    handle,
    email,
}: Partial<ProfileType>): Promise<boolean> => {
    if (!did && !handle && !email) return false;

    if (did && (await getProfileByDid(did))) return true;
    if (handle && (await getProfileByHandle(handle))) return true;
    if (email && (await getProfileByEmail(email))) return true;

    return false;
};

export const searchProfiles = async (
    searchInput: string,
    {
        limit = 25,
        blacklist = [],
    }: {
        limit?: number;
        blacklist?: string[];
    } = {}
): Promise<ProfileType[]> => {
    const result = await new QueryBuilder(
        new BindParam({
            input: searchInput.toLowerCase(),
            inputRegex: `(?i).*${searchInput}.*`,
            blacklist,
        })
    )
        .match({ identifier: 'profile', model: Profile })
        .where(
            `(profile.handle CONTAINS $input OR profile.displayName =~ $inputRegex)${blacklist.length > 0 ? ' AND NOT profile.handle IN $blacklist' : ''
            }`
        )
        .return('profile')
        .limit(limit)
        .run();

    return QueryRunner.getResultProperties<ProfileType>(result, 'profile');
};
