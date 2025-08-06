import { z } from 'zod';
import { getDidWebLearnCard } from '@helpers/learnCard.helpers';
import { LCNNotification } from '@learncard/types';
import { getDidWeb } from '@helpers/did.helpers';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { createWebhookSentRelationship } from '@accesslayer/inbox-credential/relationships/create';
import cache from '@cache';
import { randomUUID } from 'crypto';

// Timeout value in milliseconds for aborting the request
const TIMEOUT = 6000;

const pollUrl = process.env.NOTIFICATIONS_QUEUE_POLL_URL;

const sqs = new SQSClient({
    apiVersion: 'latest',
    region: process.env.AWS_REGION,
    ...(pollUrl && { endpoint: pollUrl.split('/').slice(0, -1).join('/') }),
});

export async function addNotificationToQueue(notification: LCNNotification) {
    if (!!process.env.IS_E2E_TEST) {
        /** 
         * For end-to-end tests, store the last delivery in cache
         */
        await cache.set(`e2e:notification-queue:${randomUUID()}`, JSON.stringify(notification));
    }

    if (
        process.env.NODE_ENV === 'test' ||
        process.env.IS_OFFLINE ||
        !process.env.NOTIFICATIONS_QUEUE_URL
    ) {
        return; // Can not use SQS in test environment or locally
    }

    const command = new SendMessageCommand({
        QueueUrl: process.env.NOTIFICATIONS_QUEUE_URL,
        MessageBody: JSON.stringify(notification),
    });

    return sqs.send(command);
}

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
                notification.to.profileId ?? ''
            );
        }
        if (typeof notification.from !== 'string') {
            notification.from.did = getDidWeb(
                process.env.DOMAIN_NAME ?? 'network.learncard.com',
                notification.from.profileId ?? ''
            );
        }
        if (!notification.sent) {
            notification.sent = new Date().toISOString();
        }
        // If webhookUrl is provided, use it instead of the default. It takes precedence over the default and 'to' default.
        if(typeof notification.webhookUrl === 'string') {
            notificationsWebhook = notification.webhookUrl;
        }

        if (typeof notificationsWebhook === 'string' && notificationsWebhook?.startsWith('http')) {
            if (process.env.NODE_ENV !== 'test') {
                console.log(
                    'Sending notification!',
                    notificationsWebhook,
                    JSON.stringify(notification)
                );
            }

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

            if (!res) throw new Error(res);

            const validationResult = await z.boolean().spa(res);

            if (!validationResult.success) {
                throw new Error('Notifications Endpoint returned a malformed result');
                
            } 
            
            try {
                if (notification?.data?.inbox?.issuanceId) {
                    await createWebhookSentRelationship(
                        notification.to?.did,
                        notification.data.inbox.issuanceId,
                        notificationsWebhook,
                        res.status.toString(),
                        JSON.stringify(res)
                    );
                }
            } catch (error) {
                console.error('Notifications Helpers - Error While Creating Webhook Sent Relationship:', error);
            }

            return validationResult.data;
        }
    } catch (error) {
        if (process.env.NODE_ENV !== 'test') {
            console.error('Notifications Helpers - Error While Sending:', error);
        }
    }
    return false;
}
