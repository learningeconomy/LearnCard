import {
    ConsentFlowTerms as ConsentFlowTermsType,
    ConsentFlowTransaction,
    LCNNotificationTypeEnumValidator,
    LCNProfile,
    VC,
    UnsignedVC,
} from '@learncard/types';
import { v4 as uuid } from 'uuid';
import {
    ConsentFlowContract,
    ConsentFlowTerms,
    ConsentFlowTransaction as ConsentFlowTransactionModel,
    Profile,
} from '@models';
import { BindParam, QueryBuilder } from 'neogma';
import { DbContractType, FlatDbTermsType } from 'types/consentflowcontract';
import { flattenObject, inflateObject } from '@helpers/objects.helpers';
import { reconsentTerms } from './update';
import { addNotificationToQueue } from '@helpers/notifications.helpers';
import { convertQueryResultToPropertiesObjectArray } from '@helpers/neo4j.helpers';
import { BoostType } from 'types/boost';
import { getBoostUri, sendBoost } from '@helpers/boost.helpers';
import { getDidWeb } from '@helpers/did.helpers';
import { getSigningAuthorityForUserByName } from '@accesslayer/signing-authority/relationships/read';
import { issueCredentialWithSigningAuthority } from '@helpers/signingAuthority.helpers';

export const setCreatorForContract = async (contract: DbContractType, profile: LCNProfile) => {
    return ConsentFlowContract.relateTo({
        alias: 'createdBy',
        where: {
            source: { id: contract.id },
            target: { profileId: profile.profileId },
        },
    });
};

export const setAutoBoostForContract = async (
    contract: DbContractType,
    boost: BoostType,
    signingAuthority: { endpoint: string; name: string }
) => {
    return ConsentFlowContract.relateTo({
        alias: 'autoReceive',
        where: { source: { id: contract.id }, target: { id: boost.id } },
        properties: {
            signingAuthorityEndpoint: signingAuthority.endpoint,
            signingAuthorityName: signingAuthority.name,
        },
    });
};

export const consentToContract = async (
    consenter: LCNProfile,
    { contract, contractOwner }: { contract: DbContractType; contractOwner: LCNProfile },
    {
        terms,
        expiresAt,
        oneTime,
    }: {
        terms: ConsentFlowTermsType;
        expiresAt?: string;
        liveSyncing?: boolean;
        oneTime?: boolean;
    },
    domain: string
) => {
    const existing = convertQueryResultToPropertiesObjectArray<{
        terms: FlatDbTermsType;
    }>(
        await new QueryBuilder()
            .match({
                related: [
                    { model: Profile, where: { profileId: consenter.profileId } },
                    ConsentFlowTerms.getRelationshipByAlias('createdBy'),
                    { model: ConsentFlowTerms, identifier: 'terms' },
                    ConsentFlowTerms.getRelationshipByAlias('consentsTo'),
                    { model: ConsentFlowContract, where: { id: contract.id } },
                ],
            })
            .return('terms')
            .run()
    );

    if (existing.length > 0) {
        return reconsentTerms(
            { terms: inflateObject(existing[0]!.terms), consenter, contract, contractOwner },
            { terms, expiresAt, oneTime },
            domain
        );
    }

    const transaction = {
        id: uuid(),
        action: 'consent',
        date: new Date().toISOString(),
        ...(expiresAt ? { expiresAt } : {}),
        ...(oneTime ? { oneTime } : {}),
    } as const satisfies ConsentFlowTransaction;

    const termsId = uuid();

    const result = await new QueryBuilder(new BindParam({ params: flattenObject({ terms }) }))
        .match({
            multiple: [
                {
                    model: Profile,
                    where: { profileId: consenter.profileId },
                    identifier: 'profile',
                },
                { model: ConsentFlowContract, where: { id: contract.id }, identifier: 'contract' },
            ],
        })
        .create({
            related: [
                { identifier: 'profile' },
                ConsentFlowTerms.getRelationshipByAlias('createdBy'),
                {
                    model: ConsentFlowTerms,
                    properties: {
                        id: termsId,
                        status: oneTime ? 'stale' : 'live',
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                        ...(expiresAt ? { expiresAt } : {}),
                        ...(oneTime ? { oneTime } : {}),
                    },
                    identifier: 'terms',
                },
                ConsentFlowTerms.getRelationshipByAlias('consentsTo'),
                { identifier: 'contract' },
            ],
        })
        .create({
            related: [
                {
                    identifier: 'transaction',
                    model: ConsentFlowTransactionModel,
                    properties: transaction,
                },
                ConsentFlowTransactionModel.getRelationshipByAlias('isFor'),
                { identifier: 'terms' },
            ],
        })
        .set('terms += $params')
        .set('transaction += $params')
        .run();

    // Process Auto-Boosts
    const autoBoosts = await ConsentFlowContract.findRelationships({
        alias: 'autoReceive',
        where: { source: { id: contract.id } },
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
                    contractOwner,
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
                            id: getDidWeb(domain, consenter.profileId),
                        })
                    );
                } else {
                    boostCredential.credentialSubject.id = getDidWeb(domain, consenter.profileId);
                }

                // Issue the credential using contract owner's signing authority
                const vc = await issueCredentialWithSigningAuthority(
                    contractOwner,
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
                } as const satisfies ConsentFlowTransaction;

                // Create the transaction in the database
                const termsResult = await new QueryBuilder()
                    .match({
                        identifier: 'terms',
                        model: ConsentFlowTerms,
                        where: { id: termsId },
                    })
                    .create({
                        related: [
                            {
                                identifier: 'boostTransaction',
                                model: ConsentFlowTransactionModel,
                                properties: boostTransaction,
                            },
                            ConsentFlowTransactionModel.getRelationshipByAlias('isFor'),
                            { identifier: 'terms' },
                        ],
                    })
                    .return('terms')
                    .run();

                // Send the boost to the consenter
                await sendBoost(
                    contractOwner,
                    consenter,
                    boost.target,
                    vc,
                    domain,
                    false,
                    true,
                    inflateObject(termsResult.records[0]?.get('terms').properties)
                );
            } catch (error) {
                console.error('Error processing auto-boost:', error);
            }
        }
    }

    await addNotificationToQueue({
        type: LCNNotificationTypeEnumValidator.enum.CONSENT_FLOW_TRANSACTION,
        from: consenter,
        to: contractOwner,
        message: {
            title: 'New Consent Transaction',
            body: `${consenter.displayName} has just consented to ${contract.name}!`,
        },
        data: { transaction },
    });

    return result.summary.counters.containsUpdates();
};
