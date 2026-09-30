import { termsReferralSnapshotCypher } from '@helpers/consent-referral.helpers';
import { appendConsentEvent, tryDispatchContractEvent } from '@helpers/contract-events.helpers';
import { QueryBuilder, BindParam } from 'neogma';
import { v4 as uuid } from 'uuid';
import {
    ConsentFlowTerms as ConsentFlowTermsType,
    ConsentFlowTransaction as ConsentFlowTransactionType,
    ConsentFlowGuardianApproval,
    LCNProfile,
    VC,
    UnsignedVC,
} from '@learncard/types';
import { ConsentFlowTerms, ConsentFlowTransaction, ConsentFlowContract } from '@models';
import { neogma } from '@instance';
import { flattenObject } from '@helpers/objects.helpers';
import { DbContractType, DbTermsType } from 'types/consentflowcontract';
import { getBoostUri, sendBoost } from '@helpers/boost.helpers';
import { setCredentialSubjectIds } from '@helpers/credentialSubject.helpers';
import { getDidWeb } from '@helpers/did.helpers';
import { getSigningAuthorityForUserByName } from '@accesslayer/signing-authority/relationships/read';
import { issueCredentialWithSigningAuthority } from '@helpers/signingAuthority.helpers';
import { getProfileByProfileId } from '@accesslayer/profile/read';
import { injectObv3AlignmentsIntoCredentialForBoost } from '@services/skills-provider/inject';
import { removeRequestedForRelationship } from './delete';
import {
    lockContractAudience,
    audienceVersionWhere,
    assertAudienceMutation,
    runAudienceMutation,
} from './recipients';

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
        guardianApproval,
        audienceVersion,
        smartResumeFingerprint,
    }: {
        terms: ConsentFlowTermsType;
        expiresAt?: string;
        oneTime?: boolean;
        guardianApproval?: ConsentFlowGuardianApproval;
        audienceVersion?: number;
        smartResumeFingerprint?: string;
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

    const existingFlat = flattenObject({
        terms: relationship.terms.terms,
        guardianApproval: relationship.terms.guardianApproval,
    });
    const newFlat = flattenObject({ terms, ...(guardianApproval ? { guardianApproval } : {}) });
    const removedProperties = Object.fromEntries(
        Object.keys(existingFlat)
            .filter(key => !(key in newFlat))
            .map(key => [key, null])
    );

    const result = await runAudienceMutation(
        appendConsentEvent(
            lockContractAudience(
                new QueryBuilder(
                    new BindParam({
                        audienceVersion: audienceVersion ?? null,
                        termsMutationVersion: Number(relationship.terms.mutationVersion ?? 0),
                        params: {
                            ...newFlat,
                            ...removedProperties,

                            ...(smartResumeFingerprint
                                ? {
                                      smartResumeFingerprint,
                                      smartResumePublicationStatus: 'pending',
                                      smartResumeMutationVersion:
                                          Number(relationship.terms.mutationVersion ?? 0) + 1,
                                      smartResumeLeaseId: null,
                                      smartResumeLeaseUntil: null,
                                      smartResumeRedirectUrl: null,
                                  }
                                : {}),
                            updatedAt: transaction.date,
                            status: oneTime ? 'stale' : 'live',
                            ...(typeof expiresAt === 'string' ? { expiresAt } : {}),
                            ...(typeof oneTime === 'boolean' ? { oneTime } : {}),
                        },
                    })
                ),
                relationship.contract.id
            )
                .where(audienceVersionWhere)
                .set('contract.hasConsented = true')
                .with('contract')
                .match({
                    model: ConsentFlowTerms,
                    where: { id: relationship.terms.id },
                    identifier: 'terms',
                })
                .where('coalesce(terms.mutationVersion, 0) = $termsMutationVersion')
                .set('terms += $params')
                .set('terms.mutationVersion = coalesce(terms.mutationVersion, 0) + 1')
                .with('terms, contract')
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
                .with('terms, contract, transaction'),
            {
                consenterProfileId: relationship.consenter.profileId,
                transaction,
                domain: domain,
                messageKey: 'consentFlowTransactionReconsented',
            }
        ).return('terms.id AS id')
    );
    assertAudienceMutation(result.records.length);

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

                    if (boostCredential.type.includes('BoostCredential')) {
                        boostCredential.boostId = getBoostUri(boost.dataValues.id, domain);
                    }

                    setCredentialSubjectIds(
                        boostCredential,
                        getDidWeb(domain, relationship.consenter.profileId)
                    );

                    // Issue the credential using contract owner's signing authority
                    // Inject OBv3 skill alignments based on boost's framework/skills
                    await injectObv3AlignmentsIntoCredentialForBoost(
                        boostCredential,
                        boostRel.target,
                        domain
                    );
                    const vc = await issueCredentialWithSigningAuthority(
                        { type: 'profile', profile: issuer },
                        boostCredential,
                        contractOwnerSigningAuthority,
                        domain,
                        true,
                        undefined,
                        true,
                        [getDidWeb(domain, relationship.contractOwner.profileId)]
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
                        .raw(termsReferralSnapshotCypher('boostTransaction'))
                        .run();

                    // Send the boost to the consenter
                    await sendBoost({
                        from: { type: 'profile', profile: relationship.contractOwner },
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

    await tryDispatchContractEvent(transaction.id);

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
        guardianApproval,
        audienceVersion,
    }: {
        terms: ConsentFlowTermsType;
        expiresAt?: string;
        oneTime?: boolean;
        guardianApproval?: ConsentFlowGuardianApproval;
        audienceVersion?: number;
    },
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
    const existingFlat = flattenObject({
        terms: relationship.terms.terms,
        guardianApproval: relationship.terms.guardianApproval,
    });
    const newFlatInner = flattenObject({
        terms,
        ...(guardianApproval ? { guardianApproval } : {}),
    });

    // 2. Determine keys that are present in the existing node but NOT in the new update
    const keysToRemove = Object.keys(existingFlat).filter(key => !(key in newFlatInner));

    // 3. Build a params object: keys for new/updated properties + keys to delete (set to null)
    const paramsForSet = {
        ...newFlatInner,
        updatedAt: transaction.date,
        status: oneTime ? 'stale' : 'live',
        ...(typeof expiresAt === 'string' ? { expiresAt } : {}),
        ...(typeof oneTime === 'boolean' ? { oneTime } : {}),
        ...Object.fromEntries(keysToRemove.map(k => [k, null as any])),
    };

    const result = await runAudienceMutation(
        appendConsentEvent(
            lockContractAudience(
                new QueryBuilder(
                    new BindParam({
                        params: paramsForSet,
                        audienceVersion: audienceVersion ?? null,
                        termsMutationVersion: Number(relationship.terms.mutationVersion ?? 0),
                    })
                ),
                relationship.contract.id
            )
                .where(audienceVersionWhere)
                .set('contract.hasConsented = true')
                .with('contract')
                .match({
                    model: ConsentFlowTerms,
                    where: { id: relationship.terms.id },
                    identifier: 'terms',
                })
                .where('coalesce(terms.mutationVersion, 0) = $termsMutationVersion')
                .set('terms += $params')
                .set('terms.mutationVersion = coalesce(terms.mutationVersion, 0) + 1')
                .with('terms, contract')
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
                .with('terms, contract, transaction'),
            {
                consenterProfileId: relationship.consenter.profileId,
                transaction,
                domain: domain,
                messageKey: 'consentFlowTransactionUpdatedTerms',
            }
        ).return('terms.id AS id')
    );
    assertAudienceMutation(result.records.length);

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

                    if (boostCredential.type.includes('BoostCredential')) {
                        boostCredential.boostId = getBoostUri(boost.target.id, domain);
                    }

                    setCredentialSubjectIds(
                        boostCredential,
                        getDidWeb(domain, relationship.consenter.profileId)
                    );

                    // Issue the credential using contract owner's signing authority
                    // Inject OBv3 skill alignments based on boost's framework/skills
                    await injectObv3AlignmentsIntoCredentialForBoost(
                        boostCredential,
                        boost.target,
                        domain
                    );
                    const vc = await issueCredentialWithSigningAuthority(
                        { type: 'profile', profile: issuer },
                        boostCredential,
                        contractOwnerSigningAuthority,
                        domain,
                        true,
                        undefined,
                        true,
                        [getDidWeb(domain, relationship.contractOwner.profileId)]
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
                        .raw(termsReferralSnapshotCypher('boostTransaction'))
                        .run();

                    // Send the boost to the consenter
                    await sendBoost({
                        from: { type: 'profile', profile: relationship.contractOwner },
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

    await tryDispatchContractEvent(transaction.id);

    return result.summary.counters.containsUpdates();
};

export const withdrawTerms = async (
    relationship: {
        terms: DbTermsType;
        consenter: LCNProfile;
        contract: DbContractType;
        contractOwner: LCNProfile;
    },
    domain?: string
): Promise<boolean> => {
    const transaction = {
        id: uuid(),
        action: 'withdraw',
        date: new Date().toISOString(),
    } as const satisfies ConsentFlowTransactionType;

    const result = await runAudienceMutation(
        appendConsentEvent(
            lockContractAudience(new QueryBuilder(), relationship.contract.id)
                .match({
                    model: ConsentFlowTerms,
                    where: { id: relationship.terms.id },
                    identifier: 'terms',
                })
                .set('terms.status = "withdrawn"')
                .set('terms.mutationVersion = coalesce(terms.mutationVersion, 0) + 1')
                .with('terms, contract')
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
                .with('terms, contract, transaction'),
            {
                consenterProfileId: relationship.consenter.profileId,
                transaction,
                domain,
                messageKey: 'consentFlowTransactionWithdrawn',
            }
        ).return('terms.id AS id')
    );

    await tryDispatchContractEvent(transaction.id);

    try {
        await removeRequestedForRelationship(
            relationship.contract.id,
            relationship.consenter.profileId
        );
    } catch (error) {
        console.log('No request found to remove');
    }

    return result.summary.counters.containsUpdates();
};

export const syncCredentialsToContract = async (
    relationship: {
        terms: DbTermsType;
        consenter: LCNProfile;
        contract: DbContractType;
        contractOwner: LCNProfile;
    },
    categories: Record<string, string[]>,
    audienceVersion?: number,
    domain?: string
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
    const result = await runAudienceMutation(
        appendConsentEvent(
            lockContractAudience(
                new QueryBuilder(
                    new BindParam({
                        audienceVersion: audienceVersion ?? null,
                        termsMutationVersion: Number(relationship.terms.mutationVersion ?? 0),
                        now: new Date().toISOString(),
                        params: flattenObject({
                            terms: updatedTerms,
                            updatedAt: new Date().toISOString(),
                        }),
                        transactionParams: (flattenObject as any)(transaction),
                    })
                ),
                relationship.contract.id
            )
                .where(audienceVersionWhere)
                .match({
                    model: ConsentFlowTerms,
                    where: { id: relationship.terms.id },
                    identifier: 'terms',
                })
                .where(
                    `coalesce(terms.mutationVersion, 0) = $termsMutationVersion AND terms.status = 'live'
            AND (CASE WHEN terms.expiresAt IS NULL OR trim(terms.expiresAt) = '' THEN true ELSE datetime(terms.expiresAt) > datetime($now) END)
            AND (CASE WHEN contract.expiresAt IS NULL OR trim(contract.expiresAt) = '' THEN true ELSE datetime(contract.expiresAt) > datetime($now) END)`
                )
                .set('terms += $params')
                .set('terms.mutationVersion = coalesce(terms.mutationVersion, 0) + 1')
                .with('terms, contract')
                .create({
                    related: [
                        { identifier: 'transaction', model: ConsentFlowTransaction },
                        ConsentFlowTransaction.getRelationshipByAlias('isFor'),
                        { identifier: 'terms' },
                    ],
                })
                .set('transaction += $transactionParams')
                .with('terms, contract, transaction'),
            {
                consenterProfileId: relationship.consenter.profileId,
                transaction,
                domain,
                messageKey:
                    Object.keys(categories).length === 1
                        ? 'consentFlowTransactionSyncedSingle'
                        : 'consentFlowTransactionSyncedPlural',
            }
        ).return('terms.id AS id')
    );
    assertAudienceMutation(result.records.length);

    await tryDispatchContractEvent(transaction.id);

    return result.summary.counters.containsUpdates();
};

export const pruneDeletedUrisFromConsentTerms = async (
    terms: DbTermsType,
    deletedUris: string[]
): Promise<number> => {
    const deletedUriSet = new Set(deletedUris.filter((uri): uri is string => Boolean(uri)));
    if (!deletedUriSet.size) return 0;

    const updatedTerms = JSON.parse(JSON.stringify(terms.terms)) as ConsentFlowTermsType;

    if (!updatedTerms.read) updatedTerms.read = {} as any;
    if (!updatedTerms.read.credentials) updatedTerms.read.credentials = {} as any;
    if (!updatedTerms.read.credentials.categories) updatedTerms.read.credentials.categories = {};

    let removedSharedUris = 0;

    for (const categoryInfo of Object.values(updatedTerms.read.credentials.categories)) {
        const previousShared = categoryInfo.shared ?? [];
        const nextShared = previousShared.filter(uri => !deletedUriSet.has(uri));

        removedSharedUris += previousShared.length - nextShared.length;
        categoryInfo.shared = nextShared;
    }

    if (!removedSharedUris) return 0;

    const existingFlat = flattenObject({ terms: terms.terms });
    const newFlatInner = flattenObject({ terms: updatedTerms });

    const keysToRemove = Object.keys(existingFlat).filter(key => !(key in newFlatInner));

    const transaction = {
        id: uuid(),
        action: 'sync',
        date: new Date().toISOString(),
        terms: updatedTerms,
    } as const satisfies ConsentFlowTransactionType;

    const paramsForSet = {
        ...newFlatInner,
        updatedAt: new Date().toISOString(),
        ...(typeof terms.expiresAt === 'string' ? { expiresAt: terms.expiresAt } : {}),
        ...(typeof terms.oneTime === 'boolean' ? { oneTime: terms.oneTime } : {}),
        ...Object.fromEntries(keysToRemove.map(k => [k, null as any])),
    };

    const result = await new QueryBuilder(
        new BindParam({
            params: paramsForSet,
            transactionParams: (flattenObject as any)(transaction),
        })
    )
        .match({
            model: ConsentFlowTerms,
            where: { id: terms.id },
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
        .raw(termsReferralSnapshotCypher())
        .run();

    return result.summary.counters.containsUpdates() ? removedSharedUris : 0;
};

export const upsertRequestedForRelationship = async (
    id: string,
    profileId: string,
    status?: 'pending' | 'accepted' | 'denied',
    readStatus?: 'seen' | 'unseen' | null
) => {
    const cypher = `
        MATCH (contract:ConsentFlowContract {id: $id})
        SET contract.audienceLock = coalesce(contract.audienceLock, 0) + 1
        WITH contract
        MATCH (profile:Profile {profileId: $profileId})
        OPTIONAL MATCH (contract)-[existing:REQUESTED_FOR]->(profile)
        WITH contract, profile, existing WHERE existing.requestId IS NULL
        MERGE (contract)-[r:REQUESTED_FOR]->(profile)
        ${status !== undefined ? 'SET r.status = $status' : ''}
        ${readStatus !== undefined ? 'SET r.readStatus = $readStatus' : ''}
        RETURN r
    `;

    const params: any = { id, profileId };
    if (status !== undefined) params.status = status;
    if (readStatus !== undefined) params.readStatus = readStatus;

    const result = await neogma.queryRunner.run(cypher, params);
    if (!result.records.length) throw new Error('A generic request already exists');
};
