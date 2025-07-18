import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { t, profileRoute, openRoute } from '@routes';
import { ConsentFlowContract } from '@models';

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
import { isVC2Format } from '@learncard/helpers';
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
    getWritersForContract,
} from '@accesslayer/consentflowcontract/relationships/read';
import { constructUri, getIdFromUri, resolveUri } from '@helpers/uri.helpers';
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
import { getBoostByUri, getBoostsByUri } from '@accesslayer/boost/read';
import { canProfileIssueBoost } from '@accesslayer/boost/relationships/read';
import {
    getCredentialsForContractTerms,
    getAllCredentialsForProfileTerms,
} from '@accesslayer/credential/relationships/read';
import { getCredentialUri } from '@helpers/credential.helpers';
import { getSigningAuthorityForUserByName } from '@accesslayer/signing-authority/relationships/read';
import { getDidWeb } from '@helpers/did.helpers';
import { issueCredentialWithSigningAuthority } from '@helpers/signingAuthority.helpers';
import { getProfilesByProfileIds } from '@accesslayer/profile/read';
import { resolveAndValidateDeniedWriters } from '@helpers/consentflow.helpers';
import {
    addAutoBoostsToContractDb,
    removeAutoBoostsFromContractDb,
} from '@accesslayer/consentflowcontract/relationships/manageAutoboosts';
import { getCredentialByUri } from '@accesslayer/credential/read';
import { getDidWebLearnCard, getDidWebLearnCard, getLearnCard } from '@helpers/learnCard.helpers';

export const contractsRouter = t.router({
    createConsentFlowContract: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/consent-flow-contract',
                tags: ['Contracts'],
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
                writers: z.array(z.string()).optional(),
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
                writers,
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

            // Add specified writers
            if (writers && writers.length > 0) {
                const writerProfiles = await getProfilesByProfileIds(writers);

                // Validate that all requested writer profiles were found
                if (writerProfiles.length !== writers.length) {
                    const foundIds = new Set(writerProfiles.map(p => p.profileId));
                    const missingIds = writers.filter(id => !foundIds.has(id));
                    throw new TRPCError({
                        code: 'BAD_REQUEST',
                        message: `Could not find the following writer profiles: ${missingIds.join(
                            ', '
                        )}`,
                    });
                }

                // Create CAN_WRITE relationship for each writer using static relateTo
                for (const writerProfile of writerProfiles) {
                    await ConsentFlowContract.relateTo({
                        alias: 'canWrite',
                        where: {
                            source: { id: createdContract.id }, // Specify source contract by id
                            target: { profileId: writerProfile.profileId }, // Specify target profile by profileId
                        },
                    });
                }
            }

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

                    await setAutoBoostForContract(
                        createdContract,
                        boost,
                        signingAuthority,
                        ctx.user.profile.profileId
                    );
                }
            }

            return constructUri('contract', createdContract.id, ctx.domain);
        }),

    getConsentFlowContract: openRoute
        .meta({
            openapi: {
                protect: true,
                method: 'GET',
                path: '/consent-flow-contract',
                tags: ['Contracts'],
                summary: 'Get Consent Flow Contracts',
                description: 'Gets Consent Flow Contract Details',
            },
            requiredScope: 'contracts:read',
        })
        .input(z.object({ uri: z.string() }))
        .output(ConsentFlowContractDetailsValidator)
        .query(async ({ input, ctx }) => {
            const { uri } = input;

            const decodedUri = decodeURIComponent(uri);
            const result = await getContractDetailsByUri(decodedUri);

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
                tags: ['Contracts'],
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
            const { profile } = ctx.user;

            const { query, limit, cursor } = input;

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
                path: '/consent-flow-contract',
                tags: ['Contracts'],
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

            const decodedUri = decodeURIComponent(uri);
            const contract = await getContractByUri(decodedUri);

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
                path: '/consent-flow-contract/data-for-contract',
                tags: ['Contracts'],
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

            const decodedUri = decodeURIComponent(uri);
            const contract = await getContractByUri(decodedUri);

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
                path: '/consent-flow-contract/data-for-did',
                tags: ['Contracts'],
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

            const decodedDid = decodeURIComponent(did);
            const otherProfile = await getProfileByDid(decodedDid);

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
                tags: ['Contracts'],
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
                path: '/consent-flow-contract/write',
                tags: ['Contracts'],
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

            const decodedDid = decodeURIComponent(did);
            // Get the other profile by DID
            const otherProfile = await getProfileByDid(decodedDid);
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

            const decodedContractUri = decodeURIComponent(contractUri);
            // Get contract details
            const contractDetails = await getContractDetailsByUri(decodedContractUri);
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

            // Ensure the current profile is an approved writer and not explicitly denied
            const writers = await getWritersForContract(contractDetails.contract);
            const isWriter = writers.some(writer => writer.profileId === profile.profileId);
            if (!isWriter) {
                throw new TRPCError({
                    code: 'UNAUTHORIZED',
                    message: 'Profile does not have permission to write to this contract',
                });
            }

            if (terms.terms.deniedWriters?.includes(profile.profileId)) {
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message: 'Profile is explicitly denied from writing to this contract',
                });
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
                path: '/consent-flow-contract/write/via-signing-authority',
                tags: ['Contracts'],
                summary:
                    'Write credential through signing authority for a DID consented to a contract',
                description:
                    'Issues and sends a boost credential via a registered signing authority to a DID that has consented to a contract.',
            },
            requiredScope: 'contracts-data:write',
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

            const decodedDid = decodeURIComponent(did);
            const decodedContractUri = decodeURIComponent(contractUri);
            // Get recipient profile
            const otherProfile = await getProfileByDid(decodedDid);
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
            const contractDetails = await getContractDetailsByUri(decodedContractUri);
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

            // Ensure the current profile is an approved writer and not explicitly denied
            const writers = await getWritersForContract(contractDetails.contract);
            const isWriter = writers.some(writer => writer.profileId === profile.profileId);
            if (!isWriter) {
                throw new TRPCError({
                    code: 'UNAUTHORIZED',
                    message: 'Profile does not have permission to write to this contract',
                });
            }

            if (terms.terms.deniedWriters?.includes(profile.profileId)) {
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message: 'Profile is explicitly denied from writing to this contract',
                });
            }

            // Prepare unsigned VC
            let unsignedVc: UnsignedVC;
            try {
                unsignedVc = JSON.parse(boost.dataValues.boost);
                if (isVC2Format(unsignedVc)) {
                    unsignedVc.validFrom = new Date().toISOString();
                } else {
                    unsignedVc.issuanceDate = new Date().toISOString();
                }
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
                path: '/consent-flow-contract/consent',
                tags: ['Contracts'],
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

            console.log('🎆🎆🎆🎆🎆🎆🎆🎆🎆🎆🎆🎆🎆🎆🎆🎆🎆🎆🎆');
            console.log('🎆🎆🎆🎆🎆🎆🎆🎆🎆🎆🎆🎆🎆🎆🎆🎆🎆🎆🎆');
            console.log('🎆🎆🎆🎆🎆🎆🎆🎆🎆🎆🎆🎆🎆🎆🎆🎆🎆🎆🎆');
            // console.log('input:', input);
            // console.log('🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧');

            // console.log('ctx:', ctx);

            // console.log('🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧');

            // console.log('contractDetails', contractDetails);
            console.log('terms:', terms);
            console.log('terms.read.credentials.categories:', terms.read.credentials.categories);

            const categories = terms.read.credentials.categories;
            const allSharedCredentialUris = [
                ...new Set(Object.values(categories).flatMap(category => category.shared || [])),
            ];

            console.log('allSharedCredentialUris:', allSharedCredentialUris);

            const credentials = (
                await Promise.all(
                    allSharedCredentialUris.map(async uri => {
                        try {
                            return await resolveUri(uri);
                        } catch (error) {
                            console.error(`Error resolving URI ${uri}:`, error);
                            return undefined;
                        }
                    })
                )
            ).filter(cred => cred !== undefined && cred !== '');
            // .map(cred => cred?.boostCredential ?? cred);

            const cred = credentials[0];
            if (cred) {
                console.log('🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧');
                console.log('🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧');
                console.log('🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧');
                console.log('cred:', cred);
                console.log('🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧');
                console.log('🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧');
                console.log('🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧');
                console.log('cred?.boostCredential:', cred?.boostCredential);
            }

            // console.log('🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧');

            // console.log('credentials:', credentials);

            // if (allSharedCredentialUris.length > 0) {
            //     const firstCredUri = allSharedCredentialUris[0];
            //     console.log('firstCredUri:', firstCredUri);

            //     // const credential = await getCredentialByUri(firstCredUri);
            //     const credential = await wallet.read.get(firstCredUri);
            //     console.log('credential:', credential);
            // }

            console.log('🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥');
            console.log('🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥');
            console.log('🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥');

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

            if (terms.deniedWriters?.length) {
                terms.deniedWriters = await resolveAndValidateDeniedWriters(
                    contractDetails.contract,
                    terms.deniedWriters,
                    ctx.domain
                );
            }

            // SmartResume handling
            const smartResumeContractUri = process.env.SMART_RESUME_CONTRACT_URI; // TODO set this up
            const isProduction = !process.env.IS_OFFLINE;
            const srUrl = isProduction
                ? 'https://my.smartresume.com/'
                : 'https://mystage.smartresume.com/';
            const clientId = process.env.SMART_RESUME_CLIENT_ID;
            const accessKey = process.env.SMART_RESUME_ACCESS_KEY;

            const accessTokenResponse = await fetch(`${srUrl}api/v1/token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    Authorization: `Basic ${btoa(`${clientId}:${accessKey}`)}`,
                },
                body: new URLSearchParams({
                    grant_type: 'client_credentials',
                    scope: 'delete readonly replace',
                }),
            }).then(res => res.json());

            const accessToken = accessTokenResponse.access_token;

            console.log('🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧');
            console.log('accessToken:', accessToken);

            // const _credentials = [];
            const body = `{
                "@context": [
                    "https://www.w3.org/ns/credentials/v2",
                    "https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json",
                    "https://w3id.org/security/suites/ed25519-2020/v1"
                ],
                "recipienttoken": "",
                "recipient": {
                    "id": "474989023199323",
                    "givenName": "",
                    "familyName": "",
                    "additionalName": "",
                    "email": "jsmith@institutionx.edu",
                    "phone": "",
                    "studentId": "",
                    "signupOrganization": ""
                },
                "credentials": ${JSON.stringify(credentials)}
            }`;

            // console.log('🎆🎆🎆🎆🎆🎆🎆🎆🎆🎆🎆🎆🎆🎆🎆🎆🎆🎆🎆');
            // console.log('body:', body);

            try {
                const response = await fetch(`${srUrl}api/v1/credentials`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                    },
                    body,
                    // body: [],
                    // body: JSON.stringify({
                    //     '@context': [
                    //         'https://www.w3.org/ns/credentials/v2',
                    //         'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
                    //         'https://w3id.org/security/suites/ed25519-2020/v1',
                    //     ],
                    //     'recipienttoken': '',
                    //     'recipient': {
                    //         'id': '474989023199323',
                    //         'givenName': '',
                    //         'familyName': '',
                    //         'additionalName': '',
                    //         'email': 'jsmith@institutionx.edu',
                    //         'phone': '',
                    //         'studentId': '',
                    //         'signupOrganization': '',
                    //     },
                    //     'credentials': [
                    //         {
                    //             '@context': [
                    //                 'https://www.w3.org/ns/credentials/v2',
                    //                 'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
                    //                 'https://w3id.org/security/suites/ed25519-2020/v1',
                    //             ],
                    //             'id': '351843720888468',
                    //             'name': 'Calculus w/Analytic Geometry I',
                    //             'awardedDate': 'Spring 2023',
                    //             'activityEndDate': '',
                    //             'issuedOn': '',
                    //             'issuanceDate': '',
                    //             'expirationDate': '',
                    //             'credentialSubject': {
                    //                 'type': ['AchievementSubject'],
                    //                 'achievement': {
                    //                     'id': '351843720888468',
                    //                     'achievementType': 'Course',
                    //                     'name': 'Calculus w/Analytic Geometry I',
                    //                     'description':
                    //                         'Real numbers, limits and continuity, and differential and integral calculus of functions of 1 variable.',
                    //                     'image': {
                    //                         'id': '',
                    //                     },
                    //                 },
                    //             },
                    //             'issuer': {
                    //                 'id': '123456789',
                    //                 'name': 'Institution X',
                    //                 'email': 'admissions@institutionx.edu',
                    //                 'url': 'https://institutionx.edu',
                    //                 'image': {
                    //                     'id': '',
                    //                 },
                    //                 'description':
                    //                     'Institution X, founded in 1925, is known for its beautiful campus and arts programs.',
                    //             },
                    //             'endorsements': {
                    //                 'issuedOn': '',
                    //                 'issuer': {
                    //                     'name': '',
                    //                 },
                    //                 'claim': {
                    //                     'endorsementComment': '',
                    //                 },
                    //             },
                    //         },
                    //         {
                    //             '@context': [
                    //                 'https://www.w3.org/ns/credentials/v2',
                    //                 'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
                    //                 'https://w3id.org/security/suites/ed25519-2020/v1',
                    //             ],
                    //             'id': '369435906932892',
                    //             'name': 'Introduction to Psychology',
                    //             'awardedDate': 'Spring 2023',
                    //             'activityEndDate': '',
                    //             'issuedOn': '',
                    //             'issuanceDate': '',
                    //             'expirationDate': '',
                    //             'credentialSubject': {
                    //                 'type': ['AchievementSubject'],
                    //                 'achievement': {
                    //                     'id': '351843720888469',
                    //                     'achievementType': 'Course',
                    //                     'name': 'Introduction to Psychology',
                    //                     'description':
                    //                         'Major areas of theory and research in psychology. Requires participation in department-sponsored research or an educationally equivalent alternative activity.',
                    //                     'image': {
                    //                         'id': '',
                    //                     },
                    //                 },
                    //             },
                    //             'issuer': {
                    //                 'id': '123456789',
                    //                 'name': 'Institution X',
                    //                 'email': 'admissions@institutionx.edu',
                    //                 'url': 'https://institutionx.edu',
                    //                 'image': {
                    //                     'id': '',
                    //                 },
                    //                 'description':
                    //                     'Institution X, founded in 1925, is known for its beautiful campus and arts programs.',
                    //             },
                    //             'endorsements': {
                    //                 'issuedOn': '',
                    //                 'issuer': {
                    //                     'name': '',
                    //                 },
                    //                 'claim': {
                    //                     'endorsementComment': '',
                    //                 },
                    //             },
                    //         },
                    //         {
                    //             '@context': [
                    //                 'https://www.w3.org/ns/credentials/v2',
                    //                 'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
                    //                 'https://w3id.org/security/suites/ed25519-2020/v1',
                    //             ],
                    //             'id': '369435906932893',
                    //             'name': 'First-Year Composition',
                    //             'awardedDate': 'Spring 2023',
                    //             'activityEndDate': '',
                    //             'issuedOn': '',
                    //             'issuanceDate': '',
                    //             'expirationDate': '',
                    //             'credentialSubject': {
                    //                 'type': ['AchievementSubject'],
                    //                 'achievement': {
                    //                     'id': '351843720888470',
                    //                     'achievementType': 'Course',
                    //                     'name': 'First-Year Composition',
                    //                     'description':
                    //                         "Discovers, organizes and develops ideas in relation to the writer's purpose, subject and audience. Emphasizes modes of written discourse and effective use of rhetorical principles.",
                    //                     'image': {
                    //                         'id': '',
                    //                     },
                    //                 },
                    //             },
                    //             'issuer': {
                    //                 'id': '123456789',
                    //                 'name': 'Institution X',
                    //                 'email': 'admissions@institutionx.edu',
                    //                 'url': 'https://institutionx.edu',
                    //                 'image': {
                    //                     'id': '',
                    //                 },
                    //                 'description':
                    //                     'Institution X, founded in 1925, is known for its beautiful campus and arts programs.',
                    //             },
                    //             'endorsements': {
                    //                 'issuedOn': '',
                    //                 'issuer': {
                    //                     'name': '',
                    //                 },
                    //                 'claim': {
                    //                     'endorsementComment': '',
                    //                 },
                    //             },
                    //         },
                    //     ],
                    // }),
                });

                if (!response.ok) {
                    // console.log('🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥');
                    // console.log('🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥');
                    // console.log('🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥');
                    // console.log('response:', response);

                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const result = await response.json();
                console.log('🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥');
                console.log('result:', result);
            } catch (error) {
                console.error('Error uploading credentials:', error);
                throw error;
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
                tags: ['Contracts'],
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
                path: '/consent-flow-contract/consent/update',
                tags: ['Contracts'],
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

            const decodedUri = decodeURIComponent(uri);
            const relationship = await getContractTermsByUri(decodedUri);

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

            // Convert deniedWriters DIDs to profile IDs if needed
            if (terms.deniedWriters?.length) {
                terms.deniedWriters = await resolveAndValidateDeniedWriters(
                    relationship.contract,
                    terms.deniedWriters,
                    ctx.domain
                );
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
                path: '/consent-flow-contract/consent/withdraw',
                tags: ['Contracts'],
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

            const decodedUri = decodeURIComponent(uri);
            const relationship = await getContractTermsByUri(decodedUri);

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
                path: '/consent-flow-contract/consent/history',
                tags: ['Contracts'],
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

            const decodedUri = decodeURIComponent(uri);
            const relationship = await getContractTermsByUri(decodedUri);

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
                path: '/consent-flow-contract/verify',
                tags: ['Contracts'],
                summary: 'Verifies that a profile has consented to a contract',
                description: 'Checks if a profile has consented to the specified contract',
            },
            requiredScope: 'contracts:read',
        })
        .input(z.object({ uri: z.string(), profileId: z.string() }))
        .output(z.boolean())
        .query(async ({ input }) => {
            const { uri, profileId } = input;

            const decodedUri = decodeURIComponent(uri);
            const contract = await getContractByUri(decodedUri);

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
                path: '/consent-flow-contract/sync',
                tags: ['Contracts'],
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
                path: '/consent-flow-contract/credentials',
                tags: ['Contracts'],
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
                tags: ['Contracts'],
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

    addAutoBoostsToContract: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/consent-flow-contracts/autoboosts/add',
                tags: ['Contracts'],
                summary: 'Add autoboosts to a contract',
                description:
                    'Adds one or more autoboost configurations to an existing consent flow contract. The caller must be the contract owner or a designated writer. The signing authority for each autoboost must be registered to the caller.',
            },
            requiredScope: 'contracts:write autoboosts:write',
        })
        .input(
            z.object({
                contractUri: z.string(),
                autoboosts: z.array(AutoBoostConfigValidator),
            })
        )
        .output(z.boolean())
        .mutation(async ({ ctx, input }) => {
            const { profile } = ctx.user;
            const { contractUri, autoboosts } = input;

            const contract = await getContractByUri(contractUri);

            if (!contract) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Contract not found' });
            }

            const writers = await getWritersForContract(contract);
            const isAuthorized = writers.some(writer => writer.profileId === profile.profileId);

            if (!isAuthorized) {
                throw new TRPCError({
                    code: 'UNAUTHORIZED',
                    message: 'You do not have permission to modify autoboosts for this contract.',
                });
            }

            await addAutoBoostsToContractDb(contract.id, autoboosts, profile, ctx.domain);

            return true;
        }),

    removeAutoBoostsFromContract: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/consent-flow-contracts/autoboosts/remove',
                tags: ['Contracts'],
                summary: 'Remove autoboosts from a contract',
                description:
                    'Removes one or more autoboosts from an existing consent flow contract, identified by their boost URIs. The caller must be the contract owner or a designated writer.',
            },
            requiredScope: 'contracts:write autoboosts:write',
        })
        .input(
            z.object({
                contractUri: z.string(),
                boostUris: z.array(z.string()),
            })
        )
        .output(z.boolean())
        .mutation(async ({ ctx, input }) => {
            const { profile } = ctx.user;
            const { contractUri, boostUris } = input;

            const contract = await getContractByUri(contractUri);

            if (!contract) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Contract not found' });
            }

            const writers = await getWritersForContract(contract);
            const isAuthorized = writers.some(writer => writer.profileId === profile.profileId);

            if (!isAuthorized) {
                throw new TRPCError({
                    code: 'UNAUTHORIZED',
                    message: 'You do not have permission to modify autoboosts for this contract.',
                });
            }

            await removeAutoBoostsFromContractDb(contract.id, boostUris, ctx.domain);

            return true;
        }),
});

export type ContractsRouter = typeof contractsRouter;
