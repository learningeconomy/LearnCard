import cache from '@cache';
import { DeliveryService, Notification } from '../delivery.service';

export class LogAdapter implements DeliveryService {
    async send(notification: Notification): Promise<void> {
        console.log('--- Logged Notification ---');
        console.log(JSON.stringify(notification, null, 2));
        console.log('-------------------------');

        /** 
         * For end-to-end tests, store the last delivery in cache
         */
        if (!!process.env.IS_E2E_TEST) {
            await cache.set('e2e:last-delivery', JSON.stringify(notification));
        }
    }
}
