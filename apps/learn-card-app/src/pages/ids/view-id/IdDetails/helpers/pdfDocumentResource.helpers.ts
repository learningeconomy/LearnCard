import base64url from 'base64url';
import { PDFDocument } from 'pdf-lib';
import { isPdfAttachmentSource } from 'learn-card-base/helpers/credentialHelpers';

export type ResolvedDocumentResource = {
    previewUrl: string;
    downloadUrl: string;
    downloadName?: string;
    isPdfDataSource: boolean;
};

export type PdfDocumentMetadata = {
    fileExtension?: string;
    sizeInBytes?: number;
    numberOfPages?: number;
    type?: string;
};

const PDF_DATA_URL_PATTERN = /^data:application\/pdf(?:;[^,]+)?,/i;

const getPdfDownloadName = (title?: string) => {
    const trimmedTitle = title?.trim();

    if (!trimmedTitle) return 'attachment.pdf';

    return /\.pdf$/i.test(trimmedTitle) ? trimmedTitle : `${trimmedTitle}.pdf`;
};

const decodeBase64ToBytes = (encodedValue: string): Uint8Array => {
    const binaryString = atob(encodedValue);
    return Uint8Array.from(binaryString, char => char.charCodeAt(0));
};

const getPdfBytesFromSource = (pdfSource: string): Uint8Array | null => {
    if (!isPdfAttachmentSource(pdfSource)) return null;

    const trimmedSource = pdfSource.trim();
    const encodedPayload = trimmedSource.replace(PDF_DATA_URL_PATTERN, '').replace(/\s+/g, '');

    if (!encodedPayload) return null;

    const decodeCandidates = Array.from(
        new Set([
            encodedPayload,
            encodedPayload.replace(/-/g, '+').replace(/_/g, '/'),
            base64url.toBase64(encodedPayload),
        ])
    );

    for (const candidate of decodeCandidates) {
        try {
            return decodeBase64ToBytes(candidate);
        } catch {
            continue;
        }
    }

    return null;
};

/**
 * Resolves a PDF data source into a previewable/downloadable resource.
 *
 * **Memory Management:** The returned `previewUrl` and `downloadUrl` are blob object URLs
 * (`URL.createObjectURL`). The caller is responsible for calling `URL.revokeObjectURL()`
 * on these URLs when they are no longer needed to prevent memory leaks.
 *
 * @example
 * const resolved = await resolvePdfDocumentResource(pdfDataUrl, 'My Document');
 * if (resolved) {
 *   // Use resolved.resource.previewUrl...
 *   // Later: URL.revokeObjectURL(resolved.resource.previewUrl);
 * }
 */
export const resolvePdfDocumentResource = async (
    pdfSource: string,
    title?: string
): Promise<{ metadata: PdfDocumentMetadata; resource: ResolvedDocumentResource } | null> => {
    const pdfBytes = getPdfBytesFromSource(pdfSource);

    if (!pdfBytes) return null;

    let numberOfPages: number | undefined;

    try {
        const pdfDocument = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
        numberOfPages = pdfDocument.getPageCount();
    } catch {
        // If pdf-lib cannot parse the document, still fall back to the browser preview blob.
    }

    const pdfBlob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
    const objectUrl = URL.createObjectURL(pdfBlob);

    return {
        metadata: {
            fileExtension: 'pdf',
            sizeInBytes: pdfBytes.byteLength,
            numberOfPages,
            type: 'application/pdf',
        },
        resource: {
            previewUrl: objectUrl,
            downloadUrl: objectUrl,
            downloadName: getPdfDownloadName(title),
            isPdfDataSource: true,
        },
    };
};
