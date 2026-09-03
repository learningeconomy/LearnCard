import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

import { t, didAndChallengeRoute, authorizedDidRoute } from '@routes';

import cache from '@cache';
import { createPushNotificationRegistration } from '@accesslayer/pushtokens/create';
import { deletePushNotificationRegistration } from '@accesslayer/pushtokens/delete';
import { LCNNotification, LCNNotificationValidator } from '@learncard/types';
import { sendPushNotification } from '@helpers/pushNotifications.helpers';
import { isDidOwnerOfNotification } from '@helpers/notifications.helpers';
import {
    createNotification,
    upsertCredentialRefreshNotification,
} from '@accesslayer/notifications/create';
import {
    getPaginatedNotificationsForDid,
    getNotificationById,
    queryNotifications,
    getNotificationsByTypeAndListingId,
} from '@accesslayer/notifications/read';
import {
    markAllNotificationsReadForUser,
    updateNotificationMeta,
} from '@accesslayer/notifications/update';
import { deleteNotificationById } from '@accesslayer/notifications/delete';
import {
    NotificationQueryFiltersValidator,
    NotificationQueryInputValidator,
    NotificationMetaValidator,
    PaginatedNotificationsOptionsValidator,
    NotificationsSortEnumValidator,
} from 'types/notifications';

export const E2E_PUSH_ATTEMPT_CACHE_PREFIX = 'e2e:push-attempt:';

/**
 * E2E-only observability probe (LC-2117/LC-2136): records that the route decided to
 * attempt a push for a notification. Mirrors the brain-service `e2e:notification-queue`
 * pattern so cross-service tests can assert push throttling without real FCM delivery.
 * No-op outside IS_E2E_TEST; never blocks or alters delivery behavior.
 */
const recordE2ePushAttempt = async (notification: LCNNotification): Promise<void> => {
    if (process.env.IS_E2E_TEST !== 'true') return;

    try {
        const toDid = typeof notification.to === 'string' ? notification.to : notification.to.did;

        await cache.set(
            `${E2E_PUSH_ATTEMPT_CACHE_PREFIX}${uuidv4()}`,
            JSON.stringify({
                type: notification.type,
                toDid,
                at: new Date().toISOString(),
            })
        );
    } catch (error) {
        console.error('Failed to record E2E push attempt', error);
    }
};

export const notificationsRouter = t.router({
    notifications: didAndChallengeRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/notifications',
                tags: ['Notifications'],
                summary: 'View notifications inbox',
                description: 'This route returns a list of notifications sent to your DID',
            },
        })
        .input(
            z.object({
                options: PaginatedNotificationsOptionsValidator.optional().default({
                    limit: 20,
                    sort: NotificationsSortEnumValidator.enum.REVERSE_CHRONOLOGICAL,
                }),
                filters: NotificationQueryFiltersValidator.optional(),
            })
        )
        // TODO: use correct typing for output notifications
        .output(
            z.object({
                notifications: z.array(z.any()),
                cursor: z.string().optional(),
                hasMore: z.boolean(),
            })
        )
        .query(async ({ input, ctx }) => {
            const notifications = await getPaginatedNotificationsForDid(
                ctx.user.did,
                input.options,
                input.filters
            );

            if (!notifications) {
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'Unable to retrieve notifications.',
                });
            }
            return notifications;
        }),

    queryNotifications: didAndChallengeRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/notifications/query',
                tags: ['Notifications'],
                summary: 'Query notifications',
                description:
                    'Query notifications with flexible filter criteria. Always scoped to the authenticated user.',
            },
        })
        .input(
            z.object({
                query: NotificationQueryInputValidator,
                options: PaginatedNotificationsOptionsValidator.optional().default({
                    limit: 20,
                    sort: NotificationsSortEnumValidator.enum.REVERSE_CHRONOLOGICAL,
                }),
            })
        )
        .output(
            z.object({
                notifications: z.array(z.any()),
                cursor: z.string().optional(),
                hasMore: z.boolean(),
            })
        )
        .query(async ({ input, ctx }) => {
            const result = await queryNotifications(ctx.user.did, input.query, input.options);

            if (!result) {
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'Unable to query notifications.',
                });
            }

            return result;
        }),

    updateNotificationMeta: didAndChallengeRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/notifications/update',
                tags: ['Notifications'],
                summary: 'Update notifications meta',
                description:
                    'This route allows you to update metadata about a notification, e.g. to mark it as read or archived',
            },
        })
        .input(z.object({ _id: z.string(), meta: NotificationMetaValidator }))
        .output(z.boolean())
        .mutation(async ({ input, ctx }) => {
            const notification = await getNotificationById(input._id);
            if (!notification) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Notification not found.',
                });
            }

            if (!isDidOwnerOfNotification(ctx.user.did, notification)) {
                throw new TRPCError({
                    code: 'UNAUTHORIZED',
                    message: 'Not Authorized to update notification.',
                });
            }

            const updated = await updateNotificationMeta(input._id, input.meta);

            return Boolean(updated);
        }),
    markAllNotificationsRead: didAndChallengeRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/notifications/markRead',
                tags: ['Notifications'],
                summary: 'Mark all notifications read',
                description: 'This route allows you to update all notifications for a user to read',
            },
        })
        .input(z.void())
        .output(z.boolean())
        .mutation(async ({ ctx }) => {
            // Get all notifications and update
            const updated = await markAllNotificationsReadForUser(ctx.user.did);

            if (updated === false) {
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'Unable to retrieve and update notifications.',
                });
            }

            return Boolean(updated);
        }),

    registerDeviceForPushNotifications: didAndChallengeRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/notifications/push/{token}',
                tags: ['Notifications'],
                summary: 'Register',
                description: 'Registers a device for push notifications.',
            },
        })
        .input(z.object({ token: z.string() }))
        .output(z.boolean())
        .mutation(async ({ input, ctx }) => {
            const success = await createPushNotificationRegistration({
                ...input,
                did: ctx.user.did,
                enabled: true,
            });

            if (!success) {
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'An unexpected error occured, please try again later.',
                });
            }

            return true;
        }),
    unregisterDeviceForPushNotifications: didAndChallengeRoute
        .meta({
            openapi: {
                protect: true,
                method: 'DELETE',
                path: '/notifications/push/{token}',
                tags: ['Notifications'],
                summary: 'Unregister',
                description: 'Unregisters a device for push notifications.',
            },
        })
        .input(z.object({ token: z.string() }))
        .output(z.boolean())
        .mutation(async ({ input, ctx }) => {
            const success = await deletePushNotificationRegistration({
                ...input,
                did: ctx.user.did,
            });

            if (!success) {
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'An unexpected error occured, please try again later.',
                });
            }

            return true;
        }),
    sendNotification: authorizedDidRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/notifications/send',
                tags: ['Notifications'],
                summary: 'Send Notification',
                description: 'Webhook endpoint for receiving a notification to process.',
            },
        })
        // TODO: use correct typing for input notifications
        .input(LCNNotificationValidator)
        .output(z.boolean())
        .mutation(async ({ input, ctx }) => {
            const notificationType = input.type as string;

            // Handle APP_LISTING_WITHDRAWN specially - delete the original submission notification
            if (notificationType === 'APP_LISTING_WITHDRAWN' && input.data?.metadata?.listingId) {
                const listingId = String(input.data.metadata.listingId);

                const originalNotifications = await getNotificationsByTypeAndListingId(
                    'APP_LISTING_SUBMITTED',
                    listingId
                );

                if (originalNotifications && originalNotifications.length > 0) {
                    for (const notification of originalNotifications) {
                        if (notification._id) {
                            await deleteNotificationById(notification._id);
                        }
                    }
                    if (ctx.debug) {
                        console.log(
                            `✅ Deleted ${originalNotifications.length} APP_LISTING_SUBMITTED notifications for listing ${listingId}`
                        );
                    }
                }

                return true;
            }

            let sendNotificationResponse: unknown;

            // Managed credential refresh deliveries (LC-2117/LC-2136) collapse
            // atomically per delivery window: persist first, push only when the
            // upsert inserted a new window record. Other notification types keep
            // the existing behavior to limit regression scope.
            if (notificationType === 'CREDENTIAL_REFRESHED') {
                const refreshResult = await upsertCredentialRefreshNotification(input);

                if (!refreshResult) return false;

                if (refreshResult.created) {
                    await recordE2ePushAttempt(input);

                    try {
                        sendNotificationResponse = await sendPushNotification(input);
                    } catch (error) {
                        console.error(
                            'Failed to send push notification after durable storage',
                            error
                        );
                    }
                }

                if (ctx.debug)
                    console.log(
                        '✅ Send Notification Completed',
                        sendNotificationResponse,
                        refreshResult
                    );
                return true;
            }

            const creationResult = await createNotification(input);

            if (!creationResult) return false;

            if (creationResult.created) {
                try {
                    sendNotificationResponse = await sendPushNotification(input);
                } catch (error) {
                    console.error('Failed to send push notification after durable storage', error);
                }
            }

            if (ctx.debug)
                console.log(
                    '✅ Send Notification Completed',
                    sendNotificationResponse,
                    creationResult
                );
            return true;
        }),
});
export type NotificationsRouter = typeof notificationsRouter;
