import { z } from 'zod';

import { t, profileRoute } from '@routes';
import {
    getActivitiesForProfile,
    getActivityStatsForProfile,
    getActivityById,
} from '@accesslayer/credential-activity/read';
import {
    CredentialActivityEventTypeValidator,
    PaginatedCredentialActivitiesValidator,
    CredentialActivityStatsValidator,
    CredentialActivityWithDetailsValidator,
} from 'types/activity';

export const activityRouter = t.router({
    getMyActivities: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'GET',
                path: '/activity/credentials',
                tags: ['Activity'],
                summary: 'Get Credential Activities',
                description:
                    'Returns a paginated list of credential activities for the authenticated profile. Use this to track what credentials have been sent, claimed, expired, etc.',
            },
            requiredScope: 'activity:read',
        })
        .input(
            z.object({
                limit: z.number().int().min(1).max(100).default(25),
                cursor: z.string().optional(),
                boostUri: z.string().optional(),
                eventType: CredentialActivityEventTypeValidator.optional(),
                integrationId: z.string().optional(),
            })
        )
        .output(PaginatedCredentialActivitiesValidator)
        .query(async ({ ctx, input }) => {
            const { profile } = ctx.user;
            const { limit, cursor, boostUri, eventType, integrationId } = input;

            const records = await getActivitiesForProfile(profile.profileId, {
                limit: limit + 1,
                cursor,
                boostUri,
                eventType,
                integrationId,
            });

            const hasMore = records.length > limit;
            const returnRecords = records.slice(0, limit);

            return {
                records: returnRecords,
                hasMore,
                cursor: hasMore ? returnRecords.at(-1)?.timestamp : undefined,
            };
        }),

    getActivityStats: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'GET',
                path: '/activity/credentials/stats',
                tags: ['Activity'],
                summary: 'Get Credential Activity Stats',
                description:
                    'Returns aggregated statistics for credential activities. Includes counts by status and claim rate.',
            },
            requiredScope: 'activity:read',
        })
        .input(
            z.object({
                boostUris: z.array(z.string()).optional(),
                integrationId: z.string().optional(),
            })
        )
        .output(CredentialActivityStatsValidator)
        .query(async ({ ctx, input }) => {
            const { profile } = ctx.user;
            const { boostUris, integrationId } = input;

            return getActivityStatsForProfile(profile.profileId, {
                boostUris,
                integrationId,
            });
        }),

    getActivity: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'GET',
                path: '/activity/credentials/{activityId}',
                tags: ['Activity'],
                summary: 'Get Credential Activity by ID',
                description:
                    'Returns details of a specific credential activity by its activity ID.',
            },
            requiredScope: 'activity:read',
        })
        .input(
            z.object({
                activityId: z.string(),
            })
        )
        .output(CredentialActivityWithDetailsValidator.nullable())
        .query(async ({ input }) => {
            const { activityId } = input;

            return getActivityById(activityId);
        }),
});

export type ActivityRouter = typeof activityRouter;

export default activityRouter;
