import { SigningAuthorityInstance, ProfileInstance } from '@models';

export const createUseSigningAuthorityRelationship = async (
    user: ProfileInstance,
    signingAuthority: SigningAuthorityInstance,
    name: string,
    did: string
): Promise<void> => {
    await user.relateTo({
        alias: 'usesSigningAuthority',
        where: { endpoint: signingAuthority.endpoint },
        properties: { name, did },
    });
};

