import { getAdminRole, getEmptyRole } from '@accesslayer/role/read';
import { CredentialInstance, ProfileInstance, BoostInstance } from '@models';

export const createBoostInstanceOfRelationship = async (
    credential: CredentialInstance,
    boost: BoostInstance
): Promise<void> => {
    await credential.relateTo({ alias: 'instanceOf', where: { id: boost.id } });
};

export const createReceivedCredentialRelationship = async (
    to: ProfileInstance,
    from: ProfileInstance,
    credential: CredentialInstance
): Promise<void> => {
    await credential.relateTo({
        alias: 'credentialReceived',
        where: { profileId: to.profileId },
        properties: { from: from.profileId, date: new Date().toISOString() },
    });
};

export const setProfileAsBoostAdmin = async (
    profile: ProfileInstance,
    boost: BoostInstance
): Promise<void> => {
    const role = await getAdminRole(); // Ensure admin role exists
    await boost.relateTo({
        alias: 'hasRole',
        where: { profileId: profile.profileId },
        properties: { roleId: role.id },
    });
};

export const giveProfileEmptyPermissions = async (
    profile: ProfileInstance,
    boost: BoostInstance
): Promise<void> => {
    const role = await getEmptyRole(); // Ensure empty role exists
    await boost.relateTo({
        alias: 'hasRole',
        where: { profileId: profile.profileId },
        properties: { roleId: role.id },
    });
};

export const setBoostAsParent = async (
    parentBoost: BoostInstance,
    childBoost: BoostInstance
): Promise<boolean> => {
    return Boolean(await parentBoost.relateTo({ alias: 'parentOf', where: { id: childBoost.id } }));
};
