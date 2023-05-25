import { QueryBuilder, BindParam, QueryRunner } from 'neogma';
import { Profile, ProfileInstance } from '@models';
import { ProfileType } from 'types/profile';
import { transformProfileId } from '@helpers/profile.helpers';

export const getProfileByProfileId = async (profileId: string): Promise<ProfileInstance | null> => {
    return Profile.findOne({ where: { profileId: transformProfileId(profileId) } });
};

export const getProfilesByProfileId = async (profileId: string): Promise<ProfileInstance[]> => {
    return Profile.findMany({ where: { profileId: transformProfileId(profileId) } });
};

export const getProfilesByProfileIds = async (profileIds: string[]): Promise<ProfileType[]> => {
    const result = await new QueryBuilder(
        new BindParam({ profileIds: profileIds.map(transformProfileId) })
    )
        .match({ identifier: 'profile', model: Profile })
        .where('profile.profileId IN $profileIds')
        .return('profile')
        .run();

    return QueryRunner.getResultProperties<ProfileType>(result, 'profile');
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
    profileId,
    email,
}: Partial<ProfileType>): Promise<boolean> => {
    if (!did && !profileId && !email) return false;

    if (did && (await getProfileByDid(did))) return true;
    if (profileId && (await getProfileByProfileId(profileId))) return true;
    if (email && (await getProfileByEmail(email))) return true;

    return false;
};

export const searchProfiles = async (
    searchInput: string,
    {
        limit = 25,
        blacklist = [],
        includeServiceProfiles = false,
    }: {
        limit?: number;
        blacklist?: string[];
        includeServiceProfiles?: boolean;
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
            `(profile.profileId CONTAINS $input OR profile.displayName =~ $inputRegex)${
                includeServiceProfiles ? 'AND NOT profile.isServiceProfile = true' : ''
            }${blacklist.length > 0 ? ' AND NOT profile.profileId IN $blacklist' : ''}`
        )
        .return('profile')
        .orderBy('profile.displayName')
        .limit(limit)
        .run();

    return QueryRunner.getResultProperties<ProfileType>(result, 'profile');
};
