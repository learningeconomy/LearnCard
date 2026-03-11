import { VC } from '@learncard/types';
import { CredentialCategoryEnum, useCurrentUser, useFilestack, useWallet } from 'learn-card-base';
import { resumeBuilderStore } from '../stores/resumeBuilderStore';
import type { ResumeSectionKey } from '../components/resume-builder/resume-builder.helpers';
import { LER_RS_CREDENTIAL_CONTEXT_V1, LER_RS_VC_CONTEXT_V45 } from '@learncard/ler-rs-plugin';

type UnknownRecord = Record<string, unknown>;

type LerRecordInput = {
    uri: string;
    category: string;
    vc?: VC;
    narrative?: string;
    metadata?: string[];
    endDateOverride?: string;
};

/**
 * Reference to a credential selected for inclusion in the generated LER-RS.
 */
export type ResumeCredentialRef = {
    uri: string;
    category: string;
};

/**
 * Input payload for publishing a LER-RS credential with an external PDF attachment.
 */
export type PublishTcpResumeInput = {
    pdfBlob: Blob;
    fileName: string;
    pdfHash: string;
    includedCredentials: ResumeCredentialRef[];
    generatedAt?: string;
};

/**
 * Artifacts returned after successful publish.
 */
export type PublishTcpResumeResult = {
    lerVc: VC;
    lerUri: string;
    pdfUrl: string;
};

type CreateLerRecordInvoker = (params: Record<string, unknown>) => Promise<VC>;

type VerificationReference = {
    id: string;
    sourceCredentialUri: string;
};

const asRecord = (value: unknown): UnknownRecord | undefined =>
    value && typeof value === 'object' && !Array.isArray(value)
        ? (value as UnknownRecord)
        : undefined;

const asString = (value: unknown): string | undefined => {
    if (typeof value !== 'string') return undefined;
    const trimmed = value.trim();
    return trimmed ? trimmed : undefined;
};

const firstString = (...values: unknown[]): string | undefined => {
    for (const value of values) {
        const parsed = asString(value);
        if (parsed) return parsed;
    }
    return undefined;
};

const firstStringFromPaths = (
    record: UnknownRecord | undefined,
    paths: string[][]
): string | undefined => {
    if (!record) return undefined;

    for (const path of paths) {
        let current: unknown = record;
        for (const key of path) {
            current = asRecord(current)?.[key];
            if (current == null) break;
        }

        const parsed = asString(current);
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
    if (!trimmed) return { givenName: 'Unknown', familyName: 'User' };

    const parts = trimmed.split(/\s+/);
    if (parts.length === 1) return { givenName: parts[0], familyName: 'User' };

    return {
        givenName: parts[0],
        familyName: parts.slice(1).join(' '),
    };
};

const buildNarrative = (narrative?: string, metadata?: string[]): string | undefined => {
    const text = asString(narrative);
    const metadataText = (metadata || []).map(v => v.trim()).filter(Boolean).join(' | ');

    if (text && metadataText) return `${text}\n${metadataText}`;
    return text || (metadataText ? metadataText : undefined);
};

const buildVerificationReference = (input: LerRecordInput): VerificationReference | undefined => {
    const refId = input.vc?.id || input.uri;
    if (!refId) return undefined;

    return {
        id: refId,
        sourceCredentialUri: input.uri,
    };
};

const getContextUris = (value: unknown): string[] => {
    const uris: string[] = [];

    const visit = (node: unknown) => {
        if (!node || typeof node !== 'object') return;
        if (Array.isArray(node)) {
            node.forEach(visit);
            return;
        }

        const record = node as UnknownRecord;
        const context = record['@context'];
        if (typeof context === 'string') uris.push(context);
        if (Array.isArray(context)) {
            context.forEach(entry => {
                if (typeof entry === 'string') uris.push(entry);
            });
        }

        Object.values(record).forEach(visit);
    };

    visit(value);
    return Array.from(new Set(uris));
};

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

    const start = firstString(
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
        ...(start ? { start } : {}),
        ...(end ? { end } : {}),
        ...(narrative ? { narrative } : {}),
        ...(verificationRef ? { verifiableCredential: verificationRef } : {}),
    };
};

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

    const start = firstString(
        subject?.start,
        subject?.startDate,
        asRecord(subject?.effectiveTimePeriod)?.validFrom,
        asRecord(subject?.timePeriod)?.startDate,
        asRecord(subject?.dateRange)?.start,
        asRecord(subject?.dateRange)?.from
    );

    const end = firstString(
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

    const validFrom = firstString(
        subject?.start,
        subject?.startDate,
        asRecord(subject?.effectiveTimePeriod)?.validFrom,
        asRecord(subject?.validFor)?.startDate,
        asRecord(subject?.dateRange)?.start,
        asRecord(subject?.dateRange)?.from
    );

    const validTo = firstString(
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
            ? { effectiveTimePeriod: { ...(validFrom ? { validFrom } : {}), ...(validTo ? { validTo } : {}) } }
            : {}),
        ...(narrative ? { narrative } : {}),
        ...(verificationRef ? { verifiableCredential: verificationRef } : {}),
    };
};

const buildLerPayloadFromResume = (
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
        {
            descriptions: [
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
            ...(context.location
                ? { address: { formattedAddress: context.location } }
                : {}),
            ...(context.website ? { web: [{ url: context.website, name: 'Website' }] } : {}),
            ...(context.linkedIn
                ? { social: [{ uri: context.linkedIn, name: 'LinkedIn' }] }
                : {}),
        },
        ...(workHistory.length ? { workHistory } : {}),
        ...(educationHistory.length ? { educationHistory } : {}),
        ...(certifications.length ? { certifications } : {}),
        ...(skills.length ? { skills } : {}),
        ...(narratives.length ? { narratives } : {}),
        attachments,
    };
};

/**
 * Hook that publishes a resume as a LER-RS VC with PDF attachment URL.
 */
export const useIssueTcpResume = () => {
    const { initWallet } = useWallet();
    const currentUser = useCurrentUser();
    const { singleImageUpload } = useFilestack({
        fileType: 'application/pdf',
        onUpload: () => undefined,
    });

    const publishTcpResume = async (
        input: PublishTcpResumeInput
    ): Promise<PublishTcpResumeResult> => {
        console.info('[ResumePublish] start', {
            fileName: input.fileName,
            includedCredentialCount: input.includedCredentials.length,
        });

        try {
            console.info('[ResumePublish] initWallet');
            const wallet = await initWallet();

            const createLerRecord = (wallet.invoke as Record<string, unknown>).createLerRecord;
            if (typeof createLerRecord !== 'function') {
                console.error('[ResumePublish] createLerRecord missing on wallet.invoke');
                throw new Error('LER-RS plugin is not available on the active wallet');
            }
            const createLerRecordInvoker = createLerRecord as CreateLerRecordInvoker;

            const uploader = singleImageUpload as undefined | ((file: File) => Promise<string>);
            if (!uploader) {
                console.error('[ResumePublish] filestack uploader unavailable');
                throw new Error('Filestack uploader is unavailable');
            }

            const file = new File([input.pdfBlob], input.fileName, { type: 'application/pdf' });
            console.info('[ResumePublish] uploading PDF to Filestack', {
                fileName: file.name,
                fileSize: file.size,
            });
            const pdfUrl = await uploader(file);
            if (!pdfUrl) {
                console.error('[ResumePublish] Filestack upload returned empty URL');
                throw new Error('Failed to upload resume PDF to Filestack');
            }
            console.info('[ResumePublish] PDF uploaded', { pdfUrl });

            const generatedAt = input.generatedAt ?? new Date().toISOString();
            const did = wallet.id.did();

            const credentialEntries = resumeBuilderStore.get.credentialEntries();
            const workExperienceEndDates = resumeBuilderStore.get.workExperienceEndDates();
            const personalDetails = resumeBuilderStore.get.personalDetails();
            const hiddenPersonalDetails = resumeBuilderStore.get.hiddenPersonalDetails();

            console.info('[ResumePublish] resolving source credentials');
            const lerInputs = await Promise.all(
                input.includedCredentials.map(async item => {
                    let vc: VC | undefined;
                    try {
                        vc = (await wallet.read.get(item.uri)) as VC | undefined;
                    } catch (error) {
                        console.warn('[ResumePublish] failed to read source VC', {
                            uri: item.uri,
                            category: item.category,
                            error,
                        });
                        vc = undefined;
                    }
                    const sectionEntries =
                        credentialEntries[item.category as ResumeSectionKey] ?? [];
                    const selectedEntry = sectionEntries.find(entry => entry.uri === item.uri);

                    const description = selectedEntry?.fields
                        ?.find(field => field.type === 'description' && !field.hidden)
                        ?.value?.trim();

                    const metadata = (selectedEntry?.fields ?? [])
                        .filter(field => field.type === 'metadata')
                        .map(field => field.value.trim())
                        .filter(Boolean);

                    return {
                        uri: item.uri,
                        category: item.category,
                        vc,
                        narrative: description,
                        metadata,
                        endDateOverride: workExperienceEndDates[item.uri],
                    } satisfies LerRecordInput;
                })
            );
            console.info('[ResumePublish] resolved source credentials', {
                withVcCount: lerInputs.filter(item => Boolean(item.vc)).length,
                withoutVcCount: lerInputs.filter(item => !item.vc).length,
            });

            console.info('[ResumePublish] context preflight start', {
                lerContexts: [LER_RS_CREDENTIAL_CONTEXT_V1, LER_RS_VC_CONTEXT_V45],
            });
            for (const contextUri of [LER_RS_CREDENTIAL_CONTEXT_V1, LER_RS_VC_CONTEXT_V45]) {
                try {
                    const resolved = await wallet.context.resolveDocument(contextUri, true);
                    if (!resolved) {
                        console.warn('[ResumePublish] unresolved LER context', { contextUri });
                    } else {
                        console.info('[ResumePublish] resolved LER context', { contextUri });
                    }
                } catch (error) {
                    console.warn('[ResumePublish] error resolving LER context', {
                        contextUri,
                        error,
                    });
                }
            }

            for (const inputItem of lerInputs) {
                if (!inputItem.vc) continue;
                const contextUris = getContextUris(inputItem.vc);
                const vcInput = asRecord(inputItem.vc as unknown as Record<string, unknown>)?.input;
                console.info('[ResumePublish] source VC contexts', {
                    sourceUri: inputItem.uri,
                    sourceVcId: inputItem.vc.id,
                    contextUris,
                    vcInput,
                });

                for (const contextUri of contextUris) {
                    try {
                        const resolved = await wallet.context.resolveDocument(contextUri, true);
                        if (!resolved) {
                            console.warn('[ResumePublish] unresolved source VC context', {
                                sourceUri: inputItem.uri,
                                sourceVcId: inputItem.vc.id,
                                contextUri,
                            });
                        }
                    } catch (error) {
                        console.warn('[ResumePublish] error resolving source VC context', {
                            sourceUri: inputItem.uri,
                            sourceVcId: inputItem.vc.id,
                            contextUri,
                            error,
                        });
                    }
                }
            }
            console.info('[ResumePublish] context preflight complete');

            const visibleName = !hiddenPersonalDetails?.name ? personalDetails.name?.trim() : '';
            const visibleEmail = !hiddenPersonalDetails?.email ? personalDetails.email?.trim() : '';
            const visibleCareer = !hiddenPersonalDetails?.career
                ? personalDetails.career?.trim()
                : '';
            const visiblePhone = !hiddenPersonalDetails?.phone ? personalDetails.phone?.trim() : '';
            const visibleLocation = !hiddenPersonalDetails?.location
                ? personalDetails.location?.trim()
                : '';
            const visibleSummary = !hiddenPersonalDetails?.summary
                ? personalDetails.summary?.trim()
                : '';
            const visibleWebsite = !hiddenPersonalDetails?.website
                ? personalDetails.website?.trim()
                : '';
            const visibleLinkedIn = !hiddenPersonalDetails?.linkedIn
                ? personalDetails.linkedIn?.trim()
                : '';

            const fullName = visibleName || currentUser?.name?.trim() || 'Unknown User';
            const email = visibleEmail || currentUser?.email?.trim() || undefined;

            const lerPayload = buildLerPayloadFromResume(lerInputs, {
                did,
                fullName,
                email,
                phone: visiblePhone || undefined,
                location: visibleLocation || undefined,
                career: visibleCareer || undefined,
                summary: visibleSummary || undefined,
                website: visibleWebsite || undefined,
                linkedIn: visibleLinkedIn || undefined,
                pdfUrl,
                pdfHash: input.pdfHash,
                generatedAt,
            });

            const payloadRecord = asRecord(lerPayload);
            console.info('[ResumePublish] built LER payload', {
                hasWorkHistory: Array.isArray(payloadRecord?.workHistory),
                hasEducationHistory: Array.isArray(payloadRecord?.educationHistory),
                hasCertifications: Array.isArray(payloadRecord?.certifications),
                hasSkills: Array.isArray(payloadRecord?.skills),
                hasNarratives: Array.isArray(payloadRecord?.narratives),
                hasAttachments: Array.isArray(payloadRecord?.attachments),
            });

            console.info('[ResumePublish] issuing LER VC');
            const lerVc = await createLerRecordInvoker({
                learnCard: wallet,
                ...lerPayload,
            });
            console.info('[ResumePublish] issued LER VC', { vcId: lerVc?.id });

            console.info('[ResumePublish] storing LER VC in LearnCloud');
            const lerUri = await wallet.store.LearnCloud.uploadEncrypted?.(lerVc);
            if (!lerUri) {
                console.error('[ResumePublish] uploadEncrypted returned empty URI');
                throw new Error('Failed to store LER-RS VC in LearnCloud');
            }
            console.info('[ResumePublish] stored LER VC', { lerUri });

            const lerRecordId = lerVc.id || `urn:uuid:${crypto.randomUUID()}`;
            const newIndexId = crypto.randomUUID();
            const existingResumeRecords = await wallet.index.LearnCloud.get({
                category: CredentialCategoryEnum.resume,
            });
            console.info('[ResumePublish] indexing LER VC', {
                newIndexId,
                existingResumeRecordCount: existingResumeRecords.length,
            });

            await wallet.index.LearnCloud.add({
                id: newIndexId,
                uri: lerUri,
                category: CredentialCategoryEnum.resume,
                credentialId: lerVc.id,
                lerRecordId,
                pdfUrl,
                pdfHash: input.pdfHash,
                isCurrent: true,
                generatedAt,
            });

            await Promise.all(
                existingResumeRecords.map(record =>
                    wallet.index.LearnCloud.update(record.id, {
                        isCurrent: false,
                        supersededBy: lerRecordId,
                        supersededAt: generatedAt,
                    })
                )
            );

            console.info('[ResumePublish] complete', {
                lerUri,
                lerRecordId,
            });
            return { lerVc, lerUri, pdfUrl };
        } catch (error) {
            console.error('[ResumePublish] failed', {
                error,
                fileName: input.fileName,
                includedCredentialCount: input.includedCredentials.length,
            });
            throw error;
        }
    };

    return { publishTcpResume };
};

export default useIssueTcpResume;
