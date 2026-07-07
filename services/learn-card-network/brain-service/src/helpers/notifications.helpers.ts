import { getDidWebLearnCard } from '@helpers/learnCard.helpers';
import { LCNNotification } from '@learncard/types';
import { getDidWeb } from '@helpers/did.helpers';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { createWebhookSentRelationship } from '@accesslayer/inbox-credential/relationships/create';
import cache from '@cache';
import { randomUUID } from 'crypto';

// Timeout value in milliseconds for aborting the request
const TIMEOUT = 6000;

const IS_TEST_ENVIRONMENT = String(process.env.NODE_ENV) === 'test';

type NotificationWebhookResponseRecord = Record<string, unknown>;

const LOCAL_WEBHOOK_HOSTNAMES = new Set(['localhost', '127.0.0.1', 'host.docker.internal']);

const isNotificationWebhookResponseRecord = (
    value: unknown
): value is NotificationWebhookResponseRecord => {
    return typeof value === 'object' && value !== null;
};

const isLocalWebhookUrl = (value: string): boolean => {
    try {
        const parsedUrl = new URL(value);

        return LOCAL_WEBHOOK_HOSTNAMES.has(parsedUrl.hostname);
    } catch {
        return false;
    }
};

const getLocalNotificationsWebhookUrl = (): string => {
    const port = process.env.NOTIFICATIONS_SERVICE_PORT ?? '5100';

    return `http://localhost:${port}/api/notifications/send`;
};

const extractNotificationWebhookSuccess = (value: unknown): boolean | null => {
    if (typeof value === 'boolean') return value;

    if (!isNotificationWebhookResponseRecord(value)) return null;

    if (value.sent === true || value.success === true || value.ok === true) return true;

    if ('data' in value) {
        const nestedData = extractNotificationWebhookSuccess(value.data);
        if (nestedData !== null) return nestedData;
    }

    if (isNotificationWebhookResponseRecord(value.result) && 'data' in value.result) {
        const nestedResult = extractNotificationWebhookSuccess(value.result.data);
        if (nestedResult !== null) return nestedResult;
    }

    return null;
};

export const parseNotificationWebhookResponse = (
    responseBody: unknown,
    responseOk: boolean
): boolean => {
    const parsedResponse = extractNotificationWebhookSuccess(responseBody);

    if (parsedResponse !== null) return parsedResponse;

    if (responseOk) {
        console.warn(
            'Notifications Helpers - Webhook returned an unexpected success payload; treating the HTTP success response as delivered.'
        );

        return true;
    }

    return false;
};

export const resolveNotificationWebhookUrl = (
    notification: LCNNotification
): string | undefined => {
    if (typeof notification.webhookUrl === 'string') {
        return notification.webhookUrl;
    }

    const profileWebhook =
        typeof notification.to !== 'string' ? notification.to.notificationsWebhook : undefined;
    const envWebhook = process.env.NOTIFICATIONS_SERVICE_WEBHOOK_URL;

    if (process.env.IS_OFFLINE) {
        if (typeof envWebhook === 'string' && isLocalWebhookUrl(envWebhook)) {
            return envWebhook;
        }

        if (typeof profileWebhook === 'string' && isLocalWebhookUrl(profileWebhook)) {
            return profileWebhook;
        }

        return getLocalNotificationsWebhookUrl();
    }

    if (typeof profileWebhook === 'string') {
        return profileWebhook;
    }

    return envWebhook;
};

const pollUrl = process.env.NOTIFICATIONS_QUEUE_POLL_URL;

const sqs = new SQSClient({
    apiVersion: 'latest',
    region: process.env.AWS_REGION,
    ...(pollUrl && { endpoint: pollUrl.split('/').slice(0, -1).join('/') }),
});

export async function addNotificationToQueue(notification: LCNNotification) {
    if (process.env.IS_E2E_TEST) {
        /**
         * For end-to-end tests, store the last delivery in cache
         */
        await cache.set(`e2e:notification-queue:${randomUUID()}`, JSON.stringify(notification));
    }

    // If running unit tests, do not attempt to deliver (keep legacy behavior for tests)
    if (IS_TEST_ENVIRONMENT) {
        return;
    }

    // In local development (offline or missing SQS URL), deliver directly via webhook
    if (process.env.IS_OFFLINE || !process.env.NOTIFICATIONS_QUEUE_URL) {
        console.log(
            'Notifications Helpers - Local dev fallback: sending directly via sendNotification'
        );

        return sendNotification(notification);
    }

    const command = new SendMessageCommand({
        QueueUrl: process.env.NOTIFICATIONS_QUEUE_URL,
        MessageBody: JSON.stringify(notification),
    });

    return sqs.send(command);
}

export async function sendNotification(notification: LCNNotification) {
    try {
        const notificationsWebhook = resolveNotificationWebhookUrl(notification);

        if (!notificationsWebhook) {
            return false;
        }

        if (typeof notification.to !== 'string') {
            notification.to.did = getDidWeb(
                process.env.DOMAIN_NAME ?? 'network.learncard.com',
                notification.to.profileId ?? ''
            );
        }
        if (
            typeof notification.from !== 'string' &&
            'profileId' in notification.from &&
            notification.from.profileId
        ) {
            notification.from.did = getDidWeb(
                process.env.DOMAIN_NAME ?? 'network.learncard.com',
                notification.from.profileId
            );
        }
        if (!notification.sent) {
            notification.sent = new Date().toISOString();
        }

        if (notificationsWebhook?.startsWith('http')) {
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

            const responseText = await response.text();

            let responseBody: unknown = true;
            if (responseText.trim().length > 0) {
                try {
                    responseBody = JSON.parse(responseText);
                } catch {
                    responseBody = responseText;
                }
            }

            const notificationDelivered = parseNotificationWebhookResponse(
                responseBody,
                response.ok
            );

            if (!notificationDelivered) {
                throw new Error('Notifications Endpoint returned a malformed result');
            }

            try {
                if (notification?.data?.inbox?.issuanceId) {
                    await createWebhookSentRelationship(
                        notification.to?.did,
                        notification.data.inbox.issuanceId,
                        notificationsWebhook,
                        response.status.toString(),
                        responseText
                    );
                }
            } catch (error) {
                console.error(
                    'Notifications Helpers - Error While Creating Webhook Sent Relationship:',
                    error
                );
            }

            return notificationDelivered;
        }
    } catch (error) {
        if (!IS_TEST_ENVIRONMENT) {
            console.error('Notifications Helpers - Error While Sending:', error);
        }
    }
    return false;
}
