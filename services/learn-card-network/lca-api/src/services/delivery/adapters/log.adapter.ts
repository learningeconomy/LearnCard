/**
 * Log Adapter
 *
 * Logs notifications to stdout instead of sending them.
 * Used in test/dev environments or when no email provider is configured.
 */

import { DeliveryService, Notification, isTemplateNotification } from '../delivery.service';

export class LogAdapter implements DeliveryService {
    async send(notification: Notification): Promise<void> {
        if (isTemplateNotification(notification)) {
            console.log('[LogAdapter] Template notification:');
            console.log(`  To: ${notification.to}`);
            console.log(`  Template: ${notification.templateAlias}`);
            console.log(`  Model: ${JSON.stringify(notification.templateModel, null, 2)}`);
        } else {
            console.log('[LogAdapter] Email notification:');
            console.log(`  To: ${notification.to}`);
            console.log(`  Subject: ${notification.subject}`);
            console.log(`  Body: ${notification.textBody.slice(0, 20000)}...`);
        }
    }
}
