import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { v4 as uuid } from 'uuid';

import { t, profileRoute } from '@routes';
import {
    ConsentFlowContractValidator,
    ConsentFlowTermsValidator,
    LCNProfileValidator,
    PaginationOptionsValidator,
    PaginatedConsentFlowContractsValidator,
    PaginatedConsentFlowTermsValidator,
} from '@learncard/types';
import { createConsentFlowContract } from '@accesslayer/consentflowcontract/create';
import {
    getConsentFlowContractsForProfile,
    getConsentedContractsForProfile,
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
        .input(z.object({ contract: ConsentFlowContractValidator }))
        .output(z.string())
        .mutation(async ({ input, ctx }) => {
            const { contract } = input;

            // Create ConsentFlow instance
            const contractInstance = await createConsentFlowContract(contract);

            // Get profile by profileId
            await contractInstance.relateTo({
                alias: 'createdBy',
                where: { profileId: ctx.user.profile.profileId },
            });

            return constructUri('contract', contractInstance.id, ctx.domain);
        }),

    getConsentFlowContracts: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'GET',
                path: '/consent-flow-contract',
                tags: ['Consent Flow Contracts'],
                summary: 'Get Consent Flow Contracts',
                description: 'Gets Consent Flow Contracts for a profile',
            },
        })
        .input(
            PaginationOptionsValidator.extend({
                limit: PaginationOptionsValidator.shape.limit.default(25),
            }).default({})
        )
        .output(PaginatedConsentFlowContractsValidator)
        .query(async ({ input, ctx }) => {
            const { limit, cursor } = input;
            const { profile } = ctx.user;

            const results = await getConsentFlowContractsForProfile(profile, {
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
                    contract: JSON.parse(contract.contract),
                    uri: constructUri('contract', contract.id, ctx.domain),
                })),
            };
        }),

    deleteConsentFlowContract: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'DELETE',
                path: '/consent-flow-contract',
                tags: ['Consenst Flow Contracts'],
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
        .input(z.object({ terms: ConsentFlowTermsValidator, contractUri: z.string() }))
        .output(z.string())
        .mutation(async ({ input, ctx }) => {
            const { profile } = ctx.user;

            const { terms, contractUri } = input;

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

            if (!areTermsValid(terms, JSON.parse(contract.contract))) {
                throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid Terms for Contract' });
            }

            await profile.relateTo({
                alias: 'consentsTo',
                where: { id: contract.id },
                properties: {
                    id: uuid(),
                    terms: JSON.stringify(terms),
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                },
            });

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
                method: 'GET',
                path: '/consent-flow-contract/consent',
                tags: ['Consent Flow Contracts'],
                summary: 'Consent To Contract',
                description: 'Consents to a Contract with a hard set of terms',
            },
        })
        .input(
            PaginationOptionsValidator.extend({
                limit: PaginationOptionsValidator.shape.limit.default(25),
            }).default({})
        )
        .output(PaginatedConsentFlowTermsValidator)
        .query(async ({ input, ctx }) => {
            const { profile } = ctx.user;

            const { limit, cursor } = input;

            const results = await getConsentedContractsForProfile(profile, {
                limit: limit + 1,
                cursor,
            });

            const contracts = results.slice(0, limit);

            const hasMore = results.length > limit;
            const nextCursor = contracts.at(-1)?.terms.updatedAt;

            return {
                hasMore,
                cursor: nextCursor,
                records: contracts.map(contract => ({
                    contract: JSON.parse(contract.contract.contract),
                    contractUri: constructUri('contract', contract.contract.id, ctx.domain),
                    uri: constructUri('terms', contract.terms.id, ctx.domain),
                    terms: JSON.parse(contract.terms.terms),
                    contractOwner: updateDidForProfile(ctx.domain, contract.owner),
                    consenter: updateDidForProfile(ctx.domain, profile),
                })),
            };
        }),
});
export type ContractsRouter = typeof contractsRouter;
