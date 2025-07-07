import { ContactMethod, DeliveryService } from './delivery.service';
import { LogAdapter } from './adapters/log.adapter';
import { MessagebirdAdapter } from './adapters/messagebird.adapter';
import { PostmarkAdapter } from './adapters/postmark.adapter';
import { TwilioAdapter } from './adapters/twilio.adapter';

const IS_TEST_ENVIRONMENT = process.env.NODE_ENV === 'test';

export const getDeliveryService = (contactMethod: ContactMethod): DeliveryService => {
    if (IS_TEST_ENVIRONMENT || process.env.IS_CI) {
        return new LogAdapter();
    }
    
    if (contactMethod.type === 'phone') {
        const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN } = process.env;

        if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN) {
            console.log('Twilio credentials found. Using TwilioAdapter.');
            return new TwilioAdapter(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
        }

        const { MESSAGEBIRD_AUTH_TOKEN, MESSAGEBIRD_ORIGINATOR } = process.env;

        if (MESSAGEBIRD_AUTH_TOKEN && MESSAGEBIRD_ORIGINATOR) {
            console.log('Messagebird credentials found. Using MessagebirdAdapter.');
            return new MessagebirdAdapter(MESSAGEBIRD_AUTH_TOKEN, MESSAGEBIRD_ORIGINATOR);
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
