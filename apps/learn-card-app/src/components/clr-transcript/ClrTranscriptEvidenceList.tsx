import React from 'react';

import MediaAttachmentsBox from '../../pages/ids/view-id/IdDetails/MediaAttachmentBoxCerts';
import { formatClrDate } from '../../helpers/clrRenderer.helpers';

import type { EvidenceDisplayModel } from '../../helpers/clrRenderer.helpers';

export type ClrEvidenceSourceSummary = {
    kind: 'transcript' | 'course' | 'program';
    title: string;
    humanCode?: string;
    dateLabel?: string;
};

type EvidenceKind = 'document' | 'photo' | 'video' | 'link';

const getEvidenceUrl = (item: EvidenceDisplayModel): string => item.id?.value ?? '';

const getEvidenceTypeText = (item: EvidenceDisplayModel): string => {
    const rawType = item.type?.value;

    return Array.isArray(rawType) ? rawType.join(' ').toLowerCase() : rawType?.toLowerCase() ?? '';
};

const inferEvidenceKind = (item: EvidenceDisplayModel): EvidenceKind => {
    const url = getEvidenceUrl(item);
    const mime = item.mimeType?.toLowerCase();
    const genre = item.genre?.value?.toLowerCase() ?? '';
    const type = getEvidenceTypeText(item);

    if (
        mime?.startsWith('image/') ||
        /\.(png|jpe?g|gif|webp|svg)(?:\?|$)/i.test(url) ||
        genre.includes('image') ||
        type.includes('image')
    ) {
        return 'photo';
    }

    if (
        mime?.startsWith('video/') ||
        /\.(mp4|webm|mov|m4v)(?:\?|$)/i.test(url) ||
        /youtube\.com|youtu\.be|vimeo\.com|loom\.com/i.test(url) ||
        genre.includes('video') ||
        type.includes('video')
    ) {
        return 'video';
    }

    if (
        mime === 'application/pdf' ||
        /\.(pdf|docx?|pptx?|xlsx?|csv|txt|md|zip)(?:\?|$)/i.test(url) ||
        genre.includes('document') ||
        genre.includes('pdf') ||
        type.includes('document')
    ) {
        return 'document';
    }

    return 'link';
};

const toEvidenceAttachment = (item: EvidenceDisplayModel) => ({
    id: getEvidenceUrl(item),
    type: ['EvidenceFile'] as Array<'Evidence' | 'EvidenceFile'>,
    name: item.name?.value ?? '',
    description: item.description?.value ?? '',
    narrative: item.narrative?.value ?? '',
    genre: inferEvidenceKind(item),
    url: getEvidenceUrl(item),
});

const toEvidenceAttachmentWithSource = (
    item: EvidenceDisplayModel,
    sourceSummaries?: Record<string, ClrEvidenceSourceSummary>
) => ({
    ...toEvidenceAttachment(item),
    sourceContext: sourceSummaries?.[item.sourceCredentialId],
});

export const createTranscriptEvidenceSourceSummaries = ({
    transcriptCredentialId,
    transcriptTitle,
    transcriptIssuedAt,
    courses,
    programs,
}: {
    transcriptCredentialId: string;
    transcriptTitle?: string;
    transcriptIssuedAt?: string;
    courses: Array<{
        sourceCredentialId: string;
        name?: { value?: string };
        humanCode?: { value?: string };
        earnedAt?: { value?: string };
    }>;
    programs: Array<{
        sourceCredentialId: string;
        name?: { value?: string };
        earnedAt?: { value?: string };
    }>;
}): Record<string, ClrEvidenceSourceSummary> => {
    const summaries: Record<string, ClrEvidenceSourceSummary> = {
        [transcriptCredentialId]: {
            kind: 'transcript',
            title: transcriptTitle || 'Transcript',
            dateLabel: transcriptIssuedAt
                ? `Issued ${formatClrDate(transcriptIssuedAt)}`
                : undefined,
        },
    };

    courses.forEach(course => {
        summaries[course.sourceCredentialId] = {
            kind: 'course',
            title: course.name?.value ?? 'Course',
            humanCode: course.humanCode?.value,
            dateLabel: course.earnedAt?.value
                ? `Added ${formatClrDate(course.earnedAt.value)}`
                : undefined,
        };
    });

    programs.forEach(program => {
        summaries[program.sourceCredentialId] = {
            kind: 'program',
            title: program.name?.value ?? 'Program',
            dateLabel: program.earnedAt?.value
                ? `Added ${formatClrDate(program.earnedAt.value)}`
                : undefined,
        };
    });

    return summaries;
};

const ClrTranscriptEvidenceList: React.FC<{
    evidence: EvidenceDisplayModel[];
    compact?: boolean;
    sourceSummaries?: Record<string, ClrEvidenceSourceSummary>;
}> = ({ evidence, compact = false, sourceSummaries }) => {
    if (evidence.length === 0) return null;

    if (compact) {
        return (
            <p className="text-xs text-grayscale-600">
                Original artifact available ({evidence.length})
            </p>
        );
    }

    return (
        <MediaAttachmentsBox
            evidence={evidence.map(item => toEvidenceAttachmentWithSource(item, sourceSummaries))}
        />
    );
};

export default ClrTranscriptEvidenceList;
