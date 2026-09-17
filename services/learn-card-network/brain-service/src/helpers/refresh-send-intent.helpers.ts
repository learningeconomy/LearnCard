import { createHash, randomUUID } from 'crypto';
import { TRPCError } from '@trpc/server';
import type { ManagedCredentialRefreshReceipt, SendBoostResponse } from '@learncard/types';
import { canonicalizeCredentialJson } from '@learncard/helpers';

import { neogma } from '@instance';

import { getInitialRefreshRoot, getManagedCredentialUri } from './credential-refresh.helpers';

/** A preparation not touched for this long is considered abandoned and may be taken over. */
export const REFRESH_SEND_INTENT_STALE_MS = 5 * 60_000;

export type RefreshSendIntentState = 'preparing' | 'prepared' | 'delivered';

/**
 * Whole-call idempotency record for a managed refresh send (LC-2198 follow-up).
 * Metadata only: never stores credential claims, subject bodies, plaintext VCs or JWEs.
 */
export type RefreshSendIntent = {
    intentKey: string;
    issuerProfileId: string;
    requestDigest: string;
    state: RefreshSendIntentState;
    claimToken: string;
    boostUri?: string;
    credentialId?: string;
    refreshId?: string;
    holderDid?: string;
    pendingReceipt?: ManagedCredentialRefreshReceipt;
    pendingActivityId?: string;
    result?: SendBoostResponse;
    updatedAt: string;
};

export type ClaimRefreshSendIntentResult =
    | { kind: 'owned'; intent: RefreshSendIntent }
    | { kind: 'prepared'; intent: RefreshSendIntent }
    | { kind: 'delivered'; intent: RefreshSendIntent };

const getIntentKey = (issuerProfileId: string, idempotencyKey: string): string =>
    `${issuerProfileId}:${idempotencyKey}`;

/** Digest of everything that defines a prepare request; a reused key must match it. */
export const computeRefreshSendRequestDigest = (request: {
    recipientProfileId: string;
    holderDid: string;
    templateUri?: string;
    template?: unknown;
    contractUri?: string;
    templateData?: Record<string, unknown>;
    integrationId?: string;
    credentialId?: string;
}): string =>
    createHash('sha256')
        .update(
            canonicalizeCredentialJson({
                recipientProfileId: request.recipientProfileId,
                holderDid: request.holderDid,
                templateUri: request.templateUri ?? null,
                template: request.template ?? null,
                contractUri: request.contractUri ?? null,
                templateData: request.templateData ?? {},
                integrationId: request.integrationId ?? null,
                credentialId: request.credentialId ?? null,
            })
        )
        .digest('base64url');

const parseIntent = (props: Record<string, unknown>): RefreshSendIntent => ({
    intentKey: props.intentKey as string,
    issuerProfileId: props.issuerProfileId as string,
    requestDigest: props.requestDigest as string,
    state: props.state as RefreshSendIntentState,
    claimToken: props.claimToken as string,
    boostUri: (props.boostUri as string | undefined) ?? undefined,
    credentialId: (props.credentialId as string | undefined) ?? undefined,
    refreshId: (props.refreshId as string | undefined) ?? undefined,
    holderDid: (props.holderDid as string | undefined) ?? undefined,
    pendingReceipt: props.pendingReceipt
        ? (JSON.parse(props.pendingReceipt as string) as ManagedCredentialRefreshReceipt)
        : undefined,
    pendingActivityId: (props.pendingActivityId as string | undefined) ?? undefined,
    result: props.result ? (JSON.parse(props.result as string) as SendBoostResponse) : undefined,
    updatedAt: props.updatedAt as string,
});

export const getRefreshSendIntent = async (
    issuerProfileId: string,
    idempotencyKey: string
): Promise<RefreshSendIntent | null> => {
    const result = await neogma.queryRunner.run(
        'MATCH (i:RefreshSendIntent {intentKey: $intentKey}) RETURN i',
        { intentKey: getIntentKey(issuerProfileId, idempotencyKey) }
    );
    const node = result.records[0]?.get('i');

    return node ? parseIntent(node.properties) : null;
};

/**
 * Creates or claims the intent for (issuer, idempotencyKey). Concurrency-safe through
 * the `refresh_send_intent_key_unique` constraint. Throws CONFLICT when the key was used
 * for a different request, or when another live request is still preparing it.
 */
export const claimRefreshSendIntent = async (params: {
    issuerProfileId: string;
    idempotencyKey: string;
    requestDigest: string;
}): Promise<ClaimRefreshSendIntentResult> => {
    const { issuerProfileId, idempotencyKey, requestDigest } = params;
    const claimToken = randomUUID();
    const now = new Date();

    const result = await neogma.queryRunner.run(
        `MERGE (i:RefreshSendIntent {intentKey: $intentKey})
         ON CREATE SET i.issuerProfileId = $issuerProfileId,
                       i.requestDigest = $requestDigest,
                       i.state = 'preparing',
                       i.claimToken = $claimToken,
                       i.createdAt = $now,
                       i.updatedAt = $now
         SET i.updatedAt = i.updatedAt
         WITH i
         CALL {
             WITH i
             WITH i WHERE i.state = 'preparing'
                      AND i.claimToken <> $claimToken
                      AND i.requestDigest = $requestDigest
                      AND i.updatedAt < $staleBefore
             SET i.claimToken = $claimToken, i.updatedAt = $now
         }
         RETURN i`,
        {
            intentKey: getIntentKey(issuerProfileId, idempotencyKey),
            issuerProfileId,
            requestDigest,
            claimToken,
            now: now.toISOString(),
            staleBefore: new Date(now.getTime() - REFRESH_SEND_INTENT_STALE_MS).toISOString(),
        }
    );
    const intent = parseIntent(result.records[0]!.get('i').properties);

    if (intent.requestDigest !== requestDigest) {
        throw new TRPCError({
            code: 'CONFLICT',
            message: 'This idempotencyKey was already used for a different send request.',
        });
    }

    if (intent.state === 'delivered') return { kind: 'delivered', intent };
    if (intent.state === 'prepared') return { kind: 'prepared', intent };
    if (intent.claimToken === claimToken) return { kind: 'owned', intent };

    throw new TRPCError({
        code: 'CONFLICT',
        message: 'A send with this idempotencyKey is still being prepared. Retry shortly.',
    });
};

const lostIntentClaim = (): TRPCError =>
    new TRPCError({
        code: 'CONFLICT',
        message:
            'This send preparation was taken over or completed. Retry with the same idempotencyKey.',
    });

/**
 * Records progress on an intent owned by `claimToken` (boost first, then allocation).
 * The self-dependent SET takes the node write lock before checking ownership, so
 * a concurrent takeover cannot pass a stale check and overwrite the new owner.
 */
export const recordRefreshSendIntent = async (
    intent: RefreshSendIntent,
    fields: Partial<
        Pick<RefreshSendIntent, 'boostUri' | 'credentialId' | 'refreshId' | 'holderDid'>
    > & { state?: 'prepared' }
): Promise<RefreshSendIntent> => {
    const result = await neogma.queryRunner.run(
        `MATCH (i:RefreshSendIntent {intentKey: $intentKey})
         SET i.updatedAt = i.updatedAt
         WITH i WHERE i.claimToken = $claimToken AND i.state = 'preparing'
         SET i += $fields, i.updatedAt = $now
         RETURN i`,
        {
            intentKey: intent.intentKey,
            claimToken: intent.claimToken,
            fields: Object.fromEntries(
                Object.entries(fields).filter(([, value]) => value !== undefined)
            ),
            now: new Date().toISOString(),
        }
    );

    if (!result.records.length) throw lostIntentClaim();
    return parseIntent(result.records[0]!.get('i').properties);
};

/** Stores the metadata-only receipt (and activity) right before delivery is attempted. */
export const recordRefreshSendIntentPending = async (
    intent: RefreshSendIntent,
    pendingReceipt: ManagedCredentialRefreshReceipt,
    pendingActivityId?: string
): Promise<void> => {
    const updated = await neogma.queryRunner.run(
        `MATCH (i:RefreshSendIntent {intentKey: $intentKey})
         SET i.updatedAt = i.updatedAt
         WITH i WHERE i.claimToken = $claimToken AND i.state = 'prepared'
         SET i.pendingReceipt = $pendingReceipt,
             i.pendingActivityId = coalesce($pendingActivityId, i.pendingActivityId),
             i.updatedAt = $now
         RETURN i`,
        {
            intentKey: intent.intentKey,
            claimToken: intent.claimToken,
            pendingReceipt: JSON.stringify(pendingReceipt),
            pendingActivityId: pendingActivityId ?? null,
            now: new Date().toISOString(),
        }
    );
    if (!updated.records.length) throw lostIntentClaim();
};

export const markRefreshSendIntentDelivered = async (
    intent: RefreshSendIntent,
    result: SendBoostResponse
): Promise<void> => {
    const updated = await neogma.queryRunner.run(
        `MATCH (i:RefreshSendIntent {intentKey: $intentKey})
         SET i.updatedAt = i.updatedAt
         WITH i WHERE i.claimToken = $claimToken
                      AND (i.state = 'prepared' OR (i.state = 'delivered' AND i.result = $result))
         SET i.state = 'delivered', i.result = $result, i.updatedAt = $now
         RETURN i`,
        {
            intentKey: intent.intentKey,
            claimToken: intent.claimToken,
            result: JSON.stringify(result),
            now: new Date().toISOString(),
        }
    );
    if (!updated.records.length) throw lostIntentClaim();
};

/**
 * When an intent's refresh is already bound (delivery succeeded but the result was never
 * recorded), rebuild the result from the pending receipt and mark it delivered. Returns
 * null when nothing is bound yet.
 */
export const reconcileBoundRefreshSendIntent = async (
    intent: RefreshSendIntent,
    domain: string
): Promise<SendBoostResponse | null> => {
    if (intent.result) return intent.result;
    if (!intent.refreshId || !intent.boostUri || !intent.pendingReceipt) return null;

    const root = await getInitialRefreshRoot(intent.refreshId);

    if (!root) return null;

    const result: SendBoostResponse = {
        type: 'boost',
        uri: intent.boostUri,
        credentialUri: getManagedCredentialUri(root.rootId, domain),
        activityId: intent.pendingActivityId ?? '',
        refresh: intent.pendingReceipt,
    };

    await markRefreshSendIntentDelivered(intent, result);

    return result;
};
