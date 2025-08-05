import { t, openRoute } from '@routes';
import cache from '@cache';
import { z } from 'zod';
import { NotificationSchema } from '../services/delivery/delivery.service';

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
    
            const notification = JSON.parse(deliveryData);
            return notification;
        }),
});

export type TestRouter = typeof testRouter;
