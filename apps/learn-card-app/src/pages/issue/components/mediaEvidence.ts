import { staticField } from '../../appStoreDeveloper/partner-onboarding/components/CredentialBuilder/types';
import type { EvidenceTemplate } from '../../appStoreDeveloper/partner-onboarding/components/CredentialBuilder/types';
import type { SimpleMediaAttachment } from './MediaAttachments';

export const mediaToEvidenceTemplates = (
    attachments: SimpleMediaAttachment[]
): EvidenceTemplate[] =>
    attachments
        .filter(a => a.url)
        .map(a => ({
            id: a.id,
            evidenceUrl: staticField(a.url),
            type: staticField('Evidence'),
            name: staticField(a.title || a.fileName || a.url),
            genre: staticField(a.type),
        }));

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
