import { staticField } from '../../appStoreDeveloper/partner-onboarding/components/CredentialBuilder/types';
import type {
    EvidenceTemplate,
    OBv3CredentialTemplate,
} from '../../appStoreDeveloper/partner-onboarding/components/CredentialBuilder/types';
import type { SimpleMediaAttachment, SimpleMediaType } from './MediaAttachments';

/** Only static entries can be edited by the shared attachment controls. */
const isSharedMedia = (entry: EvidenceTemplate): boolean =>
    Boolean(entry.evidenceUrl?.value) &&
    !entry.evidenceUrl?.isDynamic &&
    !entry.name?.isDynamic &&
    !entry.genre?.isDynamic &&
    !entry.type?.isDynamic;

export const evidenceToMediaAttachments = (entries: EvidenceTemplate[]): SimpleMediaAttachment[] =>
    entries.filter(isSharedMedia).map(entry => ({
        id: entry.id,
        type: (entry.genre?.value as SimpleMediaType) || 'link',
        url: entry.evidenceUrl!.value,
        title: entry.name?.value ?? '',
    }));

/** Read-only review summary, including standard evidence in custom JSON credentials. */
export const getSharedEvidenceForReview = (
    template?: OBv3CredentialTemplate | null
): SimpleMediaAttachment[] => {
    if (!template) return [];
    if (template.schemaType !== 'custom' || !template.rawJson) {
        return evidenceToMediaAttachments(template.credentialSubject.evidence ?? []);
    }
    const raw = template.rawJson.evidence;
    return (Array.isArray(raw) ? raw : raw ? [raw] : []).flatMap((entry, index) => {
        const item =
            entry && typeof entry === 'object' ? (entry as Record<string, unknown>) : undefined;
        const url = typeof entry === 'string' ? entry : (item?.id ?? item?.url);
        if (typeof url !== 'string' || !url || url.includes('{{')) return [];
        const genre = item?.genre;
        const type: SimpleMediaType =
            genre === 'photo' || genre === 'document' || genre === 'video' ? genre : 'link';
        return [
            {
                id: `shared-${index}`,
                type,
                url,
                title: typeof item?.name === 'string' ? item.name : url,
            },
        ];
    });
};

export const mediaToEvidenceTemplates = (
    attachments: SimpleMediaAttachment[],
    existing: EvidenceTemplate[] = []
): EvidenceTemplate[] => [
    ...existing.filter(entry => !isSharedMedia(entry)),
    ...attachments
        .filter(a => a.url)
        .map(a => ({
            id: a.id,
            evidenceUrl: staticField(a.url),
            type: staticField('Evidence'),
            name: staticField(a.title || a.fileName || a.url),
            genre: staticField(a.type),
        })),
];

/**
 * Plain OBv3 evidence entries for `templateData.evidence`, which the network
 * applies per-recipient at send time. File links use standard Evidence terms.
 */
export const attachmentsToEvidence = (
    attachments: SimpleMediaAttachment[]
): Record<string, unknown>[] =>
    attachments
        .filter(a => a.url)
        .map(a => ({
            id: a.url,
            type: ['Evidence'],
            name: a.title || a.fileName || a.url,
            genre: a.type,
        }));
