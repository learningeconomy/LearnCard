import twilio from 'twilio';
import { DeliveryService, Notification } from '../delivery.service';
import { getSmsBody } from '../helpers/sms.helpers';

export class TwilioAdapter implements DeliveryService {
    private readonly client: twilio.Twilio;

    constructor(accountSid: string, authToken: string) {
        this.client = twilio(accountSid, authToken);
    }

    public async send(notification: Notification): Promise<void> {
        const { contactMethod } = notification;

        const body = getSmsBody(notification);
        if(!body) {
            throw new Error('Failed to generate SMS body. Template not found: ' + notification.templateId);
        }
        try {
            await this.client.messages.create({
                body,
                from: process.env.TWILIO_FROM_NUMBER,
                to: contactMethod.value,
            });
        } catch (error) {
            console.error('Twilio API Error:', error);
            throw new Error('Failed to send SMS via Twilio.');
        }
    }
}
