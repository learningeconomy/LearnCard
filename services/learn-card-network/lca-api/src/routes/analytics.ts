import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import jwt from 'jsonwebtoken';

import { t, didAndChallengeRoute } from '@routes';

/* -------------------------------------------------------------------------- */
/* Enum & constants                                                           */
/* -------------------------------------------------------------------------- */
export enum DASHBOARD_TYPE {
    NSO,
    GLOBAL,
    TROOP,
}

/** IDs come from env with sensible fall-backs for local dev */
const DASHBOARD_IDS = {
    [DASHBOARD_TYPE.NSO]: Number(process.env.NSO_DASHBOARD_ID ?? 100),
    [DASHBOARD_TYPE.GLOBAL]: Number(process.env.GLOBAL_DASHBOARD_ID ?? 67),
    [DASHBOARD_TYPE.TROOP]: Number(process.env.TROOP_DASHBOARD_ID ?? 133),
} as const satisfies Record<DASHBOARD_TYPE, number>;

const METABASE_SECRET_KEY =
    process.env.METABASE_SECRET_KEY ??
    (() => {
        if (process.env.CI) {
            console.log('METABASE_SECRET_KEY not set in CI')
            return;
        }
        throw new Error('METABASE_SECRET_KEY not set');
    })();

/* -------------------------------------------------------------------------- */
/* Utils                                                                      */
/* -------------------------------------------------------------------------- */
const getDashboardIdFromType = (type: DASHBOARD_TYPE) => DASHBOARD_IDS[type];

/* -------------------------------------------------------------------------- */
/* Zod schema                                                                 */
/* -------------------------------------------------------------------------- */
export const analyticsRouterInputZodSchema = z
    .object({
        resource: z.object({
            dashboardType: z.nativeEnum(DASHBOARD_TYPE),
        }),
        params: z
            .object({
                nso_id: z.array(z.string()).optional(),
                troop_id: z.array(z.string()).optional(),
            })
            .strict(), // disallow unknown keys
        exp: z.number().optional(),
    })
    .strict();

/* -------------------------------------------------------------------------- */
/* Router                                                                     */
/* -------------------------------------------------------------------------- */
export const analyticsRouter = t.router({
    generateAnalyticsAccessToken: didAndChallengeRoute
        .meta({
            openapi: {
                method: 'POST',
                path: '/analytics/get-token',
                tags: ['analytics'],
                summary: 'Generate Metabase access token',
                description: 'Returns a short-lived JWT for the requested dashboard',
            },
        })
        .input(analyticsRouterInputZodSchema)
        .output(z.string().nullable())
        .mutation(async ({ input }) => {

            if (!METABASE_SECRET_KEY) {
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'METABASE_SECRET_KEY not set',
                });
            }

            const exp = input.exp ?? Math.round(Date.now() / 1000) + 10 * 60; // default 10 min

            const payload = {
                resource: {
                    dashboard: getDashboardIdFromType(input.resource.dashboardType),
                },
                params: input.params,
                exp,
            };

            try {
                return jwt.sign(payload, METABASE_SECRET_KEY, { algorithm: 'HS256' });
            } catch (err) {
                console.error('JWT sign failed', err);
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'Could not generate analytics token',
                });
            }
        }),
});

export type AnalyticsRouter = typeof analyticsRouter;
