import { initClient, MessageBird } from 'messagebird';

import { DeliveryService, Notification } from '../delivery.service';
import { getSmsBody } from '../helpers/sms.helpers';

export class MessagebirdAdapter implements DeliveryService {
    private readonly client: MessageBird;
    private readonly originator: string;

    constructor(authToken: string, originator: string) {
        this.client = initClient(authToken);
        this.originator = originator;
    }

    public async send(notification: Notification): Promise<void> {
        const { contactMethod } = notification;

        const body = getSmsBody(notification);
        if(!body) {
            throw new Error('Failed to generate SMS body. Template not found: ' + notification.templateId);
        }
        try {
            var params = {
                originator: this.originator,
                recipients: [
                    contactMethod.value
                ],
                body: body
            };
              
            const response = await new Promise((resolve, reject) => this.client.messages.create(params, (err, response) => {
                if (err) {
                    reject(err)
                  }
                  resolve(response)
            }));

            console.log(response);
        } catch (error) {
            console.error('Messagebird API Error:', error);
            throw new Error('Failed to send SMS via Messagebird.');
        }
    }
}
