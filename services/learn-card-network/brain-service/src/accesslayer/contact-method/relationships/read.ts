import { QueryBuilder, BindParam } from 'neogma';
import { Profile, ContactMethod } from '@models';
import { ContactMethodType } from 'types/contact-method';
import { ProfileType } from 'types/profile';
import { inflateObject } from '@helpers/objects.helpers';

export const getProfileContactMethodRelationships = async (
    profile: ProfileType
): Promise<ContactMethodType[]> => {
    const result = await new QueryBuilder(new BindParam({ profileId: profile.profileId }))
        .match({ model: Profile, identifier: 'profile' })
        .where('profile.profileId = $profileId')
        .match('(profile)-[:HAS_CONTACT_METHOD]->(contactMethod:ContactMethod)')
        .return('contactMethod')
        .run();

    return result.records.map(
        record => record.get('contactMethod').properties as ContactMethodType
    );
};

export const checkProfileContactMethodRelationship = async (
    profileDid: string,
    contactMethodId: string
): Promise<boolean> => {
    const result = await new QueryBuilder(new BindParam({ profileDid, contactMethodId }))
        .match({ model: Profile, identifier: 'profile', where: { did: '$profileDid' } })
        .match({ model: ContactMethod, identifier: 'contactMethod', where: { id: '$contactMethodId' } })
        .match('(profile)-[:HAS_CONTACT_METHOD]->(contactMethod)')
        .return('profile')
        .limit(1)
        .run();

    return result.records.length > 0;
};

export const getProfileByVerifiedContactMethod = async (
    type: 'email' | 'phone',
    value: string
): Promise<ProfileType | null> => {
    const result = await new QueryBuilder(new BindParam({ type, value }))
        .match({ model: ContactMethod, identifier: 'contactMethod' })
        .where('contactMethod.type = $type AND contactMethod.value = $value AND contactMethod.isVerified = true')
        .match('(profile:Profile)-[:HAS_CONTACT_METHOD]->(contactMethod)')
        .return('profile')
        .limit(1)
        .run();

    const profile = result.records[0]?.get('profile').properties;

    if (!profile) return null;

    return inflateObject(profile as any);
};