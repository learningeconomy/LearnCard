import { QueryBuilder, BindParam } from 'neogma';
import { Profile, EmailAddress } from '@models';

export const createProfileEmailRelationship = async (
    profileDid: string,
    emailAddressId: string
): Promise<boolean> => {
    const result = await new QueryBuilder(new BindParam({ profileDid, emailAddressId }))
        .match({ model: Profile, identifier: 'profile', where: { did: '$profileDid' } })
        .match({ model: EmailAddress, identifier: 'emailAddress', where: { id: '$emailAddressId' } })
        .merge('(profile)-[:HAS_EMAIL]->(emailAddress)')
        .return('profile, emailAddress')
        .run();

    return result.records.length > 0;
};