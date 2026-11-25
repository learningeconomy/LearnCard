import type { VC } from '@learncard/types';
import { CredentialCategoryEnum } from 'learn-card-base/types/boostAndCredentialMetadata';
import {
    asRecord,
    asString,
    type ResumeUnknownRecord as UnknownRecord,
} from '../../components/resume-builder/resume-builder-parsing.helpers';
import { PROTECTED_RESUME_PDF_MARKER } from './protectedPdf';

export type LerRecordInput = {
    uri: string;
    category: string;
    vc?: VC;
    narrative?: string;
    metadata?: string[];
    current?: boolean;
    startDateOverride?: string;
    endDateOverride?: string;
};

type EmbeddedVerificationCredential = VC;

const firstString = (...values: unknown[]): string | undefined => {
    for (const value of values) {
        const parsed = asString(value);
        if (parsed) return parsed;
    }
    return undefined;
};

const uniqueStrings = (values: Array<string | undefined>): string[] => {
    const seen = new Set<string>();
    const result: string[] = [];
    values.forEach(value => {
        if (!value || seen.has(value)) return;
        seen.add(value);
        result.push(value);
    });
    return result;
};

const splitName = (fullName: string): { givenName: string; familyName: string } => {
    const trimmed = fullName.trim();
    if (!trimmed) return { givenName: '', familyName: '' };

    const parts = trimmed.split(/\s+/);
    if (parts.length === 1) return { givenName: parts[0], familyName: '' };

    return {
        givenName: parts[0],
        familyName: parts.slice(1).join(' '),
    };
};

const buildNarrative = (narrative?: string, metadata?: string[]): string | undefined => {
    const text = asString(narrative);
    const metadataText = (metadata || [])
        .map(v => v.trim())
        .filter(Boolean)
        .join(' | ');

    if (text && metadataText) return `${text}\n${metadataText}`;
    return text || (metadataText ? metadataText : undefined);
};

/** Preserve original signed credential claims and contexts; context conflicts fail publication. */
const buildVerificationReference = (
    input: LerRecordInput
): EmbeddedVerificationCredential | undefined => {
    if (!input.vc) return undefined;

    return input.vc;
};

/**
 * Builds a normalized LER-RS work history item from a selected source credential plus
 * Resume Builder overrides.
 */
const buildWorkHistoryItem = (input: LerRecordInput): UnknownRecord => {
    const subject = asRecord(input.vc?.credentialSubject);
    const organization = asRecord(subject?.organization);
    const employer = asRecord(subject?.employer);

    const position = firstString(
        subject?.position,
        subject?.jobTitle,
        subject?.title,
        asRecord(subject?.job)?.title,
        asRecord(subject?.occupation)?.title,
        asRecord(subject?.achievement)?.name
    );

    const employerName = firstString(
        organization?.tradeName,
        organization?.name,
        employer?.name,
        subject?.employer,
        subject?.company,
        subject?.organizationName,
        asRecord(subject?.issuer)?.name
    );

    const start =
        input.startDateOverride ||
        firstString(
            subject?.start,
            subject?.startDate,
            asRecord(subject?.effectiveTimePeriod)?.validFrom,
            asRecord(subject?.timePeriod)?.startDate,
            asRecord(subject?.dateRange)?.start,
            asRecord(subject?.dateRange)?.from
        );

    const end =
        input.endDateOverride ||
        firstString(
            subject?.end,
            subject?.endDate,
            asRecord(subject?.effectiveTimePeriod)?.validTo,
            asRecord(subject?.timePeriod)?.endDate,
            asRecord(subject?.dateRange)?.end,
            asRecord(subject?.dateRange)?.to
        );

    const narrative = buildNarrative(input.narrative, input.metadata);
    const verificationRef = buildVerificationReference(input);

    return {
        ...(position ? { position } : {}),
        ...(employerName ? { employer: employerName } : {}),
        ...(typeof input.current === 'boolean' ? { current: input.current } : {}),
        ...(start ? { start } : {}),
        ...(end ? { end } : {}),
        ...(narrative ? { narrative } : {}),
        ...(verificationRef ? { verifiableCredential: verificationRef } : {}),
    };
};

/**
 * Builds a normalized LER-RS education item from a selected source credential plus
 * Resume Builder overrides.
 */
const buildEducationItem = (input: LerRecordInput): UnknownRecord => {
    const subject = asRecord(input.vc?.credentialSubject);

    const institution = firstString(
        asRecord(subject?.institution)?.name,
        asRecord(subject?.organization)?.name,
        asRecord(subject?.school)?.name,
        subject?.institution,
        subject?.school,
        asRecord(subject?.awardedBy)?.name,
        asRecord(subject?.issuer)?.name
    );

    const degree = firstString(
        asRecord(subject?.degree)?.name,
        subject?.degree,
        asRecord(subject?.credential)?.name,
        asRecord(subject?.achievement)?.name,
        subject?.program
    );

    const start =
        input.startDateOverride ||
        firstString(
            subject?.start,
            subject?.startDate,
            asRecord(subject?.effectiveTimePeriod)?.validFrom,
            asRecord(subject?.timePeriod)?.startDate,
            asRecord(subject?.dateRange)?.start,
            asRecord(subject?.dateRange)?.from
        );

    const end = firstString(
        input.endDateOverride,
        subject?.end,
        subject?.endDate,
        asRecord(subject?.effectiveTimePeriod)?.validTo,
        asRecord(subject?.timePeriod)?.endDate,
        asRecord(subject?.dateRange)?.end,
        asRecord(subject?.dateRange)?.to
    );

    const subjectSpecializations = subject?.specializations;
    const specializations = Array.isArray(subjectSpecializations)
        ? subjectSpecializations
              .map(item => {
                  if (typeof item === 'string') return item.trim();
                  return asString(asRecord(item)?.name);
              })
              .filter((item): item is string => Boolean(item))
        : undefined;

    const narrative = buildNarrative(input.narrative, input.metadata);
    const verificationRef = buildVerificationReference(input);

    return {
        ...(institution ? { institution } : {}),
        ...(degree ? { degree } : {}),
        ...(start ? { start } : {}),
        ...(end ? { end } : {}),
        ...(specializations?.length ? { specializations } : {}),
        ...(narrative ? { narrative } : {}),
        ...(verificationRef ? { verifiableCredential: verificationRef } : {}),
    };
};

/**
 * Builds a normalized LER-RS certification item from a selected source credential plus
 * Resume Builder overrides.
 */
const buildCertificationItem = (input: LerRecordInput): UnknownRecord => {
    const subject = asRecord(input.vc?.credentialSubject);
    const issuer = asRecord(input.vc?.issuer);

    const name = firstString(
        input.vc?.name,
        subject?.name,
        subject?.title,
        asRecord(subject?.achievement)?.name,
        asRecord(subject?.credential)?.name,
        asRecord(subject?.badge)?.name,
        asRecord(subject?.license)?.name,
        asRecord(subject?.certification)?.name
    );

    const issuingAuthority =
        firstString(
            asRecord(subject?.awardedBy)?.name,
            asRecord(subject?.issuer)?.name,
            asString(input.vc?.issuer),
            issuer?.name,
            issuer?.id
        ) || undefined;

    const validFrom =
        input.startDateOverride ||
        firstString(
            subject?.start,
            subject?.startDate,
            asRecord(subject?.effectiveTimePeriod)?.validFrom,
            asRecord(subject?.validFor)?.startDate,
            asRecord(subject?.dateRange)?.start,
            asRecord(subject?.dateRange)?.from
        );

    const validTo = firstString(
        input.endDateOverride,
        subject?.end,
        subject?.endDate,
        asRecord(subject?.effectiveTimePeriod)?.validTo,
        asRecord(subject?.validFor)?.endDate,
        asRecord(subject?.dateRange)?.end,
        asRecord(subject?.dateRange)?.to
    );

    const status = firstString(subject?.status, asRecord(subject?.credentialStatus)?.type);
    const narrative = buildNarrative(input.narrative, input.metadata);
    const verificationRef = buildVerificationReference(input);

    return {
        ...(name ? { name } : {}),
        ...(issuingAuthority ? { issuingAuthority } : {}),
        ...(status ? { status } : {}),
        ...(validFrom || validTo
            ? {
                  effectiveTimePeriod: {
                      ...(validFrom ? { validFrom } : {}),
                      ...(validTo ? { validTo } : {}),
                  },
              }
            : {}),
        ...(narrative ? { narrative } : {}),
        ...(verificationRef ? { verifiableCredential: verificationRef } : {}),
    };
};

/**
 * Builds the final `createLerRecord` payload from selected Resume Builder credentials,
 * visible personal details, and the uploaded PDF attachment metadata.
 */
export const buildLerPayloadFromResume = (
    inputs: LerRecordInput[],
    context: {
        fullName: string;
        email?: string;
        phone?: string;
        location?: string;
        career?: string;
        summary?: string;
        website?: string;
        linkedIn?: string;
        pdfUrl: string;
        pdfAttachment?: UnknownRecord;
        pdfHash: string;
        generatedAt: string;
        did: string;
    }
) => {
    const workHistory = inputs
        .filter(input => input.category === CredentialCategoryEnum.workHistory)
        .map(buildWorkHistoryItem);

    const educationHistory = inputs
        .filter(input => input.category === CredentialCategoryEnum.learningHistory)
        .map(buildEducationItem);

    const certifications = inputs
        .filter(input =>
            [
                CredentialCategoryEnum.socialBadge,
                CredentialCategoryEnum.achievement,
                CredentialCategoryEnum.accomplishment,
                CredentialCategoryEnum.accommodation,
            ].includes(input.category as CredentialCategoryEnum)
        )
        .map(buildCertificationItem);

    const skills = uniqueStrings(
        inputs
            .filter(input => input.category === CredentialCategoryEnum.skill)
            .flatMap(input => {
                const subject = asRecord(input.vc?.credentialSubject);
                const explicitSkills = Array.isArray(subject?.skills)
                    ? subject?.skills.map(item =>
                          typeof item === 'string'
                              ? item
                              : asString(asRecord(item)?.name) || asString(asRecord(item)?.title)
                      )
                    : [];

                return [
                    ...explicitSkills,
                    asString(subject?.skill),
                    asString(asRecord(subject?.achievement)?.name),
                ];
            })
    );

    const attachments: UnknownRecord[] = [
        context.pdfAttachment ?? {
            descriptions: [
                PROTECTED_RESUME_PDF_MARKER,
                `Resume PDF published ${context.generatedAt}`,
                `SHA-256: ${context.pdfHash}`,
            ],
            url: context.pdfUrl,
        },
    ];

    const narratives: UnknownRecord[] = [];
    if (context.career) {
        narratives.push({
            name: 'Professional Title',
            texts: [{ name: 'Title', lines: [context.career] }],
        });
    }

    if (context.summary) {
        narratives.push({
            name: 'Professional Summary',
            texts: [{ name: 'Summary', lines: [context.summary] }],
        });
    }

    const { givenName, familyName } = splitName(context.fullName);

    return {
        person: {
            id: context.did,
            givenName,
            familyName,
            formattedName: context.fullName,
            ...(context.email ? { email: context.email } : {}),
            ...(context.phone ? { phone: context.phone } : {}),
            ...(context.location ? { address: { formattedAddress: context.location } } : {}),
            ...(context.website ? { web: [{ url: context.website, name: 'Website' }] } : {}),
            ...(context.linkedIn ? { social: [{ uri: context.linkedIn, name: 'LinkedIn' }] } : {}),
        },
        ...(workHistory.length ? { workHistory } : {}),
        ...(educationHistory.length ? { educationHistory } : {}),
        ...(certifications.length ? { certifications } : {}),
        ...(skills.length ? { skills } : {}),
        ...(narratives.length ? { narratives } : {}),
        attachments,
    };
};
