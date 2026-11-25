import type { EvidenceDisplayModel } from './display.types';

/** Extracts an explicit data URI media type, or infers one from a URL's pathname. */
export const getEvidenceMimeType = (id?: string): string | undefined => {
    if (!id) return undefined;
    if (id.startsWith('data:')) {
        const comma = id.indexOf(',');
        if (comma < 0) return undefined;
        return id.slice(5, comma).split(';')[0] || 'text/plain';
    }
    const extension = id
        .split(/[?#]/)[0]
        ?.match(/\.(pdf|png|jpg|jpeg|gif|webp|svg)$/i)?.[1]
        ?.toLowerCase();
    if (extension === 'pdf') return 'application/pdf';
    if (extension === 'jpg' || extension === 'jpeg') return 'image/jpeg';
    if (extension === 'svg') return 'image/svg+xml';
    return extension ? `image/${extension}` : undefined;
};

/** Makes an attachment filename without duplicating an existing extension. */
export const toSafeFileName = (name?: string, mimeType?: string): string => {
    const base = (name?.trim() || 'evidence').replace(/[^\w.-]/g, '_');
    if (/\.\w{2,5}$/.test(base)) return base;
    const extension =
        mimeType === 'application/pdf'
            ? 'pdf'
            : mimeType === 'image/svg+xml'
              ? 'svg'
              : mimeType?.startsWith('image/')
                ? mimeType.split('/')[1]
                : undefined;
    return `${base}${extension ? `.${extension}` : ''}`;
};

/** Retains only evidence with a link or inline attachment. */
export const getDownloadableEvidence = (evidence: EvidenceDisplayModel[]): EvidenceDisplayModel[] =>
    evidence.filter(item => Boolean(item.id?.value));

/** Loads platform attachment support only when the user opens evidence. */
export const openAttachmentUrl = async (
    url: string | undefined,
    fileName?: string
): Promise<boolean> => {
    const { openAttachmentUrl: open } = await import('../../openAttachmentUrl');
    return open(url, fileName);
};

/** Opens the evidence source through the existing shared platform attachment implementation. */
export const downloadEvidence = (item: EvidenceDisplayModel): Promise<boolean> =>
    openAttachmentUrl(item.id?.value, toSafeFileName(item.name?.value, item.mimeType));
