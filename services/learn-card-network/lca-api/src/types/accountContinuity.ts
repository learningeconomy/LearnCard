import { z } from 'zod';

/**
 * Who may add a personal email to a ClassLink account so they can keep it after losing
 * school access (LC-2409). Verifying the email links it as a future sign-in and makes it the
 * account's recovery email.
 *
 * - `personalEmail`: `off` (nobody), `nonStudents` (only accounts with no student identity),
 *   or `all` (students too, subject to `minimumAge` and `approval`).
 * - `minimumAge`: students only; needs a profile date of birth at or above this age. A missing,
 *   future or unreadable date of birth is refused.
 * - `approval`: `guardian` refuses every student until a server-owned guardian approval exists.
 */
export const AccountContinuityPolicyValidator = z
    .object({
        personalEmail: z.enum(['off', 'nonStudents', 'all']),
        minimumAge: z.number().int().min(13).max(21).optional(),
        approval: z.enum(['none', 'guardian']),
    })
    .strict();

/** A layer over the defaults (`CLASSLINK_ACCOUNT_CONTINUITY_DEFAULT` or a district's value). */
export const AccountContinuityOverrideValidator =
    AccountContinuityPolicyValidator.partial().strict();

export type AccountContinuityPolicy = z.infer<typeof AccountContinuityPolicyValidator>;
export type AccountContinuityOverride = z.infer<typeof AccountContinuityOverrideValidator>;

/** Layer 1: today's client rule, enforced on the server. */
export const ACCOUNT_CONTINUITY_CODE_DEFAULT: Readonly<AccountContinuityPolicy> = Object.freeze({
    personalEmail: 'nonStudents',
    approval: 'none',
});

/** What an invalid layer falls back to: nobody may add a personal email. */
export const ACCOUNT_CONTINUITY_OFF: Readonly<AccountContinuityOverride> = Object.freeze({
    personalEmail: 'off',
});

/** Stable codes for clients and logs; never renamed. */
export const ACCOUNT_CONTINUITY_REASONS = [
    'disabled',
    'district_off',
    'students_excluded',
    'status_unknown',
    'below_minimum_age',
    'age_unknown',
    'approval_required',
] as const;
export type AccountContinuityReason = (typeof ACCOUNT_CONTINUITY_REASONS)[number];

export type AccountContinuityDecision =
    { allowed: true } | { allowed: false; reason: AccountContinuityReason };

/** The parsed layers, built by `getClassLinkConfig`. */
export type AccountContinuitySettings = {
    /** `CLASSLINK_ACCOUNT_CONTINUITY_ENABLED`; when false every district resolves to `disabled`. */
    enabled: boolean;
    /** The code default with `CLASSLINK_ACCOUNT_CONTINUITY_DEFAULT` applied. */
    defaultPolicy: AccountContinuityPolicy;
    /** District overrides by tenant ID. An invalid value is already `ACCOUNT_CONTINUITY_OFF`. */
    tenants: Record<string, AccountContinuityOverride>;
};
