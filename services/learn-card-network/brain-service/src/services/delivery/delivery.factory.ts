import { DeliveryService } from './delivery.service';
import { LogAdapter } from './adapters/log.adapter';
import { PostmarkAdapter } from './adapters/postmark.adapter';

let deliveryService: DeliveryService;

export const getDeliveryService = (): DeliveryService => {
    if (deliveryService) {
        return deliveryService;
    }

    if (process.env.POSTMARK_API_KEY) {
        console.log('Postmark API Key found. Using PostmarkAdapter.');
        deliveryService = new PostmarkAdapter(process.env.POSTMARK_API_KEY);
    } else {
        console.log('No Postmark API Key found. Using LogAdapter.');
        deliveryService = new LogAdapter();
    }

    return deliveryService;
};
