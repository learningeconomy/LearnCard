import { QueryBuilder, BindParam } from 'neogma';
import { Profile, EmailAddress } from '@models';
import { EmailAddressType } from 'types/email-address';
import { ProfileType } from 'types/profile';
import { inflateObject } from '@helpers/objects.helpers';

export const getProfileEmailRelationships = async (profile: ProfileType): Promise<EmailAddressType[]> => {
    const result = await new QueryBuilder(new BindParam({ profileId: profile.profileId }))
        .match({ model: Profile, identifier: 'profile' })
        .where('profile.profileId = $profileId')
        .match('(profile)-[:HAS_EMAIL]->(emailAddress:EmailAddress)')
        .return('emailAddress')
        .run();

    return result.records.map(record => record.get('emailAddress').properties as EmailAddressType);
};

export const checkProfileEmailRelationship = async (
    profileDid: string,
    emailAddressId: string
): Promise<boolean> => {
    const result = await new QueryBuilder(new BindParam({ profileDid, emailAddressId }))
        .match({ model: Profile, identifier: 'profile', where: { did: '$profileDid' } })
        .match({ model: EmailAddress, identifier: 'emailAddress', where: { id: '$emailAddressId' } })
        .match('(profile)-[:HAS_EMAIL]->(emailAddress)')
        .return('profile')
        .limit(1)
        .run();

    return result.records.length > 0;
};

export const getProfileByVerifiedEmail = async (email: string): Promise<ProfileType | null> => {
    const result = await new QueryBuilder(new BindParam({ email }))
        .match({ model: EmailAddress, identifier: 'emailAddress' })
        .where('emailAddress.email = $email AND emailAddress.isVerified = true')
        .match('(profile:Profile)-[:HAS_EMAIL]->(emailAddress)')
        .return('profile')
        .limit(1)
        .run();

    const profile = result.records[0]?.get('profile').properties;

    if (!profile) return null;

    return inflateObject<ProfileType>(profile as any);
};