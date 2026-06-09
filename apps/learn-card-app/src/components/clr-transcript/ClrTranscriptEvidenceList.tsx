import React from 'react';

import MediaAttachmentsBox from '../../pages/ids/view-id/IdDetails/MediaAttachmentBoxCerts';

import type { EvidenceDisplayModel } from '../../helpers/clrRenderer.helpers';

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

const ClrTranscriptEvidenceList: React.FC<{
    evidence: EvidenceDisplayModel[];
    compact?: boolean;
}> = ({ evidence, compact = false }) => {
    if (evidence.length === 0) return null;

    if (compact) {
        return (
            <p className="text-xs text-grayscale-600">
                Original artifact available ({evidence.length})
            </p>
        );
    }

    return <MediaAttachmentsBox evidence={evidence.map(toEvidenceAttachment)} />;
};

export default ClrTranscriptEvidenceList;
