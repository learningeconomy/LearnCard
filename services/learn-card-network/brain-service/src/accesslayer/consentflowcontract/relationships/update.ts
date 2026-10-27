import { v4 as uuid } from 'uuid';
import { getConsentFlowContractVersionRecord } from '@accesslayer/consentflowcontract/versions';
import { termsReferralSnapshotCypher } from '@helpers/consent-referral.helpers';
import { appendConsentEvent, tryDispatchContractEvent } from '@helpers/contract-events.helpers';
import { QueryBuilder, BindParam } from 'neogma';
import { TRPCError } from '@trpc/server';
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
import { getBoostUri, sendBoost, stampIssuanceDate } from '@helpers/boost.helpers';
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
    consentMutationWhere,
    assertAudienceMutation,
    runAudienceMutation,
} from './recipients';

export const claimAutoBoostTransaction = async (
    contractId: string,
    termsId: string,
    boostId: string,
    allowConsumedOneTime = false
) => {
    const id = uuid();
    const result = await neogma.queryRunner.run(
        `MATCH (contract:ConsentFlowContract {id:$contractId})
         SET contract.autoBoostClaimLock = coalesce(contract.autoBoostClaimLock, 0) + 1
         WITH contract
         MATCH (terms:ConsentFlowTerms {id:$termsId})-[:CONSENTS_TO]->(contract)
         WHERE coalesce(contract.status, 'active') <> 'retired'
           AND (terms.status = 'live' OR
                ($allowConsumedOneTime AND terms.status = 'consumed' AND terms.oneTime = true))
           AND coalesce(terms.consentedVersion, 1) = coalesce(contract.currentVersion, 1)
         SET terms.autoBoostClaimLock = coalesce(terms.autoBoostClaimLock, 0) + 1
         WITH terms
         OPTIONAL MATCH (terms)<-[:IS_FOR]-(existing:ConsentFlowTransaction {boostId:$boostId})
         OPTIONAL MATCH (terms)<-[:IS_FOR]-(legacy:ConsentFlowTransaction)-[:ISSUED_VIA_TRANSACTION]-
                        (credential:Credential)-[:INSTANCE_OF]->(:Boost {id:$boostId})
         OPTIONAL MATCH (claim:ConsentFlowAutoBoostClaim {termsId:$termsId, boostId:$boostId})
         WITH terms, existing, legacy, claim
         WHERE existing IS NULL AND legacy IS NULL AND claim IS NULL
         CREATE (:ConsentFlowAutoBoostClaim {id:$id, termsId:$termsId, boostId:$boostId})
         RETURN $id AS id`,
        { contractId, termsId, boostId, id, allowConsumedOneTime }
    );
    const created = result.records[0]?.get('id');
    return created ? String(created) : null;
};

export const completeAutoBoostTransaction = async (
    claimId: string,
    termsId: string,
    boostId: string
) => {
    await neogma.queryRunner.run(
        `MATCH (terms:ConsentFlowTerms {id:$termsId})
         MATCH (claim:ConsentFlowAutoBoostClaim {id:$claimId})
         MATCH (terms)<-[:IS_FOR]-(transaction:ConsentFlowTransaction)
               <-[:ISSUED_VIA_TRANSACTION]-(credential:Credential)-[:INSTANCE_OF]->(:Boost {id:$boostId})
         WITH claim, collect(DISTINCT transaction) AS transactions
         FOREACH (transaction IN transactions | SET transaction.boostId = $boostId)
         DETACH DELETE claim`,
        { termsId, claimId, boostId }
    );
};

export const releaseAutoBoostClaim = async (claimId: string) => {
    await neogma.queryRunner.run(
        `MATCH (claim:ConsentFlowAutoBoostClaim {id:$claimId}) DETACH DELETE claim`,
        { claimId }
    );
};
export const isAutoBoostConsentCurrent = async (
    contractId: string,
    termsId: string,
    allowConsumedOneTime = false
) => {
    const result = await neogma.queryRunner.run(
        `MATCH (contract:ConsentFlowContract {id:$contractId})
         MATCH (terms:ConsentFlowTerms {id:$termsId})-[:CONSENTS_TO]->(contract)
         RETURN coalesce(contract.status, 'active') <> 'retired'
            AND (terms.status = 'live' OR
                 ($allowConsumedOneTime AND terms.status = 'consumed' AND terms.oneTime = true))
            AND coalesce(terms.consentedVersion, 1) = coalesce(contract.currentVersion, 1) AS current`,
        { contractId, termsId, allowConsumedOneTime }
    );
    return result.records[0]?.get('current') === true;
};

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
        expectedRequestId,
        smartResumeFingerprint,
        acceptVersion,
    }: {
        terms: ConsentFlowTermsType;
        expiresAt?: string;
        oneTime?: boolean;
        guardianApproval?: ConsentFlowGuardianApproval;
        audienceVersion?: number;
        expectedRequestId?: string;
        smartResumeFingerprint?: string;
        acceptVersion?: number;
    },
    domain: string
): Promise<boolean> => {
    const currentVersion = Number(relationship.contract.currentVersion ?? 1);
    const version = acceptVersion ?? currentVersion;
    if (!Number.isInteger(version) || version !== currentVersion) {
        throw new TRPCError({
            code: 'CONFLICT',
            message: 'Only the latest contract version can be accepted',
        });
    }
    const transaction = {
        id: uuid(),
        action: 'reconsent',
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
                        expectedContractVersion: version,
                        audienceVersion: audienceVersion ?? null,
                        expectedRequestId: expectedRequestId ?? null,
                        consenterProfileId: relationship.consenter.profileId,
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
                            status: oneTime ? 'consumed' : 'live',
                            consentedVersion: version,
                            reconsentDeadline: null,
                            newOptionsUntil: null,
                            ...(typeof expiresAt === 'string' ? { expiresAt } : {}),
                            ...(typeof oneTime === 'boolean' ? { oneTime } : {}),
                        },
                    })
                ),
                relationship.contract.id
            )
                .where(
                    `${audienceVersionWhere} AND ${consentMutationWhere} AND coalesce(contract.status, 'active') <> 'retired' AND coalesce(contract.currentVersion, 1) = $expectedContractVersion`
                )
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

    const versionSnapshot = await getConsentFlowContractVersionRecord(
        relationship.contract.id,
        version
    );
    const configuredAutoBoosts = new Map(
        (versionSnapshot?.autoboosts ?? []).map(config => [config.id, config])
    );
    const autoBoostsResult = (
        await ConsentFlowContract.findRelationships({
            alias: 'autoReceive',
            where: { source: { id: relationship.contract.id } },
        })
    ).filter(boost => configuredAutoBoosts.has(boost.target.id));

    if (autoBoostsResult.length > 0) {
        // For each auto-boost, issue it to the consenter
        await Promise.all(
            autoBoostsResult.map(async boostRel => {
                let claimId: string | undefined;
                let sendStarted = false;
                try {
                    const boost = boostRel.target;

                    const config = configuredAutoBoosts.get(boost.id)!;
                    const signingAuthorityEndpoint = config.signingAuthorityEndpoint || 'default';
                    const signingAuthorityName = config.signingAuthorityName || 'default';
                    const issuer =
                        (config.issuer && (await getProfileByProfileId(config.issuer))) ||
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
                    claimId =
                        (await claimAutoBoostTransaction(
                            relationship.contract.id,
                            relationship.terms.id,
                            String(boost.dataValues.id),
                            Boolean(oneTime)
                        )) ?? undefined;
                    if (!claimId) return;
                    // Get boost instance
                    const boostCredential = JSON.parse(boost.dataValues?.boost) as UnsignedVC | VC;

                    // Set the issuer and subject
                    boostCredential.issuer = { id: contractOwnerSigningAuthority.relationship.did };

                    stampIssuanceDate(boostCredential);

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

                    // Send the boost to the consenter
                    if (
                        !(await isAutoBoostConsentCurrent(
                            relationship.contract.id,
                            relationship.terms.id,
                            Boolean(oneTime)
                        ))
                    ) {
                        await releaseAutoBoostClaim(claimId);
                        claimId = undefined;
                        return;
                    }
                    sendStarted = true;
                    await sendBoost({
                        from: { type: 'profile', profile: relationship.contractOwner },
                        to: relationship.consenter,
                        boost: boostRel.target,
                        credential: vc,
                        domain,
                        skipNotification: true,
                        autoAcceptCredential: false,
                        allowConsumedOneTime: Boolean(oneTime),
                        contractTerms: {
                            ...relationship.terms,
                            terms,
                            oneTime: oneTime ?? relationship.terms.oneTime,
                            consentedVersion: version,
                            status: oneTime ? 'consumed' : 'live',
                        },
                        contractWriterProfileId: issuer.profileId,
                    });
                    await completeAutoBoostTransaction(
                        claimId,
                        relationship.terms.id,
                        String(boost.dataValues.id)
                    );
                    claimId = undefined;
                } catch (error) {
                    if (claimId && !sendStarted) await releaseAutoBoostClaim(claimId);
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
    if (
        relationship.terms.status === 'needs_reconsent' ||
        relationship.terms.status === 'suspended'
    ) {
        throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'User has not yet approved the latest version of this contract',
        });
    }
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
        status: oneTime ? 'consumed' : 'live',
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
                        expectedContractVersion: Number(relationship.contract.currentVersion ?? 1),
                        audienceVersion: audienceVersion ?? null,
                        termsMutationVersion: Number(relationship.terms.mutationVersion ?? 0),
                    })
                ),
                relationship.contract.id
            )
                .where(
                    `${audienceVersionWhere} AND coalesce(contract.status, 'active') <> 'retired' AND coalesce(contract.currentVersion, 1) = $expectedContractVersion`
                )
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

    const latestVersion = Number(relationship.contract.currentVersion ?? 1);
    const versionSnapshot = await getConsentFlowContractVersionRecord(
        relationship.contract.id,
        latestVersion
    );
    const configuredAutoBoosts = new Map(
        (versionSnapshot?.autoboosts ?? []).map(config => [config.id, config])
    );
    const autoBoosts = (
        await ConsentFlowContract.findRelationships({
            alias: 'autoReceive',
            where: { source: { id: relationship.contract.id } },
        })
    ).filter(boost => configuredAutoBoosts.has(boost.target.id));

    if (autoBoosts.length > 0) {
        // For each auto-boost, issue it to the consenter
        await Promise.all(
            autoBoosts.map(async boost => {
                let claimId: string | undefined;
                let sendStarted = false;
                try {
                    const config = configuredAutoBoosts.get(boost.target.id)!;
                    const signingAuthorityEndpoint = config.signingAuthorityEndpoint || 'default';
                    const signingAuthorityName = config.signingAuthorityName || 'default';
                    const issuer =
                        (config.issuer && (await getProfileByProfileId(config.issuer))) ||
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
                    claimId =
                        (await claimAutoBoostTransaction(
                            relationship.contract.id,
                            relationship.terms.id,
                            String(boost.target.id),
                            Boolean(oneTime)
                        )) ?? undefined;
                    if (!claimId) return;

                    // Get boost instance
                    const boostCredential = JSON.parse(boost.target.boost) as UnsignedVC | VC;

                    // Set the issuer and subject
                    boostCredential.issuer = { id: contractOwnerSigningAuthority.relationship.did };

                    stampIssuanceDate(boostCredential);

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

                    if (
                        !(await isAutoBoostConsentCurrent(
                            relationship.contract.id,
                            relationship.terms.id,
                            Boolean(oneTime)
                        ))
                    ) {
                        await releaseAutoBoostClaim(claimId);
                        claimId = undefined;
                        return;
                    }
                    sendStarted = true;
                    await sendBoost({
                        from: { type: 'profile', profile: relationship.contractOwner },
                        to: relationship.consenter,
                        boost: boost.target,
                        credential: vc,
                        domain,
                        skipNotification: true,
                        autoAcceptCredential: false,
                        allowConsumedOneTime: Boolean(oneTime),
                        contractTerms: {
                            ...relationship.terms,
                            terms,
                            oneTime: oneTime ?? relationship.terms.oneTime,
                            consentedVersion: latestVersion,
                            status: oneTime ? 'consumed' : 'live',
                        },
                        contractWriterProfileId: issuer.profileId,
                    });
                    await completeAutoBoostTransaction(
                        claimId,
                        relationship.terms.id,
                        String(boost.target.id)
                    );
                    claimId = undefined;
                } catch (error) {
                    if (claimId && !sendStarted) await releaseAutoBoostClaim(claimId);
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
    if (
        relationship.terms.status === 'needs_reconsent' ||
        relationship.terms.status === 'suspended'
    ) {
        throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'User has not yet approved the latest version of this contract',
        });
    }
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
                        expectedContractVersion: Number(relationship.contract.currentVersion ?? 1),
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
                .where(
                    `${audienceVersionWhere} AND coalesce(contract.status, 'active') <> 'retired' AND coalesce(contract.currentVersion, 1) = $expectedContractVersion`
                )
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
    if (!result.records.length)
        throw new TRPCError({
            code: 'CONFLICT',
            message: 'An attributed request already exists for this profile.',
        });
};
