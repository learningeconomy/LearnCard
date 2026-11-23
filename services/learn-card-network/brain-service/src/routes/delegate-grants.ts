import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { v4 as uuid } from 'uuid';
import { AuthGrantValidator, AuthGrantStatusValidator } from '@learncard/types';

import { t, profileRoute } from '@routes';
import { createDelegateAuthGrant } from '@accesslayer/delegate-auth-grant/create';
import {
    getDelegateAuthGrantForOwner,
    getDelegateAuthGrantsForOwner,
} from '@accesslayer/delegate-auth-grant/read';
import { revokeDelegateAuthGrant } from '@accesslayer/delegate-auth-grant/update';
import { getDelegateGrantAudience } from '@helpers/delegate-auth-grant.helpers';
import {
    DELEGATE_GRANT_CHALLENGE_PREFIX,
    DELEGATE_GRANT_MAX_LIFETIME_MS,
    DelegateAuthGrantValidator,
} from '@helpers/delegate-auth-grant.schema';

const MAX_LIFETIME_DAYS = DELEGATE_GRANT_MAX_LIFETIME_MS / (24 * 60 * 60 * 1000);

// What the caller is told when a field it sent breaks a rule of the grant schema. The raw
// validator output is never returned: it describes the whole record, server fields included.
const CALLER_FIELD_RULES = {
    delegateDid: 'delegateDid must be a did:key identifier (did:key:z...)',
    scope: 'scope must be inbox:write, contracts-data:write, or both separated by one space',
    expiresAt: `expiresAt must be an ISO 8601 UTC date-time in the future, at most ${MAX_LIFETIME_DAYS} days ahead`,
} as const;

const CALLER_FIELDS = Object.keys(CALLER_FIELD_RULES) as (keyof typeof CALLER_FIELD_RULES)[];

// One answer for an unknown id and for another profile's grant, so ids cannot be probed.
const delegateGrantNotFound = (): TRPCError =>
    new TRPCError({ code: 'NOT_FOUND', message: 'Delegate grant not found' });

export const delegateGrantsRouter = t.router({
    create: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/delegate-grant/create',
                tags: ['Delegate Grants'],
                summary: 'Create a delegate grant',
                description:
                    'Lets the service holding the named did:key issue on behalf of your profile. Returns the challenge and audience to hand to that service.',
            },
            requiredScope: 'authGrants:write',
        })
        .input(
            // Strict: every other field of the grant is set by the server, and a caller that
            // sends one is told so instead of having it silently dropped.
            z
                .object({
                    name: AuthGrantValidator.shape.name,
                    description: AuthGrantValidator.shape.description,
                    delegateDid: z.string(),
                    scope: z.string(),
                    expiresAt: z.string(),
                })
                .strict()
        )
        .output(z.object({ grantId: z.string(), challenge: z.string(), audience: z.string() }))
        .mutation(async ({ input, ctx }) => {
            // A legacy token holding authGrants:write can already mint grants with a scope of
            // its choice; it must not be able to mint a long-lived delegate as well.
            if (ctx.user.isAuthGrant) {
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message:
                        'An API token cannot create a delegate grant. Sign in as the profile that owns it.',
                });
            }

            const ownerProfileId = ctx.user.profile.profileId;

            const record = {
                name: input.name,
                description: input.description,
                delegateDid: input.delegateDid,
                scope: input.scope,
                expiresAt: input.expiresAt,
                id: uuid(),
                challenge: `${DELEGATE_GRANT_CHALLENGE_PREFIX}${uuid()}`,
                audience: getDelegateGrantAudience(),
                ownerProfileId,
                effectiveProfileId: ownerProfileId,
                // Under the act-as header the authenticated person is the manager, whose
                // profile id is in `onBehalfOf`; `ctx.user.profile` is the managed
                // organisation, which becomes the owner.
                createdBy: ctx.user.onBehalfOf ?? ownerProfileId,
                createdAt: new Date().toISOString(),
                status: AuthGrantStatusValidator.enum.active,
            };

            const parsed = DelegateAuthGrantValidator.safeParse(record);

            if (!parsed.success) {
                const refusedField = CALLER_FIELDS.find(field =>
                    parsed.error.issues.some(issue => issue.path[0] === field)
                );

                // A record that fails on a field the server set is not the caller's fault.
                if (!refusedField) {
                    throw new TRPCError({
                        code: 'INTERNAL_SERVER_ERROR',
                        message: 'Failed to create delegate grant',
                    });
                }

                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: CALLER_FIELD_RULES[refusedField],
                });
            }

            const grant = await createDelegateAuthGrant(parsed.data);

            // The owner profile exists (this is a profile route), so nothing stored means the
            // freshly generated id or challenge was already taken.
            if (!grant) {
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'Failed to create delegate grant',
                });
            }

            return { grantId: grant.id, challenge: grant.challenge, audience: grant.audience };
        }),

    get: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'GET',
                path: '/delegate-grant/{id}',
                tags: ['Delegate Grants'],
                summary: 'Get a delegate grant',
                description: 'Get a delegate grant that your profile owns',
            },
            requiredScope: 'authGrants:read',
        })
        .input(z.object({ id: z.string() }))
        // The stored grant, challenge included: the owner may need to hand it over again.
        .output(DelegateAuthGrantValidator)
        .query(async ({ input, ctx }) => {
            const grant = await getDelegateAuthGrantForOwner(input.id, ctx.user.profile.profileId);

            if (!grant) throw delegateGrantNotFound();

            return grant;
        }),

    list: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/delegate-grant/list',
                tags: ['Delegate Grants'],
                summary: 'List my delegate grants',
                description: 'List the delegate grants that your profile owns, newest first',
            },
            requiredScope: 'authGrants:read',
        })
        .input(z.object({ limit: z.number().int().positive().optional() }).optional())
        // The stored grants, challenge included: the owner may need to hand it over again.
        .output(DelegateAuthGrantValidator.array())
        .query(async ({ input, ctx }) => {
            return getDelegateAuthGrantsForOwner(ctx.user.profile.profileId, input?.limit || 100);
        }),

    revoke: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/delegate-grant/{id}/revoke',
                tags: ['Delegate Grants'],
                summary: 'Revoke a delegate grant',
                description:
                    'Revoke a delegate grant that your profile owns. Revoking an already revoked grant succeeds.',
            },
            requiredScope: 'authGrants:write',
        })
        .input(z.object({ id: z.string() }))
        .output(z.boolean())
        .mutation(async ({ input, ctx }) => {
            const revoked = await revokeDelegateAuthGrant(input.id, ctx.user.profile.profileId);

            if (!revoked) throw delegateGrantNotFound();

            return true;
        }),
});
export type DelegateGrantsRouter = typeof delegateGrantsRouter;
