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
} from '@learncard/types';
import { createConsentFlowContract } from '@accesslayer/consentflowcontract/create';
import {
    getConsentFlowContractsForProfile,
    getConsentedContractsForProfile,
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
import { updateTerms, withdrawTerms } from '@accesslayer/consentflowcontract/relationships/update';
import {
    consentToContract,
    setCreatorForContract,
} from '@accesslayer/consentflowcontract/relationships/create';

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
        })
        .input(
            z.object({
                contract: ConsentFlowContractValidator,
                name: z.string(),
                subtitle: z.string().optional(),
                description: z.string().optional(),
                reasonForAccessing: z.string().optional(),
                needsGuardianConsent: z.boolean().optional(),
                image: z.string().optional(),
                expiresAt: z.string().optional(),
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
                image,
                expiresAt,
            } = input;

            // Create ConsentFlow instance
            const createdContract = await createConsentFlowContract({
                contract,
                name,
                subtitle,
                description,
                reasonForAccessing,
                needsGuardianConsent,
                image,
                expiresAt,
            });

            // Get profile by profileId
            await setCreatorForContract(createdContract, ctx.user.profile);

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
        })
        .input(z.object({ uri: z.string() }))
        .output(ConsentFlowContractDetailsValidator)
        .query(async ({ input, ctx }) => {
            const { uri } = input;

            const result = await getContractDetailsByUri(uri);

            if (!result) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Could not find contract' });
            }

            return {
                owner: updateDidForProfile(ctx.domain, result.contractOwner),
                contract: result.contract.contract,
                name: result.contract.name,
                subtitle: result.contract.subtitle,
                description: result.contract.description,
                reasonForAccessing: result.contract.reasonForAccessing,
                needsGuardianConsent: result.contract.needsGuardianConsent,
                image: result.contract.image,
                createdAt: result.contract.createdAt,
                updatedAt: result.contract.updatedAt,
                uri: constructUri('contract', result.contract.id, ctx.domain),
                ...(result.contract.expiresAt ? { expiresAt: result.contract.expiresAt } : {}),
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
            });
            const contracts = results.slice(0, limit);

            const hasMore = results.length > limit;
            const nextCursor = contracts.at(-1)?.updatedAt;

            return {
                hasMore,
                cursor: nextCursor,
                records: contracts.map(contract => ({
                    contract: contract.contract,
                    name: contract.name,
                    subtitle: contract.subtitle,
                    description: contract.description,
                    reasonForAccessing: contract.reasonForAccessing,
                    needsGuardianConsent: contract.needsGuardianConsent,
                    image: contract.image,
                    createdAt: contract.createdAt,
                    updatedAt: contract.updatedAt,
                    uri: constructUri('contract', contract.id, ctx.domain),
                    ...(contract.expiresAt ? { expiresAt: contract.expiresAt } : {}),
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

            await consentToContract(profile, contractDetails, { terms, expiresAt, oneTime });

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
                        image: record.contract.image,
                        createdAt: record.contract.createdAt,
                        updatedAt: record.contract.updatedAt,
                        uri: constructUri('contract', record.contract.id, ctx.domain),
                        owner: updateDidForProfile(ctx.domain, record.owner),
                        ...(record.contract.expiresAt
                            ? { expiresAt: record.contract.expiresAt }
                            : {}),
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
                updateTerms(relationship, { terms, expiresAt, oneTime }),
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
                records: transactions,
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
});
export type ContractsRouter = typeof contractsRouter;
