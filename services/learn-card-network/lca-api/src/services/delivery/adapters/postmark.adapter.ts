/**
 * Postmark Adapter
 *
 * Sends emails via the Postmark API. Supports both plain-text and template-based emails.
 */

import { ServerClient } from 'postmark';

import {
    DeliveryService,
    Notification,
    isTemplateNotification,
} from '../delivery.service';

export class PostmarkAdapter implements DeliveryService {
    private readonly client: ServerClient;
    private readonly defaultFrom: string;

    constructor(apiKey: string, defaultFrom: string) {
        this.client = new ServerClient(apiKey);
        this.defaultFrom = defaultFrom;
    }

    async send(notification: Notification): Promise<void> {
        const from = notification.from ?? this.defaultFrom;

        if (isTemplateNotification(notification)) {
            await this.client.sendEmailWithTemplate({
                From: from,
                To: notification.to,
                TemplateAlias: notification.templateId,
                TemplateModel: notification.templateModel,
                MessageStream: notification.messageStream,
            });
        } else {
            await this.client.sendEmail({
                From: from,
                To: notification.to,
                Subject: notification.subject,
                TextBody: notification.textBody,
                HtmlBody: notification.htmlBody,
                MessageStream: notification.messageStream,
            });
        }
    }
}
