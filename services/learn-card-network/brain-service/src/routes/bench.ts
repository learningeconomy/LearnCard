import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { neogma } from '@instance';
import { t, profileRoute } from '@routes';
import { PerfTracker } from '@helpers/perf';
import { runBench, type BenchRunResult } from '@helpers/bench-appevent.helpers';
import { benchContextStorage, type BenchContext } from '@helpers/bench-context.helpers';
import { getProfilesByProfileIds } from '@accesslayer/profile/read';
import { readAppStoreListingByIdOrSlug } from '@accesslayer/app-store-listing/read';
import { handleSendCredentialEvent } from '@routes/app-store';

// LC-1644 bench routes.
// Gated at the router level via ENABLE_BENCH_ROUTES (see app.ts) so production
// never exposes them. The cleanup procedure also enforces self-ownership of the
// recipientProfileId as defense in depth.
export const benchRouter = t.router({
    appEvent: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/bench/app-event',
                tags: ['Bench'],
                summary: 'Run AppEvent perf bench',
                description:
                    'Runs handleSendCredentialEvent N times against the configured listing and recipient, captures per-phase timings, and emits PostHog events. Only mounted when ENABLE_BENCH_ROUTES is set.',
            },
            requiredScope: 'app-store:write',
        })
        .input(
            z.object({
                listingId: z.string(),
                recipientProfileId: z.string(),
                templateAlias: z.string(),
                iterations: z.number().int().min(1).max(100),
                warmup: z.number().int().min(0).max(10).default(2),
                runLabel: z.string().optional(),
            })
        )
        .output(z.record(z.string(), z.unknown()))
        .mutation(async ({ input, ctx }): Promise<BenchRunResult> => {
            const recipientProfiles = await getProfilesByProfileIds([input.recipientProfileId]);
            const recipient = recipientProfiles[0];
            if (!recipient) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Recipient profile not found',
                });
            }
            const listing = await readAppStoreListingByIdOrSlug(input.listingId);
            if (!listing) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'App Store Listing not found',
                });
            }

            const runLabel = input.runLabel ?? `bench-${new Date().toISOString()}`;

            const runIteration = async () => {
                const benchCtx: BenchContext = { sa_http_ms: 0, sa_didauthvp_ms: 0 };
                const tracker = new PerfTracker('bench-appevent-iteration');
                await benchContextStorage.run(benchCtx, async () => {
                    await handleSendCredentialEvent(
                        ctx,
                        { profileId: recipient.profileId },
                        listing.listing_id,
                        {
                            type: 'send-credential',
                            templateAlias: input.templateAlias,
                            templateData: {},
                        },
                        tracker
                    );
                });
                return {
                    captured: tracker.capture(),
                    saHttpMs: benchCtx.sa_http_ms,
                    saDidAuthVpMs: benchCtx.sa_didauthvp_ms,
                };
            };

            return runBench({
                iterations: input.iterations,
                warmup: input.warmup,
                runLabel,
                listingId: listing.listing_id,
                recipientProfileId: recipient.profileId,
                runIteration,
            });
        }),

    cleanupAppEventData: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/bench/cleanup-app-event-data',
                tags: ['Bench'],
                summary: 'Cleanup bench-generated credentials/notifications/activity',
                description:
                    'Deletes credentials, notifications, and activity entries for the caller. Only mounted when ENABLE_BENCH_ROUTES is set. Callers can only clean up their own data.',
            },
            requiredScope: 'app-store:write',
        })
        .input(z.object({ recipientProfileId: z.string() }))
        .output(
            z.object({
                credentialsDeleted: z.number(),
                notificationsDeleted: z.number(),
                activityEntriesDeleted: z.number(),
            })
        )
        .mutation(async ({ input, ctx }) => {
            if (input.recipientProfileId !== ctx.user.profile.profileId) {
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message: 'Can only cleanup your own bench data',
                });
            }

            const recipientProfiles = await getProfilesByProfileIds([input.recipientProfileId]);
            const recipient = recipientProfiles[0];
            if (!recipient) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Recipient profile not found',
                });
            }

            const credResult = await neogma.queryRunner.run(
                `MATCH (p:Profile {profileId: $profileId})<-[:CREDENTIAL_RECEIVED]-(c:Credential)
                 WITH collect(c) AS creds
                 FOREACH (n IN creds | DETACH DELETE n)
                 RETURN size(creds) AS cnt`,
                { profileId: recipient.profileId }
            );
            const credentialsDeleted = Number(credResult.records[0]?.get('cnt') ?? 0);

            const notifResult = await neogma.queryRunner.run(
                `MATCH (p:Profile {profileId: $profileId})-[r]->(i:InboxCredential)
                 WITH collect(DISTINCT i) AS inboxes
                 FOREACH (n IN inboxes | DETACH DELETE n)
                 RETURN size(inboxes) AS cnt`,
                { profileId: recipient.profileId }
            );
            const notificationsDeleted = Number(notifResult.records[0]?.get('cnt') ?? 0);

            const actResult = await neogma.queryRunner.run(
                `MATCH (a:CredentialActivity)-[:TO_RECIPIENT]->(p:Profile {profileId: $profileId})
                 WITH collect(a) AS activities
                 FOREACH (n IN activities | DETACH DELETE n)
                 RETURN size(activities) AS cnt`,
                { profileId: recipient.profileId }
            );
            const activityEntriesDeleted = Number(actResult.records[0]?.get('cnt') ?? 0);

            return { credentialsDeleted, notificationsDeleted, activityEntriesDeleted };
        }),
});

export type BenchRouter = typeof benchRouter;
