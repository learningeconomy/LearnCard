import dotenv from 'dotenv';

import { LCNNotification } from '@learncard/types';
import { getMessaging, TokenMessage } from 'firebase-admin/messaging';
import app from '@firebase';

import { getTokensForDid } from '@accesslayer/pushtokens/read';

import { FCMBulkSendResponse } from 'types/notifications';
import { getUnreadNotificationsCountForDid } from './notifications.helpers';

dotenv.config();

const IS_TEST_ENVIRONMENT = process.env.NODE_ENV === 'test';

// Static value set by Firebase API: https://firebase.google.com/docs/cloud-messaging/send-message#send-a-batch-of-messages
const FIREBASE_MAXIMUM_SEND_BATCH = 500;

const EMPTY_FCM_BULK_RESPONSE: FCMBulkSendResponse = {
    failureCount: 0,
    successCount: 0,
    failedTokens: [],
};

export async function sendPushNotification(
    notification: LCNNotification
): Promise<FCMBulkSendResponse> {
    const { to } = notification;
    const recipientDid = typeof to === 'string' ? to : to.did;

    const recipientTokens = await getTokensForDid(recipientDid);
    if (!recipientTokens || recipientTokens.length <= 0) return EMPTY_FCM_BULK_RESPONSE;

    const messages = await _constructMessagesWithTokens(
        notification,
        recipientDid,
        recipientTokens
    );
    if (messages.length <= 0) return EMPTY_FCM_BULK_RESPONSE;

    const result = await _sendBulkMessages(messages);
    // TODO: Track inactive tokens in cache, and delete when they are expired.
    // TODO: Remove all awaits that are uneccsarry
    return result;
}

/**
 *  Helper function for constructing a message from a notification payload, a specific userToken, and a badgeCount.
 * Handles assigning userToken to message & adding android and iOS specific properties
 * */
const _constructMessage = (
    notification: LCNNotification,
    token: string,
    badgeCount: number
): TokenMessage => {
    let message: TokenMessage = {
        token,
        data: {
            raw: JSON.stringify(notification),
        },
        notification: notification.message,
    };

    // Add android icon to push notification
    if (process.env.ANDROID_PUSH_ICON) {
        message.android = {
            notification: {
                icon: process.env.ANDROID_PUSH_ICON,
            },
        };
    }

    // If there is a badge count update, add that to apns payload for ios
    if (badgeCount) {
        message.apns = {
            payload: {
                aps: {
                    badge: badgeCount,
                },
            },
        };
    }

    return message;
};

const _getBadgeCountForDid = async (did: string): Promise<number> => {
    return getUnreadNotificationsCountForDid(did);
};

const _constructMessagesWithTokens = async (
    notification: LCNNotification,
    recipientDid: string,
    recipientTokens: string[]
): Promise<TokenMessage[]> => {
    const messages = [];
    const badgeCount = await _getBadgeCountForDid(recipientDid);
    for (let x = 0; x < recipientTokens.length; x += 1) {
        if (typeof recipientTokens[x] === 'string') {
            messages.push(
                _constructMessage(notification, recipientTokens[x] as string, badgeCount)
            );
        }
    }
    return messages.filter(msg => msg !== null);
};

const _sendMessageChunk = async (
    messageChunk: TokenMessage[],
    allMessages?: TokenMessage[]
): Promise<FCMBulkSendResponse> => {
    // Don't send Push Notifications in test environment.
    if (IS_TEST_ENVIRONMENT) {
        return {
            successCount: messageChunk.length,
            failureCount: 0,
            failedTokens: [],
        };
    }
    try {
        const response = await (getMessaging(app) as any).sendEach(messageChunk);
        const failedTokens: string[] = [];
        if (response.failureCount > 0) {
            response.responses.forEach((resp: any, idx: any) => {
                if (allMessages && !resp.success && allMessages[idx]?.token) {
                    failedTokens.push((allMessages[idx] as TokenMessage).token);
                }
            });
            console.log(`${response.failureCount} messages failed. Disabling...`);
            console.log(`Response: ${JSON.stringify(response, null, 4)}`);
            // Disable failed tokens..
        }
        return {
            successCount: response.successCount,
            failureCount: response.failureCount,
            failedTokens,
        };
    } catch (e) {
        console.error('Failed to send message chunk', e);
        return {
            successCount: 0,
            failureCount: messageChunk.length,
            failedTokens: messageChunk.map(message => message.token),
        };
    }
};
/**
 * Takes advantage of firebase bulk API for sending up to 500 messages at a time to prevent rate throttling.
 * https://firebase.google.com/docs/cloud-messaging/send-message#send-a-batch-of-messages
 *
 * For even higher volumes of messages (~ >10,000s), should consider using Multicase or Topics
 * https://firebase.google.com/docs/cloud-messaging/send-message#send-messages-to-multiple-devices
 * https://firebase.google.com/docs/cloud-messaging/send-message#send-messages-to-topics
 * */
const _sendBulkMessages = async (messages: TokenMessage[]): Promise<FCMBulkSendResponse> => {
    if (messages.length <= 0) {
        return EMPTY_FCM_BULK_RESPONSE;
    }
    return new Promise(async (resolve, reject) => {
        try {
            // If there is > 1 message, use bulk API
            const chunkedMessages = _chunk(
                messages,
                FIREBASE_MAXIMUM_SEND_BATCH
            ) as TokenMessage[][];
            const results = (await Promise.all(
                chunkedMessages.map(messageChunk => _sendMessageChunk(messageChunk, messages))
            )) as FCMBulkSendResponse[];
            const totalResults = results.reduce(
                (
                    previous: FCMBulkSendResponse,
                    current: FCMBulkSendResponse
                ): FCMBulkSendResponse => {
                    return {
                        successCount: previous.successCount + current.successCount,
                        failureCount: previous.failureCount + current.failureCount,
                        failedTokens: [
                            ...(previous?.failedTokens || []),
                            ...(current?.failedTokens || []),
                        ],
                    };
                },
                EMPTY_FCM_BULK_RESPONSE
            );
            resolve(totalResults);
        } catch (e) {
            console.error('Error sending Bulk Messages', e);
            reject(e);
        }
    });
};

const _chunk = (array: any[], chunkSize: number): any[][] => {
    if (array.length <= 0) return [];
    const chunks = [];
    for (let i = 0; i < array.length; i += chunkSize) {
        chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
};
