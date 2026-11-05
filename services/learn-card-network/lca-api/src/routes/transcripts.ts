import { createHash, randomUUID } from 'node:crypto';
import axios from 'axios';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import cache from '@cache';
import { t, didAndChallengeRoute } from '@routes';
import { getClassLinkConfig, getTranscriptIssuerConfig } from '@helpers/classlink.config';
import { resolveClassLinkContext, type ClassLinkContext } from '@helpers/classlinkContext.helpers';
import { signIssuerAssertion } from '@helpers/issuerAssertion.helpers';
import { getStateStudentId } from '@helpers/classlinkPii.helpers';
import {
    createTranscriptRequest,
    findLatestTranscriptRequest,
    updateTranscriptRequest,
    markTranscriptRequestReceived,
    type MongoTranscriptRequestType,
} from '../models/TranscriptRequest';
import { createMinorPreferencesIfAbsent } from '../models/Preferences';
import { getPreferencesForDid } from '@accesslayer/preferences/read';

const FAILURE = "We couldn't reach your school records right now. Please try again later.";
const DEDUPE_SECONDS = 600;
const budgetScript = `
local count = redis.call('INCR', KEYS[1])
if count == 1 then redis.call('EXPIRE', KEYS[1], 3600) end
return count`;
const unlockScript = `
if redis.call('GET', KEYS[1]) == ARGV[1] then
    return redis.call('DEL', KEYS[1])
end
return 0`;
const project = ({ status, requestedAt }: MongoTranscriptRequestType) => ({ status, requestedAt });
const recent = (record: MongoTranscriptRequestType | null): record is MongoTranscriptRequestType =>
    record?.status === 'requested' &&
    Date.now() - record.requestedAt.getTime() < DEDUPE_SECONDS * 1000;
const keyHash = (value: string) => createHash('sha256').update(value).digest('hex');
const issuerBody = (assertion: string) => ({ assertion });

const eligibility = ({ tenant, identity }: ClassLinkContext) => {
    const config = getClassLinkConfig();
    if (
        !tenant?.transcriptEnabled ||
        !config ||
        !getTranscriptIssuerConfig(tenant) ||
        tenant.state !== identity.state
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
    getStatus: didAndChallengeRoute
        .input(z.object({}).strict().optional())
        .output(
            z.object({
                eligible: z.boolean(),
                reason: z.enum(['no_state_id', 'reauth_required', 'not_enabled']).optional(),
                stateDisplayName: z.string(),
                issuerDid: z.string().optional(),
                latest: z
                    .object({
                        status: z.enum(['requested', 'none_yet', 'failed']),
                        requestedAt: z.date(),
                        requestId: z.string(),
                        receivedAt: z.string().datetime().optional(),
                    })
                    .optional(),
            })
        )
        .query(async ({ ctx }) => {
            try {
                const context = await resolveClassLinkContext(ctx.user.did);
                if (context.identity.isMinorHint && !(await getPreferencesForDid(ctx.user.did)))
                    await createMinorPreferencesIfAbsent(ctx.user.did);
                const reason = eligibility(context);
                const issuer = getTranscriptIssuerConfig(context.tenant);
                const latest = await findLatestTranscriptRequest(
                    context.firebaseUid,
                    context.identity.state
                );
                return {
                    eligible: !reason,
                    reason,
                    stateDisplayName: context.tenant?.displayName ?? '',
                    issuerDid: issuer?.did,
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
    markReceived: didAndChallengeRoute
        .input(z.object({ requestId: z.string().min(1) }).strict())
        .output(z.object({ success: z.literal(true) }))
        .mutation(async ({ ctx, input }) => {
            try {
                const record = await markTranscriptRequestReceived(input.requestId, ctx.user.did);
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
    request: didAndChallengeRoute
        .input(z.object({ consent: z.literal(true) }).strict())
        .mutation(async ({ ctx }) => {
            const redis = cache.redis ?? cache.node;
            let lockKey: string | undefined;
            const lockToken = randomUUID();
            try {
                const context = await resolveClassLinkContext(ctx.user.did);
                const reason = eligibility(context);
                const issuer = getTranscriptIssuerConfig(context.tenant);
                const { identity, firebaseUid } = context;
                const stateStudentId = getStateStudentId(identity);
                if (reason || !issuer || !stateStudentId) {
                    throw new TRPCError({
                        code: 'PRECONDITION_FAILED',
                        message:
                            reason === 'reauth_required'
                                ? 'Reconnect your school account to request your transcript.'
                                : 'Your transcript is not available to request right now.',
                    });
                }
                const key = `transcripts:lock:${keyHash(firebaseUid)}`;
                const acquired = await redis.set(key, lockToken, 'EX', DEDUPE_SECONDS, 'NX');
                if (acquired) lockKey = key;
                const latest = await findLatestTranscriptRequest(firebaseUid, identity.state);
                if (recent(latest)) return project(latest);
                if (!acquired)
                    throw new TRPCError({
                        code: 'CONFLICT',
                        message: 'Your transcript request is already in progress.',
                    });
                const count = Number(
                    await redis.eval(budgetScript, 1, `transcripts:budget:${keyHash(ctx.user.did)}`)
                );
                if (!Number.isFinite(count) || count < 1) throw new Error('Budget unavailable');
                if (count > 5)
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
                        classlink_tenant_id: identity.tenantId,
                        classlink_sourced_id: identity.sourcedId,
                        classlink_auth_time: Math.floor(identity.lastAuthTime.getTime() / 1000),
                        consent_at: Math.floor(consentAt.getTime() / 1000),
                    },
                    { domain: ctx.domain, audience: issuer.audience, now: consentAt }
                );
                const record = await createTranscriptRequest({
                    jti,
                    firebaseUid,
                    did: ctx.user.did,
                    identityKey: identity.identityKey,
                    state: identity.state,
                    consentAt,
                    status: 'requested',
                });
                let issuerHttpStatus: number | undefined;
                let status: MongoTranscriptRequestType['status'] = 'failed';
                try {
                    const response = await axios.post<unknown>(issuer.endpoint, issuerBody(jwt), {
                        headers: { Authorization: `Bearer ${jwt}` },
                        timeout: 15000,
                        maxRedirects: 0,
                        validateStatus: () => true,
                    });
                    issuerHttpStatus = response.status;
                    const body = z
                        .object({ status: z.enum(['accepted', 'none_yet']) })
                        .safeParse(response.data);
                    if (body.success) {
                        if (
                            (response.status === 200 || response.status === 202) &&
                            body.data.status === 'accepted'
                        )
                            status = 'requested';
                        if (response.status === 200 && body.data.status === 'none_yet')
                            status = 'none_yet';
                    }
                } catch {
                    // Do not retain HTTP errors: their config contains the signed assertion.
                }
                await updateTranscriptRequest(jti, {
                    status,
                    ...(issuerHttpStatus === undefined ? {} : { issuerHttpStatus }),
                });
                if (status === 'failed')
                    throw new TRPCError({ code: 'BAD_GATEWAY', message: FAILURE });
                return project({ ...record, status });
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
