import { ModelFactory, NeogmaInstance } from 'neogma';

import { neogma } from '@instance';

/** Lifecycle status of a share. Only `active` is ever served to a recipient. */
export type ShareLinkStatus = 'pending' | 'active' | 'stopped';

/**
 * Whether the visible content pointer for a share is committed.
 *
 * `staging` means a reservation exists but the object is not visible yet;
 * `content_missing` means Brain believes content should be visible but LearnCloud
 * does not have it, so the share fails closed and is never served.
 */
export type ShareContentState = 'staging' | 'finalized' | 'content_missing';

/**
 * Persisted ShareLink metadata (LC-2187).
 *
 * This node is the only Brain-side source of truth for the *visible* content
 * pointer. It stores an opaque immutable `activeObjectRef` plus content/recovery
 * hashes and byte counts — never ciphertext, a raw private source URI or a key.
 * The concrete encrypted envelope and owner recovery JWE live together in the
 * dedicated LearnCloud collection keyed by the immutable object reference.
 *
 * `version` is the committed record revision used for optimistic concurrency; a
 * reservation (`staging`) does not change it. `contentVersion` is the visible
 * content revision and changes only when a replacement is finalized.
 */
export type ShareLinkRecord = {
    id: string;
    namespace: string;
    ownerProfileId: string;
    version: number;
    contentVersion: number;
    /**
     * Monotonic fence. Bumped on every reservation and on revoke; a worker may
     * only finalize the reservation whose generation still equals this value.
     */
    generation: number;
    status: ShareLinkStatus;
    contentState: ShareContentState;
    activeObjectRef: string | null;
    activeObjectOperationId: string | null;
    activeContentHash: string | null;
    activeContentBytes: number | null;
    activeRecoveryHash: string | null;
    /** Operation binding: the operation id that produced the visible revision. */
    lastOperationId: string | null;
    /** Operation binding: the create request that first bound this share id. */
    createdByClientRequestId: string | null;
    title: string;
    note: string | null;
    selectedCount: number;
    expiresAt: string | null;
    stoppedAt: string | null;
    viewCount: number;
    lastViewedAt: string | null;
    /** Argon2id PHC string. Plaintext passcodes are never persisted. */
    passcodeHash?: string | null;
    notifyOnView?: boolean;
    minorPolicyIsMinor: boolean | null;
    minorPolicyResolved: boolean;
    minorPolicyDefaultExpiryDays: number;
    minorPolicyViewCountingEnabled: boolean;
    createdAt: string;
    updatedAt: string;
};

/** Neo4j omits null properties; the repository maps missing values back to null. */
type ShareLinkProperties = { lockTick?: number } & {
    [Key in keyof ShareLinkRecord]:
        | Exclude<ShareLinkRecord[Key], null>
        | (null extends ShareLinkRecord[Key] ? undefined : never);
};
export type ShareLinkInstance = NeogmaInstance<ShareLinkProperties, Record<string, never>>;

/**
 * `:ShareLink` model registration. The repository writes this label with raw
 * parameterized Cypher so it can hold the share write lock across read + write
 * within one transaction; the model exists for schema/typed instance support and
 * constraint registration.
 */
export const ShareLink = ModelFactory<ShareLinkProperties, Record<string, never>>(
    {
        label: 'ShareLink',
        schema: {
            id: { type: 'string', required: true },
            namespace: { type: 'string', required: true },
            ownerProfileId: { type: 'string', required: true },
            version: { type: 'number', required: true },
            contentVersion: { type: 'number', required: true },
            generation: { type: 'number', required: true },
            status: { type: 'string', required: true, enum: ['pending', 'active', 'stopped'] },
            contentState: {
                type: 'string',
                required: true,
                enum: ['staging', 'finalized', 'content_missing'],
            },
            activeObjectRef: { type: 'string', required: false },
            activeObjectOperationId: { type: 'string', required: false },
            activeContentHash: { type: 'string', required: false },
            activeContentBytes: { type: 'number', required: false },
            activeRecoveryHash: { type: 'string', required: false },
            lastOperationId: { type: 'string', required: false },
            createdByClientRequestId: { type: 'string', required: false },
            title: { type: 'string', required: true },
            note: { type: 'string', required: false },
            selectedCount: { type: 'number', required: true },
            expiresAt: { type: 'string', required: false },
            stoppedAt: { type: 'string', required: false },
            viewCount: { type: 'number', required: true },
            lastViewedAt: { type: 'string', required: false },
            passcodeHash: { type: 'string', required: false },
            // LC-2187 records created before opt-in alerts may omit this field.
            notifyOnView: { type: 'boolean', required: false },
            minorPolicyIsMinor: { type: 'boolean', required: false },
            minorPolicyResolved: { type: 'boolean', required: true },
            minorPolicyDefaultExpiryDays: { type: 'number', required: true },
            minorPolicyViewCountingEnabled: { type: 'boolean', required: true },
            createdAt: { type: 'string', required: true },
            updatedAt: { type: 'string', required: true },
            lockTick: { type: 'number', required: false },
        },
        primaryKeyField: 'id',
    },
    neogma
);

export default ShareLink;
