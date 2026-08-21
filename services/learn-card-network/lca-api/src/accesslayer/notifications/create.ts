import { Notifications } from '.';
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
