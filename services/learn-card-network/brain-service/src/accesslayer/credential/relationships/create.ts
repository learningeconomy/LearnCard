import { QueryBuilder, BindParam } from 'neogma';
import { v4 as uuid } from 'uuid';

import {
    CredentialInstance,
    Credential,
    Boost,
    Role,
    Profile,
    ConsentFlowTerms,
    ConsentFlowTransaction,
} from '@models';
import { flattenObject } from '@helpers/objects.helpers';
import { ProfileType } from 'types/profile';
import { clearDidWebCacheForChildProfileManagers } from '@accesslayer/boost/relationships/update';
import { getBoostIdForCredentialInstance } from '@accesslayer/credential/relationships/read';
import { DbTermsType } from 'types/consentflowcontract';

export const createSentCredentialRelationship = async (
    from: ProfileType,
    to: ProfileType,
    credential: CredentialInstance,
    metadata?: Record<string, unknown>
): Promise<void> => {
    const properties = flattenObject({
        to: to.profileId,
        date: new Date().toISOString(),
        ...(metadata ? { metadata } : {}),
    });

    await new QueryBuilder(new BindParam({ params: properties }))
        .match({
            related: [
                { model: Profile, where: { profileId: from.profileId }, identifier: 'profile' },
            ],
        })
        .match({
            related: [
                { model: Credential, where: { id: credential.id }, identifier: 'credential' },
            ],
        })
        .create(
            `(profile)-[r:${Profile.getRelationshipByAlias('credentialSent').name}]->(credential)`
        )
        .set('r = $params')
        .run();
};

export const createReceivedCredentialRelationship = async (
    to: ProfileType,
    from: ProfileType,
    credential: CredentialInstance,
    metadata?: Record<string, unknown>
): Promise<void> => {
    const properties = flattenObject({
        from: from.profileId,
        date: new Date().toISOString(),
        ...(metadata ? { metadata } : {}),
    });

    await new QueryBuilder(new BindParam({ params: properties }))
        .match({
            related: [
                { model: Credential, where: { id: credential.id }, identifier: 'credential' },
            ],
        })
        .match({
            related: [
                { model: Profile, where: { profileId: to.profileId }, identifier: 'profile' },
            ],
        })
        .create(
            `(credential)-[r:${
                Credential.getRelationshipByAlias('credentialReceived').name
            }]->(profile)`
        )
        .set('r = $params')
        .run();
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
            `NOT EXISTS { MATCH (profile)-[:${
                Boost.getRelationshipByAlias('hasRole').name
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
        const boostId = await getBoostIdForCredentialInstance(credential);

        if (boostId) await clearDidWebCacheForChildProfileManagers(boostId);
    } catch (error) {
        console.error('Could not clear did:web cache for accepted boost credential', error);
    }
};

/**
 * Creates a transaction for a credential being issued via a contract's write permission
 * and links the credential to that transaction (which is linked to the terms)
 */
export const createCredentialIssuedViaContractRelationship = async (
    credential: CredentialInstance,
    terms: DbTermsType
): Promise<void> => {
    const currentDate = new Date().toISOString();
    const transactionId = uuid();

    await new QueryBuilder()
        .match({
            model: ConsentFlowTerms,
            where: { id: terms.id },
            identifier: 'terms',
        })
        .create({
            related: [
                {
                    model: ConsentFlowTransaction,
                    identifier: 'transaction',
                    properties: { id: transactionId, action: 'write', date: currentDate },
                },
                ConsentFlowTransaction.getRelationshipByAlias('isFor'),
                { identifier: 'terms' },
            ],
        })
        .with('transaction')
        .match({
            model: Credential,
            where: { id: credential.id },
            identifier: 'credential',
        })
        .create({
            related: [
                { identifier: 'credential' },
                {
                    ...Credential.getRelationshipByAlias('issuedViaTransaction'),
                    properties: { date: currentDate },
                },
                { identifier: 'transaction' },
            ],
        })
        .run();
};
