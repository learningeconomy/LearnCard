import { NOTIFICATIONS_COLLECTION, MongoNotificationType } from '@models';
import mongodb from '@mongo';

type StoredNotification = MongoNotificationType & {
    /** Internal-only unique key; API output validators strip it from responses. */
    managedCredentialRefreshDeliveryKey?: string;
};

export const getNotificationsCollection = () => {
    return mongodb.collection<StoredNotification>(NOTIFICATIONS_COLLECTION);
};

export const Notifications = getNotificationsCollection();

Notifications.createIndex({ 'to.did': 1, read: 1, sent: -1, _id: 1 });
Notifications.createIndex({
    'to.did': 1,
    type: 1,
    'data.metadata.connectionPrompt.promptId': 1,
});

const LEGACY_CREDENTIAL_REFRESH_INDEX = 'to.did_1_type_1_data.metadata.deliveryKey_1';
const MANAGED_CREDENTIAL_REFRESH_INDEX = 'managed_credential_refresh_delivery_key_unique';

type MongoIndexError = { code?: number; codeName?: string };

const isMissingIndex = (error: unknown): boolean => {
    const mongoError = error as MongoIndexError | undefined;

    return mongoError?.code === 27 || mongoError?.codeName === 'IndexNotFound';
};

const createManagedCredentialRefreshNotificationIndex = async (): Promise<void> => {
    // This internal field is written only by the managed-refresh upsert path, so
    // unrelated notifications may freely use metadata.deliveryKey.
    await Notifications.createIndex(
        { managedCredentialRefreshDeliveryKey: 1 },
        {
            name: MANAGED_CREDENTIAL_REFRESH_INDEX,
            unique: true,
            partialFilterExpression: {
                managedCredentialRefreshDeliveryKey: { $type: 'string' },
            },
        }
    );

    // Remove the pre-release broad index when upgrading an existing local/test DB.
    try {
        await Notifications.dropIndex(LEGACY_CREDENTIAL_REFRESH_INDEX);
    } catch (error) {
        if (!isMissingIndex(error)) throw error;
    }
};

let managedCredentialRefreshIndexReadiness: Promise<void> | undefined;

/**
 * Ensures managed-refresh uniqueness before delivery. Concurrent callers share one
 * attempt; failures clear readiness so a later queue retry can try again.
 */
export const ensureManagedCredentialRefreshNotificationIndex = (): Promise<void> => {
    if (!managedCredentialRefreshIndexReadiness) {
        const pendingReadiness = createManagedCredentialRefreshNotificationIndex();
        managedCredentialRefreshIndexReadiness = pendingReadiness;

        void pendingReadiness.catch(() => {
            if (managedCredentialRefreshIndexReadiness === pendingReadiness) {
                managedCredentialRefreshIndexReadiness = undefined;
            }
        });
    }

    return managedCredentialRefreshIndexReadiness;
};
