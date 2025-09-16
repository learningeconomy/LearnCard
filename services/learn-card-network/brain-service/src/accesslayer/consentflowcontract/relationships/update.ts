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
import { getProfileByProfileId } from '@accesslayer/profile/read';
import { injectObv3AlignmentsIntoCredentialForBoost } from '@services/skills-provider/inject';

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
    }: {
        terms: ConsentFlowTermsType;
        expiresAt?: string;
        oneTime?: boolean;
    },
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
        await Promise.all(
            autoBoostsResult.map(async boostRel => {
                try {
                    const boost = boostRel.target;

                    // Get the signing authority information from the relationship
                    const signingAuthorityEndpoint =
                        boostRel.relationship?.signingAuthorityEndpoint || 'default';
                    const signingAuthorityName =
                        boostRel.relationship?.signingAuthorityName || 'default';

                    const issuer =
                        (boostRel.relationship?.issuer &&
                            (await getProfileByProfileId(boostRel.relationship.issuer))) ||
                        relationship.contractOwner;

                    if (terms.deniedWriters?.includes(issuer.profileId)) return;

                    // Get the contract owner's signing authority
                    const contractOwnerSigningAuthority = await getSigningAuthorityForUserByName(
                        issuer,
                        signingAuthorityEndpoint,
                        signingAuthorityName
                    );

                    if (!contractOwnerSigningAuthority) {
                        console.error(
                            `Signing authority "${signingAuthorityName}" at endpoint "${signingAuthorityEndpoint}" not found for contract owner`
                        );
                        return;
                    }

                    const boostCategory = boost.dataValues.category;
                    if (boostCategory) {
                        const categoryWritePermission =
                            terms.write?.credentials?.categories?.[boostCategory];

                        // Category not found in write permissions - deny autoboost
                        if (!categoryWritePermission) return;

                        // Check if write permission is explicitly denied (false) or not granted (undefined)
                        // Only issue autoboost if write permission is explicitly granted (true)
                        if (categoryWritePermission !== true) return;
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
                    // Inject OBv3 skill alignments based on boost's framework/skills
                    await injectObv3AlignmentsIntoCredentialForBoost(boostCredential, boostRel.target);
                    const vc = await issueCredentialWithSigningAuthority(
                        issuer,
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
                    await sendBoost({
                        from: relationship.contractOwner,
                        to: relationship.consenter,
                        boost: boostRel.target,
                        credential: vc,
                        domain,
                        skipNotification: true,
                        autoAcceptCredential: false,
                        contractTerms: relationship.terms,
                    });
                } catch (error) {
                    console.error('Error processing auto-boost:', error);
                }
            })
        );
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

    /* -------------------------------------------------------------------------- */
    /* Remove stale flattened properties (e.g. old array indexes)                */
    /* -------------------------------------------------------------------------- */

    // 1. Flatten both the existing stored terms and the new terms we are saving
    const existingFlat = flattenObject({ terms: relationship.terms.terms });
    const newFlatInner = flattenObject({ terms });

    // 2. Determine keys that are present in the existing node but NOT in the new update
    const keysToRemove = Object.keys(existingFlat).filter(key => !(key in newFlatInner));

    // 3. Build a params object: keys for new/updated properties + keys to delete (set to null)
    const paramsForSet = {
        ...newFlatInner,
        updatedAt: new Date().toISOString(),
        status: oneTime ? 'stale' : 'live',
        ...(typeof expiresAt === 'string' ? { expiresAt } : {}),
        ...(typeof oneTime === 'boolean' ? { oneTime } : {}),
        ...Object.fromEntries(keysToRemove.map(k => [k, null as any])),
    };

    const result = await new QueryBuilder(new BindParam({ params: paramsForSet }))
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
        await Promise.all(
            autoBoosts.map(async boost => {
                try {
                    // Get the signing authority information from the relationship
                    const signingAuthorityEndpoint =
                        boost.relationship?.signingAuthorityEndpoint || 'default';
                    const signingAuthorityName =
                        boost.relationship?.signingAuthorityName || 'default';

                    const issuer =
                        (boost.relationship?.issuer &&
                            (await getProfileByProfileId(boost.relationship.issuer))) ||
                        relationship.contractOwner;

                    if (terms.deniedWriters?.includes(issuer.profileId)) return;

                    // Get the contract owner's signing authority
                    const contractOwnerSigningAuthority = await getSigningAuthorityForUserByName(
                        issuer,
                        signingAuthorityEndpoint,
                        signingAuthorityName
                    );

                    if (!contractOwnerSigningAuthority) {
                        console.error(
                            `Signing authority "${signingAuthorityName}" at endpoint "${signingAuthorityEndpoint}" not found for contract owner`
                        );
                        return;
                    }

                    const boostCategory = boost.target.category;
                    if (boostCategory) {
                        const categoryWritePermission =
                            terms.write?.credentials?.categories?.[boostCategory];

                        if (!categoryWritePermission) return;

                        // Check if write permission is explicitly denied (false) or not granted (undefined)
                        // Only issue autoboost if write permission is explicitly granted (true)
                        if (categoryWritePermission !== true) return;
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
                    // Inject OBv3 skill alignments based on boost's framework/skills
                    await injectObv3AlignmentsIntoCredentialForBoost(boostCredential, boost.target);
                    const vc = await issueCredentialWithSigningAuthority(
                        issuer,
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
                    await sendBoost({
                        from: relationship.contractOwner,
                        to: relationship.consenter,
                        boost: boost.target,
                        credential: vc,
                        domain,
                        skipNotification: false,
                        autoAcceptCredential: true,
                        contractTerms: relationship.terms,
                    });
                } catch (error) {
                    console.error('Error processing auto-boost:', error);
                }
            })
        );
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

export const syncCredentialsToContract = async (
    relationship: {
        terms: DbTermsType;
        consenter: LCNProfile;
        contract: DbContractType;
        contractOwner: LCNProfile;
    },
    categories: Record<string, string[]>
): Promise<boolean> => {
    // First define the transaction with sync terms data
    // Create a structure that matches the terms format with multiple categories
    const syncTerms: ConsentFlowTermsType = {
        read: {
            credentials: {
                categories: {},
            },
        },
    } as any;

    // Add each category to the sync terms
    for (const [category, uris] of Object.entries(categories)) {
        syncTerms.read.credentials.categories[category] = {
            shared: uris,
        };
    }

    // Create the transaction object
    const transaction = {
        id: uuid(),
        action: 'sync',
        date: new Date().toISOString(),
        terms: syncTerms,
    } as const satisfies ConsentFlowTransactionType;

    // Update the terms with the synced credentials
    // Clone the existing terms to avoid modifying the original
    const updatedTerms = JSON.parse(
        JSON.stringify(relationship.terms.terms)
    ) as ConsentFlowTermsType;

    // Ensure the credentials structure exists
    if (!updatedTerms.read) updatedTerms.read = {} as any;
    if (!updatedTerms.read.credentials) updatedTerms.read.credentials = {} as any;
    if (!updatedTerms.read.credentials.categories) updatedTerms.read.credentials.categories = {};

    // Process each category
    for (const [category, credentialUris] of Object.entries(categories)) {
        // Initialize the category if it doesn't exist
        if (!updatedTerms.read.credentials.categories[category]) {
            updatedTerms.read.credentials.categories[category] = {
                sharing: true,
                shared: [],
            };
        }

        // Make sure shared array exists
        if (!updatedTerms.read.credentials.categories[category].shared) {
            updatedTerms.read.credentials.categories[category].shared = [];
        }

        // Add the credential URIs to the shared array of the category
        updatedTerms.read.credentials.categories[category].shared = [
            ...new Set([
                ...(updatedTerms.read.credentials.categories[category].shared || []),
                ...credentialUris,
            ]),
        ];
    }

    // Use flattenObject for both the query params and transaction properties to handle Neo4j limitations
    const result = await new QueryBuilder(
        new BindParam({
            params: flattenObject({
                terms: updatedTerms,
                updatedAt: new Date().toISOString(),
            }),
            transactionParams: (flattenObject as any)(transaction),
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
                { identifier: 'transaction', model: ConsentFlowTransaction },
                ConsentFlowTransaction.getRelationshipByAlias('isFor'),
                { identifier: 'terms' },
            ],
        })
        .set('transaction += $transactionParams')
        .run();

    // Calculate total number of credentials synced
    const totalCredentials = Object.values(categories).reduce(
        (total, uris) => total + uris.length,
        0
    );
    const categoryCount = Object.keys(categories).length;

    // Send a notification to the contract owner
    await addNotificationToQueue({
        type: LCNNotificationTypeEnumValidator.enum.CONSENT_FLOW_TRANSACTION,
        from: relationship.consenter,
        to: relationship.contractOwner,
        message: {
            title: 'New Consent Transaction',
            body: `${
                relationship.consenter.displayName
            } has synced ${totalCredentials} credential(s) across ${categoryCount} ${
                categoryCount === 1 ? 'category' : 'categories'
            } to ${relationship.contract.name}!`,
        },
        data: { transaction },
    });

    return result.summary.counters.containsUpdates();
};
