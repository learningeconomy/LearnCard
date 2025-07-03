import { SigningAuthorityInstance, Profile } from '@models';
import { ProfileType } from 'types/profile';

export const createUseSigningAuthorityRelationship = async (
    user: ProfileType,
    signingAuthority: SigningAuthorityInstance,
    name: string,
    did: string,
    isPrimary: boolean = false
): Promise<void> => {
    await Profile.relateTo({
        alias: 'usesSigningAuthority',
        where: {
            source: { profileId: user.profileId },
            target: { endpoint: signingAuthority.endpoint },
        },
        properties: { name, did, isPrimary },
    });
};
