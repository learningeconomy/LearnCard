import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import {
    getProfileByProfileId,
} from '@accesslayer/profile/read';

// Import ConsentFlow model
import ConsentFlowContract from '../models/ConsentFlowContract';

import { t, profileRoute } from '@routes';
import { ConsentFlowContractValidator } from '@learncard/types';
import { createConsentFlowContract } from '@accesslayer/consentflowcontract/create';

export const contractsRouter = t.router({
    // New route to create a ConsentFlow relationship
    createConsentFlowContract: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/profile/{profileId}/consent-flow',
                tags: ['Profiles'],
                summary: 'Create Consent Flow',
                description: 'Creates a Consent Flow relationship for a profile',
            },
        })
        .input(z.object({ contract: ConsentFlowContractValidator }))
        .output(z.boolean())
        .mutation(async ({ input, ctx }) => {
            const { contract } = input;

            // Create ConsentFlow instance
            const contractInstance = await createConsentFlowContract(contract);

            // Get profile by profileId
            contractInstance.relateTo({ alias: 'createdBy', where: { profileId: ctx.user.profile.profileId } });

            return true;
        }),
});
export type ContractsRouter = typeof contractsRouter;
