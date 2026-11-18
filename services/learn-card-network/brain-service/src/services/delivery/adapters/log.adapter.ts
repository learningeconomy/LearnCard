import { environment } from '@environment';
import cache from '@cache';
import { DeliveryService, Notification } from '../delivery.service';

export class LogAdapter implements DeliveryService {
    async send(notification: Notification): Promise<void> {
        console.log('--- Logged Notification ---');
        // An invite goes to an address that may have no account; never log it (LC-2372).
        const logged =
            notification.templateId === 'contract-request-invite'
                ? {
                      ...notification,
                      contactMethod: { ...notification.contactMethod, value: '[redacted]' },
                  }
                : notification;
        console.log(JSON.stringify(logged, null, 2));
        console.log('-------------------------');

        /**
         * For end-to-end tests, store the last delivery in cache
         */
        if (environment.IS_E2E_TEST) {
            await cache.set('e2e:last-delivery', JSON.stringify(notification));
        }
    }
}
