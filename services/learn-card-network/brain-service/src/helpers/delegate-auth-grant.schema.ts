import { AUTH_GRANT_AUDIENCE_DOMAIN_PREFIX, AuthGrantValidator } from '@learncard/types';
import { z } from 'zod';

export const DELEGATE_GRANT_CHALLENGE_PREFIX = 'delegate-grant:';
export const DELEGATE_GRANT_MAX_LIFETIME_MS = 90 * 24 * 60 * 60 * 1000;

/**
 * Opt-in issuance delegation. A key DID is deliberately immutable: key rotation
 * requires revocation and a new grant, rather than following mutable aliases.
 * This schema does not enable delegate authentication on existing grant routes.
 */
export const DelegateAuthGrantValidator = AuthGrantValidator.extend({
    // The server recognises a legacy grant by `challenge.includes('auth-grant:')`, so a
    // delegate challenge has its own prefix and must never contain the legacy one.
    challenge: z
        .string()
        .startsWith(DELEGATE_GRANT_CHALLENGE_PREFIX)
        .min(DELEGATE_GRANT_CHALLENGE_PREFIX.length + 1, { message: 'Challenge is too short' })
        .max(100, { message: 'Challenge is too long' })
        .refine(challenge => !challenge.includes(AUTH_GRANT_AUDIENCE_DOMAIN_PREFIX), {
            message: 'Delegate challenge must not contain the legacy grant prefix',
        }),
    delegateDid: z.string().regex(/^did:key:z[1-9A-HJ-NP-Za-km-z]+$/),
    ownerProfileId: z
        .string()
        .min(1)
        .regex(/^[^\s*,:/?#]+$/),
    effectiveProfileId: z
        .string()
        .min(1)
        .regex(/^[^\s*,:/?#]+$/),
    audience: z.string().min(1),
    createdBy: z.string().min(1),
    expiresAt: z.iso.datetime(),
    actAs: z.never().optional(),
    scope: z.string().refine(scope => {
        const scopes = scope.split(' ');
        return (
            scopes.length > 0 &&
            new Set(scopes).size === scopes.length &&
            scopes.every(value => value === 'inbox:write' || value === 'contracts-data:write')
        );
    }, 'Delegation requires explicit issuance scopes'),
})
    .refine(grant => grant.ownerProfileId === grant.effectiveProfileId, {
        message: 'Delegation target must be the grant owner',
        path: ['effectiveProfileId'],
    })
    .refine(grant => Date.parse(grant.expiresAt) > Date.parse(grant.createdAt), {
        message: 'Delegation expiry must follow creation',
        path: ['expiresAt'],
    })
    // The policy parses the stored record on every evaluation, so a cap kept in the schema
    // is re-checked on every request rather than only when the grant is created.
    .refine(
        grant =>
            Date.parse(grant.expiresAt) - Date.parse(grant.createdAt) <=
            DELEGATE_GRANT_MAX_LIFETIME_MS,
        {
            message: 'Delegation lifetime must not exceed 90 days',
            path: ['expiresAt'],
        }
    );
export type DelegateAuthGrant = z.infer<typeof DelegateAuthGrantValidator>;
