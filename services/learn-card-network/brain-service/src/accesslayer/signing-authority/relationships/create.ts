import { Profile, type SigningAuthorityInstance } from '@models';
import type { ProfileType } from 'types/profile';

export const createUseSigningAuthorityRelationship = async (
    user: ProfileType,
    signingAuthority: SigningAuthorityInstance,
    name: string,
    did: string
): Promise<void> => {
    await Profile.relateTo({
        alias: 'usesSigningAuthority',
        where: {
            source: { profileId: user.profileId },
            target: { endpoint: signingAuthority.endpoint },
        },
        properties: { name, did },
    });
};
