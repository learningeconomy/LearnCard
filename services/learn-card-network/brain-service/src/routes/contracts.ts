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
} from '@learncard/types';
import { createConsentFlowContract } from '@accesslayer/consentflowcontract/create';
import {
    getConsentFlowContractsForProfile,
    getConsentedContractsForProfile,
    getContractDetailsByUri,
    getContractTermsByUri,
    getContractTermsForProfile,
    hasProfileConsentedToContract,
    isProfileConsentFlowContractAdmin,
} from '@accesslayer/consentflowcontract/relationships/read';
import { constructUri } from '@helpers/uri.helpers';
import { getContractByUri } from '@accesslayer/consentflowcontract/read';
import { deleteStorageForUri } from '@cache/storage';
import { deleteConsentFlowContract } from '@accesslayer/consentflowcontract/delete';
import { areTermsValid } from '@helpers/contract.helpers';
import { updateDidForProfile } from '@helpers/did.helpers';
import { updateTermsById } from '@accesslayer/consentflowcontract/relationships/update';
import { deleteTermsById } from '@accesslayer/consentflowcontract/relationships/delete';
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
                image: z.string().optional(),
                expiresAt: z.string().optional(),
            })
        )
        .output(z.string())
        .mutation(async ({ input, ctx }) => {
            const { contract, name, subtitle, description, image, expiresAt } = input;

            // Create ConsentFlow instance
            const createdContract = await createConsentFlowContract({
                contract,
                name,
                subtitle,
                description,
                image,
                expiresAt,
            });

            // Get profile by profileId
            await setCreatorForContract(createdContract, ctx.user.profile);

            return constructUri('contract', createdContract.id, ctx.domain);
        }),

    getConsentFlowContract: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'GET',
                path: '/consent-flow-contract/{uri}',
                tags: ['Consent Flow Contracts'],
                summary: 'Get Consent Flow Contracts',
                description: 'Gets Consent Flow Contracts for a profile',
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
            })
        )
        .output(z.string())
        .mutation(async ({ input, ctx }) => {
            const { profile } = ctx.user;

            const { terms, contractUri, expiresAt } = input;

            const contract = await getContractByUri(contractUri);

            if (!contract) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Could not find contract' });
            }

            if (await hasProfileConsentedToContract(profile, contract)) {
                throw new TRPCError({
                    code: 'CONFLICT',
                    message: "You've already consented to this contract!",
                });
            }

            if (!areTermsValid(terms, contract.contract)) {
                throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid Terms for Contract' });
            }

            await consentToContract(profile, contract, { terms, expiresAt });

            const relationship = await getContractTermsForProfile(profile, contract);

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
                    consenter: updateDidForProfile(ctx.domain, profile),
                })),
            };
        }),

    updateConsentedContractTerms: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/consent-flow-contract/consent/{uri}',
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
            })
        )
        .output(z.boolean())
        .mutation(async ({ ctx, input }) => {
            const { profile } = ctx.user;

            const { uri, terms, expiresAt } = input;

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
                updateTermsById(relationship.terms.id, { terms, expiresAt }),
                deleteStorageForUri(uri),
            ]);

            return true;
        }),

    withdrawConsent: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'DELETE',
                path: '/consent-flow-contract/consent/{uri}',
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

            await Promise.all([deleteTermsById(relationship.terms.id), deleteStorageForUri(uri)]);

            return true;
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

            if (terms.expiresAt && new Date() > new Date(terms.expiresAt)) return false;

            return true;
        }),
});
export type ContractsRouter = typeof contractsRouter;
