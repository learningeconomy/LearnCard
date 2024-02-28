import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { t, profileRoute } from '@routes';
import { ConsentFlowContractValidator, ConsentFlowTermsValidator } from '@learncard/types';
import { createConsentFlowContract } from '@accesslayer/consentflowcontract/create';
import {
    getConsentFlowContractsForProfile,
    isProfileConsentFlowContractAdmin,
} from '@accesslayer/consentflowcontract/relationships/read';
import { constructUri } from '@helpers/uri.helpers';
import { getContractByUri } from '@accesslayer/consentflowcontract/read';
import { deleteStorageForUri } from '@cache/storage';
import { deleteConsentFlowContract } from '@accesslayer/consentflowcontract/delete';
import { areTermsValid } from '@helpers/contract.helpers';

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
        .input(z.object({ limit: z.number().int().lt(100).default(25) }).default({ limit: 25 }))
        .output(z.object({ contract: ConsentFlowContractValidator, uri: z.string() }).array())
        .mutation(async ({ input, ctx }) => {
            const { limit } = input;
            const { profile } = ctx.user;

            const contracts = await getConsentFlowContractsForProfile(profile, { limit });

            return contracts.map(contract => ({
                contract: JSON.parse(contract.contract),
                uri: constructUri('contract', contract.id, ctx.domain),
            }));
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
        .output(z.boolean())
        .mutation(async ({ input, ctx }) => {
            const { profile } = ctx.user;

            const { terms, contractUri } = input;

            const contract = await getContractByUri(contractUri);

            if (!contract) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Could not find contract' });
            }

            if (!areTermsValid(terms, JSON.parse(contract.contract))) {
                throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid Terms for Contract' });
            }

            await profile.relateTo({
                alias: 'consentsTo',
                where: { id: contract.id },
                properties: {
                    terms: JSON.stringify(terms),
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                },
            });

            return true;
        }),
});
export type ContractsRouter = typeof contractsRouter;
