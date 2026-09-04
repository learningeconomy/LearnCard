import { Notifications, ensureManagedCredentialRefreshNotificationIndex } from '.';
import { LCNNotification } from '@learncard/types';
import { createHash } from 'crypto';
import { v4 as uuidv4 } from 'uuid';

export type NotificationCreationResult = {
    created: boolean;
};

const getConnectionPromptId = (notification: LCNNotification): string | undefined => {
    return notification.data?.metadata?.connectionPrompt?.promptId;
};

const getActionableNotificationId = (notification: LCNNotification, promptId: string): string => {
    const recipientDid = notification.to.did;
    const digest = createHash('sha256')
        .update(JSON.stringify([recipientDid, notification.type, promptId]))
        .digest('hex');

    return `connection-prompt:${digest}`;
};

const getCredentialRefreshDeliveryKey = (notification: LCNNotification): string | undefined => {
    const deliveryKey = (notification.data?.metadata as { deliveryKey?: unknown } | undefined)
        ?.deliveryKey;

    return typeof deliveryKey === 'string' && deliveryKey.length > 0 ? deliveryKey : undefined;
};

/** Only managed refresh events opt into delivery-key collapsing. */
export const isManagedCredentialRefreshNotification = (notification: LCNNotification): boolean => {
    if (notification.type === 'CREDENTIAL_REFRESHED') return true;

    const metadata = notification.data?.metadata;

    return (
        notification.type === 'CREDENTIAL_RECEIVED' &&
        metadata?.managedCredentialRefreshInitial === true &&
        typeof metadata.deliveryKey === 'string' &&
        metadata.deliveryKey.length > 0
    );
};

const getCredentialRefreshNotificationId = (
    notification: LCNNotification,
    deliveryKey: string
): string => {
    const recipientDid = notification.to.did;
    const digest = createHash('sha256')
        .update(JSON.stringify([recipientDid, notification.type, deliveryKey]))
        .digest('hex');

    return `credential-refresh:${digest}`;
};

const isAmbiguousMongoWriteError = (error: unknown): boolean => {
    if (typeof error !== 'object' || error === null) return false;

    const { name, errorLabels } = error as { name?: unknown; errorLabels?: unknown };

    if (
        typeof name === 'string' &&
        (name.startsWith('MongoNetwork') ||
            name === 'MongoOperationTimeoutError' ||
            name === 'MongoWriteConcernError')
    ) {
        return true;
    }

    return (
        Array.isArray(errorLabels) &&
        errorLabels.some(
            label => label === 'RetryableWriteError' || label === 'UnknownTransactionCommitResult'
        )
    );
};

export const createNotification = async (
    notification: LCNNotification
): Promise<NotificationCreationResult | false> => {
    try {
        const promptId = getConnectionPromptId(notification);

        if (!promptId) {
            await Notifications.insertOne({
                _id: uuidv4(),
                read: false,
                archived: false,
                sent: new Date().toISOString(),
                ...notification,
            });

            return { created: true };
        }

        const recipientDid = notification.to.did;
        const result = await Notifications.updateOne(
            {
                'to.did': recipientDid,
                type: notification.type,
                'data.metadata.connectionPrompt.promptId': promptId,
            },
            {
                $setOnInsert: {
                    _id: getActionableNotificationId(notification, promptId),
                    read: false,
                    archived: false,
                    sent: new Date().toISOString(),
                    ...notification,
                },
            },
            { upsert: true }
        );

        return { created: result.upsertedCount === 1 };
    } catch (e) {
        if (
            typeof e === 'object' &&
            e !== null &&
            'code' in e &&
            (e as { code?: unknown }).code === 11000
        ) {
            return { created: false };
        }

        if (isAmbiguousMongoWriteError(e)) throw e;

        console.error(e);
        return false;
    }
};

/**
 * Atomically collapses managed credential refresh deliveries (LC-2117/LC-2136).
 *
 * One record per (recipient DID, type, opaque delivery-window key). Refresh-version
 * events update the window record with the latest opaque metadata and mark it unread;
 * managed initial deliveries are one-shot and never mutate after insertion. A
 * deterministic `_id` plus an internal, partial unique index keeps concurrent first
 * deliveries to one record without constraining unrelated metadata.deliveryKey fields.
 * Only generic translated copy and opaque metadata are stored — never credential
 * subject data. Notifications without a delivery key use the legacy insertion path.
 */
export const upsertCredentialRefreshNotification = async (
    notification: LCNNotification
): Promise<NotificationCreationResult | false> => {
    await ensureManagedCredentialRefreshNotificationIndex();

    const deliveryKey = getCredentialRefreshDeliveryKey(notification);

    if (!deliveryKey) return createNotification(notification);

    try {
        const notificationId = getCredentialRefreshNotificationId(notification, deliveryKey);
        const managedInitial =
            notification.type === 'CREDENTIAL_RECEIVED' &&
            notification.data?.metadata?.managedCredentialRefreshInitial === true;
        const sent = new Date().toISOString();
        const update = managedInitial
            ? {
                  $setOnInsert: {
                      _id: notificationId,
                      read: false,
                      archived: false,
                      sent,
                      ...notification,
                      managedCredentialRefreshDeliveryKey: notificationId,
                  },
              }
            : {
                  $set: {
                      read: false,
                      sent,
                      managedCredentialRefreshDeliveryKey: notificationId,
                      ...(notification.message && { message: notification.message }),
                      ...(notification.data && { data: notification.data }),
                  },
                  $setOnInsert: {
                      _id: notificationId,
                      archived: false,
                      to: notification.to,
                      from: notification.from,
                      type: notification.type,
                  },
              };
        const result = await Notifications.updateOne(
            {
                'to.did': notification.to.did,
                type: notification.type,
                'data.metadata.deliveryKey': deliveryKey,
            },
            update,
            { upsert: true }
        );

        return { created: result.upsertedCount === 1 };
    } catch (e) {
        if (
            typeof e === 'object' &&
            e !== null &&
            'code' in e &&
            (e as { code?: unknown }).code === 11000
        ) {
            return { created: false };
        }

        if (isAmbiguousMongoWriteError(e)) throw e;

        console.error(e);
        return false;
    }
};
