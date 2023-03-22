import { getDidWebLearnCard } from '@helpers/learnCard.helpers';
import { LCNNotification } from '@learncard/types';

export async function sendNotification(notification: LCNNotification) {
    try {
        let notificationsWebhook = process.env.NOTIFICATIONS_SERVICE_WEBHOOK_URL;
        if (
            typeof notification.to !== 'string' &&
            typeof notification.to.notificationsWebhook === 'string'
        ) {
            notificationsWebhook = notification.to.notificationsWebhook;
        }
        if (typeof notificationsWebhook === 'string' && notificationsWebhook?.startsWith('http')) {
            const learnCard = await getDidWebLearnCard();

            const didJwt = await learnCard.invoke.getDidAuthVp({ proofFormat: 'jwt' });

            const response = await fetch(notificationsWebhook, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${didJwt}`,
                },
                body: JSON.stringify(notification),
            });
            const res = await response.json();

            if (!res) {
                throw new Error(res);
            }
            return res;
        } else {
            console.log(
                '🐶 NO NOTIFICATIONS ENDPOINT FOUND',
                notificationsWebhook,
                notification.to
            );
        }
    } catch (error) {
        console.error('Notifications Helpers - Error While Sending:', error);
    }
}