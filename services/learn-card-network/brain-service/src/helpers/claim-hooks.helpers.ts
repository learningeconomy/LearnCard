import { QueryBuilder } from 'neogma';

import { CredentialInstance, Credential, Boost, Profile, ClaimHook, Role } from '@models';
import { ProfileType } from 'types/profile';
import { clearDidWebCacheForChildProfileManagers } from '@accesslayer/boost/relationships/update';
import { getAdminRole } from '@accesslayer/role/read';

const processPermissionsClaimHooks = async (
    profile: ProfileType,
    credential: CredentialInstance
): Promise<void> => {
    await new QueryBuilder()
        .match({
            related: [
                { identifier: 'credential', model: Credential, where: { id: credential.id } },
                {
                    ...Credential.getRelationshipByAlias('instanceOf'),
                    identifier: 'instanceOf',
                    direction: 'out',
                },
                { identifier: 'boost', model: Boost },
                { ...ClaimHook.getRelationshipByAlias('hookFor'), direction: 'in' },
                { identifier: 'claimHook', model: ClaimHook, where: { type: 'GRANT_PERMISSIONS' } },
                ClaimHook.getRelationshipByAlias('target'),
                { identifier: 'targetBoost', model: Boost },
            ],
        })
        .with('boost, claimHook, targetBoost')
        .match({ model: Profile, where: { profileId: profile.profileId }, identifier: 'profile' })
        .with('claimHook, targetBoost, profile')
        .match({
            related: [
                { identifier: 'claimHook' },
                ClaimHook.getRelationshipByAlias('roleToGrant'),
                { identifier: 'role', model: Role },
            ],
        })
        .create({
            related: [
                { identifier: 'profile' },
                `-[:${Boost.getRelationshipByAlias('hasRole').name} { roleId: role.id }]->`,
                { identifier: 'targetBoost' },
            ],
        })
        .run();
};

const processAdminClaimHooks = async (
    profile: ProfileType,
    credential: CredentialInstance
): Promise<void> => {
    const adminRole = await getAdminRole();
    await new QueryBuilder()

        .match({
            related: [
                { identifier: 'credential', model: Credential, where: { id: credential.id } },
                {
                    ...Credential.getRelationshipByAlias('instanceOf'),
                    identifier: 'instanceOf',
                    direction: 'out',
                },
                { identifier: 'boost', model: Boost },
                { ...ClaimHook.getRelationshipByAlias('hookFor'), direction: 'in' },
                { identifier: 'claimHook', model: ClaimHook, where: { type: 'ADD_ADMIN' } },
                ClaimHook.getRelationshipByAlias('target'),
                { identifier: 'targetBoost', model: Boost },
            ],
        })
        .with('boost, claimHook, targetBoost')
        .match({ model: Profile, where: { profileId: profile.profileId }, identifier: 'profile' })
        .with('claimHook, targetBoost, profile')
        .create({
            related: [
                { identifier: 'profile' },
                {
                    ...Boost.getRelationshipByAlias('hasRole'),
                    properties: { roleId: adminRole.id },
                    direction: 'out',
                },
                { identifier: 'targetBoost' },
            ],
        })
        .run();
};

export const processClaimHooks = async (
    profile: ProfileType,
    credential: CredentialInstance
): Promise<void> => {
    await Promise.all([
        processPermissionsClaimHooks(profile, credential),
        processAdminClaimHooks(profile, credential),
    ]);

    try {
        const vc = JSON.parse(credential.credential);

        if (vc.boostId) await clearDidWebCacheForChildProfileManagers(vc.boostId);
    } catch (error) {
        console.error('Invalid credential JSON?', error);
    }
};
