import { getDidWebLearnCard } from '@helpers/learnCard.helpers';
import { LCNNotification } from '@learncard/types';

export async function sendNotification(notification: LCNNotification) {
    try {
        if (process.env.NOTIFICATIONS_SERVICE_WEBHOOK_URL) {
            const learnCard = await getDidWebLearnCard();

            const didJwt = await learnCard.invoke.getDidAuthVp({ proofFormat: 'jwt' });

            const response = await fetch(process.env.NOTIFICATIONS_SERVICE_WEBHOOK_URL, {
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
        }
    } catch (error) {
        console.error('Notifications Helpers - Error While Sending:', error);
    }
}