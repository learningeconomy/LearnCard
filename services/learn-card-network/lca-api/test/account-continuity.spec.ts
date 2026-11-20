import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getClassLinkConfig } from '../src/helpers/classlink.config';
import {
    evaluateAccountContinuity,
    loadAccountContinuity,
    resolveAccountContinuityPolicy,
} from '../src/helpers/accountContinuity.helpers';
import { getCurrentProfile } from '../src/helpers/currentProfile';
import type { AccountContinuityPolicy } from '../src/types/accountContinuity';
import {
    getContinuityStudentStatus,
    type ClassLinkStudentStatus,
} from '../src/helpers/classlinkContext.helpers';

const { env } = vi.hoisted(() => ({
    env: {
        NODE_ENV: 'test',
        CLASSLINK_CLIENT_ID: 'client-id',
        CLASSLINK_CLIENT_SECRET: 'client-secret',
        CLASSLINK_DISCOVERY_URL: 'https://launchpad.classlink.com/.well-known/openid-configuration',
        CLASSLINK_REDIRECT_URIS: 'https://one.example/callback',
        CLASSLINK_TENANTS: undefined as string | undefined,
        CLASSLINK_MAX_AUTH_AGE_SECONDS: 86_400,
        CLASSLINK_ACCOUNT_CONTINUITY_ENABLED: true,
        CLASSLINK_ACCOUNT_CONTINUITY_DEFAULT: undefined as string | undefined,
        TRANSCRIPT_ISSUERS: undefined as string | undefined,
    },
}));

vi.mock('@environment', () => ({ environment: env }));
vi.mock('@mongo', () => ({ default: {}, mongodb: {}, client: {} }));
vi.mock('../src/helpers/currentProfile', () => ({ getCurrentProfile: vi.fn() }));

const district = (accountContinuity?: unknown) => ({
    displayName: 'Example District',
    state: 'XX',
    allowedEmailDomains: [],
    transcriptEnabled: false,
    ...(accountContinuity === undefined ? {} : { accountContinuity }),
});

const resolve = (tenantId: string) =>
    resolveAccountContinuityPolicy(getClassLinkConfig()!, tenantId);

beforeEach(() => {
    env.CLASSLINK_TENANTS = undefined;
    env.CLASSLINK_ACCOUNT_CONTINUITY_ENABLED = true;
    env.CLASSLINK_ACCOUNT_CONTINUITY_DEFAULT = undefined;
    vi.mocked(getCurrentProfile).mockReset();
});

describe('account continuity layers', () => {
    it('uses the code default when nothing is configured', () => {
        expect(resolve('any')).toEqual({ personalEmail: 'nonStudents', approval: 'none' });
    });

    it('applies the env default, then the district, field by field', () => {
        env.CLASSLINK_ACCOUNT_CONTINUITY_DEFAULT = '{"personalEmail":"all","minimumAge":13}';
        env.CLASSLINK_TENANTS = JSON.stringify({
            guarded: district({ approval: 'guardian' }),
            older: district({ minimumAge: 16 }),
            closed: district({ personalEmail: 'off' }),
            plain: district(),
        });
        expect(resolve('plain')).toEqual({
            personalEmail: 'all',
            minimumAge: 13,
            approval: 'none',
        });
        expect(resolve('unlisted')).toEqual(resolve('plain'));
        expect(resolve('guarded')).toEqual({
            personalEmail: 'all',
            minimumAge: 13,
            approval: 'guardian',
        });
        expect(resolve('older')?.minimumAge).toBe(16);
        expect(resolve('closed')?.personalEmail).toBe('off');
    });

    it('downgrades only a district with an invalid value, and keeps ClassLink on', () => {
        env.CLASSLINK_ACCOUNT_CONTINUITY_DEFAULT = '{"personalEmail":"all"}';
        env.CLASSLINK_TENANTS = JSON.stringify({
            typo: district({ personalEmail: 'sometimes' }),
            extra: district({ personalEmail: 'all', rebindProofs: ['passkey'] }),
            young: district({ minimumAge: 5 }),
            fine: district({ minimumAge: 14 }),
        });
        const config = getClassLinkConfig();
        expect(config).not.toBeNull();
        expect(Object.keys(config!.tenants)).toEqual(['typo', 'extra', 'young', 'fine']);
        for (const tenantId of ['typo', 'extra', 'young'])
            expect(resolve(tenantId)?.personalEmail).toBe('off');
        expect(resolve('fine')).toEqual({
            personalEmail: 'all',
            minimumAge: 14,
            approval: 'none',
        });
    });

    it.each(['not json', '{"personalEmail":"everyone"}', '{"setsRecoveryEmail":true}', '[]'])(
        'turns personal email off for an invalid env default (%s)',
        value => {
            env.CLASSLINK_ACCOUNT_CONTINUITY_DEFAULT = value;
            env.CLASSLINK_TENANTS = JSON.stringify({ plain: district() });
            expect(getClassLinkConfig()).not.toBeNull();
            expect(resolve('plain')).toEqual({ personalEmail: 'off', approval: 'none' });
        }
    );

    it('resolves every district to null while the master switch is off', () => {
        env.CLASSLINK_ACCOUNT_CONTINUITY_ENABLED = false;
        env.CLASSLINK_TENANTS = JSON.stringify({ open: district({ personalEmail: 'all' }) });
        expect(resolve('open')).toBeNull();
        expect(
            evaluateAccountContinuity({ policy: resolve('open'), studentStatus: 'not_student' })
        ).toEqual({ allowed: false, reason: 'disabled' });
    });
});

describe('evaluateAccountContinuity', () => {
    const now = new Date('2026-06-15T12:00:00Z');
    const statuses: ClassLinkStudentStatus[] = ['student', 'not_student', 'unknown', 'no_account'];
    const profiles = {
        above: { dob: '2010-06-15' }, // 16 today
        exact: { dob: '2013-06-15' }, // 13 today
        below: { dob: '2013-06-16' }, // 12, 13 tomorrow
        missing: { dob: null },
        future: { dob: '2027-01-01' },
        invalid: { dob: 'not-a-date' },
        nullProfile: null,
    } as const;
    const policy = (value: Partial<AccountContinuityPolicy>): AccountContinuityPolicy => ({
        personalEmail: 'all',
        approval: 'none',
        ...value,
    });
    const evaluate = (
        value: AccountContinuityPolicy | null,
        studentStatus: ClassLinkStudentStatus,
        profile?: { dob?: string | null } | null
    ) => evaluateAccountContinuity({ policy: value, studentStatus, profile, now });

    it.each(statuses)('refuses %s when disabled or off', status => {
        for (const profile of Object.values(profiles)) {
            expect(evaluate(null, status, profile)).toEqual({ allowed: false, reason: 'disabled' });
            expect(evaluate(policy({ personalEmail: 'off' }), status, profile)).toEqual({
                allowed: false,
                reason: 'district_off',
            });
        }
    });

    it('allows only confirmed non-students under nonStudents', () => {
        const nonStudents = policy({ personalEmail: 'nonStudents', minimumAge: 13 });
        expect(evaluate(nonStudents, 'not_student', null)).toEqual({ allowed: true });
        expect(evaluate(nonStudents, 'student')).toEqual({
            allowed: false,
            reason: 'students_excluded',
        });
        for (const status of ['unknown', 'no_account'] as const)
            expect(evaluate(nonStudents, status)).toEqual({
                allowed: false,
                reason: 'status_unknown',
            });
    });

    it('never needs a profile for a non-student', () => {
        for (const value of [policy({}), policy({ minimumAge: 21, approval: 'guardian' })])
            expect(evaluate(value, 'not_student')).toEqual({ allowed: true });
    });

    it.each(['student', 'unknown', 'no_account'] as const)(
        'treats %s as a student under all',
        status => {
            expect(evaluate(policy({}), status)).toEqual({ allowed: true });
            expect(evaluate(policy({ approval: 'guardian' }), status, profiles.above)).toEqual({
                allowed: false,
                reason: 'approval_required',
            });
            expect(
                evaluate(policy({ approval: 'guardian', minimumAge: 13 }), status, profiles.above)
            ).toEqual({ allowed: false, reason: 'approval_required' });

            const aged = policy({ minimumAge: 13 });
            expect(evaluate(aged, status, profiles.above)).toEqual({ allowed: true });
            expect(evaluate(aged, status, profiles.exact)).toEqual({ allowed: true });
            expect(evaluate(aged, status, profiles.below)).toEqual({
                allowed: false,
                reason: 'below_minimum_age',
            });
            for (const profile of [
                profiles.missing,
                profiles.future,
                profiles.invalid,
                profiles.nullProfile,
                undefined,
            ])
                expect(evaluate(aged, status, profile)).toEqual({
                    allowed: false,
                    reason: 'age_unknown',
                });
        }
    );
});

describe('loadAccountContinuity', () => {
    const ctx = {
        authorizationHeader: 'Bearer vp',
        tenant: { id: 'learncard', resolvedVia: 'default' as const, emailBranding: {} },
        user: { did: 'did:key:z', isChallengeValid: true },
    };
    const identity = (tenantId: string, isMinorHint = false, studentStatusKnown = true) =>
        ({ tenantId, isMinorHint, studentStatusKnown }) as never;
    const matched = (owned: never[], heldElsewhere: never[] = []) => ({
        identities: owned,
        heldElsewhere,
        orphaned: [],
    });

    it('applies the most restrictive district and reports it', async () => {
        env.CLASSLINK_TENANTS = JSON.stringify({
            open: district({ personalEmail: 'all' }),
            closed: district({ personalEmail: 'off' }),
        });
        const result = await loadAccountContinuity(
            ctx,
            matched([identity('open', true)], [identity('closed')])
        );
        expect(result).toMatchObject({
            decision: { allowed: false, reason: 'district_off' },
            tenantId: 'closed',
            policyHash: expect.stringMatching(/^[0-9a-f]{12}$/),
        });
        expect(getCurrentProfile).not.toHaveBeenCalled();
    });

    it('marks the person a student when any matched identity is one', async () => {
        const result = await loadAccountContinuity(
            ctx,
            matched([identity('a')], [identity('b', true)])
        );
        expect(result.decision).toEqual({ allowed: false, reason: 'students_excluded' });
    });

    describe('a ClassLink role that was not recognized fails closed (LC-2409 review)', () => {
        /** A sign-in whose token had no role (isMinorHint false, role not recognized). */
        const roleless = (tenantId: string) => identity(tenantId, false, false);
        /** An identity written before `studentStatusKnown` existed (no hint either). */
        const legacy = (tenantId: string) => ({ tenantId }) as never;
        const cases = [
            ['a token without a role', roleless],
            ['a legacy identity without the hint', legacy],
        ] as const;

        it.each(cases)('%s is an unknown status', (_label, make) => {
            expect(getContinuityStudentStatus(matched([make('a')]))).toBe('unknown');
            // Any recognized non-student identity does not outweigh it.
            expect(getContinuityStudentStatus(matched([identity('a')], [make('b')]))).toBe(
                'unknown'
            );
            // A student anywhere still wins.
            expect(getContinuityStudentStatus(matched([make('a')], [identity('b', true)]))).toBe(
                'student'
            );
        });

        it.each(cases)('%s is refused under nonStudents', async (_label, make) => {
            await expect(loadAccountContinuity(ctx, matched([make('a')]))).resolves.toMatchObject({
                decision: { allowed: false, reason: 'status_unknown' },
            });
        });

        it.each(cases)(
            '%s is refused under a restricted all (minimum age, guardian)',
            async (_label, make) => {
                env.CLASSLINK_ACCOUNT_CONTINUITY_DEFAULT =
                    '{"personalEmail":"all","minimumAge":13}';
                vi.mocked(getCurrentProfile).mockResolvedValue(null);
                await expect(
                    loadAccountContinuity(ctx, matched([make('a')]))
                ).resolves.toMatchObject({ decision: { allowed: false, reason: 'age_unknown' } });
                const tenYearsAgo = new Date();
                tenYearsAgo.setUTCFullYear(tenYearsAgo.getUTCFullYear() - 10);
                vi.mocked(getCurrentProfile).mockResolvedValue({
                    dob: tenYearsAgo.toISOString().slice(0, 10),
                });
                await expect(
                    loadAccountContinuity(ctx, matched([make('a')]))
                ).resolves.toMatchObject({
                    decision: { allowed: false, reason: 'below_minimum_age' },
                });
                env.CLASSLINK_ACCOUNT_CONTINUITY_DEFAULT =
                    '{"personalEmail":"all","approval":"guardian"}';
                await expect(
                    loadAccountContinuity(ctx, matched([make('a')]))
                ).resolves.toMatchObject({
                    decision: { allowed: false, reason: 'approval_required' },
                });
            }
        );

        it.each(cases)('%s is allowed under a plain all', async (_label, make) => {
            env.CLASSLINK_ACCOUNT_CONTINUITY_DEFAULT = '{"personalEmail":"all"}';
            await expect(loadAccountContinuity(ctx, matched([make('a')]))).resolves.toMatchObject({
                decision: { allowed: true },
            });
        });

        it('a recognized non-student role is allowed under nonStudents', async () => {
            await expect(
                loadAccountContinuity(ctx, matched([identity('a')]))
            ).resolves.toMatchObject({ decision: { allowed: true } });
            expect(getCurrentProfile).not.toHaveBeenCalled();
        });
    });

    it('reads the profile only when a minimum age applies to a student', async () => {
        env.CLASSLINK_ACCOUNT_CONTINUITY_DEFAULT = '{"personalEmail":"all","minimumAge":13}';
        await expect(loadAccountContinuity(ctx, matched([identity('a')]))).resolves.toMatchObject({
            decision: { allowed: true },
            tenantId: 'a',
        });
        expect(getCurrentProfile).not.toHaveBeenCalled();

        vi.mocked(getCurrentProfile).mockResolvedValue({ dob: '2000-01-01' });
        await expect(
            loadAccountContinuity(ctx, matched([identity('a', true)]))
        ).resolves.toMatchObject({ decision: { allowed: true } });
        vi.mocked(getCurrentProfile).mockResolvedValue(null);
        await expect(
            loadAccountContinuity(ctx, matched([identity('a', true)]))
        ).resolves.toMatchObject({ decision: { allowed: false, reason: 'age_unknown' } });
        expect(getCurrentProfile).toHaveBeenCalledTimes(2);
    });
});
