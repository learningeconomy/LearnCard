import { DeliveryService, Notification } from '../delivery.service';

export class LogAdapter implements DeliveryService {
    public async send(notification: Notification): Promise<void> {
        console.log('--- New Notification ---');
        console.log('Type:', notification.contactMethod.type);
        console.log('Recipient:', notification.contactMethod.value);
        console.log('Template ID:', notification.templateId);
        console.log('Template Model:', JSON.stringify(notification.templateModel, null, 2));
        console.log('--- End Notification ---');

        return Promise.resolve();
    }
}
