import {
    ConsentFlowTerms as ConsentFlowTermsType,
    ConsentFlowTransaction,
    LCNNotificationTypeEnumValidator,
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
import { reconsentTerms } from './update';
import { addNotificationToQueue } from '@helpers/notifications.helpers';
import { sendBoost } from '@helpers/boost.helpers';
import { getBoostUri } from '@helpers/boost.helpers';
import { getDidWeb } from '@helpers/did.helpers';
import { getSigningAuthorityForUserByName } from '@accesslayer/signing-authority/relationships/read';
import { issueCredentialWithSigningAuthority } from '@helpers/signingAuthority.helpers';
import { getProfileByProfileId, getProfilesByProfileIds } from '@accesslayer/profile/read';
import { cloneDeep } from 'lodash';

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

export const consentToContract = async (
    consenter: LCNProfile,
    { contract, contractOwner }: { contract: DbContractType; contractOwner: LCNProfile },
    {
        terms: _terms,
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

    const autoBoosts = await ConsentFlowContract.findRelationships({
        alias: 'autoReceive',
        where: { source: { id: contract.id } },
    });

    if (autoBoosts.length > 0) {
        await Promise.all(
            autoBoosts.map(async boost => {
                try {
                    const signingAuthorityEndpoint =
                        boost.relationship?.signingAuthorityEndpoint || 'default';
                    const signingAuthorityName =
                        boost.relationship?.signingAuthorityName || 'default';

                    const issuer =
                        (boost.relationship?.issuer &&
                            (await getProfileByProfileId(boost.relationship.issuer))) ||
                        contractOwner;

                    if (terms.deniedWriters?.includes(issuer.profileId)) return;

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

                    const boostCredential = JSON.parse(boost.target.boost) as UnsignedVC | VC;

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
                        boostCredential.credentialSubject.id = getDidWeb(
                            domain,
                            consenter.profileId
                        );
                    }

                    const vc = await issueCredentialWithSigningAuthority(
                        issuer,
                        boostCredential,
                        contractOwnerSigningAuthority,
                        domain,
                        false
                    );

                    const boostTransaction = {
                        id: uuid(),
                        action: 'write',
                        date: new Date().toISOString(),
                    } as const satisfies ConsentFlowTransaction;

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

                    const updatedTerms = termsResult.records[0]?.get('terms')
                        .properties as FlatDbTermsType;

                    await sendBoost({
                        from: contractOwner,
                        to: consenter,
                        boost: boost.target,
                        credential: vc,
                        domain,
                        skipNotification: true,
                        autoAcceptCredential: false,
                        contractTerms: inflateObject(updatedTerms),
                    });
                } catch (error) {
                    console.error('Error processing auto-boost:', error);
                }
            })
        );
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
