import { v4 as uuidv4 } from 'uuid';
import { VC } from '@learncard/types';
import { CredentialCategoryEnum } from 'learn-card-base';
import { getDefaultCategoryForCredential } from 'learn-card-base/helpers/credentialHelpers';
import type { ExistingResume } from '../../hooks/useExistingResumes';
import {
    ResumeBuilderActiveResume,
    ResumeBuilderSnapshot,
    resumeBuilderStore,
} from '../../stores/resumeBuilderStore';
import {
    CredentialEntry,
    PersonalDetails,
    RESUME_SECTIONS,
    ResumeFieldEntry,
    ResumeSectionKey,
} from './resume-builder.helpers';

type UnknownRecord = Record<string, unknown>;

const defaultSectionOrder = RESUME_SECTIONS.map(section => section.key) as ResumeSectionKey[];

const asRecord = (value: unknown): UnknownRecord | undefined =>
    value && typeof value === 'object' && !Array.isArray(value)
        ? (value as UnknownRecord)
        : undefined;

const asString = (value: unknown): string | undefined => {
    if (typeof value !== 'string') return undefined;
    const trimmed = value.trim();
    return trimmed || undefined;
};

const getNestedValue = (value: unknown, path: string[]): unknown => {
    let current = value;
    for (const key of path) {
        if (Array.isArray(current)) {
            const index = Number(key);
            if (Number.isNaN(index)) return undefined;
            current = current[index];
            continue;
        }

        const record = asRecord(current);
        if (!record) return undefined;
        current = record[key];
    }

    return current;
};

const firstStringFromPaths = (value: unknown, paths: string[][]): string | undefined => {
    for (const path of paths) {
        const parsed = asString(getNestedValue(value, path));
        if (parsed) return parsed;
    }

    return undefined;
};

const cloneFields = (fields: ResumeFieldEntry[] = []): ResumeFieldEntry[] =>
    fields.map(field => ({ ...field }));

const cloneEntries = (entries: CredentialEntry[] = []): CredentialEntry[] =>
    entries.map(entry => ({
        ...entry,
        fields: cloneFields(entry.fields),
    }));

const normalizeSnapshot = (snapshot: Partial<ResumeBuilderSnapshot>): ResumeBuilderSnapshot => ({
    personalDetails: {
        name: '',
        career: '',
        email: '',
        phone: '',
        location: '',
        summary: '',
        website: '',
        linkedIn: '',
        thumbnail: '',
        ...(snapshot.personalDetails ?? {}),
    },
    hiddenPersonalDetails: { ...(snapshot.hiddenPersonalDetails ?? {}) },
    hiddenSections: { ...(snapshot.hiddenSections ?? {}) },
    currentJobCredentialUri: snapshot.currentJobCredentialUri ?? null,
    credentialStartDates: { ...(snapshot.credentialStartDates ?? {}) },
    credentialEndDates: { ...(snapshot.credentialEndDates ?? {}) },
    documentSetup: {
        showQRCode: true,
        fileName: 'resume.pdf',
        ...(snapshot.documentSetup ?? {}),
    },
    credentialEntries: Object.fromEntries(
        Object.entries(snapshot.credentialEntries ?? {}).map(([section, entries]) => [
            section,
            cloneEntries(entries ?? []),
        ])
    ) as Partial<Record<ResumeSectionKey, CredentialEntry[]>>,
    sectionOrder: snapshot.sectionOrder?.length ? snapshot.sectionOrder : defaultSectionOrder,
});

const buildDescriptionFields = (value?: string): ResumeFieldEntry[] => {
    if (!value?.trim()) return [];

    return [
        {
            id: uuidv4(),
            value: value.trim(),
            source: 'selfAttested',
            type: 'description',
            index: 0,
            hidden: false,
        },
    ];
};

const firstVerificationUri = (item: unknown): string | undefined => {
    const itemRecord = asRecord(item);
    const verifications = itemRecord?.verifications;
    if (Array.isArray(verifications)) {
        for (const verification of verifications) {
            const uri = asString(asRecord(verification)?.sourceCredentialUri);
            if (uri) return uri;
        }
    }

    const verifiableCredential = itemRecord?.verifiableCredential;
    if (typeof verifiableCredential === 'string') {
        return asString(verifiableCredential);
    }

    const verifiableCredentialRecord = asRecord(verifiableCredential);
    const sourceCredentialUri = asString(verifiableCredentialRecord?.sourceCredentialUri);
    if (sourceCredentialUri) return sourceCredentialUri;

    return undefined;
};

const pushEntry = (
    entriesBySection: Partial<Record<ResumeSectionKey, CredentialEntry[]>>,
    section: ResumeSectionKey,
    uri: string,
    description?: string
) => {
    const currentEntries = entriesBySection[section] ?? [];
    if (currentEntries.some(entry => entry.uri === uri)) return;

    currentEntries.push({
        uri,
        index: currentEntries.length,
        fields: buildDescriptionFields(description),
    });
    entriesBySection[section] = currentEntries;
};

const buildSnapshotFromLerVc = async (
    vc: VC,
    fileName: string,
    readCredential: (uri: string) => Promise<VC | null>
): Promise<ResumeBuilderSnapshot> => {
    const credentialSubject = asRecord(vc.credentialSubject);
    const person = asRecord(credentialSubject?.person);
    const communication = asRecord(credentialSubject?.communication);
    const narratives = Array.isArray(credentialSubject?.narratives)
        ? credentialSubject.narratives
        : [];

    const personalDetails: PersonalDetails = {
        name:
            firstStringFromPaths(person, [['name', 'formattedName']]) ||
            firstStringFromPaths(person, [['formattedName']]) ||
            [
                firstStringFromPaths(person, [['name', 'given']]),
                firstStringFromPaths(person, [['givenName']]),
                firstStringFromPaths(person, [['name', 'family']]),
                firstStringFromPaths(person, [['familyName']]),
            ]
                .filter(Boolean)
                .join(' ') ||
            '',
        career:
            firstStringFromPaths(
                narratives.find(
                    narrative => asString(asRecord(narrative)?.name) === 'Professional Title'
                ),
                [['texts', '0', 'lines', '0']]
            ) || '',
        email:
            firstStringFromPaths(communication, [['email', '0', 'address']]) ||
            firstStringFromPaths(person, [['email']]) ||
            '',
        phone:
            firstStringFromPaths(communication, [['phone', '0', 'formattedNumber']]) ||
            firstStringFromPaths(person, [['phone']]) ||
            '',
        location:
            firstStringFromPaths(communication, [['address', '0', 'formattedAddress']]) ||
            firstStringFromPaths(person, [['address', 'formattedAddress']]) ||
            '',
        summary:
            firstStringFromPaths(
                narratives.find(
                    narrative => asString(asRecord(narrative)?.name) === 'Professional Summary'
                ),
                [['texts', '0', 'lines', '0']]
            ) || '',
        website:
            firstStringFromPaths(communication, [['web', '0', 'url']]) ||
            firstStringFromPaths(person, [['web', '0', 'url']]) ||
            '',
        linkedIn:
            firstStringFromPaths(
                Array.isArray(communication?.social)
                    ? communication.social.find(
                          entry => asString(asRecord(entry)?.name) === 'LinkedIn'
                      )
                    : undefined,
                [['uri']]
            ) ||
            firstStringFromPaths(
                Array.isArray(person?.social)
                    ? person.social.find(entry => asString(asRecord(entry)?.name) === 'LinkedIn')
                    : undefined,
                [['uri']]
            ) || '',
        thumbnail: '',
    };

    const credentialEntries: Partial<Record<ResumeSectionKey, CredentialEntry[]>> = {};
    const credentialStartDates: Record<string, string> = {};
    const credentialEndDates: Record<string, string> = {};
    let currentJobCredentialUri: string | null = null;

    const employmentHistories = Array.isArray(credentialSubject?.employmentHistories)
        ? credentialSubject.employmentHistories
        : Array.isArray(credentialSubject?.workHistory)
        ? credentialSubject.workHistory
        : [];
    for (const item of employmentHistories) {
        const uri = firstVerificationUri(item);
        if (!uri) continue;

        const positionHistory = Array.isArray(asRecord(item)?.positionHistories)
            ? asRecord(item)?.positionHistories?.[0]
            : undefined;
        const description = asString(asRecord(item)?.narrative);

        pushEntry(credentialEntries, CredentialCategoryEnum.workHistory, uri, description);

        const start = firstStringFromPaths(positionHistory, [['start']]);
        const end = firstStringFromPaths(positionHistory, [['end']]);
        if (start) credentialStartDates[uri] = start;
        if (end) credentialEndDates[uri] = end;
        if (asRecord(item)?.current === true || asRecord(positionHistory)?.current === true) {
            currentJobCredentialUri = uri;
        }
    }

    const educationAndLearnings = Array.isArray(credentialSubject?.educationAndLearnings)
        ? credentialSubject.educationAndLearnings
        : Array.isArray(credentialSubject?.educationHistory)
        ? credentialSubject.educationHistory
        : [];
    for (const item of educationAndLearnings) {
        const uri = firstVerificationUri(item);
        if (!uri) continue;

        const description = asString(asRecord(item)?.narrative);

        pushEntry(credentialEntries, CredentialCategoryEnum.learningHistory, uri, description);

        const start = firstStringFromPaths(item, [['start']]);
        const end = firstStringFromPaths(item, [['end']]);
        if (start) credentialStartDates[uri] = start;
        if (end) credentialEndDates[uri] = end;
    }

    const certifications = Array.isArray(credentialSubject?.certifications)
        ? credentialSubject.certifications
        : [];
    for (const item of certifications) {
        const uri = firstVerificationUri(item);
        if (!uri) continue;

        const sourceVc = await readCredential(uri);
        const category =
            (sourceVc ? getDefaultCategoryForCredential(sourceVc) : undefined) ||
            CredentialCategoryEnum.socialBadge;

        const description = asString(asRecord(item)?.narrative);
        pushEntry(credentialEntries, category as ResumeSectionKey, uri, description);

        const validFrom = firstStringFromPaths(item, [['effectiveTimePeriod', 'validFrom']]);
        const validTo = firstStringFromPaths(item, [['effectiveTimePeriod', 'validTo']]);
        if (validFrom) credentialStartDates[uri] = validFrom;
        if (validTo) credentialEndDates[uri] = validTo;
    }

    return normalizeSnapshot({
        personalDetails,
        credentialEntries,
        credentialStartDates,
        credentialEndDates,
        currentJobCredentialUri,
        documentSetup: {
            showQRCode: true,
            fileName,
        },
    });
};

export const getResumeBuilderSnapshot = (): ResumeBuilderSnapshot =>
    normalizeSnapshot({
        personalDetails: resumeBuilderStore.get.personalDetails(),
        hiddenPersonalDetails: resumeBuilderStore.get.hiddenPersonalDetails(),
        hiddenSections: resumeBuilderStore.get.hiddenSections(),
        currentJobCredentialUri: resumeBuilderStore.get.currentJobCredentialUri(),
        credentialStartDates: resumeBuilderStore.get.credentialStartDates(),
        credentialEndDates: resumeBuilderStore.get.credentialEndDates(),
        documentSetup: resumeBuilderStore.get.documentSetup(),
        credentialEntries: resumeBuilderStore.get.credentialEntries(),
        sectionOrder: resumeBuilderStore.get.sectionOrder(),
    });

export const buildResumeHydrationState = async (
    resume: ExistingResume,
    readCredential: (uri: string) => Promise<VC | null>
): Promise<{
    activeResume: ResumeBuilderActiveResume;
    snapshot: ResumeBuilderSnapshot;
}> => {
    const record = asRecord(resume.record) ?? {};
    const storedSnapshot = asRecord(record.resumeBuilderSnapshot);
    const fileName = asString(record.fileName) || 'resume.pdf';

    const snapshot = storedSnapshot
        ? normalizeSnapshot(storedSnapshot as Partial<ResumeBuilderSnapshot>)
        : resume.vc
        ? await buildSnapshotFromLerVc(resume.vc, fileName, readCredential)
        : normalizeSnapshot({
              documentSetup: { fileName },
          });

    return {
        activeResume: {
            recordId: resume.record.id,
            uri: resume.record.uri ?? null,
            lerRecordId: resume.lerRecordId,
            generatedAt:
                (typeof resume.record.generatedAt === 'string' && resume.record.generatedAt) || null,
            fileName,
        },
        snapshot,
    };
};

export const getResumeDisplaySummary = (resume: ExistingResume): {
    title: string;
    subtitle: string;
    credentialCount: number;
    generatedAt: string | null;
    status: 'Published' | 'Draft';
} => {
    const record = asRecord(resume.record) ?? {};
    const storedSnapshot = asRecord(record.resumeBuilderSnapshot);
    const summarySnapshot = storedSnapshot
        ? normalizeSnapshot(storedSnapshot as Partial<ResumeBuilderSnapshot>)
        : null;
    const credentialSubject = asRecord(resume.vc?.credentialSubject);
    const personName =
        firstStringFromPaths(credentialSubject, [['person', 'name', 'formattedName']]) ||
        firstStringFromPaths(credentialSubject, [['person', 'formattedName']]) ||
        summarySnapshot?.personalDetails?.name ||
        'Untitled Resume';
    const career =
        summarySnapshot?.personalDetails?.career ||
        firstStringFromPaths(
            Array.isArray(credentialSubject?.narratives)
                ? credentialSubject?.narratives?.find(
                      narrative => asString(asRecord(narrative)?.name) === 'Professional Title'
                  )
                : undefined,
            [['texts', '0', 'lines', '0']]
        ) ||
        '';
    const title = career ? `${personName}, ${career}` : personName;
    const subtitle =
        asString(record.fileName)?.replace(/\.pdf$/i, '') ||
        summarySnapshot?.documentSetup?.fileName?.replace(/\.pdf$/i, '') ||
        'resume';
    const credentialCount = summarySnapshot
        ? Object.values(summarySnapshot.credentialEntries).reduce(
              (count, entries) => count + (entries?.length ?? 0),
              0
          )
        : [
              ...(Array.isArray(credentialSubject?.employmentHistories)
                  ? credentialSubject.employmentHistories
                  : []),
              ...(Array.isArray(credentialSubject?.workHistory)
                  ? credentialSubject.workHistory
                  : []),
              ...(Array.isArray(credentialSubject?.educationAndLearnings)
                  ? credentialSubject.educationAndLearnings
                  : []),
              ...(Array.isArray(credentialSubject?.educationHistory)
                  ? credentialSubject.educationHistory
                  : []),
              ...(Array.isArray(credentialSubject?.certifications)
                  ? credentialSubject.certifications
                  : []),
          ].length;

    return {
        title,
        subtitle,
        credentialCount,
        generatedAt:
            (typeof record.generatedAt === 'string' && record.generatedAt) ||
            resume.vc?.issuanceDate ||
            null,
        status: resume.vc ? 'Published' : 'Draft',
    };
};
