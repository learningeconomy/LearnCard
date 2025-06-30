import { QueryBuilder, BindParam } from 'neogma';
import { Profile, ContactMethod } from '@models';

export const deleteProfileContactMethodRelationship = async (
    profileDid: string,
    contactMethodId: string
): Promise<boolean> => {
    const result = await new QueryBuilder(new BindParam({ profileDid, contactMethodId }))
        .match({ model: Profile, identifier: 'profile', where: { did: '$profileDid' } })
        .match({ model: ContactMethod, identifier: 'contactMethod', where: { id: '$contactMethodId' } })
        .match('(profile)-[rel:HAS_CONTACT_METHOD]->(contactMethod)')
        .delete('rel')
        .run();

    return result.summary.counters.updates().relationshipsDeleted > 0;
};