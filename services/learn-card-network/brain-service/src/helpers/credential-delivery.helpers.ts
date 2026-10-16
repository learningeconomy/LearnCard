import { logCredentialSent } from './activity.helpers';
import { notifyBoostRecipient, persistBoostDelivery } from './boost.helpers';
import { neogma } from '@instance';
import type { BoostDeliveryOptions } from 'types/credential-delivery';

/**
 * Commit activity and delivery together. Signing happens before this graph-only
 * transaction; notifications run afterward. No issuance or delivery retries.
 */
export const sendBoostWithActivity = async (
    activity: Parameters<typeof logCredentialSent>[0],
    delivery: Omit<BoostDeliveryOptions, 'activityId' | 'autoAcceptCredential'>
): Promise<string> => {
    const session = neogma.driver.session();
    const transaction = session.beginTransaction({ timeout: 30_000 });
    let credentialUri: string;
    try {
        const activityId = await logCredentialSent(activity, transaction);
        credentialUri = await persistBoostDelivery({ ...delivery, activityId }, transaction);
        await transaction.commit();
    } catch (error) {
        await transaction
            .rollback()
            .catch(rollbackError =>
                console.error('Failed to roll back credential delivery', rollbackError)
            );
        throw error;
    } finally {
        // A session-close failure must not turn a committed delivery into an error.
        await session
            .close()
            .catch(error => console.error('Failed to close credential delivery session', error));
    }

    if (!delivery.skipNotification) {
        try {
            notifyBoostRecipient(delivery, credentialUri);
        } catch (error) {
            console.error(
                'Failed to enqueue notification after committed credential delivery',
                error
            );
        }
    }
    return credentialUri;
};
