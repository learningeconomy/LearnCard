import { z } from 'zod';

import { getChallenges } from '@helpers/challenges.helpers';

import { t, openRoute, didRoute, didAndChallengeRoute } from '@routes';
import { setValidChallengesForDid } from '@cache/challenges';

import packageJson from '../../package.json';
import { getEncryptionKeyForDid } from '@accesslayer/encryption-key/read';

export const utilitiesRouter = t.router({
    healthCheck: openRoute
        .meta({
            openapi: {
                method: 'GET',
                path: '/health-check',
                tags: ['Utilities'],
                summary: 'Check health of endpoint',
                description: 'Check if the endpoint is healthy and well',
            },
        })
        .input(z.void())
        .output(z.string())
        .query(async () => {
            return `Healthy and well! (Version ${packageJson.version})`;
        }),

    getChallenges: didRoute
        .meta({
            openapi: {
                method: 'GET',
                path: '/challenges',
                tags: ['Utilities'],
                summary: 'Request a list of valid challenges',
                description:
                    'Generates an arbitrary number of valid challenges for a did, then returns them',
            },
        })
        .input(z.object({ amount: z.number().int().positive().lte(100).default(100) }).default({}))
        .output(z.string().array())
        .query(async ({ input, ctx }) => {
            const challenges = getChallenges(input.amount);

            const did = ctx.user.did;

            await setValidChallengesForDid(did, challenges);

            return challenges;
        }),

    getDid: didRoute
        .meta({
            openapi: {
                method: 'GET',
                path: '/did',
                tags: ['Utilities'],
                summary: 'Get LCA API Did',
                description: 'Gets the did:web for the LCA API Service.',
            },
        })
        .input(z.void())
        .output(z.string())
        .query(async ({ ctx }) => `did:web:${ctx.domain}`),

    getEncryptionKey: didAndChallengeRoute
        .meta({
            openapi: {
                protect: true,
                method: 'GET',
                path: '/encryption-key',
                tags: ['Utilities'],
                summary: 'Get encryption key',
                description:
                    'Returns an encryption key that is bespoke for this did to optionally be used for encryption',
            },
        })
        .input(z.void())
        .output(z.string())
        .query(async ({ ctx }) => {
            const key = await getEncryptionKeyForDid(ctx.user.did);

            return key;
        }),
});
export type UtilitiesRouter = typeof utilitiesRouter;
