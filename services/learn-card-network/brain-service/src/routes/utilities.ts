import { createHash } from 'crypto';

import { z } from 'zod';
import { TRPCError } from '@trpc/server';

import { getChallenges } from '@helpers/challenges.helpers';
import { getLearnCard, getDidKitEngine } from '@helpers/learnCard.helpers';

import { t, openRoute, didRoute } from '@routes';
import { setValidChallengesForDid } from '@cache/challenges';
import { getProfileByEmail } from '@accesslayer/profile/read';
import { enforceRateLimits } from '@helpers/rateLimit.helpers';

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
            // Exercise DIDKit on every health probe: issue a DID auth VP with the
            // service keypair and verify it in-process. The signed VP is intentionally
            // NOT returned — an unbound (no challenge/domain) auth VP handed to
            // anonymous callers would be a free impersonation artifact for any
            // verifier that skips challenge binding. See /health-check/deep for full
            // diagnostics.
            const learnCard = await getLearnCard();

            const vp = await learnCard.invoke.getDidAuthVp();
            const result = await learnCard.invoke.verifyPresentation(vp);

            const errors = result.errors ?? [];

            if (errors.length > 0) {
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: `DIDKit health check failed verification: ${errors.join('; ')}`,
                });
            }

            return `Healthy and well! (Version ${
                packageJson.version
            }) — DIDKit ok (${getDidKitEngine()} engine, DID auth VP issued + verified)`;
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

    resolveEmailLocale: openRoute
        .meta({
            openapi: {
                method: 'POST',
                path: '/utilities/resolve-email-locale',
                tags: ['Utilities'],
                summary: 'Resolve a recipient locale by email',
                description:
                    "Returns the account's saved BCP-47 locale preference for this email, or `null` when no preference is set or no account exists. Returning `null` (rather than defaulting to 'en') lets the caller fall back to its own signal (e.g. the client UI locale) before English. Never reveals whether an account exists — a missing account and an account with no saved locale both return `null` — so it is safe to call before authentication (e.g. to localize a login-code email). Rate limited to 10 lookups per email per hour (plus a broad per-IP circuit breaker); callers should treat any error as an unresolved locale and fall back, never as a failure.",
            },
        })
        .input(z.object({ email: z.string().email() }))
        .output(z.object({ locale: z.string().nullable() }))
        .mutation(async ({ ctx, input }) => {
            const email = input.email.toLowerCase();

            // Abuse damping. This route is pre-auth by necessity (it localizes
            // the login-code email, which is sent before any session exists), so
            // there's no DID to key a limit on.
            //
            // Callers degrade gracefully: lca-api treats any non-2xx as "unknown
            // locale" and falls back to the client UI locale, then 'en'. A user
            // who trips a limit gets an English email, never a failed login.
            //
            // The per-IP window is a deliberately generous circuit breaker, NOT
            // a per-user quota: the only legitimate caller is lca-api, so all
            // real traffic arrives from a small set of NAT IPs and shares one
            // bucket. Keep it well above peak unique-logins-per-hour. The
            // per-email window is the tight one — lca-api caches a resolved
            // locale for an hour, so honest traffic is ~1 lookup per email per
            // hour and anything near 10 is already pathological.
            await enforceRateLimits([
                ...(ctx.sourceIp
                    ? [
                          {
                              key: `resolve-email-locale-ip:${ctx.sourceIp}`,
                              limit: 3000,
                              windowSeconds: 3600,
                              description: 'too many locale lookups from this address',
                          },
                      ]
                    : []),
                {
                    // Hash the email: these keys sit in a shared Redis, and an
                    // address is PII we don't need in plaintext to count with.
                    key: `resolve-email-locale:${createHash('sha256').update(email).digest('hex')}`,
                    limit: 10,
                    windowSeconds: 3600,
                    description: 'max 10 locale lookups per email per hour',
                },
            ]);

            const profile = await getProfileByEmail(email);

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
