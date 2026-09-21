import { neogma } from '@instance';

import { readNodeProperties, toShareLinkRecord } from './helpers';
import type {
    CurrentShareContentResult,
    GetCurrentShareContentInput,
    GetShareLinkInput,
} from './types';
import type { ShareLinkRecord } from '../../models/ShareLink';

/**
 * Reads one committed share snapshot by opaque id, optionally constrained to the
 * caller's namespace and owner. Cross-namespace/cross-owner reads return null so a
 * route can answer without an existence oracle.
 */
export const getShareLink = async (input: GetShareLinkInput): Promise<ShareLinkRecord | null> => {
    const result = await neogma.queryRunner.run(
        `MATCH (s:ShareLink {id: $shareId})
         WHERE ($namespace IS NULL OR s.namespace = $namespace)
           AND ($ownerProfileId IS NULL OR s.ownerProfileId = $ownerProfileId)
         RETURN s LIMIT 1`,
        {
            shareId: input.shareId,
            namespace: input.namespace ?? null,
            ownerProfileId: input.ownerProfileId ?? null,
        }
    );

    const props = readNodeProperties(result, 's');

    return props ? toShareLinkRecord(props) : null;
};

/**
 * Returns the single committed content reference that may be served, or a typed
 * not-active/missing state.
 *
 * The expiry check is synchronous and read-only: an expired share is reported
 * `not_active` while its bytes are retained, so a metadata-only expiry extension
 * can later make it serve again. This method never deletes content and never
 * mutates the graph — it is the read primitive a later Brain proxy route can use.
 */
export const getCurrentShareContent = async (
    input: GetCurrentShareContentInput
): Promise<CurrentShareContentResult> => {
    const share = await getShareLink(input);

    if (!share) return { state: 'missing' };

    const base = {
        shareId: share.id,
        namespace: share.namespace,
        ownerProfileId: share.ownerProfileId,
    };

    if (share.status === 'stopped') {
        return {
            state: 'not_active',
            ...base,
            status: share.status,
            contentState: share.contentState,
            reason: 'stopped',
        };
    }

    if (
        share.status !== 'active' ||
        share.contentState !== 'finalized' ||
        !share.activeObjectRef ||
        !share.activeObjectOperationId
    ) {
        return {
            state: 'not_active',
            ...base,
            status: share.status,
            contentState: share.contentState,
            reason: share.contentState === 'content_missing' ? 'content_missing' : 'staging',
        };
    }

    const now = input.now ?? new Date();

    if (!input.allowExpired && share.expiresAt && Date.parse(share.expiresAt) <= now.getTime()) {
        return {
            state: 'not_active',
            ...base,
            status: share.status,
            contentState: share.contentState,
            reason: 'expired',
        };
    }

    return {
        state: 'active',
        ...base,
        version: share.version,
        contentVersion: share.contentVersion,
        objectRef: share.activeObjectRef,
        operationId: share.activeObjectOperationId,
        contentHash: share.activeContentHash,
        contentBytes: share.activeContentBytes,
        recoveryHash: share.activeRecoveryHash,
        selectedCount: share.selectedCount,
        expiresAt: share.expiresAt,
        updatedAt: share.updatedAt,
    };
};
