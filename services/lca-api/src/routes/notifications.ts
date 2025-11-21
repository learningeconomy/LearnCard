import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { t, didAndChallengeRoute, authorizedDidRoute } from '@routes';

import { createPushNotificationRegistration } from '@accesslayer/pushtokens/create';
import { deletePushNotificationRegistration } from '@accesslayer/pushtokens/delete';
import { LCNNotificationValidator } from '@learncard/types';
import { sendPushNotification } from '@helpers/pushNotifications.helpers';
import { isDidOwnerOfNotification } from '@helpers/notifications.helpers';
import { createNotification } from '@accesslayer/notifications/create';
import {
    getPaginatedNotificationsForDid,
    getNotificationById,
} from '@accesslayer/notifications/read';
import {
    markAllNotificationsReadForUser,
    updateNotificationMeta,
} from '@accesslayer/notifications/update';
import {
    NotificationQueryFiltersValidator,
    NotificationMetaValidator,
    PaginatedNotificationsOptionsValidator,
    NotificationsSortEnumValidator,
} from 'types/notifications';

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
            const [sendNotificationResponse, createdNotificationId] = await Promise.all([
                sendPushNotification(input),
                createNotification(input),
            ]);
            if (ctx.debug)
                console.log(
                    '✅ Send Notification Completed',
                    sendNotificationResponse,
                    createdNotificationId
                );
            return true;
        }),
});
export type NotificationsRouter = typeof notificationsRouter;
