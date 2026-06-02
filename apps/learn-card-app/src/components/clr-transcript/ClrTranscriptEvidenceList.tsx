import MediaAttachmentsBox from '../../pages/ids/view-id/IdDetails/MediaAttachmentBoxCerts';

import type { EvidenceDisplayModel } from '../../helpers/clrRenderer.helpers';

type Props = {
    evidence: EvidenceDisplayModel[];
    compact?: boolean;
};

const inferEvidenceGenre = (item: EvidenceDisplayModel): string => {
    const url = item.id?.value ?? '';
    const mime = item.mimeType;

    if (mime?.startsWith('image/') || /\.(png|jpe?g|gif|webp)$/i.test(url)) return 'photo';
    if (mime?.startsWith('video/') || /\.(mp4|webm|mov|m4v)$/i.test(url)) return 'video';
    if (mime === 'application/pdf' || /\.pdf(?:\?|$)/i.test(url)) return 'document';

    return item.genre?.value?.toLowerCase() ?? 'text';
};

const toEvidenceAttachment = (item: EvidenceDisplayModel) => ({
    id: item.id?.value ?? '',
    type: [inferEvidenceGenre(item) === 'text' ? 'Evidence' : 'EvidenceFile'] as Array<
        'Evidence' | 'EvidenceFile'
    >,
    name: item.name?.value ?? '',
    description: item.description?.value ?? '',
    narrative: item.narrative?.value ?? '',
    genre: inferEvidenceGenre(item),
    url: item.id?.value ?? '',
});

const ClrTranscriptEvidenceList = ({ evidence, compact = false }: Props) => {
    if (evidence.length === 0) return null;

    if (compact) {
        return (
            <p className="text-xs text-grayscale-600">
                Original artifact available ({evidence.length})
            </p>
        );
    }

    return <MediaAttachmentsBox title="Evidence" evidence={evidence.map(toEvidenceAttachment)} />;
};

export default ClrTranscriptEvidenceList;
