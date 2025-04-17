import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { t, profileRoute, openRoute } from '@routes';
import {
    ConsentFlowContractValidator,
    ConsentFlowContractDetailsValidator,
    ConsentFlowContractQueryValidator,
    ConsentFlowTermsValidator,
    ConsentFlowTermsQueryValidator,
    PaginationOptionsValidator,
    PaginatedConsentFlowContractsValidator,
    PaginatedConsentFlowTermsValidator,
    ConsentFlowTransactionsQueryValidator,
    PaginatedConsentFlowTransactionsValidator,
    PaginatedConsentFlowDataValidator,
    ConsentFlowDataQueryValidator,
    ConsentFlowDataForDidQueryValidator,
    PaginatedConsentFlowDataForDidValidator,
    PaginatedContractCredentialsValidator,
    VCValidator,
    JWEValidator,
    UnsignedVC,
    VC,
    JWE,
    AutoBoostConfigValidator,
} from '@learncard/types';
import { createConsentFlowContract } from '@accesslayer/consentflowcontract/create';
import {
    getAutoBoostsForContract,
    getConsentFlowContractsForProfile,
    getConsentedContractsForProfile,
    getConsentedDataBetweenProfiles,
    getConsentedDataForContract,
    getConsentedDataForProfile,
    getContractDetailsByUri,
    getContractTermsByUri,
    getContractTermsForProfile,
    getTransactionsForTerms,
    hasProfileConsentedToContract,
    isProfileConsentFlowContractAdmin,
} from '@accesslayer/consentflowcontract/relationships/read';
import { constructUri, getIdFromUri } from '@helpers/uri.helpers';
import { getContractByUri } from '@accesslayer/consentflowcontract/read';
import { deleteStorageForUri } from '@cache/storage';
import { deleteConsentFlowContract } from '@accesslayer/consentflowcontract/delete';
import { areTermsValid } from '@helpers/contract.helpers';
import { updateDidForProfile } from '@helpers/did.helpers';
import {
    syncCredentialsToContract,
    updateTerms,
    withdrawTerms,
} from '@accesslayer/consentflowcontract/relationships/update';
import {
    consentToContract,
    setAutoBoostForContract,
    setCreatorForContract,
} from '@accesslayer/consentflowcontract/relationships/create';
import { getProfileByDid } from '@accesslayer/profile/read';
import { sendBoost, isDraftBoost } from '@helpers/boost.helpers';
import { isRelationshipBlocked } from '@helpers/connection.helpers';
import { getBoostByUri } from '@accesslayer/boost/read';
import { canProfileIssueBoost } from '@accesslayer/boost/relationships/read';
import {
    getCredentialsForContractTerms,
    getAllCredentialsForProfileTerms,
} from '@accesslayer/credential/relationships/read';
import { getCredentialUri } from '@helpers/credential.helpers';
import { getSigningAuthorityForUserByName } from '@accesslayer/signing-authority/relationships/read';
import { getDidWeb } from '@helpers/did.helpers';
import { issueCredentialWithSigningAuthority } from '@helpers/signingAuthority.helpers';

export const contractsRouter = t.router({
    createConsentFlowContract: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/consent-flow-contract',
                tags: ['Consent Flow Contracts'],
                summary: 'Create Consent Flow Contract',
                description: 'Creates a Consent Flow Contract for a profile',
            },
            requiredScope: 'contracts:write',
        })
        .input(
            z.object({
                contract: ConsentFlowContractValidator,
                name: z.string(),
                subtitle: z.string().optional(),
                description: z.string().optional(),
                reasonForAccessing: z.string().optional(),
                needsGuardianConsent: z.boolean().optional(),
                redirectUrl: z.string().optional(),
                frontDoorBoostUri: z.string().optional(),
                image: z.string().optional(),
                expiresAt: z.string().optional(),
                autoboosts: z.array(AutoBoostConfigValidator).optional(),
            })
        )
        .output(z.string())
        .mutation(async ({ input, ctx }) => {
            const {
                contract,
                name,
                subtitle,
                description,
                reasonForAccessing,
                needsGuardianConsent,
                redirectUrl,
                frontDoorBoostUri,
                image,
                expiresAt,
                autoboosts,
            } = input;

            // Create ConsentFlow instance
            const createdContract = await createConsentFlowContract({
                contract,
                name,
                subtitle,
                description,
                reasonForAccessing,
                needsGuardianConsent,
                redirectUrl,
                frontDoorBoostUri,
                image,
                expiresAt,
            });

            // Get profile by profileId
            await setCreatorForContract(createdContract, ctx.user.profile);

            if (autoboosts && autoboosts.length > 0) {
                for (const autoboost of autoboosts) {
                    const { boostUri, signingAuthority } = autoboost;

                    const boost = await getBoostByUri(boostUri);

                    if (!boost) {
                        throw new TRPCError({
                            code: 'NOT_FOUND',
                            message: `Could not find boost: ${boostUri}`,
                        });
                    }

                    if (!(await canProfileIssueBoost(ctx.user.profile, boost))) {
                        throw new TRPCError({
                            code: 'UNAUTHORIZED',
                            message: `Profile does not have permissions to issue boost: ${boostUri}`,
                        });
                    }

                    if (isDraftBoost(boost)) {
                        throw new TRPCError({
                            code: 'FORBIDDEN',
                            message:
                                'Can not generate claim links for Draft Boosts. Claim links can only be generated for Published Boosts.',
                        });
                    }

                    // Verify the signing authority exists for this user
                    const signingAuthorityExists = await getSigningAuthorityForUserByName(
                        ctx.user.profile,
                        signingAuthority.endpoint,
                        signingAuthority.name
                    );

                    if (!signingAuthorityExists) {
                        throw new TRPCError({
                            code: 'BAD_REQUEST',
                            message: `Signing authority "${signingAuthority.name}" at endpoint "${signingAuthority.endpoint}" not found for this profile`,
                        });
                    }

                    await setAutoBoostForContract(createdContract, boost, signingAuthority);
                }
            }

            return constructUri('contract', createdContract.id, ctx.domain);
        }),

    getConsentFlowContract: openRoute
        .meta({
            openapi: {
                protect: true,
                method: 'GET',
                path: '/consent-flow-contract/{uri}',
                tags: ['Consent Flow Contracts'],
                summary: 'Get Consent Flow Contracts',
                description: 'Gets Consent Flow Contract Details',
            },
            requiredScope: 'contracts:read',
        })
        .input(z.object({ uri: z.string() }))
        .output(ConsentFlowContractDetailsValidator)
        .query(async ({ input, ctx }) => {
            const { uri } = input;

            const result = await getContractDetailsByUri(uri);

            if (!result) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Could not find contract' });
            }

            const autoboosts = await getAutoBoostsForContract(result.contract.id, ctx.domain);

            return {
                owner: updateDidForProfile(ctx.domain, result.contractOwner),
                contract: result.contract.contract,
                name: result.contract.name,
                subtitle: result.contract.subtitle,
                description: result.contract.description,
                reasonForAccessing: result.contract.reasonForAccessing,
                needsGuardianConsent: result.contract.needsGuardianConsent,
                redirectUrl: result.contract.redirectUrl,
                frontDoorBoostUri: result.contract.frontDoorBoostUri,
                image: result.contract.image,
                createdAt: result.contract.createdAt,
                updatedAt: result.contract.updatedAt,
                uri: constructUri('contract', result.contract.id, ctx.domain),
                ...(result.contract.expiresAt ? { expiresAt: result.contract.expiresAt } : {}),
                autoBoosts: autoboosts,
            };
        }),

    getConsentFlowContracts: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/consent-flow-contracts',
                tags: ['Consent Flow Contracts'],
                summary: 'Get Consent Flow Contracts',
                description: 'Gets Consent Flow Contracts for a profile',
            },
            requiredScope: 'contracts:read',
        })
        .input(
            PaginationOptionsValidator.extend({
                query: ConsentFlowContractQueryValidator.default({}),
                limit: PaginationOptionsValidator.shape.limit.default(25),
            }).default({})
        )
        .output(PaginatedConsentFlowContractsValidator)
        .query(async ({ input, ctx }) => {
            const { query, limit, cursor } = input;
            const { profile } = ctx.user;

            const results = await getConsentFlowContractsForProfile(profile, {
                query,
                limit: limit + 1,
                cursor,
                domain: ctx.domain,
            });
            const contracts = results.slice(0, limit);

            const hasMore = results.length > limit;
            const nextCursor = contracts.at(-1)?.contract.updatedAt;

            return {
                hasMore,
                cursor: nextCursor,
                records: contracts.map(({ contract, autoBoosts }) => ({
                    contract: contract.contract,
                    name: contract.name,
                    subtitle: contract.subtitle,
                    description: contract.description,
                    reasonForAccessing: contract.reasonForAccessing,
                    needsGuardianConsent: contract.needsGuardianConsent,
                    redirectUrl: contract.redirectUrl,
                    frontDoorBoostUri: contract.frontDoorBoostUri,
                    image: contract.image,
                    createdAt: contract.createdAt,
                    updatedAt: contract.updatedAt,
                    uri: constructUri('contract', contract.id, ctx.domain),
                    ...(contract.expiresAt ? { expiresAt: contract.expiresAt } : {}),
                    autoBoosts,
                })),
            };
        }),

    deleteConsentFlowContract: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'DELETE',
                path: '/consent-flow-contract/{uri}',
                tags: ['Consent Flow Contracts'],
                summary: 'Delete a Consent Flow Contract',
                description: 'This route deletes a Consent Flow Contract',
            },
            requiredScope: 'contracts:delete',
        })
        .input(z.object({ uri: z.string() }))
        .output(z.boolean())
        .mutation(async ({ ctx, input }) => {
            const { profile } = ctx.user;

            const { uri } = input;

            const contract = await getContractByUri(uri);

            if (!contract) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Could not find contract' });
            }

            if (!(await isProfileConsentFlowContractAdmin(profile, contract))) {
                throw new TRPCError({
                    code: 'UNAUTHORIZED',
                    message: 'Profile does not own contract',
                });
            }
            await Promise.all([deleteConsentFlowContract(contract), deleteStorageForUri(uri)]);

            return true;
        }),

    getConsentedDataForContract: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/consent-flow-contract/{uri}/data',
                tags: ['Consent Flow Contracts'],
                summary: 'Get the data that has been consented for a contract',
                description: 'This route grabs all the data that has been consented for a contract',
            },
            requiredScope: 'contracts-data:read',
        })
        .input(
            PaginationOptionsValidator.extend({
                uri: z.string(),
                query: ConsentFlowDataQueryValidator.default({}),
                limit: PaginationOptionsValidator.shape.limit.default(25),
            })
        )
        .output(PaginatedConsentFlowDataValidator)
        .query(async ({ ctx, input }) => {
            const { profile } = ctx.user;

            const { uri, query, limit, cursor } = input;

            const contract = await getContractByUri(uri);

            if (!contract) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Could not find contract' });
            }

            if (!(await isProfileConsentFlowContractAdmin(profile, contract))) {
                throw new TRPCError({
                    code: 'UNAUTHORIZED',
                    message: 'Profile does not own contract',
                });
            }

            const contractId = getIdFromUri(uri);

            const results = await getConsentedDataForContract(contractId, {
                query,
                limit: limit + 1,
                cursor,
            });

            const data = results.slice(0, limit);

            const hasMore = results.length > limit;
            const nextCursor = data.at(-1)?.date;

            return {
                hasMore,
                cursor: nextCursor,
                records: data,
            };
        }),

    getConsentedDataForDid: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/consent-flow-contract/data/{did}',
                tags: ['Consent Flow Contracts'],
                summary: 'Get the data that has been consented by a did',
                description: 'This route grabs all the data that has been consented by a did',
            },
            requiredScope: 'contracts-data:read',
        })
        .input(
            PaginationOptionsValidator.extend({
                did: z.string(),
                query: ConsentFlowDataForDidQueryValidator.default({}),
                limit: PaginationOptionsValidator.shape.limit.default(25),
            })
        )
        .output(PaginatedConsentFlowDataForDidValidator)
        .query(async ({ ctx, input }) => {
            const { profile } = ctx.user;

            const { did, query, limit, cursor } = input;

            const otherProfile = await getProfileByDid(did);

            if (!otherProfile) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Could not find profile for did',
                });
            }

            const results = await getConsentedDataBetweenProfiles(
                profile.profileId,
                otherProfile.profileId,
                { query, limit: limit + 1, cursor, domain: ctx.domain }
            );

            const data = results.slice(0, limit);

            const hasMore = results.length > limit;
            const nextCursor = data.at(-1)?.date;

            return {
                hasMore,
                cursor: nextCursor,
                records: data,
            };
        }),

    getConsentedData: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/consent-flow-contract/data',
                tags: ['Consent Flow Contracts'],
                summary: 'Get the data that has been consented for all of your contracts',
                description:
                    'This route grabs all the data that has been consented for all of your contracts',
            },
            requiredScope: 'contracts-data:read',
        })
        .input(
            PaginationOptionsValidator.extend({
                limit: PaginationOptionsValidator.shape.limit.default(25),
                query: ConsentFlowDataQueryValidator.default({}),
            }).default({})
        )
        .output(PaginatedConsentFlowDataValidator)
        .query(async ({ ctx, input }) => {
            const { profile } = ctx.user;

            const { query, limit, cursor } = input;

            const results = await getConsentedDataForProfile(profile.profileId, {
                query,
                limit: limit + 1,
                cursor,
            });

            const data = results.slice(0, limit);

            const hasMore = results.length > limit;
            const nextCursor = data.at(-1)?.date;

            return {
                hasMore,
                cursor: nextCursor,
                records: data,
            };
        }),

    writeCredentialToContract: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/consent-flow-contract/write/{contractUri}/{did}',
                tags: ['Consent Flow Contracts'],
                summary: 'Writes a boost credential to a did that has consented to a contract',
                description: 'Writes a boost credential to a did that has consented to a contract',
            },
            requiredScope: 'contracts-data:write',
        })
        .input(
            z.object({
                did: z.string(),
                contractUri: z.string(),
                boostUri: z.string(),
                credential: VCValidator.or(JWEValidator),
            })
        )
        .output(z.string())
        .mutation(async ({ ctx, input }) => {
            const { profile } = ctx.user;
            const { domain } = ctx;
            const { did, contractUri, boostUri, credential } = input;

            // Get the other profile by DID
            const otherProfile = await getProfileByDid(did);
            if (!otherProfile) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Profile not found. Are you sure this person exists?',
                });
            }

            // Check if relationship is blocked
            const isBlocked = await isRelationshipBlocked(profile, otherProfile);
            if (isBlocked) {
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message: 'Profile not found. Are you sure this person exists?',
                });
            }

            // Get contract details
            const contractDetails = await getContractDetailsByUri(contractUri);
            if (!contractDetails) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Could not find contract',
                });
            }

            // Verify if the other profile has consented to the contract
            if (!(await hasProfileConsentedToContract(otherProfile, contractDetails.contract))) {
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message: 'Target profile has not consented to this contract',
                });
            }

            // Get the boost and verify permissions (similar to sendBoost)
            const boost = await getBoostByUri(boostUri);
            if (!boost) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Could not find boost',
                });
            }

            // Verify the user has permission to issue this boost
            if (!(await canProfileIssueBoost(profile, boost))) {
                throw new TRPCError({
                    code: 'UNAUTHORIZED',
                    message: 'Profile does not have permissions to issue boost',
                });
            }

            if (isDraftBoost(boost)) {
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message: 'Draft Boosts can not be sent. Only Published Boosts can be sent.',
                });
            }

            // Check if this boost category is allowed in the contract's terms
            const terms = await getContractTermsForProfile(otherProfile, contractDetails.contract);
            if (!terms) {
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message: 'Target profile has not consented to this contract',
                });
            }

            // Check if the boost category is included in the contract terms
            const boostCategory = boost.category;
            if (boostCategory) {
                const categoryAllowed = terms.terms.write?.credentials?.categories?.[boostCategory];
                if (!categoryAllowed) {
                    throw new TRPCError({
                        code: 'FORBIDDEN',
                        message: `Target profile has not consented to receive boosts in the ${boostCategory} category`,
                    });
                }
            }

            // Use the sendBoost helper to issue the credential with contract relationship
            return sendBoost({
                from: profile,
                to: otherProfile,
                boost,
                credential,
                domain,
                skipNotification: true,
                autoAcceptCredential: false,
                contractTerms: terms,
            });
        }),

    writeCredentialToContractViaSigningAuthority: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/consent-flow-contract/write/via-signing-authority/{contractUri}/{did}',
                tags: ['Consent Flow Contracts'],
                summary:
                    'Write credential through signing authority for a DID consented to a contract',
                description:
                    'Issues and sends a boost credential via a registered signing authority to a DID that has consented to a contract.',
            },
            requiredScope: 'contracts:write',
        })
        .input(
            z.object({
                did: z.string(),
                contractUri: z.string(),
                boostUri: z.string(),
                signingAuthority: z.object({
                    name: z.string(),
                    endpoint: z.string(),
                }),
            })
        )
        .output(z.string())
        .mutation(async ({ ctx, input }) => {
            const { profile } = ctx.user;
            const { did, contractUri, boostUri, signingAuthority } = input;

            // Get recipient profile
            const otherProfile = await getProfileByDid(did);
            if (!otherProfile) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Profile not found. Are you sure this person exists?',
                });
            }

            // Check blocked relationship
            const isBlocked = await isRelationshipBlocked(profile, otherProfile);
            if (isBlocked) {
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message: 'Profile not found. Are you sure this person exists?',
                });
            }

            // Get contract details
            const contractDetails = await getContractDetailsByUri(contractUri);
            if (!contractDetails) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Could not find contract' });
            }

            // Verify consent
            if (!(await hasProfileConsentedToContract(otherProfile, contractDetails.contract))) {
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message: 'Target profile has not consented to this contract',
                });
            }

            // Get boost and verify permissions
            const boost = await getBoostByUri(boostUri);
            if (!boost) throw new TRPCError({ code: 'NOT_FOUND', message: 'Could not find boost' });
            if (!(await canProfileIssueBoost(profile, boost))) {
                throw new TRPCError({
                    code: 'UNAUTHORIZED',
                    message: 'Profile does not have permissions to issue boost',
                });
            }
            if (isDraftBoost(boost)) {
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message: 'Draft Boosts can not be sent. Only Published Boosts can be sent.',
                });
            }

            // Get contract terms
            const terms = await getContractTermsForProfile(otherProfile, contractDetails.contract);
            if (!terms) {
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message: 'Target profile has not consented to this contract',
                });
            }

            // Check category allowed
            const boostCategory = boost.category;
            if (boostCategory) {
                const categoryAllowed = terms.terms.write?.credentials?.categories?.[boostCategory];
                if (!categoryAllowed) {
                    throw new TRPCError({
                        code: 'FORBIDDEN',
                        message: `Target profile has not consented to receive boosts in the ${boostCategory} category`,
                    });
                }
            }

            // Prepare unsigned VC
            let unsignedVc: UnsignedVC;
            try {
                unsignedVc = JSON.parse(boost.dataValues.boost);
                unsignedVc.issuanceDate = new Date().toISOString();
                unsignedVc.issuer = { id: getDidWeb(ctx.domain, profile.profileId) };
                if (Array.isArray(unsignedVc.credentialSubject)) {
                    unsignedVc.credentialSubject = unsignedVc.credentialSubject.map(subject => ({
                        ...subject,
                        id: getDidWeb(ctx.domain, otherProfile.profileId),
                    }));
                } else {
                    unsignedVc.credentialSubject = {
                        ...unsignedVc.credentialSubject,
                        id: getDidWeb(ctx.domain, otherProfile.profileId),
                    };
                }
                if (unsignedVc?.type?.includes('BoostCredential')) unsignedVc.boostId = boostUri;
            } catch (e) {
                console.error('Failed to parse boost', e);
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'Failed to parse boost',
                });
            }

            // Get signing authority
            const sa = await getSigningAuthorityForUserByName(
                profile,
                signingAuthority.endpoint,
                signingAuthority.name
            );
            if (!sa) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Could not find signing authority for boost',
                });
            }

            // Issue VC with signing authority
            let credential: VC | JWE;
            try {
                credential = await issueCredentialWithSigningAuthority(
                    profile,
                    unsignedVc,
                    sa,
                    ctx.domain
                );
            } catch (e) {
                console.error('Failed to issue VC with signing authority', e);
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'Could not issue VC with signing authority',
                });
            }

            // Send the boost
            return sendBoost({
                from: profile,
                to: otherProfile,
                boost,
                credential,
                domain: ctx.domain,
                skipNotification: true,
                autoAcceptCredential: false,
                contractTerms: terms,
            });
        }),

    consentToContract: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/consent-flow-contract/consent/{contractUri}',
                tags: ['Consent Flow Contracts'],
                summary: 'Consent To Contract',
                description: 'Consents to a Contract with a hard set of terms',
            },
            requiredScope: 'contracts:write',
        })
        .input(
            z.object({
                terms: ConsentFlowTermsValidator,
                contractUri: z.string(),
                expiresAt: z.string().optional(),
                oneTime: z.boolean().optional(),
            })
        )
        .output(z.string())
        .mutation(async ({ input, ctx }) => {
            const { profile } = ctx.user;

            const { terms, contractUri, expiresAt, oneTime } = input;

            const contractDetails = await getContractDetailsByUri(contractUri);

            if (!contractDetails) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Could not find contract' });
            }

            if (await hasProfileConsentedToContract(profile, contractDetails.contract)) {
                throw new TRPCError({
                    code: 'CONFLICT',
                    message: "You've already consented to this contract!",
                });
            }

            if (!areTermsValid(terms, contractDetails.contract.contract)) {
                throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid Terms for Contract' });
            }

            await consentToContract(
                profile,
                contractDetails,
                { terms, expiresAt, oneTime },
                ctx.domain
            );

            const relationship = await getContractTermsForProfile(
                profile,
                contractDetails.contract
            );

            if (!relationship) {
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'Internal Error. Could not find the newly created terms ',
                });
            }

            return constructUri('terms', relationship.id, ctx.domain);
        }),

    getConsentedContracts: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/consent-flow-contracts/consent',
                tags: ['Consent Flow Contracts'],
                summary: 'Gets Consented Contracts',
                description: 'Gets all consented contracts for a user',
            },
            requiredScope: 'contracts:read',
        })
        .input(
            PaginationOptionsValidator.extend({
                query: ConsentFlowTermsQueryValidator.default({}),
                limit: PaginationOptionsValidator.shape.limit.default(25),
            }).default({})
        )
        .output(PaginatedConsentFlowTermsValidator)
        .query(async ({ input, ctx }) => {
            const { profile } = ctx.user;

            const { query, limit, cursor } = input;

            const results = await getConsentedContractsForProfile(profile, {
                query,
                limit: limit + 1,
                cursor,
                domain: ctx.domain,
            });

            const contracts = results.slice(0, limit);

            const hasMore = results.length > limit;
            const nextCursor = contracts.at(-1)?.terms.updatedAt;

            return {
                hasMore,
                cursor: nextCursor,
                records: contracts.map(record => ({
                    contract: {
                        contract: record.contract.contract,
                        name: record.contract.name,
                        subtitle: record.contract.subtitle,
                        description: record.contract.description,
                        reasonForAccessing: record.contract.reasonForAccessing,
                        needsGuardianConsent: record.contract.needsGuardianConsent,
                        redirectUrl: record.contract.redirectUrl,
                        frontDoorBoostUri: record.contract.frontDoorBoostUri,
                        image: record.contract.image,
                        createdAt: record.contract.createdAt,
                        updatedAt: record.contract.updatedAt,
                        uri: constructUri('contract', record.contract.id, ctx.domain),
                        owner: updateDidForProfile(ctx.domain, record.owner),
                        ...(record.contract.expiresAt
                            ? { expiresAt: record.contract.expiresAt }
                            : {}),
                        autoBoosts: record.autoBoosts,
                    },
                    uri: constructUri('terms', record.terms.id, ctx.domain),
                    terms: record.terms.terms,
                    ...(record.terms.expiresAt ? { expiresAt: record.terms.expiresAt } : {}),
                    ...(record.terms.oneTime ? { oneTime: record.terms.oneTime } : {}),
                    consenter: updateDidForProfile(ctx.domain, profile),
                    status: record.terms.status,
                })),
            };
        }),

    updateConsentedContractTerms: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/consent-flow-contract/consent/update/{uri}',
                tags: ['Consent Flow Contracts'],
                summary: 'Updates Contract Terms',
                description: 'Updates the terms for a consented contract',
            },
            requiredScope: 'contracts:write',
        })
        .input(
            z.object({
                uri: z.string(),
                terms: ConsentFlowTermsValidator,
                expiresAt: z.string().optional(),
                oneTime: z.boolean().optional(),
            })
        )
        .output(z.boolean())
        .mutation(async ({ ctx, input }) => {
            const { profile } = ctx.user;

            const { uri, terms, expiresAt, oneTime } = input;

            const relationship = await getContractTermsByUri(uri);

            if (!relationship) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Could not find contract terms',
                });
            }

            if (relationship.consenter.profileId !== profile.profileId) {
                throw new TRPCError({
                    code: 'UNAUTHORIZED',
                    message: 'Profile does not own terms',
                });
            }

            if (!areTermsValid(terms, relationship.contract.contract)) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: 'New Terms are invalid for Contract',
                });
            }

            await Promise.all([
                updateTerms(relationship, { terms, expiresAt, oneTime }, ctx.domain),
                deleteStorageForUri(uri),
            ]);

            return true;
        }),

    withdrawConsent: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'DELETE',
                path: '/consent-flow-contract/consent/withdraw/{uri}',
                tags: ['Consent Flow Contracts'],
                summary: 'Deletes Contract Terms',
                description: 'Withdraws consent by deleting Contract Terms',
            },
            requiredScope: 'contracts:write',
        })
        .input(z.object({ uri: z.string() }))
        .output(z.boolean())
        .mutation(async ({ ctx, input }) => {
            const { profile } = ctx.user;

            const { uri } = input;

            const relationship = await getContractTermsByUri(uri);

            if (!relationship) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Could not find contract terms',
                });
            }

            if (relationship.consenter.profileId !== profile.profileId) {
                throw new TRPCError({
                    code: 'UNAUTHORIZED',
                    message: 'Profile does not own terms',
                });
            }

            await Promise.all([withdrawTerms(relationship), deleteStorageForUri(uri)]);

            return true;
        }),

    getTermsTransactionHistory: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/consent-flow-contract/consent/history/{uri}',
                tags: ['Consent Flow Contracts'],
                summary: 'Gets Transaction History',
                description:
                    'Gets the transaction history for a set of Consent Flow Contract Terms',
            },
            requiredScope: 'contracts:read',
        })
        .input(
            PaginationOptionsValidator.extend({
                uri: z.string(),
                query: ConsentFlowTransactionsQueryValidator.default({}),
                limit: PaginationOptionsValidator.shape.limit.default(25),
            })
        )
        .output(PaginatedConsentFlowTransactionsValidator)
        .query(async ({ input, ctx }) => {
            const { profile } = ctx.user;
            const { uri, query, limit, cursor } = input;

            const relationship = await getContractTermsByUri(uri);

            if (!relationship) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Could not find contract terms',
                });
            }

            if (relationship.consenter.profileId !== profile.profileId) {
                throw new TRPCError({
                    code: 'UNAUTHORIZED',
                    message: 'Profile does not own terms',
                });
            }

            const termsId = getIdFromUri(uri);

            const results = await getTransactionsForTerms(termsId, {
                query,
                limit: limit + 1,
                cursor,
            });

            const transactions = results.slice(0, limit);

            const hasMore = results.length > limit;
            const nextCursor = transactions.at(-1)?.date;

            return {
                hasMore,
                cursor: nextCursor,
                records: transactions.map(transaction => {
                    const { credentials, ...rest } = transaction;

                    return {
                        ...rest,
                        uris: credentials.map(credential =>
                            getCredentialUri(credential.id, ctx.domain)
                        ),
                    };
                }),
            };
        }),

    verifyConsent: openRoute
        .meta({
            openapi: {
                protect: true,
                method: 'GET',
                path: '/consent-flow-contract/verify/{uri}',
                tags: ['Consent Flow Contracts'],
                summary: 'Verifies that a profile has consented to a contract',
                description: 'Withdraws consent by deleting Contract Terms',
            },
            requiredScope: 'contracts:read',
        })
        .input(z.object({ uri: z.string(), profileId: z.string() }))
        .output(z.boolean())
        .query(async ({ input }) => {
            const { uri, profileId } = input;

            const contract = await getContractByUri(uri);

            if (!contract) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Could not find contract' });
            }

            if (contract.expiresAt && new Date() > new Date(contract.expiresAt)) return false;

            const terms = await getContractTermsForProfile(profileId, contract);

            if (!terms) return false;

            if (terms.status !== 'live') return false;

            if (terms.expiresAt && new Date() > new Date(terms.expiresAt)) return false;

            return true;
        }),

    syncCredentialsToContract: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/consent-flow-contract/sync/{termsUri}',
                tags: ['Consent Flow Contracts'],
                summary: 'Sync credentials to a contract',
                description: 'Syncs credentials to a contract that the profile has consented to',
            },
            requiredScope: 'contracts-data:write',
        })
        .input(
            z.object({
                termsUri: z.string(),
                categories: z.record(z.string().array()),
            })
        )
        .output(z.boolean())
        .mutation(async ({ ctx, input }) => {
            const { profile } = ctx.user;
            const { termsUri, categories } = input;

            // Verify the terms exist and belong to this profile
            const relationship = await getContractTermsByUri(termsUri);

            if (!relationship) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Could not find contract terms',
                });
            }

            if (relationship.consenter.profileId !== profile.profileId) {
                throw new TRPCError({
                    code: 'UNAUTHORIZED',
                    message: 'Profile does not own these terms',
                });
            }

            // Check if the terms are still live
            if (relationship.terms.status !== 'live') {
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message: 'Cannot sync credentials to withdrawn or stale terms',
                });
            }

            // Check if the terms have expired
            if (
                relationship.terms.expiresAt &&
                new Date() > new Date(relationship.terms.expiresAt)
            ) {
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message: 'Cannot sync credentials to expired terms',
                });
            }

            // Verify all categories exist in the contract
            const contractCategories = relationship.contract.contract.read?.credentials?.categories;
            if (!contractCategories) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: 'Contract does not define any credential categories',
                });
            }

            // Check each category exists in the contract
            for (const category of Object.keys(categories)) {
                if (!contractCategories[category]) {
                    throw new TRPCError({
                        code: 'BAD_REQUEST',
                        message: `Category "${category}" is not defined in the contract`,
                    });
                }
            }

            // Ensure there are credentials to sync
            const totalCredentials = Object.values(categories).reduce(
                (total, uris) => total + uris.length,
                0
            );
            if (totalCredentials === 0) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: 'No credentials provided to sync',
                });
            }

            // Sync the credentials
            const result = await syncCredentialsToContract(relationship, categories);

            return result;
        }),

    getCredentialsForContract: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/consent-flow-contract/{termsUri}/credentials',
                tags: ['Consent Flow Contracts'],
                summary: 'Get credentials issued via a contract',
                description: 'Gets all credentials that were issued via a contract',
            },
            requiredScope: 'contracts-data:read',
        })
        .input(
            PaginationOptionsValidator.extend({
                termsUri: z.string(),
                includeReceived: z.boolean().default(true),
                limit: PaginationOptionsValidator.shape.limit.default(25),
            })
        )
        .output(PaginatedContractCredentialsValidator)
        .query(async ({ ctx, input }) => {
            const { profile } = ctx.user;
            const { domain } = ctx;
            const { termsUri, includeReceived, limit, cursor } = input;

            // Verify the terms exist and belong to this profile
            const terms = await getContractTermsByUri(termsUri);
            if (!terms) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Could not find contract terms',
                });
            }

            if (terms.consenter.profileId !== profile.profileId) {
                throw new TRPCError({
                    code: 'UNAUTHORIZED',
                    message: 'Profile does not own these terms',
                });
            }

            const termsId = getIdFromUri(termsUri);

            const results = await getCredentialsForContractTerms(termsId, {
                limit: limit + 1,
                cursor,
                includeReceived,
                profileId: profile.profileId,
            });

            const credentials = results.slice(0, limit);
            const hasMore = results.length > limit;
            const nextCursor = credentials.at(-1)?.date;

            // Format the results with proper URIs
            return {
                hasMore,
                cursor: nextCursor,
                records: credentials.map(cred => ({
                    ...cred,
                    termsUri,
                    contractUri: constructUri('contract', terms.contract.id, domain),
                    credentialUri: constructUri('credential', cred.credentialUri, domain),
                    boostUri: constructUri('boost', cred.boostUri, domain),
                })),
            };
        }),

    getAllCredentialsForTerms: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/consent-flow-contracts/credentials',
                tags: ['Consent Flow Contracts'],
                summary: 'Get all credentials written to any terms',
                description:
                    'Gets all credentials that were written to any terms owned by this profile',
            },
            requiredScope: 'contracts-data:read',
        })
        .input(
            PaginationOptionsValidator.extend({
                includeReceived: z.boolean().default(false),
                limit: PaginationOptionsValidator.shape.limit.default(25),
            }).default({})
        )
        .output(PaginatedContractCredentialsValidator)
        .query(async ({ ctx, input }) => {
            const { profile } = ctx.user;
            const { domain } = ctx;
            const { includeReceived, limit, cursor } = input;

            const results = await getAllCredentialsForProfileTerms(profile.profileId, {
                limit: limit + 1,
                cursor,
                includeReceived,
            });

            const credentials = results.slice(0, limit);
            const hasMore = results.length > limit;
            const nextCursor = credentials.at(-1)?.date;

            // Format the results with proper URIs
            return {
                hasMore,
                cursor: nextCursor,
                records: credentials.map(cred => ({
                    ...cred,
                    contractUri: constructUri('contract', cred.contract.id, domain),
                    credentialUri: constructUri('credential', cred.credential.id, domain),
                    boostUri: constructUri('boost', cred.boost.id, domain),
                    termsUri: constructUri('terms', cred.terms.id, domain),
                })),
            };
        }),
});
export type ContractsRouter = typeof contractsRouter;
