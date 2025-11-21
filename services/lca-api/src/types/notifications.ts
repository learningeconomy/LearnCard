import { z } from 'zod';
import { LCNNotificationTypeEnumValidator } from '@learncard/types';
import { PaginationOptionsValidator, PaginationResponseValidator } from './mongo';
import { MongoNotificationValidator, NotificationActionStatusEnumValidator } from '@models';

export const RegisterPushInputValidator = z.object({
    did: z.string(),
    token: z.string(),
});
export type RegisterPushInput = z.infer<typeof RegisterPushInputValidator>;

export const FCMBulkSendResponseValidator = z.object({
    successCount: z.number(),
    failureCount: z.number(),
    failedTokens: z.array(z.string()).optional(),
});

export type FCMBulkSendResponse = z.infer<typeof FCMBulkSendResponseValidator>;

export const NotificationMetaValidator = z.object({
    archived: z.boolean().optional(),
    read: z.boolean().optional(),
    actionStatus: NotificationActionStatusEnumValidator.optional(),
});
export type NotificationMetaType = z.infer<typeof NotificationMetaValidator>;

export const NotificationQueryFiltersValidator = NotificationMetaValidator.extend({
    type: LCNNotificationTypeEnumValidator.optional(),
});
export type NotificationQueryFiltersType = z.infer<typeof NotificationQueryFiltersValidator>;

// Paginated Notifications
export const NotificationsSortEnumValidator = z.enum(['CHRONOLOGICAL', 'REVERSE_CHRONOLOGICAL']);

export type NotificationsSortEnum = z.infer<typeof NotificationsSortEnumValidator>;

export const PaginatedNotificationsOptionsValidator = PaginationOptionsValidator.extend({
    sort: NotificationsSortEnumValidator.default(
        NotificationsSortEnumValidator.enum.REVERSE_CHRONOLOGICAL
    ),
});
export type PaginatedNotificationsOptionsType = z.infer<
    typeof PaginatedNotificationsOptionsValidator
>;

export const PaginatedNotificationsValidator = PaginationResponseValidator.extend({
    notifications: MongoNotificationValidator.array(),
});
export type PaginatedNotificationsType = z.infer<typeof PaginatedNotificationsValidator>;
