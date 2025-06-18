import { QueryBuilder } from 'neogma';
import { v4 as uuid } from 'uuid';

import {
    Credential,
    Boost,
    Role,
    Profile,
    ConsentFlowTerms,
    ConsentFlowTransaction,
    type CredentialInstance
} from '@models';
import type { ProfileType } from 'types/profile';
import { clearDidWebCacheForChildProfileManagers } from '@accesslayer/boost/relationships/update';
import type { DbTermsType } from 'types/consentflowcontract';

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
