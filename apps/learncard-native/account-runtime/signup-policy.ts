import { z } from 'zod';
import countries from '../../learn-card-app/src/constants/countries.json';
import {
    DEFAULT_EU_AGE_LIMIT,
    EU_COUNTRY_CODES,
    GDPR_AGE_LIMIT_BY_CODE,
    getMinorAgeThreshold,
} from '../../../packages/learn-card-base/src/constants/gdprAgeLimits';

export const signupPolicyData = {
    countries,
    eu: EU_COUNTRY_CODES,
    consentAges: GDPR_AGE_LIMIT_BY_CODE,
    defaultConsentAge: DEFAULT_EU_AGE_LIMIT,
};
export class SignupFailure extends Error {
    constructor(
        readonly kind:
            | 'invalid'
            | 'underage'
            | 'taken'
            | 'changed'
            | 'connection'
            | 'recovery'
            | 'privacy'
            | 'unavailable'
    ) {
        super(`signup:${kind}`);
    }
}
export const signupErrorCode = (error: unknown) =>
    error instanceof SignupFailure ? error.message : 'signup:connection';
const civilDate = (text: string): Date => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) throw new SignupFailure('invalid');
    const [year, month, day] = text.split('-').map(Number);
    const value = new Date(Date.UTC(year, month - 1, day));
    if (year < 1900 || value.toISOString().slice(0, 10) !== text)
        throw new SignupFailure('invalid');
    return value;
};
export const localToday = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};
export const signupEligibility = (dob: string, country: string, today = localToday()) => {
    if (!Object.hasOwn(countries, country)) throw new SignupFailure('invalid');
    const birth = civilDate(dob),
        now = civilDate(today);
    if (birth > now) throw new SignupFailure('invalid');
    let age = now.getUTCFullYear() - birth.getUTCFullYear();
    if (
        now.getUTCMonth() < birth.getUTCMonth() ||
        (now.getUTCMonth() === birth.getUTCMonth() && now.getUTCDate() < birth.getUTCDate())
    )
        age--;
    const eu = EU_COUNTRY_CODES.includes(country);
    return {
        age,
        underage: age < 13,
        guardianRequired:
            eu && age >= 13 && age < (GDPR_AGE_LIMIT_BY_CODE[country] ?? DEFAULT_EU_AGE_LIMIT),
        teenNotice: !eu && age >= 13 && age < 18,
        isMinor: age < getMinorAgeThreshold(country),
    };
};
const photo = z
    .string()
    .url()
    .max(2048)
    .refine(text => {
        const url = new URL(text);
        return (
            url.protocol === 'https:' &&
            url.hostname === 'cdn.filestackcontent.com' &&
            !url.username &&
            !url.password &&
            !url.port
        );
    });
export const signupDraftSchema = z
    .object({
        dob: z.string(),
        country: z.string().length(2),
        name: z.string().trim().min(1).max(100),
        profileId: z
            .string()
            .min(3)
            .max(25)
            .regex(/^[a-z0-9-]+$/),
        image: photo.optional(),
        guardianEmail: z.string().max(254).optional(),
        teenAcknowledged: z.boolean(),
        termsAccepted: z.literal(true),
        aiEnabled: z.boolean(),
        analyticsEnabled: z.boolean(),
        bugReportsEnabled: z.boolean(),
    })
    .strict();
export type SignupDraft = z.infer<typeof signupDraftSchema>;
export const validateSignup = (input: unknown, today = localToday()): SignupDraft => {
    const parsed = signupDraftSchema.safeParse(input);
    if (!parsed.success) throw new SignupFailure('invalid');
    const draft = parsed.data,
        policy = signupEligibility(draft.dob, draft.country, today);
    if (policy.underage) throw new SignupFailure('underage');
    if (
        (policy.teenNotice && !draft.teenAcknowledged) ||
        (policy.guardianRequired &&
            !z.string().email().safeParse(draft.guardianEmail?.trim()).success)
    )
        throw new SignupFailure('invalid');
    return {
        ...draft,
        guardianEmail: policy.guardianRequired
            ? draft.guardianEmail!.trim().toLowerCase()
            : undefined,
        aiEnabled: !policy.isMinor && draft.aiEnabled,
        analyticsEnabled: !policy.isMinor && draft.analyticsEnabled,
        bugReportsEnabled: !policy.isMinor && draft.bugReportsEnabled,
    };
};
export const signupPreferences = (draft: SignupDraft) => {
    const { isMinor } = signupEligibility(draft.dob, draft.country);
    return {
        theme: 'colorful' as const,
        aiEnabled: !isMinor && draft.aiEnabled,
        aiAutoDisabled: isMinor,
        analyticsEnabled: !isMinor && draft.analyticsEnabled,
        analyticsAutoDisabled: false,
        bugReportsEnabled: !isMinor && draft.bugReportsEnabled,
        isMinor,
    };
};
