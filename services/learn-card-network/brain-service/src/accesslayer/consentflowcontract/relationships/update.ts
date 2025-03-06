import { QueryBuilder, BindParam } from 'neogma';
import { v4 as uuid } from 'uuid';
import {
    ConsentFlowTerms as ConsentFlowTermsType,
    ConsentFlowTransaction as ConsentFlowTransactionType,
    LCNNotificationTypeEnumValidator,
    LCNProfile,
    VC,
    UnsignedVC,
} from '@learncard/types';
import { ConsentFlowTerms, ConsentFlowTransaction, ConsentFlowContract } from '@models';
import { flattenObject } from '@helpers/objects.helpers';
import { addNotificationToQueue } from '@helpers/notifications.helpers';
import { DbContractType, DbTermsType } from 'types/consentflowcontract';
import { getBoostUri, sendBoost } from '@helpers/boost.helpers';
import { getDidWeb } from '@helpers/did.helpers';
import { getSigningAuthorityForUserByName } from '@accesslayer/signing-authority/relationships/read';
import { issueCredentialWithSigningAuthority } from '@helpers/signingAuthority.helpers';

export const reconsentTerms = async (
    relationship: {
        terms: DbTermsType;
        consenter: LCNProfile;
        contract: DbContractType;
        contractOwner: LCNProfile;
    },
    {
        terms,
        expiresAt,
        oneTime,
    }: { terms: ConsentFlowTermsType; expiresAt?: string; oneTime?: boolean },
    domain: string
): Promise<boolean> => {
    const transaction = {
        id: uuid(),
        action: 'consent',
        date: new Date().toISOString(),
        ...(typeof expiresAt === 'string' ? { expiresAt } : {}),
        ...(typeof oneTime === 'boolean' ? { oneTime } : {}),
    } as const satisfies ConsentFlowTransactionType;

    const result = await new QueryBuilder(
        new BindParam({
            params: flattenObject({
                terms,
                updatedAt: new Date().toISOString(),
                status: oneTime ? 'stale' : 'live',
                ...(typeof expiresAt === 'string' ? { expiresAt } : {}),
                ...(typeof oneTime === 'boolean' ? { oneTime } : {}),
            }),
        })
    )
        .match({
            model: ConsentFlowTerms,
            where: { id: relationship.terms.id },
            identifier: 'terms',
        })
        .set('terms += $params')
        .with('terms')
        .create({
            related: [
                {
                    identifier: 'transaction',
                    model: ConsentFlowTransaction,
                    properties: transaction,
                },
                ConsentFlowTransaction.getRelationshipByAlias('isFor'),
                { identifier: 'terms' },
            ],
        })
        .set('transaction += $params')
        .run();

    // Process Auto-Boosts
    const autoBoostsResult = await ConsentFlowContract.findRelationships({
        alias: 'autoReceive',
        where: { source: { id: relationship.contract.id } },
    });

    if (autoBoostsResult.length > 0) {
        // For each auto-boost, issue it to the consenter
        for (const boostRel of autoBoostsResult) {
            try {
                const boost = boostRel.target;

                // Get the signing authority information from the relationship
                const signingAuthorityEndpoint =
                    boostRel.relationship?.signingAuthorityEndpoint || 'default';
                const signingAuthorityName =
                    boostRel.relationship?.signingAuthorityName || 'default';

                // Get the contract owner's signing authority
                const contractOwnerSigningAuthority = await getSigningAuthorityForUserByName(
                    relationship.contractOwner,
                    signingAuthorityEndpoint,
                    signingAuthorityName
                );

                if (!contractOwnerSigningAuthority) {
                    console.error(
                        `Signing authority "${signingAuthorityName}" at endpoint "${signingAuthorityEndpoint}" not found for contract owner`
                    );
                    continue;
                }

                // Get boost instance
                const boostCredential = JSON.parse(boost.dataValues?.boost) as UnsignedVC | VC;

                // Set the issuer and subject
                boostCredential.issuer = { id: contractOwnerSigningAuthority.relationship.did };

                boostCredential.boostId = getBoostUri(boost.dataValues.id, domain);

                if (Array.isArray(boostCredential.credentialSubject)) {
                    boostCredential.credentialSubject = boostCredential.credentialSubject.map(
                        subject => ({
                            ...subject,
                            id: getDidWeb(domain, relationship.consenter.profileId),
                        })
                    );
                } else {
                    boostCredential.credentialSubject.id = getDidWeb(
                        domain,
                        relationship.consenter.profileId
                    );
                }

                // Issue the credential using contract owner's signing authority
                const vc = await issueCredentialWithSigningAuthority(
                    relationship.contractOwner,
                    boostCredential,
                    contractOwnerSigningAuthority,
                    domain,
                    false
                );

                // Create transaction to record the boost issuance
                const boostTransaction = {
                    id: uuid(),
                    action: 'write',
                    date: new Date().toISOString(),
                } as const satisfies ConsentFlowTransactionType;

                // Create the transaction in the database
                await new QueryBuilder()
                    .match({
                        model: ConsentFlowTerms,
                        where: { id: relationship.terms.id },
                        identifier: 'terms',
                    })
                    .create({
                        related: [
                            {
                                identifier: 'boostTransaction',
                                model: ConsentFlowTransaction,
                                properties: boostTransaction,
                            },
                            ConsentFlowTransaction.getRelationshipByAlias('isFor'),
                            { identifier: 'terms' },
                        ],
                    })
                    .run();

                // Send the boost to the consenter
                await sendBoost(
                    relationship.contractOwner,
                    relationship.consenter,
                    boostRel.target,
                    vc,
                    domain,
                    false,
                    true,
                    relationship.terms
                );
            } catch (error) {
                console.error('Error processing auto-boost:', error);
            }
        }
    }

    await addNotificationToQueue({
        type: LCNNotificationTypeEnumValidator.enum.CONSENT_FLOW_TRANSACTION,
        from: relationship.consenter,
        to: relationship.contractOwner,
        message: {
            title: 'New Consent Transaction',
            body: `${relationship.consenter.displayName} has just reconsented to ${relationship.contract.name}!`,
        },
        data: { transaction },
    });

    return result.summary.counters.containsUpdates();
};

export const updateTerms = async (
    relationship: {
        terms: DbTermsType;
        consenter: LCNProfile;
        contract: DbContractType;
        contractOwner: LCNProfile;
    },
    {
        terms,
        expiresAt,
        oneTime,
    }: { terms: ConsentFlowTermsType; expiresAt?: string; oneTime?: boolean },
    domain: string
): Promise<boolean> => {
    const transaction = {
        id: uuid(),
        action: 'update',
        date: new Date().toISOString(),
        ...(typeof expiresAt === 'string' ? { expiresAt } : {}),
        ...(typeof oneTime === 'boolean' ? { oneTime } : {}),
    } as const satisfies ConsentFlowTransactionType;

    const result = await new QueryBuilder(
        new BindParam({
            params: flattenObject({
                terms,
                updatedAt: new Date().toISOString(),
                status: oneTime ? 'stale' : 'live',
                ...(typeof expiresAt === 'string' ? { expiresAt } : {}),
                ...(typeof oneTime === 'boolean' ? { oneTime } : {}),
            }),
        })
    )
        .match({
            model: ConsentFlowTerms,
            where: { id: relationship.terms.id },
            identifier: 'terms',
        })
        .set('terms += $params')
        .with('terms')
        .create({
            related: [
                {
                    identifier: 'transaction',
                    model: ConsentFlowTransaction,
                    properties: transaction,
                },
                ConsentFlowTransaction.getRelationshipByAlias('isFor'),
                { identifier: 'terms' },
            ],
        })
        .set('transaction += $params')
        .run();

    // Process Auto-Boosts (for updates too)
    const autoBoosts = await ConsentFlowContract.findRelationships({
        alias: 'autoReceive',
        where: { source: { id: relationship.contract.id } },
    });

    if (autoBoosts.length > 0) {
        // For each auto-boost, issue it to the consenter
        for (const boost of autoBoosts) {
            try {
                // Get the signing authority information from the relationship
                const signingAuthorityEndpoint =
                    boost.relationship?.signingAuthorityEndpoint || 'default';
                const signingAuthorityName = boost.relationship?.signingAuthorityName || 'default';

                // Get the contract owner's signing authority
                const contractOwnerSigningAuthority = await getSigningAuthorityForUserByName(
                    relationship.contractOwner,
                    signingAuthorityEndpoint,
                    signingAuthorityName
                );

                if (!contractOwnerSigningAuthority) {
                    console.error(
                        `Signing authority "${signingAuthorityName}" at endpoint "${signingAuthorityEndpoint}" not found for contract owner`
                    );
                    continue;
                }

                // Get boost instance
                const boostCredential = JSON.parse(boost.target.boost) as UnsignedVC | VC;

                // Set the issuer and subject
                boostCredential.issuer = { id: contractOwnerSigningAuthority.relationship.did };

                boostCredential.boostId = getBoostUri(boost.target.id, domain);

                if (Array.isArray(boostCredential.credentialSubject)) {
                    boostCredential.credentialSubject = boostCredential.credentialSubject.map(
                        subject => ({
                            ...subject,
                            id: getDidWeb(domain, relationship.consenter.profileId),
                        })
                    );
                } else {
                    boostCredential.credentialSubject.id = getDidWeb(
                        domain,
                        relationship.consenter.profileId
                    );
                }

                // Issue the credential using contract owner's signing authority
                const vc = await issueCredentialWithSigningAuthority(
                    relationship.contractOwner,
                    boostCredential,
                    contractOwnerSigningAuthority,
                    domain,
                    false
                );

                // Create transaction to record the boost issuance
                const boostTransaction = {
                    id: uuid(),
                    action: 'write',
                    date: new Date().toISOString(),
                } as const satisfies ConsentFlowTransactionType;

                // Create the transaction in the database
                await new QueryBuilder()
                    .match({
                        model: ConsentFlowTerms,
                        where: { id: relationship.terms.id },
                        identifier: 'terms',
                    })
                    .create({
                        related: [
                            {
                                identifier: 'boostTransaction',
                                model: ConsentFlowTransaction,
                                properties: boostTransaction,
                            },
                            ConsentFlowTransaction.getRelationshipByAlias('isFor'),
                            { identifier: 'terms' },
                        ],
                    })
                    .run();

                // Send the boost to the consenter
                await sendBoost(
                    relationship.contractOwner,
                    relationship.consenter,
                    boost.target,
                    vc,
                    domain,
                    false,
                    true,
                    relationship.terms
                );
            } catch (error) {
                console.error('Error processing auto-boost:', error);
            }
        }
    }

    await addNotificationToQueue({
        type: LCNNotificationTypeEnumValidator.enum.CONSENT_FLOW_TRANSACTION,
        from: relationship.consenter,
        to: relationship.contractOwner,
        message: {
            title: 'New Consent Transaction',
            body: `${relationship.consenter.displayName} has just updated their terms to ${relationship.contract.name}!`,
        },
        data: { transaction },
    });

    return result.summary.counters.containsUpdates();
};

export const withdrawTerms = async (relationship: {
    terms: DbTermsType;
    consenter: LCNProfile;
    contract: DbContractType;
    contractOwner: LCNProfile;
}): Promise<boolean> => {
    const transaction = {
        id: uuid(),
        action: 'withdraw',
        date: new Date().toISOString(),
    } as const satisfies ConsentFlowTransactionType;

    const result = await new QueryBuilder()
        .match({
            model: ConsentFlowTerms,
            where: { id: relationship.terms.id },
            identifier: 'terms',
        })
        .set('terms.status = "withdrawn"')
        .with('terms')
        .create({
            related: [
                {
                    identifier: 'transaction',
                    model: ConsentFlowTransaction,
                    properties: transaction,
                },
                ConsentFlowTransaction.getRelationshipByAlias('isFor'),
                { identifier: 'terms' },
            ],
        })
        .run();

    await addNotificationToQueue({
        type: LCNNotificationTypeEnumValidator.enum.CONSENT_FLOW_TRANSACTION,
        from: relationship.consenter,
        to: relationship.contractOwner,
        message: {
            title: 'New Consent Transaction',
            body: `${relationship.consenter.displayName} has just withdrawn their terms to ${relationship.contract.name}!`,
        },
        data: { transaction },
    });

    return result.summary.counters.containsUpdates();
};
