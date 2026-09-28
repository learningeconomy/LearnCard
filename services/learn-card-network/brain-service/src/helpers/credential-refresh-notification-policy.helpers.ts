import { neogma } from '@instance';

/**
 * Initializes the initial-delivery notification policy for legacy/unbound aggregates.
 * The write lock taken by SET plus coalesce makes the first persisted decision win;
 * retries can observe the policy but cannot change it.
 */
export const ensureInitialNotificationPolicy = async (
    refreshId: string,
    initialNotificationSuppressed: boolean
): Promise<boolean> => {
    const result = await neogma.queryRunner.run(
        `MATCH (refresh:CredentialRefresh {refreshId: $refreshId})
         SET refresh.initialNotificationSuppressed =
             coalesce(refresh.initialNotificationSuppressed, $initialNotificationSuppressed)
         RETURN refresh.initialNotificationSuppressed AS initialNotificationSuppressed`,
        { refreshId, initialNotificationSuppressed }
    );
    const persistedPolicy = result.records[0]?.get('initialNotificationSuppressed');

    if (typeof persistedPolicy !== 'boolean') {
        throw new Error('Credential refresh notification policy could not be initialized');
    }

    return persistedPolicy;
};
