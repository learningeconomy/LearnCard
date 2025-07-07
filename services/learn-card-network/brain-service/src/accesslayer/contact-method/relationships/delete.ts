import { QueryBuilder, BindParam } from 'neogma';
import { Profile, ContactMethod } from '@models';

export const deleteProfileContactMethodRelationship = async (
    profileDid: string,
    contactMethodId: string
): Promise<boolean> => {
    const result = await new QueryBuilder(new BindParam({ profileDid, contactMethodId }))
        .match({ model: Profile, identifier: 'profile' })
        .where('profile.profileId = $profileDid')
        .match({ model: ContactMethod, identifier: 'contactMethod' })
        .where('contactMethod.id = $contactMethodId')
        .match('(profile)-[rel:HAS_CONTACT_METHOD]->(contactMethod)')
        .delete('rel')
        .run();

    return result.summary.counters.updates().relationshipsDeleted > 0;
};

export const deleteAllProfileContactMethodRelationshipsExceptForProfileId = async (
    profileId: string,
    contactMethodId: string
): Promise<boolean> => {
    const result = await new QueryBuilder(new BindParam({ profileId, contactMethodId }))
        .match({ model: Profile, identifier: 'profile' })
        .where('profile.profileId <> $profileId')
        .match({ model: ContactMethod, identifier: 'contactMethod' })
        .where('contactMethod.id = $contactMethodId')
        .match('(profile)-[rel:HAS_CONTACT_METHOD]->(contactMethod)')
        .delete('rel')
        .run();

    return result.summary.counters.updates().relationshipsDeleted > 0;
};