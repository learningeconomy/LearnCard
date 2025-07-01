import { ContactMethod, DeliveryService } from './delivery.service';
import { LogAdapter } from './adapters/log.adapter';
import { PostmarkAdapter } from './adapters/postmark.adapter';
import { TwilioAdapter } from './adapters/twilio.adapter';

export const getDeliveryService = (contactMethod: ContactMethod): DeliveryService => {
    if (contactMethod.type === 'phone') {
        const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN } = process.env;

        if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN) {
            console.log('Twilio credentials found. Using TwilioAdapter.');
            return new TwilioAdapter(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
        }

        console.log('No Twilio credentials found. Using LogAdapter for phone.');
        return new LogAdapter();
    }

    if (contactMethod.type === 'email') {
        if (process.env.POSTMARK_API_KEY) {
            console.log('Postmark API Key found. Using PostmarkAdapter.');
            return new PostmarkAdapter(process.env.POSTMARK_API_KEY);
        }

        console.log('No Postmark API Key found. Using LogAdapter for email.');
        return new LogAdapter();
    }

    console.log(`Unsupported contact method type: ${contactMethod.type}. Using LogAdapter.`);
    return new LogAdapter();
};
