import { neogma } from '@instance';

/**
 * Persisted, unique claim per (refreshId, delivery window) for the managed
 * credential-refresh update email (LC-2198).
 *
 * Why a dedicated node instead of a conditional property write: Neo4j's
 * read-committed isolation does not re-evaluate a `WHERE` after a write lock is
 * acquired, so two concurrent `SET ... WHERE windowKey <> $key` statements can
 * both "win" and send two emails. A unique constraint on `deliveryKey` makes the
 * claim a hard single-writer: exactly one `CREATE` succeeds, every loser observes
 * a constraint violation and skips.
 *
 * This gives at-most-once email delivery per configured window. A send that fails
 * after the claim is recorded as `failed` and is NOT retried inside the same
 * window (see `credential-refresh-email.helpers.ts` for the explicit policy).
 */

export type CredentialRefreshEmailDeliveryState = 'claimed' | 'delivered' | 'failed';

const deliveryKeyFor = (refreshId: string, windowKey: string): string =>
    `${refreshId}:${windowKey}`;

const isUniqueConstraintViolation = (error: unknown): boolean => {
    const code = (error as { code?: string })?.code;

    return (
        code === 'Neo.ClientError.Schema.ConstraintValidationFailed' ||
        (error instanceof Error && error.message.includes('already exists'))
    );
};

/**
 * Attempts to claim the email delivery window. Returns `'claimed'` for the single
 * winner and `'duplicate'` for every concurrent or retried caller.
 */
export const claimCredentialRefreshEmailDelivery = async (params: {
    refreshId: string;
    windowKey: string;
}): Promise<'claimed' | 'duplicate'> => {
    const { refreshId, windowKey } = params;
    const now = new Date().toISOString();

    try {
        await neogma.queryRunner.run(
            `CREATE (delivery:CredentialRefreshEmailDelivery {
                 deliveryKey: $deliveryKey,
                 refreshId: $refreshId,
                 windowKey: $windowKey,
                 state: 'claimed',
                 attempts: 1,
                 createdAt: $now,
                 updatedAt: $now
             })`,
            {
                deliveryKey: deliveryKeyFor(refreshId, windowKey),
                refreshId,
                windowKey,
                now,
            }
        );

        return 'claimed';
    } catch (error) {
        if (isUniqueConstraintViolation(error)) return 'duplicate';

        throw error;
    }
};

/** Records the terminal outcome of a claimed delivery attempt. */
export const finalizeCredentialRefreshEmailDelivery = async (params: {
    refreshId: string;
    windowKey: string;
    state: Extract<CredentialRefreshEmailDeliveryState, 'delivered' | 'failed'>;
}): Promise<void> => {
    const { refreshId, windowKey, state } = params;
    const now = new Date().toISOString();

    await neogma.queryRunner.run(
        `MATCH (delivery:CredentialRefreshEmailDelivery {deliveryKey: $deliveryKey})
         SET delivery.state = $state, delivery.updatedAt = $now`,
        { deliveryKey: deliveryKeyFor(refreshId, windowKey), state, now }
    );
};

/** Reads a delivery record for observability and tests. */
export const getCredentialRefreshEmailDelivery = async (
    refreshId: string,
    windowKey: string
): Promise<{
    deliveryKey: string;
    refreshId: string;
    windowKey: string;
    state: CredentialRefreshEmailDeliveryState;
    attempts: number;
} | null> => {
    const result = await neogma.queryRunner.run(
        `MATCH (delivery:CredentialRefreshEmailDelivery {deliveryKey: $deliveryKey})
         RETURN delivery LIMIT 1`,
        { deliveryKey: deliveryKeyFor(refreshId, windowKey) }
    );
    const node = result.records[0]?.get('delivery');

    if (!node) return null;

    const props = node.properties;

    return {
        deliveryKey: props.deliveryKey,
        refreshId: props.refreshId,
        windowKey: props.windowKey,
        state: props.state,
        attempts: Number(props.attempts),
    };
};
