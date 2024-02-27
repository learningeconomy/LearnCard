import { z } from 'zod';

import { t, profileRoute } from '@routes';
import { ConsentFlowContractValidator } from '@learncard/types';
import { createConsentFlowContract } from '@accesslayer/consentflowcontract/create';
import { getConsentFlowContractsForProfile } from '@accesslayer/consentflowcontract/relationships/read';

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
        .output(z.boolean())
        .mutation(async ({ input, ctx }) => {
            const { contract } = input;

            // Create ConsentFlow instance
            const contractInstance = await createConsentFlowContract(contract);

            // Get profile by profileId
            contractInstance.relateTo({
                alias: 'createdBy',
                where: { profileId: ctx.user.profile.profileId },
            });

            return true;
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
        .output(ConsentFlowContractValidator.array())
        .mutation(async ({ input, ctx }) => {
            const { limit } = input;
            const { profile } = ctx.user;

            const contracts = await getConsentFlowContractsForProfile(profile, { limit });

            return contracts.map(contract => JSON.parse(contract.contract));
        }),
});
export type ContractsRouter = typeof contractsRouter;
