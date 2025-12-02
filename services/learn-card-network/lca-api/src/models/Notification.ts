import { z } from 'zod';

import { LCNNotificationValidator } from '@learncard/types';

export const NOTIFICATIONS_COLLECTION = 'notifications';

export const NotificationActionStatusEnumValidator = z.enum(['PENDING', 'COMPLETED', 'REJECTED']);

export type NotificationActionStatusEnumType = z.infer<
    typeof NotificationActionStatusEnumValidator
>;

export const MongoNotificationValidator = LCNNotificationValidator.extend({
    _id: z.string().optional(),
    read: z.boolean(),
    archived: z.boolean(),
    actionStatus: NotificationActionStatusEnumValidator.optional(),
});
export type MongoNotificationType = z.infer<typeof MongoNotificationValidator>;
