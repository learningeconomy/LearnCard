import React from 'react';
import * as m from '../../paraglide/messages.js';

import MediaAttachmentsBox from '../../pages/ids/view-id/IdDetails/MediaAttachmentBoxCerts';
import { formatClrDate } from 'learn-card-base/helpers/credentials/clr/renderer';

import type { EvidenceDisplayModel } from 'learn-card-base/helpers/credentials/clr/renderer';

export type ClrEvidenceSourceSummary = {
    kind: 'transcript' | 'course' | 'program' | 'assessment';
    title: string;
    humanCode?: string;
    dateLabel?: string;
};

type EvidenceKind = 'document' | 'photo' | 'video' | 'link';

const getEvidenceUrl = (item: EvidenceDisplayModel): string => item.id?.value ?? '';

const getEvidenceTypeText = (item: EvidenceDisplayModel): string => {
    const rawType = item.type?.value;

    return Array.isArray(rawType)
        ? rawType.join(' ').toLowerCase()
        : (rawType?.toLowerCase() ?? '');
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

const toEvidenceAttachment = (item: EvidenceDisplayModel) => {
    const url = getEvidenceUrl(item);
    return {
        id: url,
        type: ['EvidenceFile'] as Array<'Evidence' | 'EvidenceFile'>,
        name: item.name?.value ?? '',
        description: item.description?.value ?? '',
        narrative: item.narrative?.value ?? '',
        genre: inferEvidenceKind(item),
        url,
    };
};

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
                {m['clrRenderer.evidenceCount']({ count: evidence.length })}
            </p>
        );
    }

    return (
        <div className="space-y-3">
            {evidence.some(item => item.id?.value) && (
                <MediaAttachmentsBox
                    evidence={evidence
                        .filter(item => item.id?.value)
                        .map(item => toEvidenceAttachmentWithSource(item, sourceSummaries))}
                />
            )}
            {evidence
                .filter(item => !item.id?.value)
                .map((item, index) => (
                    <section
                        key={`${item.sourceCredentialId}-${index}`}
                        className="space-y-2 rounded-[20px] border border-grayscale-200 bg-white p-4"
                    >
                        <h4 className="break-words text-sm font-medium text-grayscale-900">
                            {item.name?.value ?? m['clrRenderer.evidence']()}
                        </h4>
                        {item.description && (
                            <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-grayscale-600">
                                {item.description.value}
                            </p>
                        )}
                        {item.narrative && (
                            <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-grayscale-600">
                                {item.narrative.value}
                            </p>
                        )}
                    </section>
                ))}
        </div>
    );
};

export default ClrTranscriptEvidenceList;
