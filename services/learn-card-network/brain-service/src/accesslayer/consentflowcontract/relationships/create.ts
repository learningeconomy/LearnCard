import { appendConsentEvent, tryDispatchContractEvent } from '@helpers/contract-events.helpers';
import {
    ConsentFlowTerms as ConsentFlowTermsType,
    ConsentFlowTransaction,
    ConsentFlowGuardianApproval,
    LCNProfile,
    UnsignedVC,
    VC,
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
import { BoostType } from 'types/boost';
import { flattenObject, inflateObject } from '@helpers/objects.helpers';
import { convertQueryResultToPropertiesObjectArray } from '@helpers/neo4j.helpers';
import {
    reconsentTerms,
    claimAutoBoostTransaction,
    completeAutoBoostTransaction,
    releaseAutoBoostClaim,
    isAutoBoostConsentCurrent,
} from './update';
import { getConsentFlowContractVersionRecord } from '@accesslayer/consentflowcontract/versions';
import { getBoostUri, sendBoost, stampIssuanceDate } from '@helpers/boost.helpers';
import { setCredentialSubjectIds } from '@helpers/credentialSubject.helpers';
import { getDidWeb } from '@helpers/did.helpers';
import { getSigningAuthorityForUserByName } from '@accesslayer/signing-authority/relationships/read';
import { issueCredentialWithSigningAuthority } from '@helpers/signingAuthority.helpers';
import { getProfileByProfileId, getProfilesByProfileIds } from '@accesslayer/profile/read';
import { cloneDeep } from 'lodash';
import { injectObv3AlignmentsIntoCredentialForBoost } from '@services/skills-provider/inject';
import {
    lockContractAudience,
    audienceVersionWhere,
    consentMutationWhere,
    assertAudienceMutation,
    runAudienceMutation,
} from './recipients';

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
    signingAuthority: { endpoint: string; name: string },
    issuer?: string
) => {
    return ConsentFlowContract.relateTo({
        alias: 'autoReceive',
        where: { source: { id: contract.id }, target: { id: boost.id } },
        properties: {
            signingAuthorityEndpoint: signingAuthority.endpoint,
            signingAuthorityName: signingAuthority.name,
            issuer,
        },
    });
};

export const setRelatedBoostForContract = async (
    contract: DbContractType,
    boost: BoostType
): Promise<void> => {
    await ConsentFlowContract.relateTo({
        alias: 'relatedTo',
        where: { source: { id: contract.id }, target: { id: boost.id } },
    });
};

export const consentToContract = async (
    consenter: LCNProfile,
    { contract, contractOwner }: { contract: DbContractType; contractOwner: LCNProfile },
    {
        terms: _terms,
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
        liveSyncing?: boolean;
        oneTime?: boolean;
        guardianApproval?: ConsentFlowGuardianApproval;
        audienceVersion?: number;
        expectedRequestId?: string;
        smartResumeFingerprint?: string;
        acceptVersion?: number;
    },
    domain: string
) => {
    const expectedContractVersion = Number(contract.currentVersion ?? 1);
    const terms = cloneDeep(_terms);
    const deniedWriters: string[] = terms.deniedWriters ?? [];

    if (deniedWriters && deniedWriters.length > 0) {
        const profiles = await getProfilesByProfileIds(deniedWriters);

        if (profiles.length !== deniedWriters.length) {
            const foundProfileIds = new Set(profiles.map(p => p.profileId));
            const missingIds = deniedWriters.filter(id => !foundProfileIds.has(id));
            throw new Error(
                `Could not find profiles for the following denied writer identifiers: ${missingIds.join(
                    ', '
                )}`
            );
        }
        terms.deniedWriters = profiles.map(p => p.profileId);
    }

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
            {
                terms,
                expiresAt,
                oneTime,
                guardianApproval,
                audienceVersion,
                smartResumeFingerprint,
                expectedRequestId,
                acceptVersion,
            },
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

    const result = await runAudienceMutation(
        appendConsentEvent(
            lockContractAudience(
                new QueryBuilder(
                    new BindParam({
                        params: flattenObject({
                            terms,
                            ...(smartResumeFingerprint
                                ? {
                                      smartResumeFingerprint,
                                      smartResumePublicationStatus: 'pending',
                                      smartResumeMutationVersion: 0,
                                  }
                                : {}),
                            ...(guardianApproval ? { guardianApproval } : {}),
                        }),
                        expectedContractVersion,
                        audienceVersion: audienceVersion ?? null,
                        expectedRequestId: expectedRequestId ?? null,
                        consenterProfileId: consenter.profileId,
                    })
                ),
                contract.id
            )
                .where(
                    `${audienceVersionWhere} AND ${consentMutationWhere} AND coalesce(contract.currentVersion, 1) = $expectedContractVersion AND coalesce(contract.status, 'active') <> 'retired'`
                )
                .set('contract.hasConsented = true')
                .with('contract')
                .match({
                    multiple: [
                        {
                            model: Profile,
                            where: { profileId: consenter.profileId },
                            identifier: 'profile',
                        },
                        {
                            model: ConsentFlowContract,
                            where: { id: contract.id },
                            identifier: 'contract',
                        },
                    ],
                })
                .where(
                    'NOT EXISTS { MATCH (profile)-[:CREATED_BY]->(:ConsentFlowTerms)-[:CONSENTS_TO]->(contract) }'
                )
                .create({
                    related: [
                        { identifier: 'profile' },
                        ConsentFlowTerms.getRelationshipByAlias('createdBy'),
                        {
                            model: ConsentFlowTerms,
                            properties: {
                                id: termsId,
                                status: oneTime ? 'consumed' : 'live',
                                consentedVersion: contract.currentVersion ?? 1,
                                createdAt: transaction.date,
                                updatedAt: transaction.date,
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
                .with('terms, contract, transaction'),
            {
                consenterProfileId: consenter.profileId,
                transaction,
                domain,
                messageKey:
                    contract.name === 'AI Insights'
                        ? 'consentFlowInsightsShared'
                        : 'consentFlowTransactionCreated',
            }
        ).return('terms.id AS id')
    );
    assertAudienceMutation(result.records.length);

    const versionSnapshot = await getConsentFlowContractVersionRecord(
        contract.id,
        Number(contract.currentVersion ?? 1)
    );
    const configuredAutoBoosts = new Map(
        (versionSnapshot?.autoboosts ?? []).map(config => [config.id, config])
    );
    const autoBoosts = (
        await ConsentFlowContract.findRelationships({
            alias: 'autoReceive',
            where: { source: { id: contract.id } },
        })
    ).filter(boost => configuredAutoBoosts.has(boost.target.id));

    if (autoBoosts.length > 0) {
        await Promise.all(
            autoBoosts.map(async boost => {
                let claimId: string | undefined;
                try {
                    const config = configuredAutoBoosts.get(boost.target.id)!;
                    const signingAuthorityEndpoint = config.signingAuthorityEndpoint || 'default';
                    const signingAuthorityName = config.signingAuthorityName || 'default';
                    const issuer =
                        (config.issuer && (await getProfileByProfileId(config.issuer))) ||
                        contractOwner;

                    if (terms.deniedWriters?.includes(issuer.profileId)) return;

                    const boostCategory = boost.target.category;
                    if (boostCategory) {
                        const categoryWritePermission =
                            terms.write?.credentials?.categories?.[boostCategory];

                        if (!categoryWritePermission) return;

                        if (categoryWritePermission !== true) return;
                    }
                    claimId =
                        (await claimAutoBoostTransaction(
                            contract.id,
                            termsId,
                            String(boost.target.id),
                            Boolean(oneTime)
                        )) ?? undefined;
                    if (!claimId) return;

                    const contractOwnerSigningAuthority = await getSigningAuthorityForUserByName(
                        issuer,
                        signingAuthorityEndpoint,
                        signingAuthorityName
                    );

                    if (!contractOwnerSigningAuthority) {
                        await releaseAutoBoostClaim(claimId);
                        claimId = undefined;
                        console.error(
                            `Signing authority "${signingAuthorityName}" at endpoint "${signingAuthorityEndpoint}" not found for contract owner`
                        );
                        return;
                    }

                    const boostCredential = JSON.parse(boost.target.boost) as UnsignedVC | VC;

                    boostCredential.issuer = { id: contractOwnerSigningAuthority.relationship.did };

                    stampIssuanceDate(boostCredential);

                    if (boostCredential.type.includes('BoostCredential')) {
                        boostCredential.boostId = getBoostUri(boost.target.id, domain);
                    }

                    setCredentialSubjectIds(
                        boostCredential,
                        getDidWeb(domain, consenter.profileId)
                    );

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
                        [getDidWeb(domain, contractOwner.profileId)]
                    );

                    const termsResult = await new QueryBuilder()
                        .match({
                            identifier: 'terms',
                            model: ConsentFlowTerms,
                            where: { id: termsId },
                        })
                        .return('terms')
                        .run();
                    const updatedTerms = termsResult.records[0]?.get('terms')
                        .properties as FlatDbTermsType;
                    if (
                        !(await isAutoBoostConsentCurrent(contract.id, termsId, Boolean(oneTime)))
                    ) {
                        await releaseAutoBoostClaim(claimId);
                        claimId = undefined;
                        return;
                    }
                    await sendBoost({
                        from: { type: 'profile', profile: contractOwner },
                        to: consenter,
                        boost: boost.target,
                        credential: vc,
                        domain,
                        skipNotification: true,
                        autoAcceptCredential: false,
                        contractTerms: inflateObject(updatedTerms),
                        contractWriterProfileId: issuer.profileId,
                        allowConsumedOneTime: Boolean(oneTime),
                    });
                    await completeAutoBoostTransaction(claimId, termsId, String(boost.target.id));
                    claimId = undefined;
                } catch (error) {
                    if (claimId) await releaseAutoBoostClaim(claimId);
                    console.error('Error processing auto-boost:', error);
                }
            })
        );
    }

    await tryDispatchContractEvent(transaction.id);

    return result.summary.counters.containsUpdates();
};
