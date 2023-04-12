import { z } from 'zod';
import { getDidWebLearnCard } from '@helpers/learnCard.helpers';
import { LCNNotification } from '@learncard/types';
import { getDidWeb } from '@helpers/did.helpers';

// Timeout value in milliseconds for aborting the request
const TIMEOUT = 6000;

export async function sendNotification(notification: LCNNotification) {
    try {
        let notificationsWebhook = process.env.NOTIFICATIONS_SERVICE_WEBHOOK_URL;
        if (
            typeof notification.to !== 'string' &&
            typeof notification.to.notificationsWebhook === 'string'
        ) {
            notificationsWebhook = notification.to.notificationsWebhook;
            notification.to.did = getDidWeb(
                process.env.DOMAIN_NAME ?? 'network.learncard.com',
                notification.to.profileId
            );
        }
        if (typeof notification.from !== 'string') {
            notification.from.did = getDidWeb(
                process.env.DOMAIN_NAME ?? 'network.learncard.com',
                notification.from.profileId
            );
        }
        if (!notification.sent) {
            notification.sent = new Date().toISOString();
        }
        if (typeof notificationsWebhook === 'string' && notificationsWebhook?.startsWith('http')) {
            console.log(
                'Sending notification!',
                notificationsWebhook,
                JSON.stringify(notification)
            );
            const learnCard = await getDidWebLearnCard();

            const didJwt = await learnCard.invoke.getDidAuthVp({ proofFormat: 'jwt' });

            // Create an AbortController instance and get the signal
            const controller = new AbortController();
            const { signal } = controller;

            // Set a timeout to abort the fetch request
            const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);

            const response = await fetch(notificationsWebhook, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${didJwt}`,
                },
                body: JSON.stringify(notification),
                signal,
            });

            clearTimeout(timeoutId);

            const res = await response.json();

            if (!res) {
                throw new Error(res);
            }

            const validationResult = await z.boolean().spa(res);
            if (!validationResult.success)
                throw new Error('Notifications Endpoint returned a malformed result');
            return validationResult.data;
        }
    } catch (error) {
        console.error('Notifications Helpers - Error While Sending:', error);
    }
    return false;
}
