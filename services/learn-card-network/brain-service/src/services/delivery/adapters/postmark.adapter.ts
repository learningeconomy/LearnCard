import { ServerClient } from 'postmark';
import { DeliveryService, Notification } from '../delivery.service';

export class PostmarkAdapter implements DeliveryService {
    private readonly client: ServerClient;

    constructor(apiKey: string) {
        this.client = new ServerClient(apiKey);
    }

    public async send(notification: Notification): Promise<void> {
        try {
            await this.client.sendEmailWithTemplate({
                From: process.env.POSTMARK_FROM_EMAIL || 'no-reply@learncard.com',
                To: notification.contactMethod.value,
                TemplateAlias: notification.templateId,
                TemplateModel: notification.templateModel,
            });
        } catch (error) {
            console.error('Postmark API Error:', error);
            // Decide if we should re-throw or handle it gracefully
            throw new Error('Failed to send email via Postmark.');
        }
    }
}
