import { t, openRoute } from '@routes';
import cache from '@cache';
import { z } from 'zod';
import { NotificationSchema } from '../services/delivery/delivery.service';
import { LCNNotificationValidator } from '@learncard/types';

export const testRouter = t.router({
    lastDelivery: openRoute
        .meta({
            openapi: {
                method: 'GET',
                path: '/test/last-delivery',
                tags: ['Test'],
                summary: 'Get last delivery',
                description: 'Get the last delivery',
            },
        })
        .input(z.void())
        .output(NotificationSchema.or(z.null()))
        .query(async () => {
            const deliveryData = await cache.get('e2e:last-delivery');

            if (!deliveryData) {
                return null;
            }
    
            try {
                const notification = JSON.parse(deliveryData);
                return notification;
            } catch (error) {
                console.error('Failed to parse cached delivery data:', error);
                return null;
            }
        }),
    notificationQueue: openRoute
        .meta({
            openapi: {
                method: 'GET',
                path: '/test/notification-queue',
                tags: ['Test'],
                summary: 'Get notification queue',
                description: 'Get the notification queue',
            },
        })
        .input(z.void())
        .output(z.array(LCNNotificationValidator))
        .query(async () => {
            const notificationQueue = await cache.keys('e2e:notification-queue:*');

            if (!notificationQueue) {  
                return [];
            }

            const notifications = await Promise.all(
                notificationQueue.map(async key => {
                    const notificationData = await cache.get(key);
                    if (!notificationData) return null;
                    try {
                        return JSON.parse(notificationData);
                    } catch (error) {
                        console.error('Failed to parse cached notification:', error);
                        return null;
                    }
                })
            );

            return notifications.filter((notification): notification is NonNullable<typeof notification> => notification !== null);
        }),
});

export type TestRouter = typeof testRouter;
