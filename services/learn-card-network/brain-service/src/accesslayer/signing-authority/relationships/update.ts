import { QueryBuilder, BindParam } from 'neogma';
import { ProfileType } from 'types/profile';

export const setPrimarySigningAuthority = async (
    user: ProfileType,
    endpoint: string,
    name: string
): Promise<boolean> => {
    // First, unset all primary contact methods for this profile
    await new QueryBuilder(new BindParam({ profileId: user.profileId }))
        .match(
            '(profile:Profile { profileId: $profileId })-[usesSigningAuthority:USES_SIGNING_AUTHORITY]->(signingAuthority:SigningAuthority)'
        )
        .set('usesSigningAuthority.isPrimary = false')
        .run();

    // Then set the specified contact method as primary
    const result = await new QueryBuilder(new BindParam({ profileId: user.profileId, endpoint, name }))
        .match(
            '(profile:Profile { profileId: $profileId })-[usesSigningAuthority:USES_SIGNING_AUTHORITY { name: $name }]->(signingAuthority:SigningAuthority { endpoint: $endpoint })'
        )
        .set('usesSigningAuthority.isPrimary = true')
        .return('usesSigningAuthority')
        .limit(1)
        .run();

    return result.records.length > 0;
};