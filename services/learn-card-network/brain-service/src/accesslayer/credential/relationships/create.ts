import { QueryBuilder } from 'neogma';

import { CredentialInstance, Credential, Boost, Role, Profile } from '@models';
import { ProfileType } from 'types/profile';
import { clearDidWebCacheForChildProfileManagers } from '@accesslayer/boost/relationships/update';

export const createSentCredentialRelationship = async (
    from: ProfileType,
    to: ProfileType,
    credential: CredentialInstance
): Promise<void> => {
    await Profile.relateTo({
        alias: 'credentialSent',
        where: { source: { profileId: from.profileId }, target: { id: credential.id } },
        properties: { to: to.profileId, date: new Date().toISOString() },
    });
};

export const createReceivedCredentialRelationship = async (
    to: ProfileType,
    from: ProfileType,
    credential: CredentialInstance
): Promise<void> => {
    await credential.relateTo({
        alias: 'credentialReceived',
        where: { profileId: to.profileId },
        properties: { from: from.profileId, date: new Date().toISOString() },
    });
};

export const setDefaultClaimedRole = async (
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
                Boost.getRelationshipByAlias('claimRole'),
                { identifier: 'role', model: Role },
            ],
        })
        .with('boost, role')
        .match({ model: Profile, where: { profileId: profile.profileId }, identifier: 'profile' })
        .where(
            `NOT EXISTS { MATCH (profile)-[:${Boost.getRelationshipByAlias('hasRole').name
            }]-(boost)}`
        )
        .create({
            related: [
                { identifier: 'profile' },
                `-[:${Boost.getRelationshipByAlias('hasRole').name} { roleId: role.id }]->`,
                { identifier: 'boost' },
            ],
        })
        .run();

    try {
        const vc = JSON.parse(credential.credential);

        if (vc.boostId) await clearDidWebCacheForChildProfileManagers(vc.boostId);
    } catch (error) {
        console.error('Invalid credential JSON?', error);
    }
};
