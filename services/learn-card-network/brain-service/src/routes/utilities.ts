import { z } from 'zod';

import { getChallenges } from '@helpers/challenges.helpers';

import { t, openRoute, didRoute } from '@routes';
import { setValidChallengesForDid } from '@cache/challenges';
import { getProfileByEmail } from '@accesslayer/profile/read';

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

    resolveEmailLocale: openRoute
        .meta({
            openapi: {
                method: 'POST',
                path: '/utilities/resolve-email-locale',
                tags: ['Utilities'],
                summary: 'Resolve a recipient locale by email',
                description:
                    "Returns the account's saved BCP-47 locale preference for this email, or `null` when no preference is set or no account exists. Returning `null` (rather than defaulting to 'en') lets the caller fall back to its own signal (e.g. the client UI locale) before English. Never reveals whether an account exists — a missing account and an account with no saved locale both return `null` — so it is safe to call before authentication (e.g. to localize a login-code email).",
            },
        })
        .input(z.object({ email: z.string().email() }))
        .output(z.object({ locale: z.string().nullable() }))
        .mutation(async ({ input }) => {
            const profile = await getProfileByEmail(input.email);

            return { locale: profile?.locale ?? null };
        }),

    getChallenges: didRoute
        .meta({
            openapi: {
                protect: true,
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

    getDid: didRoute
        .meta({
            openapi: {
                protect: true,
                method: 'GET',
                path: '/did',
                tags: ['Utilities'],
                summary: 'Get LCN Did',
                description: 'Gets the did:web for the LCN itself',
            },
        })
        .input(z.void())
        .output(z.string())
        .query(async ({ ctx }) => `did:web:${ctx.domain}`),
});
export type UtilitiesRouter = typeof utilitiesRouter;
