import { QueryBuilder, BindParam, QueryRunner } from 'neogma';
import { Profile } from '@models';
import { ProfileType, FlatProfileType } from 'types/profile';
import { transformProfileId } from '@helpers/profile.helpers';
import { inflateObject } from '@helpers/objects.helpers';

export const getProfileByProfileId = async (profileId: string): Promise<ProfileType | null> => {
    const result = await new QueryBuilder()
        .match({
            model: Profile,
            identifier: 'profile',
            where: { profileId: transformProfileId(profileId) },
        })
        .return('profile')
        .limit(1)
        .run();

    const profile = result.records[0]?.get('profile').properties;

    if (!profile) return null;

    return inflateObject<ProfileType>(profile as any);
};

export const getProfilesByProfileIds = async (profileIds: string[]): Promise<ProfileType[]> => {
    const result = await new QueryBuilder(
        new BindParam({ profileIds: profileIds.map(transformProfileId) })
    )
        .match({ identifier: 'profile', model: Profile })
        .where('profile.profileId IN $profileIds')
        .return('profile')
        .run();

    return (
        QueryRunner.getResultProperties<FlatProfileType[]>(result, 'profile')?.map(profile =>
            inflateObject(profile as any)
        ) ?? []
    );
};

export const getProfileByDid = async (did: string): Promise<ProfileType | null> => {
    const isNetworkProfile = did.startsWith('did:web');

    const result = await new QueryBuilder()
        .match({
            model: Profile,
            identifier: 'profile',
            where: isNetworkProfile ? { profileId: did.split(':').at(-1)! } : { did },
        })
        .return('profile')
        .limit(1)
        .run();

    const profile = result.records[0]?.get('profile').properties;

    if (!profile) return null;

    return inflateObject<ProfileType>(profile as any);
};

export const getProfileByEmail = async (email: string): Promise<ProfileType | null> => {
    const result = await new QueryBuilder()
        .match({ model: Profile, identifier: 'profile', where: { email } })
        .return('profile')
        .limit(1)
        .run();

    const profile = result.records[0]?.get('profile').properties;

    if (!profile) return null;

    return inflateObject<ProfileType>(profile as any);
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
            `
(profile.profileId CONTAINS $input OR profile.displayName =~ $inputRegex) AND 
(profile.isPrivate IS NULL OR profile.isPrivate = false)
${includeServiceProfiles
                ? ''
                : ' AND (profile.isServiceProfile IS NULL OR profile.isServiceProfile = false)'
            }
${blacklist.length > 0 ? ' AND NOT profile.profileId IN $blacklist' : ''}
`
        )
        .return('profile')
        .orderBy('profile.displayName')
        .limit(limit)
        .run();

    return (
        QueryRunner.getResultProperties<FlatProfileType[]>(result, 'profile')?.map(profile =>
            inflateObject(profile as any)
        ) ?? []
    );
};
