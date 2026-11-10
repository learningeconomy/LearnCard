import { createHash, randomUUID } from 'node:crypto';
import axios from 'axios';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import cache from '@cache';
import { t, accountRoute } from '@routes';
import { getClassLinkConfig, getTranscriptIssuerConfig } from '@helpers/classlink.config';
import {
    getAccountDids,
    getOwningFirebaseUids,
    matchClassLinkIdentitiesForAccount,
    resolveClassLinkContext,
    type ClassLinkContext,
} from '@helpers/classlinkContext.helpers';
import { getTranscriptRequesterDid, signIssuerAssertion } from '@helpers/issuerAssertion.helpers';
import { getStateStudentId } from '@helpers/classlinkPii.helpers';
import { parseExpectedDelivery } from '@helpers/transcriptDelivery.helpers';
import {
    createTranscriptRequest,
    findLatestTranscriptRequest,
    updateTranscriptRequest,
    markTranscriptRequestReceived,
    type MongoTranscriptRequestType,
    type TranscriptRequestOwner,
} from '../models/TranscriptRequest';
import { findUserKeyByDid, type MongoUserKeyType } from '../models/UserKey';
import { enforceMinorPreferences } from '../models/Preferences';

const FAILURE = "We couldn't reach your school records right now. Please try again later.";
const DEDUPE_SECONDS = 600;
/** Outbound issuer requests allowed per account per {@link BUDGET_WINDOW_SECONDS}. */
const BUDGET_MAX_REQUESTS = 5;
const BUDGET_WINDOW_SECONDS = 3600;
/** The school SSO provider named in the provider-neutral `idp` claim. */
const IDP = 'classlink';
/**
 * Count one outbound request and return the window's total. The window starts at the first
 * request and is never extended; a key left without a TTL is repaired.
 */
const budgetScript = `
local count = redis.call('INCR', KEYS[1])
if redis.call('TTL', KEYS[1]) < 0 then
    redis.call('EXPIRE', KEYS[1], ARGV[1])
end
return count`;
const unlockScript = `
if redis.call('GET', KEYS[1]) == ARGV[1] then
    return redis.call('DEL', KEYS[1])
end
return 0`;
const project = ({ status, requestedAt, jti, expectedBy }: MongoTranscriptRequestType) => ({
    status,
    requestedAt,
    requestId: jti,
    ...(status === 'requested' && expectedBy ? { expectedBy: expectedBy.toISOString() } : {}),
});
const recent = (record: MongoTranscriptRequestType | null): record is MongoTranscriptRequestType =>
    record?.status === 'requested' &&
    Date.now() - record.requestedAt.getTime() < DEDUPE_SECONDS * 1000;
/**
 * Axios error codes where the issuer may have received the request before the connection
 * ended (a timeout or reset after sending). Anything else, including errors that never left
 * this host (DNS failure, connection refused), is a definite failure.
 */
const AMBIGUOUS_ISSUER_ERROR_CODES = new Set([
    'ECONNABORTED',
    'ETIMEDOUT',
    'ECONNRESET',
    'EPIPE',
    'ERR_CANCELED',
]);
/** An axios error with no HTTP response whose outcome at the issuer is unknown. */
const isAmbiguousIssuerError = (error: unknown): boolean => {
    if (!error || typeof error !== 'object') return false;
    const { isAxiosError, response, code } = error as {
        isAxiosError?: unknown;
        response?: unknown;
        code?: unknown;
    };
    return (
        isAxiosError === true &&
        response === undefined &&
        typeof code === 'string' &&
        AMBIGUOUS_ISSUER_ERROR_CODES.has(code)
    );
};
const keyHash = (value: string) => createHash('sha256').update(value).digest('hex');
const issuerBody = (assertion: string, requestId: string) => ({
    assertion,
    request_id: requestId,
});

/**
 * Every identifier of the caller's account: its owning Firebase uids (see
 * `getOwningFirebaseUids`) and DIDs. Requests are owned by the account, so a ClassLink rebind
 * to another Firebase uid keeps their history, while a fresh wallet made for a uid that its
 * owner's ClassLink identity was moved away from does not inherit that history.
 */
const accountOwner = (
    userKey: MongoUserKeyType,
    firebaseUids: string[]
): TranscriptRequestOwner => ({
    firebaseUids,
    dids: getAccountDids(userKey),
});

const eligibility = ({ tenant, identity }: ClassLinkContext) => {
    const config = getClassLinkConfig();
    const issuer = getTranscriptIssuerConfig(tenant);
    if (
        !tenant?.transcriptEnabled ||
        !config ||
        // The app can only recognise an arriving transcript by the issuer's DID and the
        // network profile that sends it, so requests need both.
        !issuer?.did ||
        !issuer.profileId ||
        tenant.state !== identity.state ||
        !getTranscriptRequesterDid()
    )
        return 'not_enabled' as const;
    if (
        !Number.isFinite(identity.lastAuthTime.getTime()) ||
        Date.now() - identity.lastAuthTime.getTime() > config.maxAuthAgeSeconds * 1000
    )
        return 'reauth_required' as const;
    if (!getStateStudentId(identity)) return 'no_state_id' as const;
    return undefined;
};

export const transcriptsRouter = t.router({
    getStatus: accountRoute
        .input(z.object({}).strict().optional())
        .output(
            z.object({
                eligible: z.boolean(),
                reason: z.enum(['no_state_id', 'reauth_required', 'not_enabled']).optional(),
                stateDisplayName: z.string(),
                issuerDid: z.string().optional(),
                /** LearnCard Network profile ID the issuer sends transcripts from. */
                issuerProfileId: z.string().optional(),
                latest: z
                    .object({
                        status: z.enum(['requested', 'none_yet', 'failed']),
                        requestedAt: z.date(),
                        requestId: z.string(),
                        receivedAt: z.string().datetime().optional(),
                        /** When the issuer expects to deliver a `requested` transcript. */
                        expectedBy: z.string().datetime().optional(),
                    })
                    .optional(),
            })
        )
        .query(async ({ ctx }) => {
            try {
                const context = await resolveClassLinkContext(ctx.user.accountDid);
                if (context.identity.isMinorHint) await enforceMinorPreferences(ctx.user.did);
                const reason = eligibility(context);
                const issuer = getTranscriptIssuerConfig(context.tenant);
                const latest = await findLatestTranscriptRequest(
                    accountOwner(context.userKey, context.ownerFirebaseUids),
                    context.identity.state
                );
                return {
                    eligible: !reason,
                    reason,
                    stateDisplayName: context.tenant?.displayName ?? '',
                    issuerDid: issuer?.did,
                    issuerProfileId: issuer?.profileId,
                    latest: latest
                        ? {
                              ...project(latest),
                              requestId: latest.jti,
                              receivedAt: latest.receivedAt?.toISOString(),
                          }
                        : undefined,
                };
            } catch (error) {
                if (error instanceof TRPCError) throw error;
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: FAILURE });
            }
        }),
    markReceived: accountRoute
        .input(z.object({ requestId: z.string().min(1) }).strict())
        .output(z.object({ success: z.literal(true) }))
        .mutation(async ({ ctx, input }) => {
            try {
                // Ownership is the caller's account (every uid and DID), never the input.
                const userKey = await findUserKeyByDid(ctx.user.accountDid);
                const record = userKey
                    ? await markTranscriptRequestReceived(
                          input.requestId,
                          accountOwner(
                              userKey,
                              await getOwningFirebaseUids(
                                  userKey,
                                  await matchClassLinkIdentitiesForAccount(userKey)
                              )
                          )
                      )
                    : null;
                if (!record)
                    throw new TRPCError({
                        code: 'NOT_FOUND',
                        message: 'Transcript request not found.',
                    });
                return { success: true as const };
            } catch (error) {
                if (error instanceof TRPCError) throw error;
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: FAILURE });
            }
        }),
    request: accountRoute
        .input(z.object({ consent: z.literal(true) }).strict())
        .output(
            z.object({
                status: z.enum(['requested', 'none_yet', 'failed']),
                requestedAt: z.date(),
                requestId: z.string(),
                expectedBy: z.string().datetime().optional(),
            })
        )
        .mutation(async ({ ctx }) => {
            const redis = cache.redis ?? cache.node;
            let lockKey: string | undefined;
            const lockToken = randomUUID();
            try {
                const context = await resolveClassLinkContext(ctx.user.accountDid);
                const reason = eligibility(context);
                const issuer = getTranscriptIssuerConfig(context.tenant);
                const { identity, firebaseUid, userKey, ownerFirebaseUids } = context;
                const stateStudentId = getStateStudentId(identity);
                const requesterDid = getTranscriptRequesterDid();
                if (!requesterDid) {
                    // Never sign as did:web:localhost outside local runs; no issuer can verify it.
                    console.error(
                        'transcripts.request.requester_did_unconfigured: set DOMAIN_NAME to the public did:web domain'
                    );
                }
                if (reason || !issuer || !stateStudentId || !requesterDid) {
                    throw new TRPCError({
                        code: 'PRECONDITION_FAILED',
                        message:
                            reason === 'reauth_required'
                                ? 'Reconnect your school account to request your transcript.'
                                : 'Your transcript is not available to request right now.',
                    });
                }
                // Lock and budget are per account (primaryDid), so neither a second DID nor a
                // rebound Firebase uid gives a student a fresh allowance against the issuer. A
                // legacy account with an empty primaryDid falls back to its first DID, never ''
                // (which every such account would share).
                const accountDid = getAccountDids(userKey)[0] ?? ctx.user.accountDid;
                const accountKey = keyHash(accountDid);
                const key = `transcripts:lock:${accountKey}`;
                // Fails closed: a Redis error here aborts before anything reaches the issuer.
                const acquired = await redis.set(key, lockToken, 'EX', DEDUPE_SECONDS, 'NX');
                if (acquired) lockKey = key;
                const latest = await findLatestTranscriptRequest(
                    accountOwner(userKey, ownerFirebaseUids),
                    identity.state
                );
                if (recent(latest)) return project(latest);
                if (!acquired)
                    throw new TRPCError({
                        code: 'CONFLICT',
                        message: 'Your transcript request is already in progress.',
                    });
                // Fails closed: without a counted budget nothing reaches the issuer.
                const count = Number(
                    await redis.eval(
                        budgetScript,
                        1,
                        `transcripts:budget:${accountKey}`,
                        BUDGET_WINDOW_SECONDS
                    )
                );
                if (!Number.isFinite(count) || count < 1) throw new Error('Budget unavailable');
                if (count > BUDGET_MAX_REQUESTS)
                    throw new TRPCError({
                        code: 'TOO_MANY_REQUESTS',
                        message: 'Please wait before requesting your transcript again.',
                    });
                const consentAt = new Date();
                const { jwt, jti } = await signIssuerAssertion(
                    {
                        sub: ctx.user.did,
                        state: identity.state,
                        state_student_id: stateStudentId,
                        idp: IDP,
                        idp_tenant: identity.tenantId,
                        auth_time: Math.floor(identity.lastAuthTime.getTime() / 1000),
                        consent_at: Math.floor(consentAt.getTime() / 1000),
                    },
                    { issuerDid: requesterDid, audience: issuer.audience, now: consentAt }
                );
                const record = await createTranscriptRequest({
                    jti,
                    firebaseUid,
                    did: ctx.user.did,
                    ...(userKey.primaryDid ? { primaryDid: userKey.primaryDid } : {}),
                    identityKey: identity.identityKey,
                    state: identity.state,
                    consentAt,
                    status: 'requested',
                });
                let issuerHttpStatus: number | undefined;
                let issuerResponseCode: string | undefined;
                let expectedBy: Date | undefined;
                let status: MongoTranscriptRequestType['status'] = 'failed';
                try {
                    const response = await axios.post<unknown>(
                        issuer.endpoint,
                        issuerBody(jwt, jti),
                        {
                            headers: { Authorization: `Bearer ${jwt}` },
                            timeout: 15000,
                            maxRedirects: 0,
                            validateStatus: () => true,
                        }
                    );
                    issuerHttpStatus = response.status;
                    const body = z
                        .object({ status: z.enum(['accepted', 'none_yet']) })
                        .safeParse(response.data);
                    if (body.success) {
                        if (
                            (response.status === 200 || response.status === 202) &&
                            body.data.status === 'accepted'
                        ) {
                            status = 'requested';
                            expectedBy = parseExpectedDelivery(response.data, new Date());
                        }
                        if (response.status === 200 && body.data.status === 'none_yet')
                            status = 'none_yet';
                    }
                } catch (error) {
                    // Do not retain HTTP errors: their config contains the signed assertion.
                    if (isAmbiguousIssuerError(error)) {
                        // The issuer may have accepted it (e.g. it answered after the timeout).
                        // Keep it `requested` so it is deduped, the app keeps polling for a
                        // transcript echoing this request_id, and markReceived still matches.
                        status = 'requested';
                        issuerResponseCode = 'no_response';
                        console.warn('transcripts.request.issuer_outcome_unknown');
                    }
                }
                await updateTranscriptRequest(jti, {
                    status,
                    ...(issuerHttpStatus === undefined ? {} : { issuerHttpStatus }),
                    ...(issuerResponseCode === undefined ? {} : { issuerResponseCode }),
                    ...(expectedBy ? { expectedBy } : {}),
                });
                if (status === 'failed')
                    throw new TRPCError({ code: 'BAD_GATEWAY', message: FAILURE });
                return project({ ...record, status, expectedBy });
            } catch (error) {
                if (error instanceof TRPCError) throw error;
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: FAILURE });
            } finally {
                if (lockKey) {
                    // A failed release stays bounded by the lock TTL; never leak a cache error.
                    await redis.eval(unlockScript, 1, lockKey, lockToken).catch(() => undefined);
                }
            }
        }),
});
