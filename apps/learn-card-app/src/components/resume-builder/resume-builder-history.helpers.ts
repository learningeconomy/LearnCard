import { v4 as uuidv4 } from 'uuid';
import { VC } from '@learncard/types';
import { CredentialCategoryEnum } from 'learn-card-base';
import {
    getDefaultCategoryForCredential,
    getCredentialSubjectAchievementData,
} from 'learn-card-base/helpers/credentialHelpers';
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
import {
    asRecord,
    asString,
    firstStringFromPaths,
    type ResumeUnknownRecord as UnknownRecord,
} from './resume-builder-parsing.helpers';

const defaultSectionOrder = RESUME_SECTIONS.map(section => section.key) as ResumeSectionKey[];

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

const normalizeComparableText = (value?: string): string =>
    (value ?? '')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();

const getSourceCredentialDescription = (vc: VC | null): string | undefined => {
    if (!vc) return undefined;
    const achievementData = getCredentialSubjectAchievementData(vc);
    return asString(achievementData?.description);
};

const buildResumeRowFields = (
    value?: string,
    sourceCredentialDescription?: string
): ResumeFieldEntry[] => {
    const lines = (value ?? '')
        .split('\n')
        .map(line => line.trim())
        .filter(Boolean);
    const fallbackSourceDescription = asString(sourceCredentialDescription);

    if (!lines.length) {
        if (!fallbackSourceDescription) return [];
        return [
            {
                id: uuidv4(),
                value: fallbackSourceDescription,
                source: 'vc',
                type: 'description',
                index: 0,
                hidden: false,
            },
        ];
    }

    const description = lines[0];
    const metadataValues = lines
        .slice(1)
        .flatMap(line => line.split('|'))
        .map(item => item.replace(/^[-*•]\s*/, '').trim())
        .filter(Boolean);

    const descriptionSource =
        fallbackSourceDescription &&
        normalizeComparableText(description) === normalizeComparableText(fallbackSourceDescription)
            ? 'vc'
            : 'selfAttested';

    const fields: ResumeFieldEntry[] = [
        {
            id: uuidv4(),
            value: description,
            source: descriptionSource,
            type: 'description',
            index: 0,
            hidden: false,
        },
    ];

    metadataValues.forEach((metadata, index) => {
        fields.push({
            id: uuidv4(),
            value: metadata,
            source: 'selfAttested',
            type: 'metadata',
            index: index + 1,
            hidden: false,
        });
    });

    return fields;
};

const getFirstVerificationCredential = (item: unknown): VC | null => {
    const itemRecord = asRecord(item);
    const verifications = itemRecord?.verifications;
    if (Array.isArray(verifications)) {
        for (const verification of verifications) {
            const verificationRecord = asRecord(verification);
            if (verificationRecord) return verificationRecord as VC;
        }
    }

    const verifiableCredential = itemRecord?.verifiableCredential;
    const verifiableCredentialRecord = asRecord(verifiableCredential);
    if (verifiableCredentialRecord) return verifiableCredentialRecord as VC;

    return null;
};

const firstVerificationUri = (item: unknown): string | undefined => {
    const itemRecord = asRecord(item);
    const verifications = itemRecord?.verifications;
    if (Array.isArray(verifications)) {
        for (const verification of verifications) {
            const embeddedId = asString(asRecord(verification)?.id);
            if (embeddedId) return embeddedId;
        }
    }

    const verifiableCredential = itemRecord?.verifiableCredential;
    if (typeof verifiableCredential === 'string') {
        return asString(verifiableCredential);
    }

    const verifiableCredentialRecord = asRecord(verifiableCredential);
    const embeddedId = asString(verifiableCredentialRecord?.id);
    if (embeddedId) return embeddedId;

    return undefined;
};

export const getEmbeddedVerificationCredentialsByIdFromLerVc = (
    vc: VC
): Record<string, VC> => {
    const credentialSubject = asRecord(vc.credentialSubject);
    const items = [
        ...(Array.isArray(credentialSubject?.employmentHistories)
            ? credentialSubject.employmentHistories
            : []),
        ...(Array.isArray(credentialSubject?.workHistory) ? credentialSubject.workHistory : []),
        ...(Array.isArray(credentialSubject?.educationAndLearnings)
            ? credentialSubject.educationAndLearnings
            : []),
        ...(Array.isArray(credentialSubject?.educationHistory)
            ? credentialSubject.educationHistory
            : []),
        ...(Array.isArray(credentialSubject?.certifications)
            ? credentialSubject.certifications
            : []),
    ];

    return Object.fromEntries(
        items
            .map(item => {
                const verificationCredential = getFirstVerificationCredential(item);
                const id = verificationCredential?.id;
                return id ? [id, verificationCredential] : undefined;
            })
            .filter((entry): entry is [string, VC] => Boolean(entry))
    );
};

const pushEntry = (
    entriesBySection: Partial<Record<ResumeSectionKey, CredentialEntry[]>>,
    section: ResumeSectionKey,
    uri: string,
    narrative?: string,
    sourceCredentialDescription?: string
) => {
    const currentEntries = entriesBySection[section] ?? [];
    if (currentEntries.some(entry => entry.uri === uri)) return;

    currentEntries.push({
        uri,
        index: currentEntries.length,
        fields: buildResumeRowFields(narrative, sourceCredentialDescription),
    });
    entriesBySection[section] = currentEntries;
};

export const buildResumeBuilderSnapshotFromLerVc = async (
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
        const embeddedVerification = getFirstVerificationCredential(item);
        const sourceVc = embeddedVerification ?? (await readCredential(uri));
        const sourceCredentialDescription = getSourceCredentialDescription(sourceVc);

        const positionHistory = Array.isArray(asRecord(item)?.positionHistories)
            ? asRecord(item)?.positionHistories?.[0]
            : undefined;
        const description = asString(asRecord(item)?.narrative);

        pushEntry(
            credentialEntries,
            CredentialCategoryEnum.workHistory,
            uri,
            description,
            sourceCredentialDescription
        );

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
        const embeddedVerification = getFirstVerificationCredential(item);
        const sourceVc = embeddedVerification ?? (await readCredential(uri));
        const sourceCredentialDescription = getSourceCredentialDescription(sourceVc);

        const description = asString(asRecord(item)?.narrative);

        pushEntry(
            credentialEntries,
            CredentialCategoryEnum.learningHistory,
            uri,
            description,
            sourceCredentialDescription
        );

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

        const embeddedVerification = getFirstVerificationCredential(item);
        const sourceVc = embeddedVerification ?? (await readCredential(uri));
        const category =
            (sourceVc ? getDefaultCategoryForCredential(sourceVc) : undefined) ||
            CredentialCategoryEnum.socialBadge;
        const sourceCredentialDescription = getSourceCredentialDescription(sourceVc);

        const description = asString(asRecord(item)?.narrative);
        pushEntry(
            credentialEntries,
            category as ResumeSectionKey,
            uri,
            description,
            sourceCredentialDescription
        );

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
    const embeddedCredentialsById = resume.vc
        ? getEmbeddedVerificationCredentialsByIdFromLerVc(resume.vc)
        : {};

    const snapshot = storedSnapshot
        ? normalizeSnapshot(storedSnapshot as Partial<ResumeBuilderSnapshot>)
        : resume.vc
        ? await buildResumeBuilderSnapshotFromLerVc(resume.vc, fileName, async uri => {
              if (uri in embeddedCredentialsById) return embeddedCredentialsById[uri] ?? null;
              return readCredential(uri);
          })
        : normalizeSnapshot({
              documentSetup: { showQRCode: true, fileName },
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
        asString(record.fileName) || summarySnapshot?.documentSetup?.fileName || 'resume.pdf';
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
            resume.vc?.validFrom ||
            resume.vc?.issuanceDate ||
            null,
        status: resume.vc ? 'Published' : 'Draft',
    };
};
