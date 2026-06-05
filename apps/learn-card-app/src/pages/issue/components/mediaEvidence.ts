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
