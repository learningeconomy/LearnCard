import { QueryBuilder, BindParam } from 'neogma';
import { Profile, EmailAddress } from '@models';

export const deleteProfileEmailRelationship = async (
    profileDid: string,
    emailAddressId: string
): Promise<boolean> => {
    const result = await new QueryBuilder(new BindParam({ profileDid, emailAddressId }))
        .match({ model: Profile, identifier: 'profile', where: { did: '$profileDid' } })
        .match({ model: EmailAddress, identifier: 'emailAddress', where: { id: '$emailAddressId' } })
        .match('(profile)-[rel:HAS_EMAIL]->(emailAddress)')
        .delete('rel')
        .run();

    return result.summary.counters.updates().relationshipsDeleted > 0;
};