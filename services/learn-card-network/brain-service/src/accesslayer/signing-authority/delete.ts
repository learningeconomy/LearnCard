import type { SigningAuthorityInstance } from '@models';

export const deleteSigningAuthority = async (
    signingAuthority: SigningAuthorityInstance
): Promise<void> => {
    await signingAuthority.delete({ detach: true });
};
