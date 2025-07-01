import twilio from 'twilio';
import { DeliveryService, Notification } from '../delivery.service';

export class TwilioAdapter implements DeliveryService {
    private readonly client: twilio.Twilio;

    constructor(accountSid: string, authToken: string) {
        this.client = twilio(accountSid, authToken);
    }

    public async send(notification: Notification): Promise<void> {
        const { contactMethod, templateModel } = notification;
        const { credentialName, issuerName, claimUrl } = templateModel ?? {};

        const body = `You have a new credential, "${credentialName ?? 'Unnamed Credential'}", from ${issuerName ?? 'an organization'}. Claim it here: ${claimUrl}`;

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
