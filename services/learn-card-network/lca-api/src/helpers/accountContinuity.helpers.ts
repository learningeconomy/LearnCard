import { createHash } from 'node:crypto';
import { calculateAgeFromISODate } from '@learncard/helpers';

import type { Context } from '@routes';
import type {
    AccountContinuityDecision,
    AccountContinuityPolicy,
    AccountContinuityReason,
} from 'types/accountContinuity';
import type { ClassLinkConfig } from 'types/classlink';
import { getClassLinkConfig } from './classlink.config';
import {
    getAllMatchedIdentities,
    getContinuityStudentStatus,
    type AccountClassLinkIdentities,
    type ClassLinkStudentStatus,
} from './classlinkContext.helpers';
import { getCurrentProfile } from './currentProfile';

const deny = (reason: AccountContinuityReason): AccountContinuityDecision => ({
    allowed: false,
    reason,
});

/**
 * A district's effective policy: the district override over the env default over the code
 * default, field by field. Null when `CLASSLINK_ACCOUNT_CONTINUITY_ENABLED` is off.
 */
export const resolveAccountContinuityPolicy = (
    config: Pick<ClassLinkConfig, 'accountContinuity'>,
    tenantId: string
): AccountContinuityPolicy | null => {
    const { enabled, defaultPolicy, tenants } = config.accountContinuity;
    if (!enabled) return null;
    return { ...defaultPolicy, ...(Object.hasOwn(tenants, tenantId) ? tenants[tenantId] : {}) };
};

/**
 * Whether one district's policy lets this caller add a personal email. Pure.
 *
 * Fails closed: a student status other than `not_student` (`unknown` included: a ClassLink
 * identity whose role is missing, blank or not a known non-student role) counts as a student
 * for every restriction (`nonStudents` gives `status_unknown`), and when
 * `minimumAge` applies, a missing profile or a missing, future or unreadable date of birth
 * gives `age_unknown` (the opposite of the analytics rule, where a missing DOB is an adult).
 * `approval: 'guardian'` refuses every student until a server-owned approval exists.
 */
export const evaluateAccountContinuity = ({
    policy,
    studentStatus,
    profile,
    now = new Date(),
}: {
    /** From `resolveAccountContinuityPolicy`; null means the master switch is off. */
    policy: AccountContinuityPolicy | null;
    studentStatus: ClassLinkStudentStatus;
    /** The caller's own profile; only read when `minimumAge` applies. */
    profile?: { dob?: string | null } | null;
    now?: Date;
}): AccountContinuityDecision => {
    if (!policy) return deny('disabled');
    if (policy.personalEmail === 'off') return deny('district_off');
    if (studentStatus === 'not_student') return { allowed: true };
    if (policy.personalEmail === 'nonStudents')
        return deny(studentStatus === 'student' ? 'students_excluded' : 'status_unknown');
    if (policy.approval === 'guardian') return deny('approval_required');
    if (policy.minimumAge !== undefined) {
        const age = profile?.dob ? calculateAgeFromISODate(profile.dob, now) : Number.NaN;
        if (Number.isNaN(age)) return deny('age_unknown');
        if (age < policy.minimumAge) return deny('below_minimum_age');
    }
    return { allowed: true };
};

/** A short, stable fingerprint of a policy for audit logs (the policy itself is not logged). */
export const getAccountContinuityPolicyHash = (policy: AccountContinuityPolicy): string =>
    createHash('sha256')
        .update(JSON.stringify([policy.personalEmail, policy.minimumAge ?? null, policy.approval]))
        .digest('hex')
        .slice(0, 12);

export type AccountContinuityResult = {
    decision: AccountContinuityDecision;
    /** The deciding district (the first that refuses, else the first), for audit logs. */
    tenantId?: string;
    policyHash?: string;
};

/**
 * Evaluate every district the account's ClassLink identities belong to and keep the most
 * restrictive result. Calls brain-service for the caller's profile (3 s timeout) only when a
 * policy sets `minimumAge` and the caller may be a student.
 */
export const loadAccountContinuity = async (
    ctx: Pick<Context, 'authorizationHeader' | 'tenant' | 'user'>,
    matched: AccountClassLinkIdentities
): Promise<AccountContinuityResult> => {
    const config = getClassLinkConfig();
    // Tri-state: an identity without a recognized role is `unknown`, never a non-student.
    const studentStatus = getContinuityStudentStatus(matched);
    const districts = [
        ...new Set(getAllMatchedIdentities(matched).map(identity => identity.tenantId)),
    ].map(tenantId => ({
        tenantId,
        policy: config ? resolveAccountContinuityPolicy(config, tenantId) : null,
    }));
    if (districts.length === 0) return { decision: deny('disabled') };
    const profile =
        studentStatus !== 'not_student' &&
        districts.some(({ policy }) => policy?.minimumAge !== undefined)
            ? await getCurrentProfile(ctx)
            : undefined;
    const results = districts.map(({ tenantId, policy }) => ({
        tenantId,
        ...(policy ? { policyHash: getAccountContinuityPolicyHash(policy) } : {}),
        decision: evaluateAccountContinuity({ policy, studentStatus, profile }),
    }));
    return results.find(result => !result.decision.allowed) ?? results[0]!;
};

/**
 * Audit by structured log. Never pass an email, DID or IP: only the tenant ID, a reason
 * code and the policy hash.
 */
export const logAccountContinuityEvent = (
    event: 'denied' | 'verified' | 'primary_set' | 'removed',
    detail: { tenantId?: string; reason?: string; policyHash?: string }
): void => console.info(`classlink.continuity.${event}`, detail);
