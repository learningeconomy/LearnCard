import { z } from 'zod';

import { getChallenges } from '@helpers/challenges.helpers';
import { getLearnCard, getDidKitEngine } from '@helpers/learnCard.helpers';

import { t, openRoute, didRoute } from '@routes';
import { setValidChallengesForDid } from '@cache/challenges';

import packageJson from '../../package.json';

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

    deepHealthCheck: openRoute
        .meta({
            openapi: {
                method: 'GET',
                path: '/health-check/deep',
                tags: ['Utilities'],
                summary: 'Deep health check (exercises DIDKit end to end)',
                description:
                    'Issues and verifies a test credential + presentation with the service keypair, proving the full DIDKit crypto path (plugin load, signing, and the runtime delegation inside the native plugin) works. Reports which DIDKit engine loaded. Added after the 2026-07-02 incidents, where shallow health checks stayed green while DIDKit paths were broken.',
            },
        })
        .input(z.void())
        .output(
            z.object({
                healthy: z.boolean(),
                version: z.string(),
                didkitEngine: z.enum(['native', 'wasm', 'unloaded']),
                did: z.string(),
                vpVerified: z.boolean(),
                verificationErrors: z.string().array(),
                ms: z.number(),
            })
        )
        .query(async () => {
            const start = Date.now();

            const learnCard = await getLearnCard();
            // getTestVp issues a test VC internally, so this round-trip exercises
            // issueCredential, issuePresentation, AND verifyPresentation — including
            // both lazy delegation call sites in the native plugin.
            const unsignedVp = await learnCard.invoke.getTestVp();
            const vp = await learnCard.invoke.issuePresentation(unsignedVp);
            const result = await learnCard.invoke.verifyPresentation(vp);

            const verificationErrors = result.errors ?? [];
            const vpVerified = verificationErrors.length === 0;

            return {
                healthy: vpVerified,
                version: packageJson.version,
                didkitEngine: getDidKitEngine(),
                did: learnCard.id.did(),
                vpVerified,
                verificationErrors,
                ms: Date.now() - start,
            };
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
        .input(
            z
                .object({ amount: z.number().int().positive().lte(100).default(100) })
                .default({ amount: 100 })
        )
        .output(z.string().array())
        .query(async ({ input, ctx }) => {
            const challenges = getChallenges(input.amount);

            const did = ctx.user.did;

            await setValidChallengesForDid(did, challenges);

            return challenges;
        }),

    getDid: openRoute
        .meta({
            openapi: {
                method: 'GET',
                path: '/did',
                tags: ['Utilities'],
                summary: 'Get LCN Did',
                description: 'Gets the did:web for the LearnCloud itself',
            },
        })
        .input(z.void())
        .output(z.string())
        .query(async ({ ctx }) => `did:web:${ctx.domain}`),
});
export type UtilitiesRouter = typeof utilitiesRouter;
