/**
 * Today, ClassLink sign-in bypasses Keycloak entirely: lca-api verifies the
 * ClassLink `id_token` directly and hands the app a Firebase custom token. Once
 * Keycloak becomes the primary broker in front of lca-api, ClassLink sign-in
 * would instead terminate in a short-lived lca-api login ticket rather than
 * a Firebase custom token. The flow: the student completes ClassLink's OIDC
 * code exchange against lca-api as today (code → `id_token` verification →
 * state-ID resolution), but instead of minting a Firebase token lca-api issues
 * a one-time ticket scoped to that user's stable
 * `identityKey = classlink:<tenant_id>:<sourcedId>`. The browser/app is then
 * redirected into Keycloak's existing `lca-api` identity-provider broker
 * (the same broker already used for native email/social sign-in — no new
 * ClassLink-specific Keycloak identity provider or Terraform module is needed)
 * and redeems that ticket as the broker's federation credential. Keycloak
 * resolves it to a local Keycloak user via the federated-identity record whose
 * `userId` equals the person's `AuthSubject.subject` — and because
 * `provision:keycloak` already pre-seeds that federated link for
 * ClassLink-only users by resolving their `subject` through `ClassLinkIdentity`
 * when no `email:` AuthSubject exists, the broker exchange lands on the same
 * account the wallet already uses, with no double-subject and no new identity
 * provider to provision or maintain.
 */
import { createHash } from 'node:crypto';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { environment } from '@environment';
import { didAndChallengeRoute, openRoute, t } from '@routes';
import app from '../firebase';
import { getClassLinkConfig, getClassLinkTenant } from '@helpers/classlink.config';
import {
    exchangeClassLinkCode,
    getClassLinkDiscovery,
    getClassLinkEmail,
    verifyClassLinkIdToken,
} from '@helpers/classlink.helpers';
import { ClassLinkEmailMissing, ClassLinkTokenInvalid } from '@helpers/classlink.errors';
import { resolveStateStudentId } from '@helpers/classlink.stateId';
import { isRateLimited, recordFailure } from '@helpers/rate-limit.helpers';
import {
    findAuthSubjectByIdentityKey,
    getOrCreateAuthSubject,
    getOrCreateAuthSubjectLinkedTo,
} from '../models/AuthSubject';
import {
    findClassLinkIdentityByIdentityKey,
    deleteClassLinkIdentitiesByFirebaseUid,
    upsertClassLinkIdentity,
} from '../models/ClassLinkIdentity';
import { deleteTranscriptRequestsByFirebaseUid } from '../models/TranscriptRequest';
import { findUserKeyByDid } from '../models/UserKey';
import type { ClassLinkConfig } from '../types/classlink';
import { personalEmailProcedures } from './classlinkPersonalEmail';

const requireConfig = (redirectUri: string): ClassLinkConfig => {
    const config = getClassLinkConfig();
    if (!config)
        throw new TRPCError({
            code: 'PRECONDITION_FAILED',
            message: 'School sign-in is not configured.',
        });
    // Exact matching also supports explicitly registered native custom schemes.
    if (!config.redirectUris.includes(redirectUri)) {
        throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'This sign-in return address is not allowed.',
        });
    }
    return config;
};

const conflict = (tenantId: string): never => {
    console.warn('classlink.link.conflict', { tenantId });
    throw new TRPCError({
        code: 'CONFLICT',
        message:
            'An account with this email already exists. Sign in with your email code, then try again.',
    });
};

const redirectUri = z.string().min(1).max(2048);
const nonce = z.string().min(1).max(512);

/**
 * Log which api_fields names a district sends (never values) so admins can set the
 * district's stateStudentIdField. Field names are configured by district admins.
 */
const logApiFieldNames = (tenantId: string, apiFields: unknown): void => {
    let fields = apiFields;
    if (typeof fields === 'string') {
        try {
            fields = JSON.parse(fields);
        } catch {
            fields = undefined;
        }
    }
    const names =
        fields && typeof fields === 'object' && !Array.isArray(fields) ? Object.keys(fields) : [];
    console.info('classlink.api_fields', { tenantId, fieldNames: names.slice(0, 50) });
};

export const classlinkRouter = t.router({
    ...personalEmailProcedures,
    getAuthorizeUrl: openRoute
        .input(
            z
                .object({
                    redirectUri,
                    codeChallenge: z.string().regex(/^[A-Za-z0-9_-]{43}$/),
                    state: z.string().min(1).max(512),
                    nonce,
                })
                .strict()
        )
        .output(z.object({ url: z.string() }))
        .mutation(async ({ input }) => {
            const config = requireConfig(input.redirectUri);
            const discovery = await getClassLinkDiscovery();
            const url = new URL(discovery.authorization_endpoint);
            url.search = new URLSearchParams({
                response_type: 'code',
                client_id: config.clientId,
                scope: 'openid profile email',
                redirect_uri: input.redirectUri,
                code_challenge: input.codeChallenge,
                code_challenge_method: 'S256',
                state: input.state,
                nonce: input.nonce,
            }).toString();
            return { url: url.toString() };
        }),
    exchangeCode: openRoute
        .input(
            z
                .object({
                    code: z.string().min(1).max(4096),
                    codeVerifier: z.string().regex(/^[A-Za-z0-9._~-]{43,128}$/),
                    redirectUri,
                    nonce,
                })
                .strict()
        )
        .output(z.object({ token: z.string() }))
        .mutation(async ({ input, ctx }) => {
            const rateKey = `classlink:rate:exchange:${ctx.clientIp ?? 'unknown'}`;
            if (await isRateLimited(rateKey, 20)) {
                throw new TRPCError({
                    code: 'TOO_MANY_REQUESTS',
                    message: 'Too many sign-in attempts. Please try again later.',
                });
            }
            try {
                const config = requireConfig(input.redirectUri);
                const tokens = await exchangeClassLinkCode(input);
                const claims = await verifyClassLinkIdToken(tokens.id_token, {
                    nonce: input.nonce,
                });
                const tenantId = claims.classLink_tenant_id;
                const tenant = getClassLinkTenant(config, tenantId);
                const identityKey = `classlink:${tenantId}:${claims.classLink_sourcedId}`;
                logApiFieldNames(tenantId, claims.api_fields);
                // Lookup before the verification guard so an unsafe existing-email join is CONFLICT.
                const email = (claims.email?.trim() || claims.or_email?.trim())?.toLowerCase();
                if (!email || !z.string().email().safeParse(email).success)
                    throw new ClassLinkEmailMissing();
                const existing = await findClassLinkIdentityByIdentityKey(identityKey);
                const auth = environment.IS_E2E_TEST ? undefined : app?.auth();
                if (!environment.IS_E2E_TEST && !auth)
                    throw new Error('Authentication unavailable');
                const emailUser = auth
                    ? await auth.getUserByEmail(email).catch((error: unknown) => {
                          if (
                              typeof error === 'object' &&
                              error !== null &&
                              'code' in error &&
                              error.code === 'auth/user-not-found'
                          )
                              return undefined;
                          throw error;
                      })
                    : undefined;
                if (existing && emailUser && emailUser.uid !== existing.firebaseUid)
                    conflict(tenantId);
                if (
                    !existing &&
                    emailUser &&
                    (!tenant.allowedEmailDomains.some(
                        domain => domain.toLowerCase() === email.split('@')[1]
                    ) ||
                        !emailUser.emailVerified ||
                        claims.email_verified === false)
                )
                    conflict(tenantId);
                if (!getClassLinkEmail(claims)) throw new ClassLinkEmailMissing();
                const displayName = typeof claims.name === 'string' ? claims.name : undefined;
                const attrs = { email, emailVerified: true, displayName };
                let uid = existing?.firebaseUid ?? emailUser?.uid;
                if (!uid) {
                    uid = `classlink_${createHash('sha256').update(identityKey).digest('hex').slice(0, 28)}`;
                    if (auth)
                        await auth.createUser({ uid, email, emailVerified: true, displayName });
                }
                let subject = existing?.subject;
                if (!subject) {
                    const emailSubject = emailUser
                        ? await findAuthSubjectByIdentityKey(`email:${email}`)
                        : null;
                    subject = (
                        emailSubject
                            ? await getOrCreateAuthSubjectLinkedTo(
                                  identityKey,
                                  emailSubject.subject,
                                  attrs
                              )
                            : await getOrCreateAuthSubject(identityKey, attrs)
                    ).subject;
                }
                await upsertClassLinkIdentity({
                    identityKey,
                    tenantId,
                    sourcedId: claims.classLink_sourcedId,
                    sub: claims.sub,
                    role: claims.classLink_role ?? '',
                    email,
                    stateStudentId: await resolveStateStudentId(claims, tenant),
                    state: tenant.state,
                    firebaseUid: uid,
                    subject,
                    // Time of this verified sign-in. ClassLink's auth_time is the start of the
                    // ClassLink session and does not move on later sign-ins, so it cannot prove
                    // freshness; iat is checked to be within five minutes of now.
                    lastAuthTime: new Date(claims.iat * 1000),
                    // Preferences require a DID; apply this hint when the account first binds one.
                    isMinorHint:
                        existing?.isMinorHint === true ||
                        claims.classLink_role?.toLowerCase() === 'student',
                });
                return {
                    token: auth
                        ? await auth.createCustomToken(uid, { classlink: true })
                        : `classlink-e2e-${uid}`,
                };
            } catch (error) {
                await recordFailure(rateKey);
                if (error instanceof ClassLinkEmailMissing) {
                    throw new TRPCError({
                        code: 'BAD_REQUEST',
                        message:
                            "Your school account doesn't have an email address yet. Ask your school to add one, then try again.",
                    });
                }
                if (error instanceof ClassLinkTokenInvalid) throw error;
                if (
                    error instanceof TRPCError &&
                    ['CONFLICT', 'BAD_REQUEST', 'PRECONDITION_FAILED'].includes(error.code)
                )
                    throw error;
                // Provider and database errors may contain secrets or PII. Do not retain their cause.
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'School sign-in could not be completed. Please try again.',
                });
            }
        }),
    deleteMyData: didAndChallengeRoute
        .input(z.object({}).strict().optional())
        .output(z.object({ deleted: z.number().int().nonnegative() }))
        .mutation(async ({ ctx }) => {
            const userKey = await findUserKeyByDid(ctx.user.did);
            if (!userKey) return { deleted: 0 };

            let deleted = 0;
            for (const provider of userKey.authProviders) {
                if (provider.type !== 'firebase') continue;
                deleted += await deleteClassLinkIdentitiesByFirebaseUid(provider.id);
                deleted += await deleteTranscriptRequestsByFirebaseUid(provider.id);
            }
            return { deleted };
        }),
});
