import { ModelFactory, NeogmaInstance } from 'neogma';

import { neogma } from '@instance';

/**
 * Persisted, short-lived view receipt (LC-2187 ADR-10).
 *
 * Only the hash of the opaque CSPRNG token is stored — never the token, a viewer
 * identity, an IP, a fingerprint, a credential, a key or any request body. The
 * node is bound to one immutable committed tuple
 * `(namespace, ownerProfileId, shareId, contentVersion, objectRef, operationId)`
 * so a receipt for a superseded revision can never count toward the current one.
 *
 * `consumedAt` is the single-use marker; `lockTick` exists only so a transaction
 * can take a write lock on the receipt AFTER it holds the share write lock.
 * `expiresAt` bounds retention and is indexed for one-shot pruning.
 */
export type ShareViewReceiptRecord = {
    receiptHash: string;
    namespace: string;
    ownerProfileId: string;
    shareId: string;
    contentVersion: number;
    objectRef: string;
    operationId: string;
    createdAt: string;
    expiresAt: string;
    consumedAt: string | null;
};

type ShareViewReceiptProperties = { lockTick?: number } & {
    [Key in keyof ShareViewReceiptRecord]:
        | Exclude<ShareViewReceiptRecord[Key], null>
        | (null extends ShareViewReceiptRecord[Key] ? undefined : never);
};

export type ShareViewReceiptInstance = NeogmaInstance<
    ShareViewReceiptProperties,
    Record<string, never>
>;

/**
 * `:ShareViewReceipt` model registration. The repository writes this label with
 * raw parameterized Cypher so consume + increment happen in one transaction with
 * explicit share-then-receipt lock ordering; the model exists for schema and
 * constraint registration.
 */
export const ShareViewReceipt = ModelFactory<ShareViewReceiptProperties, Record<string, never>>(
    {
        label: 'ShareViewReceipt',
        schema: {
            receiptHash: { type: 'string', required: true },
            namespace: { type: 'string', required: true },
            ownerProfileId: { type: 'string', required: true },
            shareId: { type: 'string', required: true },
            contentVersion: { type: 'number', required: true },
            objectRef: { type: 'string', required: true },
            operationId: { type: 'string', required: true },
            createdAt: { type: 'string', required: true },
            expiresAt: { type: 'string', required: true },
            consumedAt: { type: 'string', required: false },
            lockTick: { type: 'number', required: false },
        },
        primaryKeyField: 'receiptHash',
    },
    neogma
);

export default ShareViewReceipt;
